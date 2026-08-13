import type { PrimeCode } from './primeCode';
import type { ScopeOverride } from './scopeOverride';
import type { SubPrimeCode } from './subPrimeCode';
import type { UomType } from './uomType';

export interface ScopeDetail {
  scopeDetailId: number;
  scopeDetailCode: string;
  description: string;
  isActive: boolean;
  primeCode: Partial<PrimeCode>;
  subPrimeCode: Partial<SubPrimeCode>;
  uomType: Partial<UomType>;
  defaultManHoursQuantity: number;
  defaultInstallFactor: number;
  scopeOverride: Partial<ScopeOverride> | null;
  _isDirty?: boolean;
  [key: string]: any;
}
