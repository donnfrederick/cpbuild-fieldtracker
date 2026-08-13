import type { InspectionCompleteValue, InspectionPassedValue, SingleRowFormValues } from '.';
import type { ParseError } from '../common';

export interface EnhancedFormValues extends SingleRowFormValues {
  clearInspectionComplete: InspectionCompleteValue | ParseError | null;
  clearInspectionPassed: InspectionPassedValue | ParseError | null;
  clearInspectionDate: Date | string | null;
  [key: string]: any; // Adding an index signature
}
