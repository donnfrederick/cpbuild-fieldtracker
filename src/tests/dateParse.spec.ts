import { describe, it, expect } from 'vitest';
import dateParse from '@/util/dateParse';

describe('dateParse', () => {
  it('should return "--" for undefined input', () => {
    expect(dateParse(undefined)).toBe('--');
  });

  it('should return "--" for null input', () => {
    expect(dateParse(null)).toBe('--');
  });

  it('should parse a valid Date object with default format', () => {
    const date = new Date('2025-11-12T00:00:00');
    expect(dateParse(date)).toBe('11/12/2025');
  });

  it('should parse a valid date string with default format', () => {
    expect(dateParse('2025-11-12')).toBe('11/12/2025');
  });

  it('should return the input string for invalid date string', () => {
    const invalidDate = 'invalid-date';
    expect(dateParse(invalidDate)).toBe(invalidDate);
  });

  it('should format date according to custom format', () => {
    const date = new Date('2025-11-12T00:00:00');
    expect(dateParse(date, 'yyyy-mm-dd')).toBe('2025-11-12');
    expect(dateParse(date, 'dd-mm-yyyy')).toBe('12-11-2025');
    expect(dateParse(date, 'mm/yyyy/dd')).toBe('11/2025/12');
  });

  it('should pad single-digit day and month with zero', () => {
    const date = new Date('2025-01-05T00:00:00');
    expect(dateParse(date)).toBe('01/05/2025');
  });

  it('should handle date string with time included', () => {
    const date = '2025-11-12T15:30:00';
    expect(dateParse(date)).toBe('11/12/2025');
  });
});
