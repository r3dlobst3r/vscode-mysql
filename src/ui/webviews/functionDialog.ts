import * as vscode from 'vscode';
import { MySQLClient } from '../../mysqlClient';
import { logger } from '../../utils/logger';

export class FunctionDialog {
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
                'mysqlFunctionDialog',
                'Create Function',
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
                        await this.handleCreateFunction(
                            connectionId,
                            database,
                            message.functionName,
                            message.parameters,
                            message.returnType,
                            message.body,
                            message.deterministic
                        );
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

    private async handleCreateFunction(
        connectionId: string,
        database: string,
        functionName: string,
        parameters: string,
        returnType: string,
        body: string,
        deterministic: boolean
    ): Promise<void> {
        try {
            // Build CREATE FUNCTION statement
            let sql = `DELIMITER $$\n\n`;
            sql += `CREATE FUNCTION \`${database}\`.\`${functionName}\`(${parameters})\n`;
            sql += `RETURNS ${returnType}\n`;
            sql += deterministic ? `DETERMINISTIC\n` : `NOT DETERMINISTIC\n`;
            sql += `BEGIN\n`;
            sql += `${body}\n`;
            sql += `END$$\n\n`;
            sql += `DELIMITER ;`;

            logger.debug(`Creating function with SQL: ${sql}`);

            await this.mysqlClient.executeQuery(connectionId, sql);

            vscode.window.showInformationMessage(`Function "${functionName}" created successfully!`);
            logger.info(`Function created: ${database}.${functionName}`);
        } catch (error) {
            logger.error('Failed to create function', error as Error);
            vscode.window.showErrorMessage(`Failed to create function: ${(error as Error).message}`);
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
        input, textarea, select {
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
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .checkbox-group input[type="checkbox"] {
            width: auto;
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
    <h2>Create Function in "${database}"</h2>

    <div class="form-group">
        <label for="functionName">Function Name:</label>
        <input type="text" id="functionName" placeholder="my_function" />
        <div id="functionNameError" class="error"></div>
    </div>

    <div class="form-group">
        <label for="parameters">Parameters:</label>
        <input type="text" id="parameters" placeholder="param1 INT, param2 VARCHAR(100)" />
        <div class="hint">Leave empty if no parameters (note: no IN/OUT keywords for functions)</div>
        <div class="example">Example: user_id INT, multiplier DECIMAL(10,2)</div>
    </div>

    <div class="form-group">
        <label for="returnType">Return Type:</label>
        <select id="returnType">
            <option value="INT">INT</option>
            <option value="VARCHAR(255)">VARCHAR(255)</option>
            <option value="DECIMAL(10,2)">DECIMAL(10,2)</option>
            <option value="TEXT">TEXT</option>
            <option value="DATETIME">DATETIME</option>
            <option value="DATE">DATE</option>
            <option value="BOOLEAN">BOOLEAN</option>
            <option value="BIGINT">BIGINT</option>
            <option value="FLOAT">FLOAT</option>
            <option value="DOUBLE">DOUBLE</option>
            <option value="JSON">JSON</option>
        </select>
    </div>

    <div class="form-group">
        <div class="checkbox-group">
            <input type="checkbox" id="deterministic" />
            <label for="deterministic" style="margin: 0;">Deterministic (returns same result for same inputs)</label>
        </div>
        <div class="hint">Check this if the function always returns the same result for the same input parameters</div>
    </div>

    <div class="form-group">
        <label for="body">Function Body:</label>
        <textarea id="body" rows="12" placeholder="    DECLARE result INT;
    SET result = param1 * 2;
    RETURN result;"></textarea>
        <div class="hint">Enter the SQL statements (without BEGIN/END). Must include RETURN statement.</div>
        <div id="bodyError" class="error"></div>
    </div>

    <div class="buttons">
        <button class="primary" onclick="createFunction()">Create Function</button>
        <button class="secondary" onclick="cancel()">Cancel</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function createFunction() {
            const functionName = document.getElementById('functionName').value.trim();
            const parameters = document.getElementById('parameters').value.trim();
            const returnType = document.getElementById('returnType').value;
            const deterministic = document.getElementById('deterministic').checked;
            const body = document.getElementById('body').value.trim();
            const nameError = document.getElementById('functionNameError');
            const bodyError = document.getElementById('bodyError');

            // Clear previous errors
            nameError.textContent = '';
            bodyError.textContent = '';

            // Validate function name
            if (!functionName) {
                nameError.textContent = 'Function name is required';
                return;
            }

            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(functionName)) {
                nameError.textContent = 'Function name must start with letter or underscore and contain only letters, numbers, and underscores';
                return;
            }

            // Validate body
            if (!body) {
                bodyError.textContent = 'Function body is required';
                return;
            }

            if (!body.toUpperCase().includes('RETURN')) {
                bodyError.textContent = 'Function body must include a RETURN statement';
                return;
            }

            vscode.postMessage({
                command: 'create',
                functionName: functionName,
                parameters: parameters,
                returnType: returnType,
                deterministic: deterministic,
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
