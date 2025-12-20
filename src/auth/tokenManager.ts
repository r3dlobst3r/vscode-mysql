import * as vscode from 'vscode';
import { AzureAuthProvider, AzureAuthResult } from './azureAuthProvider';
import { logger } from '../utils/logger';

interface StoredTokenInfo {
    accessToken: string;
    expiresOn: string; // ISO string
    username: string;
    tenantId: string;
    name?: string;
}

export class TokenManager {
    private authProvider: AzureAuthProvider;
    private secretStorage: vscode.SecretStorage;

    constructor(context: vscode.ExtensionContext) {
        this.authProvider = new AzureAuthProvider();
        this.secretStorage = context.secrets;
    }

    /**
     * Get a valid access token for a connection
     * Automatically refreshes if expired
     */
    public async getAccessToken(connectionId: string): Promise<string | undefined> {
        try {
            // Get stored token info
            const tokenInfo = await this.getStoredTokenInfo(connectionId);

            if (!tokenInfo) {
                logger.warn(`No stored token for connection ${connectionId}`);
                return undefined;
            }

            // Check if token is expired or about to expire (within 5 minutes)
            const expiresOn = new Date(tokenInfo.expiresOn);
            const now = new Date();
            const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

            if (expiresOn > fiveMinutesFromNow) {
                // Token is still valid
                logger.debug('Using cached Azure AD token');
                return tokenInfo.accessToken;
            }

            // Token is expired or about to expire, try to refresh
            logger.info('Azure AD token expired or expiring soon, attempting refresh');

            const account = this.authProvider.createAccountInfo(tokenInfo.username, tokenInfo.tenantId);
            const refreshedAuth = await this.authProvider.acquireTokenSilent(account);

            if (refreshedAuth) {
                // Save refreshed token
                await this.storeToken(connectionId, refreshedAuth);
                logger.info('Azure AD token refreshed successfully');
                return refreshedAuth.accessToken;
            }

            // Silent refresh failed, need to re-authenticate
            logger.warn('Silent token refresh failed, user needs to re-authenticate');
            return undefined;

        } catch (error) {
            logger.error('Failed to get access token', error as Error);
            return undefined;
        }
    }

    /**
     * Authenticate and store token for a connection
     */
    public async authenticateAndStoreToken(connectionId: string): Promise<string | undefined> {
        try {
            // Perform device code authentication
            const authResult = await this.authProvider.authenticateDeviceCode();

            if (!authResult) {
                return undefined;
            }

            // Store the token
            await this.storeToken(connectionId, authResult);

            vscode.window.showInformationMessage(`Successfully authenticated as ${authResult.account.username}`);

            return authResult.accessToken;

        } catch (error) {
            logger.error('Failed to authenticate and store token', error as Error);
            vscode.window.showErrorMessage(`Authentication failed: ${(error as Error).message}`);
            return undefined;
        }
    }

    /**
     * Store token information
     */
    private async storeToken(connectionId: string, authResult: AzureAuthResult): Promise<void> {
        const tokenInfo: StoredTokenInfo = {
            accessToken: authResult.accessToken,
            expiresOn: authResult.expiresOn.toISOString(),
            username: authResult.account.username,
            tenantId: authResult.account.tenantId,
            name: authResult.account.name
        };

        const key = this.getStorageKey(connectionId);
        await this.secretStorage.store(key, JSON.stringify(tokenInfo));

        logger.info(`Stored Azure AD token for connection ${connectionId}`);
    }

    /**
     * Get stored token information
     */
    private async getStoredTokenInfo(connectionId: string): Promise<StoredTokenInfo | undefined> {
        const key = this.getStorageKey(connectionId);
        const stored = await this.secretStorage.get(key);

        if (!stored) {
            return undefined;
        }

        try {
            return JSON.parse(stored) as StoredTokenInfo;
        } catch (error) {
            logger.error('Failed to parse stored token info', error as Error);
            return undefined;
        }
    }

    /**
     * Clear stored token for a connection
     */
    public async clearToken(connectionId: string): Promise<void> {
        const key = this.getStorageKey(connectionId);
        await this.secretStorage.delete(key);
        logger.info(`Cleared Azure AD token for connection ${connectionId}`);
    }

    /**
     * Sign out from Azure AD
     */
    public async signOut(connectionId: string): Promise<void> {
        try {
            const tokenInfo = await this.getStoredTokenInfo(connectionId);

            if (tokenInfo) {
                const account = this.authProvider.createAccountInfo(tokenInfo.username, tokenInfo.tenantId);
                await this.authProvider.signOut(account);
            }

            await this.clearToken(connectionId);
            vscode.window.showInformationMessage('Signed out from Azure AD');

        } catch (error) {
            logger.error('Failed to sign out', error as Error);
            vscode.window.showErrorMessage(`Sign out failed: ${(error as Error).message}`);
        }
    }

    /**
     * Get storage key for connection
     */
    private getStorageKey(connectionId: string): string {
        return `azure-token-${connectionId}`;
    }
}
