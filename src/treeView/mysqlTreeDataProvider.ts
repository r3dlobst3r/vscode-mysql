import * as vscode from 'vscode';
import { ConnectionManager } from '../connectionManager';
import { MySQLClient } from '../mysqlClient';
import { TreeItemNode, ConnectionNode } from './treeItems';
import { logger } from '../utils/logger';

export class MySQLTreeDataProvider implements vscode.TreeDataProvider<TreeItemNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItemNode | undefined | null | void> = new vscode.EventEmitter<TreeItemNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItemNode | undefined | null | void> = this._onDidChangeTreeData.event;

    private connectedConnectionIds: Set<string> = new Set();

    constructor(
        private connectionManager: ConnectionManager,
        private mysqlClient: MySQLClient
    ) { }

    refresh(element?: TreeItemNode): void {
        this._onDidChangeTreeData.fire(element);
    }

    getTreeItem(element: TreeItemNode): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TreeItemNode): Promise<TreeItemNode[]> {
        if (!element) {
            // Root level - show all connections
            return this.getConnections();
        }

        // Get children from the element
        return element.getChildren();
    }

    private async getConnections(): Promise<ConnectionNode[]> {
        try {
            const connections = await this.connectionManager.getConnections();
            return connections.map(conn => {
                const isConnected = this.connectedConnectionIds.has(conn.id);
                return new ConnectionNode(conn, isConnected);
            });
        } catch (error) {
            logger.error('Failed to get connections', error as Error);
            vscode.window.showErrorMessage('Failed to load MySQL connections');
            return [];
        }
    }

    /**
     * Mark a connection as connected
     */
    public setConnectionConnected(connectionId: string, connected: boolean): void {
        if (connected) {
            this.connectedConnectionIds.add(connectionId);
        } else {
            this.connectedConnectionIds.delete(connectionId);
        }
        this.refresh();
    }

    /**
     * Check if a connection is connected
     */
    public isConnectionConnected(connectionId: string): boolean {
        return this.connectedConnectionIds.has(connectionId);
    }

    /**
     * Get a connection node by ID
     */
    public async getConnectionNode(connectionId: string): Promise<ConnectionNode | undefined> {
        const connections = await this.getConnections();
        return connections.find(node => node.connection.id === connectionId);
    }
}
