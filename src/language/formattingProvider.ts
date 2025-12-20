import * as vscode from 'vscode';
import { format } from 'sql-formatter';
import { logger } from '../utils/logger';
import {
    CONFIG_FORMAT_KEYWORD_CASE,
    CONFIG_FORMAT_IDENTIFIER_CASE,
    CONFIG_FORMAT_STRIP_COMMENTS,
    CONFIG_FORMAT_REINDENT
} from '../utils/constants';

export class MySQLFormattingProvider implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider {
    /**
     * Format entire document
     */
    public provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.TextEdit[] {
        try {
            const text = document.getText();
            const formatted = this.formatSQL(text, options);

            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );

            return [vscode.TextEdit.replace(fullRange, formatted)];
        } catch (error) {
            logger.error('SQL formatting failed', error as Error);
            vscode.window.showErrorMessage(`SQL formatting failed: ${(error as Error).message}`);
            return [];
        }
    }

    /**
     * Format selected range
     */
    public provideDocumentRangeFormattingEdits(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.TextEdit[] {
        try {
            const text = document.getText(range);
            const formatted = this.formatSQL(text, options);

            return [vscode.TextEdit.replace(range, formatted)];
        } catch (error) {
            logger.error('SQL formatting failed', error as Error);
            vscode.window.showErrorMessage(`SQL formatting failed: ${(error as Error).message}`);
            return [];
        }
    }

    /**
     * Format SQL text using sql-formatter
     */
    private formatSQL(text: string, options: vscode.FormattingOptions): string {
        const config = vscode.workspace.getConfiguration();

        // Get formatting settings
        const keywordCase = config.get<string>(CONFIG_FORMAT_KEYWORD_CASE, 'upper');
        const identifierCase = config.get<string>(CONFIG_FORMAT_IDENTIFIER_CASE, 'preserve');
        const stripComments = config.get<boolean>(CONFIG_FORMAT_STRIP_COMMENTS, false);
        const reindent = config.get<boolean>(CONFIG_FORMAT_REINDENT, true);

        // Configure sql-formatter
        const formatterOptions: any = {
            language: 'mysql',
            tabWidth: options.tabSize,
            useTabs: !options.insertSpaces,
            keywordCase: keywordCase as any,
            identifierCase: identifierCase === 'preserve' ? undefined : identifierCase as any,
            indentStyle: 'standard',
            logicalOperatorNewline: 'before',
            expressionWidth: 80,
            linesBetweenQueries: 2
        };

        let formatted = format(text, formatterOptions);

        // Strip comments if requested
        if (stripComments) {
            formatted = this.stripComments(formatted);
        }

        return formatted;
    }

    /**
     * Strip SQL comments from formatted text
     */
    private stripComments(sql: string): string {
        // Remove single-line comments (-- comment)
        sql = sql.replace(/--[^\n]*/g, '');

        // Remove multi-line comments (/* comment */)
        sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');

        // Remove extra blank lines
        sql = sql.replace(/\n\s*\n\s*\n/g, '\n\n');

        return sql.trim();
    }
}
