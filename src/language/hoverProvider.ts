import * as vscode from 'vscode';
import { MySQLClient } from '../mysqlClient';
import { logger } from '../utils/logger';

export class MySQLHoverProvider implements vscode.HoverProvider {
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
     * Provide hover information
     */
    public async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        if (!this.mysqlClient || !this.activeConnectionId) {
            return undefined;
        }

        // Get the word at the position
        const wordRange = document.getWordRangeAtPosition(position, /[\w`]+\.?[\w`]*/);
        if (!wordRange) {
            return undefined;
        }

        const word = document.getText(wordRange).replace(/`/g, '');

        try {
            // Check if it's a table.column reference
            if (word.includes('.')) {
                return await this.getColumnHover(word);
            }

            // Check if it's a table reference
            return await this.getTableHover(word);
        } catch (error) {
            logger.debug(`Hover provider error: ${(error as Error).message}`);
            return undefined;
        }
    }

    /**
     * Get hover information for a table
     */
    private async getTableHover(tableName: string): Promise<vscode.Hover | undefined> {
        try {
            // Get current database
            const dbResult = await this.mysqlClient!.executeQuery(
                this.activeConnectionId!,
                'SELECT DATABASE() as db'
            );
            const currentDb = dbResult.rows[0]?.db;

            if (!currentDb) {
                return undefined;
            }

            // Get table information
            const tableResult = await this.mysqlClient!.executeQuery(
                this.activeConnectionId!,
                `SHOW TABLE STATUS FROM \`${currentDb}\` WHERE Name = '${tableName}'`
            );

            if (tableResult.rows.length === 0) {
                return undefined;
            }

            const tableInfo = tableResult.rows[0] as any;

            // Get column count
            const columnsResult = await this.mysqlClient!.executeQuery(
                this.activeConnectionId!,
                `SHOW COLUMNS FROM \`${currentDb}\`.\`${tableName}\``
            );

            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`### Table: \`${tableName}\`\n\n`);
            markdown.appendMarkdown(`**Database:** ${currentDb}\n\n`);
            markdown.appendMarkdown(`**Engine:** ${tableInfo.Engine || 'N/A'}\n\n`);
            markdown.appendMarkdown(`**Rows:** ${tableInfo.Rows || 0}\n\n`);
            markdown.appendMarkdown(`**Columns:** ${columnsResult.rows.length}\n\n`);

            if (tableInfo.Comment) {
                markdown.appendMarkdown(`**Comment:** ${tableInfo.Comment}\n\n`);
            }

            return new vscode.Hover(markdown);
        } catch (error) {
            logger.debug(`Failed to get table hover: ${(error as Error).message}`);
            return undefined;
        }
    }

    /**
     * Get hover information for a column
     */
    private async getColumnHover(reference: string): Promise<vscode.Hover | undefined> {
        try {
            const parts = reference.split('.');
            if (parts.length !== 2) {
                return undefined;
            }

            const [tableName, columnName] = parts;

            // Get current database
            const dbResult = await this.mysqlClient!.executeQuery(
                this.activeConnectionId!,
                'SELECT DATABASE() as db'
            );
            const currentDb = dbResult.rows[0]?.db;

            if (!currentDb) {
                return undefined;
            }

            // Get column information
            const columnsResult = await this.mysqlClient!.executeQuery(
                this.activeConnectionId!,
                `SHOW COLUMNS FROM \`${currentDb}\`.\`${tableName}\` WHERE Field = '${columnName}'`
            );

            if (columnsResult.rows.length === 0) {
                return undefined;
            }

            const columnInfo = columnsResult.rows[0] as any;

            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`### Column: \`${tableName}.${columnName}\`\n\n`);
            markdown.appendMarkdown(`**Type:** \`${columnInfo.Type}\`\n\n`);
            markdown.appendMarkdown(`**Nullable:** ${columnInfo.Null === 'YES' ? 'Yes' : 'No'}\n\n`);

            if (columnInfo.Key) {
                markdown.appendMarkdown(`**Key:** ${columnInfo.Key}\n\n`);
            }

            if (columnInfo.Default !== null) {
                markdown.appendMarkdown(`**Default:** \`${columnInfo.Default}\`\n\n`);
            }

            if (columnInfo.Extra) {
                markdown.appendMarkdown(`**Extra:** ${columnInfo.Extra}\n\n`);
            }

            return new vscode.Hover(markdown);
        } catch (error) {
            logger.debug(`Failed to get column hover: ${(error as Error).message}`);
            return undefined;
        }
    }
}
