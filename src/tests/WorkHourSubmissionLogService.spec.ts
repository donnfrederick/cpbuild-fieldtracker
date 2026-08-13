import { cpBuildIndexedDb } from '@/shared/offlineDb/CPBuildIndexedDb';
import { IdbWorkHourSubmissionLogService as WorkHourSubmissionLogService } from '@/shared/offlineDb/services/idbWorkHourSubmissionLogService';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// src/shared/offlineDb/services/workHourSubmissionLogService.test.ts

// Mock for cpBuildIndexedDb
vi.mock('@/shared/offlineDb/CPBuildIndexedDb', () => {
  let workHourSubmission: any[] = [];

  return {
    cpBuildIndexedDb: {
      workHourSubmission: {
        filter: vi.fn((predicate: (w: any) => boolean) => {
          return {
            toArray: async () => workHourSubmission.filter(predicate),
          };
        }),
        put: vi.fn(async (item: any) => {
          item.tempId = workHourSubmission.length + 1;
          workHourSubmission.push(item);
          return item.tempId;
        }),
        __setAll: (items: any[]) => {
          workHourSubmission = items;
        },
        __reset: () => {
          workHourSubmission = [];
        },
      },
    },
  };
});

describe('WorkHourSubmissionLogService.getUnsynced', () => {
  beforeEach(() => {
    (cpBuildIndexedDb.workHourSubmission as any).__reset();
    vi.clearAllMocks();
  });

  it('returns only unsynced submissions', async () => {
    const submissions = [
      { tempId: 1, synced: false, workerId: 1 },
      { tempId: 2, synced: true, workerId: 2 },
      { tempId: 3, synced: false, workerId: 3 },
    ];
    (cpBuildIndexedDb.workHourSubmission as any).__setAll(submissions);

    const result = await WorkHourSubmissionLogService.getUnsynced();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result.every((r) => r.synced === false)).toBe(true);
    expect(result.map((r) => r.tempId)).toEqual([1, 3]);
  });

  it('returns empty array if no unsynced submissions', async () => {
    const submissions = [
      { tempId: 1, synced: true, workerId: 1 },
      { tempId: 2, synced: true, workerId: 2 },
    ];
    (cpBuildIndexedDb.workHourSubmission as any).__setAll(submissions);

    const result = await WorkHourSubmissionLogService.getUnsynced();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('returns all submissions if all are unsynced', async () => {
    const submissions = [
      { tempId: 1, synced: false, workerId: 1 },
      { tempId: 2, synced: false, workerId: 2 },
    ];
    (cpBuildIndexedDb.workHourSubmission as any).__setAll(submissions);

    const result = await WorkHourSubmissionLogService.getUnsynced();

    expect(result.length).toBe(2);
    expect(result.every((r) => r.synced === false)).toBe(true);
  });
});
