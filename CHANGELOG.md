# Change Log

All notable changes to the MySQL Manager extension.

## [1.2.0] - 2025-12-22

### Changed
- Changed license from MIT to GPL-3.0
- Updated README to be more concise and user-friendly

### Fixed
- Fixed GitHub Actions publish workflow to properly upload VSIX files to releases
- Publish workflow now creates VSIX package before publishing to marketplace

## [1.1.9] - 2025-12-22

### Changed
- Simplified README documentation
- Reduced verbosity in user-facing documentation

## [1.1.8] - 2025-12-21

### Fixed
- Fixed "Cannot read properties of undefined (reading 'name')" error when using New Query command
- Removed leftover development messages ("Phase 5", "Phase 6") from user-facing notifications
- Improved Select Top 1000 command to execute query immediately instead of just creating SQL file

## [1.1.7] - 2025-12-21

### Fixed
- Improved asset upload in GitHub Actions publish workflow

## [1.1.6] - 2025-12-21

### Fixed
- Updated asset paths in publish workflow

## [1.1.5] - 2025-12-21

### Changed
- Updated display name to "MySQL Manager"

## [1.1.4] - 2025-12-21

### Changed
- Renamed extension ID to avoid naming conflicts

## [1.1.3] - 2025-12-21

### Fixed
- Updated GitHub Actions authentication token handling

## [1.1.2] - 2025-12-21

### Added
- GitHub Actions workflow for automatic publishing to VS Code Marketplace on release

## [1.1.0] - 2025-12-21

### Added - Visual Database Object Creation
- **Visual Table Creation Dialog**
  - Interactive grid-based column editor
  - Support for all major MySQL data types (INT, VARCHAR, TEXT, DATETIME, DECIMAL, BOOLEAN, BIGINT, DATE, TIMESTAMP, JSON)
  - Column configuration: name, type, length, nullable, primary key, auto-increment
  - Default first column: `id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY`
  - Table name validation
  - Context menu integration

- **Visual View Creation Dialog**
  - Define view name and SELECT statement
  - Input validation
  - Automatic CREATE VIEW statement generation

- **Visual Stored Procedure Creation Dialog**
  - Define procedure name and parameters
  - IN/OUT parameter support
  - Automatic DELIMITER handling

- **Visual Function Creation Dialog**
  - Define function name, parameters, and return type
  - DETERMINISTIC/NOT DETERMINISTIC toggle
  - RETURN statement validation

### Added - Cell Selection & Copy in Results
- **Interactive Cell Selection**
  - Single cell, range, and multi-cell selection
  - Keyboard shortcuts (Ctrl/Cmd+C, Ctrl/Cmd+A)

- **Copy in Multiple Formats**
  - Copy as plain text (tab-separated)
  - Copy as CSV with proper escaping
  - Copy as JSON with structured data

### Fixed
- Right-click context menu now preserves cell selection in query results

## [1.0.0] - 2025-12-20

### Added - Core Features
- **Connection Management**
  - Save and manage MySQL connections with secure password storage
  - Rich webview-based connection dialog
  - Connection testing before saving
  - SSL support (disable, require, verify_ca, verify_identity)
  - Advanced settings (timeout, client flags, SQL mode)

- **Database Explorer**
  - TreeView showing connections, databases, tables, views, procedures, and functions
  - Lazy loading for better performance
  - Context menu actions for all object types
  - Refresh functionality at any level

- **Query Execution**
  - Execute SQL queries with Ctrl+Shift+E keyboard shortcut
  - Smart SQL extraction (selection, current statement, or entire file)
  - Multi-statement query execution
  - Rich results panel with tabbed interface
  - Sortable columns with sticky headers
  - NULL value highlighting
  - Query history tracking

- **Export Functionality**
  - Export to CSV with proper escaping
  - Export to JSON with metadata
  - Export to Excel (.xlsx) with styled headers
  - Export to XML with field type metadata
  - Progress indicators for large exports

- **Database Management**
  - Create databases with charset and collation selection
  - View table structure
  - Select top 1000 rows
  - Script as CREATE for tables and views

- **Azure Support**
  - Azure AD authentication (MFA and User)
  - Device code flow authentication
  - Automatic token management and refresh
  - Azure firewall rule management
  - Automatic firewall error detection
  - One-click IP whitelisting
  - Azure MySQL Flexible Server deployment link

- **SQL Language Features**
  - IntelliSense autocomplete for keywords, data types, functions, tables, and columns
  - Hover information for tables and columns
  - SQL code formatting with configurable options
  - MySQL-specific syntax highlighting
  - Code snippets for common operations

- **Enhanced Settings**
  - Auto-connect on startup
  - Show/hide system databases
  - Configurable IntelliSense
  - Connection pool size configuration
  - Results display settings (rows per page, max column width)
  - SQL formatting options (keyword case, identifier case)

### Added - CI/CD
- GitHub Actions workflows for build, test, and release
- Automated release creation on merge to main

### Technical
- VS Code 1.85.0+ support
- Node.js 20.0.0+ support
- MySQL 5.7, 8.0, and MariaDB compatibility
- Secure password storage using VS Code SecretStorage
