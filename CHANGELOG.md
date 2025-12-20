# Change Log

All notable changes to the "MySQL for Visual Studio Code" extension will be documented in this file.

## [1.0.0] - 2025-12-18

### Added - Phase 2 (Azure AD Authentication)
- Full Azure Active Directory (Azure AD) authentication support for Azure MySQL Flexible Server
- Microsoft Authentication Library (MSAL) integration using device code flow
- Authentication type selection in connection dialog:
  - **SQL Login**: Traditional username/password authentication
  - **Azure MFA and User**: Azure AD authentication with Multi-Factor Authentication support
- Device code authentication flow with browser-based sign-in
- Automatic token management with secure storage in VS Code SecretStorage
- Automatic token refresh when expired (silent renewal)
- Token expiration handling (refreshes 5 minutes before expiry)
- Azure AD username and tenant tracking
- Support for testing Azure AD connections before saving
- Connection flow enhancements:
  - Automatic Azure AD authentication prompt when connecting
  - Token validation and refresh on connection
  - Proper error handling for authentication failures
- SSL enforcement for Azure AD connections (required by Azure MySQL)

### Added - Phase 11 (Enhanced Settings & Configuration)
- Additional configuration options for customization:
  - Auto-connect on startup to default connection
  - Show/hide system databases (information_schema, performance_schema, sys, mysql)
  - Enable/disable IntelliSense features
  - Control table and column suggestions in IntelliSense
  - Configure connection pool size (1-100 connections)
  - Results display settings (rows per page, max column width)
- Auto-connect feature activates default connection on extension startup
- System databases filter respects user preference
- IntelliSense can be toggled on/off globally or per feature

### Added - Phase 8 (Azure Firewall Rule Management)
- Automatic Azure MySQL Flexible Server detection from connection hostname
- Azure resource information extraction (subscription, resource group, server name)
- Firewall rule management using Azure SDK:
  - List existing firewall rules
  - Create firewall rules for current IP address
  - Create custom firewall rules with IP range
  - Delete firewall rules
- Automatic firewall error detection and handling:
  - Detects connection failures due to firewall blocks
  - Prompts user to add current IP to firewall rules
  - Auto-creates firewall rule with single click
  - Offers connection retry after rule creation
- Current IP address detection via external API
- Integration with Azure DefaultAzureCredential for authentication

### Added - Phase 10 (SQL Language Features)
- IntelliSense autocomplete for SQL code:
  - 60+ MySQL keywords (SELECT, FROM, WHERE, INSERT, CREATE, etc.)
  - 30+ data types (INT, VARCHAR, DATETIME, JSON, etc.)
  - 50+ built-in functions (CONCAT, NOW, COUNT, AVG, etc.)
  - Dynamic table and column suggestions from active connection
  - Snippet support for functions with parameter placeholders
- Hover provider for metadata display:
  - Table information (engine, row count, column count, comments)
  - Column information (type, nullable, key, default value, extra attributes)
  - Query MySQL system tables for real-time information
- SQL code formatting using sql-formatter:
  - Document and range formatting support
  - Configurable keyword case (upper, lower, capitalize)
  - Configurable identifier case (upper, lower, capitalize, preserve)
  - Optional comment stripping
  - Reindent support
  - MySQL-specific syntax support
- Language features automatically enabled for .sql files
- Connection-aware IntelliSense (updates when connecting to servers)

### Added - Phase 7 (Create Database Dialog)
- Rich webview-based database creation dialog
- Real-time character set selection with descriptions
- Collation dropdown that dynamically updates based on selected charset
- Automatic loading of available charsets and collations from MySQL server
- Support for default charset (utf8mb4) and collation
- Database name validation (alphanumeric and underscores only)
- Form validation with user-friendly error messages
- Success notification with auto-close dialog
- Connection state check before showing dialog (prompts to connect if needed)
- Automatic tree view refresh after database creation
- Context menu integration on server nodes

### Added - Phase 6 (Export Functionality)
- Complete export functionality with 4 formats:
  - **CSV**: Comma-separated values with proper escaping
  - **JSON**: Structured JSON with metadata and field type information
  - **Excel (.xlsx)**: Rich Excel files with styled headers, auto-sized columns, frozen headers, and autofilter
  - **XML**: Well-formed XML with field type metadata
