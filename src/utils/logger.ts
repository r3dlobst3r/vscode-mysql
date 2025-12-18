import * as vscode from 'vscode';
import { OUTPUT_CHANNEL_NAME, CONFIG_LOG_DEBUG_INFO } from './constants';

class Logger {
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
    }

    private get isDebugEnabled(): boolean {
        return vscode.workspace.getConfiguration().get<boolean>(CONFIG_LOG_DEBUG_INFO, false);
    }

    public info(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [INFO] ${message}`);
    }

    public error(message: string, error?: Error): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [ERROR] ${message}`);
        if (error) {
            this.outputChannel.appendLine(`[${timestamp}] [ERROR] ${error.message}`);
            if (error.stack) {
                this.outputChannel.appendLine(`[${timestamp}] [ERROR] ${error.stack}`);
            }
        }
    }

    public warn(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [WARN] ${message}`);
    }

    public debug(message: string): void {
        if (this.isDebugEnabled) {
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[${timestamp}] [DEBUG] ${message}`);
        }
    }

    public show(): void {
        this.outputChannel.show();
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }
}

export const logger = new Logger();
