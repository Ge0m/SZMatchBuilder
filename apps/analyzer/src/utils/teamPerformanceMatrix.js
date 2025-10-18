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
 * @param {Object} team - Team object with characters array
 */
function calculateTeamAggregates(team) {
  const characters = team.characters;
  const totalMatches = team.totalMatches;
  
  if (characters.length === 0 || totalMatches === 0) return;
  
  // Initialize aggregates
  team.aggregates = {
    matchCount: totalMatches,
    
    // Combat Performance - weighted averages
    avgDamage: weightedAverage(characters, 'avgDamage', 'matchCount'),
    avgTaken: weightedAverage(characters, 'avgTaken', 'matchCount'),
    efficiency: 0, // Calculated after avgDamage and avgTaken
    dps: weightedAverage(characters, 'dps', 'matchCount'),
    combatScore: weightedAverage(characters, 'combatPerformanceScore', 'matchCount'), // Fixed: use correct field name
    avgBattleTime: weightedAverage(characters, 'avgBattleTime', 'matchCount'),
    totalKills: sum(characters, 'totalKills'),
    avgKills: weightedAverage(characters, 'avgKills', 'matchCount'),
    
    // Survival & Health - weighted averages
    avgHealth: weightedAverage(characters, 'avgHealth', 'matchCount'),
    avgHPGaugeValueMax: weightedAverage(characters, 'avgHPGaugeValueMax', 'matchCount'),
    hpRetention: weightedAverage(characters, 'hpRetention', 'matchCount'),
    avgGuards: weightedAverage(characters, 'avgGuards', 'matchCount'),
    avgRevengeCounters: weightedAverage(characters, 'avgRevengeCounters', 'matchCount'),
    avgSuperCounters: weightedAverage(characters, 'avgSuperCounters', 'matchCount'),
    avgZCounters: weightedAverage(characters, 'avgZCounters', 'matchCount'),
    
    // Special Abilities - weighted averages
    avgSPM1: weightedAverage(characters, 'avgSPM1', 'matchCount'),
    avgSPM2: weightedAverage(characters, 'avgSPM2', 'matchCount'),
    avgSkill1: weightedAverage(characters, 'avgSkill1', 'matchCount'),
    avgSkill2: weightedAverage(characters, 'avgSkill2', 'matchCount'),
    avgUltimates: weightedAverage(characters, 'avgUltimates', 'matchCount'),
    avgEnergyBlasts: weightedAverage(characters, 'avgEnergyBlasts', 'matchCount'),
    avgCharges: weightedAverage(characters, 'avgCharges', 'matchCount'),
    avgSparking: weightedAverage(characters, 'avgSparking', 'matchCount'),
    avgDragonDashMileage: weightedAverage(characters, 'avgDragonDashMileage', 'matchCount'),
    
    // Combat Mechanics - weighted averages
    avgMaxCombo: weightedAverage(characters, 'avgMaxCombo', 'matchCount'),
    avgMaxComboDamage: weightedAverage(characters, 'avgMaxComboDamage', 'matchCount'),
    avgThrows: weightedAverage(characters, 'avgThrows', 'matchCount'),
    avgLightningAttacks: weightedAverage(characters, 'avgLightningAttacks', 'matchCount'),
    avgVanishingAttacks: weightedAverage(characters, 'avgVanishingAttacks', 'matchCount'),
    avgDragonHoming: weightedAverage(characters, 'avgDragonHoming', 'matchCount'),
    avgSpeedImpacts: weightedAverage(characters, 'avgSpeedImpacts', 'matchCount'),
    speedImpactWinRate: weightedAverage(characters, 'speedImpactWinRate', 'matchCount'),
    avgSparkingCombo: weightedAverage(characters, 'avgSparkingCombo', 'matchCount'),
    
    // Build & Equipment - most common values
    buildArchetype: getMostCommon(characters, 'buildArchetype'),
    damageCapsules: weightedAverage(characters, 'damageCapsules', 'matchCount'),
    defensiveCapsules: weightedAverage(characters, 'defensiveCapsules', 'matchCount'),
    utilityCapsules: weightedAverage(characters, 'utilityCapsules', 'matchCount'),
    topCapsules: combineMostCommon(characters, 'topCapsules'),
    
    // Form Changes - aggregate values
    hasMultipleForms: characters.some(c => c.hasMultipleForms === 'Yes') ? 'Yes' : 'No',
    formHistory: combineFormHistory(characters)
  };
  
  // Calculate efficiency from aggregated damage
  if (team.aggregates.avgTaken > 0) {
    team.aggregates.efficiency = team.aggregates.avgDamage / team.aggregates.avgTaken;
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
