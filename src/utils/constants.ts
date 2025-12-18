export const EXTENSION_ID = 'vscode-mysql';
export const EXTENSION_NAME = 'MySQL';
export const OUTPUT_CHANNEL_NAME = 'MySQL';

// Commands
export const COMMAND_CONNECT = 'mysql.connect';
export const COMMAND_DISCONNECT = 'mysql.disconnect';
export const COMMAND_EDIT_CONNECTION = 'mysql.editConnection';
export const COMMAND_DELETE_CONNECTION = 'mysql.deleteConnection';
export const COMMAND_REFRESH_CONNECTION = 'mysql.refreshConnection';
export const COMMAND_EXECUTE_QUERY = 'mysql.executeQuery';
export const COMMAND_NEW_QUERY = 'mysql.newQuery';
export const COMMAND_CREATE_DATABASE = 'mysql.createDatabase';
export const COMMAND_DROP_DATABASE = 'mysql.dropDatabase';
export const COMMAND_EXPORT_RESULTS = 'mysql.exportResults';
export const COMMAND_DEPLOY_AZURE = 'mysql.deployAzure';
export const COMMAND_SELECT_TOP_1000 = 'mysql.selectTop1000';
export const COMMAND_VIEW_TABLE_STRUCTURE = 'mysql.viewTableStructure';
export const COMMAND_SCRIPT_AS_CREATE = 'mysql.scriptAsCreate';

// Configuration keys
export const CONFIG_CONNECTIONS = 'mysql.connections';
export const CONFIG_DEFAULT_CONNECTION = 'mysql.defaultConnection';
export const CONFIG_MAX_QUERY_RESULTS = 'mysql.maxQueryResults';
export const CONFIG_QUERY_TIMEOUT = 'mysql.queryTimeout';
export const CONFIG_SHOW_EXECUTION_TIME = 'mysql.showQueryExecutionTime';
export const CONFIG_EXPORT_DEFAULT_PATH = 'mysql.exportDefaultPath';
export const CONFIG_FORMAT_KEYWORD_CASE = 'mysql.format.keywordCase';
export const CONFIG_FORMAT_IDENTIFIER_CASE = 'mysql.format.identifierCase';
export const CONFIG_FORMAT_STRIP_COMMENTS = 'mysql.format.stripComments';
export const CONFIG_FORMAT_REINDENT = 'mysql.format.reindent';
export const CONFIG_LOG_DEBUG_INFO = 'mysql.logDebugInfo';

// Tree view context values
export const CONTEXT_CONNECTION_DISCONNECTED = 'connection-disconnected';
export const CONTEXT_CONNECTION_CONNECTED = 'connection-connected';
export const CONTEXT_SERVER = 'server';
export const CONTEXT_DATABASE = 'database';
export const CONTEXT_TABLE = 'table';
export const CONTEXT_VIEW = 'view';
export const CONTEXT_PROCEDURE = 'procedure';
export const CONTEXT_FUNCTION = 'function';

// Authentication types
export enum AuthenticationType {
    SqlLogin = 'SqlLogin',
    AzureMFA = 'AzureMFAAndUser'
}

// SSL modes
export enum SSLMode {
    Disable = 'disable',
    Require = 'require',
    VerifyCA = 'verify_ca',
    VerifyIdentity = 'verify_identity'
}

// Export formats
export enum ExportFormat {
    CSV = 'csv',
    JSON = 'json',
    Excel = 'excel',
    XML = 'xml'
}

// Default values
export const DEFAULT_PORT = 3306;
export const DEFAULT_CONNECT_TIMEOUT = 10;
export const DEFAULT_CHARSET = 'utf8mb4';
export const DEFAULT_COLLATION = 'utf8mb4_general_ci';
export const DEFAULT_MAX_RESULTS = 1000;
export const DEFAULT_QUERY_TIMEOUT = 30;

// Azure constants
export const AZURE_MYSQL_PORTAL_URL = 'https://portal.azure.com/#create/Microsoft.MySQLFlexibleServer';
export const AZURE_RESOURCE_TYPE = 'OssRdbms';

// Webview IDs
export const WEBVIEW_CONNECTION_DIALOG = 'mysqlConnectionDialog';
export const WEBVIEW_DATABASE_DIALOG = 'mysqlDatabaseDialog';
export const WEBVIEW_RESULTS_PANEL = 'mysqlResultsPanel';
export const WEBVIEW_FIREWALL_DIALOG = 'mysqlFirewallDialog';
export const WEBVIEW_DEPLOYMENT_WIZARD = 'mysqlDeploymentWizard';
