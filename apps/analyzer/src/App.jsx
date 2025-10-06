
import React, { useState, useMemo } from 'react';

// Dynamically import all JSON files in BR_Data
const dataFiles = import.meta.glob('../BR_Data/*.json', { eager: true });
// Import characters.csv for key-to-name mapping
import charactersCSV from '../referencedata/characters.csv?raw';

function parseCharacterCSV(csv) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const map = {};
  for (let i = 1; i < lines.length; i++) {
    const [name, id] = lines[i].split(',');
    if (id) map[id.trim()] = name.trim();
  }
  return map;
}

function getTeams(characterRecord) {
  // P1: keys '１ＶＳ１の１Ｐの開始地点', AlliesTeamMember#
  // P2: keys '１ＶＳ１の２Ｐの開始地点', EnemyTeamMember#
  const p1Keys = Object.keys(characterRecord).filter(k => k.includes('１Ｐ') || k.includes('AlliesTeamMember'));
  const p2Keys = Object.keys(characterRecord).filter(k => k.includes('２Ｐ') || k.includes('EnemyTeamMember'));
  return {
    p1: p1Keys.map(k => ({ ...characterRecord[k], _key: k })),
    p2: p2Keys.map(k => ({ ...characterRecord[k], _key: k }))
  };
}

function extractStats(char, charMap) {
  const play = char.battlePlayCharacter || {};
  const count = char.battleCount || {};
  const numCount = count.battleNumCount || {};
  // Character name
  const charId = play.character?.key || play.originalCharacter?.key || '';
  const name = charMap[charId] || charId || '-';
  // Form change history
  let formNames = '-';
  const originalForm = char.battlePlayCharacter?.originalCharacter?.key;
  if (Array.isArray(char.formChangeHistory) && char.formChangeHistory.length) {
    const forms = [originalForm, ...char.formChangeHistory.map(f => f.key)].filter(Boolean);
    formNames = forms.map(f => charMap[f] || f).join(', ');
  } else if (originalForm) {
    formNames = charMap[originalForm] || originalForm;
  }
  return {
    name,
    damageDone: count.givenDamage || 0,
    damageTaken: count.takenDamage || 0,
    hPGaugeValue: play.hPGaugeValue || 0,
    specialMovesUsed: numCount.sPMCount || 0,
    ultimatesUsed: numCount.uLTCount || 0,
    skillsUsed: numCount.eXACount || 0,
    kills: count.killCount || 0,
    formChangeHistory: formNames
  };
}

function getTeamStats(teamRecords, charMap) {
  let totalDamage = 0, totalTaken = 0, totalHealth = 0, totalSpecial = 0, totalUltimates = 0, totalSkills = 0;
  teamRecords.forEach(char => {
    const stats = extractStats(char, charMap);
    totalDamage += stats.damageDone;
    totalTaken += stats.damageTaken;
    totalHealth += stats.hPGaugeValue;
    totalSpecial += stats.specialMovesUsed;
    totalUltimates += stats.ultimatesUsed;
    totalSkills += stats.skillsUsed;
  });
  return { totalDamage, totalTaken, totalHealth, totalSpecial, totalUltimates, totalSkills };
}


