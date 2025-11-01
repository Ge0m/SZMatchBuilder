const fs = require('fs');
const path = require('path');

/**
 * Recursively reads a directory and returns a nested object representing the folder structure.
 * @param {string} dirPath - The directory to read.
 * @returns {object}
 */
function readDataStructure(dirPath) {
  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) return null;

  const result = {};
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const itemStats = fs.statSync(itemPath);
    if (itemStats.isDirectory()) {
      result[item] = readDataStructure(itemPath);
    } else if (itemStats.isFile() && item.endsWith('.json')) {
      if (!result.files) result.files = [];
      result.files.push(item);
    }
  }
  return result;
}

// Example usage:
if (require.main === module) {
  const dataDir = path.resolve(__dirname, '../../BR_Data');
  const structure = readDataStructure(dataDir);
  console.log(JSON.stringify(structure, null, 2));
}

module.exports = { readDataStructure };