import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import { logger } from './utils/logger';
import { CONFIG_CONNECTIONS, AuthenticationType, SSLMode } from './utils/constants';

export interface MySQLConnection {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    database?: string;
    authenticationType: AuthenticationType;
    ssl?: {
        mode: SSLMode;
        ca?: string;
        cert?: string;
        key?: string;
    };
    connectTimeout?: number;
    clientFlags?: string;
    sqlMode?: string;
}

export interface ConnectionCredentials {
    password?: string;
    azureToken?: string;
}

export class ConnectionManager {
    private context: vscode.ExtensionContext;
    private secretStorage: vscode.SecretStorage;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.secretStorage = context.secrets;
    }

    /**
     * Get all saved connections
     */
    public async getConnections(): Promise<MySQLConnection[]> {
        const config = vscode.workspace.getConfiguration();
        const connections = config.get<MySQLConnection[]>(CONFIG_CONNECTIONS, []);
        logger.debug(`Retrieved ${connections.length} connections from settings`);
        return connections;
    }

    /**
     * Get a single connection by ID
     */
    public async getConnection(id: string): Promise<MySQLConnection | undefined> {
        const connections = await this.getConnections();
        return connections.find(conn => conn.id === id);
    }

    /**
     * Save a new connection or update existing
     */
    public async saveConnection(connection: MySQLConnection, credentials?: ConnectionCredentials): Promise<void> {
        try {
            // Ensure connection has an ID
            if (!connection.id) {
                connection.id = randomUUID();
            }

            // Save connection metadata (without password)
            const connections = await this.getConnections();
            const existingIndex = connections.findIndex(conn => conn.id === connection.id);

            if (existingIndex >= 0) {
                connections[existingIndex] = connection;
                logger.info(`Updated connection: ${connection.name}`);
            } else {
                connections.push(connection);
                logger.info(`Added new connection: ${connection.name}`);
            }

            const config = vscode.workspace.getConfiguration();
            await config.update(CONFIG_CONNECTIONS, connections, vscode.ConfigurationTarget.Global);

            // Save credentials securely
            if (credentials) {
                await this.saveCredentials(connection.id, credentials);
            }
        } catch (error) {
            logger.error('Failed to save connection', error as Error);
            throw error;
        }
    }

    /**
     * Delete a connection
     */
    public async deleteConnection(id: string): Promise<void> {
        try {
            const connections = await this.getConnections();
            const filtered = connections.filter(conn => conn.id !== id);

            const config = vscode.workspace.getConfiguration();
            await config.update(CONFIG_CONNECTIONS, filtered, vscode.ConfigurationTarget.Global);

            // Delete credentials
            await this.deleteCredentials(id);

            logger.info(`Deleted connection: ${id}`);
        } catch (error) {
            logger.error('Failed to delete connection', error as Error);
            throw error;
        }
    }

    /**
     * Save connection credentials (password or Azure token) to secure storage
     */
    private async saveCredentials(connectionId: string, credentials: ConnectionCredentials): Promise<void> {
        const credentialsJson = JSON.stringify(credentials);
        await this.secretStorage.store(`connection-${connectionId}`, credentialsJson);
        logger.debug(`Saved credentials for connection: ${connectionId}`);
    }

    /**
     * Get connection credentials from secure storage
     */
    public async getCredentials(connectionId: string): Promise<ConnectionCredentials | undefined> {
        const credentialsJson = await this.secretStorage.get(`connection-${connectionId}`);
        if (credentialsJson) {
            try {
                return JSON.parse(credentialsJson);
            } catch (error) {
                logger.error(`Failed to parse credentials for connection: ${connectionId}`, error as Error);
                return undefined;
            }
        }
        return undefined;
    }

    /**
     * Delete connection credentials from secure storage
     */
    private async deleteCredentials(connectionId: string): Promise<void> {
        await this.secretStorage.delete(`connection-${connectionId}`);
        logger.debug(`Deleted credentials for connection: ${connectionId}`);
    }

    /**
     * Test if a connection can be established
     */
    public async testConnection(connection: MySQLConnection, credentials: ConnectionCredentials): Promise<{ success: boolean; error?: string }> {
        // This will be implemented when we create the MySQLClient
        // For now, return a placeholder
        logger.debug(`Testing connection: ${connection.name}`);
        return { success: true };
    }
}
