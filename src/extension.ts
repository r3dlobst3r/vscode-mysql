import * as vscode from 'vscode';
import { ConnectionManager } from './connectionManager';
import { MySQLClient } from './mysqlClient';
import { MySQLTreeDataProvider } from './treeView/mysqlTreeDataProvider';
import { ConnectionNode, setMetadataProvider, TableNode, ViewNode, DatabaseNode } from './treeView/treeItems';
import { ConnectionDialog } from './ui/webviews/connectionDialog';
import { DatabaseDialog } from './ui/webviews/databaseDialog';
import { MetadataProvider } from './metadata/metadataProvider';
import { QueryRunner } from './queries/queryRunner';
import { ResultsPanel } from './ui/webviews/resultsPanel';
import { getQueryFromEditor } from './queries/queryParser';
import { TokenManager } from './auth/tokenManager';
import { logger } from './utils/logger';
import { MySQLCompletionProvider } from './language/completionProvider';
import { MySQLHoverProvider } from './language/hoverProvider';
import { MySQLFormattingProvider } from './language/formattingProvider';
import { FirewallManager } from './azure/firewallManager';
import { ResourceDetector } from './azure/resourceDetector';
import {
    COMMAND_CONNECT,
    COMMAND_DISCONNECT,
    COMMAND_EDIT_CONNECTION,
    COMMAND_DELETE_CONNECTION,
    COMMAND_REFRESH_CONNECTION,
    COMMAND_EXECUTE_QUERY,
    COMMAND_NEW_QUERY,
    COMMAND_CREATE_DATABASE,
    COMMAND_DROP_DATABASE,
    COMMAND_EXPORT_RESULTS,
    COMMAND_DEPLOY_AZURE,
    COMMAND_SELECT_TOP_1000,
    COMMAND_VIEW_TABLE_STRUCTURE,
    COMMAND_SCRIPT_AS_CREATE
} from './utils/constants';

let connectionManager: ConnectionManager;
let mysqlClient: MySQLClient;
let treeDataProvider: MySQLTreeDataProvider;
let connectionDialog: ConnectionDialog;
let databaseDialog: DatabaseDialog;
let metadataProvider: MetadataProvider;
let queryRunner: QueryRunner;
let resultsPanel: ResultsPanel;
let tokenManager: TokenManager;
let completionProvider: MySQLCompletionProvider;
let hoverProvider: MySQLHoverProvider;
let formattingProvider: MySQLFormattingProvider;
let firewallManager: FirewallManager;

