import * as sql from 'mssql';

let pools: { [key: string]: sql.ConnectionPool | null } = {};
let initializingPools: { [key: string]: Promise<sql.ConnectionPool> | null } = {};

export async function initializePool(dbIdentifier: string, sqlConfig: sql.config): Promise<sql.ConnectionPool> {
    if (pools[dbIdentifier]) {
        return pools[dbIdentifier] as sql.ConnectionPool;
    }

    if (initializingPools[dbIdentifier]) {
        // Wait for the existing initialization promise
        return await initializingPools[dbIdentifier] as sql.ConnectionPool;
    }

    // Create a new promise for pool initialization
    initializingPools[dbIdentifier] = new Promise<sql.ConnectionPool>(async (resolve, reject) => {
        try {
            const pool = new sql.ConnectionPool(sqlConfig);
            await pool.connect();
            pools[dbIdentifier] = pool;
            resolve(pool);
        } catch (error) {
            console.error(`Failed to connect to SQL for dbIdentifier ${dbIdentifier}: ${(error as Error).message}`);
            pools[dbIdentifier] = null;
            reject(error);
        }
    });

    return await initializingPools[dbIdentifier] as sql.ConnectionPool;
}
