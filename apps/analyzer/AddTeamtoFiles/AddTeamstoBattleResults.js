const fs = require('fs');
const path = require('path');

const folderPath = 'D:/DBZL/SZLeague/GitHub/SZMatchBuilder/BattleResultFiles';
const teamsToAdd = ["Tiny Terrors", "Malevolant Souls"];

fs.readdirSync(folderPath).forEach(file => {
  if (file.endsWith('.json')) {
    const filePath = path.join(folderPath, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Set TeamBattleResults.teams
    if (data.TeamBattleResults) {
      data.TeamBattleResults.teams = [...teamsToAdd];
    } else {
      console.warn(`No TeamBattleResults found in ${file}`);
    }

    // Set top-level teams
    data.teams = [...teamsToAdd];

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated: ${file}`);
  }
});