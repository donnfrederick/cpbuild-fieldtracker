import axios from 'axios';
import { defineStore } from 'pinia';

import { apiService } from '../services/apiService';
// import LogRocket from 'logrocket';
import { InstallTrackerService } from '@/services/installTracker';
import type { WorkerDetails } from '@/interfaces/installTracker';
import toBase64 from '@/util/toBase64';

import { usePostHog } from '@/stores/usePostHog';
import { featureFlags, featureFlagsReady } from '@/config/featureFlags';
import { localStorageHelper } from '@/util/localStorageHelper';
import { UserServiceProxy } from '@/shared/service-proxies/service-proxies';

interface ClientPrincipal {
  userId: string;
  userRoles: string[];
  claims: any[];
  allowedRoles: string[];
  identityProvider: string;
  userDetails: string;
}

interface UserInfo {
  clientPrincipal: ClientPrincipal;
}

export interface AuthState {
  jwtToken: string;
  userInfo: UserInfo | null;
  tdUserId: number | null;
  isUserInfoLoaded: boolean;
  hasCheckedWorkerInfo: boolean;
  workerDetails: WorkerDetails | null;
  encodedClientPrincipal: string | null;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const ENABLE_JWT = false; // Change to true to enable JWT logic
const CACHE_KEY = 'cachedClientPrincipal';
const CACHE_TTL_HOURS = 24;

const posthog = usePostHog();

// Top of file additions
let isOnlineListenerAttached = false;

function attachOnlineReconnectListener(fetchFn: () => Promise<void>) {
  if (isOnlineListenerAttached) return;

  window.addEventListener('online', async () => {
    console.info('[Offline Mode] Network reconnected. Attempting to re-fetch /.auth/me...');
    try {
      await fetchFn();
      console.info('[Offline Mode] Successfully refreshed user info.');
    } catch (err) {
      console.error('[Offline Mode] Failed to re-fetch /.auth/me after reconnect:', err);
    }
  });

  isOnlineListenerAttached = true;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    jwtToken: '',
    userInfo: null,
    tdUserId: null,
    isUserInfoLoaded: false,
    hasCheckedWorkerInfo: false,
    workerDetails: null,
    encodedClientPrincipal: null,
  }),
  getters: {
    hasAdminRole: (state) => {
      return state.userInfo?.clientPrincipal.allowedRoles.includes('admin'.toLowerCase()) || false;
    },
    hasExecutiveRole: (state) => {
      return (
        state.userInfo?.clientPrincipal.allowedRoles.includes('executive'.toLowerCase()) || false
      );
    },
    hasInstallDirectorRole: (state) => {
      return (
        state.userInfo?.clientPrincipal.allowedRoles.includes('installdirector'.toLowerCase()) ||
        false
      );
    },
    hasPowerUserRole: (state) => {
      return (
        state.userInfo?.clientPrincipal.allowedRoles.includes('poweruser'.toLowerCase()) || false
      );
    },
    hasProjectCoordinatorRole: (state) => {
      return (
        state.userInfo?.clientPrincipal.allowedRoles.includes('projectcoordinator'.toLowerCase()) ||
        false
      );
    },
    hasInstallManagerRole: (state) => {
      return (
        state.userInfo?.clientPrincipal.allowedRoles.includes('installmanager'.toLowerCase()) ||
        false
      );
    },
    hasControlsManagerRole: (state) => {
      return (
        state.userInfo?.clientPrincipal.allowedRoles.includes('controlsmanager'.toLowerCase()) ||
        false
      );
    },
    hasProjectManagerRole: (state) => {
      return (
        state.userInfo?.clientPrincipal.allowedRoles.includes('projectmanager'.toLowerCase()) ||
        false
      );
    },
    hasTeamLeadRole: (state) => {
      return (
        state.userInfo?.clientPrincipal.allowedRoles.includes('teamlead'.toLowerCase()) || false
      );
    },
    hasWorkerRole: (state) => {
      return state.userInfo?.clientPrincipal.allowedRoles.includes('worker'.toLowerCase()) || false;
    },
    hasEstimatorRole: (state) => {
      return (
        state.userInfo?.clientPrincipal.allowedRoles.includes('estimator'.toLowerCase()) || false
      );
    },
    isUserDataReady(): boolean {
      return this.isUserInfoLoaded;
    },
    isIhiWorker(): boolean {
      return this.hasCheckedWorkerInfo;
    },
    getWorkerDetails(): WorkerDetails | null {
      return this.workerDetails;
    },
    getEncodedClientPrincipal(): string | null {
      return this.encodedClientPrincipal;
    },
    allowedRoles: (state): string[] => {
      return state.userInfo?.clientPrincipal?.allowedRoles ?? [];
    },
    getAllowedRolesString(): string {
      return this.allowedRoles.length > 0 ? this.allowedRoles.join(', ') : '';
    },
  },
  actions: {
    async fetchAndStoreJwt() {
      if (ENABLE_JWT) {
        // Feature flag
        try {
          this.jwtToken = await apiService.generateJwt();
        } catch (error) {
          console.error('Failed to fetch JWT', error);
        }
      }
    },
    async fetchAndSetUserInfo() {
      const userIdLocalStorage = localStorageHelper<number | null>('userId');
      console.log('[UserInfo] Fetching user info...');
      if (this.isUserInfoLoaded && this.userInfo?.clientPrincipal?.userId) return;

      // 🔌 Check if offline and try localStorage cache
      if (!navigator.onLine) {
        console.warn('[Offline Mode] Skipping /.auth/me fetch');
        const raw = localStorage.getItem('cachedClientPrincipal');
        if (raw) {
          try {
            const cached = JSON.parse(raw);
            const isExpired =
              Date.now() - new Date(cached.cachedAt).getTime() > 24 * 60 * 60 * 1000; // 1 day
            if (!isExpired) {
              console.info('[Offline Mode] Using cached clientPrincipal from localStorage');
              this.userInfo = { clientPrincipal: cached.clientPrincipal };
              this.encodedClientPrincipal = toBase64(cached.clientPrincipal);
              this.isUserInfoLoaded = true;
              return;
            } else {
              console.warn('[Offline Mode] Cached clientPrincipal expired');
            }
          } catch (e) {
            console.error('Failed to parse cached clientPrincipal', e);
          }
        }

        alert(
          'You are offline and no valid cached login info was found. Please reconnect to authenticate.'
        );
        return;
      }

      try {
        if (posthog) await featureFlagsReady;

        console.log('[UserInfo] Fetching from /.auth/me');
        const { data, status } = await axios.get('/.auth/me');
        console.log('[UserInfo] Got response:', { status, data });

        if (status !== 200 || !data?.clientPrincipal) {
          throw new Error(`Failed to fetch user info. Status: ${status}`);
        }

        if (
          posthog &&
          (featureFlags.environment === 'staging' || featureFlags.environment === 'prod')
        ) {
          posthog.startSessionRecording(true);
          console.log('[PostHog] Session Replay is on');
        } else
          console.log(
            '[PostHog] Session Replay is disabled in: ' + featureFlags.environment + ' environment'
          );

        const claimsRoles = data.clientPrincipal.claims
          .filter((claim: any) => claim.typ === 'roles')
          .flatMap((claim: any) => claim.val?.split(',') || [])
          .filter((val: string) => val)
          .map((val: string) => val.toLowerCase());

        const userRoles = data.clientPrincipal.userRoles.map((role: string) => role.toLowerCase());

        const clientPrincipal = {
          ...data.clientPrincipal,
          userRoles: data.clientPrincipal.userRoles.map((role: string) => role.toLowerCase()),
          allowedRoles: claimsRoles.length > 0 ? claimsRoles : userRoles,
        };

        this.userInfo = { clientPrincipal };
        this.encodedClientPrincipal = toBase64(clientPrincipal);

        // Save to localStorage
        try {
          const cachedData = {
            clientPrincipal,
            cachedAt: new Date().toISOString(),
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
        } catch (e) {
          console.warn('Failed to store user info in localStorage:', e);
        }

        const aadUserId = clientPrincipal.userId;
        const email = clientPrincipal.userDetails;
        const userRolesList = clientPrincipal.userRoles.join(',');
        const userClaimsName = clientPrincipal.claims.find((c: any) => c.typ === 'name')?.val || '';

        try {
          const userServiceProxy = new UserServiceProxy();
          const userData = await userServiceProxy.getUserByAadUserId(aadUserId);
          this.tdUserId = userData?.id ?? null;
        } catch (error) {
          if (!axios.isAxiosError(error) || error.response?.status !== 404) {
            throw new Error('Failed checking user existence: ' + (error as Error).message);
          }
        }

        if (!this.tdUserId) {
          const newUserPayload = {
            fullName: userClaimsName,
            email,
            azureAdId: aadUserId,
            userRoles: userRolesList,
            targetUrl: `${apiBaseUrl}/users/create`,
            targetMethodType: 'POST',
          };

          const { data: newUser } = await axios.post(`${apiBaseUrl}/api-proxy`, newUserPayload, {
            timeout: 10000,
          });

          this.tdUserId = newUser.id;
        }
        userIdLocalStorage.set(this.tdUserId);
        this.isUserInfoLoaded = true;

        // Attach online event listener for background refresh
        attachOnlineReconnectListener(() => this.fetchAndSetUserInfo());
      } catch (error) {
        // Attempt to fall back to cached user info
        const fallbackCache = localStorage.getItem(CACHE_KEY);
        if (fallbackCache) {
          try {
            const parsed = JSON.parse(fallbackCache);
            const cachedTime = new Date(parsed.cachedAt).getTime();
            const ageHours = (Date.now() - cachedTime) / 1000 / 60 / 60;

            if (ageHours < CACHE_TTL_HOURS) {
              console.warn('Using cached clientPrincipal due to fetch failure');

              this.userInfo = { clientPrincipal: parsed.clientPrincipal };
              this.encodedClientPrincipal = toBase64(parsed.clientPrincipal);
              this.isUserInfoLoaded = true;
              return;
            } else {
              console.info('Cached clientPrincipal expired, removing.');
              localStorage.removeItem(CACHE_KEY);
            }
          } catch (e) {
            console.error('Failed to parse cached user info:', e);
            localStorage.removeItem(CACHE_KEY);
          }
        }

        let errorMessage = 'An unexpected error occurred. Please try again.';

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            errorMessage = 'Your session has expired or is invalid. Please log in again.';
            try {
              await this.displayAlertAndLogout(errorMessage);
            } catch (logoutError) {
              console.error('Logout failed:', logoutError);
              alert('An error occurred during logout. Please manually logout and try again.');
            }
            return;
          }

          if (error.response) {
            errorMessage = `Server responded with status: ${error.response.status}`;
          } else if (error.request) {
            errorMessage = 'No response received from server.';
          } else {
            errorMessage = error.message;
          }
        }

        if (import.meta.env.MODE === 'development') {
          console.error('fetchUserInfo error:', error);
        }

        alert(errorMessage);
      }
    },
    hasRole() {
      return (role: string) => {
        return this.userInfo?.clientPrincipal.allowedRoles.includes(role.toLowerCase()) || false;
      };
    },
    async displayAlertAndLogout(message: string) {
      // Show the alert and wait for the user to click 'OK'
      await new Promise<void>((resolve) => {
        alert(`${message}: You will be logged out. Please try logging in again.`);
        resolve();
      });
      // Perform the logout
      posthog?.stopSessionRecording();
      console.log('[PostHog] Session Replay is off');
      await axios.get('/.auth/logout?post_logout_redirect_uri=/.auth/login/aad');
      location.reload();
    },
    logout() {
      this.jwtToken = '';
      this.userInfo = null;
      posthog?.stopSessionRecording();
      console.log('[PostHog] Session Replay is off');
    },
    async ihiWorker() {
      try {
        const installTrackerService = new InstallTrackerService();
        const workerLocalStorage = localStorageHelper<WorkerDetails | null>('workerDetails');

        if (!this.tdUserId) {
          throw new Error('User ID is not available');
        }

        this.workerDetails = await installTrackerService.isIhiWorkerApi({ userId: this.tdUserId });
        workerLocalStorage.set(this.workerDetails);
        this.hasCheckedWorkerInfo = true;
      } catch (error) {
        this.hasCheckedWorkerInfo = false;
        console.error(error);
      }
    },
    useCachedData() {
      this.tdUserId = localStorageHelper('userId').get() as number;
      this.workerDetails = localStorageHelper('workerDetails').get() as WorkerDetails;
    },
  },
});
