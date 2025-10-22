import { readDataStructure } from '../utils/readDataStructure';

export async function GET(req, res) {
  try {
    const dataDir = require('path').resolve(__dirname, '../../BR_Data');
    const structure = readDataStructure(dataDir);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify(structure));
  } catch (err) {
    res.status(500).end(JSON.stringify({ error: err.message }));
  }
}
