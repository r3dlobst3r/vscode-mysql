# MySQL for Visual Studio Code

MySQL database management extension for Visual Studio Code with complete feature parity with Azure Data Studio.

## Features

### ✅ Implemented Features
- **Connection Management**: Save and manage MySQL connections with secure password storage
- **Connection Dialog**: Rich webview-based UI for creating and editing connections
- **Connection Testing**: Test connections before saving
- **TreeView Explorer**: View all your MySQL connections in the VS Code sidebar
- **Database Object Explorer**: Browse databases, tables, views, stored procedures, and functions
- **Table Operations**: Select top 1000 rows, view table structure, script as CREATE
- **MySQL Client**: Connect to MySQL 5.7, 8.0, and MariaDB
- **SSL Support**: Configure SSL connections (disable, require, verify_ca, verify_identity) with certificate browsing
- **Advanced Settings**: Connection timeout, client flags, SQL mode
- **Query Execution**: Execute SQL queries with Ctrl+Shift+E keyboard shortcut
- **Results Display**: Rich webview table view with sorting and multiple result sets
- **Export Functionality**: Export query results to CSV, JSON, Excel (.xlsx), or XML
- **Create Database**: Create new databases with charset and collation selection
- **Azure AD Authentication**: Azure MFA and User authentication with device code flow
- **Azure Firewall Management**: Automatic firewall error detection and one-click IP whitelisting
- **SQL IntelliSense**: Autocomplete for keywords, data types, functions, tables, and columns
- **SQL Formatting**: Format SQL code with configurable keyword case, identifier case, and more
- **Hover Information**: View table and column metadata on hover
- **Auto-Connect**: Automatically connect to default connection on startup
- **Configurable IntelliSense**: Toggle IntelliSense features and table/column suggestions
- **System Databases**: Show or hide system databases in explorer
- **Syntax Highlighting**: MySQL-specific SQL syntax highlighting
- **Code Snippets**: MySQL code snippets for common operations
- **Azure Deployment**: Quick link to deploy Azure MySQL Flexible Server

### 🎯 Production Ready
All planned features have been implemented. This extension is production-ready with comprehensive MySQL database management capabilities.

## Installation

1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions view (Ctrl+Shift+X)
4. Click the `...` menu and select "Install from VSIX..."
5. Select the downloaded `.vsix` file
6. Reload VS Code

## Quick Start

### Create a Connection

1. Click the MySQL icon in the Activity Bar (sidebar)
2. Click the `+` (New Connection) button in the MySQL view toolbar
3. Fill in the connection details in the dialog:
   - **Basic Tab**: Name, host, port, username, password, authentication type
   - **Advanced Tab**: Connection timeout, client flags, SQL mode
   - **SSL Tab**: SSL mode and certificate paths
4. Click "Test Connection" to verify (optional but recommended)
5. Click "Save Connection" to save the connection

The connection is now saved and will appear in the MySQL explorer!

### Using the Extension

1. Click the MySQL icon in the Activity Bar
2. Create a new connection using the `+` button or connect to an existing one
3. Click on a connection to connect
4. Once connected, expand the connection to browse:
   - **Databases**: All databases on the server
   - **Tables**: All tables in each database
   - **Views**: All views in each database
   - **Stored Procedures**: All procedures in each database
   - **Functions**: All functions in each database
5. Right-click on database objects for actions:
   - **Tables**: Select Top 1000 Rows, View Table Structure, Script as CREATE
   - **Views**: Script as CREATE
   - **Databases**: New Query, Create Database, Drop Database
   - **Connections**: Connect, Disconnect, Edit, Delete, New Query
6. Additional actions:
   - Deploy to Azure (MySQL: Deploy to Azure command)
   - Refresh any level of the tree

## Configuration

```jsonc
{
  // Connection settings
  "mysql.defaultConnection": "",                  // Default connection ID for auto-connect
  "mysql.autoConnectOnStartup": false,            // Auto-connect to default connection on startup
  "mysql.connectionPool.size": 5,                 // Connection pool size (1-100)

  // Query execution settings
  "mysql.maxQueryResults": 1000,                  // Maximum rows to return from a query
  "mysql.queryTimeout": 30,                       // Query timeout in seconds
  "mysql.showQueryExecutionTime": true,           // Show query execution time

  // Results display settings
  "mysql.results.rowsPerPage": 50,                // Rows per page in query results (10-1000)
  "mysql.results.maxColumnWidth": 300,            // Max column width in pixels (50-1000)

  // Export settings
  "mysql.exportDefaultPath": "",                  // Default path for exports

  // IntelliSense settings
  "mysql.intelliSense.enabled": true,             // Enable IntelliSense for SQL files
  "mysql.intelliSense.includeTables": true,       // Include table/column suggestions

  // SQL formatting options
  "mysql.format.keywordCase": "upper",            // Keyword case: upper, lower, capitalize
  "mysql.format.identifierCase": null,            // Identifier case: null, upper, lower, capitalize
  "mysql.format.stripComments": false,            // Strip comments when formatting
  "mysql.format.reindent": true,                  // Reindent SQL when formatting

  // Display settings
  "mysql.showSystemDatabases": false,             // Show system databases in explorer

  // Debug settings
  "mysql.logDebugInfo": false                     // Enable debug logging
}
```

