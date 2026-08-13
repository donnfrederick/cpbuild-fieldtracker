import * as yup from 'yup';

export const projectWorkSubmissionSchema = (remainingQuantity: number) =>
  yup
    .object({
      quantity: yup
        .number()
        .typeError('Quantity must be a number')
        .min(1, 'Quantity must be at least 1')
        .max(
          remainingQuantity,
          `Quantity should not be greater than the Remaining Quantity (${remainingQuantity})`
        )
        .required('Quantity is required'),
      hours: yup.number().min(0, 'Hours must be at least 0').required('Hours are required'),
      minutes: yup
        .number()
        .min(0, 'Minutes must be at least 0')
        .max(59, 'Minutes must be less than 60')
        .required('Minutes are required'),
    })
    .test(
      'hours-or-minutes-positive',
      'Either hours or minutes must be greater than 0',
      (values) => {
        if (!values) return false;
        const h = Number(values.hours) || 0;
        const m = Number(values.minutes) || 0;
        return h > 0 || m > 0;
      }
    );
