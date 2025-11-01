const express = require('express');
const cors = require('cors');
const { readDataStructure } = require('../src/utils/readDataStructure');
const path = require('path');


const app = express();
const PORT = 5174; // Use a port not used by Vite

app.use(cors());

// Serve static files from BR_Data
const dataDir = path.resolve(__dirname, '../BR_Data');
app.use('/BR_Data', express.static(dataDir));

app.get('/api/br-data-structure', (req, res) => {
  try {
    const dataDir = path.resolve(__dirname, '../BR_Data');
    console.log('Reading data structure from:', dataDir);
    const structure = readDataStructure(dataDir);
    console.log('Structure read successfully, keys:', Object.keys(structure));
    res.json(structure);
  } catch (err) {
    console.error('Error reading data structure:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BR Data API server running at http://localhost:${PORT}/api/br-data-structure`);
  console.log(`Server listening on all interfaces (0.0.0.0:${PORT})`);
});