## Commands

- `MySQL: New Connection` - Create a new connection
- `MySQL: Disconnect` - Disconnect from a server
- `MySQL: Edit Connection` - Edit an existing connection
- `MySQL: Delete Connection` - Delete a connection
- `MySQL: Refresh` - Refresh the connection tree
- `MySQL: Execute Query` (Ctrl+Shift+E) - Execute SQL query and display results
- `MySQL: New Query` - Create a new SQL file
- `MySQL: Create Database` - Create a new database with charset and collation selection
- `MySQL: Export Results` - Export query results to CSV, JSON, Excel, or XML
- `MySQL: Deploy to Azure` - Deploy MySQL to Azure
- `MySQL: Select Top 1000 Rows` - Generate SELECT query for table data
- `MySQL: View Table Structure` - Display table column information
- `MySQL: Script as CREATE` - Generate CREATE TABLE/VIEW statement

## Keyboard Shortcuts

- `Ctrl+Shift+E` (Mac: `Cmd+Shift+E`) - Execute SQL query and display results

## SSL Configuration

The extension supports multiple SSL modes:

- **Disable**: No SSL encryption
- **Require**: SSL required but certificate not verified
- **Verify CA**: Verify server certificate against CA
- **Verify Identity**: Full certificate verification including hostname

## Azure AD Authentication

The extension supports Azure Active Directory authentication for Azure MySQL Flexible Server:

### Authentication Types

- **SQL Login**: Traditional username/password authentication
- **Azure MFA and User**: Azure AD authentication with Multi-Factor Authentication support

### How Azure AD Authentication Works

1. Select "Azure MFA and User" as the authentication type in the connection dialog
2. When connecting, you'll be prompted to authenticate via device code flow
3. A browser window will open where you sign in with your Microsoft account
4. After successful authentication, the access token is securely stored
5. Tokens are automatically refreshed before expiration
6. Azure AD authentication requires SSL (automatically configured)

### Requirements for Azure AD

- Azure MySQL Flexible Server instance
- Azure AD account with appropriate permissions
- SSL must be enabled (required by Azure MySQL)

## Requirements

- Visual Studio Code 1.85.0 or higher
- Node.js 20.0.0 or higher (for development)
- MySQL 5.7, 8.0, or MariaDB server

## Development Status

This extension is now **production-ready** with all planned features implemented:

- **Phase 1**: ✅ Complete - Project foundation, connection management, tree view
- **Phase 2**: ✅ Complete - Azure AD authentication with MFA support
- **Phase 3**: ✅ Complete - Connection dialog webview
- **Phase 4**: ✅ Complete - Database object explorer
- **Phase 5**: ✅ Complete - Query execution and results display
- **Phase 6**: ✅ Complete - Export functionality (CSV, JSON, Excel, XML)
- **Phase 7**: ✅ Complete - Create database dialog with charset/collation
- **Phase 8**: ✅ Complete - Azure firewall rule management
- **Phase 9**: ✅ Complete - Azure deployment (portal link integration)
- **Phase 10**: ✅ Complete - SQL language features (IntelliSense, formatting, hover)
- **Phase 11**: ✅ Complete - Enhanced settings and configuration
- **Phase 12**: ✅ Complete - Documentation and packaging

## Building from Source

### Prerequisites
- Node.js 20.x or higher
- npm

### Build Steps
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package VSIX
npm run vsce:package
```

The VSIX file will be created in the root directory as `vscode-mysql-1.0.0.vsix`.

### CI/CD
This project uses GitHub Actions for continuous integration and releases:
- **CI Workflow**: Builds and tests on every push
- **Release Workflow**: Creates GitHub releases when code is merged to main

See [.github/workflows/README.md](.github/workflows/README.md) for details.

## Known Limitations

- Table data editing not yet available
- Database drop functionality not yet available

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/r3dlobst3r/vscode-mysql).

## License

MIT

## Privacy

This extension stores passwords securely using VS Code's SecretStorage API. No credentials are stored in plain text. Optional telemetry can be disabled in settings.