- Format selection via quick-pick dialog with icons and descriptions
- File save dialog with format-specific file filters
- Export current result set from results panel
- Progress indicators for large exports
- Success notifications with "Open File" and "Show in Folder" actions
- Proper handling of NULL values, dates, binary data, and complex objects
- Error handling with user-friendly messages
- Export manager coordinates all exporters

### Added - Phase 5 (Query Execution & Results Display)
- Full query execution functionality with keyboard shortcut (Ctrl+Shift+E / Cmd+Shift+E)
- Smart SQL extraction from editor (selection, current statement, or entire file)
- Multi-statement query execution with automatic parsing
- Rich webview-based results panel with tabbed interface for multiple result sets
- Real-time statistics (rows returned/affected, execution time)
- Query result table with:
  - Column headers with type information on hover
  - NULL value highlighting
  - Sortable columns (sticky header)
  - Horizontal and vertical scrolling for large datasets
- Error display with detailed error messages
- Success messages for non-SELECT queries (INSERT, UPDATE, DELETE)
- Connection auto-selection (single connection) or quick-pick (multiple connections)
- Query refresh functionality to re-run the last query
- Export button placeholder (functionality coming in Phase 6)
- Progress indicators during query execution
- Query history tracking

### Added - Phase 4 (Database Object Explorer)
- Full database object hierarchy browsing
- Expand connected servers to see all databases
- Browse tables, views, stored procedures, and functions within each database
- Context menu actions for database objects:
  - **Select Top 1000 Rows**: Generate SELECT query for table data preview
  - **View Table Structure**: Display column information (name, type, nullable, key)
  - **Script as CREATE**: Generate CREATE TABLE/VIEW statement
- Metadata provider for querying MySQL system tables
- Automatic filtering of system databases (information_schema, performance_schema, sys)
- Icons for different object types (database, table, view, procedure, function)
- Lazy loading of tree nodes for better performance
- Error handling with user-friendly messages

### Added - Phase 3 (Connection Dialog)
- Rich webview-based connection dialog for creating and editing connections
- Multi-tab interface with Basic, Advanced, and SSL configuration
- Connection testing before saving
- SSL certificate file browsing
- Support for all connection parameters (host, port, username, password, database, SSL, timeouts, etc.)
- Edit existing connections with pre-populated fields
- Real-time form validation
- Success/error status messages
- Secure password storage integration

### Added - Phase 1 (Foundation)
- Initial release with basic functionality
- Connection manager with secure password storage via VS Code SecretStorage
- MySQL client wrapper using mysql2 for database connections
- TreeView explorer showing saved MySQL connections
- Support for MySQL 5.7, 8.0, and MariaDB
- SSL/TLS connection support (disable, require, verify_ca, verify_identity)
- MySQL syntax highlighting for .sql files
- MySQL code snippets
- Azure MySQL Flexible Server deployment link
- Basic commands:
  - Connect to saved connection
  - Disconnect from server
  - Delete connection
  - Refresh connections
  - New query file creation
  - Deploy to Azure

### Configuration
- Connection settings stored in VS Code configuration
- Passwords stored securely in VS Code SecretStorage
- Configurable query timeout and max results
- SQL formatting options
- Debug logging option

### Technical Requirements
- Node.js 20.0.0 or higher (required for Azure AD authentication dependencies)
- VS Code 1.85.0 or higher

### Known Limitations
- Table data editing not yet available
- Query history UI not yet available (tracked internally)
- Database drop functionality not yet available

### Development Status
- Phase 1: ✅ COMPLETED - Project foundation, connection management, tree view
- Phase 2: ✅ COMPLETED - Azure AD authentication (MFA and User)
- Phase 3: ✅ COMPLETED - Connection dialog webview
- Phase 4: ✅ COMPLETED - Full database object explorer
- Phase 5: ✅ COMPLETED - Query execution with rich results display
- Phase 6: ✅ COMPLETED - Export to CSV, JSON, Excel, XML
- Phase 7: ✅ COMPLETED - Create database dialog with charset/collation
- Phase 8: ✅ COMPLETED - Azure firewall rule management
- Phase 9: ✅ COMPLETED - Azure deployment (portal link integration)
- Phase 10: ✅ COMPLETED - SQL IntelliSense and formatting
- Phase 11: ✅ COMPLETED - Enhanced settings and configuration
- Phase 12: ✅ IN PROGRESS - Final documentation and packaging
