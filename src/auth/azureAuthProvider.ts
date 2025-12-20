import * as vscode from 'vscode';
import * as msal from '@azure/msal-node';
import { logger } from '../utils/logger';

/**
 * Azure MySQL Flexible Server access token scope
 * This is the specific scope required for Azure Database for MySQL authentication
 */
const AZURE_MYSQL_SCOPE = 'https://ossrdbms-aad.database.windows.net/.default';

/**
 * MSAL client ID for MySQL extension
 * Using the official Azure CLI client ID which is publicly known and safe to use
 */
const AZURE_CLIENT_ID = '04b07795-8ddb-461a-bbee-02f9e1bf7b46';

/**
 * Azure AD authority URL
 */
const AZURE_AUTHORITY = 'https://login.microsoftonline.com/common';

export interface AzureAuthResult {
    accessToken: string;
    expiresOn: Date;
    account: {
        username: string;
        name?: string;
        tenantId: string;
    };
}

export class AzureAuthProvider {
    private msalApp: msal.PublicClientApplication;

    constructor() {
        const msalConfig: msal.Configuration = {
            auth: {
                clientId: AZURE_CLIENT_ID,
                authority: AZURE_AUTHORITY
            },
            system: {
                loggerOptions: {
                    loggerCallback: (level, message, containsPii) => {
                        if (containsPii) {
                            return;
                        }
                        switch (level) {
                            case msal.LogLevel.Error:
                                logger.error('MSAL Error', new Error(message));
                                break;
                            case msal.LogLevel.Warning:
                                logger.warn(message);
                                break;
                            case msal.LogLevel.Info:
                            case msal.LogLevel.Verbose:
                                logger.debug(message);
                                break;
                        }
                    },
                    logLevel: msal.LogLevel.Info
                }
            }
        };

        this.msalApp = new msal.PublicClientApplication(msalConfig);
    }

    /**
     * Authenticate using device code flow
     * This shows a code to the user that they enter in a browser
     */
    public async authenticateDeviceCode(): Promise<AzureAuthResult | undefined> {
        try {
            logger.info('Starting Azure AD device code authentication');

            const deviceCodeRequest: msal.DeviceCodeRequest = {
                scopes: [AZURE_MYSQL_SCOPE],
                deviceCodeCallback: (response) => {
                    // Show device code to user
                    const message = `To sign in, use a web browser to open the page ${response.verificationUri} and enter the code ${response.userCode}`;

                    vscode.window.showInformationMessage(
                        message,
                        'Copy Code',
                        'Open Browser'
                    ).then(selection => {
                        if (selection === 'Copy Code') {
                            vscode.env.clipboard.writeText(response.userCode);
                            vscode.window.showInformationMessage('Code copied to clipboard!');
                        } else if (selection === 'Open Browser') {
                            vscode.env.openExternal(vscode.Uri.parse(response.verificationUri));
                            vscode.env.clipboard.writeText(response.userCode);
                        }
                    });

                    logger.info(`Device code: ${response.userCode}`);
                }
            };

            const response = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Waiting for Azure AD authentication...',
                cancellable: true
            }, async (progress, token) => {
                // Set up cancellation
                token.onCancellationRequested(() => {
                    logger.info('Azure AD authentication cancelled by user');
                });

                try {
                    return await this.msalApp.acquireTokenByDeviceCode(deviceCodeRequest);
                } catch (error) {
                    if (token.isCancellationRequested) {
                        throw new Error('Authentication cancelled by user');
                    }
                    throw error;
                }
            });

            if (!response) {
                return undefined;
            }

            logger.info(`Azure AD authentication successful for ${response.account?.username}`);

            return {
                accessToken: response.accessToken,
                expiresOn: response.expiresOn || new Date(Date.now() + 3600000), // Default 1 hour
                account: {
                    username: response.account?.username || '',
                    name: response.account?.name,
                    tenantId: response.account?.tenantId || ''
                }
            };

        } catch (error) {
            logger.error('Azure AD authentication failed', error as Error);
            vscode.window.showErrorMessage(`Azure AD authentication failed: ${(error as Error).message}`);
            return undefined;
        }
    }

    /**
     * Silently acquire token using cached refresh token
     */
    public async acquireTokenSilent(account: msal.AccountInfo): Promise<AzureAuthResult | undefined> {
        try {
            logger.info(`Attempting silent token acquisition for ${account.username}`);

            const silentRequest: msal.SilentFlowRequest = {
                account: account,
                scopes: [AZURE_MYSQL_SCOPE]
            };

            const response = await this.msalApp.acquireTokenSilent(silentRequest);

            if (!response) {
                return undefined;
            }

            logger.info('Silent token acquisition successful');

            return {
                accessToken: response.accessToken,
                expiresOn: response.expiresOn || new Date(Date.now() + 3600000),
                account: {
                    username: response.account?.username || '',
                    name: response.account?.name,
                    tenantId: response.account?.tenantId || ''
                }
            };

        } catch (error) {
            logger.warn(`Silent token acquisition failed: ${(error as Error).message}`);
            return undefined;
        }
    }

    /**
     * Get cached accounts
     */
    public async getAccounts(): Promise<msal.AccountInfo[]> {
        return await this.msalApp.getTokenCache().getAllAccounts();
    }

    /**
     * Sign out and clear cache
     */
    public async signOut(account: msal.AccountInfo): Promise<void> {
        try {
            await this.msalApp.getTokenCache().removeAccount(account);
            logger.info(`Signed out ${account.username}`);
        } catch (error) {
            logger.error('Failed to sign out', error as Error);
            throw error;
        }
    }

    /**
     * Create account info from stored data
     */
    public createAccountInfo(username: string, tenantId: string): msal.AccountInfo {
        return {
            homeAccountId: `${username}.${tenantId}`,
            environment: 'login.microsoftonline.com',
            tenantId: tenantId,
            username: username,
            localAccountId: username,
            name: username
        };
    }
}
