import * as fs from 'fs';
import { QueryResult } from '../mysqlClient';
import { logger } from '../utils/logger';

export class JSONExporter {
    /**
     * Export query results to JSON format
     */
    public async export(filePath: string, result: QueryResult, pretty: boolean = true): Promise<void> {
        try {
            logger.info(`Exporting to JSON: ${filePath}`);

            // Convert rows to JSON-friendly format
            const data = result.rows.map(row => {
                const jsonRow: any = {};

                for (const field of result.fields) {
                    const value = row[field.name];
                    jsonRow[field.name] = this.formatValue(value);
                }

                return jsonRow;
            });

            // Create JSON structure with metadata
            const output = {
                metadata: {
                    rowCount: result.rowCount,
                    fields: result.fields.map(f => ({
                        name: f.name,
                        type: this.getFieldTypeName(f)
                    })),
                    exportedAt: new Date().toISOString()
                },
                data: data
            };

            // Write to file
            const content = pretty
                ? JSON.stringify(output, null, 2)
                : JSON.stringify(output);

            await fs.promises.writeFile(filePath, content, 'utf8');

            logger.info(`JSON export complete: ${result.rows.length} rows exported`);
        } catch (error) {
            logger.error('JSON export failed', error as Error);
            throw new Error(`JSON export failed: ${(error as Error).message}`);
        }
    }

    /**
     * Format value for JSON
     */
    private formatValue(value: any): any {
        if (value === null || value === undefined) {
            return null;
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (Buffer.isBuffer(value)) {
            return value.toString('base64');
        }

        return value;
    }

    /**
     * Get field type name from mysql2 field
     */
    private getFieldTypeName(field: any): string {
        const typeMap: { [key: number]: string } = {
            0: 'DECIMAL',
            1: 'TINY',
            2: 'SHORT',
            3: 'LONG',
            4: 'FLOAT',
            5: 'DOUBLE',
            6: 'NULL',
            7: 'TIMESTAMP',
            8: 'LONGLONG',
            9: 'INT24',
            10: 'DATE',
            11: 'TIME',
            12: 'DATETIME',
            13: 'YEAR',
            15: 'VARCHAR',
            16: 'BIT',
            245: 'JSON',
            246: 'NEWDECIMAL',
            247: 'ENUM',
            248: 'SET',
            249: 'TINY_BLOB',
            250: 'MEDIUM_BLOB',
            251: 'LONG_BLOB',
            252: 'BLOB',
            253: 'VAR_STRING',
            254: 'STRING',
            255: 'GEOMETRY'
        };

        return typeMap[field.columnType] || 'UNKNOWN';
    }
}
