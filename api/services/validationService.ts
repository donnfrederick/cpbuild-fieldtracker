import * as sql from 'mssql';

import { baseConfig } from "../dbConfig";
import { initializePool } from "./dbService";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

export function isValidDate(date: Date | string): boolean {
    let parsedDate = date;

    // If the date is a string, try parsing it
    if (typeof date === 'string') {
        parsedDate = new Date(date);
    }

    // Check if the parsedDate is a valid date
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
}

export function isValidTableName(tableName: string, validTableNames: Set<string>) {
    return validTableNames.has(tableName);
}

export async function isValidId(id: number, tableName: string, validTableNames: Set<string>, context: any): Promise<any> {
    context.log('isValidId called with id:', id, 'and tableName:', tableName);

    if (!isValidTableName(tableName, validTableNames)) {
        console.error(`Invalid table name: ${tableName}`);
        return { isValid: false, debugInfo: `Invalid table name: ${tableName}` };
    }

    if (id <= 0) {
        return { isValid: false, debugInfo: 'ID is zero or negative' };
    }

    try {
        context.log('Attempting to initialize pool');
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        context.log('Pool initialized, executing query');

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT COUNT(1) AS count FROM ${tableName} WHERE id = @id`);

        context.log('Query executed, result:', result.recordset[0].count);
        return { isValid: result.recordset[0].count > 0, debugInfo: `Queried ID: ${id}, Count: ${result.recordset[0].count}` };
    } catch (error) {
        console.error(`Error checking valid ID in table ${tableName}:`, error);
        return { isValid: false, debugInfo: `Error: ${(error as Error).message}` };
    }
};