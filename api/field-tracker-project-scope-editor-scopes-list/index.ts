import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { isValidId } from "../services/validationService";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const validTableNames = new Set(['field_tracker.projects']);

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const ftProjectId = context.bindingData.ftProjectId;
    context.log(`HTTP trigger function processed a request to get the list scopes and scope overrides used by Field Tracker Project with id ${ftProjectId}.`);

    if (ftProjectId && !await isValidId(ftProjectId, 'field_tracker.projects', validTableNames, context)) {
        context.res = {
            status: 400,
            body: `Invalid Field Tracker Project ID: ${ftProjectId}`
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const request = new sql.Request(pool);
    request.input('FtProjectId', sql.Int, ftProjectId);

    const query = `
        SELECT DISTINCT
            sd.id AS scopeDetailId,
            sd.scope_detail_code AS scopeDetailCode,
            sd.scope_detail_description AS scopeDetailDescription,
            sd.is_active AS isActive,
            sd.prime_code_id AS primeCodeId,
            pc.prime_code AS primeCode,
            pc.prime_code_description AS primeCodeDescription,
            sd.sub_prime_code_id AS subPrimeCodeId,
            spc.sub_prime_code AS subPrimeCode,
            spc.sub_prime_code_description AS subPrimeCodeDescription,
            sd.uom_type_id AS uomTypeId,
            ut.uom_name AS uomName,
            ut.uom_description AS uomDescription,
            sd.man_hours_quantity AS defaultManHoursQuantity,
            sd.install_factor AS defaultInstallFactor,
            so.id AS scopeOverrideId,
            so.field_tracker_project_id AS ftProjectId,
            so.man_hours_quantity_override AS manHoursQuantityOverride,
            so.install_factor_override AS installFactorOverride,
            so.created_at AS createdAt,
            so.created_by AS createdById,
            cbu.name AS createdByName,
            so.updated_at AS updatedAt,
            so.updated_by AS updatedById,
            ubu.name AS updatedByName,
            so.deleted_at AS deletedAt,
            so.deleted_by AS deletedById,
            dbu.name AS deletedByName
        FROM
            field_tracker.project_rows pr
        INNER JOIN
            field_tracker.scope_details sd ON pr.scope_detail_code_id = sd.id
        LEFT JOIN
            field_tracker.scope_overrides so ON sd.id = so.scope_details_id AND so.field_tracker_project_id = @FtProjectId
        LEFT JOIN
            field_tracker.prime_codes pc ON sd.prime_code_id = pc.id
        LEFT JOIN
            field_tracker.sub_prime_codes spc ON sd.sub_prime_code_id = spc.id
        LEFT JOIN
            field_tracker.uom_types ut ON sd.uom_type_id = ut.id
        LEFT JOIN
            dbo.users cbu ON so.created_by = cbu.id
        LEFT JOIN
            dbo.users ubu ON so.updated_by = ubu.id
        LEFT JOIN
            dbo.users dbu ON so.deleted_by = dbu.id
        WHERE
            pr.field_tracker_project_id = @FtProjectId
    `;

    try {
        const result = await request.query(query);
        if (result.recordset.length > 0) {
            const transformedData = result.recordset.map(item => ({
                scopeDetailId: item.scopeDetailId,
                scopeDetailCode: item.scopeDetailCode,
                description: item.scopeDetailDescription,
                primeCode: {
                    id: item.primeCodeId,
                    primeCode: item.primeCode,
                    description: item.primeCodeDescription
                },
                subPrimeCode: {
                    id: item.subPrimeCodeId,
                    subPrimeCode: item.subPrimeCode,
                    description: item.subPrimeCodeDescription
                },
                uomType: {
                    id: item.uomTypeId,
                    uomName: item.uomName,
                    description: item.uomDescription
                },
                defaultManHoursQuantity: item.defaultManHoursQuantity,
                defaultInstallFactor: item.defaultInstallFactor,
                scopeOverride: item.scopeOverrideId ? {
                    id: item.scopeOverrideId,
                    ftProjectId: item.ftProjectId,
                    scopeDetailId: item.scopeDetailId,
                    manHoursQuantityOverride: item.manHoursQuantityOverride,
                    installFactorOverride: item.installFactorOverride,
                    createdAt: item.createdAt,
                    createdById: item.createdById,
                    createdByName: item.createdByName,
                    updatedAt: item.updatedAt,
                    updatedById: item.updatedById,
                    updatedByName: item.updatedByName,
                    deletedAt: item.deletedAt,
                    deletedById: item.deletedById,
                    deletedByName: item.deletedByName
                } : null
            }));
            context.res = {
                status: 200,
                body: transformedData
            };
        } else {
            context.res = {
                status: 200,
                body: "No scope details or overrides found for the specified Field Tracker Project ID."
            };
        }
    } catch (error) {
        context.log(`Error while fetching data: ${(error as Error).message}`);
        context.res = {
            status: 500,
            body: "Internal Server Error: Error while fetching scope details and overrides."
        };
    }
};

export default httpTrigger;