import * as fs from 'fs';
import * as xml2js from 'xml2js';
import { QueryResult } from '../mysqlClient';
import { logger } from '../utils/logger';

export class XMLExporter {
    /**
     * Export query results to XML format
     */
    public async export(filePath: string, result: QueryResult): Promise<void> {
        try {
            logger.info(`Exporting to XML: ${filePath}`);

            // Create XML structure
            const xmlData = {
                resultset: {
                    $: {
                        rowCount: result.rowCount.toString(),
                        exportedAt: new Date().toISOString()
                    },
                    fields: [{
                        field: result.fields.map(f => ({
                            $: {
                                name: f.name,
                                type: this.getFieldTypeName(f)
                            }
                        }))
                    }],
                    rows: [{
                        row: result.rows.map(row => {
                            const rowData: any = {};

                            for (const field of result.fields) {
                                const value = row[field.name];
                                rowData[field.name] = [this.formatValue(value)];
                            }

                            return rowData;
                        })
                    }]
                }
            };

            // Build XML
            const builder = new xml2js.Builder({
                xmldec: { version: '1.0', encoding: 'UTF-8' },
                renderOpts: { pretty: true, indent: '  ' }
            });
            const xml = builder.buildObject(xmlData);

            // Write to file
            await fs.promises.writeFile(filePath, xml, 'utf8');

            logger.info(`XML export complete: ${result.rows.length} rows exported`);
        } catch (error) {
            logger.error('XML export failed', error as Error);
            throw new Error(`XML export failed: ${(error as Error).message}`);
        }
    }

    /**
     * Format value for XML
     */
    private formatValue(value: any): string {
        if (value === null || value === undefined) {
            return '';
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (Buffer.isBuffer(value)) {
            return value.toString('base64');
        }

        if (typeof value === 'object') {
            return JSON.stringify(value);
        }

        return String(value);
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
