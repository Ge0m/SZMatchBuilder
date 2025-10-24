import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Autocomplete from '@mui/material/Autocomplete';
import MUITextField from '@mui/material/TextField';
import './App.css';
import BRDataSelector from './components/BRDataSelector.jsx';
import { formatNumber } from './utils/formatters.js';
import DataTable from './components/DataTable.jsx';
import { prepareCharacterAveragesData, prepareMatchDetailsData, getCharacterAveragesTableConfig, getMatchDetailsTableConfig, getMetaTableConfig } from './components/TableConfigs.jsx';
import { exportToExcel } from './utils/excelExport.js';
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
  ChevronUp,
  Info,
  Search,
  X,
  ArrowUpDown,
  Filter,
  Download
} from 'lucide-react';
// Reference data CSVs (raw imports)
import charactersCSV from '../referencedata/characters.csv?raw';
import capsulesCSV from '../referencedata/capsules.csv?raw';
// Preload reference JSON files shipped with the analyzer (Vite import.meta.glob)
// Each entry may be a module object; code uses module.default || module
const dataFiles = import.meta.glob('../BR_Data/*.json', { eager: true });
// Small stat bar used in the match panels
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
  // For inverse, flip the values for robust stats
  let values = allValues;
  let val = value;
  if (isInverse) {
    const maxValue = Math.max(...allValues);
    values = allValues.map(v => maxValue - v);
    val = maxValue - value;
  }
  const level = getPerformanceLevel(val, values);
  let colorClass, icon;
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
    case 'below-average':
      colorClass = darkMode ? 'bg-red-900/30 text-red-300 border-red-600' : 'bg-red-100 text-red-800 border-red-200';
      icon = <Target className="w-3 h-3" />;
      break;
    default:
      colorClass = darkMode ? 'bg-gray-900/30 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-200';
      icon = <Target className="w-3 h-3" />;
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
  const runBlastCount = count.runBlastCount || {};
  const attackHitCount = count.attackHitCount || {};
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
  
  // Equipment analysis - filter to ONLY capsules (00_0_XXXX pattern)
  const equipItems = play.equipItem || [];
  const equippedCapsules = equipItems
    .map(item => item.key)
    .filter(key => key && key.startsWith('00_0_')) // Only include actual capsules
    .filter(key => capsuleMap[key]) // Only include capsules in our reference data
    .map(key => ({
      id: key,
      name: capsuleMap[key].name,
      capsule: capsuleMap[key]
    }));
  
  const totalCapsuleCost = equippedCapsules.reduce((sum, item) => sum + (item.capsule.cost || 0), 0);
  
  // Categorize capsules by type based on their effect
  const capsuleTypes = {
    damage: equippedCapsules.filter(item => {
      const name = item.capsule.name?.toLowerCase() || '';
      const effect = item.capsule.effect?.toLowerCase() || '';
      return name.includes('attack boost') || 
             name.includes('damage') || 
             effect.includes('damage increase') ||
             effect.includes('attack damage') ||
             name.includes('blast') ||
             name.includes('power');
    }).length,
    defensive: equippedCapsules.filter(item => {
      const name = item.capsule.name?.toLowerCase() || '';
      const effect = item.capsule.effect?.toLowerCase() || '';
      return name.includes('body') || 
             name.includes('guard') || 
             name.includes('defense') ||
             name.includes('training') ||
             effect.includes('flinch') ||
             effect.includes('health');
    }).length,
    utility: equippedCapsules.filter(item => {
      const name = item.capsule.name?.toLowerCase() || '';
      const effect = item.capsule.effect?.toLowerCase() || '';
      return name.includes('ki') || 
             name.includes('speed') ||
             name.includes('movement') ||
             name.includes('dash') ||
             name.includes('sparking') ||
             effect.includes('ki recovery') ||
             effect.includes('transformation');
    }).length
  };
  
  // Parse blast counts for detailed super blast tracking
  let spm1Count = 0;
  let spm2Count = 0;
  let exa1Count = 0;
  let exa2Count = 0;
  
  Object.entries(runBlastCount).forEach(([key, value]) => {
    if (key.includes('SPM1')) spm1Count += value;
    else if (key.includes('SPM2') || key.includes('SPM3')) spm2Count += value;
    else if (key.includes('EXA1')) exa1Count += value;
    else if (key.includes('EXA2')) exa2Count += value;
  });
  
  // Parse attack hit counts for combat performance metrics
  let speedImpactCount = 0;
  let speedImpactWins = 0;
  
  Object.entries(attackHitCount).forEach(([key, value]) => {
    // Speed Impact triggers - these indicate speed impact usage
    if (key.includes('actSPIMPO') || key.includes('actRI')) {
      speedImpactCount += value;
    }
  });
  
  // Speed impact wins are tracked in battleNumCount.speedImpactWinCount
  
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
    // Survival & Health metrics
    sparkingCount: numCount.sparkingCount || 0,
    chargeCount: numCount.chargeCount || 0,
    guardCount: numCount.guardCount || 0,
    shotEnergyBulletCount: numCount.shotEnergyBulletCount || 0,
    zCounterCount: numCount.zCounter || 0,
    superCounterCount: numCount.superCounterCount || 0,
    revengeCounterCount: numCount.revengeCounter || 0,
    // Special Abilities - detailed blast tracking
    spm1Count,
    spm2Count,
    exa1Count,
    exa2Count,
    dragonDashMileage: count.dragonDashMileage || 0,
    // Combat Performance metrics
    maxComboNum: count.maxComboNum || 0,
    maxComboDamage: count.maxComboDamage || 0,
    throwCount: numCount.throwCount || 0,
    lightningAttackCount: numCount.lightningAttack || 0,
    vanishingAttackCount: numCount.vanishingAttack || 0,
    dragonHomingCount: numCount.dragonHoming || 0,
    speedImpactCount: numCount.speedImpactCount || speedImpactCount,
    speedImpactWins: numCount.speedImpactWinCount || 0,
    sparkingComboCount: numCount.sparkingCount > 0 ? count.maxComboNum || 0 : 0,
    // Position tracking
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
    
    // Process each team separately to determine team size
    const alliesKeys = Object.keys(characterRecord).filter(k => k.includes('AlliesTeamMember'));
    const enemyKeys = Object.keys(characterRecord).filter(k => k.includes('EnemyTeamMember'));
    
    // Process allies team
    const alliesTeamSize = alliesKeys.length;
    alliesKeys.forEach(key => {
      const char = characterRecord[key];
      if (!char) return;
      
      // Extract slot number from key (e.g., "AlliesTeamMember1" -> 1)
      const slotMatch = key.match(/Member(\d+)/);
      const slotNumber = slotMatch ? parseInt(slotMatch[1]) : null;
      if (!slotNumber) return;
      
      // Determine position: 1 = lead (first), 2 = middle (everyone else), 3 = anchor (last)
      let position;
      if (slotNumber === 1) {
        position = 1; // Lead
      } else if (slotNumber === alliesTeamSize) {
        position = 3; // Anchor
      } else {
        position = 2; // Middle
      }
      
      const stats = extractStats(char, charMap, capsuleMap, position);
      if (!stats.name || stats.name === '-') return;
      
      const characterName = stats.name;
      
      positionStats[position].totalMatches++;
      
      if (!positionStats[position].characters[characterName]) {
        positionStats[position].characters[characterName] = {
          name: characterName,
          matchCount: 0,
          // activeMatchCount counts matches where battleTime > 0
          activeMatchCount: 0,
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
      // Always increment visible match count
      charData.matchCount++;
      // Only count as an "active" match if battleTime > 0
      if (stats.battleTime && stats.battleTime > 0) {
        charData.activeMatchCount += 1;
        charData.totalBattleTime += stats.battleTime;
      }
      charData.totalDamage += stats.damageDone;
      charData.totalTaken += stats.damageTaken;
      charData.totalHealth += stats.hPGaugeValue;
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
    
    // Process enemy team
    const enemyTeamSize = enemyKeys.length;
    enemyKeys.forEach(key => {
      const char = characterRecord[key];
      if (!char) return;
      
      // Extract slot number from key (e.g., "EnemyTeamMember1" -> 1)
      const slotMatch = key.match(/Member(\d+)/);
      const slotNumber = slotMatch ? parseInt(slotMatch[1]) : null;
      if (!slotNumber) return;
      
      // Determine position: 1 = lead (first), 2 = middle (everyone else), 3 = anchor (last)
      let position;
      if (slotNumber === 1) {
        position = 1; // Lead
      } else if (slotNumber === enemyTeamSize) {
        position = 3; // Anchor
      } else {
        position = 2; // Middle
      }
      
      if (!positionStats[position]) return;
      
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
      // Only include battleTime in totals if it's > 0. This keeps averages consistent when excluding zero-duration matches.
      if (stats.battleTime && stats.battleTime > 0) {
        charData.totalBattleTime += stats.battleTime;
      }
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
    if (fileContent.TeamBattleResults) {
      // Check for battleResult (lowercase r)
      if (fileContent.TeamBattleResults.battleResult) {
        characterRecord = fileContent.TeamBattleResults.battleResult.characterRecord;
      }
      // Check for BattleResults (capital R) - Cinema files format
      else if (fileContent.TeamBattleResults.BattleResults) {
        characterRecord = fileContent.TeamBattleResults.BattleResults.characterRecord;
      }
      // Check if data is directly in TeamBattleResults (new wrapper format)
      else if (fileContent.TeamBattleResults.characterRecord) {
        characterRecord = fileContent.TeamBattleResults.characterRecord;
      }
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
      .map(char => {
        // Use activeMatchCount if available (exclude zero battleTime matches), fallback to matchCount
        const denom = (char.activeMatchCount && char.activeMatchCount > 0) ? char.activeMatchCount : char.matchCount || 1;
        return ({
          ...char,
          avgDamage: char.totalDamage / denom,
          avgTaken: char.totalTaken / denom,
          avgHealth: char.totalHealth / denom,
          avgBattleTime: char.totalBattleTime / denom,
          avgSpecialMoves: char.totalSpecialMoves / denom,
          avgUltimates: char.totalUltimates / denom,
          avgSkills: char.totalSkills / denom,
          avgSparking: char.totalSparking / denom,
          avgCharges: char.totalCharges / denom,
          avgGuards: char.totalGuards / denom,
          avgEnergyBlasts: char.totalEnergyBlasts / denom,
          avgComboNum: char.totalComboNum / denom,
          avgComboDamage: char.totalComboDamage / denom,
          damageEfficiency: char.totalTaken > 0 ? (char.totalDamage / char.totalTaken) : char.totalDamage
        });
      })
      .sort((a, b) => b.avgDamage - a.avgDamage);
  });
  
  return positionStats;
}

function getAggregatedCharacterData(files, charMap, capsuleMap = {}, aiStrategiesMap = {}) {
  const characterStats = {};
  
  // Helper function to process a characterRecord (extracted to avoid duplication)
  function processCharacterRecord(characterRecord, characterIdRecord, teams = null, fileName = '', battleWinLose = null) {
    Object.keys(characterRecord).forEach(key => {
      const char = characterRecord[key];
      const stats = extractStats(char, charMap, capsuleMap, null); // No position for aggregated data
      if (!stats.name || stats.name === '-') return;
      
      // Determine team association
      let teamName = null;
      let opponentTeam = null;
      let isTeam1 = false;
      if (teams && Array.isArray(teams) && teams.length >= 2) {
        if (key.includes('AlliesTeamMember') || key.includes('１Ｐ')) {
          teamName = teams[0];
          opponentTeam = teams[1];
          isTeam1 = true;
        } else if (key.includes('EnemyTeamMember') || key.includes('２Ｐ')) {
          teamName = teams[1];
          opponentTeam = teams[0];
          isTeam1 = false;
        }
      }
      
      // Extract AI strategy from equipped items (look for AI type capsules)
      let aiStrategy = null;
      const equipItems = char.battlePlayCharacter?.equipItem || [];
      for (const item of equipItems) {
        const strategy = aiStrategiesMap[item.key];
        if (strategy) {
          aiStrategy = strategy.name;
          break; // Found the AI strategy, stop looking
        }
      }
      
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
          // Survival & Health metrics
          survivalCount: 0,
          totalSparking: 0,
          totalCharges: 0,
          totalGuards: 0,
          totalEnergyBlasts: 0,
          totalZCounters: 0,
          totalSuperCounters: 0,
          totalRevengeCounters: 0,
          // Special Abilities - detailed blast tracking
          totalSPM1: 0,
          totalSPM2: 0,
          totalEXA1: 0,
          totalEXA2: 0,
          totalDragonDashMileage: 0,
          // Combat Performance metrics
          maxComboNumTotal: 0,
          maxComboDamageTotal: 0,
          totalThrows: 0,
          totalLightningAttacks: 0,
          totalVanishingAttacks: 0,
          totalDragonHoming: 0,
          totalSpeedImpacts: 0,
          totalSpeedImpactWins: 0,
          totalSparkingCombo: 0,
          matchCount: 0,
          // activeMatchCount excludes matches with zero battleTime
          activeMatchCount: 0,
          // Build & Equipment tracking
          totalCapsuleCost: 0,
          totalDamageCaps: 0,
          totalDefensiveCaps: 0,
          totalUtilityCaps: 0,
          buildArchetypes: {}, // Track build archetypes with counts
          capsuleUsage: {}, // Track individual capsules used
          allFormsUsed: new Set(), // Track all forms used across matches
          formStats: {}, // Track per-form aggregated stats
          matches: [], // Track individual match data for meta analysis
          teamsUsed: {}, // Track which teams this character played on with counts
          aiStrategiesUsed: {} // Track AI strategies used with counts
        };
      }
      
      const charData = characterStats[aggregationKey];
      
      // Track team and AI strategy with frequency
      if (teamName) {
        charData.teamsUsed[teamName] = (charData.teamsUsed[teamName] || 0) + 1;
      }
      if (aiStrategy) {
        charData.aiStrategiesUsed[aiStrategy] = (charData.aiStrategiesUsed[aiStrategy] || 0) + 1;
      }
      
      charData.totalDamage += stats.damageDone;
      charData.totalTaken += stats.damageTaken;
      charData.totalHealth += stats.hPGaugeValue;
      charData.totalBattleTime += stats.battleTime;
      charData.totalHPGaugeValueMax += stats.hPGaugeValueMax;
      charData.totalSpecial += stats.specialMovesUsed;
      charData.totalUltimates += stats.ultimatesUsed;
      charData.totalSkills += stats.skillsUsed;
      charData.totalKills += stats.kills;
      // Survival & Health metrics
      if (stats.hPGaugeValue > 0) {
        charData.survivalCount += 1;
      }
      charData.totalSparking += stats.sparkingCount;
      charData.totalCharges += stats.chargeCount;
      charData.totalGuards += stats.guardCount;
      charData.totalEnergyBlasts += stats.shotEnergyBulletCount;
      charData.totalZCounters += stats.zCounterCount;
      charData.totalSuperCounters += stats.superCounterCount;
      charData.totalRevengeCounters += stats.revengeCounterCount;
      // Special Abilities - detailed blast tracking
      charData.totalSPM1 += stats.spm1Count;
      charData.totalSPM2 += stats.spm2Count;
      charData.totalEXA1 += stats.exa1Count;
      charData.totalEXA2 += stats.exa2Count;
      charData.totalDragonDashMileage += stats.dragonDashMileage;
      // Combat Performance metrics
      charData.maxComboNumTotal += stats.maxComboNum;
      charData.maxComboDamageTotal += stats.maxComboDamage;
      charData.totalThrows += stats.throwCount;
      charData.totalLightningAttacks += stats.lightningAttackCount;
      charData.totalVanishingAttacks += stats.vanishingAttackCount;
      charData.totalDragonHoming += stats.dragonHomingCount;
      charData.totalSpeedImpacts += stats.speedImpactCount;
      charData.totalSpeedImpactWins += stats.speedImpactWins;
      charData.totalSparkingCombo += stats.sparkingComboCount;
      charData.matchCount += 1;
      if (stats.battleTime && stats.battleTime > 0) {
        charData.activeMatchCount += 1;
      }
      
      // Build & Equipment tracking
      charData.totalCapsuleCost += stats.totalCapsuleCost || 0;
      charData.totalDamageCaps += stats.capsuleTypes?.damage || 0;
      charData.totalDefensiveCaps += stats.capsuleTypes?.defensive || 0;
      charData.totalUtilityCaps += stats.capsuleTypes?.utility || 0;
      
      // Track build archetype usage
      if (stats.buildArchetype) {
        charData.buildArchetypes[stats.buildArchetype] = (charData.buildArchetypes[stats.buildArchetype] || 0) + 1;
      }
      
      // Track individual capsules used
      if (stats.equippedCapsules && Array.isArray(stats.equippedCapsules)) {
        stats.equippedCapsules.forEach(capsule => {
          if (capsule.id) {
            if (!charData.capsuleUsage[capsule.id]) {
              charData.capsuleUsage[capsule.id] = {
                id: capsule.id,
                name: capsule.name,
                count: 0
              };
            }
            charData.capsuleUsage[capsule.id].count += 1;
          }
        });
      }
      
      // Extract form change history
      let formChangeHistory = '—';
      let formChangeCount = 0;
      if (Array.isArray(char.formChangeHistory) && char.formChangeHistory.length > 0) {
        formChangeHistory = char.formChangeHistory.map(form => charMap[form.key] || form.key).join(' → ');
        formChangeCount = char.formChangeHistory.length; // Count number of transformations
      }
      
      // Determine win/loss status based on TEAM victory, not character survival
      // battleWinLose is from team 1's perspective: 'Win' means team 1 won, 'Lose' means team 2 won
      let won = false;
      if (battleWinLose) {
        if (isTeam1) {
          // Team 1 character: won if battleWinLose === 'Win'
          won = battleWinLose === 'Win';
        } else {
          // Team 2 character: won if battleWinLose === 'Lose' (team 1 lost)
          won = battleWinLose === 'Lose';
        }
      } else {
        // Fallback to character survival if battleWinLose not available
        won = stats.hPGaugeValue > 0;
      }
      
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
        equippedCapsules: stats.equippedCapsules,
        team: teamName,
        opponentTeam: opponentTeam,
        aiStrategy: aiStrategy,
        kills: stats.kills,
        specialMovesUsed: stats.specialMovesUsed,
        ultimatesUsed: stats.ultimatesUsed,
        skillsUsed: stats.skillsUsed,
        sparkingCount: stats.sparkingCount,
        chargeCount: stats.chargeCount,
        guardCount: stats.guardCount,
        shotEnergyBulletCount: stats.shotEnergyBulletCount,
        zCounterCount: stats.zCounterCount,
        superCounterCount: stats.superCounterCount,
        revengeCounterCount: stats.revengeCounterCount,
        spm1Count: stats.spm1Count,
        spm2Count: stats.spm2Count,
        exa1Count: stats.exa1Count,
        exa2Count: stats.exa2Count,
        dragonDashMileage: stats.dragonDashMileage,
        maxComboNum: stats.maxComboNum,
        maxComboDamage: stats.maxComboDamage,
        throwCount: stats.throwCount,
        lightningAttackCount: stats.lightningAttackCount,
        vanishingAttackCount: stats.vanishingAttackCount,
        dragonHomingCount: stats.dragonHomingCount,
        speedImpactCount: stats.speedImpactCount,
        speedImpactWins: stats.speedImpactWins,
        sparkingComboCount: stats.sparkingComboCount,
        formChangeHistory: formChangeHistory,
        formChangeCount: formChangeCount,
        won: won,
        fileName: fileName
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
    
    const fileName = file.name || file.fileName || '';
    let characterRecord, characterIdRecord, teams, battleWinLose;
    
    // Handle TeamBattleResults format (current BR_Data structure)
    if (file.content.TeamBattleResults) {
      teams = file.content.TeamBattleResults.teams;
      // Check for battleResult (lowercase r)
      if (file.content.TeamBattleResults.battleResult) {
        characterRecord = file.content.TeamBattleResults.battleResult.characterRecord;
        characterIdRecord = file.content.TeamBattleResults.battleResult.characterIdRecord;
        battleWinLose = file.content.TeamBattleResults.battleResult.battleWinLose;
      }
      // Check for BattleResults (capital R) - Cinema files format
      else if (file.content.TeamBattleResults.BattleResults) {
        characterRecord = file.content.TeamBattleResults.BattleResults.characterRecord;
        characterIdRecord = file.content.TeamBattleResults.BattleResults.characterIdRecord;
        battleWinLose = file.content.TeamBattleResults.BattleResults.battleWinLose;
      }
      // Check if data is directly in TeamBattleResults (new wrapper format)
      else if (file.content.TeamBattleResults.characterRecord) {
        characterRecord = file.content.TeamBattleResults.characterRecord;
        characterIdRecord = file.content.TeamBattleResults.characterIdRecord;
        battleWinLose = file.content.TeamBattleResults.battleWinLose;
      }
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
          // Extract battleWinLose for team format
          let teamBattleWinLose;
          if (team.BattleResults) {
            teamBattleWinLose = team.BattleResults.battleWinLose;
          }
          processCharacterRecord(teamCharRecord, teamCharIdRecord, file.content.teams, fileName, teamBattleWinLose);
        }
      });
      return; // Already processed all teams
    }
    // Handle standard format with BattleResults at root
    else if (file.content.BattleResults) {
      characterRecord = file.content.BattleResults.characterRecord;
      characterIdRecord = file.content.BattleResults.characterIdRecord;
      battleWinLose = file.content.BattleResults.battleWinLose;
      teams = file.content.teams;
    } 
    // Handle legacy format with direct properties
    else {
      characterRecord = file.content.characterRecord;
      characterIdRecord = file.content.characterIdRecord;
      battleWinLose = file.content.battleWinLose;
      teams = file.content.teams;
    }
    
    if (!characterRecord) return;
    
    processCharacterRecord(characterRecord, characterIdRecord, teams, fileName, battleWinLose);
  });
  
  // Calculate averages and format form history
  return Object.values(characterStats).map(char => {
    const allForms = Array.from(char.allFormsUsed);
    const formHistory = allForms.length > 1 ? 
      allForms.map(f => charMap[f] || f).join(', ') : '';
    
    // Convert objects to arrays and find most common team and AI strategy
    const teamsArray = Object.keys(char.teamsUsed);
    const aiStrategiesArray = Object.keys(char.aiStrategiesUsed);
    
    // Find most commonly used team (highest count)
    const primaryTeam = teamsArray.length > 0 
      ? teamsArray.reduce((a, b) => char.teamsUsed[a] > char.teamsUsed[b] ? a : b)
      : null;
    
    // Find most commonly used AI strategy (highest count)
    const primaryAIStrategy = aiStrategiesArray.length > 0
      ? aiStrategiesArray.reduce((a, b) => char.aiStrategiesUsed[a] > char.aiStrategiesUsed[b] ? a : b)
      : null;
    
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
      teamsUsed: teamsArray,
      aiStrategiesUsed: aiStrategiesArray,
      primaryTeam,
      primaryAIStrategy,
      // Use activeMatchCount (non-zero battleTime) for all averages when available
      _activeMatches: char.activeMatchCount || 0,
      avgDamage: Math.round(char.totalDamage / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)),
      avgTaken: Math.round(char.totalTaken / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)),
      avgHealth: Math.round(char.totalHealth / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)),
      avgBattleTime: Math.round((char.totalBattleTime / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
      avgHPGaugeValueMax: Math.round(char.totalHPGaugeValueMax / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)),
  avgSpecial: Math.round((char.totalSpecial / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
      avgSkills: Math.round((char.totalSkills / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
      avgKills: Math.round((char.totalKills / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
      // Survival & Health averages
      survivalRate: Math.round((char.survivalCount / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 1000) / 10, // % of matches survived
      avgSparking: Math.round((char.totalSparking / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
      avgCharges: Math.round((char.totalCharges / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
      avgGuards: Math.round((char.totalGuards / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
      avgEnergyBlasts: Math.round((char.totalEnergyBlasts / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
      avgZCounters: Math.round((char.totalZCounters / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
      avgSuperCounters: Math.round((char.totalSuperCounters / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
      avgRevengeCounters: Math.round((char.totalRevengeCounters / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
      // Special Abilities - detailed blast averages
    avgSPM1: Math.round((char.totalSPM1 / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgSPM2: Math.round((char.totalSPM2 / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgEXA1: Math.round((char.totalEXA1 / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgEXA2: Math.round((char.totalEXA2 / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgUltimates: Math.round((char.totalUltimates / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgDragonDashMileage: Math.round((char.totalDragonDashMileage / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgMaxComboDamage: Math.round(char.maxComboDamageTotal / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)),
  avgThrows: Math.round((char.totalThrows / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgLightningAttacks: Math.round((char.totalLightningAttacks / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgVanishingAttacks: Math.round((char.totalVanishingAttacks / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgDragonHoming: Math.round((char.totalDragonHoming / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgSpeedImpacts: Math.round((char.totalSpeedImpacts / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgSpeedImpactWins: Math.round((char.totalSpeedImpactWins / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgSparkingCombo: Math.round((char.totalSparkingCombo / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  // Build & Equipment averages
  avgCapsuleCost: Math.round(char.totalCapsuleCost / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)),
  avgDamageCaps: Math.round((char.totalDamageCaps / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgDefensiveCaps: Math.round((char.totalDefensiveCaps / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
  avgUtilityCaps: Math.round((char.totalUtilityCaps / (char.activeMatchCount > 0 ? char.activeMatchCount : char.matchCount)) * 10) / 10,
      // Most used build archetype
      primaryBuildArchetype: Object.keys(char.buildArchetypes).length > 0
        ? Object.keys(char.buildArchetypes).reduce((a, b) => 
            char.buildArchetypes[a] > char.buildArchetypes[b] ? a : b)
        : 'No Build',
      // Most used capsules (top 7)
      topCapsules: Object.values(char.capsuleUsage)
        .sort((a, b) => b.count - a.count)
        .slice(0, 7)
        .map(c => ({ id: c.id, name: c.name, usage: c.count }))
    };
  }).map(char => {
    // Calculate combat performance score
    const avgDamage = char.avgDamage;
    const avgTaken = char.avgTaken;
    const avgBattleTime = char.avgBattleTime;
    const damageEfficiency = avgTaken > 0 ? avgDamage / avgTaken : avgDamage;
    const damagePerSecond = avgBattleTime > 0 ? avgDamage / avgBattleTime : 0;
    const healthRetention = char.avgHPGaugeValueMax > 0 ? char.avgHealth / char.avgHPGaugeValueMax : 0;
    
    // Base performance score (normalized metrics)
    const baseScore = (
      (avgDamage / 100000) * 35 +        // Damage dealt weight: 35%
      (damageEfficiency) * 25 +          // Damage efficiency weight: 25%
      (damagePerSecond / 1000) * 25 +    // Damage per second weight: 25%
      (healthRetention) * 15             // Health retention weight: 15%
    );
    
    // Experience multiplier based on matches played (1.0 to 1.25x, maxed at 12 matches)
    // Characters with more matches get slightly higher weight
  // Use active matches (non-zero battleTime) for experience weighting when available
  const experienceMatches = (char.activeMatchCount && char.activeMatchCount > 0) ? char.activeMatchCount : char.matchCount;
  const experienceMultiplier = Math.min(1.25, 1.0 + (experienceMatches - 1) * (0.25 / 11));
    
    // Final combat performance score
    const combatPerformanceScore = baseScore * experienceMultiplier;
    
    // Calculate win rate from matches array
  // For win rate, prefer counting only active matches (non-zero battleTime)
  const totalMatches = char.matches ? char.matches.length : char.matchCount;
  const activeMatches = char.matches ? char.matches.filter(m => m.battleTime && m.battleTime > 0) : [];
  const winsActive = activeMatches.length > 0 ? activeMatches.filter(m => m.won).length : (char.matches ? char.matches.filter(m => m.won).length : 0);
  const winRate = activeMatches.length > 0 ? Math.round((winsActive / activeMatches.length) * 1000) / 10 : (totalMatches > 0 ? Math.round(((char.matches ? char.matches.filter(m => m.won).length : 0) / totalMatches) * 1000) / 10 : 0);
    
    // Calculate speed impact win rate (wins / impacts * 100)
    const speedImpactWinRate = char.totalSpeedImpacts > 0 
      ? Math.round((char.totalSpeedImpactWins / char.totalSpeedImpacts) * 1000) / 10 
      : 0;
    
    return {
      ...char,
      dps: Math.round(damagePerSecond * 10) / 10, // Add DPS field
      efficiency: Math.round(damageEfficiency * 100) / 100, // Add efficiency field
      hpRetention: Math.round(healthRetention * 1000) / 10, // Add HP retention % field
      combatPerformanceScore: Math.round(combatPerformanceScore * 100) / 100,
      winRate: winRate, // Add win rate % field
      speedImpactWinRate: speedImpactWinRate // Add speed impact win rate % field
    };
  }).sort((a, b) => {
    // Primary sort: Combat performance score (descending)
    if (Math.abs(b.combatPerformanceScore - a.combatPerformanceScore) > 0.1) {
      return b.combatPerformanceScore - a.combatPerformanceScore;
    }
    // Secondary sort: Average damage (descending) for very close scores
    if (Math.abs(b.avgDamage - a.avgDamage) > 1000) {
      return b.avgDamage - a.avgDamage;
    }
    // Tertiary sort: Match count (descending) for nearly identical performance
    return b.matchCount - a.matchCount;
  });
}

function getTeamAggregatedData(files, charMap, capsuleMap = {}) {
  const teamStats = {};
  
  files.forEach(file => {
    if (file.error) return;
    
    let teams, battleWinLose, characterRecord;
    
    // Handle TeamBattleResults format (current BR_Data structure)
    if (file.content.TeamBattleResults) {
      teams = file.content.TeamBattleResults.teams;
      // Check for battleResult (lowercase r)
      if (file.content.TeamBattleResults.battleResult) {
        battleWinLose = file.content.TeamBattleResults.battleResult.battleWinLose;
        characterRecord = file.content.TeamBattleResults.battleResult.characterRecord;
      }
      // Check for BattleResults (capital R) - Cinema files format
      else if (file.content.TeamBattleResults.BattleResults) {
        battleWinLose = file.content.TeamBattleResults.BattleResults.battleWinLose;
        characterRecord = file.content.TeamBattleResults.BattleResults.characterRecord;
      }
      // Check if data is directly in TeamBattleResults (new wrapper format)
      else if (file.content.TeamBattleResults.battleWinLose && file.content.TeamBattleResults.characterRecord) {
        battleWinLose = file.content.TeamBattleResults.battleWinLose;
        characterRecord = file.content.TeamBattleResults.characterRecord;
      }
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
    
    // Check if team names are valid (not empty, null, undefined, or just whitespace)
    const isTeam1Valid = team1Name && typeof team1Name === 'string' && team1Name.trim() !== '';
    const isTeam2Valid = team2Name && typeof team2Name === 'string' && team2Name.trim() !== '';
    
    // Skip entirely if both teams are invalid
    if (!isTeam1Valid && !isTeam2Valid) {
      return;
    }
    
    // Determine which teams to process (only valid ones)
    const teamsToProcess = [];
    if (isTeam1Valid) teamsToProcess.push({ name: team1Name, isTeam1: true });
    if (isTeam2Valid) teamsToProcess.push({ name: team2Name, isTeam1: false });
    
    // Initialize team stats if they don't exist
    teamsToProcess.forEach(({ name: teamName }) => {
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
    
    // Update win/loss records only for valid teams
    if (isTeam1Valid) {
      teamStats[team1Name].matches++;
      if (team1Won) teamStats[team1Name].wins++;
      else if (team2Won) teamStats[team1Name].losses++;
    }
    
    if (isTeam2Valid) {
      teamStats[team2Name].matches++;
      if (team2Won) teamStats[team2Name].wins++;
      else if (team1Won) teamStats[team2Name].losses++;
    }
    
    // Initialize opponent records only if both teams are valid
    if (isTeam1Valid && isTeam2Valid) {
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
    }
    
    // Process character data for both teams
    const teams_data = getTeams(characterRecord);
    const p1TeamStats = getTeamStats(teams_data.p1, charMap, capsuleMap);
    const p2TeamStats = getTeamStats(teams_data.p2, charMap, capsuleMap);
    
    // Aggregate team 1 stats only if valid
    if (isTeam1Valid) {
      teamStats[team1Name].totalDamageDealt += p1TeamStats.totalDamage;
      teamStats[team1Name].totalDamageTaken += p1TeamStats.totalTaken;
      teamStats[team1Name].totalHealthRemaining += p1TeamStats.totalHealth;
      teamStats[team1Name].totalHealthMax += p1TeamStats.totalHPGaugeValueMax;
    }
    
    // Aggregate team 2 stats only if valid
    if (isTeam2Valid) {
      teamStats[team2Name].totalDamageDealt += p2TeamStats.totalDamage;
      teamStats[team2Name].totalDamageTaken += p2TeamStats.totalTaken;
      teamStats[team2Name].totalHealthRemaining += p2TeamStats.totalHealth;
      teamStats[team2Name].totalHealthMax += p2TeamStats.totalHPGaugeValueMax;
    }
    
    // Track character usage for team 1 only if valid
    if (isTeam1Valid) {
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
    }
    
    // Track character usage for team 2 only if valid
    if (isTeam2Valid) {
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
    }
    
    // Add match history only for valid teams
    if (isTeam1Valid) {
      teamStats[team1Name].matchHistory.push({
        opponent: isTeam2Valid ? team2Name : 'Unknown',
        result: team1Won ? 'Win' : 'Loss',
        damageDealt: p1TeamStats.totalDamage,
        damageTaken: p1TeamStats.totalTaken,
        healthRemaining: p1TeamStats.totalHealth,
        healthMax: p1TeamStats.totalHPGaugeValueMax,
        fileName: file.name
      });
    }
    
    if (isTeam2Valid) {
      teamStats[team2Name].matchHistory.push({
        opponent: isTeam1Valid ? team1Name : 'Unknown',
        result: team2Won ? 'Win' : 'Loss',
        damageDealt: p2TeamStats.totalDamage,
        damageTaken: p2TeamStats.totalTaken,
        healthRemaining: p2TeamStats.totalHealth,
        healthMax: p2TeamStats.totalHPGaugeValueMax,
        fileName: file.name
      });
    }
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
        const totalHealthRemaining = matches.reduce((sum, match) => sum + match.healthRemaining, 0);
        const totalHealthMax = matches.reduce((sum, match) => sum + match.healthMax, 0);
        const matchCount = matches.length;
        const activeMatchCount = matches.filter(m => m.battleDuration && m.battleDuration > 0).length;
        const denom = activeMatchCount > 0 ? activeMatchCount : matchCount;
        
        const avgDamageDealt = Math.round(totalDamageDealt / Math.max(denom, 1));
        const avgDamageTaken = Math.round(totalDamageTaken / Math.max(denom, 1));
        const avgBattleDuration = totalBattleDuration / Math.max(denom, 1);
        const avgHealthRemaining = totalHealthRemaining / Math.max(denom, 1);
        const avgHealthMax = totalHealthMax / Math.max(denom, 1);
        
        const damageEfficiency = totalDamageTaken > 0 ? 
          Math.round((totalDamageDealt / totalDamageTaken) * 100) / 100 : 
          (totalDamageDealt > 0 ? 999 : 0);
        const damagePerSecond = totalBattleDuration > 0 ? 
          Math.round((totalDamageDealt / totalBattleDuration) * 100) / 100 : 0;
        const healthRetention = avgHealthMax > 0 ? avgHealthRemaining / avgHealthMax : 0;
        
        // Calculate performance score using same formula as character aggregation
        const baseScore = (
          (avgDamageDealt / 100000) * 35 +        // Damage dealt weight: 35%
          (damageEfficiency) * 25 +                // Damage efficiency weight: 25%
          (damagePerSecond / 1000) * 25 +          // Damage per second weight: 25%
          (healthRetention) * 15                   // Health retention weight: 15%
        );
        
        // Experience multiplier based on matches played (prefer active matches)
        const experienceMultiplier = Math.min(1.25, 1.0 + ((activeMatchCount > 0 ? activeMatchCount : matchCount) - 1) * (0.25 / 11));
        const performanceScore = Math.round((baseScore * experienceMultiplier) * 100) / 100;
        
        team.characterAverages[charName] = {
          avgDamageDealt,
          avgDamageTaken,
          avgDamageEfficiency: damageEfficiency,
          avgDamagePerSecond: damagePerSecond,
          avgHealthRetention: healthRetention,
          performanceScore,
          matchesPlayed: matchCount,
          activeMatchesPlayed: activeMatchCount,
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
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  // Separate state for the header match-analysis selector so we don't override global fileContent
  const [analysisSelectedFilePath, setAnalysisSelectedFilePath] = useState(null);
  const [analysisFileContent, setAnalysisFileContent] = useState(null);
  const [viewType, setViewType] = useState('single');
  const [manualFiles, setManualFiles] = useState([]);
  const [expandedRows, setExpandedRows] = useState({}); // Expanded state for character rows
  const [sectionCollapsed, setSectionCollapsed] = useState({
    aggregated: false,
    position: false
  }); // Collapsed state for major sections
  const [uploadedFilesCollapsed, setUploadedFilesCollapsed] = useState(false); // Collapsed state for uploaded files list
  const [darkMode, setDarkMode] = useState(true); // Dark mode state - default to true
  
  // Search and filter state for Aggregated Character Performance
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [characterSearchInput, setCharacterSearchInput] = useState('');
  const [performanceFilters, setPerformanceFilters] = useState(['excellent', 'good', 'average', 'below', 'poor']);
  const [minMatches, setMinMatches] = useState(1);
  const [maxMatches, setMaxMatches] = useState(999);
  const [sortBy, setSortBy] = useState('combatScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [teamSearchInput, setTeamSearchInput] = useState('');
  const [selectedAIStrategies, setSelectedAIStrategies] = useState([]);
  const [aiStrategySearchInput, setAIStrategySearchInput] = useState('');

  // Combobox state for searchable file selection
  // Remove comboboxInput usage of selectedFile (legacy)
  const [comboboxInput, setComboboxInput] = useState('');
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxHighlightedIndex, setComboboxHighlightedIndex] = useState(-1);
  const [headerFileInput, setHeaderFileInput] = useState('');
  const headerInputRef = useRef(null);
  const headerDropdownRef = useRef(null);
  const [headerHighlightedIndex, setHeaderHighlightedIndex] = useState(-1);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [headerDropdownPos, setHeaderDropdownPos] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(e.target) && headerInputRef.current && !headerInputRef.current.contains(e.target)) {
        setHeaderDropdownOpen(false);
        setHeaderHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Update dropdown position to float above layout
  const updateHeaderDropdownPos = () => {
    const el = headerInputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const newPos = { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width };
    setHeaderDropdownPos(prev => {
      if (!prev) return newPos;
      if (prev.top === newPos.top && prev.left === newPos.left && prev.width === newPos.width) return prev;
      return newPos;
    });
  };

  useEffect(() => {
    if (!headerDropdownOpen) return;
    updateHeaderDropdownPos();
    const onMove = () => updateHeaderDropdownPos();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [headerDropdownOpen, headerFileInput]);

  // Keyboard navigation for header combobox
  const handleHeaderKeyDown = (e, options) => {
    if (!options || options.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHeaderDropdownOpen(true);
      setHeaderHighlightedIndex(prev => Math.min(prev + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHeaderHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = headerHighlightedIndex >= 0 ? headerHighlightedIndex : 0;
      const sel = options[idx];
      if (sel) {
        handleHeaderFileSelect(sel.name || sel);
        setHeaderFileInput((sel.name || sel).replace(/\.json$/i, ''));
        setHeaderDropdownOpen(false);
        setHeaderHighlightedIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setHeaderDropdownOpen(false);
      setHeaderHighlightedIndex(-1);
    }
  };

  const charMap = useMemo(() => parseCharacterCSV(charactersCSV), []);
  const { capsules: capsuleMap, aiStrategies } = useMemo(() => parseCapsules(capsulesCSV), []);


  // Aggregated data for reference mode (single file only)
  const aggregatedData = useMemo(() => {
    if (mode === 'reference' && (viewType === 'aggregated' || viewType === 'meta' || viewType === 'tables') && fileContent) {
      // If fileContent is an array, use as is; if single file, wrap in array
      const filesArr = Array.isArray(fileContent)
        ? fileContent
        : fileContent.error ? [] : [{ name: selectedFilePath ? selectedFilePath.join(' / ') : 'Selected File', content: fileContent }];
      return getAggregatedCharacterData(filesArr, charMap, capsuleMap, aiStrategies);
    } else if (mode === 'manual' && (viewType === 'aggregated' || viewType === 'meta' || viewType === 'tables') && manualFiles.length > 0) {
      return getAggregatedCharacterData(manualFiles, charMap, capsuleMap, aiStrategies);
    }
    return [];
  }, [mode, viewType, charMap, capsuleMap, aiStrategies, manualFiles, fileContent, selectedFilePath]);

  // Position-based data for advanced analysis (single file only)
  const positionData = useMemo(() => {
    if (mode === 'reference' && (viewType === 'aggregated' || viewType === 'meta' || viewType === 'tables') && fileContent) {
      const filesArr = Array.isArray(fileContent)
        ? fileContent
        : fileContent.error ? [] : [{ name: selectedFilePath ? selectedFilePath.join(' / ') : 'Selected File', content: fileContent }];
      return getPositionBasedData(filesArr, charMap, capsuleMap);
    } else if (mode === 'manual' && (viewType === 'aggregated' || viewType === 'meta' || viewType === 'tables') && manualFiles.length > 0) {
      return getPositionBasedData(manualFiles, charMap, capsuleMap);
    }
    return {};
  }, [mode, viewType, charMap, capsuleMap, manualFiles, fileContent, selectedFilePath]);

  // Team aggregated data for team rankings
  const teamAggregatedData = useMemo(() => {
    if (mode === 'reference' && (viewType === 'aggregated' || viewType === 'meta' || viewType === 'tables' || viewType === 'teams') && fileContent) {
      const filesArr = Array.isArray(fileContent)
        ? fileContent
        : fileContent.error ? [] : [{ name: selectedFilePath ? selectedFilePath.join(' / ') : 'Selected File', content: fileContent }];
      return getTeamAggregatedData(filesArr, charMap, capsuleMap);
    } else if (mode === 'manual' && (viewType === 'aggregated' || viewType === 'meta' || viewType === 'tables' || viewType === 'teams') && manualFiles.length > 0) {
      return getTeamAggregatedData(manualFiles, charMap, capsuleMap);
    }
    return [];
  }, [mode, viewType, charMap, capsuleMap, manualFiles, fileContent, selectedFilePath]);

  // Filtered and sorted aggregated data based on search and filters
  const filteredAggregatedData = useMemo(() => {
    if (!Array.isArray(aggregatedData)) return [];
    
    let filtered = aggregatedData.map(char => {
      // Filter matches based on team and AI strategy filters
      let filteredMatches = [...char.matches];
      
      // Apply team filter to matches
      if (selectedTeams.length > 0) {
        filteredMatches = filteredMatches.filter(match => 
          match.team && selectedTeams.includes(match.team)
        );
      }
      
      // Apply AI strategy filter to matches
      if (selectedAIStrategies.length > 0) {
        filteredMatches = filteredMatches.filter(match => 
          match.aiStrategy && selectedAIStrategies.includes(match.aiStrategy)
        );
      }
      
      // If no matches remain after filtering, return null to filter out later
      if (filteredMatches.length === 0) {
        return null;
      }
      
      // Recalculate stats based on filtered matches
      const totalDamage = filteredMatches.reduce((sum, m) => sum + m.damageDone, 0);
      const totalTaken = filteredMatches.reduce((sum, m) => sum + m.damageTaken, 0);
      const totalHealth = filteredMatches.reduce((sum, m) => sum + m.hPGaugeValue, 0);
      const totalBattleTime = filteredMatches.reduce((sum, m) => sum + m.battleTime, 0);
      const totalHPGaugeValueMax = filteredMatches.reduce((sum, m) => sum + m.hPGaugeValueMax, 0);
      const totalSpecial = filteredMatches.reduce((sum, m) => sum + (m.specialMovesUsed || 0), 0);
      const totalUltimates = filteredMatches.reduce((sum, m) => sum + (m.ultimatesUsed || 0), 0);
      const totalSkills = filteredMatches.reduce((sum, m) => sum + (m.skillsUsed || 0), 0);
      const totalKills = filteredMatches.reduce((sum, m) => sum + (m.kills || 0), 0);
      const totalSparking = filteredMatches.reduce((sum, m) => sum + (m.sparkingCount || 0), 0);
      const totalCharges = filteredMatches.reduce((sum, m) => sum + (m.chargeCount || 0), 0);
      const totalGuards = filteredMatches.reduce((sum, m) => sum + (m.guardCount || 0), 0);
      const totalEnergyBlasts = filteredMatches.reduce((sum, m) => sum + (m.shotEnergyBulletCount || 0), 0);
      const totalZCounters = filteredMatches.reduce((sum, m) => sum + (m.zCounterCount || 0), 0);
      const totalSuperCounters = filteredMatches.reduce((sum, m) => sum + (m.superCounterCount || 0), 0);
      const maxComboNumTotal = filteredMatches.reduce((sum, m) => sum + (m.maxComboNum || 0), 0);
      const maxComboDamageTotal = filteredMatches.reduce((sum, m) => sum + (m.maxComboDamage || 0), 0);
  const matchCount = filteredMatches.length;
  const activeMatches = filteredMatches.filter(m => m.battleTime && m.battleTime > 0);
  const activeMatchCount = activeMatches.length;
  const denom = activeMatchCount > 0 ? activeMatchCount : matchCount;
      
      // Recalculate teams and AI strategies used from filtered matches
      const teamsUsed = {};
      const aiStrategiesUsed = {};
      filteredMatches.forEach(match => {
        if (match.team) {
          teamsUsed[match.team] = (teamsUsed[match.team] || 0) + 1;
        }
        if (match.aiStrategy) {
          aiStrategiesUsed[match.aiStrategy] = (aiStrategiesUsed[match.aiStrategy] || 0) + 1;
        }
      });
      
      const teamsArray = Object.keys(teamsUsed);
      const aiStrategiesArray = Object.keys(aiStrategiesUsed);
      const primaryTeam = teamsArray.length > 0 
        ? teamsArray.reduce((a, b) => teamsUsed[a] > teamsUsed[b] ? a : b)
        : null;
      const primaryAIStrategy = aiStrategiesArray.length > 0
        ? aiStrategiesArray.reduce((a, b) => aiStrategiesUsed[a] > aiStrategiesUsed[b] ? a : b)
        : null;
      
  // Calculate averages (use denom which prefers active matches if present)
  const avgDamage = Math.round(totalDamage / Math.max(denom, 1));
  const avgTaken = Math.round(totalTaken / Math.max(denom, 1));
  const avgHealth = Math.round(totalHealth / Math.max(denom, 1));
  const avgBattleTime = Math.round((totalBattleTime / Math.max(denom, 1)) * 10) / 10;
  const avgHPGaugeValueMax = Math.round(totalHPGaugeValueMax / Math.max(denom, 1));
  const avgSpecial = Math.round((totalSpecial / Math.max(denom, 1)) * 10) / 10;
  const avgUltimates = Math.round((totalUltimates / Math.max(denom, 1)) * 10) / 10;
  const avgSkills = Math.round((totalSkills / Math.max(denom, 1)) * 10) / 10;
  const avgKills = Math.round((totalKills / Math.max(denom, 1)) * 10) / 10;
  const avgSparking = Math.round((totalSparking / Math.max(denom, 1)) * 10) / 10;
  const avgCharges = Math.round((totalCharges / Math.max(denom, 1)) * 10) / 10;
  const avgGuards = Math.round((totalGuards / Math.max(denom, 1)) * 10) / 10;
  const avgEnergyBlasts = Math.round((totalEnergyBlasts / Math.max(denom, 1)) * 10) / 10;
  const avgZCounters = Math.round((totalZCounters / Math.max(denom, 1)) * 10) / 10;
  const avgSuperCounters = Math.round((totalSuperCounters / Math.max(denom, 1)) * 10) / 10;
  const avgMaxCombo = Math.round((maxComboNumTotal / Math.max(denom, 1)) * 10) / 10;
  const avgMaxComboDamage = Math.round(maxComboDamageTotal / Math.max(denom, 1));
      
      // Calculate DPS and efficiency
      const dps = Math.round((avgDamage / Math.max(avgBattleTime, 0.1)) * 10) / 10;
      const efficiency = Math.round((avgDamage / Math.max(avgTaken, 1)) * 100) / 100;
      const healthRetention = avgHPGaugeValueMax > 0 ? avgHealth / avgHPGaugeValueMax : 0;
      
      // Recalculate combat performance score using consistent formula
      const baseScore = (
        (avgDamage / 100000) * 35 +        // Damage dealt weight: 35%
        (efficiency) * 25 +                 // Damage efficiency weight: 25%
        (dps / 1000) * 25 +                 // Damage per second weight: 25%
        (healthRetention) * 15              // Health retention weight: 15%
      );
      
  // Experience multiplier based on matches played; prefer active matches for weighting
  const experienceMultiplier = Math.min(1.25, 1.0 + ((activeMatchCount > 0 ? activeMatchCount : matchCount) - 1) * (0.25 / 11));
      const combatPerformanceScore = baseScore * experienceMultiplier;
      
      return {
        ...char,
        matchCount,
        activeMatchCount,
        totalDamage,
        totalTaken,
        totalHealth,
        totalBattleTime,
        totalHPGaugeValueMax,
        totalSpecial,
        totalUltimates,
        totalSkills,
        totalKills,
        totalSparking,
        totalCharges,
        totalGuards,
        totalEnergyBlasts,
        totalZCounters,
        totalSuperCounters,
        maxComboNumTotal,
        maxComboDamageTotal,
  avgDamage,
  avgTaken,
  avgHealth,
  avgBattleTime,
        avgHPGaugeValueMax,
        avgSpecial,
        avgUltimates,
        avgSkills,
        avgKills,
        avgSparking,
        avgCharges,
        avgGuards,
        avgEnergyBlasts,
        avgZCounters,
        avgSuperCounters,
        avgMaxCombo,
        avgMaxComboDamage,
        dps,
        efficiency,
        combatPerformanceScore,
        teamsUsed: teamsArray,
        aiStrategiesUsed: aiStrategiesArray,
        primaryTeam,
        primaryAIStrategy,
        matches: filteredMatches
      };
    }).filter(char => char !== null); // Remove characters with no matching matches
    
    // Apply character filter
    if (selectedCharacters.length > 0) {
      filtered = filtered.filter(char => 
        selectedCharacters.includes(char.name)
      );
    }
    
    // Apply minimum/maximum matches filter (use activeMatchCount when available)
    filtered = filtered.filter(char => {
      const matchesForFilter = (char.activeMatchCount && char.activeMatchCount > 0) ? char.activeMatchCount : char.matchCount;
      return matchesForFilter >= minMatches && matchesForFilter <= maxMatches;
    });
    
    // Apply performance level filter
    if (performanceFilters.length > 0 && performanceFilters.length < 5) {
      const combatScores = filtered.map(c => c.combatPerformanceScore);
      filtered = filtered.filter(char => {
        const level = getPerformanceLevel(char.combatPerformanceScore, combatScores);
        return performanceFilters.includes(level);
      });
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal, bVal;
      switch(sortBy) {
        case 'combatScore':
          aVal = a.combatPerformanceScore;
          bVal = b.combatPerformanceScore;
          break;
        case 'totalDamage':
          aVal = a.totalDamage;
          bVal = b.totalDamage;
          break;
        case 'avgDamage':
          aVal = a.avgDamage;
          bVal = b.avgDamage;
          break;
        case 'dps':
          aVal = a.avgDamage / Math.max(a.avgBattleTime, 0.1);
          bVal = b.avgDamage / Math.max(b.avgBattleTime, 0.1);
          break;
        case 'efficiency':
          aVal = a.avgDamage / Math.max(a.avgTaken, 1);
          bVal = b.avgDamage / Math.max(b.avgTaken, 1);
          break;
        case 'matches':
          aVal = a.matchCount;
          bVal = b.matchCount;
          break;
        case 'name':
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
        default:
          aVal = a.combatPerformanceScore;
          bVal = b.combatPerformanceScore;
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return filtered;
  }, [aggregatedData, selectedCharacters, performanceFilters, minMatches, maxMatches, sortBy, sortDirection, selectedTeams, selectedAIStrategies]);

  // Extract unique teams and AI strategies from aggregated data
  const availableCharacters = useMemo(() => {
    return aggregatedData.map(char => char.name).sort();
  }, [aggregatedData]);
  
  const availableTeams = useMemo(() => {
    const teams = new Set();
    aggregatedData.forEach(char => {
      if (char.teamsUsed) {
        char.teamsUsed.forEach(team => teams.add(team));
      }
    });
    return Array.from(teams).sort();
  }, [aggregatedData]);

  const availableAIStrategies = useMemo(() => {
    const strategies = new Set();
    aggregatedData.forEach(char => {
      if (char.aiStrategiesUsed) {
        char.aiStrategiesUsed.forEach(ai => strategies.add(ai));
      }
    });
    return Array.from(strategies).sort();
  }, [aggregatedData]);

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



  const processFiles = (files) => {
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
      } else {
        setFileContent(null);
      }
      setExpandedRows({});
    });
  };

  const handleManualFileUpload = (event) => {
    const files = Array.from(event.target.files);
    processFiles(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer.files).filter(file => 
      file.name.endsWith('.json')
    );
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
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
      // keep global selected path in sync for compatibility
      setSelectedFilePath([file.name]);
      // Also set analysis-specific state so the header/search-driven analysis area shows this file
      setAnalysisFileContent(file.content);
      setAnalysisSelectedFilePath([file.name]);
    }
    setExpandedRows({});
  };

  // Handler used by the Match Analysis header combobox to switch which file is being shown
  const handleHeaderFileSelect = (fileName) => {
    if (!fileName) return;
    // Manual mode: pick from uploaded files
    if (mode === 'manual') {
      const file = manualFiles.find(f => f.name === fileName);
      if (file && !file.error) {
        // Only apply to the analysis area
        setAnalysisFileContent(file.content);
        setAnalysisSelectedFilePath([file.name]);
        setExpandedRows({});
      }
      return;
    }

    // Reference mode: fileContent may be an array of {name, content}
    if (Array.isArray(fileContent)) {
      const f = fileContent.find(x => x.name === fileName);
      if (f) {
        // In reference mode other parts of the app expect a plain file content for single view
        // Only apply to the analysis area
        setAnalysisFileContent(f.content || f);
        setAnalysisSelectedFilePath([f.name]);
        setExpandedRows({});
      }
    }
  };

  // Handler for Excel export
  const handleExcelExport = async () => {
    try {
      const characterData = prepareCharacterAveragesData(aggregatedData);
      const matchData = prepareMatchDetailsData(aggregatedData);
      
      const result = await exportToExcel(characterData, matchData, {
        filename: `DBSZ_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`,
        includeCharacterAverages: true,
        includeMatchDetails: true,
        includeFormatting: true
      });
      
      if (result.success) {
        console.log('Excel export successful:', result.filename);
      } else {
        console.error('Excel export failed:', result.error);
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    }
  };

  // Handler for Character Averages export only
  const handleCharacterAveragesExport = async () => {
    try {
      const characterData = prepareCharacterAveragesData(aggregatedData);
      
      const result = await exportToExcel(characterData, [], {
        filename: `Character_Averages_${new Date().toISOString().split('T')[0]}.xlsx`,
        includeCharacterAverages: true,
        includeMatchDetails: false,
        includeFormatting: true
      });
      
      if (result.success) {
        console.log('Character Averages export successful:', result.filename);
      } else {
        console.error('Export failed:', result.error);
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    }
  };

  // Handler for Match Details export only
  const handleMatchDetailsExport = async () => {
    try {
      const matchData = prepareMatchDetailsData(aggregatedData);
      
      const result = await exportToExcel([], matchData, {
        filename: `Match_Details_${new Date().toISOString().split('T')[0]}.xlsx`,
        includeCharacterAverages: false,
        includeMatchDetails: true,
        includeFormatting: true
      });
      
      if (result.success) {
        console.log('Match Details export successful:', result.filename);
      } else {
        console.error('Export failed:', result.error);
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    }
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
      if (teamBattleResults.BattleResults) {
        return teamBattleResults.BattleResults;
      }
      // Check if data is directly in TeamBattleResults
      if (teamBattleResults.battleWinLose && teamBattleResults.characterRecord) {
        return teamBattleResults;
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
  // analysisContent is the file used for the Match Analysis header selector; fall back to global fileContent
  const analysisContent = analysisFileContent || fileContent;
  const analysisSelectedPath = analysisSelectedFilePath || selectedFilePath;

  if (analysisContent && typeof analysisContent === 'object') {
    // Handle TeamBattleResults format (current BR_Data structure)
    if (analysisContent.TeamBattleResults && typeof analysisContent.TeamBattleResults === 'object') {
      const teamBattleResults = analysisContent.TeamBattleResults;
      // Check for both battleResult (lowercase) and BattleResults (capital)
      if (teamBattleResults.battleResult) {
        battleWinLose = teamBattleResults.battleResult.battleWinLose;
        characterRecord = teamBattleResults.battleResult.characterRecord;
      } else if (teamBattleResults.BattleResults) {
        battleWinLose = teamBattleResults.BattleResults.battleWinLose;
        characterRecord = teamBattleResults.BattleResults.characterRecord;
      } else if (teamBattleResults.battleWinLose && teamBattleResults.characterRecord) {
        // Direct properties in TeamBattleResults (new wrapper format)
        battleWinLose = teamBattleResults.battleWinLose;
        characterRecord = teamBattleResults.characterRecord;
      }
    }
    // Handle new format with teams array at the top
    else if (analysisContent.teams && Array.isArray(analysisContent.teams) && analysisContent.teams.length > 0) {
      const firstTeam = analysisContent.teams[0];
      if (firstTeam.BattleResults) {
        battleWinLose = firstTeam.BattleResults.battleWinLose;
        characterRecord = firstTeam.BattleResults.characterRecord;
      } else if (firstTeam.battleWinLose) {
        battleWinLose = firstTeam.battleWinLose;
        characterRecord = firstTeam.characterRecord;
      }
    } 
    // Handle standard format with BattleResults at root
    else if (analysisContent.BattleResults) {
      battleWinLose = analysisContent.BattleResults.battleWinLose;
      characterRecord = analysisContent.BattleResults.characterRecord;
    } 
    // Handle legacy format with direct properties
    else if (analysisContent.battleWinLose && analysisContent.characterRecord) {
      battleWinLose = analysisContent.battleWinLose;
      characterRecord = analysisContent.characterRecord;
    }
    // Fallback: recursively search for BattleResults in nested structure
    else {
      const battleData = findBattleData(analysisContent);
      if (battleData) {
        battleWinLose = battleData.battleWinLose;
        characterRecord = battleData.characterRecord;
      }
    }
  }

  // Extract team names from teams array (multiple format support)
  let p1TeamName = "Team 1";
  let p2TeamName = "Team 2";
  if (analysisContent && typeof analysisContent === 'object') {
    let teamsArray = null;
    
    // Check for TeamBattleResults format first
    if (analysisContent.TeamBattleResults && Array.isArray(analysisContent.TeamBattleResults.teams)) {
      teamsArray = analysisContent.TeamBattleResults.teams;
    }
    // Check for direct teams array
    else if (Array.isArray(analysisContent.teams)) {
      teamsArray = analysisContent.teams;
    }
    // Check for nested teams in BattleResults
    else if (analysisContent.BattleResults && Array.isArray(analysisContent.BattleResults.teams)) {
      teamsArray = analysisContent.BattleResults.teams;
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

            <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {viewType === 'single' ? 'Search categories or matches to analyze:' : 'Search categories or matches to analyze:'}
              </label>
              <BRDataSelector
                allowFolderSelect={viewType !== 'single'}
                onSelect={async (selectedIds) => {
                  if (!Array.isArray(selectedIds) || selectedIds.length === 0) return;
                  setSelectedFilePath(selectedIds);
                  setFileContent(null);

                  // Only fetch files (ending in .json)
                  const fileIds = selectedIds.filter(id => id.endsWith('.json'));
                  if (fileIds.length === 0) return;

                  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '';
                  const fileContents = await Promise.all(
                    fileIds.map(async id => {
                      const staticUrl = `${base}BR_Data/${id}`;
                      try {
                        const res = await fetch(staticUrl);
                        if (res.ok) return { name: id, content: await res.json() };
                      } catch (err) {
                        // ignore individual file errors and continue
                      }
                      return null;
                    })
                  );
                  setFileContent(fileContents.filter(Boolean));
                }}
              />
            </div>
          </div>
        )}

        {/* Manual Upload Mode */}
        {mode === 'manual' && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-4">
              <Upload className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Upload JSON Battle Result Files</h3>
            </div>
            
            <label 
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                darkMode 
                  ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' 
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
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
                <button
                  onClick={() => setUploadedFilesCollapsed(!uploadedFilesCollapsed)}
                  className={`w-full text-sm font-semibold mb-2 flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Uploaded Files ({manualFiles.length})
                  </div>
                  {uploadedFilesCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
                
                {!uploadedFilesCollapsed && (
                  <div className="space-y-1 mb-4">
                    {manualFiles.map((file, i) => (
                      <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                        file.error 
                          ? darkMode 
                            ? 'bg-red-900/30 border border-red-700 text-red-300' 
                            : 'bg-red-50 border border-red-200 text-red-700'
                          : darkMode
                            ? 'bg-green-900/30 border border-green-700 text-green-300'
                            : 'bg-green-50 border border-green-200 text-green-700'
                      }`}>
                        {file.error ? (
                          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <Target className="w-3.5 h-3.5 flex-shrink-0" />
                        )}
                        <span className="flex-1 truncate">{file.name}</span>
                        {file.error && <span className="text-xs opacity-75">Error: {file.error}</span>}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* View Type Selector for Manual Mode */}
                <div className={`mb-4 p-4 rounded-xl border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`text-sm font-semibold mb-3 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>View Type</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      viewType === 'single' 
                        ? darkMode
                          ? 'border-blue-400 bg-blue-900/30 text-blue-300'
                          : 'border-blue-500 bg-blue-50 text-blue-700'
                        : darkMode
                          ? 'border-gray-600 bg-gray-800 hover:border-gray-500 text-gray-300'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        <div>
                          <input 
                            type="radio" 
                            value="single" 
                            checked={viewType === 'single'} 
                            onChange={(e) => setViewType(e.target.value)}
                            className="sr-only"
                          />
                          <span className="font-semibold text-sm">Single Match</span>
                          <p className="text-xs opacity-75">Detailed view</p>
                        </div>
                      </div>
                    </label>
                    <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      viewType === 'aggregated' 
                        ? darkMode
                          ? 'border-blue-400 bg-blue-900/30 text-blue-300'
                          : 'border-blue-500 bg-blue-50 text-blue-700'
                        : darkMode
                          ? 'border-gray-600 bg-gray-800 hover:border-gray-500 text-gray-300'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        <div>
                          <input 
                            type="radio" 
                            value="aggregated" 
                            checked={viewType === 'aggregated'} 
                            onChange={(e) => setViewType(e.target.value)}
                            className="sr-only"
                          />
                          <span className="font-semibold text-sm">Aggregated Stats</span>
                          <p className="text-xs opacity-75">Combined data</p>
                        </div>
                      </div>
                    </label>
                    <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      viewType === 'teams' 
                        ? darkMode
                          ? 'border-yellow-400 bg-yellow-900/30 text-yellow-300'
                          : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : darkMode
                          ? 'border-gray-600 bg-gray-800 hover:border-gray-500 text-gray-300'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <div>
                          <input 
                            type="radio" 
                            value="teams" 
                            checked={viewType === 'teams'} 
                            onChange={(e) => setViewType(e.target.value)}
                            className="sr-only"
                          />
                          <span className="font-semibold text-sm">Team Rankings</span>
                          <p className="text-xs opacity-75">Win/Loss records</p>
                        </div>
                      </div>
                    </label>
                    <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      viewType === 'tables' 
                        ? darkMode
                          ? 'border-green-400 bg-green-900/30 text-green-300'
                          : 'border-green-500 bg-green-50 text-green-700'
                        : darkMode
                          ? 'border-gray-600 bg-gray-800 hover:border-gray-500 text-gray-300'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Table className="w-5 h-5" />
                        <div>
                          <input 
                            type="radio" 
                            value="tables" 
                            checked={viewType === 'tables'} 
                            onChange={(e) => setViewType(e.target.value)}
                            className="sr-only"
                          />
                          <span className="font-semibold text-sm">Data Tables</span>
                          <p className="text-xs opacity-75">Interactive tables</p>
                        </div>
                      </div>
                    </label>
                    <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      viewType === 'meta' 
                        ? darkMode
                          ? 'border-purple-400 bg-purple-900/30 text-purple-300'
                          : 'border-purple-500 bg-purple-50 text-purple-700'
                        : darkMode
                          ? 'border-gray-600 bg-gray-800 hover:border-gray-500 text-gray-300'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        <div>
                          <input 
                            type="radio" 
                            value="meta" 
                            checked={viewType === 'meta'} 
                            onChange={(e) => setViewType(e.target.value)}
                            className="sr-only"
                          />
                          <span className="font-semibold text-sm">Meta Analysis</span>
                          <p className="text-xs opacity-75">Build trends</p>
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {/* Helpful hint for single file uploads */}
                  {manualFiles.filter(f => !f.error).length === 1 && viewType !== 'single' && (
                    <div className={`mt-3 p-3 rounded-lg border flex items-start gap-2 ${
                      darkMode 
                        ? 'bg-blue-900/20 border-blue-700 text-blue-300' 
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-xs">
                        <strong>Tip:</strong> Upload multiple files for richer insights and better trend analysis!
                      </p>
                    </div>
                  )}
                </div>
                
                {viewType === 'single' && manualFiles.length === 1 && !manualFiles[0].error ? (
                  <button 
                    onClick={() => handleManualFileSelect(manualFiles[0].name)}
                    className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    Analyze {manualFiles[0].name}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Aggregated Data Display */}
        {((mode === 'reference' && viewType === 'aggregated') || 
          (mode === 'manual' && viewType === 'aggregated' && manualFiles.filter(f => !f.error).length > 0)) && 
          aggregatedData.length > 0 && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6 cursor-pointer" onClick={() => setSectionCollapsed(prev => ({...prev, aggregated: !prev.aggregated}))}>
              <div className="flex items-center gap-3">
                <TrendingUp className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Aggregated Character Performance</h2>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Data from {mode === 'reference' ? 1 : manualFiles.filter(f => !f.error).length} battle file{(mode === 'reference' ? 1 : manualFiles.filter(f => !f.error).length) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  darkMode 
                    ? 'bg-blue-900 hover:bg-blue-800 text-blue-400' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                }`}
                title={sectionCollapsed.aggregated ? "Expand section" : "Collapse section"}
              >
                {sectionCollapsed.aggregated ? '+' : '−'}
              </button>
            </div>
            
            {!sectionCollapsed.aggregated && (
            <div className="space-y-4">
              {/* Search and Filter Controls */}
              <div className={`p-4 rounded-xl border ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                {/* Search Bar */}
                {/* Character Filter */}
                <div className="mb-4">
                  {/* Selected Characters as Chips */}
                  {selectedCharacters.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedCharacters.map(character => (
                        <button
                          key={character}
                          onClick={() => {
                            setSelectedCharacters(prev => prev.filter(c => c !== character));
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-1 ${
                            darkMode 
                              ? 'bg-purple-900 border-purple-600 text-purple-300 hover:bg-purple-800' 
                              : 'bg-purple-100 border-purple-500 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          {character}
                          <X className="w-3 h-3" />
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedCharacters([])}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          darkMode 
                            ? 'text-gray-400 bg-gray-800 hover:text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                  
                  {/* Search Input with Dropdown */}
                  <div className="relative">
                    <div className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      Characters
                    </div>
                    <input
                      type="text"
                      placeholder="Search and select characters..."
                      value={characterSearchInput}
                      onChange={(e) => setCharacterSearchInput(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                      } focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                    />
                    {characterSearchInput && (
                      <button
                        onClick={() => setCharacterSearchInput('')}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                          darkMode ? 'text-gray-400 bg-gray-700 hover: text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    
                    {/* Dropdown with filtered characters */}
                    {characterSearchInput && (
                      <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}>
                        {availableCharacters
                          .filter(char => 
                            char.toLowerCase().includes(characterSearchInput.toLowerCase()) &&
                            !selectedCharacters.includes(char)
                          )
                          .slice(0, 50) // Limit to 50 results for performance
                          .map(character => (
                            <button
                              key={character}
                              onClick={() => {
                                setSelectedCharacters(prev => [...prev, character]);
                                setCharacterSearchInput('');
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                darkMode 
                                  ? 'text-gray-100 bg-gray-600 hover:bg-gray-700 hover:text-white' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {character}
                            </button>
                          ))
                        }
                        {availableCharacters.filter(char => 
                          char.toLowerCase().includes(characterSearchInput.toLowerCase()) &&
                          !selectedCharacters.includes(char)
                        ).length === 0 && (
                          <div className={`px-4 py-2 text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            No characters found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Performance Level Filters */}
                <div className="mb-4">
                  <div className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Filter className="w-4 h-4" />
                    Performance Level
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'excellent', label: 'Excellent', color: 'green' },
                      { value: 'good', label: 'Good', color: 'yellow' },
                      { value: 'average', label: 'Average', color: 'orange' },
                      { value: 'below', label: 'Below Average', color: 'red' },
                      { value: 'poor', label: 'Poor', color: 'gray' }
                    ].map(filter => {
                      const isActive = performanceFilters.includes(filter.value);
                      const colorClasses = {
                        green: isActive 
                          ? (darkMode ? 'bg-green-900 border-green-500 text-green-200' : 'bg-green-100 border-green-500 text-green-700')
                          : (darkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'),
                        yellow: isActive
                          ? (darkMode ? 'bg-yellow-900 border-yellow-500 text-yellow-200' : 'bg-yellow-100 border-yellow-500 text-yellow-700')
                          : (darkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'),
                        orange: isActive
                          ? (darkMode ? 'bg-orange-900 border-orange-500 text-orange-200' : 'bg-orange-100 border-orange-500 text-orange-700')
                          : (darkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'),
                        red: isActive
                          ? (darkMode ? 'bg-red-900 border-red-500 text-red-200' : 'bg-red-100 border-red-500 text-red-700')
                          : (darkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'),
                        gray: isActive
                          ? (darkMode ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-200 border-gray-500 text-gray-800')
                          : (darkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                      };
                      
                      return (
                        <button
                          key={filter.value}
                          onClick={() => {
                            setPerformanceFilters(prev => 
                              isActive 
                                ? prev.filter(f => f !== filter.value)
                                : [...prev, filter.value]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                            colorClasses[filter.color]
                          } hover:opacity-80`}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Matches Filter */}
                <div className="mb-4">
                  <div className={`text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Matches Played
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Min:</label>
                      <input
                        type="number"
                        min="1"
                        max={maxMatches}
                        value={minMatches}
                        onChange={(e) => setMinMatches(Math.max(1, Math.min(parseInt(e.target.value) || 1, maxMatches)))}
                        className={`w-16 px-2 py-1 rounded border text-sm ${
                          darkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="1"
                        max={aggregatedData.length > 0 ? Math.max(...aggregatedData.map(c => c.matchCount)) : 20}
                        value={minMatches}
                        onChange={(e) => setMinMatches(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max:</label>
                      <input
                        type="number"
                        min={minMatches}
                        max="999"
                        value={maxMatches}
                        onChange={(e) => setMaxMatches(Math.max(minMatches, parseInt(e.target.value) || 999))}
                        className={`w-16 px-2 py-1 rounded border text-sm ${
                          darkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Team Filter */}
                {availableTeams.length > 0 && (
                  <div className="mb-4">
                    {/* Selected Teams as Chips */}
                    {selectedTeams.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedTeams.map(team => (
                          <button
                            key={team}
                            onClick={() => {
                              setSelectedTeams(prev => prev.filter(t => t !== team));
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-1 ${
                              darkMode 
                                ? 'bg-blue-900 border-blue-600 text-blue-300 hover:bg-blue-800' 
                                : 'bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {team}
                            <X className="w-3 h-3" />
                          </button>
                        ))}
                        <button
                          onClick={() => setSelectedTeams([])}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            darkMode 
                              ? 'text-gray-400 bg-gray-800 hover:text-gray-300 hover:bg-gray-700' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                    
                    {/* Search Input with Dropdown */}
                    <div className="relative">
                      <div className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <Users className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        Teams
                      </div>
                      <input
                        type="text"
                        placeholder="Search and select teams..."
                        value={teamSearchInput}
                        onChange={(e) => setTeamSearchInput(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                      />
                      {teamSearchInput && (
                        <button
                          onClick={() => setTeamSearchInput('')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                            darkMode ? 'text-gray-400 bg-gray-700 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                      
                      {/* Dropdown with filtered teams */}
                      {teamSearchInput && (
                        <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
                          darkMode 
                            ? 'bg-gray-800 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {availableTeams
                            .filter(team => 
                              team.toLowerCase().includes(teamSearchInput.toLowerCase()) &&
                              !selectedTeams.includes(team)
                            )
                            .map(team => (
                              <button
                                key={team}
                                onClick={() => {
                                  setSelectedTeams(prev => [...prev, team]);
                                  setTeamSearchInput('');
                                }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                  darkMode 
                                    ? 'text-gray-100 bg-gray-600 hover:bg-gray-700 hover:text-white' 
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {team}
                              </button>
                            ))
                          }
                          {availableTeams.filter(team => 
                            team.toLowerCase().includes(teamSearchInput.toLowerCase()) &&
                            !selectedTeams.includes(team)
                          ).length === 0 && (
                            <div className={`px-4 py-2 text-sm ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              No teams found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* AI Strategy Filter */}
                {availableAIStrategies.length > 0 && (
                  <div className="mb-4">
                    {/* Selected AI Strategies as Chips */}
                    {selectedAIStrategies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedAIStrategies.map(ai => {
                          const displayName = ai === 'Com' ? 'Computer' : ai === 'Player' ? 'Player' : ai;
                          return (
                            <button
                              key={ai}
                              onClick={() => {
                                setSelectedAIStrategies(prev => prev.filter(a => a !== ai));
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-1 ${
                                darkMode 
                                  ? 'bg-purple-900 border-purple-600 text-purple-300 hover:bg-purple-800' 
                                  : 'bg-purple-100 border-purple-500 text-purple-700 hover:bg-purple-200'
                              }`}
                            >
                              {displayName}
                              <X className="w-3 h-3" />
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setSelectedAIStrategies([])}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            darkMode 
                              ? 'text-gray-400 bg-gray-800 hover:text-gray-300 hover:bg-gray-700' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                    
                    {/* Search Input with Dropdown */}
                    <div className="relative">
                      <div className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <Settings className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        AI Strategies
                      </div>
                      <input
                        type="text"
                        placeholder="Search and select AI strategies..."
                        value={aiStrategySearchInput}
                        onChange={(e) => setAIStrategySearchInput(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                        } focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                      />
                      {aiStrategySearchInput && (
                        <button
                          onClick={() => setAIStrategySearchInput('')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                            darkMode ? 'text-gray-400 bg-gray-700 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                      
                      {/* Dropdown with filtered AI strategies */}
                      {aiStrategySearchInput && (
                        <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
                          darkMode 
                            ? 'bg-gray-800 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {availableAIStrategies
                            .filter(ai => {
                              const displayName = ai === 'Com' ? 'Computer' : ai === 'Player' ? 'Player' : ai;
                              return displayName.toLowerCase().includes(aiStrategySearchInput.toLowerCase()) &&
                                !selectedAIStrategies.includes(ai);
                            })
                            .map(ai => {
                              const displayName = ai === 'Com' ? 'Computer' : ai === 'Player' ? 'Player' : ai;
                              return (
                                <button
                                  key={ai}
                                  onClick={() => {
                                    setSelectedAIStrategies(prev => [...prev, ai]);
                                    setAIStrategySearchInput('');
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                    darkMode 
                                      ? 'text-gray-100 bg-gray-600 hover:bg-gray-700 hover:text-white' 
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {displayName}
                                </button>
                              );
                            })
                          }
                          {availableAIStrategies.filter(ai => {
                            const displayName = ai === 'Com' ? 'Computer' : ai === 'Player' ? 'Player' : ai;
                            return displayName.toLowerCase().includes(aiStrategySearchInput.toLowerCase()) &&
                              !selectedAIStrategies.includes(ai);
                          }).length === 0 && (
                            <div className={`px-4 py-2 text-sm ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              No AI strategies found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Sort Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`text-sm font-medium mb-2 block ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                    >
                      <option value="combatScore">Combat Performance Score</option>
                      <option value="totalDamage">Total Damage</option>
                      <option value="avgDamage">Average Damage</option>
                      <option value="dps">DPS (Damage per Second)</option>
                      <option value="efficiency">Efficiency (Damage/Taken)</option>
                      <option value="matches">Matches Played</option>
                      <option value="name">Character Name</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-sm font-medium mb-2 block ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Sort Direction
                    </label>
                    <button
                      onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className={`w-full px-3 py-2 rounded-lg border flex items-center justify-center gap-2 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                    </button>
                  </div>
                </div>
                
                {/* Result Count */}
                <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing {filteredAggregatedData.length} of {aggregatedData.length} characters
                </div>
              </div>
              
              {filteredAggregatedData.map((char, i) => {
                const expanded = expandedRows[`agg_${i}`] || false;
                const allDamageValues = filteredAggregatedData.map(c => c.totalDamage);
                const allDamageTakenValues = filteredAggregatedData.map(c => c.totalTaken);
                const allAvgDamageValues = filteredAggregatedData.map(c => c.avgDamage);
                const allAvgTakenValues = filteredAggregatedData.map(c => c.avgTaken);
                const allAvgHealthValues = filteredAggregatedData.map(c => c.avgHealth);
                const allAvgBattleTimeValues = filteredAggregatedData.map(c => c.avgBattleTime);
                const avgBattleTime = allAvgBattleTimeValues.reduce((sum, val) => sum + val, 0) / allAvgBattleTimeValues.length;
                
                // Get all combat performance scores from the filtered data
                const combatPerformanceScores = filteredAggregatedData.map(c => c.combatPerformanceScore);
                
                return (
                  <div key={i} className={`rounded-xl p-6 border transition-colors ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 hover:border-gray-500' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}>
                    <div 
                      className="space-y-4 cursor-pointer"
                      onClick={() => toggleRow('agg', i)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Swords className={`w-6 h-6 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{char.name}</h3>
                          <PerformanceIndicator value={char.combatPerformanceScore} allValues={combatPerformanceScores} darkMode={darkMode} />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <BarChart3 className="w-4 h-4" />
                            <span>{char.matchCount} matches played</span>
                          </div>
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              darkMode 
                                ? 'bg-blue-900 text-blue-400' 
                                : 'bg-blue-100 text-blue-600'
                            }`}
                            title={expanded ? "Click to collapse" : "Click to expand"}
                          >
                            {expanded ? '−' : '+'}
                          </div>
                        </div>
                      </div>
                      
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
                        <div className="grid grid-cols-1 gap-4">
                          {/* Overall Performance Score */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                              <div className={`rounded-lg p-3 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Star className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                  <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Overall Performance Score</h4>
                                </div>
                                <div className="text-center">
                                  {(() => {
                                    const level = getPerformanceLevel(char.combatPerformanceScore, combatPerformanceScores);
                                    let colorClass;
                                    switch (level) {
                                      case 'excellent':
                                        colorClass = 'text-green-600';
                                        break;
                                      case 'good':
                                        colorClass = 'text-blue-500';
                                        break;
                                      case 'average':
                                        colorClass = 'text-yellow-500';
                                        break;
                                      case 'below-average':
                                        colorClass = 'text-orange-600';
                                        break;
                                      default:
                                        colorClass = 'text-red-600';
                                    }
                                    return (
                                      <div className={`text-4xl font-bold mb-2 ${colorClass}`}>
                                        {Math.round(char.combatPerformanceScore)}
                                      </div>
                                    );
                                  })()}
                                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Based on {char.matchCount} match{char.matchCount !== 1 ? 'es' : ''}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    {char.primaryTeam && (
                                      <div className={`text-left text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <span className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Team:</span> {char.primaryTeam}
                                      </div>
                                    )}
                                    {char.primaryAIStrategy && (
                                      <div className={`text-right text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <span className={`font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>AI:</span> {char.primaryAIStrategy}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* Combat Performance - Full Width */}
                              <div className={`rounded-lg p-3 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Swords className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                                  <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Combat Performance</h4>
                                </div>
                                <div className="space-y-2 text-sm mb-3">
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Damage Done:</span>
                                    <div className="flex items-center gap-2">
                                      <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgDamage.toLocaleString()}</strong>
                                      <PerformanceIndicator value={char.avgDamage} allValues={allAvgDamageValues} darkMode={darkMode} />
                                    </div>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Damage Taken:</span>
                                    <div className="flex items-center gap-2">
                                      <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgTaken.toLocaleString()}</strong>
                                      <PerformanceIndicator value={char.avgTaken} allValues={allAvgTakenValues} isInverse={true} darkMode={darkMode} />
                                    </div>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Damage Over Time:</span>
                                    <div className="flex items-center gap-2">
                                      <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round(char.avgDamage / char.avgBattleTime).toLocaleString()}/sec</strong>
                                      <PerformanceIndicator value={char.avgDamage / char.avgBattleTime} allValues={filteredAggregatedData.map(c => c.avgDamage / c.avgBattleTime)} darkMode={darkMode} />
                                    </div>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Damage Efficiency:</span>
                                    <div className="flex items-center gap-2">
                                      <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{(char.avgDamage / Math.max(char.avgTaken, 1)).toFixed(2)}x</strong>
                                      <PerformanceIndicator value={char.avgDamage / Math.max(char.avgTaken, 1)} allValues={filteredAggregatedData.map(c => c.avgDamage / Math.max(c.avgTaken, 1))} darkMode={darkMode} />
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-2 border-t border-gray-600">
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Throws:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgThrows}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Vanishing Attacks:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgVanishingAttacks}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dragon Homings:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgDragonHoming}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Lightning Attacks:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgLightningAttacks}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Speed Impacts:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgSpeedImpacts}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Speed Impact Wins:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgSpeedImpactWins}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max Combo Hits:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgMaxCombo}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max Combo Damage:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgMaxComboDamage.toLocaleString()}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sparking Combo Hits:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgSparkingCombo}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Kills:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgKills}</strong>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Survival & Health and Special Abilities in a nested grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                              {/* Survival & Health */}
                              <div className={`rounded-lg p-3 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Heart className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                                  <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Survival & Health</h4>
                                </div>
                                <div className="space-y-2 text-sm mb-2">
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max Health:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgHPGaugeValueMax.toLocaleString()}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Health Remaining:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgHealth.toLocaleString()}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Survival Rate:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.survivalRate.toFixed(1)}%</strong>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-2 border-t border-gray-600">
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Guards:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgGuards}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Super Counters:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgSuperCounters}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Revenge Counters:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgRevengeCounters}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Z-Counters:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgZCounters}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Special Abilities */}
                              <div className={`rounded-lg p-3 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Zap className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                                  <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Special Abilities</h4>
                                </div>
                                <div className="space-y-2 text-sm mb-2">
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Super 1 Blasts:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgSPM1}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Super 2 Blasts:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgSPM2}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ultimate Blasts:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgUltimates}</strong>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-2 border-t border-gray-600">
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Skill 1 Usage:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgEXA1}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Skill 2 Usage:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgEXA2}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Charges:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgCharges}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sparkings:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgSparking}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ki Blasts:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgEnergyBlasts}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dragon Dash Mileage:</span>
                                    <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{char.avgDragonDashMileage}</strong>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Forms & Transformations */}
                          {char.hasMultipleForms && (
                            <div className={`rounded-lg p-3 ${
                              darkMode 
                                ? 'bg-yellow-900/20 border border-yellow-700' 
                                : 'bg-yellow-50 border border-yellow-200'
                            }`}>
                              <div className="flex items-center gap-2">
                                <Star className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                <span className={`text-sm font-semibold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Forms Used:</span>
                                {char.formHistory && (
                                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {char.formHistory}
                                  </div>
                                )}
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
                                {char.formStatsArray.map(f => f.name).join(', ')}
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
            )}
          </div>
        )}

        {/* Position-Based Performance Analysis */}
        {((mode === 'reference' && viewType === 'aggregated') || 
          (mode === 'manual' && viewType === 'aggregated' && manualFiles.filter(f => !f.error).length > 0)) && 
          Object.keys(positionData).length > 0 && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6 cursor-pointer" onClick={() => setSectionCollapsed(prev => ({...prev, position: !prev.position}))}>
              <div className="flex items-center gap-3">
                <Users className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Character Position Analysis</h2>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Performance breakdown by team position (Lead, Middle, Anchor)
                  </p>
                </div>
              </div>
              <button 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  darkMode 
                    ? 'bg-green-900 hover:bg-green-800 text-green-400' 
                    : 'bg-green-100 hover:bg-green-200 text-green-600'
                }`}
                title={sectionCollapsed.position ? "Expand section" : "Collapse section"}
              >
                {sectionCollapsed.position ? '+' : '−'}
              </button>
            </div>
            
            {!sectionCollapsed.position && (
            <div>
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
                            
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Damage</div>
                                <div className={`font-medium ${darkMode ? colors.dark : colors.light}`}>
                                  {formatNumber(Math.round(char.avgDamage))}
                                </div>
                              </div>
                              <div>
                                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Taken</div>
                                <div className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                  {formatNumber(Math.round(char.avgTaken))}
                                </div>
                              </div>
                              <div>
                                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Battle Time</div>
                                <div className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                  {char.avgBattleTime.toFixed(1)}s
                                </div>
                              </div>
                              <div>
                                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>DPS</div>
                                <div className={`font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                  {formatNumber(Math.round(char.avgDamage / char.avgBattleTime))}
                                </div>
                              </div>
                              <div>
                                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Efficiency</div>
                                <div className={`font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                  {(char.damageEfficiency).toFixed(1)}x
                                </div>
                              </div>
                              <div>
                                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Health</div>
                                <div className={`font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  {formatNumber(Math.round(char.avgHealth))}
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
          </div>
        )}

        {/* Meta Analysis Display */}
        {((mode === 'reference' && viewType === 'meta') || 
          (mode === 'manual' && viewType === 'meta' && manualFiles.filter(f => !f.error).length > 0)) && (
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
        {((mode === 'reference' && (analysisSelectedFilePath || selectedFilePath) && viewType === 'single') || 
          (mode === 'manual' && (((analysisSelectedFilePath && analysisFileContent) || (selectedFilePath && fileContent)) && viewType === 'single'))) && (
          <div className={`rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="relative mb-2">  
              <div className={`flex left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium mb-2 gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                <Search className="w-4 h-4" /> Match Selection
              </div>
              <input
                ref={headerInputRef}
                type="text"
                value={headerFileInput || ''}
                onChange={e => { setHeaderFileInput(e.target.value); setHeaderDropdownOpen(e.target.value.length > 0); setHeaderHighlightedIndex(-1); }}
                onKeyDown={e => handleHeaderKeyDown(e, (Array.isArray(fileContent) ? fileContent.filter(fc => fc.name) : (mode === 'manual' ? manualFiles.filter(f => !f.error).map(f => ({ name: f.name })) : [])))}
                placeholder="Search match to analyze..."
                className={`w-full pl-10 pr-10 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                  darkMode
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
                }`}
                onFocus={() => setHeaderDropdownOpen((headerFileInput || '').length > 0)}
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Match Analysis</h2>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Detailed breakdown of this battle</p>
                </div>
              </div>
              <div className="flex items-center gap-4 relative">
                {/* Top manual-file search removed — unified to the single selector below */}

                {/* Searchable input + dropdown for reference files */}
                {(mode === 'reference' || mode === 'manual') && (
                  <div className="flex items-center gap-3">
                    {false && (
                      <div ref={headerDropdownRef} style={{ maxHeight: '360px' }} className={`absolute z-20 mt-1 w-56 overflow-y-auto rounded-lg border shadow-lg ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}> 
                        {fileContent
                          .filter(fc => fc.name)
                          .filter(fc => getFileNameFromPath(fc.name).toLowerCase().includes((headerFileInput || '').toLowerCase()))
                          .map((fc, idx) => (
                            <button
                              key={fc.name}
                              onMouseEnter={() => setHeaderHighlightedIndex(idx)}
                              onClick={() => { setHeaderFileInput(getFileNameFromPath(fc.name)); handleHeaderFileSelect(fc.name); setHeaderDropdownOpen(false); setHeaderHighlightedIndex(-1); }}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                                headerHighlightedIndex === idx ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') : (darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100')
                              }`}
                            >
                              <span className="truncate">{getFileNameFromPath(fc.name)}</span>
                            </button>
                          ))}
                        {fileContent.filter(fc => fc.name).filter(fc => getFileNameFromPath(fc.name).toLowerCase().includes((headerFileInput || '').toLowerCase())).length === 0 && (
                          <div className={`px-3 py-2 text-sm ${darkMode ? 'bg-gray-800 text-gray-400' : 'text-gray-500'}`}>No files</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Match Outcome Summary */}
            {/* Floating dropdown portal (renders outside layout to avoid pushing content) */}
            {headerDropdownOpen && headerDropdownPos && createPortal(
              <div
                ref={headerDropdownRef}
                style={{ position: 'absolute', top: headerDropdownPos.top + 'px', left: headerDropdownPos.left + 'px', width: headerDropdownPos.width + 'px', zIndex: 9999, maxHeight: '360px', overflowY: 'auto' }}
                className={`rounded-lg border shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                {/* Combine manual or reference sources depending on mode */}
                {(mode === 'manual' ? manualFiles.filter(f => !f.error).map(f => ({ name: f.name })) : (Array.isArray(fileContent) ? fileContent.filter(fc => fc.name) : []) )
                  .filter(item => getFileNameFromPath(item.name).toLowerCase().includes((headerFileInput || '').toLowerCase()))
                  .map((item, idx) => (
                    <button
                      key={item.name}
                      onMouseEnter={() => setHeaderHighlightedIndex(idx)}
                      onClick={() => { setHeaderFileInput(getFileNameFromPath(item.name)); handleHeaderFileSelect(item.name); setHeaderDropdownOpen(false); setHeaderHighlightedIndex(-1); }}
                      className={`w-full bg-gray-700 text-left px-3 py-2 text-sm transition-colors ${
                        headerHighlightedIndex === idx ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') : (darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100')
                      }`}
                    >
                      <span className="truncate">{getFileNameFromPath(item.name)}</span>
                    </button>
                ))}
                {(mode === 'manual' ? manualFiles.filter(f => !f.error).map(f => ({ name: f.name })) : (Array.isArray(fileContent) ? fileContent.filter(fc => fc.name) : [] )).filter(item => getFileNameFromPath(item.name).toLowerCase().includes((headerFileInput || '').toLowerCase())).length === 0 && (
                  <div className={`px-3 py-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No files</div>
                )}
              </div>, document.body)
            }

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
                        
                        {/* Forms Used Display */}
                        {stats.formChangeHistory && (
                          <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div className={`p-3 rounded-lg ${
                              darkMode 
                                ? 'bg-yellow-900/20 border border-yellow-700' 
                                : 'bg-yellow-50 border border-yellow-200'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Star className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                <span className={`text-sm font-semibold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Forms Used</span>
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {stats.formChangeHistory}
                              </div>
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
                        
                        {/* Forms Used Display */}
                        {stats.formChangeHistory && (
                          <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div className={`p-3 rounded-lg ${
                              darkMode 
                                ? 'bg-yellow-900/20 border border-yellow-700' 
                                : 'bg-yellow-50 border border-yellow-200'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Star className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                <span className={`text-sm font-semibold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Forms Used</span>
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {stats.formChangeHistory}
                              </div>
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
          (mode === 'manual' && viewType === 'tables' && manualFiles.filter(f => !f.error).length > 0)) && (
          <div className="space-y-6">
            {/* Character Statistics Table */}
            {aggregatedData && Object.keys(aggregatedData).length > 0 && (
              <>
                {/* Excel Export Button */}
                <div className={`rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Export Data Tables
                      </h3>
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Download all data tables to Excel (.xlsx) with full formatting
                      </p>
                    </div>
                    <button
                      onClick={handleExcelExport}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl ${
                        darkMode 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      <Download size={20} />
                      Export to Excel
                    </button>
                  </div>
                </div>

                {/* Character Averages Table */}
                <div className={`rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="mb-4">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Character Performance Averages
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Aggregated statistics showing overall performance across all matches
                    </p>
                  </div>
                  <DataTable
                    data={prepareCharacterAveragesData(aggregatedData)}
                    columns={getCharacterAveragesTableConfig(darkMode).columns}
                    title="Character Performance Averages"
                    exportFileName={`character_averages_${new Date().toISOString().split('T')[0]}`}
                    onExport={handleCharacterAveragesExport}
                    darkMode={darkMode}
                    selectable={true}
                    onSelectionChange={(selectedRows) => {
                      console.log('Selected characters (averages):', selectedRows);
                    }}
                  />
                </div>

                {/* Match Details Table */}
                <div className={`rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="mb-4">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Individual Match Performance Details
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Per-match statistics for detailed analysis and trend identification
                    </p>
                  </div>
                  <DataTable
                    data={prepareMatchDetailsData(aggregatedData)}
                    columns={getMatchDetailsTableConfig(darkMode).columns}
                    title="Individual Match Performance Details"
                    exportFileName={`match_details_${new Date().toISOString().split('T')[0]}`}
                    onExport={handleMatchDetailsExport}
                    darkMode={darkMode}
                    selectable={true}
                    onSelectionChange={(selectedRows) => {
                      console.log('Selected match details:', selectedRows);
                    }}
                  />
                </div>
              </>
            )}

            {/* Position Analysis Table - DISABLED FOR NOW */}
            {/* {positionData && Object.keys(positionData).length > 0 && (
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
            )} */}

            {/* Meta Analysis Table - DISABLED FOR NOW */}
            {/* {aggregatedData && Object.keys(aggregatedData).length > 0 && (
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
            )} */}
          </div>
        )}

        {/* Team Rankings Display */}
        {((mode === 'reference' && viewType === 'teams') || 
          (mode === 'manual' && viewType === 'teams' && manualFiles.filter(f => !f.error).length > 0)) && 
          teamAggregatedData.length > 0 && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <Users className={`w-8 h-8 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Team Rankings</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Teams ranked by win rate from {mode === 'reference' ? 1 : manualFiles.filter(f => !f.error).length} battle file{(mode === 'reference' ? 1 : manualFiles.filter(f => !f.error).length) !== 1 ? 's' : ''}
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
                              team.winRate >= 50 ? 'text-yellow-400' :
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
                              className={`rounded-lg p-4 flex items-center justify-between cursor-pointer transition-colors ${
                                darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-100'
                              }
                              ${
                                darkMode ? 'bg-gray-600' : 'bg-white'
                              } rounded p-2 -m-2`}
                              onClick={() => toggleRow('character_performance', i)}
                            >
                              <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                Character Performances
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
                                  .sort((a, b) => b[1].performanceScore - a[1].performanceScore)
                                  .slice(0, 8)
                                  .map(([charName, stats]) => (
                                  <div key={charName} className={`p-3 rounded-lg ${
                                    darkMode ? 'bg-gray-600' : 'bg-white'
                                  } border ${darkMode ? 'border-gray-500' : 'border-gray-200'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                        {charName}
                                      </div>
                                      <div className={`text-sm font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                        Score: {Math.round(stats.performanceScore)}
                                      </div>
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
                                          Health Retention
                                        </div>
                                        <div className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                          {(stats.avgHealthRetention * 100).toFixed(1)}%
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
                              className={`rounded-lg p-4 flex items-center justify-between cursor-pointer transition-colors ${
                                darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-100'
                              }
                              ${
                                darkMode ? 'bg-gray-600' : 'bg-white'
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
                                  const h2hTotalHealthRemaining = h2hMatches.reduce((sum, match) => sum + match.healthRemaining, 0);
                                  const h2hTotalHealthMax = h2hMatches.reduce((sum, match) => sum + match.healthMax, 0);
                                  const h2hAvgDamageDealt = h2hMatches.length > 0 ? Math.round(h2hTotalDamageDealt / h2hMatches.length) : 0;
                                  const h2hAvgDamageTaken = h2hMatches.length > 0 ? Math.round(h2hTotalDamageTaken / h2hMatches.length) : 0;
                                  const h2hDamageEfficiency = h2hTotalDamageTaken > 0 ? (h2hTotalDamageDealt / h2hTotalDamageTaken).toFixed(2) : '∞';
                                  const h2hHealthRetention = h2hTotalHealthMax > 0 ? ((h2hTotalHealthRemaining / h2hTotalHealthMax) * 100).toFixed(1) : '0.0';
                                  
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
                                      
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
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
                                            Health Retention
                                          </div>
                                          <div className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                            {h2hHealthRetention}%
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

// Determine performance level for a value given a distribution of values.
// Returns one of: 'excellent', 'good', 'average', 'below', 'poor'
function getPerformanceLevel(value, allValues = []) {
  // Fallback simple thresholds when no distribution is provided
  if (!Array.isArray(allValues) || allValues.length === 0) {
    if (value >= 90) return 'excellent';
    if (value >= 75) return 'good';
    if (value >= 50) return 'average';
    if (value >= 25) return 'below-average';
    return 'poor';
  }

  // Create a sorted copy and compute percentile (higher is better)
  const sorted = [...allValues].slice().sort((a, b) => a - b);
  // If allValues are identical, avoid divide by zero and return average
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (max === min) return 'average';

  // Compute fraction of values less-or-equal to current value.
  // Higher fraction => better performance.
  const lessOrEqualCount = sorted.filter(v => v <= value).length;
  const frac = lessOrEqualCount / sorted.length;

  // percentile ranges: top 10% -> excellent, 70-90% -> good, 40-70% -> average,
  // 20-40% -> below-average, <20% -> poor
  if (frac >= 0.9) return 'excellent';
  if (frac >= 0.7) return 'good';
  if (frac >= 0.4) return 'average';
  if (frac >= 0.2) return 'below-average';
  return 'poor';
}

// Extract filename (without path or .json extension) from a given path or name
function getFileNameFromPath(pathOrName) {
  if (!pathOrName) return '';
  // If it's a full path, split by both / and \\ for windows paths
  const parts = pathOrName.split(/\\|\//g);
  const last = parts[parts.length - 1] || pathOrName;
  return last.replace(/\.json$/i, '');
}
