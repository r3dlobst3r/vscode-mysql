import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ConnectionManager, MySQLConnection, ConnectionCredentials } from '../../connectionManager';
import { MySQLClient } from '../../mysqlClient';
import { TokenManager } from '../../auth/tokenManager';
import { logger } from '../../utils/logger';
import { AuthenticationType, SSLMode, DEFAULT_PORT, DEFAULT_CONNECT_TIMEOUT } from '../../utils/constants';

export class ConnectionDialog {
    private panel: vscode.WebviewPanel | undefined;
    private disposables: vscode.Disposable[] = [];
    private connectionToEdit: MySQLConnection | undefined;

    constructor(
        private context: vscode.ExtensionContext,
        private connectionManager: ConnectionManager,
        private mysqlClient: MySQLClient,
        private tokenManager: TokenManager
    ) {}

    /**
     * Show the connection dialog for creating a new connection
     */
    public async showNew(): Promise<void> {
        this.connectionToEdit = undefined;
        this.createOrShow();
    }

    /**
     * Show the connection dialog for editing an existing connection
     */
    public async showEdit(connection: MySQLConnection): Promise<void> {
        this.connectionToEdit = connection;
        this.createOrShow();
    }

    private createOrShow() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (this.panel) {
            this.panel.reveal(column);
            // Send the connection data to edit
            if (this.connectionToEdit) {
                this.panel.webview.postMessage({
                    command: 'loadConnection',
                    data: this.connectionToEdit
                });
            }
            return;
        }

        // Otherwise, create a new panel
        this.panel = vscode.window.createWebviewPanel(
            'mysqlConnectionDialog',
            this.connectionToEdit ? 'Edit MySQL Connection' : 'New MySQL Connection',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'ui', 'webviews', 'webviewContent'))
                ]
            }
        );

        // Set the HTML content
        this.panel.webview.html = this.getHtmlContent(this.panel.webview);

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            async message => {
                await this.handleMessage(message);
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

    private async handleMessage(message: any): Promise<void> {
        switch (message.command) {
            case 'ready':
                // Send initial data if editing
                if (this.connectionToEdit && this.panel) {
                    this.panel.webview.postMessage({
                        command: 'loadConnection',
                        data: this.connectionToEdit
                    });
                }
                break;

            case 'testConnection':
                await this.handleTestConnection(message.data);
                break;

            case 'saveConnection':
                await this.handleSaveConnection(message.data);
                break;

            case 'browseCertificate':
                await this.handleBrowseCertificate(message.fieldId);
                break;

            case 'cancel':
                this.panel?.dispose();
                break;
        }
    }

    private async handleTestConnection(formData: any): Promise<void> {
        try {
            const connection = this.formDataToConnection(formData);
            let credentials = this.formDataToCredentials(formData);

            // Handle Azure AD authentication for testing
            if (connection.authenticationType === AuthenticationType.AzureMFA) {
                // Authenticate using device code flow
                vscode.window.showInformationMessage('Azure AD authentication required for connection test');

                // For testing, we need a temporary connection ID
                const tempConnectionId = `temp-${Date.now()}`;
                const token = await this.tokenManager.authenticateAndStoreToken(tempConnectionId);

                if (!token) {
                    this.panel?.webview.postMessage({
                        command: 'testResult',
                        success: false,
                        error: 'Azure AD authentication failed or was cancelled'
                    });
                    return;
                }

                // Use token for test
                credentials = { azureToken: token };

                // Clean up temp token
                await this.tokenManager.clearToken(tempConnectionId);
            }

            // Test the connection
            await this.mysqlClient.testConnection(connection, credentials);

            // Send success message
            this.panel?.webview.postMessage({
                command: 'testResult',
                success: true
            });

            logger.info(`Connection test successful: ${connection.name}`);
        } catch (error) {
            logger.error('Connection test failed', error as Error);
            this.panel?.webview.postMessage({
                command: 'testResult',
                success: false,
                error: (error as Error).message
            });
        }
    }

    private async handleSaveConnection(formData: any): Promise<void> {
        try {
            const connection = this.formDataToConnection(formData);
            const credentials = this.formDataToCredentials(formData);

            // If editing, preserve the connection ID
            if (this.connectionToEdit) {
                connection.id = this.connectionToEdit.id;
            }

            // Save the connection
            await this.connectionManager.saveConnection(connection, credentials);

            // Send success message
            this.panel?.webview.postMessage({
                command: 'saveResult',
                success: true
            });

            logger.info(`Connection saved: ${connection.name}`);

            // Close the dialog after a short delay
            setTimeout(() => {
                this.panel?.dispose();
                // Trigger a refresh of the tree view
                vscode.commands.executeCommand('mysql.refreshConnection');
            }, 1500);

        } catch (error) {
            logger.error('Failed to save connection', error as Error);
            this.panel?.webview.postMessage({
                command: 'saveResult',
                success: false,
                error: (error as Error).message
            });
        }
    }

    private async handleBrowseCertificate(fieldId: string): Promise<void> {
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'Certificate Files': ['pem', 'crt', 'cer', 'key'],
                'All Files': ['*']
            },
            title: 'Select Certificate File'
        });

        if (result && result[0]) {
            const filePath = result[0].fsPath;
            this.panel?.webview.postMessage({
                command: 'setCertificatePath',
                fieldId: fieldId,
                path: filePath
            });
        }
    }

    private formDataToConnection(formData: any): MySQLConnection {
        const connection: MySQLConnection = {
            id: '', // Will be set later
            name: formData.name,
            host: formData.host,
            port: parseInt(formData.port) || DEFAULT_PORT,
            username: formData.username || '',
            database: formData.database || undefined,
            authenticationType: formData.authenticationType as AuthenticationType || AuthenticationType.SqlLogin,
            connectTimeout: parseInt(formData.connectTimeout) || DEFAULT_CONNECT_TIMEOUT,
            clientFlags: formData.clientFlags || undefined,
            sqlMode: formData.sqlMode || undefined
        };

        // Add SSL configuration
        const sslMode = formData.sslMode as SSLMode || SSLMode.Require;
        if (sslMode !== SSLMode.Disable) {
            connection.ssl = {
                mode: sslMode
            };

            if (sslMode === SSLMode.VerifyCA || sslMode === SSLMode.VerifyIdentity) {
                connection.ssl.ca = formData.sslCa || undefined;
            }

            if (sslMode === SSLMode.VerifyIdentity) {
                connection.ssl.cert = formData.sslCert || undefined;
                connection.ssl.key = formData.sslKey || undefined;
            }
        }

        return connection;
    }

    private formDataToCredentials(formData: any): ConnectionCredentials {
        const credentials: ConnectionCredentials = {};

        if (formData.authenticationType === AuthenticationType.SqlLogin) {
            credentials.password = formData.password;
        }
        // Azure AD authentication will be handled separately in Phase 2

        return credentials;
    }

    private getHtmlContent(webview: vscode.Webview): string {
        const htmlPath = path.join(
            this.context.extensionPath,
            'src',
            'ui',
            'webviews',
            'webviewContent',
            'connection.html'
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
