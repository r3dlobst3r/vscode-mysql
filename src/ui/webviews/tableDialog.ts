import * as vscode from 'vscode';
import * as path from 'path';
import { MySQLClient } from '../../mysqlClient';
import { logger } from '../../utils/logger';

export class TableDialog {
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
                'mysqlTableDialog',
                'Create Table',
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
                        await this.handleCreateTable(connectionId, database, message.tableName, message.columns);
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

    private async handleCreateTable(
        connectionId: string,
        database: string,
        tableName: string,
        columns: Array<{name: string, type: string, length: string, nullable: boolean, primaryKey: boolean, autoIncrement: boolean}>
    ): Promise<void> {
        try {
            // Build CREATE TABLE statement
            const columnDefs = columns.map(col => {
                let def = `\`${col.name}\` ${col.type}`;

                if (col.length && ['VARCHAR', 'CHAR', 'INT', 'DECIMAL'].includes(col.type.toUpperCase())) {
                    def += `(${col.length})`;
                }

                if (!col.nullable) {
                    def += ' NOT NULL';
                }

                if (col.autoIncrement) {
                    def += ' AUTO_INCREMENT';
                }

                return def;
            }).join(',\n  ');

            const primaryKeys = columns.filter(col => col.primaryKey).map(col => `\`${col.name}\``);
            const primaryKeyDef = primaryKeys.length > 0 ? `,\n  PRIMARY KEY (${primaryKeys.join(', ')})` : '';

            const sql = `CREATE TABLE \`${database}\`.\`${tableName}\` (\n  ${columnDefs}${primaryKeyDef}\n)`;

            logger.debug(`Creating table with SQL: ${sql}`);

            await this.mysqlClient.executeQuery(connectionId, sql);

            vscode.window.showInformationMessage(`Table "${tableName}" created successfully!`);
            logger.info(`Table created: ${database}.${tableName}`);
        } catch (error) {
            logger.error('Failed to create table', error as Error);
            vscode.window.showErrorMessage(`Failed to create table: ${(error as Error).message}`);
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
        input, select {
            width: 100%;
            padding: 6px 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            font-family: var(--vscode-font-family);
        }
        .columns-list {
            border: 1px solid var(--vscode-panel-border);
            margin: 10px 0;
            max-height: 300px;
            overflow-y: auto;
        }
        .column-row {
            display: grid;
            grid-template-columns: 2fr 1.5fr 1fr repeat(3, 0.8fr) 0.5fr;
            gap: 8px;
            padding: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
            align-items: center;
        }
        .column-row.header {
            background: var(--vscode-editor-background);
            font-weight: 600;
            position: sticky;
            top: 0;
        }
        .column-row input[type="text"], .column-row select {
            width: 100%;
        }
        .column-row input[type="checkbox"] {
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
        .add-column-btn {
            margin: 10px 0;
        }
        .remove-btn {
            background: var(--vscode-errorForeground);
            color: white;
            padding: 2px 8px;
            cursor: pointer;
            border: none;
        }
        .error {
            color: var(--vscode-errorForeground);
            margin-top: 5px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <h2>Create Table in "${database}"</h2>

    <div class="form-group">
        <label for="tableName">Table Name:</label>
        <input type="text" id="tableName" placeholder="my_table" />
        <div id="tableNameError" class="error"></div>
    </div>

    <h3>Columns:</h3>
    <div class="columns-list">
        <div class="column-row header">
            <div>Column Name</div>
            <div>Type</div>
            <div>Length</div>
            <div>Nullable</div>
            <div>Primary</div>
            <div>Auto Inc</div>
            <div></div>
        </div>
        <div id="columns">
            <div class="column-row" data-index="0">
                <input type="text" placeholder="id" class="col-name" value="id" />
                <select class="col-type">
                    <option value="INT" selected>INT</option>
                    <option value="VARCHAR">VARCHAR</option>
                    <option value="TEXT">TEXT</option>
                    <option value="DATETIME">DATETIME</option>
                    <option value="DECIMAL">DECIMAL</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="BIGINT">BIGINT</option>
                    <option value="DATE">DATE</option>
                    <option value="TIMESTAMP">TIMESTAMP</option>
                    <option value="JSON">JSON</option>
                </select>
                <input type="text" placeholder="11" class="col-length" value="11" />
                <input type="checkbox" class="col-nullable" />
                <input type="checkbox" class="col-primary" checked />
                <input type="checkbox" class="col-auto" checked />
                <button class="remove-btn" onclick="removeColumn(0)">×</button>
            </div>
        </div>
    </div>

    <button class="secondary add-column-btn" onclick="addColumn()">+ Add Column</button>

    <div class="buttons">
        <button class="primary" onclick="createTable()">Create Table</button>
        <button class="secondary" onclick="cancel()">Cancel</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let columnIndex = 1;

        function addColumn() {
            const container = document.getElementById('columns');
            const row = document.createElement('div');
            row.className = 'column-row';
            row.dataset.index = columnIndex;
            row.innerHTML = \`
                <input type="text" placeholder="column_name" class="col-name" />
                <select class="col-type">
                    <option value="INT">INT</option>
                    <option value="VARCHAR" selected>VARCHAR</option>
                    <option value="TEXT">TEXT</option>
                    <option value="DATETIME">DATETIME</option>
                    <option value="DECIMAL">DECIMAL</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="BIGINT">BIGINT</option>
                    <option value="DATE">DATE</option>
                    <option value="TIMESTAMP">TIMESTAMP</option>
                    <option value="JSON">JSON</option>
                </select>
                <input type="text" placeholder="255" class="col-length" value="255" />
                <input type="checkbox" class="col-nullable" checked />
                <input type="checkbox" class="col-primary" />
                <input type="checkbox" class="col-auto" />
                <button class="remove-btn" onclick="removeColumn(\${columnIndex})">×</button>
            \`;
            container.appendChild(row);
            columnIndex++;
        }

        function removeColumn(index) {
            const row = document.querySelector(\`[data-index="\${index}"]\`);
            if (row) {
                row.remove();
            }
        }

        function createTable() {
            const tableName = document.getElementById('tableName').value.trim();
            const errorEl = document.getElementById('tableNameError');

            if (!tableName) {
                errorEl.textContent = 'Table name is required';
                return;
            }

            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
                errorEl.textContent = 'Table name must start with letter or underscore and contain only letters, numbers, and underscores';
                return;
            }

            errorEl.textContent = '';

            const rows = document.querySelectorAll('#columns .column-row');
            const columns = Array.from(rows).map(row => ({
                name: row.querySelector('.col-name').value.trim(),
                type: row.querySelector('.col-type').value,
                length: row.querySelector('.col-length').value.trim(),
                nullable: row.querySelector('.col-nullable').checked,
                primaryKey: row.querySelector('.col-primary').checked,
                autoIncrement: row.querySelector('.col-auto').checked
            })).filter(col => col.name);

            if (columns.length === 0) {
                errorEl.textContent = 'At least one column is required';
                return;
            }

            vscode.postMessage({
                command: 'create',
                tableName: tableName,
                columns: columns
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
