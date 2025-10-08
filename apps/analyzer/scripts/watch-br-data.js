const chokidar = require('chokidar');
const path = require('path');
const { processJsonFiles } = require('./fix-json-encoding.js');

/**
 * File watcher for BR_Data directory
 * Automatically fixes encoding and formats JSON files when they are added or modified
 */

const BR_DATA_DIR = path.join(__dirname, '..', 'BR_Data');

function startWatcher() {
  console.log('👀 Starting file watcher for BR_Data directory...');
  console.log(`📁 Watching: ${BR_DATA_DIR}`);
  
  const watcher = chokidar.watch(path.join(BR_DATA_DIR, '*.json'), {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: false // Process existing files on startup
  });
  
  watcher
    .on('add', filePath => {
      console.log(`\n📥 New file detected: ${path.basename(filePath)}`);
      processNewFile(filePath);
    })
    .on('change', filePath => {
      console.log(`\n📝 File changed: ${path.basename(filePath)}`);
      processNewFile(filePath);
    })
    .on('ready', () => {
      console.log('✅ File watcher is ready and monitoring for changes');
    })
    .on('error', error => {
      console.error(`❌ Watcher error: ${error}`);
    });
  
  return watcher;
}

function processNewFile(filePath) {
  const { detectAndFixEncoding, formatWithPrettier } = require('./fix-json-encoding.js');
  
  setTimeout(() => {
    console.log(`🔍 Processing: ${path.basename(filePath)}`);
    
    if (detectAndFixEncoding(filePath)) {
      if (formatWithPrettier(filePath)) {
        console.log(`✅ Successfully processed: ${path.basename(filePath)}`);
      }
    }
  }, 500); // Small delay to ensure file write is complete
}

// Start watcher if run directly
if (require.main === module) {
  const watcher = startWatcher();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down file watcher...');
    watcher.close();
    process.exit(0);
  });
}

module.exports = { startWatcher };