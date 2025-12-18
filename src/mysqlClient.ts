import * as mysql from 'mysql2/promise';
import { MySQLConnection, ConnectionCredentials } from './connectionManager';
import { logger } from './utils/logger';
import { SSLMode, DEFAULT_CONNECT_TIMEOUT } from './utils/constants';

export interface QueryResult {
    rows: any[];
    fields: mysql.FieldPacket[];
    rowCount: number;
    affectedRows?: number;
    executionTime: number;
}

export interface FieldInfo {
    name: string;
    type: string;
    nullable: boolean;
}

export class MySQLClient {
    private connections: Map<string, mysql.Connection> = new Map();

    /**
     * Create a connection to MySQL
     */
    public async connect(connection: MySQLConnection, credentials: ConnectionCredentials): Promise<void> {
        try {
            logger.info(`Connecting to MySQL server: ${connection.host}:${connection.port}`);

            const config: mysql.ConnectionOptions = {
                host: connection.host,
                port: connection.port || 3306,
                user: connection.username,
                password: credentials.password || credentials.azureToken,
                database: connection.database,
                connectTimeout: (connection.connectTimeout || DEFAULT_CONNECT_TIMEOUT) * 1000, // Convert to milliseconds
            };

            // Configure SSL
            if (connection.ssl && connection.ssl.mode !== SSLMode.Disable) {
                switch (connection.ssl.mode) {
                    case SSLMode.Require:
                        config.ssl = {
                            rejectUnauthorized: false
                        };
                        break;
                    case SSLMode.VerifyCA:
                        config.ssl = {
                            rejectUnauthorized: true,
                            ca: connection.ssl.ca
                        };
                        break;
                    case SSLMode.VerifyIdentity:
                        config.ssl = {
                            rejectUnauthorized: true,
                            ca: connection.ssl.ca,
                            cert: connection.ssl.cert,
                            key: connection.ssl.key
                        };
                        break;
                }
            }

            // Create connection
            const mysqlConnection = await mysql.createConnection(config);

            // Store connection
            this.connections.set(connection.id, mysqlConnection);

            logger.info(`Successfully connected to MySQL server: ${connection.host}:${connection.port}`);
        } catch (error) {
            logger.error(`Failed to connect to MySQL server: ${connection.host}:${connection.port}`, error as Error);
            throw error;
        }
    }

    /**
     * Disconnect from MySQL
     */
    public async disconnect(connectionId: string): Promise<void> {
        const connection = this.connections.get(connectionId);
        if (connection) {
            try {
                await connection.end();
                this.connections.delete(connectionId);
                logger.info(`Disconnected from MySQL server: ${connectionId}`);
            } catch (error) {
                logger.error(`Failed to disconnect from MySQL server: ${connectionId}`, error as Error);
                throw error;
            }
        }
    }

    /**
     * Check if connected
     */
    public isConnected(connectionId: string): boolean {
        return this.connections.has(connectionId);
    }

    /**
     * Get connection
     */
    private getConnection(connectionId: string): mysql.Connection {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            throw new Error(`No active connection found for ID: ${connectionId}`);
        }
        return connection;
    }

    /**
     * Execute a query
     */
    public async executeQuery(connectionId: string, sql: string): Promise<QueryResult> {
        const connection = this.getConnection(connectionId);

        try {
            logger.debug(`Executing query: ${sql.substring(0, 100)}...`);
            const startTime = Date.now();

            const [rows, fields] = await connection.query(sql);

            const executionTime = Date.now() - startTime;

            let result: QueryResult;

            if (Array.isArray(rows)) {
                // SELECT query
                result = {
                    rows: rows as any[],
                    fields: fields as mysql.FieldPacket[],
                    rowCount: rows.length,
                    executionTime
                };
            } else {
                // INSERT, UPDATE, DELETE query
                const okPacket = rows as mysql.OkPacket;
                result = {
                    rows: [],
                    fields: [],
                    rowCount: 0,
                    affectedRows: okPacket.affectedRows,
                    executionTime
                };
            }

            logger.info(`Query executed successfully in ${executionTime}ms, ${result.rowCount} rows returned`);
            return result;

        } catch (error) {
            logger.error('Query execution failed', error as Error);
            throw error;
        }
    }

    /**
     * Execute multiple statements (split and execute separately)
     */
    public async executeMultipleStatements(connectionId: string, sql: string): Promise<QueryResult[]> {
        const connection = this.getConnection(connectionId);

        try {
            logger.debug(`Executing multiple statements`);
            const startTime = Date.now();

            // Split SQL statements by semicolon (simple approach)
            const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
            const queryResults: QueryResult[] = [];

            for (const statement of statements) {
                const result = await this.executeQuery(connectionId, statement);
                queryResults.push(result);
            }

            const executionTime = Date.now() - startTime;
            logger.info(`Multiple statements executed successfully in ${executionTime}ms`);
            return queryResults;

        } catch (error) {
            logger.error('Multiple statement execution failed', error as Error);
            throw error;
        }
    }

    /**
     * Test connection without storing it
     */
    public async testConnection(connection: MySQLConnection, credentials: ConnectionCredentials): Promise<void> {
        try {
            logger.info(`Testing connection to: ${connection.host}:${connection.port}`);

            const config: mysql.ConnectionOptions = {
                host: connection.host,
                port: connection.port || 3306,
                user: connection.username,
                password: credentials.password || credentials.azureToken,
                database: connection.database,
                connectTimeout: (connection.connectTimeout || DEFAULT_CONNECT_TIMEOUT) * 1000,
            };

            // Configure SSL
            if (connection.ssl && connection.ssl.mode !== SSLMode.Disable) {
                switch (connection.ssl.mode) {
                    case SSLMode.Require:
                        config.ssl = { rejectUnauthorized: false };
                        break;
                    case SSLMode.VerifyCA:
                        config.ssl = { rejectUnauthorized: true, ca: connection.ssl.ca };
                        break;
                    case SSLMode.VerifyIdentity:
                        config.ssl = {
                            rejectUnauthorized: true,
                            ca: connection.ssl.ca,
                            cert: connection.ssl.cert,
                            key: connection.ssl.key
                        };
                        break;
                }
            }

            const testConnection = await mysql.createConnection(config);
            await testConnection.ping();
            await testConnection.end();

            logger.info(`Connection test successful: ${connection.host}:${connection.port}`);
        } catch (error) {
            logger.error(`Connection test failed: ${connection.host}:${connection.port}`, error as Error);
            throw error;
        }
    }

    /**
     * Dispose all connections
     */
    public async dispose(): Promise<void> {
        for (const [id, connection] of this.connections) {
            try {
                await connection.end();
                logger.debug(`Closed connection: ${id}`);
            } catch (error) {
                logger.error(`Failed to close connection: ${id}`, error as Error);
            }
        }
        this.connections.clear();
    }
}
