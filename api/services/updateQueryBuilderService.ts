export function buildUpdateQuery(recordId: number, changes: Record<string, any>, tableName: string, mapping?: Record<string, string>): { query: string, parameters: Record<string, any> } {
    let setClauses = [];
    let parameters: Record<string, any> = {};

    // Construct set clauses for each change
    for (const [key, value] of Object.entries(changes)) {
        if (value !== undefined) {
            const columnName = mapping ? (mapping[key] || key) : key;
            setClauses.push(`${columnName} = @${columnName}`);
            parameters[columnName] = value;
        }
    }

    // No changes to apply
    if (setClauses.length === 0) {
        throw new Error("No changes provided for update.");
    }

    // Add the recordId to the parameters
    parameters['recordId'] = recordId;

    const query = `UPDATE ${tableName} SET ${setClauses.join(", ")} WHERE id = @recordId`;

    return { query, parameters };
}
