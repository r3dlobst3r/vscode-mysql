import { MySQLConnection } from '../connectionManager';

export interface AzureResourceInfo {
    subscriptionId: string;
    resourceGroupName: string;
    serverName: string;
}

export class ResourceDetector {
    /**
     * Detect if a connection is to an Azure MySQL Flexible Server
     */
    public static isAzureMySQL(connection: MySQLConnection): boolean {
        if (!connection.host) {
            return false;
        }

        // Azure MySQL Flexible Server uses the pattern: servername.mysql.database.azure.com
        const azurePattern = /\.mysql\.database\.azure\.com$/i;
        return azurePattern.test(connection.host);
    }

    /**
     * Extract Azure resource information from connection
     */
    public static getAzureResourceInfo(connection: MySQLConnection): AzureResourceInfo | undefined {
        if (!this.isAzureMySQL(connection)) {
            return undefined;
        }

        // Extract server name from hostname (e.g., myserver.mysql.database.azure.com -> myserver)
        const serverName = connection.host.split('.')[0];

        // We need subscription ID and resource group from connection metadata
        // These should be stored when the connection is created for Azure resources
        const subscriptionId = (connection as any).subscriptionId;
        const resourceGroupName = (connection as any).resourceGroupName;

        if (!subscriptionId || !resourceGroupName) {
            return undefined;
        }

        return {
            subscriptionId,
            resourceGroupName,
            serverName
        };
    }

    /**
     * Parse Azure MySQL connection string to extract resource info
     */
    public static parseAzureConnectionString(connectionString: string): AzureResourceInfo | undefined {
        try {
            // Example: Server=myserver.mysql.database.azure.com;...
            const serverMatch = connectionString.match(/Server=([^;]+)/i);
            if (!serverMatch) {
                return undefined;
            }

            const host = serverMatch[1];
            if (!this.isAzureMySQL({ host } as MySQLConnection)) {
                return undefined;
            }

            const serverName = host.split('.')[0];

            // Look for subscription and resource group in connection string
            const subscriptionMatch = connectionString.match(/SubscriptionId=([^;]+)/i);
            const resourceGroupMatch = connectionString.match(/ResourceGroup=([^;]+)/i);

            if (!subscriptionMatch || !resourceGroupMatch) {
                return undefined;
            }

            return {
                subscriptionId: subscriptionMatch[1],
                resourceGroupName: resourceGroupMatch[1],
                serverName
            };
        } catch (error) {
            return undefined;
        }
    }
}
