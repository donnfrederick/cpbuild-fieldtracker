import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to fetch active project rows.');

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
            ftr.id,
            ftr.field_tracker_project_id AS ftProjectId,
            ftr.building,
            ftr.building_level as level,
            ftr.area,
            ftr.ship_phase AS shipPhase,
            ftr.build_phase AS buildPhase,
            ftr.scheme,
            ftr.unit,
            ftr.unit_type AS unitType,
            ftr.description,
            st.scope_name AS scopeTypeName,
            ftr.scope_type_id AS scopeTypeId,
            it.team_name AS installTeamName,
            ftr.install_team_id AS installTeamId,
            ftr.scope_detail_code_id AS scopeDetailCodeId,
            sd.scope_detail_code AS scopeDetailCode,
            sd.scope_detail_description AS scopeDetailCodeDescription,
            sd.man_hours_quantity AS manHoursQuantity,
            sd.install_factor AS installFactor,
            so.id AS scopeOverrideId,
            so.man_hours_quantity_override AS manHoursQuantityOverride,
            so.install_factor_override AS installFactorOverride,
            pc.prime_code AS primeCode,
            pc.prime_code_description AS primeCodeDescription,
            spc.sub_prime_code AS subPrimeCode,
            spc.sub_prime_code_description AS subPrimeCodeDescription,
            sd.uom_type_id AS uomTypeId,
            ut.uom_name AS uomName,
            ftr.location_type_id AS locationTypeId,
            lt.location_type_name AS locationTypeName,
            lt.location_type_description AS locationTypeDescription,
            ftr.cost_type_id AS costTypeId,
            ct.cost_type_name AS costTypeName,
            ct.cost_type_description AS costTypeDescription,
            ct.cost_type_definition AS costTypeDefinition,
            ftr.quantity,
            ftr.starting_date AS startingDate,
            ftr.finish_date AS finishDate,
            ftr.percent_complete AS percentComplete,
            ftr.actual_man_hours AS actualManHours,
            ftr.clear_inspection_complete AS clearInspectionComplete,
            ftr.clear_inspection_passed AS clearInspectionPassed,
            ftr.clear_inspection_date AS clearInspectionDate,
            ftr.created_at AS createdAt,
            ftr.updated_at AS updatedAt,
            so.created_at AS scopeOverrideCreatedAt,
            so.updated_at AS scopeOverrideUpdatedAt,
            so.deleted_at AS scopeOverrideDeletedAt,
            ftr.locked_from_editing AS lockedFromEditing,
            CASE
			    WHEN ubs.status_id != 9 THEN ubs.id
			    ELSE NULL
			END AS unitId
        FROM field_tracker.project_rows ftr
        INNER JOIN
            field_tracker.scope_details sd ON ftr.scope_detail_code_id = sd.id
        LEFT JOIN
            field_tracker.scope_overrides so ON sd.id = so.scope_details_id AND so.field_tracker_project_id = @FtProjectId
        LEFT JOIN
            field_tracker.prime_codes pc ON sd.prime_code_id = pc.id
        LEFT JOIN
            field_tracker.sub_prime_codes spc ON sd.sub_prime_code_id = spc.id
        LEFT JOIN
            field_tracker.uom_types ut ON sd.uom_type_id = ut.id
        LEFT JOIN
            field_tracker.scope_types st ON ftr.scope_type_id = st.id
        LEFT JOIN
            field_tracker.install_teams it ON ftr.install_team_id = it.id
        INNER JOIN
            field_tracker.location_types lt ON ftr.location_type_id = lt.id
        INNER JOIN
            field_tracker.cost_types ct ON ftr.cost_type_id = ct.id
        LEFT JOIN
        	field_tracker.units_by_scope ubs ON ftr.id = ubs.unit_id
        WHERE ftr.field_tracker_project_id = @FtProjectId
            AND ftr.deleted_at IS NULL
    `;

    try {
        const result = await request.query(query);
        if (result.recordset.length > 0) {
            const transformedData = result.recordset.map(item => ({
                id: item.id,
                ftProjectId: item.ftProjectId,
                building: item.building,
                level: item.level,
                area: item.area,
                shipPhase: item.shipPhase,
                buildPhase: item.buildPhase,
                scheme: item.scheme,
                unit: item.unit,
                unitType: item.unitType,
                description: item.description,
                scopeTypeName: item.scopeTypeName,
                installTeamName: item.installTeamName,
                scopeDetailCodeId: item.scopeDetailCodeId,
                scopeDetailCode: item.scopeDetailCode,
                scopeDetailCodeDescription: item.scopeDetailCodeDescription,
                manHoursQuantity: item.manHoursQuantity,
                installFactor: item.installFactor,
                primeCode: item.primeCode,
                primeCodeDescription: item.primeCodeDescription,
                subPrimeCode: item.subPrimeCode,
                subPrimeCodeDescription: item.subPrimeCodeDescription,
                uomTypeId: item.uomTypeId,
                uomName: item.uomName,
                locationTypeId: item.locationTypeId,
                locationTypeName: item.locationTypeName,
                locationTypeDescription: item.locationTypeDescription,
                costTypeId: item.costTypeId,
                scopeTypeId: item.scopeTypeId,
                costTypeName: item.costTypeName,
                costTypeDescription: item.costTypeDescription,
                costTypeDefinition: item.costTypeDefinition,
                quantity: item.quantity,
                startingDate: item.startingDate,
                finishDate: item.finishDate,
                percentComplete: item.percentComplete,
                actualManHours: item.actualManHours,
                clearInspectionComplete: item.clearInspectionComplete,
                clearInspectionPassed: item.clearInspectionPassed,
                clearInspectionDate: item.clearInspectionDate,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                scopeOverride: item.scopeOverrideId ? {
                    id: item.scopeOverrideId,
                    manHoursQuantityOverride: item.manHoursQuantityOverride,
                    installFactorOverride: item.installFactorOverride,
                    createdAt: item.scopeOverrideCreatedAt,
                    updatedAt: item.scopeOverrideUpdatedAt,
                    deletedAt: item.scopeOverrideDeletedAt
                } : null,
                lockedFromEditing: item.lockedFromEditing,
                unitId: item.unitId
            }));
            context.res = {
                status: 200,
                body: transformedData
            };
        } else {
            context.res = {
                status: 200,
                body: `No active project rows found for project ID: ${ftProjectId}`
            };
        }
    } catch (error) {
        context.log('Error while fetching project rows:', error);
        context.res = {
            status: 500,
            body: "Internal Server Error: " + (error as Error).message
        };
    }
};

export default httpTrigger;
