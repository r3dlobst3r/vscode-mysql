import * as vscode from 'vscode';
import { MySQLClient } from '../mysqlClient';
import { logger } from '../utils/logger';

/**
 * MySQL keywords for autocomplete
 */
const MYSQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
    'CREATE', 'ALTER', 'DROP', 'TABLE', 'DATABASE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION',
    'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'CROSS', 'ON', 'USING',
    'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'HAVING', 'LIMIT', 'OFFSET',
    'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL',
    'AS', 'DISTINCT', 'ALL', 'UNION', 'INTERSECT', 'EXCEPT',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT',
    'AUTO_INCREMENT', 'NOT NULL', 'CONSTRAINT',
    'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK', 'SAVEPOINT',
    'BEGIN', 'START', 'TRANSACTION', 'IF', 'ELSEIF', 'WHILE', 'LOOP', 'REPEAT',
    'DECLARE', 'CURSOR', 'FETCH', 'OPEN', 'CLOSE',
    'SHOW', 'DESCRIBE', 'EXPLAIN', 'USE'
];

/**
 * MySQL data types for autocomplete
 */
const MYSQL_TYPES = [
    'INT', 'INTEGER', 'SMALLINT', 'TINYINT', 'MEDIUMINT', 'BIGINT',
    'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL',
    'BIT', 'BOOLEAN', 'BOOL',
    'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR',
    'CHAR', 'VARCHAR', 'BINARY', 'VARBINARY',
    'TINYBLOB', 'BLOB', 'MEDIUMBLOB', 'LONGBLOB',
    'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT',
    'ENUM', 'SET', 'JSON', 'GEOMETRY', 'POINT', 'LINESTRING', 'POLYGON'
];

/**
 * MySQL built-in functions for autocomplete
 */
const MYSQL_FUNCTIONS = [
    // String functions
    'CONCAT', 'CONCAT_WS', 'LENGTH', 'CHAR_LENGTH', 'SUBSTRING', 'SUBSTR',
    'UPPER', 'LOWER', 'TRIM', 'LTRIM', 'RTRIM', 'REPLACE', 'REVERSE',
    'LEFT', 'RIGHT', 'LPAD', 'RPAD', 'LOCATE', 'POSITION', 'INSTR',

    // Numeric functions
    'ABS', 'CEILING', 'FLOOR', 'ROUND', 'TRUNCATE', 'MOD', 'POWER', 'SQRT',
    'RAND', 'SIGN', 'PI', 'EXP', 'LOG', 'LOG10', 'SIN', 'COS', 'TAN',

    // Date/time functions
    'NOW', 'CURDATE', 'CURTIME', 'DATE', 'TIME', 'YEAR', 'MONTH', 'DAY',
    'HOUR', 'MINUTE', 'SECOND', 'DATE_ADD', 'DATE_SUB', 'DATEDIFF',
    'DATE_FORMAT', 'STR_TO_DATE', 'TIMESTAMP', 'FROM_UNIXTIME', 'UNIX_TIMESTAMP',

    // Aggregate functions
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'GROUP_CONCAT', 'STD', 'VARIANCE',

    // Conditional functions
    'IF', 'IFNULL', 'NULLIF', 'COALESCE', 'CASE',

    // Conversion functions
    'CAST', 'CONVERT', 'BINARY',

    // Other functions
    'DATABASE', 'USER', 'VERSION', 'LAST_INSERT_ID', 'UUID', 'MD5', 'SHA1', 'SHA2'
];

export class MySQLCompletionProvider implements vscode.CompletionItemProvider {
    private mysqlClient: MySQLClient | undefined;
    private activeConnectionId: string | undefined;

    constructor() {}

    /**
     * Set the MySQL client for querying metadata
     */
    public setMySQLClient(client: MySQLClient, connectionId?: string): void {
        this.mysqlClient = client;
        this.activeConnectionId = connectionId;
    }

    /**
     * Provide completion items
     */
    public async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        const items: vscode.CompletionItem[] = [];

        // Add MySQL keywords
        for (const keyword of MYSQL_KEYWORDS) {
            const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
            item.detail = 'MySQL Keyword';
            item.insertText = keyword;
            items.push(item);
        }

        // Add MySQL data types
        for (const type of MYSQL_TYPES) {
            const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.TypeParameter);
            item.detail = 'MySQL Data Type';
            item.insertText = type;
            items.push(item);
        }

        // Add MySQL functions
        for (const func of MYSQL_FUNCTIONS) {
            const item = new vscode.CompletionItem(func, vscode.CompletionItemKind.Function);
            item.detail = 'MySQL Function';
            item.insertText = new vscode.SnippetString(`${func}($1)$0`);
            items.push(item);
        }

        // Add tables and columns from active connection (if available)
        if (this.mysqlClient && this.activeConnectionId) {
            try {
                const tableItems = await this.getTableCompletions(this.activeConnectionId);
                items.push(...tableItems);
            } catch (error) {
                logger.debug(`Failed to get table completions: ${(error as Error).message}`);
            }
        }

        return items;
    }

    /**
     * Get table and column completions from the database
     */
    private async getTableCompletions(connectionId: string): Promise<vscode.CompletionItem[]> {
        const items: vscode.CompletionItem[] = [];

        try {
            // Get current database
            const dbResult = await this.mysqlClient!.executeQuery(connectionId, 'SELECT DATABASE() as db');
            const currentDb = dbResult.rows[0]?.db;

            if (!currentDb) {
                return items;
            }

            // Get tables
            const tablesResult = await this.mysqlClient!.executeQuery(
                connectionId,
                `SHOW TABLES FROM \`${currentDb}\``
            );

            for (const row of tablesResult.rows) {
                const tableName = Object.values(row)[0] as string;
                const item = new vscode.CompletionItem(tableName, vscode.CompletionItemKind.Class);
                item.detail = `Table in ${currentDb}`;
                item.insertText = `\`${tableName}\``;
                items.push(item);

                // Get columns for this table
                const columnsResult = await this.mysqlClient!.executeQuery(
                    connectionId,
                    `SHOW COLUMNS FROM \`${currentDb}\`.\`${tableName}\``
                );

                for (const colRow of columnsResult.rows) {
                    const columnName = (colRow as any).Field;
                    const columnType = (colRow as any).Type;
                    const colItem = new vscode.CompletionItem(
                        `${tableName}.${columnName}`,
                        vscode.CompletionItemKind.Field
                    );
                    colItem.detail = `${columnType} - ${tableName}`;
                    colItem.insertText = `\`${tableName}\`.\`${columnName}\``;
                    colItem.filterText = `${tableName}.${columnName}`;
                    items.push(colItem);
                }
            }
        } catch (error) {
            logger.error('Failed to fetch table/column metadata', error as Error);
        }

        return items;
    }
}
