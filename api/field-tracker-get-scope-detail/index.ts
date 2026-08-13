import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to fetch specific scope detail by code value.');

    const ftProjectId = context.bindingData.ftProjectId;
    const scopeDetailCode = parseInt(context.bindingData.scopeDetailCode, 10);

    if (!scopeDetailCode || isNaN(scopeDetailCode)) {
        context.res = {
            status: 400,
            body: "A valid Scope Detail Code value is required and must be a number."
        };
        return;
    }

    if (!ftProjectId) {
        context.res = {
            status: 400,
            body: "Field Tracker Project ID is required."
        };
        return;
    }

    const pool = await initializePool(baseConfig.toolsDashboard.database, baseConfig.toolsDashboard);
    const request = new sql.Request(pool);
    request.input('FtProjectId', sql.Int, ftProjectId);

    const query = `
        SELECT TOP 1
            ftsd.id,
            ftsd.scope_detail_code AS scopeDetailCode,
            ftsd.scope_detail_description AS scopeDetailDescription,
            ftsd.prime_code_id AS primeCodeId,
            ftsd.sub_prime_code_id AS subPrimeCodeId,
            ftsd.uom_type_id AS uomTypeId,
            ut.uom_name AS uomName,
            ftsd.man_hours_quantity AS manHoursQuantity,
            ftsd.install_factor AS installFactor,
            so.id AS scopeOverrideId,
            so.man_hours_quantity_override AS manHoursQuantityOverride,
            so.install_factor_override AS installFactorOverride,
            so.created_at AS scopeOverrideCreatedAt,
            so.updated_at AS scopeOverrideUpdatedAt,
            so.deleted_at AS scopeOverrideDeletedAt
        FROM field_tracker.scope_details ftsd
        LEFT JOIN
            field_tracker.uom_types ut ON ftsd.uom_type_id = ut.id
        LEFT JOIN
            field_tracker.scope_overrides so ON ftsd.id = so.scope_details_id AND so.field_tracker_project_id = @FtProjectId
        WHERE ftsd.scope_detail_code = @scopeDetailCode
            AND ftsd.is_active = 1
    `;

    try {
        const result = await request.query(query);
        if (result.recordset.length > 0) {
            const transformedData = result.recordset.map(item => ({
                id: item.id,
                scopeDetailCode: item.scopeDetailCode,
                scopeDetailDescription: item.scopeDetailDescription,
                primeCodeId: item.primeCodeId,
                subPrimeCodeId: item.subPrimeCodeId,
                uomTypeId: item.uomTypeId,
                uomName: item.uomName,
                manHoursQuantity: item.manHoursQuantity,
                installFactor: item.installFactor,
                scopeOverride: item.scopeOverrideId ? {
                    scopeOverrideId: item.scopeOverrideId,
                    manHoursQuantityOverride: item.manHoursQuantityOverride,
                    installFactorOverride: item.installFactorOverride,
                    scopeOverrideCreatedAt: item.scopeOverrideCreatedAt,
                    scopeOverrideUpdatedAt: item.scopeOverrideUpdatedAt,
                    scopeOverrideDeletedAt: item.scopeOverrideDeletedAt
                } : null
            }));
            context.res = {
                status: 200,
                body: transformedData
            };
        } else {
            context.res = {
                status: 404,
                body: `Scope Detail with code value ${scopeDetailCode} not found.`
            };
        }
    } catch (error) {
        context.log(`Error while fetching scope detail code with id ${scopeDetailCode}:`, error);
        context.res = {
            status: 500,
            body: "Internal Server Error: " + (error as Error).message
        };
    }
};

export default httpTrigger;
