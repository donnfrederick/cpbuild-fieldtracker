# 🗃️ CPBuildIndexedDb Schema Documentation

**Database Name:** `OfflineRequestQueueDB`  
**Library:** [Dexie.js](https://dexie.org)  
**Current Schema Version:** `v1`  
**File:** `CPBuildIndexedDb.ts`

---

## 📌 Overview

The `CPBuildIndexedDb` handles offline data caching and synchronization logic for the application.  
It stores queued API requests, temporary submissions, images, and task-related updates that are synchronized when the app regains connectivity.

Dexie provides versioned schema definitions, ensuring smooth migration as the database evolves.

When making schema changes, **always**:

1. Increment the `indexedDBVersion` number.
2. Document the change in this file.
3. Add a `.version(n).upgrade(...)` migration in the class constructor (if necessary).
4. Test upgrade from previous versions using a fresh build.

---

## ⚙️ Database Configuration

```ts
export class CPBuildIndexedDb extends Dexie {
  static readonly MAX_RECORDS = 500;
  static readonly TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  indexedDBVersion = 1; // Increment this when schema changes
}
```

**Eviction Policy**

- Keeps only the most recent **500** records per table (`MAX_RECORDS`).
- Removes entries older than **7 days** or already synced (`TTL_MS`).

---

## 🧩 Schema Definition — Version 1

**Version:** `1`  
**Released:** _Initial Release_  
**File:** `CPBuildIndexedDb.ts`

### Tables

| Table                    | Key                        | Indexed Fields                                                             | Description                                          |
| ------------------------ | -------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------- |
| `requests`               | `[url+method]` (composite) | `timestamp`, `synced`                                                      | Queued HTTP requests for offline sync                |
| `workHourSubmission`     | `++tempId` (auto)          | `projectId`, `taskId`, `workerId`, `submissionDate`, `synced`, `timestamp` | Work-hour submissions awaiting sync                  |
| `images`                 | `++tempId` (auto)          | `submissionId`, `timestamp`, `synced`, `[submissionId+submissionLocation]` | Locally stored images related to submissions         |
| `updateUnitTaskTSV`      | `taskId`                   | `timestamp`, `synced`                                                      | Cached task updates for Task Submission Viewer       |
| `updateUnitByScopeTSV`   | `unitId`                   | `timestamp`, `synced`                                                      | Cached unit updates for Task Submission Viewer       |
| `punchWorkTaskCreateTSV` | `++tempId` (auto)          | `parentTaskId`, `timestamp`, `synced`                                      | Temporary punch work tasks before server sync        |
| `updateDeficiencyTSV`    | `deficiencyId`             | `timestamp`, `synced`                                                      | Cached deficiency updates for Task Submission Viewer |

---

## 🚀 Migration Guidelines

Whenever schema updates are needed (adding, renaming, or removing tables/indexes):

### 1. Increment the version

```ts
static readonly indexedDBVersion = 2;
```

### 2. Add a `.version(2)` block with migration

Example:

```ts
this.version(2)
  .stores({
    requests: '[url+method], timestamp, synced',
    // other existing tables...
    newTable: '++id, name, createdAt',
  })
  .upgrade(async (tx) => {
    // Optional data migration logic
    const requests = await tx.table('requests').toArray();
    // Example: normalize fields or add missing properties
    for (const req of requests) {
      if (!req.timestamp) req.timestamp = Date.now();
      await tx.table('requests').put(req);
    }
  });
```

### 3. Document the schema change in this README

Use this format:

```md
### Version 2

- Added table: `newTable`
- Modified `images` table: added `uploadedAt` index
- Removed deprecated `oldCache` table
- Migration: Existing `requests` entries updated with `timestamp` field
```

### 4. (Optional) Add a recovery fallback

If you expect breaking changes:

```ts
try {
  await db.open();
} catch (error) {
  console.warn('IndexedDB schema error, resetting database...');
  await Dexie.delete('OfflineRequestQueueDB');
  await db.open();
}
```

---

## 🧹 Maintenance Notes

- Periodic cleanup removes expired and synced data via:
  ```ts
  db.cleanupRequests();
  ```
- `enforceMaxRecords()` ensures the cache doesn’t grow indefinitely.
- For debugging, you can inspect the IndexedDB contents using:
  - **Chrome**: `DevTools → Application → Storage → IndexedDB`
  - **Firefox**: `Storage Inspector → IndexedDB`

---

## 🧾 Version History

| Version | Date      | Summary                                                                   |
| ------- | --------- | ------------------------------------------------------------------------- |
| **1**   | _Initial_ | Created base schema for offline caching, submissions, and task sync data. |

---
