import React, { useState, useMemo } from 'react';
import './App.css';
import { 
  Trophy, 
  Swords, 
  Target, 
  Zap, 
  Clock, 
  Heart, 
  Shield, 
  Upload,
  BarChart3,
  Users,
  FileText,
  Database,
  TrendingUp,
  Eye,
  Star,
  Settings,
  Package,
  Moon,
  Sun,
  Table,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Import new components
import DataTable from './components/DataTable.jsx';
import ExportManager from './components/ExportManager.jsx';
import { 
  getCharacterTableConfig, 
  getPositionTableConfig, 
  getMetaTableConfig,
  prepareCharacterData,
  preparePositionData,
  prepareMetaData
} from './components/TableConfigs.jsx';

// Dynamically import all JSON files in BR_Data
const dataFiles = import.meta.glob('../BR_Data/*.json', { eager: true });
// Import characters.csv for key-to-name mapping
import charactersCSV from '../referencedata/characters.csv?raw';
// Import capsules.csv for equipment analysis
import capsulesCSV from '../referencedata/capsules.csv?raw';

// Helper functions for styling and data visualization
function getPerformanceLevel(value, max) {
  const percentage = (value / max) * 100;
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'average';
  return 'below-average';
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function StatBar({ value, maxValue, displayValue, type = 'damage', isInverse = false, label = '', icon: Icon = Target, darkMode = false }) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const displayPercentage = isInverse ? 100 - percentage : percentage;
  const actualDisplayValue = displayValue !== undefined ? displayValue : value;
  
  const getColorClass = () => {
    switch (type) {
      case 'damage': return 'bg-red-500';
      case 'health': return 'bg-green-500';
      case 'special': return 'bg-purple-500';
      case 'ultimate': return 'bg-orange-500';
      case 'taken': return 'bg-blue-500';
      case 'time': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatNumber(actualDisplayValue)}</span>
      </div>
      <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getColorClass()}`}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>
    </div>
  );
}

// Parse capsules CSV data
function parseCapsules(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const capsules = {};
  const aiStrategies = {};
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const item = {
      name: values[0]?.trim(),
      id: values[1]?.trim(),
      type: values[2]?.trim(),
      exclusiveTo: values[3]?.trim(),
      cost: parseInt(values[4]) || 0,
      effect: values[5]?.trim()
    };
    
    if (item.id) {
      // Only include actual gameplay capsules and AI strategies
      if (item.type === 'Capsule') {
        capsules[item.id] = item;
      } else if (item.type === 'AI') {
        aiStrategies[item.id] = item;
      }
      // Skip Costume and Sparking BGM as they are cosmetic
    }
  }
  
  return { capsules, aiStrategies };
}

function PerformanceIndicator({ value, allValues, type = 'damage', isInverse = false, darkMode = false }) {
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  
  let level, colorClass, icon;
  if (isInverse) {
    const range = maxValue - minValue;
    const normalizedValue = (value - minValue) / range;
    if (normalizedValue <= 0.2) {
      level = 'excellent';
      colorClass = darkMode ? 'bg-green-900/30 text-green-300 border-green-600' : 'bg-green-100 text-green-800 border-green-200';
      icon = <Star className="w-3 h-3" />;
    } else if (normalizedValue <= 0.4) {
      level = 'good';
      colorClass = darkMode ? 'bg-blue-900/30 text-blue-300 border-blue-600' : 'bg-blue-100 text-blue-800 border-blue-200';
      icon = <TrendingUp className="w-3 h-3" />;
    } else if (normalizedValue <= 0.6) {
      level = 'average';
      colorClass = darkMode ? 'bg-yellow-900/30 text-yellow-300 border-yellow-600' : 'bg-yellow-100 text-yellow-800 border-yellow-200';
      icon = <Eye className="w-3 h-3" />;
    } else {
      level = 'below-average';
      colorClass = darkMode ? 'bg-red-900/30 text-red-300 border-red-600' : 'bg-red-100 text-red-800 border-red-200';
      icon = <Target className="w-3 h-3" />;
    }
  } else {
    level = getPerformanceLevel(value, maxValue);
    switch (level) {
      case 'excellent':
        colorClass = darkMode ? 'bg-green-900/30 text-green-300 border-green-600' : 'bg-green-100 text-green-800 border-green-200';
        icon = <Star className="w-3 h-3" />;
        break;
      case 'good':
        colorClass = darkMode ? 'bg-blue-900/30 text-blue-300 border-blue-600' : 'bg-blue-100 text-blue-800 border-blue-200';
        icon = <TrendingUp className="w-3 h-3" />;
        break;
      case 'average':
        colorClass = darkMode ? 'bg-yellow-900/30 text-yellow-300 border-yellow-600' : 'bg-yellow-100 text-yellow-800 border-yellow-200';
        icon = <Eye className="w-3 h-3" />;
        break;
      default:
        colorClass = darkMode ? 'bg-red-900/30 text-red-300 border-red-600' : 'bg-red-100 text-red-800 border-red-200';
        icon = <Target className="w-3 h-3" />;
    }
  }
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {icon}
      {level.toUpperCase()}
    </span>
  );
}

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
  const p1Keys = Object.keys(characterRecord).filter(k => k.includes('１Ｐ') || k.includes('AlliesTeamMember'));
  const p2Keys = Object.keys(characterRecord).filter(k => k.includes('２Ｐ') || k.includes('EnemyTeamMember'));
  return {
    p1: p1Keys.map(k => ({ ...characterRecord[k], _key: k })),
    p2: p2Keys.map(k => ({ ...characterRecord[k], _key: k }))
  };
}

function extractStats(char, charMap, capsuleMap = {}, position = null) {
  const play = char.battlePlayCharacter || {};
  const count = char.battleCount || {};
  const numCount = count.battleNumCount || {};
  const originalForm = char.battlePlayCharacter?.originalCharacter?.key;
  const currentForm = play.character?.key;
  const charId = originalForm || currentForm || '';
  const name = charMap[charId] || charId || '-';
  
  // Form change history - only show if character actually changed forms
  let formNames = '';
  if (Array.isArray(char.formChangeHistory) && char.formChangeHistory.length > 0) {
    const forms = [originalForm, ...char.formChangeHistory.map(f => f.key)].filter(Boolean);
    formNames = forms.map(f => charMap[f] || f).join(', ');
  }
  
  // Equipment analysis
  const equipItems = play.equipItem || [];
  const equippedCapsules = equipItems
    .map(item => item.key)
    .filter(Boolean)
    .filter(key => capsuleMap[key]) // Only include items that exist in our filtered capsuleMap
    .map(key => ({
      id: key,
      capsule: capsuleMap[key]
    }));
  
  const totalCapsuleCost = equippedCapsules.reduce((sum, item) => sum + (item.capsule.cost || 0), 0);
  
  // Categorize capsules by type
  const capsuleTypes = {
    damage: equippedCapsules.filter(item => 
      item.capsule.name?.toLowerCase().includes('attack') || 
      item.capsule.name?.toLowerCase().includes('damage') ||
      item.capsule.name?.toLowerCase().includes('blast')
    ).length,
    defensive: equippedCapsules.filter(item => 
      item.capsule.name?.toLowerCase().includes('guard') || 
      item.capsule.name?.toLowerCase().includes('defense') ||
      item.capsule.name?.toLowerCase().includes('body') ||
      item.capsule.name?.toLowerCase().includes('training')
    ).length,
    utility: equippedCapsules.filter(item => 
      item.capsule.name?.toLowerCase().includes('ki') || 
      item.capsule.name?.toLowerCase().includes('movement') ||
      item.capsule.name?.toLowerCase().includes('dash') ||
      item.capsule.name?.toLowerCase().includes('transformation')
    ).length
  };
  
  return {
    name,
    damageDone: count.givenDamage || 0,
    damageTaken: count.takenDamage || 0,
    battleTime: parseBattleTime(count.battleTime) || 0,
    hPGaugeValue: play.hPGaugeValue || 0,
    hPGaugeValueMax: play.hPGaugeValueMax || 40000,
    specialMovesUsed: numCount.sPMCount || 0,
    ultimatesUsed: numCount.uLTCount || 0,
    skillsUsed: numCount.eXACount || 0,
    kills: count.killCount || 0,
    formChangeHistory: formNames,
    // Phase 1: Additional technique usage metrics
    sparkingCount: numCount.sparkingCount || 0,
    chargeCount: numCount.chargeCount || 0,
    guardCount: numCount.guardCount || 0,
    shotEnergyBulletCount: numCount.shotEnergyBulletCount || 0,
    zCounterCount: numCount.zCounter || 0,
    superCounterCount: numCount.superCounterCount || 0,
    // Phase 1: Combo performance metrics
    maxComboNum: count.maxComboNum || 0,
    maxComboDamage: count.maxComboDamage || 0,
    // Phase 2: Position tracking
    position: position,
    // Equipment data
    equippedCapsules,
    totalCapsuleCost,
    capsuleTypes,
    buildArchetype: getBuildArchetype(capsuleTypes, totalCapsuleCost)
  };
}

// Helper function to parse battle time format "+00000000.00:02:54.470000000" to seconds
function parseBattleTime(timeString) {
  if (!timeString || typeof timeString !== 'string') return 0;
  
  // Format: "+00000000.00:02:54.470000000"
  // Extract the time part after the first colon
  const timeMatch = timeString.match(/(\d{2}):(\d{2}):(\d{2})\.(\d+)/);
  if (!timeMatch) return 0;
  
  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const seconds = parseInt(timeMatch[3], 10);
  const milliseconds = parseInt(timeMatch[4].substring(0, 3), 10); // Take first 3 digits for milliseconds
  
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

// Helper function to format seconds back to readable time
function formatBattleTime(seconds) {
  if (!seconds || seconds === 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Component to show battle time variance from average
function BattleTimeVariance({ value, averageValue, darkMode = false }) {
  const variance = value - averageValue;
  const isAbove = variance > 0;
  const absVariance = Math.abs(variance);
  
  if (Math.abs(variance) < 1) {
    return (
      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Battle Time</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatBattleTime(value)}</span>
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>~Average</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Battle Time</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatBattleTime(value)}</span>
        <span className={`text-xs font-medium ${isAbove ? 'text-blue-400' : 'text-red-400'}`}>
          {isAbove ? '+' : '-'}{formatBattleTime(absVariance)} {isAbove ? 'longer' : 'shorter'}
        </span>
      </div>
    </div>
  );
}

// Determine build archetype based on equipped capsules
function getBuildArchetype(capsuleTypes, totalCost) {
  const { damage, defensive, utility } = capsuleTypes;
  const total = damage + defensive + utility;
  
  if (total === 0) return 'No Build';
  
  if (damage >= defensive && damage >= utility) {
    return 'Aggressive';
  } else if (defensive >= damage && defensive >= utility) {
    return 'Defensive';
  } else if (utility >= damage && utility >= defensive) {
    return 'Technical';
  } else {
    return 'Hybrid';
  }
}

// Component to display character build information
function BuildDisplay({ stats, showDetailed = false, darkMode = false }) {
  if (!stats.equippedCapsules || stats.equippedCapsules.length === 0) {
    return (
      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Package className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No Equipment Data</span>
        </div>
      </div>
    );
  }

  const getBuildColor = (archetype) => {
    if (archetype.includes('Aggressive')) return darkMode ? 'text-red-400 bg-red-900/30 border-red-600' : 'text-red-600 bg-red-50 border-red-200';
    if (archetype.includes('Defensive')) return darkMode ? 'text-green-400 bg-green-900/30 border-green-600' : 'text-green-600 bg-green-50 border-green-200';
    if (archetype.includes('Technical')) return darkMode ? 'text-blue-400 bg-blue-900/30 border-blue-600' : 'text-blue-600 bg-blue-50 border-blue-200';
    if (archetype.includes('Hybrid')) return darkMode ? 'text-purple-400 bg-purple-900/30 border-purple-600' : 'text-purple-600 bg-purple-50 border-purple-200';
    return darkMode ? 'text-gray-400 bg-gray-700 border-gray-600' : 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Settings className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Build</span>
        </div>
      </div>
      
      <div className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getBuildColor(stats.buildArchetype)}`}>
        {stats.buildArchetype}
      </div>
      
      {showDetailed && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Damage Capsules:</span>
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.capsuleTypes.damage}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Defensive Capsules:</span>
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.capsuleTypes.defensive}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Utility Capsules:</span>
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.capsuleTypes.utility}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Meta Analysis Component
function MetaAnalysisContent({ aggregatedData, capsuleMap, aiStrategies, darkMode = false }) {
  console.log('MetaAnalysisContent received:', { aggregatedDataLength: aggregatedData.length, aggregatedData });
  
  // Analyze build archetypes
  const buildArchetypes = {};
  const capsuleUsage = {};
  
  aggregatedData.forEach(char => {
    if (char.matches && char.matches.length > 0) {
      char.matches.forEach(match => {
        const archetype = match.buildArchetype || 'Unknown';
        if (!buildArchetypes[archetype]) {
          buildArchetypes[archetype] = { total: 0, totalDamage: 0, totalSurvival: 0 };
        }
        buildArchetypes[archetype].total++;
        buildArchetypes[archetype].totalDamage += match.damageDone;
        buildArchetypes[archetype].totalSurvival += (match.hPGaugeValue / match.hPGaugeValueMax) * 100;
        
        // Count capsule usage
        if (match.equippedCapsules) {
          match.equippedCapsules.forEach(capsule => {
            const capsuleId = capsule.id;
            if (!capsuleUsage[capsuleId]) {
              capsuleUsage[capsuleId] = { 
                name: capsule.capsule.name || capsuleId, 
                usage: 0, 
                characters: new Set()
              };
            }
            capsuleUsage[capsuleId].usage++;
            capsuleUsage[capsuleId].characters.add(char.name);
          });
        }
      });
    }
  });

  // Sort by usage
  const topCapsules = Object.entries(capsuleUsage)
    .map(([id, data]) => ({ id, ...data, characterCount: data.characters.size }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 10);

  const archetypeStats = Object.entries(buildArchetypes)
    .map(([name, stats]) => ({
      name,
      usage: stats.total,
      avgDamage: stats.total > 0 ? stats.totalDamage / stats.total : 0,
      avgSurvival: stats.total > 0 ? stats.totalSurvival / stats.total : 0
    }))
    .sort((a, b) => b.usage - a.usage);

  console.log('Processed data:', { archetypeStats, topCapsules });

  if (aggregatedData.length === 0) {
    return (
      <div className="text-center py-8">
        <Database className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
        <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No Data Available</h3>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Please ensure you have match data loaded to view meta analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Build Archetypes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Build Archetype Popularity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archetypeStats.map((archetype, i) => (
            <div key={archetype.name} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{archetype.name}</h4>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>#{i + 1}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Usage:</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{archetype.usage} matches</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Avg Damage:</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatNumber(Math.round(archetype.avgDamage))}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Avg Survival:</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{archetype.avgSurvival.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Capsules */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Most Popular Capsules
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {topCapsules.map((capsule, i) => (
            <div key={capsule.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>{capsule.name}</h4>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>#{i + 1}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Usage:</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{capsule.usage} times</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Characters:</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{capsule.characterCount} different</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getPositionBasedData(files, charMap, capsuleMap = {}) {
  const positionStats = {
    1: { totalMatches: 0, characters: {} }, // Position 1 (Lead)
    2: { totalMatches: 0, characters: {} }, // Position 2 (Middle)
    3: { totalMatches: 0, characters: {} }  // Position 3 (Anchor)
  };
  
  // Helper function to process a characterRecord
  function processCharacterRecord(characterRecord) {
    if (!characterRecord) return;
    
    // Process both teams - get all team member keys directly
    const teamMemberKeys = Object.keys(characterRecord).filter(k => 
      k.includes('AlliesTeamMember') || k.includes('EnemyTeamMember')
    );
    
    teamMemberKeys.forEach(key => {
      const char = characterRecord[key];
      if (!char) return;
      
      // Extract position from key (e.g., "AlliesTeamMember1" -> position 1)
      const positionMatch = key.match(/Member(\d+)/);
      const position = positionMatch ? parseInt(positionMatch[1]) : null;
      
      if (!position || !positionStats[position]) return;
      
      const stats = extractStats(char, charMap, capsuleMap, position);
      if (!stats.name || stats.name === '-') return;
      
      const characterName = stats.name;
      
      positionStats[position].totalMatches++;
      
      if (!positionStats[position].characters[characterName]) {
        positionStats[position].characters[characterName] = {
          name: characterName,
          matchCount: 0,
          totalDamage: 0,
          totalTaken: 0,
          totalHealth: 0,
          totalBattleTime: 0,
          totalSpecialMoves: 0,
          totalUltimates: 0,
          totalSkills: 0,
          totalSparking: 0,
          totalCharges: 0,
          totalGuards: 0,
          totalEnergyBlasts: 0,
          totalComboNum: 0,
          totalComboDamage: 0
        };
      }
      
      const charData = positionStats[position].characters[characterName];
      charData.matchCount++;
      charData.totalDamage += stats.damageDone;
      charData.totalTaken += stats.damageTaken;
      charData.totalHealth += stats.hPGaugeValue;
      charData.totalBattleTime += stats.battleTime;
      charData.totalSpecialMoves += stats.specialMovesUsed;
      charData.totalUltimates += stats.ultimatesUsed;
      charData.totalSkills += stats.skillsUsed;
      charData.totalSparking += stats.sparkingCount;
      charData.totalCharges += stats.chargeCount;
      charData.totalGuards += stats.guardCount;
      charData.totalEnergyBlasts += stats.shotEnergyBulletCount;
      charData.totalComboNum += stats.maxComboNum;
      charData.totalComboDamage += stats.maxComboDamage;
    });
  }
  
  files.forEach(file => {
    if (file.error) return;
    
    const fileContent = file.content;
    let characterRecord;
    
    // Handle TeamBattleResults format (current BR_Data structure)
    if (fileContent.TeamBattleResults && fileContent.TeamBattleResults.battleResult) {
      characterRecord = fileContent.TeamBattleResults.battleResult.characterRecord;
    }
    // Handle new format with teams array at the top
    else if (fileContent.teams && Array.isArray(fileContent.teams)) {
      // Process all teams in the array
      fileContent.teams.forEach(team => {
        let teamCharRecord;
        
        if (team.BattleResults) {
          teamCharRecord = team.BattleResults.characterRecord;
        } else if (team.characterRecord) {
          teamCharRecord = team.characterRecord;
        }
        
        if (teamCharRecord) {
          processCharacterRecord(teamCharRecord);
        }
      });
      return; // Already processed all teams
    }
    // Handle standard format with BattleResults at root
    else if (fileContent.BattleResults) {
      characterRecord = fileContent.BattleResults.characterRecord;
    } 
    // Handle legacy format with direct properties
    else {
      characterRecord = fileContent.characterRecord;
    }
    
    processCharacterRecord(characterRecord);
  });
  
  // Calculate averages and format data
  Object.keys(positionStats).forEach(position => {
    const posData = positionStats[position];
    posData.sortedCharacters = Object.values(posData.characters)
      .map(char => ({
        ...char,
        avgDamage: char.totalDamage / char.matchCount,
        avgTaken: char.totalTaken / char.matchCount,
        avgHealth: char.totalHealth / char.matchCount,
        avgBattleTime: char.totalBattleTime / char.matchCount,
        avgSpecialMoves: char.totalSpecialMoves / char.matchCount,
        avgUltimates: char.totalUltimates / char.matchCount,
        avgSkills: char.totalSkills / char.matchCount,
        avgSparking: char.totalSparking / char.matchCount,
        avgCharges: char.totalCharges / char.matchCount,
        avgGuards: char.totalGuards / char.matchCount,
        avgEnergyBlasts: char.totalEnergyBlasts / char.matchCount,
        avgComboNum: char.totalComboNum / char.matchCount,
        avgComboDamage: char.totalComboDamage / char.matchCount,
        damageEfficiency: char.totalDamage / Math.max(char.totalTaken, 1)
      }))
      .sort((a, b) => b.avgDamage - a.avgDamage);
  });
  
  return positionStats;
}

function getAggregatedCharacterData(files, charMap, capsuleMap = {}) {
  const characterStats = {};
  
  // Helper function to process a characterRecord (extracted to avoid duplication)
  function processCharacterRecord(characterRecord, characterIdRecord) {
    Object.values(characterRecord).forEach(char => {
      const stats = extractStats(char, charMap, capsuleMap, null); // No position for aggregated data
      if (!stats.name || stats.name === '-') return;
      
      // Use original form name as the key for aggregation
      const originalForm = char.battlePlayCharacter?.originalCharacter?.key;
      const aggregationKey = originalForm ? (charMap[originalForm] || originalForm) : stats.name;
      
      if (!characterStats[aggregationKey]) {
        characterStats[aggregationKey] = {
          name: aggregationKey,
          totalDamage: 0,
          totalTaken: 0,
          totalHealth: 0,
          totalBattleTime: 0,
          totalHPGaugeValueMax: 0,
          totalSpecial: 0,
          totalUltimates: 0,
          totalSkills: 0,
          totalKills: 0,
          // Phase 1: New technique usage and combo stats
          totalSparking: 0,
          totalCharges: 0,
          totalGuards: 0,
          totalEnergyBlasts: 0,
          totalZCounters: 0,
          totalSuperCounters: 0,
          maxComboNumTotal: 0,
          maxComboDamageTotal: 0,
          matchCount: 0,
          allFormsUsed: new Set(), // Track all forms used across matches
          formStats: {}, // Track per-form aggregated stats
          matches: [] // Track individual match data for meta analysis
        };
      }
      
      const charData = characterStats[aggregationKey];
      charData.totalDamage += stats.damageDone;
      charData.totalTaken += stats.damageTaken;
      charData.totalHealth += stats.hPGaugeValue;
      charData.totalBattleTime += stats.battleTime;
      charData.totalHPGaugeValueMax += stats.hPGaugeValueMax;
      charData.totalSpecial += stats.specialMovesUsed;
      charData.totalUltimates += stats.ultimatesUsed;
      charData.totalSkills += stats.skillsUsed;
      charData.totalKills += stats.kills;
      // Phase 1: New technique usage and combo stats
      charData.totalSparking += stats.sparkingCount;
      charData.totalCharges += stats.chargeCount;
      charData.totalGuards += stats.guardCount;
      charData.totalEnergyBlasts += stats.shotEnergyBulletCount;
      charData.totalZCounters += stats.zCounterCount;
      charData.totalSuperCounters += stats.superCounterCount;
      charData.maxComboNumTotal += stats.maxComboNum;
      charData.maxComboDamageTotal += stats.maxComboDamage;
      charData.matchCount += 1;
      
      // Add individual match data for meta analysis
      charData.matches.push({
        damageDone: stats.damageDone,
        damageTaken: stats.damageTaken,
        battleTime: stats.battleTime,
        hPGaugeValue: stats.hPGaugeValue,
        hPGaugeValueMax: stats.hPGaugeValueMax,
        buildArchetype: stats.buildArchetype,
        totalCapsuleCost: stats.totalCapsuleCost,
        capsuleTypes: stats.capsuleTypes,
        equippedCapsules: stats.equippedCapsules
      });
      
      // Track all forms used
      if (originalForm) {
        charData.allFormsUsed.add(originalForm);
      }
      if (Array.isArray(char.formChangeHistory) && char.formChangeHistory.length > 0) {
        char.formChangeHistory.forEach(form => {
          charData.allFormsUsed.add(form.key);
        });
      }
      
      // Aggregate per-form stats from characterIdRecord if available
      if (characterIdRecord) {
        const allForms = [];
        if (originalForm) allForms.push(originalForm);
        if (Array.isArray(char.formChangeHistory) && char.formChangeHistory.length > 0) {
          allForms.push(...char.formChangeHistory.map(f => f.key));
        }
        
        allForms.forEach(formId => {
          const formRecord = characterIdRecord[`(Key="${formId}")`];
          if (formRecord) {
            const formName = charMap[formId] || formId;
            if (!charData.formStats[formName]) {
              charData.formStats[formName] = {
                name: formName,
                totalDamage: 0,
                totalTaken: 0,
                totalHealth: 0,
                totalBattleTime: 0,
                totalSpecial: 0,
                totalUltimates: 0,
                totalSkills: 0,
                totalKills: 0,
                matchCount: 0
              };
            }
            
            const formData = charData.formStats[formName];
            const formCount = formRecord.battleCount || {};
            const formNumCount = formCount.battleNumCount || {};
            
            formData.totalDamage += formCount.givenDamage || 0;
            formData.totalTaken += formCount.takenDamage || 0;
            formData.totalHealth += formCount.hPGaugeValue || 0;
            formData.totalBattleTime += parseBattleTime(formCount.battleTime) || 0;
            formData.totalSpecial += formNumCount.sPMCount || 0;
            formData.totalUltimates += formNumCount.uLTCount || 0;
            formData.totalSkills += formNumCount.eXACount || 0;
            formData.totalKills += formCount.killCount || 0;
            formData.matchCount += 1;
          }
        });
      }
    });
  }
  
  files.forEach(file => {
    if (file.error) return;
    
    let characterRecord, characterIdRecord;
    
    // Handle TeamBattleResults format (current BR_Data structure)
    if (file.content.TeamBattleResults && file.content.TeamBattleResults.battleResult) {
      characterRecord = file.content.TeamBattleResults.battleResult.characterRecord;
      characterIdRecord = file.content.TeamBattleResults.battleResult.characterIdRecord;
    }
    // Handle new format with teams array at the top
    else if (file.content.teams && Array.isArray(file.content.teams)) {
      // Process all teams in the array
      file.content.teams.forEach(team => {
        let teamCharRecord, teamCharIdRecord;
        
        if (team.BattleResults) {
          teamCharRecord = team.BattleResults.characterRecord;
          teamCharIdRecord = team.BattleResults.characterIdRecord;
        } else if (team.characterRecord) {
          teamCharRecord = team.characterRecord;
          teamCharIdRecord = team.characterIdRecord;
        }
        
        if (teamCharRecord) {
          processCharacterRecord(teamCharRecord, teamCharIdRecord);
        }
      });
      return; // Already processed all teams
    }
    // Handle standard format with BattleResults at root
    else if (file.content.BattleResults) {
      characterRecord = file.content.BattleResults.characterRecord;
      characterIdRecord = file.content.BattleResults.characterIdRecord;
    } 
    // Handle legacy format with direct properties
    else {
      characterRecord = file.content.characterRecord;
      characterIdRecord = file.content.characterIdRecord;
    }
    
    if (!characterRecord) return;
    
    processCharacterRecord(characterRecord, characterIdRecord);
  });
  
  // Calculate averages and format form history
  return Object.values(characterStats).map(char => {
    const allForms = Array.from(char.allFormsUsed);
    const formHistory = allForms.length > 1 ? 
      allForms.map(f => charMap[f] || f).join(', ') : '';
    
    // Calculate averages for per-form stats
    const formStatsArray = Object.values(char.formStats).map(formStat => ({
      ...formStat,
      avgDamage: Math.round(formStat.totalDamage / formStat.matchCount),
      avgTaken: Math.round(formStat.totalTaken / formStat.matchCount),
      avgHealth: Math.round(formStat.totalHealth / formStat.matchCount),
      avgBattleTime: Math.round((formStat.totalBattleTime / formStat.matchCount) * 10) / 10,
      avgSpecial: Math.round((formStat.totalSpecial / formStat.matchCount) * 10) / 10,
      avgUltimates: Math.round((formStat.totalUltimates / formStat.matchCount) * 10) / 10,
      avgSkills: Math.round((formStat.totalSkills / formStat.matchCount) * 10) / 10,
      avgKills: Math.round((formStat.totalKills / formStat.matchCount) * 10) / 10
    }));
    
    return {
      ...char,
      formHistory,
      formStatsArray,
      hasMultipleForms: allForms.length > 1,
      avgDamage: Math.round(char.totalDamage / char.matchCount),
      avgTaken: Math.round(char.totalTaken / char.matchCount),
      avgHealth: Math.round(char.totalHealth / char.matchCount),
      avgBattleTime: Math.round((char.totalBattleTime / char.matchCount) * 10) / 10,
      avgHPGaugeValueMax: Math.round(char.totalHPGaugeValueMax / char.matchCount),
      avgSpecial: Math.round((char.totalSpecial / char.matchCount) * 10) / 10,
      avgUltimates: Math.round((char.totalUltimates / char.matchCount) * 10) / 10,
      avgSkills: Math.round((char.totalSkills / char.matchCount) * 10) / 10,
      avgKills: Math.round((char.totalKills / char.matchCount) * 10) / 10,
      // Phase 1: New technique usage and combo averages
      avgSparking: Math.round((char.totalSparking / char.matchCount) * 10) / 10,
      avgCharges: Math.round((char.totalCharges / char.matchCount) * 10) / 10,
      avgGuards: Math.round((char.totalGuards / char.matchCount) * 10) / 10,
      avgEnergyBlasts: Math.round((char.totalEnergyBlasts / char.matchCount) * 10) / 10,
      avgZCounters: Math.round((char.totalZCounters / char.matchCount) * 10) / 10,
      avgSuperCounters: Math.round((char.totalSuperCounters / char.matchCount) * 10) / 10,
      avgMaxCombo: Math.round((char.maxComboNumTotal / char.matchCount) * 10) / 10,
      avgMaxComboDamage: Math.round(char.maxComboDamageTotal / char.matchCount)
    };
  }).sort((a, b) => b.totalDamage - a.totalDamage);
}

function getTeamAggregatedData(files, charMap, capsuleMap = {}) {
  const teamStats = {};
  
  files.forEach(file => {
    if (file.error) return;
    
    let teams, battleWinLose, characterRecord;
    
    // Handle TeamBattleResults format (current BR_Data structure)
    if (file.content.TeamBattleResults) {
      teams = file.content.TeamBattleResults.teams;
      battleWinLose = file.content.TeamBattleResults.battleResult?.battleWinLose;
      characterRecord = file.content.TeamBattleResults.battleResult?.characterRecord;
    }
    // Handle other formats
    else if (file.content.teams && Array.isArray(file.content.teams)) {
      teams = file.content.teams;
      if (file.content.teams[0]?.BattleResults) {
        battleWinLose = file.content.teams[0].BattleResults.battleWinLose;
        characterRecord = file.content.teams[0].BattleResults.characterRecord;
      }
    }
    else if (file.content.BattleResults) {
      battleWinLose = file.content.BattleResults.battleWinLose;
      characterRecord = file.content.BattleResults.characterRecord;
      // Try to extract team names from file name or default
      teams = ["Team 1", "Team 2"];
    }
    
    if (!teams || !Array.isArray(teams) || teams.length < 2 || !battleWinLose || !characterRecord) {
      return;
    }
    
    const team1Name = teams[0];
    const team2Name = teams[1];
    
    // Initialize team stats if they don't exist
    [team1Name, team2Name].forEach(teamName => {
      if (!teamStats[teamName]) {
        teamStats[teamName] = {
          teamName,
          matches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          totalDamageDealt: 0,
          totalDamageTaken: 0,
          totalHealthRemaining: 0,
          totalHealthMax: 0,
          avgDamagePerMatch: 0,
          avgDamageTakenPerMatch: 0,
          avgHealthRetention: 0,
          charactersUsed: new Set(),
          characterUsageCount: {},
          characterDetails: {},  // Store individual character match data
          characterAverages: {}, // Store calculated averages per character
          buildArchetypes: {
            aggressive: 0,
            defensive: 0,
            technical: 0,
            hybrid: 0,
            noBuild: 0
          },
          matchHistory: [],
          opponentRecords: {}
        };
      }
    });
    
    // Process match result from team1's perspective
    const team1Won = battleWinLose === 'Win';
    const team2Won = battleWinLose === 'Lose';
    
    // Update win/loss records
    teamStats[team1Name].matches++;
    teamStats[team2Name].matches++;
    
    if (team1Won) {
      teamStats[team1Name].wins++;
      teamStats[team2Name].losses++;
    } else if (team2Won) {
      teamStats[team1Name].losses++;
      teamStats[team2Name].wins++;
    }
    
    // Initialize opponent records
    if (!teamStats[team1Name].opponentRecords[team2Name]) {
      teamStats[team1Name].opponentRecords[team2Name] = { wins: 0, losses: 0 };
    }
    if (!teamStats[team2Name].opponentRecords[team1Name]) {
      teamStats[team2Name].opponentRecords[team1Name] = { wins: 0, losses: 0 };
    }
    
    // Update head-to-head records
    if (team1Won) {
      teamStats[team1Name].opponentRecords[team2Name].wins++;
      teamStats[team2Name].opponentRecords[team1Name].losses++;
    } else if (team2Won) {
      teamStats[team1Name].opponentRecords[team2Name].losses++;
      teamStats[team2Name].opponentRecords[team1Name].wins++;
    }
    
    // Process character data for both teams
    const teams_data = getTeams(characterRecord);
    const p1TeamStats = getTeamStats(teams_data.p1, charMap, capsuleMap);
    const p2TeamStats = getTeamStats(teams_data.p2, charMap, capsuleMap);
    
    // Aggregate team 1 stats
    teamStats[team1Name].totalDamageDealt += p1TeamStats.totalDamage;
    teamStats[team1Name].totalDamageTaken += p1TeamStats.totalTaken;
    teamStats[team1Name].totalHealthRemaining += p1TeamStats.totalHealth;
    teamStats[team1Name].totalHealthMax += p1TeamStats.totalHPGaugeValueMax;
    
    // Aggregate team 2 stats  
    teamStats[team2Name].totalDamageDealt += p2TeamStats.totalDamage;
    teamStats[team2Name].totalDamageTaken += p2TeamStats.totalTaken;
    teamStats[team2Name].totalHealthRemaining += p2TeamStats.totalHealth;
    teamStats[team2Name].totalHealthMax += p2TeamStats.totalHPGaugeValueMax;
    
    // Track character usage
    teams_data.p1.forEach(char => {
      const stats = extractStats(char, charMap, capsuleMap);
      if (stats.name && stats.name !== '-') {
        teamStats[team1Name].charactersUsed.add(stats.name);
        teamStats[team1Name].characterUsageCount[stats.name] = 
          (teamStats[team1Name].characterUsageCount[stats.name] || 0) + 1;
        
        // Initialize character details array if needed
        if (!teamStats[team1Name].characterDetails[stats.name]) {
          teamStats[team1Name].characterDetails[stats.name] = [];
        }
        
        // Store individual character match data
        teamStats[team1Name].characterDetails[stats.name].push({
          damageDealt: stats.damageDone || 0,
          damageTaken: stats.damageTaken || 0,
          healthRemaining: stats.hPGaugeValue || 0,
          healthMax: stats.hPGaugeValueMax || 0,
          battleDuration: stats.battleTime || 0,
          fileName: file.name
        });
        
        // Track build archetypes
        const archetype = stats.buildArchetype.toLowerCase().replace(/\s+/g, '');
        if (teamStats[team1Name].buildArchetypes.hasOwnProperty(archetype)) {
          teamStats[team1Name].buildArchetypes[archetype]++;
        } else {
          teamStats[team1Name].buildArchetypes.noBuild++;
        }
      }
    });
    
    teams_data.p2.forEach(char => {
      const stats = extractStats(char, charMap, capsuleMap);
      if (stats.name && stats.name !== '-') {
        teamStats[team2Name].charactersUsed.add(stats.name);
        teamStats[team2Name].characterUsageCount[stats.name] = 
          (teamStats[team2Name].characterUsageCount[stats.name] || 0) + 1;
        
        // Initialize character details array if needed
        if (!teamStats[team2Name].characterDetails[stats.name]) {
          teamStats[team2Name].characterDetails[stats.name] = [];
        }
        
        // Store individual character match data
        teamStats[team2Name].characterDetails[stats.name].push({
          damageDealt: stats.damageDone || 0,
          damageTaken: stats.damageTaken || 0,
          healthRemaining: stats.hPGaugeValue || 0,
          healthMax: stats.hPGaugeValueMax || 0,
          battleDuration: stats.battleTime || 0,
          fileName: file.name
        });
        
        // Track build archetypes
        const archetype = stats.buildArchetype.toLowerCase().replace(/\s+/g, '');
        if (teamStats[team2Name].buildArchetypes.hasOwnProperty(archetype)) {
          teamStats[team2Name].buildArchetypes[archetype]++;
        } else {
          teamStats[team2Name].buildArchetypes.noBuild++;
        }
      }
    });
    
    // Add match history
    teamStats[team1Name].matchHistory.push({
      opponent: team2Name,
      result: team1Won ? 'Win' : 'Loss',
      damageDealt: p1TeamStats.totalDamage,
      damageTaken: p1TeamStats.totalTaken,
      healthRemaining: p1TeamStats.totalHealth,
      fileName: file.name
    });
    
    teamStats[team2Name].matchHistory.push({
      opponent: team1Name,
      result: team2Won ? 'Win' : 'Loss',
      damageDealt: p2TeamStats.totalDamage,
      damageTaken: p2TeamStats.totalTaken,
      healthRemaining: p2TeamStats.totalHealth,
      fileName: file.name
    });
  });
  
  // Calculate final statistics and format data
  return Object.values(teamStats).map(team => {
    team.winRate = team.matches > 0 ? Math.round((team.wins / team.matches) * 100 * 10) / 10 : 0;
    team.avgDamagePerMatch = team.matches > 0 ? Math.round(team.totalDamageDealt / team.matches) : 0;
    team.avgDamageTakenPerMatch = team.matches > 0 ? Math.round(team.totalDamageTaken / team.matches) : 0;
    team.avgHealthRetention = team.totalHealthMax > 0 ? 
      Math.round((team.totalHealthRemaining / team.totalHealthMax) * 100 * 10) / 10 : 0;
    
    // Convert character usage set to array and sort by usage frequency
    team.favoriteCharacters = Object.entries(team.characterUsageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, usage: count }));
    
    // Calculate per-character averages
    Object.entries(team.characterDetails).forEach(([charName, matches]) => {
      if (matches.length > 0) {
        const totalDamageDealt = matches.reduce((sum, match) => sum + match.damageDealt, 0);
        const totalDamageTaken = matches.reduce((sum, match) => sum + match.damageTaken, 0);
        const totalBattleDuration = matches.reduce((sum, match) => sum + match.battleDuration, 0);
        const matchCount = matches.length;
        
        team.characterAverages[charName] = {
          avgDamageDealt: Math.round(totalDamageDealt / matchCount),
          avgDamageTaken: Math.round(totalDamageTaken / matchCount),
          avgDamageEfficiency: totalDamageTaken > 0 ? 
            Math.round((totalDamageDealt / totalDamageTaken) * 100) / 100 : 
            (totalDamageDealt > 0 ? 999 : 0),
          avgDamagePerSecond: totalBattleDuration > 0 ? 
            Math.round((totalDamageDealt / totalBattleDuration) * 100) / 100 : 0,
          matchesPlayed: matchCount,
          usageRate: Math.round((matchCount / team.matches) * 100 * 10) / 10
        };
      }
    });
    
    // Convert set to count for UI display
    team.uniqueCharactersUsed = team.charactersUsed.size;
    team.charactersUsed = Array.from(team.charactersUsed);
    
    return team;
  }).sort((a, b) => {
    // Primary sort: Win rate (descending)
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    // Secondary sort: Total matches (descending, more experienced teams ranked higher)
    if (b.matches !== a.matches) return b.matches - a.matches;
    // Tertiary sort: Damage efficiency (descending)
    const aEfficiency = a.totalDamageTaken > 0 ? a.totalDamageDealt / a.totalDamageTaken : a.totalDamageDealt;
    const bEfficiency = b.totalDamageTaken > 0 ? b.totalDamageDealt / b.totalDamageTaken : b.totalDamageDealt;
    return bEfficiency - aEfficiency;
  });
}

function getTeamStats(teamRecords, charMap, capsuleMap = {}) {
  let totalDamage = 0, totalTaken = 0, totalHealth = 0, totalHPGaugeValueMax = 0, totalSpecial = 0, totalUltimates = 0, totalSkills = 0;
  teamRecords.forEach(char => {
    const stats = extractStats(char, charMap, capsuleMap, null); // No position for team aggregation
    totalDamage += stats.damageDone;
    totalTaken += stats.damageTaken;
    totalHealth += stats.hPGaugeValue;
    totalHPGaugeValueMax += stats.hPGaugeValueMax;
    totalSpecial += stats.specialMovesUsed;
    totalUltimates += stats.ultimatesUsed;
    totalSkills += stats.skillsUsed;
  });
  return { totalDamage, totalTaken, totalHealth, totalHPGaugeValueMax, totalSpecial, totalUltimates, totalSkills };
}

export default function App() {
  const [mode, setMode] = useState('reference');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [viewType, setViewType] = useState('single');
  const [manualFiles, setManualFiles] = useState([]);
  const [expandedRows, setExpandedRows] = useState({}); // Expanded state for character rows
  const [darkMode, setDarkMode] = useState(true); // Dark mode state - default to true

  const charMap = useMemo(() => parseCharacterCSV(charactersCSV), []);
  const { capsules: capsuleMap, aiStrategies } = useMemo(() => parseCapsules(capsulesCSV), []);
  const fileNames = Object.keys(dataFiles).map((path) => path.split('/').pop());

  // Aggregated data for reference mode
  const aggregatedData = useMemo(() => {
    if (mode === 'reference' && (viewType === 'aggregated' || viewType === 'meta' || viewType === 'tables')) {
      const allFiles = fileNames.map(fileName => {
        const fullPath = Object.keys(dataFiles).find((p) => p.endsWith(fileName));
        if (fullPath) {
          const moduleContent = dataFiles[fullPath];
          const actualContent = moduleContent.default || moduleContent;
          return { name: fileName, content: actualContent };
        }
        return { name: fileName, error: 'Not found' };
      });
      return getAggregatedCharacterData(allFiles, charMap, capsuleMap);
    } else if (mode === 'manual' && (viewType === 'aggregated' || viewType === 'meta' || viewType === 'tables') && manualFiles.length > 1) {
      return getAggregatedCharacterData(manualFiles, charMap, capsuleMap);
    }
    return [];
  }, [mode, viewType, charMap, capsuleMap, manualFiles]);

  // Position-based data for advanced analysis
  const positionData = useMemo(() => {
    if (mode === 'reference' && (viewType === 'aggregated' || viewType === 'meta' || viewType === 'tables')) {
      const allFiles = fileNames.map(fileName => {
        const fullPath = Object.keys(dataFiles).find((p) => p.endsWith(fileName));
        if (fullPath) {
          const moduleContent = dataFiles[fullPath];
          const actualContent = moduleContent.default || moduleContent;
          return { name: fileName, content: actualContent };
        }
        return { name: fileName, error: 'Not found' };
      });
      return getPositionBasedData(allFiles, charMap, capsuleMap);
    } else if (mode === 'manual' && (viewType === 'aggregated' || viewType === 'meta' || viewType === 'tables') && manualFiles.length > 1) {
      return getPositionBasedData(manualFiles, charMap, capsuleMap);
    }
    return {};
  }, [mode, viewType, charMap, capsuleMap, manualFiles]);

  // Team aggregated data for team rankings
  const teamAggregatedData = useMemo(() => {
    if (mode === 'reference' && (viewType === 'aggregated' || viewType === 'meta' || viewType === 'tables' || viewType === 'teams')) {
      const allFiles = fileNames.map(fileName => {
        const fullPath = Object.keys(dataFiles).find((p) => p.endsWith(fileName));
        if (fullPath) {
          const moduleContent = dataFiles[fullPath];
          const actualContent = moduleContent.default || moduleContent;
          return { name: fileName, content: actualContent };
        }
        return { name: fileName, error: 'Not found' };
      });
      return getTeamAggregatedData(allFiles, charMap, capsuleMap);
    } else if (mode === 'manual' && (viewType === 'aggregated' || viewType === 'meta' || viewType === 'tables' || viewType === 'teams') && manualFiles.length > 1) {
      return getTeamAggregatedData(manualFiles, charMap, capsuleMap);
    }
    return [];
  }, [mode, viewType, charMap, capsuleMap, manualFiles]);

  // Helper to toggle expanded state
  const toggleRow = (teamType, idx) => {
    setExpandedRows(prev => ({ ...prev, [`${teamType}_${idx}`]: !prev[`${teamType}_${idx}`] }));
  };

  const handleSelect = (fileName) => {
    setSelectedFile(fileName);
    const fullPath = Object.keys(dataFiles).find((p) => p.endsWith(fileName));
    if (fullPath) {
      // Access the default export from Vite's import.meta.glob
      const moduleContent = dataFiles[fullPath];
      const actualContent = moduleContent.default || moduleContent;
      setFileContent(actualContent);
    } else {
      setFileContent({ error: 'File not found.' });
    }
    setExpandedRows({}); // Reset expanded state on file change
  };

  const handleManualFileUpload = (event) => {
    const files = Array.from(event.target.files);
    Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = JSON.parse(e.target.result);
            resolve({ name: file.name, content });
          } catch (error) {
            resolve({ name: file.name, error: 'Invalid JSON file' });
          }
        };
        reader.readAsText(file);
      });
    })).then(results => {
      setManualFiles(results);
      // Automatically select the first valid file if only one file was uploaded
      const validFiles = results.filter(f => !f.error);
      if (validFiles.length === 1) {
        setFileContent(validFiles[0].content);
        setSelectedFile(validFiles[0].name);
      } else {
        setFileContent(null);
        setSelectedFile(null);
      }
      setExpandedRows({});
    });
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setSelectedFile(null);
    setFileContent(null);
    setManualFiles([]);
    setViewType('single');
    setExpandedRows({});
  };

  const handleManualFileSelect = (fileName) => {
    const file = manualFiles.find(f => f.name === fileName);
    if (file && !file.error) {
      setFileContent(file.content);
      setSelectedFile(fileName);
    }
    setExpandedRows({});
  };

  // Helper function to recursively search for BattleResults, TeamBattleResults, or battleWinLose in nested JSON
  const findBattleData = (obj, maxDepth = 5, currentDepth = 0) => {
    if (!obj || typeof obj !== 'object' || currentDepth >= maxDepth) {
      return null;
    }

    // Check if current object has TeamBattleResults (current BR_Data format)
    if (obj.TeamBattleResults && typeof obj.TeamBattleResults === 'object') {
      const teamBattleResults = obj.TeamBattleResults;
      if (teamBattleResults.battleResult) {
        return teamBattleResults.battleResult;
      }
    }

    // Check if current object has BattleResults
    if (obj.BattleResults && typeof obj.BattleResults === 'object') {
      return obj.BattleResults;
    }

    // Check if current object directly has battleWinLose (legacy format)
    if (obj.battleWinLose && obj.characterRecord) {
      return obj;
    }

    // Recursively search in nested objects
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && obj[key] !== null) {
        const result = findBattleData(obj[key], maxDepth, currentDepth + 1);
        if (result) {
          return result;
        }
      }
    }

    return null;
  };

  // Find correct root for battleWinLose and characterRecord
  let battleWinLose, characterRecord;
  if (fileContent && typeof fileContent === 'object') {
    // Handle TeamBattleResults format (current BR_Data structure)
    if (fileContent.TeamBattleResults && typeof fileContent.TeamBattleResults === 'object') {
      const teamBattleResults = fileContent.TeamBattleResults;
      if (teamBattleResults.battleResult) {
        battleWinLose = teamBattleResults.battleResult.battleWinLose;
        characterRecord = teamBattleResults.battleResult.characterRecord;
      }
    }
    // Handle new format with teams array at the top
    else if (fileContent.teams && Array.isArray(fileContent.teams) && fileContent.teams.length > 0) {
      const firstTeam = fileContent.teams[0];
      if (firstTeam.BattleResults) {
        battleWinLose = firstTeam.BattleResults.battleWinLose;
        characterRecord = firstTeam.BattleResults.characterRecord;
      } else if (firstTeam.battleWinLose) {
        battleWinLose = firstTeam.battleWinLose;
        characterRecord = firstTeam.characterRecord;
      }
    } 
    // Handle standard format with BattleResults at root
    else if (fileContent.BattleResults) {
      battleWinLose = fileContent.BattleResults.battleWinLose;
      characterRecord = fileContent.BattleResults.characterRecord;
    } 
    // Handle legacy format with direct properties
    else if (fileContent.battleWinLose && fileContent.characterRecord) {
      battleWinLose = fileContent.battleWinLose;
      characterRecord = fileContent.characterRecord;
    }
    // Fallback: recursively search for BattleResults in nested structure
    else {
      const battleData = findBattleData(fileContent);
      if (battleData) {
        battleWinLose = battleData.battleWinLose;
        characterRecord = battleData.characterRecord;
      }
    }
  }

  // Extract team names from teams array (multiple format support)
  let p1TeamName = "Team 1";
  let p2TeamName = "Team 2";
  if (fileContent && typeof fileContent === 'object') {
    let teamsArray = null;
    
    // Check for TeamBattleResults format first
    if (fileContent.TeamBattleResults && Array.isArray(fileContent.TeamBattleResults.teams)) {
      teamsArray = fileContent.TeamBattleResults.teams;
    }
    // Check for direct teams array
    else if (Array.isArray(fileContent.teams)) {
      teamsArray = fileContent.teams;
    }
    // Check for nested teams in BattleResults
    else if (fileContent.BattleResults && Array.isArray(fileContent.BattleResults.teams)) {
      teamsArray = fileContent.BattleResults.teams;
    }
    
    if (teamsArray && teamsArray.length >= 2) {
      // Handle both string and object formats
      const team1 = teamsArray[0];
      const team2 = teamsArray[1];
      
      // If team1 is a string, use it directly; if it's an object, look for a teamName property
      if (typeof team1 === 'string') {
        p1TeamName = team1 || "Team 1";
      } else if (team1 && typeof team1 === 'object' && team1.teamName) {
        p1TeamName = team1.teamName || "Team 1";
      }
      
      // Same for team2
      if (typeof team2 === 'string') {
        p2TeamName = team2 || "Team 2";
      } else if (team2 && typeof team2 === 'object' && team2.teamName) {
        p2TeamName = team2.teamName || "Team 2";
      }
    } else if (teamsArray && teamsArray.length === 1) {
      const team1 = teamsArray[0];
      
      // If team1 is a string, use it directly; if it's an object, look for a teamName property
      if (typeof team1 === 'string') {
        p1TeamName = team1 || "Team 1";
      } else if (team1 && typeof team1 === 'object' && team1.teamName) {
        p1TeamName = team1.teamName || "Team 1";
      }
    }
  }

  // Extract teams for single file view
  let p1Team = [], p2Team = [];
  if (characterRecord) {
    const teams = getTeams(characterRecord);
    p1Team = teams.p1;
    p2Team = teams.p2;
  }

  const p1Summary = getTeamStats(p1Team, charMap, capsuleMap);
  const p2Summary = getTeamStats(p2Team, charMap, capsuleMap);

  return (
    <div className={`min-h-screen p-4 transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900' 
        : 'bg-gradient-to-br from-orange-500 via-red-600 to-purple-700'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`rounded-2xl shadow-2xl p-6 mb-6 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center gap-3 flex-1">
              <Swords className={`w-12 h-12 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
              <div className="text-center">
                <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Dragon Ball Sparking Zero
                </h1>
                <h2 className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Match Analyzer
                </h2>
              </div>
              <Trophy className={`w-12 h-12 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-xl transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mode Selection */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Target className={`w-6 h-6 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Analysis Mode</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              mode === 'reference' 
                ? darkMode
                  ? 'border-orange-400 bg-orange-900/30 text-orange-300'
                  : 'border-orange-500 bg-orange-50 text-orange-700'
                : darkMode
                  ? 'border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}>
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6" />
                <div>
                  <input 
                    type="radio" 
                    value="reference" 
                    checked={mode === 'reference'} 
                    onChange={(e) => handleModeChange(e.target.value)}
                    className="sr-only"
                  />
                  <span className="font-semibold">Reference Data Files</span>
                  <p className="text-sm opacity-75">Use built-in test data</p>
                </div>
              </div>
            </label>
            <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              mode === 'manual' 
                ? darkMode
                  ? 'border-orange-400 bg-orange-900/30 text-orange-300'
                  : 'border-orange-500 bg-orange-50 text-orange-700'
                : darkMode
                  ? 'border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}>
              <div className="flex items-center gap-3">
                <Upload className="w-6 h-6" />
                <div>
                  <input 
                    type="radio" 
                    value="manual" 
                    checked={mode === 'manual'} 
                    onChange={(e) => handleModeChange(e.target.value)}
                    className="sr-only"
                  />
                  <span className="font-semibold">Manual File Upload</span>
                  <p className="text-sm opacity-75">Upload your own JSON files</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Reference Data Mode */}
        {mode === 'reference' && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>View Type</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                viewType === 'single' 
                  ? darkMode
                    ? 'border-blue-400 bg-blue-900/30 text-blue-300'
                    : 'border-blue-500 bg-blue-50 text-blue-700'
                  : darkMode
                    ? 'border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6" />
                  <div>
                    <input 
                      type="radio" 
                      value="single" 
                      checked={viewType === 'single'} 
                      onChange={(e) => setViewType(e.target.value)}
                      className="sr-only"
                    />
                    <span className="font-semibold">Single Match</span>
                    <p className="text-sm opacity-75">Detailed view</p>
                  </div>
                </div>
              </label>
              <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                viewType === 'aggregated' 
                  ? darkMode
                    ? 'border-blue-400 bg-blue-900/30 text-blue-300'
                    : 'border-blue-500 bg-blue-50 text-blue-700'
                  : darkMode
                    ? 'border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6" />
                  <div>
                    <input 
                      type="radio" 
                      value="aggregated" 
                      checked={viewType === 'aggregated'} 
                      onChange={(e) => setViewType(e.target.value)}
                      className="sr-only"
                    />
                    <span className="font-semibold">Aggregated Stats</span>
                    <p className="text-sm opacity-75">Combined data</p>
                  </div>
                </div>
              </label>
              <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                viewType === 'teams' 
                  ? darkMode
                    ? 'border-yellow-400 bg-yellow-900/30 text-yellow-300'
                    : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : darkMode
                    ? 'border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  <div>
                    <input 
                      type="radio" 
                      value="teams" 
                      checked={viewType === 'teams'} 
                      onChange={(e) => setViewType(e.target.value)}
                      className="sr-only"
                    />
                    <span className="font-semibold">Team Rankings</span>
                    <p className="text-sm opacity-75">Win/Loss records</p>
                  </div>
                </div>
              </label>
              <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                viewType === 'tables' 
                  ? darkMode
                    ? 'border-green-400 bg-green-900/30 text-green-300'
                    : 'border-green-500 bg-green-50 text-green-700'
                  : darkMode
                    ? 'border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <Table className="w-6 h-6" />
                  <div>
                    <input 
                      type="radio" 
                      value="tables" 
                      checked={viewType === 'tables'} 
                      onChange={(e) => setViewType(e.target.value)}
                      className="sr-only"
                    />
                    <span className="font-semibold">Data Tables</span>
                    <p className="text-sm opacity-75">Interactive tables</p>
                  </div>
                </div>
              </label>
              <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                viewType === 'meta' 
                  ? darkMode
                    ? 'border-purple-400 bg-purple-900/30 text-purple-300'
                    : 'border-purple-500 bg-purple-50 text-purple-700'
                  : darkMode
                    ? 'border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6" />
                  <div>
                    <input 
                      type="radio" 
                      value="meta" 
                      checked={viewType === 'meta'} 
                      onChange={(e) => setViewType(e.target.value)}
                      className="sr-only"
                    />
                    <span className="font-semibold">Meta Analysis</span>
                    <p className="text-sm opacity-75">Build trends</p>
                  </div>
                </div>
              </label>
            </div>

            {viewType === 'single' && (
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Select a test data file to analyze:
                </label>
                <select
                  value={selectedFile || ''}
                  onChange={e => handleSelect(e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-400' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  }`}
                >
                  <option value="" disabled>Choose a battle result file...</option>
                  {fileNames.map((file) => (
                    <option key={file} value={file}>{file}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Manual Upload Mode */}
        {mode === 'manual' && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-4">
              <Upload className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Upload JSON Battle Result Files</h3>
            </div>
            
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              darkMode 
                ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' 
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}>
              <Upload className={`w-8 h-8 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Click to upload JSON files or drag and drop</span>
              <input
                type="file"
                multiple
                accept=".json"
                onChange={handleManualFileUpload}
                className="hidden"
              />
            </label>
            
            {manualFiles.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Uploaded Files ({manualFiles.length})
                </h4>
                <div className="space-y-2 mb-4">
                  {manualFiles.map((file, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${
                      file.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                    }`}>
                      {file.error ? (
                        <Shield className="w-5 h-5 text-red-500" />
                      ) : (
                        <Target className="w-5 h-5 text-green-500" />
                      )}
                      <span className="flex-1">{file.name}</span>
                      {file.error && <span className="text-red-600 text-sm">Error: {file.error}</span>}
                    </div>
                  ))}
                </div>
                
                {manualFiles.length === 1 && !manualFiles[0].error ? (
                  <button 
                    onClick={() => handleManualFileSelect(manualFiles[0].name)}
                    className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    Analyze {manualFiles[0].name}
                  </button>
                ) : manualFiles.filter(f => !f.error).length > 1 ? (
                  <div className="space-y-3">
                    <select
                      value={selectedFile || ''}
                      onChange={e => handleManualFileSelect(e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-400' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                    >
                      <option value="" disabled>Select a file to analyze...</option>
                      {manualFiles.filter(f => !f.error).map((file) => (
                        <option key={file.name} value={file.name}>{file.name}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Aggregated Data Display */}
        {((mode === 'reference' && viewType === 'aggregated') || 
          (mode === 'manual' && viewType === 'aggregated' && manualFiles.filter(f => !f.error).length > 1)) && 
          aggregatedData.length > 0 && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Aggregated Character Performance</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Data from {mode === 'reference' ? fileNames.length : manualFiles.filter(f => !f.error).length} battle files
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {aggregatedData.map((char, i) => {
                const expanded = expandedRows[`agg_${i}`] || false;
                const allDamageValues = aggregatedData.map(c => c.totalDamage);
                const allDamageTakenValues = aggregatedData.map(c => c.totalTaken);
                const allAvgDamageValues = aggregatedData.map(c => c.avgDamage);
                const allAvgTakenValues = aggregatedData.map(c => c.avgTaken);
                const allAvgHealthValues = aggregatedData.map(c => c.avgHealth);
                const allAvgBattleTimeValues = aggregatedData.map(c => c.avgBattleTime);
                const avgBattleTime = allAvgBattleTimeValues.reduce((sum, val) => sum + val, 0) / allAvgBattleTimeValues.length;
                
                // Calculate composite combat performance scores for ranking
                const combatPerformanceScores = aggregatedData.map(c => {
                  const damageScore = c.avgDamage;
                  const damageEfficiency = c.avgDamage / Math.max(c.avgTaken, 1);
                  const damageOverTime = c.avgDamage / c.avgBattleTime;
                  // Combine scores (weighted average) - increased efficiency weight
                  return damageScore * 0.3 + damageEfficiency * 15000 * 0.4 + damageOverTime * 100 * 0.3;
                });
                const currentCombatScore = char.avgDamage * 0.3 + (char.avgDamage / Math.max(char.avgTaken, 1)) * 15000 * 0.4 + (char.avgDamage / char.avgBattleTime) * 100 * 0.3;
                
                return (
                  <div key={i} className={`rounded-xl p-6 border transition-colors ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 hover:border-gray-500' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Swords className={`w-6 h-6 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{char.name}</h3>
                          <PerformanceIndicator value={currentCombatScore} allValues={combatPerformanceScores} darkMode={darkMode} />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <BarChart3 className="w-4 h-4" />
                            <span>{char.matchCount} matches played</span>
                          </div>
                          <button 
                            onClick={() => toggleRow('agg', i)} 
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              darkMode 
                                ? 'bg-blue-900 hover:bg-blue-800 text-blue-400' 
                                : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                            }`}
                            title="View detailed stats"
                          >
                            {expanded ? '−' : '+'}
                          </button>
                        </div>
                      </div>
                      
                      {char.formHistory && (
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Forms: {char.formHistory}
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <StatBar 
                            value={char.avgDamage} 
                            maxValue={Math.max(...allAvgDamageValues)} 
                            type="damage" 
                            label="Avg Damage"
                            icon={Zap}
                            darkMode={darkMode}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <StatBar 
                            value={char.avgDamage / char.avgBattleTime} 
                            maxValue={Math.max(...aggregatedData.map(c => c.avgDamage / c.avgBattleTime))} 
                            displayValue={Math.round(char.avgDamage / char.avgBattleTime)}
                            type="special" 
                            label="Damage/Sec"
                            icon={Target}
                            darkMode={darkMode}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <StatBar 
                            value={char.avgDamage / Math.max(char.avgTaken, 1)} 
                            maxValue={Math.max(...aggregatedData.map(c => c.avgDamage / Math.max(c.avgTaken, 1)))} 
                            displayValue={(char.avgDamage / Math.max(char.avgTaken, 1)).toFixed(2) + 'x'}
                            type="ultimate" 
                            label="Efficiency"
                            icon={TrendingUp}
                            darkMode={darkMode}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <BattleTimeVariance 
                            value={char.avgBattleTime}
                            averageValue={avgBattleTime}
                            darkMode={darkMode}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Eliminations</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`text-lg font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`}>{char.totalKills}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {expanded && (
                      <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Combat Performance */}
                          <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                            <div className="flex items-center gap-2 mb-3">
                              <Swords className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                              <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Combat Performance</h4>
                            </div>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Damage per Match:</span>
                                <div className="flex items-center gap-2">
                                  <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgDamage.toLocaleString()}</strong>
                                  <PerformanceIndicator value={char.avgDamage} allValues={allAvgDamageValues} darkMode={darkMode} />
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Damage Taken:</span>
                                <div className="flex items-center gap-2">
                                  <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgTaken.toLocaleString()}</strong>
                                  <PerformanceIndicator value={char.avgTaken} allValues={allAvgTakenValues} isInverse={true} darkMode={darkMode} />
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Damage Over Time:</span>
                                <div className="flex items-center gap-2">
                                  <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round(char.avgDamage / char.avgBattleTime).toLocaleString()}/sec</strong>
                                  <PerformanceIndicator value={char.avgDamage / char.avgBattleTime} allValues={aggregatedData.map(c => c.avgDamage / c.avgBattleTime)} darkMode={darkMode} />
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Damage Efficiency:</span>
                                <div className="flex items-center gap-2">
                                  <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{(char.avgDamage / Math.max(char.avgTaken, 1)).toFixed(2)}x</strong>
                                  <PerformanceIndicator value={char.avgDamage / Math.max(char.avgTaken, 1)} allValues={aggregatedData.map(c => c.avgDamage / Math.max(c.avgTaken, 1))} darkMode={darkMode} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Survival & Health and Special Abilities in a nested grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Survival & Health */}
                            <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                              <div className="flex items-center gap-2 mb-3">
                                <Heart className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                                <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Survival & Health</h4>
                              </div>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg HP Remaining:</span>
                                  <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgHealth.toLocaleString()}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Survival Rate:</span>
                                  <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{((char.avgHealth / 40000) * 100).toFixed(1)}%</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Eliminations:</span>
                                  <strong className={`flex items-center gap-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    <Trophy className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                                    {char.totalKills}
                                  </strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Kills per Match:</span>
                                  <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgKills}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Special Abilities */}
                            <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                              <div className="flex items-center gap-2 mb-3">
                                <Zap className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                                <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Special Abilities</h4>
                              </div>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Blast Skills:</span>
                                  <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.totalSpecial}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Blasts per Match:</span>
                                  <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgSpecial}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Ultimates:</span>
                                  <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.totalUltimates}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Ultimates per Match:</span>
                                  <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgUltimates}</strong>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Forms & Transformations */}
                          {char.hasMultipleForms && (
                            <div className={`rounded-lg p-4 md:col-span-2 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                              <div className="flex items-center gap-2 mb-3">
                                <Star className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Form Breakdown</h4>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                      <th className={`text-left py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Form</th>
                                      <th className={`text-right py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Matches</th>
                                      <th className={`text-right py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Damage</th>
                                      <th className={`text-right py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Avg Damage</th>
                                      <th className={`text-right py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Avg HP</th>
                                      <th className={`text-right py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kills</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {char.formStatsArray.map((formStat, idx) => (
                                      <tr key={idx} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                        <td className={`py-2 font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formStat.name}</td>
                                        <td className={`py-2 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formStat.matchCount}</td>
                                        <td className={`py-2 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formStat.totalDamage.toLocaleString()}</td>
                                        <td className={`py-2 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formStat.avgDamage.toLocaleString()}</td>
                                        <td className={`py-2 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formStat.avgHealth.toLocaleString()}</td>
                                        <td className={`py-2 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formStat.totalKills}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Position-Based Performance Analysis */}
        {((mode === 'reference' && viewType === 'aggregated') || 
          (mode === 'manual' && viewType === 'aggregated' && manualFiles.filter(f => !f.error).length > 1)) && 
          Object.keys(positionData).length > 0 && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <Users className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Character Position Analysis</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Performance breakdown by team position (Lead, Middle, Anchor)
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(position => {
                const posData = positionData[position];
                const positionNames = ['Lead', 'Middle', 'Anchor'];
                const positionColors = [
                  { light: 'text-red-600', dark: 'text-red-400', bg: 'bg-red-50', darkBg: 'bg-red-900/20', border: 'border-red-200', darkBorder: 'border-red-600' },
                  { light: 'text-blue-600', dark: 'text-blue-400', bg: 'bg-blue-50', darkBg: 'bg-blue-900/20', border: 'border-blue-200', darkBorder: 'border-blue-600' },
                  { light: 'text-purple-600', dark: 'text-purple-400', bg: 'bg-purple-50', darkBg: 'bg-purple-900/20', border: 'border-purple-200', darkBorder: 'border-purple-600' }
                ];
                const colors = positionColors[position - 1];
                
                return (
                  <div key={position} className={`rounded-xl border p-4 ${
                    darkMode 
                      ? `${colors.darkBg} ${colors.darkBorder}` 
                      : `${colors.bg} ${colors.border}`
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Target className={`w-5 h-5 ${darkMode ? colors.dark : colors.light}`} />
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Position {position}: {positionNames[position - 1]}
                      </h3>
                    </div>
                    
                    <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Matches: {posData.totalMatches}
                    </div>
                    
                    {posData.sortedCharacters.length > 0 ? (
                      <div className="space-y-3">
                        {posData.sortedCharacters.slice(0, 5).map((char, idx) => (
                          <div key={idx} className={`p-3 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                {char.name}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {char.matchCount} matches
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Damage</div>
                                <div className={`font-medium ${darkMode ? colors.dark : colors.light}`}>
                                  {formatNumber(Math.round(char.avgDamage))}
                                </div>
                              </div>
                              <div>
                                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Efficiency</div>
                                <div className={`font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                  {(char.damageEfficiency).toFixed(1)}x
                                </div>
                              </div>
                              <div>
                                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Sparking</div>
                                <div className={`font-medium ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                  {char.avgSparking.toFixed(1)}
                                </div>
                              </div>
                              <div>
                                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Combo</div>
                                <div className={`font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                  {formatNumber(Math.round(char.avgComboDamage))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {posData.sortedCharacters.length > 5 && (
                          <div className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            +{posData.sortedCharacters.length - 5} more characters...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`text-center text-sm py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        No data available for this position
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Position Performance Comparison Chart */}
            <div className={`mt-6 p-4 rounded-xl border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Cross-Position Performance Comparison
              </h4>
              
              {/* Average damage by position */}
              <div className="mb-6">
                <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Average Damage Output by Position
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(position => {
                    const posData = positionData[position];
                    const avgDamage = posData.sortedCharacters.length > 0 
                      ? posData.sortedCharacters.reduce((sum, char) => sum + char.avgDamage, 0) / posData.sortedCharacters.length
                      : 0;
                    const maxAvgDamage = Math.max(...[1, 2, 3].map(p => {
                      const pData = positionData[p];
                      return pData.sortedCharacters.length > 0 
                        ? pData.sortedCharacters.reduce((sum, char) => sum + char.avgDamage, 0) / pData.sortedCharacters.length
                        : 0;
                    }));
                    const barWidth = maxAvgDamage > 0 ? (avgDamage / maxAvgDamage) * 100 : 0;
                    
                    return (
                      <div key={position} className="text-center">
                        <div className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          Position {position}
                        </div>
                        <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatNumber(Math.round(avgDamage))}
                        </div>
                        <div className={`w-full h-4 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-4 rounded transition-all duration-300 ${
                              position === 1 ? 'bg-red-500' : position === 2 ? 'bg-blue-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Character diversity by position */}
              <div className="mb-6">
                <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Character Pool Diversity by Position
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[1, 2, 3].map(position => {
                    const posData = positionData[position];
                    const uniqueChars = posData.sortedCharacters.length;
                    const maxUniqueChars = Math.max(...[1, 2, 3].map(p => positionData[p].sortedCharacters.length));
                    const diversityScore = maxUniqueChars > 0 ? (uniqueChars / maxUniqueChars) * 100 : 0;
                    
                    return (
                      <div key={position} className={`p-3 rounded-lg ${
                        darkMode ? 'bg-gray-600' : 'bg-white'
                      }`}>
                        <div className={`text-2xl font-bold ${
                          position === 1 ? (darkMode ? 'text-red-400' : 'text-red-600') :
                          position === 2 ? (darkMode ? 'text-blue-400' : 'text-blue-600') :
                          (darkMode ? 'text-purple-400' : 'text-purple-600')
                        }`}>
                          {uniqueChars}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Unique Characters
                        </div>
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {diversityScore.toFixed(0)}% diversity
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Position Meta Summary */}
            <div className={`mt-6 p-4 rounded-xl border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Position Meta Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {[1, 2, 3].map(position => {
                  const posData = positionData[position];
                  const positionNames = ['Lead', 'Middle', 'Anchor'];
                  const topPerformer = posData.sortedCharacters[0];
                  
                  return (
                    <div key={position} className={`p-3 rounded-lg ${
                      darkMode ? 'bg-gray-600' : 'bg-white'
                    }`}>
                      <div className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {positionNames[position - 1]} Position
                      </div>
                      {topPerformer ? (
                        <>
                          <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Top: {topPerformer.name}
                          </div>
                          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatNumber(Math.round(topPerformer.avgDamage))} avg damage
                          </div>
                          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {posData.sortedCharacters.length} unique characters
                          </div>
                        </>
                      ) : (
                        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          No data available
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Strategic Position Insights */}
            <div className={`mt-6 p-4 rounded-xl border ${
              darkMode 
                ? 'bg-indigo-900/20 border-indigo-600' 
                : 'bg-indigo-50 border-indigo-200'
            }`}>
              <h4 className={`text-lg font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <Target className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                Strategic Position Insights
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Lead Position Insights */}
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-red-900/20 border border-red-600' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className={`font-semibold mb-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                    🥇 Lead Position (1)
                  </div>
                  <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div>• First to engage opponents</div>
                    <div>• Should have strong neutral game</div>
                    <div>• Often needs good defensive options</div>
                    <div>• Sets the pace for the team</div>
                  </div>
                  {positionData[1]?.sortedCharacters[0] && (
                    <div className={`mt-2 text-xs ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                      <strong>Top Pick:</strong> {positionData[1].sortedCharacters[0].name}
                    </div>
                  )}
                </div>
                
                {/* Middle Position Insights */}
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-blue-900/20 border border-blue-600' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className={`font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    🛡️ Middle Position (2)
                  </div>
                  <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div>• Balanced role and utility</div>
                    <div>• Can support lead or clean up</div>
                    <div>• Often versatile characters</div>
                    <div>• Adapts to team needs</div>
                  </div>
                  {positionData[2]?.sortedCharacters[0] && (
                    <div className={`mt-2 text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      <strong>Top Pick:</strong> {positionData[2].sortedCharacters[0].name}
                    </div>
                  )}
                </div>
                
                {/* Anchor Position Insights */}
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-purple-900/20 border border-purple-600' : 'bg-purple-50 border border-purple-200'
                }`}>
                  <div className={`font-semibold mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    ⚡ Anchor Position (3)
                  </div>
                  <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div>• Last character standing</div>
                    <div>• High damage potential needed</div>
                    <div>• Strong comeback mechanics</div>
                    <div>• Often carries the team</div>
                  </div>
                  {positionData[3]?.sortedCharacters[0] && (
                    <div className={`mt-2 text-xs ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                      <strong>Top Pick:</strong> {positionData[3].sortedCharacters[0].name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Meta Analysis Display */}
        {((mode === 'reference' && viewType === 'meta') || 
          (mode === 'manual' && viewType === 'meta' && manualFiles.filter(f => !f.error).length > 1)) && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-3 mb-6">
              <Database className={`w-8 h-8 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Build Meta Analysis</h2>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Capsule effectiveness and build archetype trends across all matches
                </p>
              </div>
            </div>
            
            <MetaAnalysisContent aggregatedData={aggregatedData} capsuleMap={capsuleMap} aiStrategies={aiStrategies} darkMode={darkMode} />
          </div>
        )}

        {/* Single File Analysis Results */}
        {((mode === 'reference' && selectedFile && viewType === 'single') || 
          (mode === 'manual' && selectedFile && fileContent)) && (
          <div className={`rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Match Analysis: {selectedFile}</h2>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Detailed breakdown of this battle</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
              </div>
            </div>
            
            {/* Match Outcome Summary */}
            {battleWinLose && (
              <div className={`mb-6 p-4 rounded-xl border text-center ${
                battleWinLose === 'Win'
                  ? (darkMode 
                      ? 'bg-green-900/20 border-green-600 text-green-400' 
                      : 'bg-green-50 border-green-200 text-green-800')
                  : (darkMode 
                      ? 'bg-red-900/20 border-red-600 text-red-400' 
                      : 'bg-red-50 border-red-200 text-red-800')
              }`}>
                <div className="flex items-center justify-center gap-3">
                  <div>
                    <div className="text-lg font-bold">
                      {battleWinLose === 'Win' ? `${p1TeamName} Victory!` : `${p2TeamName} Victory!`}
                    </div>
                    <div className="text-sm opacity-80">
                      {battleWinLose === 'Win' 
                        ? `${p1TeamName} emerged victorious in this battle` 
                        : `${p2TeamName} emerged victorious in this battle`}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* P1 Team */}
              <div className={`rounded-xl p-6 border ${
                darkMode 
                  ? battleWinLose === 'Win' 
                    ? 'border-green-600 bg-green-900/10' 
                    : 'border-red-600 bg-red-900/10'
                  : battleWinLose === 'Win'
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Users className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{p1TeamName}</h3>
                    {battleWinLose && (
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        battleWinLose === 'Win' 
                          ? (darkMode ? 'bg-green-900/50 text-green-400 border border-green-600' : 'bg-green-100 text-green-800 border border-green-200')
                          : (darkMode ? 'bg-red-900/50 text-red-400 border border-red-600' : 'bg-red-100 text-red-800 border border-red-200')
                      }`}>
                        {battleWinLose === 'Win' ? 'VICTORY' : 'DEFEAT'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <StatBar 
                    value={p1Summary.totalDamage} 
                    maxValue={Math.max(p1Summary.totalDamage, p2Summary.totalDamage)} 
                    type="damage" 
                    label="Total Damage"
                    icon={Target}
                    darkMode={darkMode}
                  />
                  <StatBar 
                    value={(p1Summary.totalHealth / p1Summary.totalHPGaugeValueMax) * 100} 
                    maxValue={100} 
                    displayValue={p1Summary.totalHealth}
                    type="health" 
                    label="HP Remaining"
                    icon={Heart}
                    darkMode={darkMode}
                  />
                  <StatBar 
                    value={p1Summary.totalUltimates} 
                    maxValue={Math.max(p1Summary.totalUltimates, p2Summary.totalUltimates)} 
                    type="ultimate" 
                    label="Ultimates Used"
                    icon={Zap}
                    darkMode={darkMode}
                  />
                </div>

                <h4 className={`font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Swords className="w-5 h-5" />
                  Characters
                </h4>
                <div className="space-y-3">
                  {p1Team.map((char, i) => {
                    const stats = extractStats(char, charMap, capsuleMap, i + 1);
                    const maxDamage = Math.max(...p1Team.map((c, idx) => extractStats(c, charMap, capsuleMap, idx + 1).damageDone));
                    
                    return (
                      <div key={i} className={`rounded-lg p-4 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.name}</h5>
                          <div className="flex items-center gap-2">
                            <Trophy className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{stats.kills} KOs</span>
                          </div>
                        </div>
                        {stats.formChangeHistory && (
                          <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Multiple forms used in this match
                          </div>
                        )}
                        <div className="mb-3">
                          <BuildDisplay stats={stats} showDetailed={false} darkMode={darkMode} />
                        </div>
                        
                        {/* Primary stats in a row: Damage Done, Taken, Battle Time */}
                        <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                          <div className="text-center">
                            <div className={`font-bold text-lg ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{formatNumber(stats.damageDone)}</div>
                            <div className={`flex items-center justify-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <Target className="w-3 h-3" />
                              Damage Done
                            </div>
                          </div>
                          <div className="text-center">
                            <div className={`font-bold text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{formatNumber(stats.damageTaken)}</div>
                            <div className={`flex items-center justify-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <Shield className="w-3 h-3" />
                              Damage Taken
                            </div>
                          </div>
                          <div className="text-center">
                            <div className={`font-bold text-lg ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>{formatBattleTime(stats.battleTime)}</div>
                            <div className={`flex items-center justify-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <Clock className="w-3 h-3" />
                              Battle Time
                            </div>
                          </div>
                        </div>
                        
                        {/* HP Remaining as smaller indicator */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} flex items-center gap-1`}>
                              <Heart className="w-3 h-3" />
                              HP Remaining
                            </span>
                            <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{formatNumber(stats.hPGaugeValue)} / {formatNumber(stats.hPGaugeValueMax)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                              className="h-1 rounded-full bg-green-500"
                              style={{ width: `${(stats.hPGaugeValue / stats.hPGaugeValueMax) * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                          <div className="text-center">
                            <div className={`font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.specialMovesUsed}</div>
                            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Blasts</div>
                          </div>
                          <div className="text-center">
                            <div className={`font-semibold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>{stats.ultimatesUsed}</div>
                            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Ultimates</div>
                          </div>
                          <div className="text-center">
                            <div className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.skillsUsed}</div>
                            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Skills</div>
                          </div>
                        </div>

                        {/* Additional Technique Usage Details */}
                        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Additional Combat Details</div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sparking Mode:</span>
                                <span className={`font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats.sparkingCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ki Charges:</span>
                                <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.chargeCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Guards:</span>
                                <span className={`font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.guardCount}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Energy Blasts:</span>
                                <span className={`font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.shotEnergyBulletCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max Combo:</span>
                                <span className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{stats.maxComboNum}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Combo Damage:</span>
                                <span className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{formatNumber(stats.maxComboDamage)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Form Performance Breakdown Button */}
                        {stats.formChangeHistory && (
                          <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <button 
                              onClick={() => toggleRow('p1_form', i)} 
                              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-colors text-sm font-medium ${
                                darkMode
                                  ? 'bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-300 border-yellow-600'
                                  : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200'
                              }`}
                              title="View detailed form performance data"
                            >
                              <Star className="w-4 h-4" />
                              <span>Form Performance Breakdown</span>
                              <span className="text-xs">
                                {expandedRows[`p1_form_${i}`] ? '−' : '+'}
                              </span>
                            </button>
                          </div>
                        )}
                        
                        {/* Expandable Form History Breakdown */}
                        {stats.formChangeHistory && expandedRows[`p1_form_${i}`] && (
                          <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div className={`p-4 rounded border ${
                              darkMode 
                                ? 'bg-yellow-900/20 border-yellow-600' 
                                : 'bg-yellow-50 border-yellow-200'
                            }`}>
                              <div className="flex items-center gap-2 mb-3">
                                <Star className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                <span className={`text-sm font-bold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Form Performance Breakdown</span>
                              </div>
                              
                              {/* Individual form stats from characterIdRecord if available */}
                              {(() => {
                                const characterIdRecord = fileContent?.BattleResults?.characterIdRecord || fileContent?.characterIdRecord;
                                if (!characterIdRecord) {
                                  return (
                                    <div className={`text-xs ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Forms Used:</span> {stats.formChangeHistory}
                                      <div className={`text-xs mt-1 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                        Individual form data not available for this match
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // Extract form stats from characterIdRecord
                                const originalForm = char.battlePlayCharacter?.originalCharacter?.key;
                                const allForms = [];
                                if (originalForm) allForms.push(originalForm);
                                if (Array.isArray(char.formChangeHistory) && char.formChangeHistory.length > 0) {
                                  allForms.push(...char.formChangeHistory.map(f => f.key));
                                }
                                
                                const formStats = allForms.map(formId => {
                                  const formRecord = characterIdRecord[`(Key="${formId}")`];
                                  if (!formRecord) return null;
                                  
                                  const formCount = formRecord.battleCount || {};
                                  const formNumCount = formCount.battleNumCount || {};
                                  const formName = charMap[formId] || formId;
                                  
                                  return {
                                    name: formName,
                                    damageDone: formCount.givenDamage || 0,
                                    damageTaken: formCount.takenDamage || 0,
                                    battleTime: parseBattleTime(formCount.battleTime) || 0,
                                    hPGaugeValue: formCount.hPGaugeValue || 0,
                                    specialMoves: formNumCount.sPMCount || 0,
                                    ultimates: formNumCount.uLTCount || 0,
                                    skills: formNumCount.eXACount || 0,
                                    kills: formCount.killCount || 0
                                  };
                                }).filter(Boolean);
                                
                                if (formStats.length === 0) {
                                  return (
                                    <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Forms Used:</span> {stats.formChangeHistory}
                                      <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'} mt-1`}>
                                        Form performance data not available
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-yellow-300">
                                          <th className="text-left py-1 font-medium text-yellow-800">Form</th>
                                          <th className="text-right py-1 font-medium text-yellow-800">Damage</th>
                                          <th className="text-right py-1 font-medium text-yellow-800">Taken</th>
                                          <th className="text-right py-1 font-medium text-yellow-800">Time</th>
                                          <th className="text-right py-1 font-medium text-yellow-800">HP</th>
                                          <th className="text-right py-1 font-medium text-yellow-800">Moves</th>
                                          <th className="text-right py-1 font-medium text-yellow-800">KOs</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {formStats.map((form, idx) => (
                                          <tr key={idx} className="border-b border-yellow-200">
                                            <td className="py-1 font-semibold text-yellow-800">{form.name}</td>
                                            <td className="py-1 text-right text-yellow-700">{formatNumber(form.damageDone)}</td>
                                            <td className="py-1 text-right text-yellow-700">{formatNumber(form.damageTaken)}</td>
                                            <td className="py-1 text-right text-yellow-700">{formatBattleTime(form.battleTime)}</td>
                                            <td className="py-1 text-right text-yellow-700">{formatNumber(form.hPGaugeValue)}</td>
                                            <td className="py-1 text-right text-yellow-700">{form.specialMoves + form.ultimates + form.skills}</td>
                                            <td className="py-1 text-right text-yellow-700">{form.kills}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* P2 Team */}
              <div className={`rounded-xl p-6 border ${
                darkMode 
                  ? battleWinLose === 'Lose' 
                    ? 'border-green-600 bg-green-900/10' 
                    : 'border-red-600 bg-red-900/10'
                  : battleWinLose === 'Lose'
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Users className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{p2TeamName}</h3>
                    {battleWinLose && (
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        battleWinLose === 'Lose' 
                          ? (darkMode ? 'bg-green-900/50 text-green-400 border border-green-600' : 'bg-green-100 text-green-800 border border-green-200')
                          : (darkMode ? 'bg-red-900/50 text-red-400 border border-red-600' : 'bg-red-100 text-red-800 border border-red-200')
                      }`}>
                        {battleWinLose === 'Lose' ? 'VICTORY' : 'DEFEAT'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <StatBar 
                    value={p2Summary.totalDamage} 
                    maxValue={Math.max(p1Summary.totalDamage, p2Summary.totalDamage)} 
                    type="damage" 
                    label="Total Damage"
                    icon={Target}
                    darkMode={darkMode}
                  />
                  <StatBar 
                    value={(p2Summary.totalHealth / p2Summary.totalHPGaugeValueMax) * 100} 
                    maxValue={100} 
                    displayValue={p2Summary.totalHealth}
                    type="health" 
                    label="HP Remaining"
                    icon={Heart}
                    darkMode={darkMode}
                  />
                  <StatBar 
                    value={p2Summary.totalUltimates} 
                    maxValue={Math.max(p1Summary.totalUltimates, p2Summary.totalUltimates)} 
                    type="ultimate" 
                    label="Ultimates Used"
                    icon={Zap}
                    darkMode={darkMode}
                  />
                </div>

                <h4 className={`font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Swords className="w-5 h-5" />
                  Characters
                </h4>
                <div className="space-y-3">
                  {p2Team.map((char, i) => {
                    const stats = extractStats(char, charMap, capsuleMap, i + 1);
                    const maxDamage = Math.max(...p2Team.map((c, idx) => extractStats(c, charMap, capsuleMap, idx + 1).damageDone));
                    
                    return (
                      <div key={i} className={`rounded-lg p-4 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.name}</h5>
                          <div className="flex items-center gap-2">
                            <Trophy className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{stats.kills} KOs</span>
                          </div>
                        </div>
                        {stats.formChangeHistory && (
                          <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Multiple forms used in this match
                          </div>
                        )}
                        <div className="mb-3">
                          <BuildDisplay stats={stats} showDetailed={false} darkMode={darkMode} />
                        </div>
                        
                        {/* Primary stats in a row: Damage Done, Taken, Battle Time */}
                        <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                          <div className="text-center">
                            <div className={`font-bold text-lg ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{formatNumber(stats.damageDone)}</div>
                            <div className={`flex items-center justify-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <Target className="w-3 h-3" />
                              Damage Done
                            </div>
                          </div>
                          <div className="text-center">
                            <div className={`font-bold text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{formatNumber(stats.damageTaken)}</div>
                            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} flex items-center justify-center gap-1`}>
                              <Shield className="w-3 h-3" />
                              Damage Taken
                            </div>
                          </div>
                          <div className="text-center">
                            <div className={`font-bold text-lg ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>{formatBattleTime(stats.battleTime)}</div>
                            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} flex items-center justify-center gap-1`}>
                              <Clock className="w-3 h-3" />
                              Battle Time
                            </div>
                          </div>
                        </div>
                        
                        {/* HP Remaining as smaller indicator */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} flex items-center gap-1`}>
                              <Heart className="w-3 h-3" />
                              HP Remaining
                            </span>
                            <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{formatNumber(stats.hPGaugeValue)} / {formatNumber(stats.hPGaugeValueMax)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                              className="h-1 rounded-full bg-green-500"
                              style={{ width: `${(stats.hPGaugeValue / stats.hPGaugeValueMax) * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                          <div className="text-center">
                            <div className={`font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.specialMovesUsed}</div>
                            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Blasts</div>
                          </div>
                          <div className="text-center">
                            <div className={`font-semibold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>{stats.ultimatesUsed}</div>
                            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Ultimates</div>
                          </div>
                          <div className="text-center">
                            <div className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.skillsUsed}</div>
                            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Skills</div>
                          </div>
                        </div>

                        {/* Additional Technique Usage Details */}
                        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Additional Combat Details</div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sparking Mode:</span>
                                <span className={`font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats.sparkingCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ki Charges:</span>
                                <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.chargeCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Guards:</span>
                                <span className={`font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.guardCount}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Energy Blasts:</span>
                                <span className={`font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.shotEnergyBulletCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max Combo:</span>
                                <span className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{stats.maxComboNum}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Combo Damage:</span>
                                <span className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{formatNumber(stats.maxComboDamage)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Form Performance Breakdown Button */}
                        {stats.formChangeHistory && (
                          <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <button 
                              onClick={() => toggleRow('p2_form', i)} 
                              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-colors text-sm font-medium ${
                                darkMode
                                  ? 'bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-300 border-yellow-600'
                                  : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200'
                              }`}
                              title="View detailed form performance data"
                            >
                              <Star className="w-4 h-4" />
                              <span>Form Performance Breakdown</span>
                              <span className="text-xs">
                                {expandedRows[`p2_form_${i}`] ? '−' : '+'}
                              </span>
                            </button>
                          </div>
                        )}
                        
                        {/* Expandable Form History Breakdown */}
                        {stats.formChangeHistory && expandedRows[`p2_form_${i}`] && (
                          <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div className={`p-4 rounded border ${
                              darkMode 
                                ? 'bg-yellow-900/20 border-yellow-600' 
                                : 'bg-yellow-50 border-yellow-200'
                            }`}>
                              <div className="flex items-center gap-2 mb-3">
                                <Star className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                <span className={`text-sm font-bold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Form Performance Breakdown</span>
                              </div>
                              
                              {/* Individual form stats from characterIdRecord if available */}
                              {(() => {
                                const characterIdRecord = fileContent?.BattleResults?.characterIdRecord || fileContent?.characterIdRecord;
                                if (!characterIdRecord) {
                                  return (
                                    <div className={`text-xs ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Forms Used:</span> {stats.formChangeHistory}
                                      <div className={`text-xs mt-1 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                        Individual form data not available for this match
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // Extract form stats from characterIdRecord
                                const originalForm = char.battlePlayCharacter?.originalCharacter?.key;
                                const allForms = [];
                                if (originalForm) allForms.push(originalForm);
                                if (Array.isArray(char.formChangeHistory) && char.formChangeHistory.length > 0) {
                                  allForms.push(...char.formChangeHistory.map(f => f.key));
                                }
                                
                                const formStats = allForms.map(formId => {
                                  const formRecord = characterIdRecord[`(Key="${formId}")`];
                                  if (!formRecord) return null;
                                  
                                  const formCount = formRecord.battleCount || {};
                                  const formNumCount = formCount.battleNumCount || {};
                                  const formName = charMap[formId] || formId;
                                  
                                  return {
                                    name: formName,
                                    damageDone: formCount.givenDamage || 0,
                                    damageTaken: formCount.takenDamage || 0,
                                    battleTime: parseBattleTime(formCount.battleTime) || 0,
                                    hPGaugeValue: formCount.hPGaugeValue || 0,
                                    specialMoves: formNumCount.sPMCount || 0,
                                    ultimates: formNumCount.uLTCount || 0,
                                    skills: formNumCount.eXACount || 0,
                                    kills: formCount.killCount || 0
                                  };
                                }).filter(Boolean);
                                
                                if (formStats.length === 0) {
                                  return (
                                    <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Forms Used:</span> {stats.formChangeHistory}
                                      <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Form performance data not available
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-yellow-300">
                                          <th className="text-left py-1 font-medium text-yellow-800">Form</th>
                                          <th className="text-right py-1 font-medium text-yellow-800">Damage</th>
                                          <th className="text-right py-1 font-medium text-yellow-800">Taken</th>
                                          <th className="text-right py-1 font-medium text-yellow-800">Time</th>
                                          <th className="text-right py-1 font-medium text-yellow-800">HP</th>
                                          <th className="text-right py-1 font-medium text-yellow-800">Moves</th>
                                          <th className="text-right py-1 font-medium text-yellow-800">KOs</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {formStats.map((form, idx) => (
                                          <tr key={idx} className="border-b border-yellow-200">
                                            <td className="py-1 font-semibold text-yellow-800">{form.name}</td>
                                            <td className="py-1 text-right text-yellow-700">{formatNumber(form.damageDone)}</td>
                                            <td className="py-1 text-right text-yellow-700">{formatNumber(form.damageTaken)}</td>
                                            <td className="py-1 text-right text-yellow-700">{formatBattleTime(form.battleTime)}</td>
                                            <td className="py-1 text-right text-yellow-700">{formatNumber(form.hPGaugeValue)}</td>
                                            <td className="py-1 text-right text-yellow-700">{form.specialMoves + form.ultimates + form.skills}</td>
                                            <td className="py-1 text-right text-yellow-700">{form.kills}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Tables View */}
        {((mode === 'reference' && viewType === 'tables') || 
          (mode === 'manual' && viewType === 'tables' && manualFiles.filter(f => !f.error).length > 1)) && (
          <div className="space-y-6">
            {/* Export Manager */}
            <div className={`rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <ExportManager
                aggregatedData={aggregatedData}
                positionData={positionData}
                metaData={{ topCapsules: prepareMetaData({ topCapsules: Object.values(aggregatedData).flatMap(char => char.equippedCapsules || []) }) }}
                viewType={viewType}
                darkMode={darkMode}
                selectedFile={selectedFile}
              />
            </div>

            {/* Character Statistics Table */}
            {aggregatedData && Object.keys(aggregatedData).length > 0 && (
              <div className={`rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <DataTable
                  data={prepareCharacterData(aggregatedData)}
                  columns={getCharacterTableConfig(darkMode).columns}
                  title="Character Performance Statistics"
                  exportFileName={`character_stats_${new Date().toISOString().split('T')[0]}`}
                  onExport={(exportData, filename) => {
                    // Handle export via ExportManager
                    console.log('Character data export requested:', { exportData, filename });
                  }}
                  darkMode={darkMode}
                  selectable={true}
                  onSelectionChange={(selectedRows) => {
                    console.log('Selected characters:', selectedRows);
                  }}
                />
              </div>
            )}

            {/* Position Analysis Table */}
            {positionData && Object.keys(positionData).length > 0 && (
              <div className={`rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <DataTable
                  data={preparePositionData(positionData)}
                  columns={getPositionTableConfig(darkMode).columns}
                  title="Position-Based Performance Analysis"
                  exportFileName={`position_analysis_${new Date().toISOString().split('T')[0]}`}
                  onExport={(exportData, filename) => {
                    console.log('Position data export requested:', { exportData, filename });
                  }}
                  darkMode={darkMode}
                  selectable={true}
                  onSelectionChange={(selectedRows) => {
                    console.log('Selected position data:', selectedRows);
                  }}
                />
              </div>
            )}

            {/* Meta Analysis Table */}
            {aggregatedData && Object.keys(aggregatedData).length > 0 && (
              <div className={`rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <DataTable
                  data={(() => {
                    // Create meta data from aggregated character data
                    const capsuleUsage = {};
                    Object.values(aggregatedData).forEach(char => {
                      if (char.equippedCapsules) {
                        char.equippedCapsules.forEach(capsule => {
                          if (!capsuleUsage[capsule.id]) {
                            capsuleUsage[capsule.id] = {
                              name: capsule.name,
                              usage: 0,
                              winRate: 0,
                              characterCount: 0,
                              type: capsule.type || 'Capsule'
                            };
                          }
                          capsuleUsage[capsule.id].usage++;
                          capsuleUsage[capsule.id].winRate += char.winRate || 0;
                          capsuleUsage[capsule.id].characterCount++;
                        });
                      }
                    });
                    
                    return Object.values(capsuleUsage)
                      .map(capsule => ({
                        ...capsule,
                        winRate: Math.round(capsule.winRate / capsule.characterCount)
                      }))
                      .sort((a, b) => b.usage - a.usage)
                      .slice(0, 50); // Top 50 capsules
                  })()}
                  columns={getMetaTableConfig(darkMode).columns}
                  title="Capsule Meta Analysis"
                  exportFileName={`meta_analysis_${new Date().toISOString().split('T')[0]}`}
                  onExport={(exportData, filename) => {
                    console.log('Meta data export requested:', { exportData, filename });
                  }}
                  darkMode={darkMode}
                  selectable={true}
                  onSelectionChange={(selectedRows) => {
                    console.log('Selected meta data:', selectedRows);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Team Rankings Display */}
        {((mode === 'reference' && viewType === 'teams') || 
          (mode === 'manual' && viewType === 'teams' && manualFiles.filter(f => !f.error).length > 1)) && 
          teamAggregatedData.length > 0 && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <Users className={`w-8 h-8 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Team Rankings</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Teams ranked by win rate from {mode === 'reference' ? fileNames.length : manualFiles.filter(f => !f.error).length} battle files
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {teamAggregatedData.map((team, i) => {
                const expanded = expandedRows[`team_${i}`] || false;
                
                return (
                  <div key={team.teamName} className={`p-3 rounded-xl border transition-all ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}>
                    <div 
                      className="p-6 cursor-pointer"
                      onClick={() => toggleRow('team', i)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`text-2xl font-bold ${
                            i === 0 ? 'text-yellow-500' : 
                            i === 1 ? 'text-gray-400' : 
                            i === 2 ? 'text-orange-600' :
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            #{i + 1}
                          </div>
                          <div>
                            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {team.teamName}
                            </h3>
                            <div className="flex items-center gap-4 text-sm">
                              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {team.matches} matches
                              </span>
                              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {team.wins}W - {team.losses}L
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              team.winRate >= 75 ? 'text-green-600' :
                              team.winRate >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {team.winRate.toFixed(1)}%
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Win Rate
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {formatNumber(team.avgDamagePerMatch)}
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Avg Damage
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {team.avgHealthRetention.toFixed(1)}%
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Health Retention
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {team.uniqueCharactersUsed}
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Characters Used
                            </div>
                          </div>
                          
                          {expanded ? (
                            <ChevronUp className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          ) : (
                            <ChevronDown className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {expanded && (
                      <div className={`px-6 pb-6 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        {/* Performance Stats */}
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Damage Efficiency
                            </div>
                            <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {team.totalDamageTaken > 0 ? 
                                (team.totalDamageDealt / team.totalDamageTaken).toFixed(2) : 
                                '∞'
                              }
                            </div>
                          </div>
                          
                          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Avg Damage Taken
                            </div>
                            <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {formatNumber(team.avgDamageTakenPerMatch)}
                            </div>
                          </div>
                          
                          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Avg Damage Dealt
                            </div>
                            <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {formatNumber(team.avgDamagePerMatch)}
                            </div>
                          </div>
                          
                          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Match History
                            </div>
                            <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {team.matchHistory.length} games
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Character Performance - Expandable */}
                          <div className={`rounded-lg p-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div 
                              className={`rounded-lg p-4 bg-gray-600 flex items-center justify-between cursor-pointer transition-colors ${
                                darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-100'
                              } rounded p-2 -m-2`}
                              onClick={() => toggleRow('character_performance', i)}
                            >
                              <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                Character Performance
                              </h4>
                              {expandedRows[`character_performance_${i}`] ? (
                                <ChevronUp className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              ) : (
                                <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              )}
                            </div>
                            
                            {expandedRows[`character_performance_${i}`] && (
                              <div className="p-3 rounded-lg border border-gray-600 space-y-3">
                                {Object.entries(team.characterAverages)
                                  .sort((a, b) => b[1].avgDamageDealt - a[1].avgDamageDealt)
                                  .slice(0, 8)
                                  .map(([charName, stats]) => (
                                  <div key={charName} className={`p-3 rounded-lg ${
                                    darkMode ? 'bg-gray-600' : 'bg-white'
                                  } border ${darkMode ? 'border-gray-500' : 'border-gray-200'}`}>
                                    <div className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                      {charName}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                          Avg Damage
                                        </div>
                                        <div className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                          {formatNumber(stats.avgDamageDealt)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                          Avg Taken
                                        </div>
                                        <div className={`font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                          {formatNumber(stats.avgDamageTaken)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                          Efficiency
                                        </div>
                                        <div className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                          {stats.avgDamageEfficiency.toFixed(2)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                          DPS
                                        </div>
                                        <div className={`font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                          {stats.avgDamagePerSecond.toFixed(1)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      Matches Used In: {stats.matchesPlayed} ({stats.usageRate}% usage)
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Head-to-Head Records - Expandable */}
                          <div className={`rounded-lg p-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div 
                              className={`rounded-lg p-4 bg-gray-600 flex items-center justify-between cursor-pointer transition-colors ${
                                darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-100'
                              } rounded p-2 -m-2`}
                              onClick={() => toggleRow('head_to_head', i)}
                            >
                              <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                Head-to-Head Records
                              </h4>
                              {expandedRows[`head_to_head_${i}`] ? (
                                <ChevronUp className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              ) : (
                                <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              )}
                            </div>
                            
                            {expandedRows[`head_to_head_${i}`] && (
                              <div className="p-3 rounded-lg border border-gray-400 space-y-3">
                                {Object.entries(team.opponentRecords).map(([opponent, record]) => {
                                  // Calculate head-to-head stats
                                  const h2hMatches = team.matchHistory.filter(match => match.opponent === opponent);
                                  const h2hTotalDamageDealt = h2hMatches.reduce((sum, match) => sum + match.damageDealt, 0);
                                  const h2hTotalDamageTaken = h2hMatches.reduce((sum, match) => sum + match.damageTaken, 0);
                                  const h2hAvgDamageDealt = h2hMatches.length > 0 ? Math.round(h2hTotalDamageDealt / h2hMatches.length) : 0;
                                  const h2hAvgDamageTaken = h2hMatches.length > 0 ? Math.round(h2hTotalDamageTaken / h2hMatches.length) : 0;
                                  const h2hDamageEfficiency = h2hTotalDamageTaken > 0 ? (h2hTotalDamageDealt / h2hTotalDamageTaken).toFixed(2) : '∞';
                                  
                                  return (
                                    <div key={opponent} className={`p-3 rounded-lg border ${
                                      darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'
                                    }`}>
                                      <div className="flex items-center justify-between mb-3">
                                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                          vs {opponent}
                                        </span>
                                        <span className={`text-sm font-medium ${
                                          record.wins > record.losses ? 'text-green-600' :
                                          record.wins < record.losses ? 'text-red-600' :
                                          'text-yellow-500'
                                        }`}>
                                          {record.wins}W - {record.losses}L
                                        </span>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div>
                                          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Efficiency
                                          </div>
                                          <div className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                            {h2hDamageEfficiency}
                                          </div>
                                        </div>
                                        <div>
                                          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Avg Dealt
                                          </div>
                                          <div className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                            {formatNumber(h2hAvgDamageDealt)}
                                          </div>
                                        </div>
                                        <div>
                                          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Avg Taken
                                          </div>
                                          <div className={`font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                            {formatNumber(h2hAvgDamageTaken)}
                                          </div>
                                        </div>
                                        <div>
                                          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Matches
                                          </div>
                                          <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                            {h2hMatches.length}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Display */}
        {fileContent?.error && (
          <div className={`rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center gap-3 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              <Shield className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold">Error Loading File</h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{fileContent.error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}