/**
 * Team Performance Matrix Generator
 * 
 * Creates a hierarchical pivot table showing team aggregates with characters grouped beneath.
 * All stats from Character Averages are included with proper totals/averages at team level.
 */

/**
 * Process character data into team-grouped structure
 * @param {Array} characterData - Aggregated character performance data
 * @returns {Array} Team groups with aggregated stats and character details
 */
export function processTeamGroups(characterData) {
  // Group characters by primary team
  const teamMap = new Map();
  
  characterData.forEach(character => {
    const teamName = character.primaryTeam || 'No Team';
    
    if (!teamMap.has(teamName)) {
      teamMap.set(teamName, {
        teamName,
        characters: [],
        totalMatches: 0
      });
    }
    
    const team = teamMap.get(teamName);
    team.characters.push(character);
    team.totalMatches += character.matchCount || 0;
  });
  
  // Convert to array and sort by total matches (descending)
  const teams = Array.from(teamMap.values()).sort((a, b) => b.totalMatches - a.totalMatches);
  
  // Calculate team-level aggregates for each team
  teams.forEach(team => {
    calculateTeamAggregates(team);
  });
  
  return teams;
}

/**
 * Calculate aggregate statistics at the team level
 * Uses top 5 characters (by combat score) for most stats
 * @param {Object} team - Team object with characters array
 */
function calculateTeamAggregates(team) {
  const characters = team.characters;
  const totalMatches = team.totalMatches;
  
  if (characters.length === 0 || totalMatches === 0) return;
  
  // Sort characters by combat performance score (descending) and get top 5
  const top5Characters = [...characters]
    .sort((a, b) => (b.combatPerformanceScore || 0) - (a.combatPerformanceScore || 0))
    .slice(0, 5);
  
  // Calculate team win rate and match count based on unique matches (not per character)
  // Group matches by fileName to get unique team matches
  const uniqueMatches = new Map();
  characters.forEach(char => {
    if (char.matches && Array.isArray(char.matches)) {
      char.matches.forEach(match => {
        if (match.fileName && match.team === team.teamName) {
          // Use fileName as unique match identifier
          if (!uniqueMatches.has(match.fileName)) {
            uniqueMatches.set(match.fileName, match.won);
          }
        }
      });
    }
  });
  
  const totalUniqueMatches = uniqueMatches.size;
  const teamWins = Array.from(uniqueMatches.values()).filter(won => won).length;
  const winRate = totalUniqueMatches > 0 ? (teamWins / totalUniqueMatches) * 100 : 0;
  
  // Calculate top 5 HP totals first (needed for HP retention)
  const top5TotalMaxHP = sumTop5(top5Characters, 'avgHPGaugeValueMax');
  const top5TotalHPLeft = sumTop5(top5Characters, 'avgHealth');
  
  // Calculate HP Retention % for team: (HP Left / Max HP) * 100
  const hpRetention = top5TotalMaxHP > 0 ? Math.round((top5TotalHPLeft / top5TotalMaxHP) * 1000) / 10 : 0;
  
  // Initialize aggregates
  team.aggregates = {
    matchCount: totalUniqueMatches, // Use unique match count, not sum of character matches
    winRate: Math.round(winRate * 10) / 10, // Win rate as percentage with 1 decimal
    
    // Combat Performance - TOP 5 TOTALS (not averages)
    top5TotalDamage: sumTop5(top5Characters, 'avgDamage'),
    top5TotalTaken: sumTop5(top5Characters, 'avgTaken'),
    top5Efficiency: 0, // Calculated after damage totals
    top5TotalDPS: weightedAverageTop5(top5Characters, 'dps', 'matchCount'),
    top5TotalCombatScore: sum(top5Characters, 'combatPerformanceScore'),
    avgBattleTime: weightedAverageTop5(top5Characters, 'avgBattleTime', 'matchCount'),
    totalKills: sum(characters, 'totalKills'),
    avgKills: weightedAverageTop5(top5Characters, 'avgKills', 'matchCount'),
    
    // Survival & Health - TOP 5 TOTALS
    top5TotalMaxHP: top5TotalMaxHP,
    top5TotalHPLeft: top5TotalHPLeft,
    hpRetention: hpRetention,
    survivalRate: '-', // Survival rate is not relevant for teams
    top5TotalGuards: sumTop5(top5Characters, 'avgGuards'),
    top5TotalRevengeCounters: sumTop5(top5Characters, 'avgRevengeCounters'),
    top5TotalSuperCounters: sumTop5(top5Characters, 'avgSuperCounters'),
    top5TotalZCounters: sumTop5(top5Characters, 'avgZCounters'),
    
    // Special Abilities - TOP 5 TOTALS
    top5TotalSuper1: sumTop5(top5Characters, 'avgSPM1'),
    top5TotalSuper2: sumTop5(top5Characters, 'avgSPM2'),
    top5TotalSkill1: sumTop5(top5Characters, 'avgEXA1'),
    top5TotalSkill2: sumTop5(top5Characters, 'avgEXA2'),
    top5TotalUltimates: sumTop5(top5Characters, 'avgUltimates'),
    top5TotalKiBlasts: sumTop5(top5Characters, 'avgEnergyBlasts'),
    top5TotalCharges: sumTop5(top5Characters, 'avgCharges'),
    top5TotalSparkings: sumTop5(top5Characters, 'avgSparking'),
    top5TotalDragonDashMileage: sumTop5(top5Characters, 'avgDragonDashMileage'),
    
    // Combat Mechanics - TOP 5 AVERAGES
    avgMaxCombo: weightedAverageTop5(top5Characters, 'avgMaxCombo', 'matchCount'),
    avgMaxComboDamage: weightedAverageTop5(top5Characters, 'avgMaxComboDamage', 'matchCount'),
    top5TotalThrows: sumTop5(top5Characters, 'avgThrows'),
    top5TotalLightning: sumTop5(top5Characters, 'avgLightningAttacks'),
    top5TotalVanishing: sumTop5(top5Characters, 'avgVanishingAttacks'),
    top5TotalDragonHoming: sumTop5(top5Characters, 'avgDragonHoming'),
    top5TotalSpeedImpacts: sumTop5(top5Characters, 'avgSpeedImpacts'),
    speedImpactWinRate: weightedAverageTop5(top5Characters, 'speedImpactWinRate', 'matchCount'),
    avgSparkingCombo: weightedAverageTop5(top5Characters, 'avgSparkingCombo', 'matchCount'),
    
    // Build & Equipment - TOP 5 TOTALS and most common from top 5
    buildArchetype: getMostCommon(top5Characters, 'buildArchetype'),
    top5TotalDamageCapsules: sumTop5(top5Characters, 'avgDamageCaps'),
    top5TotalDefenseCapsules: sumTop5(top5Characters, 'avgDefensiveCaps'),
    top5TotalUtilityCapsules: sumTop5(top5Characters, 'avgUtilityCaps'),
    topCapsules: combineMostCommon(top5Characters, 'topCapsules'),
    
    // Form Changes - aggregate values from top 5
    hasMultipleForms: top5Characters.some(c => c.hasMultipleForms === 'Yes') ? 'Yes' : 'No',
    formHistory: combineFormHistory(top5Characters)
  };
  
  // Calculate efficiency from top 5 damage totals
  if (team.aggregates.top5TotalTaken > 0) {
    team.aggregates.top5Efficiency = team.aggregates.top5TotalDamage / team.aggregates.top5TotalTaken;
  }
}

