export function buildInsertQuery(data: Record<string, any>, tableName: string, mapping?: Record<string, string>): { query: string, parameters: Record<string, any> } {
    let columns = [];
    let values = [];
    let parameters: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
        // Allow null values to be included
        if (value !== undefined) {
            const columnName = mapping ? (mapping[key] || key) : key;
            columns.push(columnName);
            values.push(`@${columnName}`);
            parameters[columnName] = value;
        }
    }

    const outputClause = "OUTPUT Inserted.*"; // Captures all the data of the inserted row
    const query = `INSERT INTO ${tableName} (${columns.join(", ")}) ${outputClause} VALUES (${values.join(", ")})`;

    return { query, parameters };
}