export function activate(context: vscode.ExtensionContext) {
    logger.info('MySQL extension is now active');

    // Initialize managers
    connectionManager = new ConnectionManager(context);
    mysqlClient = new MySQLClient();
    tokenManager = new TokenManager(context);
    firewallManager = new FirewallManager();
    connectionDialog = new ConnectionDialog(context, connectionManager, mysqlClient, tokenManager);
    databaseDialog = new DatabaseDialog(context, mysqlClient);
    metadataProvider = new MetadataProvider(mysqlClient);
    queryRunner = new QueryRunner(mysqlClient);
    resultsPanel = new ResultsPanel(context);

    // Set metadata provider for tree items
    setMetadataProvider(metadataProvider);

    // Initialize tree view
    treeDataProvider = new MySQLTreeDataProvider(connectionManager, mysqlClient);
    const treeView = vscode.window.createTreeView('mysqlConnections', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true
    });

    // Initialize language features
    completionProvider = new MySQLCompletionProvider();
    hoverProvider = new MySQLHoverProvider();
    formattingProvider = new MySQLFormattingProvider();

    // Register language features for SQL files
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider('sql', completionProvider, '.', '`'),
        vscode.languages.registerHoverProvider('sql', hoverProvider),
        vscode.languages.registerDocumentFormattingEditProvider('sql', formattingProvider),
        vscode.languages.registerDocumentRangeFormattingEditProvider('sql', formattingProvider)
    );

    // Auto-connect on startup if configured
    const autoConnect = vscode.workspace.getConfiguration().get<boolean>('mysql.autoConnectOnStartup', false);
    if (autoConnect) {
        const defaultConnectionId = vscode.workspace.getConfiguration().get<string>('mysql.defaultConnection', '');
        if (defaultConnectionId) {
            setTimeout(async () => {
                const connections = await connectionManager.getConnections();
                const defaultConnection = connections.find(c => c.id === defaultConnectionId);
                if (defaultConnection) {
                    const node = await treeDataProvider.getConnectionNode(defaultConnection.id);
                    if (node) {
                        await handleConnect(node);
                    }
                }
            }, 1000); // Delay to allow extension to fully activate
        }
    }

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_CONNECT, async (node?: ConnectionNode) => {
            await handleConnect(node);
        }),

        vscode.commands.registerCommand(COMMAND_DISCONNECT, async (node: ConnectionNode) => {
            await handleDisconnect(node);
        }),

        vscode.commands.registerCommand(COMMAND_EDIT_CONNECTION, async (node: ConnectionNode) => {
            await handleEditConnection(node);
        }),

        vscode.commands.registerCommand(COMMAND_DELETE_CONNECTION, async (node: ConnectionNode) => {
            await handleDeleteConnection(node);
        }),

        vscode.commands.registerCommand(COMMAND_REFRESH_CONNECTION, async (node?: ConnectionNode) => {
            treeDataProvider.refresh(node);
        }),

        vscode.commands.registerCommand(COMMAND_EXECUTE_QUERY, async () => {
            await handleExecuteQuery();
        }),

        vscode.commands.registerCommand(COMMAND_NEW_QUERY, async (node: ConnectionNode) => {
            await handleNewQuery(node);
        }),

        vscode.commands.registerCommand(COMMAND_CREATE_DATABASE, async (node: ConnectionNode) => {
            await handleCreateDatabase(node);
        }),

        vscode.commands.registerCommand(COMMAND_DROP_DATABASE, async (node: any) => {
            await handleDropDatabase(node);
        }),

        vscode.commands.registerCommand(COMMAND_EXPORT_RESULTS, async () => {
            await handleExportResults();
        }),

        vscode.commands.registerCommand(COMMAND_DEPLOY_AZURE, async () => {
            await handleDeployAzure();
        }),

        vscode.commands.registerCommand(COMMAND_SELECT_TOP_1000, async (node: TableNode) => {
            await handleSelectTop1000(node);
        }),

        vscode.commands.registerCommand(COMMAND_VIEW_TABLE_STRUCTURE, async (node: TableNode) => {
            await handleViewTableStructure(node);
        }),

        vscode.commands.registerCommand(COMMAND_SCRIPT_AS_CREATE, async (node: TableNode | ViewNode) => {
            await handleScriptAsCreate(node);
        }),

        treeView,
        resultsPanel,
        databaseDialog,
        logger
    );

    logger.info('MySQL extension activated successfully');
}

// Command handlers

