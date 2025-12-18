import * as vscode from 'vscode';
import { MySQLConnection } from '../connectionManager';
import { MetadataProvider } from '../metadata/metadataProvider';
import {
    CONTEXT_CONNECTION_DISCONNECTED,
    CONTEXT_CONNECTION_CONNECTED,
    CONTEXT_SERVER,
    CONTEXT_DATABASE,
    CONTEXT_TABLE,
    CONTEXT_VIEW,
    CONTEXT_PROCEDURE,
    CONTEXT_FUNCTION
} from '../utils/constants';

let metadataProvider: MetadataProvider;

export function setMetadataProvider(provider: MetadataProvider) {
    metadataProvider = provider;
}

export abstract class TreeItemNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
    }

    abstract getChildren(): Promise<TreeItemNode[]> | TreeItemNode[];
}

export class ConnectionNode extends TreeItemNode {
    public readonly connection: MySQLConnection;
    public readonly isConnected: boolean;

    constructor(connection: MySQLConnection, isConnected: boolean) {
        super(
            connection.name,
            isConnected ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        );

        this.connection = connection;
        this.isConnected = isConnected;
        this.contextValue = isConnected ? CONTEXT_CONNECTION_CONNECTED : CONTEXT_CONNECTION_DISCONNECTED;

        this.iconPath = new vscode.ThemeIcon(
            isConnected ? 'database' : 'circle-outline',
            isConnected ? new vscode.ThemeColor('charts.green') : new vscode.ThemeColor('charts.gray')
        );

        this.tooltip = `${connection.host}:${connection.port}${connection.database ? ` - ${connection.database}` : ''}`;
        this.description = `${connection.host}:${connection.port}`;
    }

    async getChildren(): Promise<TreeItemNode[]> {
        if (!this.isConnected) {
            return [];
        }
        // Return server node
        return [new ServerNode(this.connection.id)];
    }
}

export class ServerNode extends TreeItemNode {
    public readonly connectionId: string;

    constructor(connectionId: string) {
        super('Databases', vscode.TreeItemCollapsibleState.Collapsed);
        this.connectionId = connectionId;
        this.contextValue = CONTEXT_SERVER;
        this.iconPath = new vscode.ThemeIcon('server');
    }

    async getChildren(): Promise<TreeItemNode[]> {
        if (!metadataProvider) {
            return [];
        }

        try {
            const databases = await metadataProvider.getDatabases(this.connectionId);
            return databases.map(db => new DatabaseNode(this.connectionId, db.name));
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load databases: ${(error as Error).message}`);
            return [];
        }
    }
}

export class DatabaseNode extends TreeItemNode {
    public readonly connectionId: string;
    public readonly database: string;

    constructor(connectionId: string, database: string) {
        super(database, vscode.TreeItemCollapsibleState.Collapsed);
        this.connectionId = connectionId;
        this.database = database;
        this.contextValue = CONTEXT_DATABASE;
        this.iconPath = new vscode.ThemeIcon('database');
    }

    async getChildren(): Promise<TreeItemNode[]> {
        return [
            new FolderNode(this.connectionId, this.database, 'Tables', 'table'),
            new FolderNode(this.connectionId, this.database, 'Views', 'view'),
            new FolderNode(this.connectionId, this.database, 'Stored Procedures', 'procedure'),
            new FolderNode(this.connectionId, this.database, 'Functions', 'function')
        ];
    }
}

export class FolderNode extends TreeItemNode {
    public readonly connectionId: string;
    public readonly database: string;
    public readonly folderType: string;

    constructor(connectionId: string, database: string, label: string, folderType: string) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.connectionId = connectionId;
        this.database = database;
        this.folderType = folderType;
        this.contextValue = `folder-${folderType}`;
        this.iconPath = new vscode.ThemeIcon('folder');
    }

    async getChildren(): Promise<TreeItemNode[]> {
        if (!metadataProvider) {
            return [];
        }

        try {
            switch (this.folderType) {
                case 'table':
                    const tables = await metadataProvider.getTablesOnly(this.connectionId, this.database);
                    return tables.map(t => new TableNode(this.connectionId, this.database, t.name));

                case 'view':
                    const views = await metadataProvider.getViews(this.connectionId, this.database);
                    return views.map(v => new ViewNode(this.connectionId, this.database, v.name));

                case 'procedure':
                    const procedures = await metadataProvider.getProcedures(this.connectionId, this.database);
                    return procedures.map(p => new ProcedureNode(this.connectionId, this.database, p.name));

                case 'function':
                    const functions = await metadataProvider.getFunctions(this.connectionId, this.database);
                    return functions.map(f => new FunctionNode(this.connectionId, this.database, f.name));

                default:
                    return [];
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load ${this.folderType}s: ${(error as Error).message}`);
            return [];
        }
    }
}

export class TableNode extends TreeItemNode {
    public readonly connectionId: string;
    public readonly database: string;
    public readonly table: string;

    constructor(connectionId: string, database: string, table: string) {
        super(table, vscode.TreeItemCollapsibleState.Collapsed);
        this.connectionId = connectionId;
        this.database = database;
        this.table = table;
        this.contextValue = CONTEXT_TABLE;
        this.iconPath = new vscode.ThemeIcon('table');
    }

    async getChildren(): Promise<TreeItemNode[]> {
        // Could show columns here in the future
        return [];
    }
}

export class ViewNode extends TreeItemNode {
    public readonly connectionId: string;
    public readonly database: string;
    public readonly view: string;

    constructor(connectionId: string, database: string, view: string) {
        super(view, vscode.TreeItemCollapsibleState.None);
        this.connectionId = connectionId;
        this.database = database;
        this.view = view;
        this.contextValue = CONTEXT_VIEW;
        this.iconPath = new vscode.ThemeIcon('eye');
    }

    async getChildren(): Promise<TreeItemNode[]> {
        return [];
    }
}

export class ProcedureNode extends TreeItemNode {
    public readonly connectionId: string;
    public readonly database: string;
    public readonly procedure: string;

    constructor(connectionId: string, database: string, procedure: string) {
        super(procedure, vscode.TreeItemCollapsibleState.None);
        this.connectionId = connectionId;
        this.database = database;
        this.procedure = procedure;
        this.contextValue = CONTEXT_PROCEDURE;
        this.iconPath = new vscode.ThemeIcon('symbol-method');
    }

    async getChildren(): Promise<TreeItemNode[]> {
        return [];
    }
}

export class FunctionNode extends TreeItemNode {
    public readonly connectionId: string;
    public readonly database: string;
    public readonly func: string;

    constructor(connectionId: string, database: string, func: string) {
        super(func, vscode.TreeItemCollapsibleState.None);
        this.connectionId = connectionId;
        this.database = database;
        this.func = func;
        this.contextValue = CONTEXT_FUNCTION;
        this.iconPath = new vscode.ThemeIcon('symbol-function');
    }

    async getChildren(): Promise<TreeItemNode[]> {
        return [];
    }
}
