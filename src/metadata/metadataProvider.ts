import { MySQLClient } from '../mysqlClient';
import { logger } from '../utils/logger';

export interface DatabaseInfo {
    name: string;
}

export interface TableInfo {
    name: string;
    type: 'TABLE' | 'VIEW';
}

export interface RoutineInfo {
    name: string;
    type: 'PROCEDURE' | 'FUNCTION';
}

export interface ColumnInfo {
    name: string;
    type: string;
    nullable: boolean;
    key: string;
    default: string | null;
    extra: string;
}

export class MetadataProvider {
    constructor(private mysqlClient: MySQLClient) {}

    /**
     * Get list of databases
     */
    async getDatabases(connectionId: string): Promise<DatabaseInfo[]> {
        try {
            const result = await this.mysqlClient.executeQuery(connectionId, 'SHOW DATABASES');
            const databases: DatabaseInfo[] = result.rows.map(row => ({
                name: row.Database || row.database
            }));

            // Filter out system databases for cleaner view (optional)
            return databases.filter(db =>
                db.name !== 'information_schema' &&
                db.name !== 'performance_schema' &&
                db.name !== 'sys'
            );
        } catch (error) {
            logger.error('Failed to get databases', error as Error);
            throw error;
        }
    }

    /**
     * Get list of tables and views in a database
     */
    async getTables(connectionId: string, database: string): Promise<TableInfo[]> {
        try {
            // Use SHOW FULL TABLES to get both tables and views with their types
            const sql = `SHOW FULL TABLES FROM \`${database}\``;
            const result = await this.mysqlClient.executeQuery(connectionId, sql);

            const tables: TableInfo[] = result.rows.map(row => {
                // The column names vary: 'Tables_in_dbname' and 'Table_type'
                const tableName = Object.values(row)[0] as string;
                const tableType = row.Table_type || row.table_type;

                return {
                    name: tableName,
                    type: tableType === 'VIEW' ? 'VIEW' : 'TABLE'
                };
            });

            return tables;
        } catch (error) {
            logger.error(`Failed to get tables for database: ${database}`, error as Error);
            throw error;
        }
    }

    /**
     * Get list of tables only (excluding views)
     */
    async getTablesOnly(connectionId: string, database: string): Promise<TableInfo[]> {
        const allTables = await this.getTables(connectionId, database);
        return allTables.filter(t => t.type === 'TABLE');
    }

    /**
     * Get list of views only
     */
    async getViews(connectionId: string, database: string): Promise<TableInfo[]> {
        const allTables = await this.getTables(connectionId, database);
        return allTables.filter(t => t.type === 'VIEW');
    }

    /**
     * Get list of stored procedures in a database
     */
    async getProcedures(connectionId: string, database: string): Promise<RoutineInfo[]> {
        try {
            const sql = `SHOW PROCEDURE STATUS WHERE Db = '${database}'`;
            const result = await this.mysqlClient.executeQuery(connectionId, sql);

            const procedures: RoutineInfo[] = result.rows.map(row => ({
                name: row.Name,
                type: 'PROCEDURE' as const
            }));

            return procedures;
        } catch (error) {
            logger.error(`Failed to get procedures for database: ${database}`, error as Error);
            // Return empty array if procedures are not supported or query fails
            return [];
        }
    }

    /**
     * Get list of functions in a database
     */
    async getFunctions(connectionId: string, database: string): Promise<RoutineInfo[]> {
        try {
            const sql = `SHOW FUNCTION STATUS WHERE Db = '${database}'`;
            const result = await this.mysqlClient.executeQuery(connectionId, sql);

            const functions: RoutineInfo[] = result.rows.map(row => ({
                name: row.Name,
                type: 'FUNCTION' as const
            }));

            return functions;
        } catch (error) {
            logger.error(`Failed to get functions for database: ${database}`, error as Error);
            // Return empty array if functions are not supported or query fails
            return [];
        }
    }

    /**
     * Get columns for a table
     */
    async getColumns(connectionId: string, database: string, table: string): Promise<ColumnInfo[]> {
        try {
            const sql = `SHOW FULL COLUMNS FROM \`${database}\`.\`${table}\``;
            const result = await this.mysqlClient.executeQuery(connectionId, sql);

            const columns: ColumnInfo[] = result.rows.map(row => ({
                name: row.Field,
                type: row.Type,
                nullable: row.Null === 'YES',
                key: row.Key || '',
                default: row.Default,
                extra: row.Extra || ''
            }));

            return columns;
        } catch (error) {
            logger.error(`Failed to get columns for table: ${database}.${table}`, error as Error);
            throw error;
        }
    }

    /**
     * Get table row count
     */
    async getTableRowCount(connectionId: string, database: string, table: string): Promise<number> {
        try {
            const sql = `SELECT COUNT(*) as count FROM \`${database}\`.\`${table}\``;
            const result = await this.mysqlClient.executeQuery(connectionId, sql);

            if (result.rows.length > 0) {
                return result.rows[0].count || 0;
            }
            return 0;
        } catch (error) {
            logger.error(`Failed to get row count for table: ${database}.${table}`, error as Error);
            return 0;
        }
    }

    /**
     * Get CREATE statement for a table
     */
    async getTableCreateStatement(connectionId: string, database: string, table: string): Promise<string> {
        try {
            const sql = `SHOW CREATE TABLE \`${database}\`.\`${table}\``;
            const result = await this.mysqlClient.executeQuery(connectionId, sql);

            if (result.rows.length > 0) {
                return result.rows[0]['Create Table'] || '';
            }
            return '';
        } catch (error) {
            logger.error(`Failed to get CREATE statement for table: ${database}.${table}`, error as Error);
            throw error;
        }
    }

    /**
     * Get CREATE statement for a view
     */
    async getViewCreateStatement(connectionId: string, database: string, view: string): Promise<string> {
        try {
            const sql = `SHOW CREATE VIEW \`${database}\`.\`${view}\``;
            const result = await this.mysqlClient.executeQuery(connectionId, sql);

            if (result.rows.length > 0) {
                return result.rows[0]['Create View'] || '';
            }
            return '';
        } catch (error) {
            logger.error(`Failed to get CREATE statement for view: ${database}.${view}`, error as Error);
            throw error;
        }
    }
}
