import * as vscode from 'vscode';
import * as path from 'path';
import { QueryResult } from '../mysqlClient';
import { CSVExporter } from './csvExporter';
import { JSONExporter } from './jsonExporter';
import { ExcelExporter } from './excelExporter';
import { XMLExporter } from './xmlExporter';
import { logger } from '../utils/logger';

export enum ExportFormat {
    CSV = 'csv',
    JSON = 'json',
    EXCEL = 'xlsx',
    XML = 'xml'
}

export class ExportManager {
    private csvExporter: CSVExporter;
    private jsonExporter: JSONExporter;
    private excelExporter: ExcelExporter;
    private xmlExporter: XMLExporter;

    constructor() {
        this.csvExporter = new CSVExporter();
        this.jsonExporter = new JSONExporter();
        this.excelExporter = new ExcelExporter();
        this.xmlExporter = new XMLExporter();
    }

    /**
     * Export query results with user-selected format and location
     */
    public async exportWithDialog(result: QueryResult): Promise<void> {
        try {
            // Ask user to select format
            const format = await this.selectFormat();
            if (!format) {
                return; // User cancelled
            }

            // Ask user to select save location
            const filePath = await this.selectSaveLocation(format);
            if (!filePath) {
                return; // User cancelled
            }

            // Export with progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Exporting to ${format.toUpperCase()}...`,
                cancellable: false
            }, async () => {
                await this.export(filePath, result, format);
            });

            // Show success message with option to open file
            const action = await vscode.window.showInformationMessage(
                `Successfully exported ${result.rows.length} rows to ${path.basename(filePath)}`,
                'Open File',
                'Show in Folder'
            );

            if (action === 'Open File') {
                const doc = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(doc);
            } else if (action === 'Show in Folder') {
                await vscode.env.openExternal(vscode.Uri.file(path.dirname(filePath)));
            }
        } catch (error) {
            logger.error('Export failed', error as Error);
            vscode.window.showErrorMessage(`Export failed: ${(error as Error).message}`);
        }
    }

    /**
     * Export query results to specified format and location
     */
    public async export(filePath: string, result: QueryResult, format: ExportFormat): Promise<void> {
        switch (format) {
            case ExportFormat.CSV:
                await this.csvExporter.export(filePath, result);
                break;
            case ExportFormat.JSON:
                await this.jsonExporter.export(filePath, result);
                break;
            case ExportFormat.EXCEL:
                await this.excelExporter.export(filePath, result);
                break;
            case ExportFormat.XML:
                await this.xmlExporter.export(filePath, result);
                break;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Show quick pick to select export format
     */
    private async selectFormat(): Promise<ExportFormat | undefined> {
        const items = [
            {
                label: '$(file-text) CSV',
                description: 'Comma-separated values',
                format: ExportFormat.CSV
            },
            {
                label: '$(json) JSON',
                description: 'JavaScript Object Notation',
                format: ExportFormat.JSON
            },
            {
                label: '$(table) Excel',
                description: 'Microsoft Excel (.xlsx)',
                format: ExportFormat.EXCEL
            },
            {
                label: '$(code) XML',
                description: 'Extensible Markup Language',
                format: ExportFormat.XML
            }
        ];

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select export format',
            title: 'Export Query Results'
        });

        return selected?.format;
    }

    /**
     * Show save dialog to select export location
     */
    private async selectSaveLocation(format: ExportFormat): Promise<string | undefined> {
        const filters: { [name: string]: string[] } = {};

        switch (format) {
            case ExportFormat.CSV:
                filters['CSV Files'] = ['csv'];
                filters['All Files'] = ['*'];
                break;
            case ExportFormat.JSON:
                filters['JSON Files'] = ['json'];
                filters['All Files'] = ['*'];
                break;
            case ExportFormat.EXCEL:
                filters['Excel Files'] = ['xlsx'];
                filters['All Files'] = ['*'];
                break;
            case ExportFormat.XML:
                filters['XML Files'] = ['xml'];
                filters['All Files'] = ['*'];
                break;
        }

        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`query_results.${format}`),
            filters: filters,
            title: 'Save Export As'
        });

        return uri?.fsPath;
    }
}
