import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';
import { setActivePinia, createPinia } from 'pinia';

// Mock stores BEFORE importing the guard
vi.mock('@/stores/useAuthStore');
vi.mock('@/stores/useNetworkStore');

import { beforeEachGuard } from '@/router/index';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNetworkStore } from '@/stores/useNetworkStore';

// Import the class (TS knows about this); the mock in vitest.setup.ts
// ensures new SessionStorageService() returns the shared spy-able API.
import { SessionStorageService } from '@/util/sessionStorageService';

const mockNext = vi.fn();
const dummyRoute = (meta = {}, name = 'dummy', params = {} as any) => ({
  name,
  meta,
  params,
});

describe('router beforeEach guard', () => {
  let authStoreMock: any;
  let networkStoreMock: any;

  // This will be the shared API object returned by the mocked constructor
  let sessionApi: {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    mockNext.mockClear();

    // Grab the shared API object from the mocked constructor
    sessionApi = new SessionStorageService() as unknown as typeof sessionApi;

    // Reset its spies each test
    sessionApi.getItem.mockReset();
    sessionApi.setItem.mockReset();
    sessionApi.removeItem.mockReset();
    sessionApi.clear.mockReset();

    authStoreMock = {
      isUserDataReady: false,
      hasCheckedWorkerInfo: false,
      isUserInfoLoaded: true,
      hasAdminRole: false,
      hasExecutiveRole: false,
      hasInstallDirectorRole: false,
      hasPowerUserRole: false,
      hasProjectCoordinatorRole: false,
      hasInstallManagerRole: false,
      hasControlsManagerRole: false,
      hasProjectManagerRole: false,
      hasTeamLeadRole: false,
      hasWorkerRole: false,
      hasEstimatorRole: false,
      fetchAndSetUserInfo: vi.fn().mockResolvedValue(undefined),
      ihiWorker: vi.fn().mockResolvedValue(undefined),
      useCachedData: vi.fn(),
    };

    networkStoreMock = { isOffline: ref(false) };

    (useAuthStore as any).mockReturnValue(authStoreMock);
    (useNetworkStore as any).mockReturnValue(networkStoreMock);
  });

  it('redirects to /dashboard if offline and route not allowed in offline', async () => {
    networkStoreMock.isOffline.value = true;
    const to = dummyRoute({ allowedInOffline: false });
    await beforeEachGuard(to, {} as RouteLocationNormalized, mockNext);
    expect(mockNext).toHaveBeenCalledWith('/dashboard');
  });

  it('uses cached data if offline', async () => {
    networkStoreMock.isOffline.value = true;
    const to = dummyRoute({ allowedInOffline: true });
    await beforeEachGuard(to, {} as RouteLocationNormalized, mockNext);
    expect(authStoreMock.useCachedData).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('calls fetchAndSetUserInfo if not ready', async () => {
    authStoreMock.isUserDataReady = false;
    const to = dummyRoute({ allowedInOffline: true });
    await beforeEachGuard(to, {} as RouteLocationNormalized, mockNext);
    expect(authStoreMock.fetchAndSetUserInfo).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('calls ihiWorker if not checked', async () => {
    authStoreMock.hasCheckedWorkerInfo = false;
    const to = dummyRoute({ allowedInOffline: true });
    await beforeEachGuard(to, {} as RouteLocationNormalized, mockNext);
    expect(authStoreMock.ihiWorker).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('allows navigation if user has one of the allowed roles', async () => {
    authStoreMock.hasAdminRole = true;
    const to = dummyRoute({ allowedRoles: ['admin'] });
    await beforeEachGuard(to, {} as RouteLocationNormalized, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('still allows navigation if user does not have allowed roles but no restriction', async () => {
    const to = dummyRoute();
    await beforeEachGuard(to, {} as RouteLocationNormalized, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('logs a warning if user lacks required roles but route has allowedRoles', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const to = dummyRoute({ allowedRoles: ['admin'] });
    await beforeEachGuard(to, {} as RouteLocationNormalized, mockNext);
    expect(warnSpy).toHaveBeenCalledWith(
      'User does not have the required role, but access is allowed.'
    );
    expect(mockNext).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  // ---------- viewer tests (string taskId; behavior-first) ----------

  it('redirects to /dashboard if task-submission-viewer config not found in session storage', async () => {
    // let the guard get past early checks
    authStoreMock.isUserDataReady = true;
    authStoreMock.hasCheckedWorkerInfo = true;

    sessionApi.getItem.mockReturnValueOnce(null);

    const to = dummyRoute({}, 'task-submission-viewer', { taskId: '123' });
    await beforeEachGuard(to, {} as RouteLocationNormalized, mockNext);

    expect(mockNext).toHaveBeenCalledWith('/dashboard');
  });

  it('allows navigation if task-submission-viewer config exists in session storage', async () => {
    authStoreMock.isUserDataReady = true;
    authStoreMock.hasCheckedWorkerInfo = true;

    sessionApi.getItem.mockReturnValueOnce({ mode: 'view', taskId: '123' });

    const to = dummyRoute({}, 'task-submission-viewer', { taskId: '123' });
    await beforeEachGuard(to, {} as RouteLocationNormalized, mockNext);

    expect(mockNext).toHaveBeenCalled(); // proceeds
    expect(mockNext).not.toHaveBeenCalledWith('/dashboard'); // no redirect
  });
});