async function handleConnect(node?: ConnectionNode) {
    try {
        if (node) {
            // Connect to existing connection
            const connection = node.connection;
            let credentials = await connectionManager.getCredentials(connection.id);

            // Handle Azure AD authentication
            if (connection.authenticationType === 'AzureMFAAndUser') {
                // Try to get existing token or authenticate
                let token = await tokenManager.getAccessToken(connection.id);

                if (!token) {
                    // No valid token, need to authenticate
                    vscode.window.showInformationMessage('Azure AD authentication required');
                    token = await tokenManager.authenticateAndStoreToken(connection.id);

                    if (!token) {
                        vscode.window.showErrorMessage('Azure AD authentication failed or was cancelled');
                        return;
                    }
                }

                // Use token as credential
                credentials = { azureToken: token };
            } else {
                // SQL Login - require password
                if (!credentials || !credentials.password) {
                    vscode.window.showErrorMessage('No password found for this connection. Please edit the connection to add a password.');
                    return;
                }
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Connecting to ${connection.name}...`,
                cancellable: false
            }, async () => {
                await mysqlClient.connect(connection, credentials!);
                treeDataProvider.setConnectionConnected(connection.id, true);

                // Update language providers with active connection
                completionProvider.setMySQLClient(mysqlClient, connection.id);
                hoverProvider.setMySQLClient(mysqlClient, connection.id);
            });

            vscode.window.showInformationMessage(`Connected to ${connection.name}`);
        } else {
            // Show connection dialog for new connection
            await connectionDialog.showNew();
        }
    } catch (error) {
        logger.error('Failed to connect', error as Error);

        // Check if this is an Azure MySQL connection with a firewall error
        if (node && ResourceDetector.isAzureMySQL(node.connection)) {
            if (FirewallManager.isFirewallError(error as Error)) {
                const resourceInfo = ResourceDetector.getAzureResourceInfo(node.connection);
                if (resourceInfo) {
                    const handled = await firewallManager.handleFirewallError(resourceInfo);
                    if (handled) {
                        // User created firewall rule, prompt to retry connection
                        const retry = await vscode.window.showInformationMessage(
                            'Firewall rule created. Would you like to retry the connection?',
                            'Retry',
                            'Cancel'
                        );
                        if (retry === 'Retry') {
                            await handleConnect(node);
                        }
                        return;
                    }
                }
            }
        }

        vscode.window.showErrorMessage(`Failed to connect: ${(error as Error).message}`);
    }
}

async function handleDisconnect(node: ConnectionNode) {
    try {
        await mysqlClient.disconnect(node.connection.id);
        treeDataProvider.setConnectionConnected(node.connection.id, false);
        vscode.window.showInformationMessage(`Disconnected from ${node.connection.name}`);
    } catch (error) {
        logger.error('Failed to disconnect', error as Error);
        vscode.window.showErrorMessage(`Failed to disconnect: ${(error as Error).message}`);
    }
}

async function handleEditConnection(node: ConnectionNode) {
    await connectionDialog.showEdit(node.connection);
}

async function handleDeleteConnection(node: ConnectionNode) {
    const confirmation = await vscode.window.showWarningMessage(
        `Are you sure you want to delete the connection "${node.connection.name}"?`,
        { modal: true },
        'Delete'
    );

    if (confirmation === 'Delete') {
        try {
            // Disconnect if connected
            if (treeDataProvider.isConnectionConnected(node.connection.id)) {
                await mysqlClient.disconnect(node.connection.id);
            }

            await connectionManager.deleteConnection(node.connection.id);
            treeDataProvider.refresh();
            vscode.window.showInformationMessage(`Deleted connection: ${node.connection.name}`);
        } catch (error) {
            logger.error('Failed to delete connection', error as Error);
            vscode.window.showErrorMessage(`Failed to delete connection: ${(error as Error).message}`);
        }
    }
}

async function handleExecuteQuery() {
    try {
        // Get active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor. Please open a SQL file first.');
            return;
        }

        // Extract SQL query
        const sql = getQueryFromEditor(editor);
        if (!sql) {
            vscode.window.showErrorMessage('No SQL query found. Please select a query or place cursor in a statement.');
            return;
        }

        // Get connected servers
        const connections = await connectionManager.getConnections();
        const connectedConnections = connections.filter(conn =>
            treeDataProvider.isConnectionConnected(conn.id)
        );

        if (connectedConnections.length === 0) {
            vscode.window.showErrorMessage('No active connection. Please connect to a MySQL server first.');
            return;
        }

        // Select connection if multiple are connected
        let connectionId: string;
        if (connectedConnections.length === 1) {
            connectionId = connectedConnections[0].id;
        } else {
            // Show quick pick for multiple connections
            const items = connectedConnections.map(conn => ({
                label: conn.name,
                description: `${conn.host}:${conn.port}`,
                connectionId: conn.id
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a connection to execute the query'
            });

            if (!selected) {
                return; // User cancelled
            }

            connectionId = selected.connectionId;
        }

        // Execute query with progress indicator
        const results = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Executing query...',
            cancellable: false
        }, async () => {
            return await queryRunner.executeMultipleQueries(connectionId, sql);
        });

        // Show results
        await resultsPanel.showResults(sql, results);
    } catch (error) {
        logger.error('Failed to execute query', error as Error);
        vscode.window.showErrorMessage(`Failed to execute query: ${(error as Error).message}`);
    }
}

async function handleNewQuery(node: ConnectionNode) {
    // Create a new SQL file
    const doc = await vscode.workspace.openTextDocument({
        language: 'sql',
        content: `-- New Query for ${node.connection.name}\n\n`
    });
    await vscode.window.showTextDocument(doc);
}

async function handleCreateDatabase(node: ConnectionNode) {
    try {
        // Ensure connection is connected
        if (!treeDataProvider.isConnectionConnected(node.connection.id)) {
            const connect = await vscode.window.showWarningMessage(
                'Connection is not active. Would you like to connect first?',
                'Connect',
                'Cancel'
            );

            if (connect === 'Connect') {
                await handleConnect(node);
            } else {
                return;
            }
        }

        // Show database creation dialog
        await databaseDialog.show(node.connection.id, () => {
            // Refresh tree view after database is created
            treeDataProvider.refresh(node);
            vscode.window.showInformationMessage('Database created successfully!');
        });
    } catch (error) {
        logger.error('Failed to show create database dialog', error as Error);
        vscode.window.showErrorMessage(`Failed to show create database dialog: ${(error as Error).message}`);
    }
}

async function handleDropDatabase(node: any) {
    vscode.window.showInformationMessage('Drop database not yet implemented.');
}

async function handleExportResults() {
    vscode.window.showInformationMessage('Export results not yet implemented. Coming in Phase 6!');
}

async function handleDeployAzure() {
    // Open Azure portal in browser
    const url = 'https://portal.azure.com/#create/Microsoft.MySQLFlexibleServer';
    await vscode.env.openExternal(vscode.Uri.parse(url));
}

async function handleSelectTop1000(node: TableNode) {
    try {
        // Generate SELECT query
        const sql = `SELECT * FROM \`${node.database}\`.\`${node.table}\` LIMIT 1000;`;

        // Create new document with the query
        const doc = await vscode.workspace.openTextDocument({
            language: 'sql',
            content: sql
        });

        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('Query ready. Execute it to see results (Query execution coming in Phase 5).');
    } catch (error) {
        logger.error('Failed to generate SELECT query', error as Error);
        vscode.window.showErrorMessage(`Failed to generate query: ${(error as Error).message}`);
    }
}

async function handleViewTableStructure(node: TableNode) {
    try {
        // Get table columns
        const columns = await metadataProvider.getColumns(node.connectionId, node.database, node.table);

        // Format column information
        let output = `Table: ${node.database}.${node.table}\n`;
        output += '='.repeat(80) + '\n\n';
        output += 'Column Name'.padEnd(30) + 'Type'.padEnd(25) + 'Nullable'.padEnd(10) + 'Key\n';
        output += '-'.repeat(80) + '\n';

        for (const col of columns) {
            output += col.name.padEnd(30);
            output += col.type.padEnd(25);
            output += (col.nullable ? 'YES' : 'NO').padEnd(10);
            output += col.key;
            output += '\n';
        }

        // Show in new document
        const doc = await vscode.workspace.openTextDocument({
            language: 'plaintext',
            content: output
        });

        await vscode.window.showTextDocument(doc, { preview: true });
    } catch (error) {
        logger.error('Failed to view table structure', error as Error);
        vscode.window.showErrorMessage(`Failed to view table structure: ${(error as Error).message}`);
    }
}

async function handleScriptAsCreate(node: TableNode | ViewNode) {
    try {
        let createStatement: string;

        if (node instanceof TableNode) {
            createStatement = await metadataProvider.getTableCreateStatement(node.connectionId, node.database, node.table);
        } else {
            createStatement = await metadataProvider.getViewCreateStatement(node.connectionId, node.database, node.view);
        }

        // Show in new SQL document
        const doc = await vscode.workspace.openTextDocument({
            language: 'sql',
            content: createStatement + ';\n'
        });

        await vscode.window.showTextDocument(doc);
    } catch (error) {
        logger.error('Failed to script as CREATE', error as Error);
        vscode.window.showErrorMessage(`Failed to generate CREATE statement: ${(error as Error).message}`);
    }
}

export function deactivate() {
    logger.info('MySQL extension is deactivating');
    return mysqlClient.dispose();
}
