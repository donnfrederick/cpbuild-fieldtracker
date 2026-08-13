import { AzureFunction, Context } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const httpTrigger: AzureFunction = async function (context: Context): Promise<void> {
    context.log('HTTP trigger function processed a request to fetch active scope details.');

    const ftProjectId = context.bindingData.ftProjectId;
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
        SELECT
            ftsd.id,
            ftsd.scope_detail_code AS scopeDetailCode,
            ftsd.scope_detail_description AS scopeDetailDescription,
            ftsd.prime_code_id AS primeCodeId,
            ftsd.sub_prime_code_id AS subPrimeCodeId,
            ftsd.uom_type_id AS uomTypeId,
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
            field_tracker.scope_overrides so ON ftsd.id = so.scope_details_id AND so.field_tracker_project_id = @FtProjectId
        WHERE ftsd.is_active = 1
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
                body: `No active scope details found for Field Tracker Project ID: ${ftProjectId}`
            };
        }
    } catch (error) {
        context.log('Error while fetching active scope details:', error);
        context.res = {
            status: 500,
            body: "Internal Server Error: " + (error as Error).message
        };

    }
};

export default httpTrigger;
