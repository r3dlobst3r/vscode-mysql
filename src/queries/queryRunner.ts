import * as vscode from 'vscode';
import { MySQLClient, QueryResult } from '../mysqlClient';
import { logger } from '../utils/logger';
import { splitStatements } from './queryParser';

export interface QueryExecutionResult {
    sql: string;
    result?: QueryResult;
    error?: string;
    executionTime: number;
}

export class QueryRunner {
    constructor(private mysqlClient: MySQLClient) {}

    /**
     * Execute a single SQL statement
     */
    async executeQuery(connectionId: string, sql: string): Promise<QueryExecutionResult> {
        const startTime = Date.now();

        try {
            const result = await this.mysqlClient.executeQuery(connectionId, sql);
            const executionTime = Date.now() - startTime;

            return {
                sql,
                result,
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logger.error('Query execution failed', error as Error);

            return {
                sql,
                error: (error as Error).message,
                executionTime
            };
        }
    }

    /**
     * Execute multiple SQL statements
     */
    async executeMultipleQueries(connectionId: string, sql: string): Promise<QueryExecutionResult[]> {
        const statements = splitStatements(sql);
        const results: QueryExecutionResult[] = [];

        for (const statement of statements) {
            if (statement.trim().length === 0) {
                continue;
            }

            const result = await this.executeQuery(connectionId, statement);
            results.push(result);

            // Stop execution if there's an error
            if (result.error) {
                break;
            }
        }

        return results;
    }

    /**
     * Check if a connection is active
     */
    isConnected(connectionId: string): boolean {
        return this.mysqlClient.isConnected(connectionId);
    }
}
