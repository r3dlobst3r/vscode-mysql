import * as fs from 'fs';
import { QueryResult } from '../mysqlClient';
import { logger } from '../utils/logger';

export class CSVExporter {
    /**
     * Export query results to CSV format
     */
    public async export(filePath: string, result: QueryResult): Promise<void> {
        try {
            logger.info(`Exporting to CSV: ${filePath}`);

            const lines: string[] = [];

            // Add header row
            const headers = result.fields.map(field => this.escapeCSVValue(field.name));
            lines.push(headers.join(','));

            // Add data rows
            for (const row of result.rows) {
                const values = result.fields.map(field => {
                    const value = row[field.name];
                    return this.escapeCSVValue(this.formatValue(value));
                });
                lines.push(values.join(','));
            }

            // Write to file
            const content = lines.join('\n');
            await fs.promises.writeFile(filePath, content, 'utf8');

            logger.info(`CSV export complete: ${result.rows.length} rows exported`);
        } catch (error) {
            logger.error('CSV export failed', error as Error);
            throw new Error(`CSV export failed: ${(error as Error).message}`);
        }
    }

    /**
     * Escape CSV value (handle quotes, commas, newlines)
     */
    private escapeCSVValue(value: string): string {
        if (value === null || value === undefined) {
            return '';
        }

        const stringValue = String(value);

        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
    }

    /**
     * Format value for CSV
     */
    private formatValue(value: any): string {
        if (value === null || value === undefined) {
            return 'NULL';
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (typeof value === 'object') {
            return JSON.stringify(value);
        }

        return String(value);
    }
}
