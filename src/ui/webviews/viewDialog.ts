import * as vscode from 'vscode';
import { MySQLClient } from '../../mysqlClient';
import { logger } from '../../utils/logger';

export class ViewDialog {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private mysqlClient: MySQLClient;

    constructor(context: vscode.ExtensionContext, mysqlClient: MySQLClient) {
        this.context = context;
        this.mysqlClient = mysqlClient;
    }

    public async show(connectionId: string, database: string, onSuccess?: () => void): Promise<void> {
        // Create or show panel
        if (this.panel) {
            this.panel.reveal();
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'mysqlViewDialog',
                'Create View',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }

        // Set HTML content
        this.panel.webview.html = this.getHtmlContent(this.panel.webview, database);

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'create':
                        await this.handleCreateView(connectionId, database, message.viewName, message.selectStatement);
                        if (onSuccess) {
                            onSuccess();
                        }
                        this.panel?.dispose();
                        break;
                    case 'cancel':
                        this.panel?.dispose();
                        break;
                }
            }
        );
    }

    private async handleCreateView(
        connectionId: string,
        database: string,
        viewName: string,
        selectStatement: string
    ): Promise<void> {
        try {
            // Build CREATE VIEW statement
            const sql = `CREATE VIEW \`${database}\`.\`${viewName}\` AS\n${selectStatement}`;

            logger.debug(`Creating view with SQL: ${sql}`);

            await this.mysqlClient.executeQuery(connectionId, sql);

            vscode.window.showInformationMessage(`View "${viewName}" created successfully!`);
            logger.info(`View created: ${database}.${viewName}`);
        } catch (error) {
            logger.error('Failed to create view', error as Error);
            vscode.window.showErrorMessage(`Failed to create view: ${(error as Error).message}`);
        }
    }

    private getHtmlContent(webview: vscode.Webview, database: string): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            padding: 20px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
        }
        h2 { margin-top: 0; }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
        }
        input, textarea {
            width: 100%;
            padding: 6px 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            font-family: var(--vscode-font-family);
        }
        textarea {
            font-family: 'Courier New', monospace;
            min-height: 200px;
            resize: vertical;
        }
        .buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        button {
            padding: 8px 16px;
            border: none;
            cursor: pointer;
            font-family: var(--vscode-font-family);
        }
        button.primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        button.primary:hover {
            background: var(--vscode-button-hoverBackground);
        }
        button.secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .error {
            color: var(--vscode-errorForeground);
            margin-top: 5px;
            font-size: 12px;
        }
        .hint {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <h2>Create View in "${database}"</h2>

    <div class="form-group">
        <label for="viewName">View Name:</label>
        <input type="text" id="viewName" placeholder="my_view" />
        <div id="viewNameError" class="error"></div>
    </div>

    <div class="form-group">
        <label for="selectStatement">SELECT Statement:</label>
        <textarea id="selectStatement" placeholder="SELECT id, name FROM users WHERE active = 1"></textarea>
        <div class="hint">Enter the SELECT query that defines the view (without CREATE VIEW)</div>
        <div id="selectError" class="error"></div>
    </div>

    <div class="buttons">
        <button class="primary" onclick="createView()">Create View</button>
        <button class="secondary" onclick="cancel()">Cancel</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function createView() {
            const viewName = document.getElementById('viewName').value.trim();
            const selectStatement = document.getElementById('selectStatement').value.trim();
            const nameError = document.getElementById('viewNameError');
            const selectError = document.getElementById('selectError');

            // Clear previous errors
            nameError.textContent = '';
            selectError.textContent = '';

            // Validate view name
            if (!viewName) {
                nameError.textContent = 'View name is required';
                return;
            }

            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(viewName)) {
                nameError.textContent = 'View name must start with letter or underscore and contain only letters, numbers, and underscores';
                return;
            }

            // Validate SELECT statement
            if (!selectStatement) {
                selectError.textContent = 'SELECT statement is required';
                return;
            }

            if (!selectStatement.toUpperCase().trim().startsWith('SELECT')) {
                selectError.textContent = 'Statement must start with SELECT';
                return;
            }

            vscode.postMessage({
                command: 'create',
                viewName: viewName,
                selectStatement: selectStatement
            });
        }

        function cancel() {
            vscode.postMessage({ command: 'cancel' });
        }
    </script>
</body>
</html>`;
    }

    public dispose(): void {
        this.panel?.dispose();
    }
}
