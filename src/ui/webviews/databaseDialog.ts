import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { MySQLClient } from '../../mysqlClient';
import { logger } from '../../utils/logger';

interface CharsetInfo {
    name: string;
    description: string;
    defaultCollation: string;
}

export class DatabaseDialog {
    private panel: vscode.WebviewPanel | undefined;
    private disposables: vscode.Disposable[] = [];
    private connectionId: string | undefined;
    private onCreateCallback: (() => void) | undefined;

    constructor(
        private context: vscode.ExtensionContext,
        private mysqlClient: MySQLClient
    ) {}

    /**
     * Show the database creation dialog
     */
    public async show(connectionId: string, onSuccess?: () => void): Promise<void> {
        this.connectionId = connectionId;
        this.onCreateCallback = onSuccess;

        if (!this.panel) {
            this.createPanel();
        } else {
            this.panel.reveal(vscode.ViewColumn.One);
        }

        // Load charsets and collations
        await this.loadCharsets();
    }

    private createPanel() {
        this.panel = vscode.window.createWebviewPanel(
            'mysqlDatabaseDialog',
            'Create Database',
            vscode.ViewColumn.One,
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
                        await this.loadCharsets();
                        break;

                    case 'create':
                        await this.handleCreate(message.name, message.charset, message.collation);
                        break;

                    case 'cancel':
                        this.panel?.dispose();
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

    private async loadCharsets() {
        try {
            if (!this.connectionId) {
                return;
            }

            // Query available charsets
            const charsetsResult = await this.mysqlClient.executeQuery(
                this.connectionId,
                'SHOW CHARACTER SET'
            );

            const charsets: CharsetInfo[] = charsetsResult.rows.map((row: any) => ({
                name: row.Charset,
                description: row.Description,
                defaultCollation: row['Default collation']
            }));

            // Query collations for each charset
            const collationsResult = await this.mysqlClient.executeQuery(
                this.connectionId,
                'SHOW COLLATION'
            );

            const collations: { [charset: string]: string[] } = {};

            for (const row of collationsResult.rows) {
                const charset = (row as any).Charset;
                const collation = (row as any).Collation;

                if (!collations[charset]) {
                    collations[charset] = [];
                }
                collations[charset].push(collation);
            }

            // Send to webview
            this.panel?.webview.postMessage({
                command: 'loadCharsets',
                charsets: charsets,
                collations: collations
            });

        } catch (error) {
            logger.error('Failed to load charsets', error as Error);
            vscode.window.showErrorMessage(`Failed to load charsets: ${(error as Error).message}`);
        }
    }

    private async handleCreate(name: string, charset: string | null, collation: string | null) {
        try {
            if (!this.connectionId) {
                throw new Error('No connection selected');
            }

            // Build CREATE DATABASE statement
            let sql = `CREATE DATABASE \`${name}\``;

            if (charset) {
                sql += ` CHARACTER SET ${charset}`;
            }

            if (collation) {
                sql += ` COLLATE ${collation}`;
            }

            // Execute CREATE DATABASE
            await this.mysqlClient.executeQuery(this.connectionId, sql);

            // Show success message
            this.panel?.webview.postMessage({
                command: 'createSuccess',
                message: `Database "${name}" created successfully!`
            });

            // Call success callback
            if (this.onCreateCallback) {
                this.onCreateCallback();
            }

            // Close dialog after a short delay
            setTimeout(() => {
                this.panel?.dispose();
            }, 1500);

        } catch (error) {
            logger.error('Failed to create database', error as Error);

            this.panel?.webview.postMessage({
                command: 'createError',
                message: (error as Error).message
            });
        }
    }

    private getHtmlContent(webview: vscode.Webview): string {
        const htmlPath = path.join(
            this.context.extensionPath,
            'src',
            'ui',
            'webviews',
            'webviewContent',
            'database.html'
        );

        let html = fs.readFileSync(htmlPath, 'utf8');

        // Replace CSP source placeholder
        const cspSource = webview.cspSource;
        html = html.replace(/{{cspSource}}/g, cspSource);

        return html;
    }

    public dispose() {
        this.panel?.dispose();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
