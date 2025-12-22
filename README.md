# MySQL for Visual Studio Code

Manage MySQL databases directly in VS Code. Connect to servers, browse databases, run queries, and export results.

## Features

- **Database Explorer** - Browse databases, tables, views, procedures, and functions in the sidebar
- **Query Execution** - Run SQL queries with `Ctrl+Shift+E` and view results in a rich table interface
- **Visual Editors** - Create databases, tables, views, procedures, and functions without writing SQL
- **Cell Selection** - Select and copy query results as text, CSV, or JSON
- **Export** - Export results to CSV, JSON, Excel, or XML
- **IntelliSense** - Autocomplete for SQL keywords, tables, columns, and functions
- **Azure Support** - Azure AD authentication and automatic firewall management for Azure MySQL

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Click `...` → "Install from VSIX..."
4. Select the `.vsix` file

## Quick Start

1. Click the MySQL icon in the sidebar
2. Click `+` to add a connection
3. Enter your server details and test the connection
4. Click Save and connect to start browsing

Right-click on databases and tables to explore available actions.

## Creating Objects

### Database
Right-click a server → **Create Database**
- Choose charset (default: utf8mb4) and collation

### Table
Right-click a database → **Create Table**
- Add columns with types, lengths, and constraints
- First column defaults to `id INT(11) AUTO_INCREMENT PRIMARY KEY`

### View
Right-click a database → **Create View**
- Enter view name and SELECT statement

### Stored Procedure
Right-click a database → **Create Stored Procedure**
- Define parameters like `IN user_id INT, OUT name VARCHAR(100)`
- Enter procedure body (BEGIN/END added automatically)

### Function
Right-click a database → **Create Function**
- Define parameters and select return type
- Mark as DETERMINISTIC if it returns consistent results
- Body must include a RETURN statement

## Working with Results

**Selecting Cells:**
- Click and drag to select ranges
- Ctrl/Cmd+Click to select multiple cells
- Shift+Click to extend selection
- Ctrl/Cmd+A to select all

**Copying Data:**
- Ctrl/Cmd+C - Plain text (tab-separated)
- Right-click → Copy as CSV
- Right-click → Copy as JSON

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Execute Query | Ctrl+Shift+E | Run SQL and show results |
| New Query | | Create a new SQL file |
| Create Database | | Visual database creation dialog |
| Create Table | | Visual table creation dialog |
| Export Results | | Export to CSV, JSON, Excel, or XML |

## Configuration

Key settings:

```jsonc
{
  "mysql.autoConnectOnStartup": false,      // Auto-connect on startup
  "mysql.maxQueryResults": 1000,            // Max rows returned
  "mysql.showSystemDatabases": false,       // Show system databases
  "mysql.intelliSense.enabled": true,       // Enable IntelliSense
  "mysql.format.keywordCase": "upper",      // SQL formatting: upper, lower, capitalize
  "mysql.connectionPool.size": 5            // Connection pool size (1-100)
}
```

See [package.json](package.json) for all available settings.

## Azure Support

### Azure AD Authentication
Connect to Azure MySQL Flexible Server using Azure Active Directory:
1. Select "Azure MFA and User" when creating a connection
2. Complete device code authentication in your browser
3. Tokens are stored securely and refreshed automatically

### Firewall Management
If a connection fails due to Azure firewall rules:
- You'll be prompted to add your IP address
- Click to create the rule automatically
- Retry the connection

## SSL Configuration

Supported modes:
- **Disable** - No SSL
- **Require** - SSL required, no certificate verification
- **Verify CA** - Verify server certificate
- **Verify Identity** - Full certificate and hostname verification

## Requirements

- VS Code 1.85.0+
- MySQL 5.7, 8.0, or MariaDB

## Building from Source

```bash
npm install
npm run compile
npm run vsce:package
```

Creates `mysql-manager-{version}.vsix` in the project root.

## License

MIT - See [LICENSE.txt](LICENSE.txt)

## Privacy

Passwords are stored securely using VS Code's SecretStorage API. No credentials are stored in plain text.