/**
 * Calculate weighted average (weight by match count)
 */
function weightedAverage(characters, field, weightField) {
  let totalWeight = 0;
  let weightedSum = 0;
  
  characters.forEach(char => {
    const value = char[field];
    const weight = char[weightField] || 0;
    
    if (typeof value === 'number' && !isNaN(value) && weight > 0) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculate weighted average for top 5 characters only
 */
function weightedAverageTop5(top5Characters, field, weightField) {
  let totalWeight = 0;
  let weightedSum = 0;
  
  top5Characters.forEach(char => {
    const value = char[field];
    const weight = char[weightField] || 0;
    
    if (typeof value === 'number' && !isNaN(value) && weight > 0) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculate sum of top 5 characters' stats (weighted by match count for averages)
 * For per-match averages, multiply by match count to get totals
 */
function sumTop5(top5Characters, field) {
  // Sum just the averages for the top 5
  let total = 0;
  top5Characters.forEach(char => {
    const value = char[field];
    if (typeof value === 'number' && !isNaN(value)) {
      total += value;
    }
  });
  return Math.round(total * 10) / 10;
}

/**
 * Calculate sum of a field across characters
 */
function sum(characters, field) {
  return characters.reduce((total, char) => {
    const value = char[field];
    return total + (typeof value === 'number' ? value : 0);
  }, 0);
}

/**
 * Get most common value for a field
 */
function getMostCommon(characters, field) {
  const counts = new Map();
  let maxCount = 0;
  let mostCommon = '';
  
  characters.forEach(char => {
    const value = char[field];
    if (value) {
      const count = (counts.get(value) || 0) + 1;
      counts.set(value, count);
      
      if (count > maxCount) {
        maxCount = count;
        mostCommon = value;
      }
    }
  });
  
  return mostCommon || 'Mixed';
}

/**
 * Combine most common capsules across characters
 */
function combineMostCommon(characters, field) {
  const capsuleMap = new Map();
  
  characters.forEach(char => {
    const capsules = char[field];
    if (typeof capsules === 'string') {
      capsules.split(',').forEach(capsule => {
        const trimmed = capsule.trim();
        if (trimmed) {
          capsuleMap.set(trimmed, (capsuleMap.get(trimmed) || 0) + 1);
        }
      });
    }
  });
  
  // Get top 3 most common
  const sorted = Array.from(capsuleMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([capsule]) => capsule);
  
  return sorted.join(', ');
}

/**
 * Combine form history from all characters
 */
function combineFormHistory(characters) {
  const forms = new Set();
  
  characters.forEach(char => {
    if (char.formHistory) {
      char.formHistory.split(',').forEach(form => {
        const trimmed = form.trim();
        if (trimmed) {
          forms.add(trimmed);
        }
      });
    }
  });
  
  return Array.from(forms).join(', ');
}
