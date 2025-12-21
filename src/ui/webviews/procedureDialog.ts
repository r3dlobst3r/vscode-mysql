import * as vscode from 'vscode';
import { MySQLClient } from '../../mysqlClient';
import { logger } from '../../utils/logger';

export class ProcedureDialog {
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
                'mysqlProcedureDialog',
                'Create Stored Procedure',
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
                        await this.handleCreateProcedure(connectionId, database, message.procedureName, message.parameters, message.body);
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

    private async handleCreateProcedure(
        connectionId: string,
        database: string,
        procedureName: string,
        parameters: string,
        body: string
    ): Promise<void> {
        try {
            // Build CREATE PROCEDURE statement
            let sql = `DELIMITER $$\n\n`;
            sql += `CREATE PROCEDURE \`${database}\`.\`${procedureName}\`(${parameters})\n`;
            sql += `BEGIN\n`;
            sql += `${body}\n`;
            sql += `END$$\n\n`;
            sql += `DELIMITER ;`;

            logger.debug(`Creating procedure with SQL: ${sql}`);

            // Execute with custom delimiter handling
            await this.mysqlClient.executeQuery(connectionId, sql);

            vscode.window.showInformationMessage(`Procedure "${procedureName}" created successfully!`);
            logger.info(`Procedure created: ${database}.${procedureName}`);
        } catch (error) {
            logger.error('Failed to create procedure', error as Error);
            vscode.window.showErrorMessage(`Failed to create procedure: ${(error as Error).message}`);
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
        .example {
            background: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textBlockQuote-border);
            padding: 10px;
            margin-top: 10px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <h2>Create Stored Procedure in "${database}"</h2>

    <div class="form-group">
        <label for="procedureName">Procedure Name:</label>
        <input type="text" id="procedureName" placeholder="my_procedure" />
        <div id="procedureNameError" class="error"></div>
    </div>

    <div class="form-group">
        <label for="parameters">Parameters:</label>
        <input type="text" id="parameters" placeholder="IN param1 INT, OUT param2 VARCHAR(100)" />
        <div class="hint">Leave empty if no parameters</div>
        <div class="example">Example: IN user_id INT, OUT user_name VARCHAR(100)</div>
    </div>

    <div class="form-group">
        <label for="body">Procedure Body:</label>
        <textarea id="body" rows="12" placeholder="    SELECT name INTO user_name FROM users WHERE id = user_id;"></textarea>
        <div class="hint">Enter the SQL statements (without BEGIN/END)</div>
        <div id="bodyError" class="error"></div>
    </div>

    <div class="buttons">
        <button class="primary" onclick="createProcedure()">Create Procedure</button>
        <button class="secondary" onclick="cancel()">Cancel</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function createProcedure() {
            const procedureName = document.getElementById('procedureName').value.trim();
            const parameters = document.getElementById('parameters').value.trim();
            const body = document.getElementById('body').value.trim();
            const nameError = document.getElementById('procedureNameError');
            const bodyError = document.getElementById('bodyError');

            // Clear previous errors
            nameError.textContent = '';
            bodyError.textContent = '';

            // Validate procedure name
            if (!procedureName) {
                nameError.textContent = 'Procedure name is required';
                return;
            }

            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(procedureName)) {
                nameError.textContent = 'Procedure name must start with letter or underscore and contain only letters, numbers, and underscores';
                return;
            }

            // Validate body
            if (!body) {
                bodyError.textContent = 'Procedure body is required';
                return;
            }

            vscode.postMessage({
                command: 'create',
                procedureName: procedureName,
                parameters: parameters,
                body: body
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
