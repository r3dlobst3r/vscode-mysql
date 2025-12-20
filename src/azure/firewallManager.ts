import * as vscode from 'vscode';
import { MySQLManagementFlexibleServerClient, FirewallRule } from '@azure/arm-mysql-flexible';
import { DefaultAzureCredential } from '@azure/identity';
import { AzureResourceInfo } from './resourceDetector';
import { logger } from '../utils/logger';

export class FirewallManager {
    private credential: DefaultAzureCredential;

    constructor() {
        this.credential = new DefaultAzureCredential();
    }

    /**
     * Get current public IP address
     */
    public async getCurrentIPAddress(): Promise<string> {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json() as { ip: string };
            return data.ip;
        } catch (error) {
            logger.error('Failed to get current IP address', error as Error);
            throw new Error('Failed to get current IP address');
        }
    }

    /**
     * List all firewall rules for an Azure MySQL server
     */
    public async listFirewallRules(resourceInfo: AzureResourceInfo): Promise<FirewallRule[]> {
        try {
            const client = new MySQLManagementFlexibleServerClient(
                this.credential,
                resourceInfo.subscriptionId
            );

            const rules: FirewallRule[] = [];
            const iterator = client.firewallRules.listByServer(
                resourceInfo.resourceGroupName,
                resourceInfo.serverName
            );

            for await (const rule of iterator) {
                rules.push(rule);
            }

            return rules;
        } catch (error) {
            logger.error('Failed to list firewall rules', error as Error);
            throw error;
        }
    }

    /**
     * Create a firewall rule for the current IP address
     */
    public async createFirewallRuleForCurrentIP(
        resourceInfo: AzureResourceInfo,
        ruleName?: string
    ): Promise<FirewallRule> {
        try {
            const currentIP = await this.getCurrentIPAddress();
            const name = ruleName || `VSCodeMySQL-${Date.now()}`;

            return await this.createFirewallRule(
                resourceInfo,
                name,
                currentIP,
                currentIP
            );
        } catch (error) {
            logger.error('Failed to create firewall rule for current IP', error as Error);
            throw error;
        }
    }

    /**
     * Create a firewall rule with specific IP range
     */
    public async createFirewallRule(
        resourceInfo: AzureResourceInfo,
        ruleName: string,
        startIP: string,
        endIP: string
    ): Promise<FirewallRule> {
        try {
            const client = new MySQLManagementFlexibleServerClient(
                this.credential,
                resourceInfo.subscriptionId
            );

            const parameters: FirewallRule = {
                startIpAddress: startIP,
                endIpAddress: endIP
            };

            const result = await client.firewallRules.beginCreateOrUpdateAndWait(
                resourceInfo.resourceGroupName,
                resourceInfo.serverName,
                ruleName,
                parameters
            );

            logger.info(`Created firewall rule: ${ruleName} (${startIP} - ${endIP})`);
            return result;
        } catch (error) {
            logger.error('Failed to create firewall rule', error as Error);
            throw error;
        }
    }

    /**
     * Delete a firewall rule
     */
    public async deleteFirewallRule(
        resourceInfo: AzureResourceInfo,
        ruleName: string
    ): Promise<void> {
        try {
            const client = new MySQLManagementFlexibleServerClient(
                this.credential,
                resourceInfo.subscriptionId
            );

            await client.firewallRules.beginDeleteAndWait(
                resourceInfo.resourceGroupName,
                resourceInfo.serverName,
                ruleName
            );

            logger.info(`Deleted firewall rule: ${ruleName}`);
        } catch (error) {
            logger.error('Failed to delete firewall rule', error as Error);
            throw error;
        }
    }

    /**
     * Check if connection error is due to firewall
     */
    public static isFirewallError(error: Error): boolean {
        const message = error.message.toLowerCase();
        return (
            message.includes('firewall') ||
            message.includes('client with ip') ||
            message.includes('not allowed to connect') ||
            message.includes('access denied')
        );
    }

    /**
     * Prompt user to create firewall rule on connection failure
     */
    public async handleFirewallError(
        resourceInfo: AzureResourceInfo
    ): Promise<boolean> {
        try {
            const currentIP = await this.getCurrentIPAddress();

            const result = await vscode.window.showErrorMessage(
                `Connection blocked by Azure firewall. Would you like to add your current IP address (${currentIP}) to the firewall rules?`,
                'Add Firewall Rule',
                'Cancel'
            );

            if (result === 'Add Firewall Rule') {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Creating firewall rule...',
                    cancellable: false
                }, async () => {
                    await this.createFirewallRuleForCurrentIP(resourceInfo);
                });

                vscode.window.showInformationMessage('Firewall rule created successfully. Please try connecting again.');
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Failed to handle firewall error', error as Error);
            vscode.window.showErrorMessage(`Failed to create firewall rule: ${(error as Error).message}`);
            return false;
        }
    }
}
