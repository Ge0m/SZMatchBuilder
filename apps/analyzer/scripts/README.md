# JSON Encoding Fix Scripts

This directory contains automated scripts to handle JSON file encoding issues in the BR_Data directory.

## Scripts

### 1. `fix-json-encoding.js`
Detects and fixes encoding issues in JSON files:
- Handles UTF-16 LE files with BOM
- Removes UTF-8 BOM characters
- Validates JSON syntax
- Formats files with Prettier

**Usage:**
```bash
npm run fix-json
```

### 2. `watch-br-data.js`
File watcher that automatically processes new or modified JSON files in BR_Data:
- Monitors the BR_Data directory for changes
- Automatically fixes encoding issues
- Formats files with Prettier

**Usage:**
```bash
npm run watch-br-data
```

## Common Issues Handled

1. **UTF-16 LE with BOM**: Files that start with `FF FE` bytes
2. **UTF-8 with BOM**: Files that start with `EF BB BF` bytes
3. **JSON formatting**: Inconsistent indentation and spacing

## Integration

These scripts are designed to work with the Dragon Ball Sparking Zero Battle Results analyzer. They ensure that all JSON files in the BR_Data directory are properly encoded and formatted for use with the Vite build system.

## File Processing Flow

1. Detect file encoding (UTF-16 LE, UTF-8 with BOM, or clean UTF-8)
2. Convert to clean UTF-8 if needed
3. Validate JSON syntax
4. Format with Prettier for consistency
5. Save as clean UTF-8 without BOM