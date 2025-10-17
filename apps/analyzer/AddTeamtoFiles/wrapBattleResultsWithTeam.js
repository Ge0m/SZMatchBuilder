#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node wrapBattleResultsWithTeam.js [<inputPath>] [--teams="Team1,Team2"] [--inplace]');
  console.log('If <inputPath> is a folder (or omitted), all .json files inside will be processed.');
}

function wrapData(data, teams) {
  // If data already has TeamBattleResults at top-level, merge/ensure teams
  if (data.TeamBattleResults) {
    data.TeamBattleResults.teams = teams;
    return data;
  }

  return {
    TeamBattleResults: {
      teams: teams,
      battleResults: data
    }
  };
}

function processFile(filePath, teams, inplace) {
  try {
    const buf = fs.readFileSync(filePath);
    // try multiple encodings to be robust against BOMs/UTF-16 files
    const tryEncodings = ['utf8', 'utf16le', 'latin1'];
    let data = null;
    let lastErr = null;
    for (const enc of tryEncodings) {
      try {
        let raw = buf.toString(enc);
        // strip BOM if present
        raw = raw.replace(/^\uFEFF/, '');
        data = JSON.parse(raw);
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!data) {
      console.error(`Skipping ${filePath}: invalid JSON (tried utf8/utf16le/latin1) — last error: ${lastErr && lastErr.message}`);
      return;
    }

    const wrapped = wrapData(data, teams);
    const outPath = inplace ? filePath : filePath.replace(/\\.json$/i, '.wrapped.json');
    fs.writeFileSync(outPath, JSON.stringify(wrapped, null, 2), 'utf8');
    console.log(`${inplace ? 'Overwrote' : 'Wrote'}: ${outPath}`);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
}

function main() {
  const argv = process.argv.slice(2);

  // default input folder: this script's directory (AddTeamtoFiles)
  const defaultFolder = path.resolve(__dirname);

  const inputPathArg = argv.find(a => !a.startsWith('--'));
  const inputPath = inputPathArg ? inputPathArg : defaultFolder;

  const teamsArg = argv.find(a => a.startsWith('--teams='));
  const teams = teamsArg ? teamsArg.split('=')[1].split(',').map(s => s.trim()) : ['Sentai','Malevolant Souls'];

  const inplace = argv.includes('--inplace');
  const stat = fs.existsSync(inputPath) && fs.statSync(inputPath);
  if (!stat) {
    console.error('Input path does not exist:', inputPath);
    process.exit(2);
  }

  if (stat.isDirectory()) {
    fs.readdirSync(inputPath).forEach(f => {
      if (f.toLowerCase().endsWith('.json')) {
        processFile(path.join(inputPath, f), teams, inplace);
      }
    });
  } else if (stat.isFile()) {
    processFile(inputPath, teams, inplace);
  } else {
    console.error('Unsupported input path:', inputPath);
    process.exit(3);
  }
}

if (require.main === module) main();
