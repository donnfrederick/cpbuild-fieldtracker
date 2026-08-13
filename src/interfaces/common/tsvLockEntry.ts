export type LockEntry = {
  taskIds: number[];
  updatedAt: number;
  expiryStartedAt?: number;
};
export type Locks = Record<string, LockEntry>;
