import type { MaskingSession } from '@/interfaces/common/maskingSession';
import { useAuthStore } from '@/stores/useAuthStore';
import { SessionStorageService } from '@/util/sessionStorageService';

export class BaseServiceProxy {
  protected transformOptions(options: RequestInit): Promise<RequestInit> {
    const sessionStorageService = new SessionStorageService();
    const maskingSession = sessionStorageService.getItem<MaskingSession>('maskingSession');
    const authStore = useAuthStore();
    const principal = authStore.getEncodedClientPrincipal;
    options.headers = {
      ...(options.headers || {}),
      'X-MS-CLIENT-PRINCIPAL': principal ?? '',
    };

    if (maskingSession) {
      options.headers = {
        ...(options.headers || {}),
        'X-Masked-Team-Lead-Id': maskingSession.teamLeadId?.toString() ?? '',
        'X-Root-Team-Lead-Id': maskingSession.rootTeamLeadId?.toString() ?? '',
      };
    }

    return Promise.resolve(options);
  }

  protected getBaseUrl(_routePrefix: string, _baseUrl?: string): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL_V2;
    if (!baseUrl) {
      throw new Error('VITE_API_BASE_URL_V2 is not defined');
    }
    return baseUrl;
  }
}
