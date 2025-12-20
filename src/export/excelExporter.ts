import * as ExcelJS from 'exceljs';
import { QueryResult } from '../mysqlClient';
import { logger } from '../utils/logger';

export class ExcelExporter {
    /**
     * Export query results to Excel format (.xlsx)
     */
    public async export(filePath: string, result: QueryResult): Promise<void> {
        try {
            logger.info(`Exporting to Excel: ${filePath}`);

            // Create workbook and worksheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Query Results');

            // Add header row with styling
            const headers = result.fields.map(field => field.name);
            const headerRow = worksheet.addRow(headers);

            // Style header row
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

            // Add data rows
            for (const row of result.rows) {
                const values = result.fields.map(field => {
                    const value = row[field.name];
                    return this.formatValue(value);
                });
                worksheet.addRow(values);
            }

            // Auto-size columns
            worksheet.columns.forEach((column, index) => {
                let maxLength = headers[index].length;

                // Check first 100 rows for column width (performance optimization)
                const sampleSize = Math.min(100, result.rows.length);
                for (let i = 0; i < sampleSize; i++) {
                    const row = result.rows[i];
                    const value = row[result.fields[index].name];
                    const cellLength = this.formatValue(value).toString().length;
                    if (cellLength > maxLength) {
                        maxLength = cellLength;
                    }
                }

                // Set column width (max 50 characters)
                column.width = Math.min(maxLength + 2, 50);
            });

            // Add autofilter
            worksheet.autoFilter = {
                from: { row: 1, column: 1 },
                to: { row: 1, column: headers.length }
            };

            // Freeze header row
            worksheet.views = [
                { state: 'frozen', xSplit: 0, ySplit: 1 }
            ];

            // Write to file
            await workbook.xlsx.writeFile(filePath);

            logger.info(`Excel export complete: ${result.rows.length} rows exported`);
        } catch (error) {
            logger.error('Excel export failed', error as Error);
            throw new Error(`Excel export failed: ${(error as Error).message}`);
        }
    }

    /**
     * Format value for Excel
     */
    private formatValue(value: any): any {
        if (value === null || value === undefined) {
            return 'NULL';
        }

        if (value instanceof Date) {
            return value;
        }

        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'number') {
            return value;
        }

        if (Buffer.isBuffer(value)) {
            return `[BLOB: ${value.length} bytes]`;
        }

        if (typeof value === 'object') {
            return JSON.stringify(value);
        }

        return String(value);
    }
}