export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);

  // Parse character map once
  const charMap = useMemo(() => parseCharacterCSV(charactersCSV), []);

  const fileNames = Object.keys(dataFiles).map((path) => path.split('/').pop());

  const handleSelect = (fileName) => {
    setSelectedFile(fileName);
    const fullPath = Object.keys(dataFiles).find((p) => p.endsWith(fileName));
    if (fullPath) {
      setFileContent(dataFiles[fullPath]);
    } else {
      setFileContent({ error: 'File not found.' });
    }
  };

  // Find correct root for battleWinLose and characterRecord
  let battleWinLose, characterRecord;
  if (fileContent && typeof fileContent === 'object') {
    if (fileContent.BattleResults) {
      battleWinLose = fileContent.BattleResults.battleWinLose;
      characterRecord = fileContent.BattleResults.characterRecord;
    } else {
      battleWinLose = fileContent.battleWinLose;
      characterRecord = fileContent.characterRecord;
    }
  }

  // Extract teams
  let p1Team = [], p2Team = [];
  let allCharKeys = [];
  if (characterRecord) {
    allCharKeys = Object.keys(characterRecord);
    const teams = getTeams(characterRecord);
    p1Team = teams.p1;
    p2Team = teams.p2;
  }

  // Team summaries
  const p1Summary = getTeamStats(p1Team, charMap);
  const p2Summary = getTeamStats(p2Team, charMap);

  return (
    <div style={{ padding: 32 }}>
      <h1>Sparking Zero Match Analyzer</h1>
      <p>Select a test data file to view its contents.</p>
      <select
        value={selectedFile || ''}
        onChange={e => handleSelect(e.target.value)}
        style={{ marginBottom: 16, padding: 4 }}
      >
        <option value="" disabled>Select a file...</option>
        {fileNames.map((file) => (
          <option key={file} value={file}>{file}</option>
        ))}
      </select>

      {selectedFile && (
        <div style={{ marginTop: 24 }}>
          <h2>Match Summary: {selectedFile}</h2>
          <div style={{ marginBottom: 16 }}>
            <strong>Battle Result:</strong>
            <div>P1 Team: {battleWinLose === 'Win' ? 'Win' : 'Loss'}</div>
            <div>P2 Team: {battleWinLose === 'Win' ? 'Loss' : 'Win'}</div>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <h3>P1 Team Summary</h3>
              <table border="1" cellPadding="4">
                <thead>
                  <tr>
                    <th>Total Damage</th>
                    <th>Total Taken</th>
                    <th>Total HP Remaining</th>
                    <th>Blasts</th>
                    <th>Ultimates</th>
                    <th>Skills</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{p1Summary.totalDamage}</td>
                    <td>{p1Summary.totalTaken}</td>
                    <td>{p1Summary.totalHealth}</td>
                    <td>{p1Summary.totalSpecial}</td>
                    <td>{p1Summary.totalUltimates}</td>
                    <td>{p1Summary.totalSkills}</td>
                  </tr>
                </tbody>
              </table>
              <h4>Characters</h4>
              <table border="1" cellPadding="4">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Damage</th>
                    <th>Taken</th>
                    <th>HP Remaining</th>
                    <th>Blasts</th>
                    <th>Ultimates</th>
                    <th>Skills</th>
                    <th>Kills</th>
                    <th>Form History</th>
                  </tr>
                </thead>
                <tbody>
                  {p1Team.map((char, i) => {
                    const stats = extractStats(char, charMap);
                    return (
                      <tr key={i}>
                        <td>{stats.name}</td>
                        <td>{stats.damageDone}</td>
                        <td>{stats.damageTaken}</td>
                        <td>{stats.hPGaugeValue}</td>
                        <td>{stats.specialMovesUsed}</td>
                        <td>{stats.ultimatesUsed}</td>
                        <td>{stats.skillsUsed}</td>
                        <td>{stats.kills}</td>
                        <td>{stats.formChangeHistory}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div>
              <h3>P2 Team Summary</h3>
              <table border="1" cellPadding="4">
                <thead>
                  <tr>
                    <th>Total Damage</th>
                    <th>Total Taken</th>
                    <th>Total HP Remaining</th>
                    <th>Blasts</th>
                    <th>Ultimates</th>
                    <th>Skills</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{p2Summary.totalDamage}</td>
                    <td>{p2Summary.totalTaken}</td>
                    <td>{p2Summary.totalHealth}</td>
                    <td>{p2Summary.totalSpecial}</td>
                    <td>{p2Summary.totalUltimates}</td>
                    <td>{p2Summary.totalSkills}</td>
                  </tr>
                </tbody>
              </table>
              <h4>Characters</h4>
              <table border="1" cellPadding="4">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Damage</th>
                    <th>Taken</th>
                    <th>HP Remaining</th>
                    <th>Blasts</th>
                    <th>Ultimates</th>
                    <th>Skills</th>
                    <th>Kills</th>
                    <th>Form History</th>
                  </tr>
                </thead>
                <tbody>
                  {p2Team.map((char, i) => {
                    const stats = extractStats(char, charMap);
                    return (
                      <tr key={i}>
                        <td>{stats.name}</td>
                        <td>{stats.damageDone}</td>
                        <td>{stats.damageTaken}</td>
                        <td>{stats.hPGaugeValue}</td>
                        <td>{stats.specialMovesUsed}</td>
                        <td>{stats.ultimatesUsed}</td>
                        <td>{stats.skillsUsed}</td>
                        <td>{stats.kills}</td>
                        <td>{stats.formChangeHistory}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
