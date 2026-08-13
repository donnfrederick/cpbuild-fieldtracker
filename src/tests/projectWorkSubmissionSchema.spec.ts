import { describe, it, expect } from 'vitest';
import { projectWorkSubmissionSchema } from '../components/modal/validationSchemas/projectWorkSubmissionSchema';

describe('projectWorkSubmissionSchema', () => {
  const remainingQuantity = 10;
  const schema = projectWorkSubmissionSchema(remainingQuantity);

  it('should pass when all values are valid', async () => {
    const validData = { quantity: 5, hours: 1, minutes: 30 };
    await expect(schema.validate(validData)).resolves.toEqual(validData);
  });

  it('should fail if quantity is not a number', async () => {
    const invalidData = { quantity: 'abc', hours: 1, minutes: 0 };
    await expect(schema.validate(invalidData)).rejects.toThrow('Quantity must be a number');
  });

  it('should fail if quantity is less than 1', async () => {
    const invalidData = { quantity: 0, hours: 1, minutes: 0 };
    await expect(schema.validate(invalidData)).rejects.toThrow('Quantity must be at least 1');
  });

  it('should fail if quantity exceeds remainingQuantity', async () => {
    const invalidData = { quantity: remainingQuantity + 1, hours: 1, minutes: 0 };
    await expect(schema.validate(invalidData)).rejects.toThrow(
      `Quantity should not be greater than the Remaining Quantity (${remainingQuantity})`
    );
  });

  it('should fail if hours and minutes are both zero', async () => {
    const invalidData = { quantity: 5, hours: 0, minutes: 0 };
    await expect(schema.validate(invalidData)).rejects.toThrow(
      'Either hours or minutes must be greater than 0'
    );
  });

  it('should pass if hours is 0 but minutes is positive', async () => {
    const validData = { quantity: 5, hours: 0, minutes: 15 };
    await expect(schema.validate(validData)).resolves.toEqual(validData);
  });

  it('should pass if minutes is 0 but hours is positive', async () => {
    const validData = { quantity: 5, hours: 2, minutes: 0 };
    await expect(schema.validate(validData)).resolves.toEqual(validData);
  });

  it('should fail if minutes is negative', async () => {
    const invalidData = { quantity: 5, hours: 1, minutes: -5 };
    await expect(schema.validate(invalidData)).rejects.toThrow('Minutes must be at least 0');
  });

  it('should fail if minutes is 60 or more', async () => {
    const invalidData = { quantity: 5, hours: 1, minutes: 60 };
    await expect(schema.validate(invalidData)).rejects.toThrow('Minutes must be less than 60');
  });

  it('should fail if hours is negative', async () => {
    const invalidData = { quantity: 5, hours: -1, minutes: 15 };
    await expect(schema.validate(invalidData)).rejects.toThrow('Hours must be at least 0');
  });
});
