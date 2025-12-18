# Change Log

All notable changes to the "MySQL for Visual Studio Code" extension will be documented in this file.

## [1.0.0] - 2025-12-18

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

### Known Limitations
- Export functionality not yet available (placeholder in results panel)
- Azure AD authentication not yet available (planned for Phase 2)
- Table data editing not yet available
- Query history UI not yet available (tracked internally)

### Coming in Future Releases
- Phase 2: Azure AD authentication (MFA and User)
- Phase 4: ✅ COMPLETED - Full database object explorer
- Phase 5: ✅ COMPLETED - Query execution with rich results display
- Phase 6: Export to CSV, JSON, Excel, XML
- Phase 7: Create database dialog with charset/collation
- Phase 8: Azure firewall rule management
- Phase 10: SQL IntelliSense and formatting
- Phase 11: Additional configuration options
