import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { QueryExecutionResult } from '../../queries/queryRunner';
import { ExportManager } from '../../export/exportManager';
import { logger } from '../../utils/logger';

export class ResultsPanel {
    private panel: vscode.WebviewPanel | undefined;
    private disposables: vscode.Disposable[] = [];
    private currentResults: QueryExecutionResult[] = [];
    private currentSql: string = '';
    private exportManager: ExportManager;

    constructor(private context: vscode.ExtensionContext) {
        this.exportManager = new ExportManager();
    }

    /**
     * Show query results in the panel
     */
    public async showResults(sql: string, results: QueryExecutionResult[]): Promise<void> {
        this.currentSql = sql;
        this.currentResults = results;

        if (!this.panel) {
            this.createPanel();
        } else {
            this.panel.reveal(vscode.ViewColumn.Beside);
        }

        // Send results to webview
        this.panel?.webview.postMessage({
            command: 'showResults',
            results: results.map(r => this.serializeResult(r))
        });

        // Show summary in status bar
        const totalRows = results.reduce((sum, r) => sum + (r.result?.rowCount || 0), 0);
        const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);

        if (results.some(r => r.error)) {
            vscode.window.showErrorMessage(`Query execution completed with errors. See results panel for details.`);
        } else if (totalRows > 0) {
            vscode.window.showInformationMessage(`Query returned ${totalRows} row(s) in ${totalTime}ms`);
        } else {
            const totalAffected = results.reduce((sum, r) => sum + (r.result?.affectedRows || 0), 0);
            vscode.window.showInformationMessage(`Query executed successfully. ${totalAffected} row(s) affected in ${totalTime}ms`);
        }
    }

    private createPanel() {
        this.panel = vscode.window.createWebviewPanel(
            'mysqlResults',
            'Query Results',
            {
                viewColumn: vscode.ViewColumn.Beside,
                preserveFocus: true
            },
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'ui', 'webviews', 'webviewContent'))
                ]
            }
        );

        this.panel.webview.html = this.getHtmlContent(this.panel.webview);

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'ready':
                        // Webview is ready, send current results if any
                        if (this.currentResults.length > 0) {
                            this.panel?.webview.postMessage({
                                command: 'showResults',
                                results: this.currentResults.map(r => this.serializeResult(r))
                            });
                        }
                        break;

                    case 'export':
                        await this.handleExport(message.tabIndex);
                        break;

                    case 'refresh':
                        // Re-run the query
                        vscode.commands.executeCommand('mysql.executeQuery');
                        break;
                }
            },
            null,
            this.disposables
        );

        // Clean up when panel is closed
        this.panel.onDidDispose(
            () => {
                this.panel = undefined;
                this.disposables.forEach(d => d.dispose());
                this.disposables = [];
            },
            null,
            this.disposables
        );
    }

    private serializeResult(result: QueryExecutionResult): any {
        return {
            sql: result.sql,
            error: result.error,
            executionTime: result.executionTime,
            result: result.result ? {
                rowCount: result.result.rowCount,
                affectedRows: result.result.affectedRows,
                rows: result.result.rows,
                fields: result.result.fields.map(f => ({
                    name: f.name,
                    type: this.getFieldTypeName(f)
                }))
            } : undefined
        };
    }

    private getFieldTypeName(field: any): string {
        // mysql2 field types
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

    private getHtmlContent(webview: vscode.Webview): string {
        const htmlPath = path.join(
            this.context.extensionPath,
            'src',
            'ui',
            'webviews',
            'webviewContent',
            'results.html'
        );

        let html = fs.readFileSync(htmlPath, 'utf8');

        // Replace CSP source placeholder
        const cspSource = webview.cspSource;
        html = html.replace(/{{cspSource}}/g, cspSource);

        return html;
    }

    private async handleExport(tabIndex?: number): Promise<void> {
        try {
            // Determine which result to export
            const index = tabIndex !== undefined ? tabIndex : 0;

            if (index < 0 || index >= this.currentResults.length) {
                vscode.window.showErrorMessage('Invalid result set selected for export.');
                return;
            }

            const result = this.currentResults[index];

            // Check if result has data
            if (result.error) {
                vscode.window.showErrorMessage('Cannot export result with errors.');
                return;
            }

            if (!result.result || result.result.rows.length === 0) {
                vscode.window.showWarningMessage('No data to export.');
                return;
            }

            // Export using export manager
            await this.exportManager.exportWithDialog(result.result);
        } catch (error) {
            logger.error('Export failed', error as Error);
            vscode.window.showErrorMessage(`Export failed: ${(error as Error).message}`);
        }
    }

    public dispose() {
        this.panel?.dispose();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
