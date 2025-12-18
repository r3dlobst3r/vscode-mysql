import * as vscode from 'vscode';

/**
 * Extract SQL query from the active editor
 */
export function getQueryFromEditor(editor: vscode.TextEditor): string | undefined {
    // If there's a selection, use that
    if (!editor.selection.isEmpty) {
        return editor.document.getText(editor.selection).trim();
    }

    // Otherwise, try to find the current statement
    const text = editor.document.getText();
    const cursorOffset = editor.document.offsetAt(editor.selection.active);

    // Try to find the statement at cursor position
    const statement = extractStatementAtPosition(text, cursorOffset);
    if (statement) {
        return statement.trim();
    }

    // If no statement found, use the entire document
    return text.trim();
}

/**
 * Extract a single SQL statement at the given position
 */
function extractStatementAtPosition(text: string, position: number): string | undefined {
    // Find the statement boundaries
    // Look backwards for the previous semicolon or start of text
    let start = 0;
    for (let i = position - 1; i >= 0; i--) {
        if (text[i] === ';') {
            start = i + 1;
            break;
        }
    }

    // Look forwards for the next semicolon or end of text
    let end = text.length;
    for (let i = position; i < text.length; i++) {
        if (text[i] === ';') {
            end = i;
            break;
        }
    }

    const statement = text.substring(start, end).trim();
    return statement.length > 0 ? statement : undefined;
}

/**
 * Split SQL text into multiple statements
 */
export function splitStatements(sql: string): string[] {
    const statements: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let escaped = false;

    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const prevChar = i > 0 ? sql[i - 1] : '';

        // Handle escape sequences
        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }

        if (char === '\\') {
            current += char;
            escaped = true;
            continue;
        }

        // Handle string literals
        if ((char === "'" || char === '"' || char === '`') && prevChar !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
                stringChar = '';
            }
            current += char;
            continue;
        }

        // Handle statement delimiter (semicolon)
        if (char === ';' && !inString) {
            const statement = current.trim();
            if (statement.length > 0) {
                statements.push(statement);
            }
            current = '';
            continue;
        }

        current += char;
    }

    // Add the last statement if there's no trailing semicolon
    const lastStatement = current.trim();
    if (lastStatement.length > 0) {
        statements.push(lastStatement);
    }

    return statements;
}
