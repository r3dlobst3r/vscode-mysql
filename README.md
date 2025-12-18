# MySQL for Visual Studio Code

MySQL database management extension for Visual Studio Code with complete feature parity with Azure Data Studio.

## Features

### ✅ Implemented (Phase 1, 3 & 4)
- **Connection Management**: Save and manage MySQL connections with secure password storage
- **Connection Dialog** (Phase 3): Rich webview-based UI for creating and editing connections
- **Connection Testing**: Test connections before saving
- **TreeView Explorer**: View all your MySQL connections in the VS Code sidebar
- **Database Object Explorer** (Phase 4): Browse databases, tables, views, stored procedures, and functions
- **Table Operations**: Select top 1000 rows, view table structure, script as CREATE
- **MySQL Client**: Connect to MySQL 5.7, 8.0, and MariaDB
- **SSL Support**: Configure SSL connections (disable, require, verify_ca, verify_identity) with certificate browsing
- **Advanced Settings**: Connection timeout, client flags, SQL mode
- **Syntax Highlighting**: MySQL-specific SQL syntax highlighting
- **Code Snippets**: MySQL code snippets for common operations
- **Azure Deployment**: Quick link to deploy Azure MySQL Flexible Server

### 🚧 Coming Soon
- **Query Execution** (Phase 5): Execute SQL queries with Ctrl+Shift+E
- **Results Display** (Phase 5): Rich table view with sorting, filtering, pagination
- **Export Functionality** (Phase 6): Export to CSV, JSON, Excel, XML
- **Create Database** (Phase 7): Create new databases with charset/collation selection
- **Azure AD Authentication** (Phase 2): Azure MFA and User authentication
- **Azure Firewall Rules** (Phase 8): Manage firewall rules for Azure MySQL
- **SQL IntelliSense** (Phase 10): Code completion for keywords, tables, columns
- **SQL Formatting** (Phase 10): Format SQL code with configurable options

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
  // Maximum number of rows to return from a query
  "mysql.maxQueryResults": 1000,

  // Query timeout in seconds
  "mysql.queryTimeout": 30,

  // Show query execution time in results
  "mysql.showQueryExecutionTime": true,

  // SQL formatting options
  "mysql.format.keywordCase": "upper",
  "mysql.format.identifierCase": null,
  "mysql.format.stripComments": false,
  "mysql.format.reindent": true,

  // Enable debug logging
  "mysql.logDebugInfo": false
}
```

## Commands

- `MySQL: New Connection` - Create a new connection (coming in Phase 3)
- `MySQL: Disconnect` - Disconnect from a server
- `MySQL: Edit Connection` - Edit an existing connection (coming in Phase 3)
- `MySQL: Delete Connection` - Delete a connection
- `MySQL: Refresh` - Refresh the connection tree
- `MySQL: Execute Query` (Ctrl+Shift+E) - Execute SQL query (coming in Phase 5)
- `MySQL: New Query` - Create a new SQL file
- `MySQL: Create Database` - Create a new database (coming in Phase 7)
- `MySQL: Export Results` - Export query results (coming in Phase 6)
- `MySQL: Deploy to Azure` - Deploy MySQL to Azure

## Keyboard Shortcuts

- `Ctrl+Shift+E` (Mac: `Cmd+Shift+E`) - Execute SQL query (when implemented)

## SSL Configuration

The extension supports multiple SSL modes:

- **Disable**: No SSL encryption
- **Require**: SSL required but certificate not verified
- **Verify CA**: Verify server certificate against CA
- **Verify Identity**: Full certificate verification including hostname

## Requirements

- Visual Studio Code 1.85.0 or higher
- MySQL 5.7, 8.0, or MariaDB server

## Development Status

This extension is currently in active development. Phases 1 and 3 are complete. The following phases are planned:

- **Phase 1**: ✅ Complete - Project foundation, connection management, tree view
- **Phase 2**: 🚧 Planned - Azure AD authentication
- **Phase 3**: ✅ Complete - Connection dialog webview
- **Phase 4**: ✅ Complete - Database object explorer
- **Phase 5**: 🚧 Planned - Query execution and results display
- **Phase 6**: 🚧 Planned - Export functionality
- **Phase 7**: 🚧 Planned - Create database dialog
- **Phase 8-9**: 🚧 Planned - Azure firewall and deployment
- **Phase 10**: 🚧 Planned - SQL language features
- **Phase 11**: 🚧 Planned - Settings and configuration
- **Phase 12**: 🚧 Planned - Testing and QA
- **Phase 13**: 🚧 Planned - Final packaging

## Known Limitations

- Query execution not yet implemented (queries can be generated but not executed)
- Export functionality not yet implemented
- Azure AD authentication not yet available
- Table data editing not yet available

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/r3dlobst3r/vscode-mysql).

## License

MIT

## Privacy

This extension stores passwords securely using VS Code's SecretStorage API. No credentials are stored in plain text. Optional telemetry can be disabled in settings.
