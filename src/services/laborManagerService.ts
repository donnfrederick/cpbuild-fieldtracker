import type { UpdateUnitsByScopeApiRequest } from '@/interfaces/api/laborManagerRequest';
import { ApiBaseService } from './apiBaseService';

export class LaborManagerService extends ApiBaseService {
  public async updateUnitsByScope(
    unitId: number,
    data: UpdateUnitsByScopeApiRequest
  ): Promise<any> {
    return this.apiProxy(`/units-by-scope/${unitId}/update`, 'PATCH', data);
  }

  public async getUnitTasksByUnit(unitByScopeId: number): Promise<any> {
    return this.apiProxy(`/unit-by-scope/${unitByScopeId}/tasks`, 'GET');
  }
}
