// interface to column name mapping for the ProjectRowInput interface
export const projectRowInputColumnMap: Record<string, string> = {
    projectId: 'field_tracker_project_id',
    building: 'building',
    level: 'building_level',
    area: 'area',
    shipPhase: 'ship_phase',
    buildPhase: 'build_phase',
    scheme: 'scheme',
    unit: 'unit',
    unitType: 'unit_type',
    scopeTypeId: 'scope_type_id',
    scopeDetailCodeId: 'scope_detail_code_id',
    locationTypeId: 'location_type_id',
    costTypeId: 'cost_type_id',
    quantity: 'quantity',
    installTeamId: 'install_team_id',
    startingDate: 'starting_date',
    finishDate: 'finish_date',
    percentComplete: 'percent_complete',
    actualManHours: 'actual_man_hours',
    clearInspectionComplete: 'clear_inspection_complete',
    clearInspectionPassed: 'clear_inspection_passed',
    clearInspectionDate: 'clear_inspection_date',
    createdBy: 'created_by'
};

export const projectRowUpdateColumnMap: Record<string, string> = {
    rowId: 'id',
    building: 'building',
    level: 'building_level',
    area: 'area',
    shipPhase: 'ship_phase',
    buildPhase: 'build_phase',
    scheme: 'scheme',
    unit: 'unit',
    unitType: 'unit_type',
    scopeDetailCodeId: 'scope_detail_code_id',
    locationTypeId: 'location_type_id',
    costTypeId: 'cost_type_id',
    scopeTypeId: 'scope_type_id',
    quantity: 'quantity',
    installTeamId: 'install_team_id',
    startingDate: 'starting_date',
    finishDate: 'finish_date',
    percentComplete: 'percent_complete',
    actualManHours: 'actual_man_hours',
    clearInspectionComplete: 'clear_inspection_complete',
    clearInspectionPassed: 'clear_inspection_passed',
    clearInspectionDate: 'clear_inspection_date',
    updatedAt: 'updated_at',
    updatedBy: 'updated_by'
};

export const ScopeOverrideColumnMap: Record<string, string> = {
    overrideId: 'id',
    ftProjectId: 'field_tracker_project_id',
    scopeDetailId: 'scope_details_id',
    manHoursQuantityOverride: 'man_hours_quantity_override',
    installFactorOverride: 'install_factor_override',
    createAt: 'created_at',
    createdBy: 'created_by',
    updatedAt: 'updated_at',
    updatedBy: 'updated_by',
    deletedAt: 'deleted_at',
    deletedBy: 'deleted_by'
};

export const scopeOverrideUpdateColumnMap: Record<string, string> = {
    scopeOverrideId: 'id',
    manHoursQuantityOverride: 'man_hours_quantity_override',
    installFactorOverride: 'install_factor_override',
    updatedAt: 'updated_at',
    updatedBy: 'updated_by'
};