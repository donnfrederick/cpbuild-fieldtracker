import type { ParseError } from '../common';

export interface SingleRowFormValues {
  building: string;
  level: string;
  area: string;
  shipPhase: string;
  buildPhase: string;
  scheme: string;
  unit: string;
  unitType: string;
  description: string;
  scopeTypeName: string;
  scopeTypeId:
    | number
    | {
        requestedValue: number | string | null;
        scopeTypeName: string | null;
        scopeTypeId: number | null;
        ihi_enabled: number | boolean;
      }
    | null;
  scopeDetailCodeId:
    | number
    | {
        requestedValue: string;
        detailCode: string;
        detailCodeId: number;
      }
    | null;
  locationTypeId:
    | number
    | {
        requestedValue: string;
        locationTypeName: string;
        locationTypeId: number;
      }
    | null;
  costTypeId:
    | number
    | {
        requestedValue: string;
        costTypeName: string;
        costTypeId: number;
      }
    | null;
  quantity: number | null;
  installTeamId:
    | number
    | {
        requestedValue: number | string | null;
        installTeamName: string | null;
        installTeamId: number | null;
      }
    | null;
  startingDate: Date | string;
  finishDate: Date | string;
  percentComplete: number | ParseError | null;
  actualManHours: number | null;
  createdBy: number | null;
}
