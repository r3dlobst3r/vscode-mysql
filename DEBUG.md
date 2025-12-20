# MySQL Extension Debugging Guide

## Enable Debug Logging

1. Open VS Code Settings (Cmd+,)
2. Search for "MySQL Debug"
3. Enable `mysql.logDebugInfo`

Or add to settings.json:
```json
{
  "mysql.logDebugInfo": true
}
```

## View Extension Logs

1. Open Output panel: `View > Output` (Cmd+Shift+U)
2. Select "MySQL" from the dropdown

## Common Issues

### Issue: Can't connect after saving connection

**Symptoms**: Connection test works, but clicking connect doesn't work

**Steps to debug**:
1. Enable debug logging (see above)
2. Open MySQL view in sidebar
3. Right-click your connection
4. Click "Connect" (the connection item itself, not the test button)
5. Check Output panel for errors

**Expected logs**:
```
[INFO] Connecting to MySQL server: localhost:3306
[INFO] Successfully connected to MySQL server: localhost:3306
[INFO] Connected to Docker
```

### Issue: Can't execute queries

**Symptoms**: Connection works but queries fail

**Steps to debug**:
1. Create a new SQL file: `test.sql`
2. Add a simple query:
   ```sql
   SELECT 1 as test;
   ```
3. Press Ctrl+Shift+E (or Cmd+Shift+E on Mac)
4. Check Output panel for errors

**Expected logs**:
```
[DEBUG] Executing query: SELECT 1 as test
[INFO] Query executed successfully in Xms, 1 rows returned
```

### Issue: No connection in dropdown when executing query

**Solution**: Make sure the connection shows as "connected" (green icon) in the tree view before executing queries.

## Step-by-Step Connection Test

1. **Open MySQL View**
   - Click MySQL icon in Activity Bar (left sidebar)

2. **Create Connection**
   - Click + button
   - Fill in details:
     - Name: Test
     - Host: localhost
     - Port: 3306
     - Username: root
     - Password: your_password
   - Click "Test Connection" - should show success
   - Click "Save Connection"

3. **Connect to Server**
   - Find "Test" in the tree
   - Click the connection item itself (or right-click > Connect)
   - Wait for "Connected to Test" message
   - Connection should now show green icon

4. **Execute Query**
   - Create new file: test.sql
   - Add: `SELECT 1 as test;`
   - Press Cmd+Shift+E (or Ctrl+Shift+E)
   - Should see results panel

## Check for Errors

Look for these error patterns in the Output panel:

### Authentication Errors
```
Error: Access denied for user 'root'@'localhost'
```
**Solution**: Check username/password

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: MySQL server not running

### Host Not Found
```
Error: getaddrinfo ENOTFOUND localhost
```
**Solution**: Check hostname

### Timeout
```
Error: connect ETIMEDOUT
```
**Solution**: Check firewall or increase timeout

## Report Issues

If still having problems, capture:
1. Full output from MySQL output panel
2. Steps to reproduce
3. MySQL version: `mysql --version`
4. Extension version: Check package.json or Extensions view
