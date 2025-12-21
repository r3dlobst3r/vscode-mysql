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
- **Cell Selection & Copy**: Select cells and copy as text, CSV, or JSON with Ctrl+C
- **Export Functionality**: Export query results to CSV, JSON, Excel (.xlsx), or XML
- **Create Database**: Create new databases with charset and collation selection
- **Create Table**: Visual table creation dialog without writing SQL
- **Create View**: Visual view creation dialog with SELECT statement editor
- **Create Stored Procedure**: Visual procedure creation with parameter support
- **Create Function**: Visual function creation with return type selection
- **Set Active Database**: Select default database for queries
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
   - **Databases**: New Query, Create Table, Create View, Create Stored Procedure, Create Function, Set as Active Database, Create Database, Drop Database
   - **Connections**: Connect, Disconnect, Edit, Delete, New Query
6. Additional actions:
   - Deploy to Azure (MySQL: Deploy to Azure command)
   - Refresh any level of the tree

### Creating Databases and Tables Visually

You can create databases and tables without writing SQL:

#### Create a Database

1. Right-click on a connected server or connection
2. Select "MySQL: Create Database"
3. Enter the database name
4. Choose a character set (default: utf8mb4)
5. Choose a collation (default: utf8mb4_general_ci)
6. Click "Create Database"

The new database will appear in the tree view automatically.

#### Create a Table

1. Right-click on a database
2. Select "MySQL: Create Table" or click the `+` inline button
3. Enter the table name
4. Define columns using the visual editor:
   - **Column Name**: Name of the column
   - **Type**: Data type (INT, VARCHAR, TEXT, DATETIME, DECIMAL, BOOLEAN, BIGINT, DATE, TIMESTAMP, JSON)
   - **Length**: Length for types like VARCHAR(255), INT(11), etc.
   - **Nullable**: Whether the column can be NULL
   - **Primary**: Mark as primary key
   - **Auto Inc**: Enable auto-increment (typically for ID columns)
5. Use "+ Add Column" to add more columns
6. Click "Create Table"

**Tip**: The first column defaults to `id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY`, which is a common pattern for database tables.

#### Create a View

1. Right-click on a database
2. Select "MySQL: Create View"
3. Enter the view name
4. Enter the SELECT statement (without the CREATE VIEW part)
5. Click "Create View"

The view will appear in the database's view list automatically.

#### Create a Stored Procedure

1. Right-click on a database
2. Select "MySQL: Create Stored Procedure"
3. Enter the procedure name
4. Optionally enter parameters (e.g., `IN user_id INT, OUT user_name VARCHAR(100)`)
5. Enter the SQL body (without BEGIN/END)
6. Click "Create Procedure"

**Example parameters**: `IN param1 INT, OUT param2 VARCHAR(100)`

#### Create a Function

1. Right-click on a database
2. Select "MySQL: Create Function"
3. Enter the function name
4. Optionally enter parameters (e.g., `user_id INT, multiplier DECIMAL(10,2)`)
5. Select the return type from the dropdown
6. Check "Deterministic" if the function always returns the same result for the same inputs
7. Enter the SQL body (must include RETURN statement, without BEGIN/END)
8. Click "Create Function"

**Note**: Functions must include a RETURN statement in the body.

#### Set Active Database

To avoid "No database selected" errors when running queries:

1. Right-click on any database
2. Select "MySQL: Set as Active Database"
3. This database will now be the default for queries on that connection

### Working with Query Results

After executing a query, you can interact with the results table:

#### Selecting Cells

- **Single cell**: Click on any cell to select it
- **Multiple cells**: Click and drag to select a range of cells
- **Extend selection**: Shift+Click to select from the last selected cell to the clicked cell
- **Add to selection**: Ctrl/Cmd+Click to add individual cells to your selection
- **Select all**: Ctrl/Cmd+A or right-click → "Select All"
- **Clear selection**: Click elsewhere, press Escape, or right-click → "Clear Selection"

#### Copying Data

Once cells are selected, you can copy them in different formats:

- **Plain Text** (Ctrl/Cmd+C): Tab-separated values, ready to paste into Excel or text editors
- **CSV Format** (Right-click → "Copy as CSV"): Properly escaped CSV with headers, ideal for spreadsheets
- **JSON Format** (Right-click → "Copy as JSON"): Structured JSON array, perfect for development work

The selection counter at the bottom shows how many cells are selected, and displays a confirmation message when you copy.

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
- `MySQL: Create Table` - Create a new table using visual dialog
- `MySQL: Create View` - Create a new view using visual dialog
- `MySQL: Create Stored Procedure` - Create a new stored procedure using visual dialog
- `MySQL: Create Function` - Create a new function using visual dialog
- `MySQL: Set as Active Database` - Set default database for queries
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
