import React from 'react';
import { formatNumber } from '../utils/formatters';
import { 
  Trophy, 
  Target, 
  Heart, 
  Clock, 
  Zap,
  Shield,
  Users,
  Swords,
  Activity,
  Sparkles,
  Package,
  GitBranch
} from 'lucide-react';

// Helper function to format time in mm:ss
function formatTime(seconds) {
  if (!seconds || seconds === 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==============================================================================
// CHARACTER PERFORMANCE AVERAGES TABLE CONFIGURATION
// ==============================================================================
// Purpose: High-level overview of each character's overall performance
// Structure: One row per character with aggregated/averaged statistics
// Total Columns: ~43 columns across 7 category groups
// ==============================================================================

export const getCharacterAveragesTableConfig = (darkMode = false) => ({
  title: 'Character Performance Averages',
  description: 'Aggregated statistics showing overall performance across all matches',
  
  columnGroups: [
    { name: 'Identity & Context', columns: ['name', 'primaryTeam', 'matchCount'] },
    { name: 'Combat Performance', columns: ['avgDamage', 'avgTaken', 'efficiency', 'dps', 'combatScore', 'avgBattleTime'] },
    { name: 'Survival & Health', columns: ['avgHPGaugeValueMax', 'avgHealth', 'healthRetention', 'survivalRate', 'avgGuards', 'avgRevengeCounters', 'avgSuperCounters', 'avgZCounters'] },
    { name: 'Special Abilities', columns: ['avgSPM1', 'avgSPM2', 'avgSkill1', 'avgSkill2', 'avgUltimates', 'avgEnergyBlasts', 'avgCharges', 'avgSparking', 'avgDragonDashMileage'] },
    { name: 'Combat Mechanics', columns: ['avgMaxCombo', 'avgMaxComboDamage', 'avgThrows', 'avgLightningAttacks', 'avgVanishingAttacks', 'avgDragonHoming', 'avgSpeedImpacts', 'speedImpactWinRate', 'avgSparkingCombo', 'totalKills', 'avgKills'] },
    { name: 'Build & Equipment', columns: ['buildArchetype', 'damageCapsules', 'defensiveCapsules', 'utilityCapsules', 'topCapsules', 'primaryAIStrategy'] },
    { name: 'Form Changes', columns: ['hasMultipleForms', 'formCount', 'formHistory'] }
  ],
  
  columns: [
    // ========================================================================
    // A. IDENTITY & CONTEXT (3 columns)
    // ========================================================================
    {
      key: 'name',
      header: 'Character Name',
      accessor: (row) => row.name,
      sortable: true,
      filterable: true,
      group: 'Identity & Context',
      exportFormat: { bold: true, alignment: 'left' },
      render: (row, value) => (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'primaryTeam',
      header: 'Primary Team',
      accessor: (row) => row.primaryTeam || 'Unknown',
      sortable: true,
      filterable: true,
      group: 'Identity & Context',
      exportFormat: { alignment: 'left' },
      render: (row, value) => (
        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'matchCount',
      header: 'Matches',
      accessor: (row) => row.matchCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Identity & Context',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="font-mono">{value}</span>
        </div>
      )
    },

    // ========================================================================
    // B. COMBAT PERFORMANCE (6 columns)
    // ========================================================================
    {
      key: 'avgDamage',
      header: 'Avg Damage',
      accessor: (row) => row.avgDamage,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Performance',
      exportFormat: { alignment: 'right', numFmt: '#,##0', dataBar: true },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Target className="w-4 h-4 text-red-500" />
          <span className="font-mono">{formatNumber(value)}</span>
        </div>
      )
    },
    {
      key: 'avgTaken',
      header: 'Avg Taken',
      accessor: (row) => row.avgTaken,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Performance',
      exportFormat: { alignment: 'right', numFmt: '#,##0' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="font-mono">{formatNumber(value)}</span>
        </div>
      )
    },
    {
      key: 'efficiency',
      header: 'Efficiency',
      accessor: (row) => row.avgTaken > 0 ? row.avgDamage / row.avgTaken : 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Performance',
      exportFormat: { alignment: 'right', numFmt: '0.00', iconSet: 'arrows' },
      render: (row, value) => (
        <span className={`font-mono ${
          value >= 2 ? 'text-green-600' : 
          value >= 1 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {value.toFixed(2)}×
        </span>
      )
    },
    {
      key: 'dps',
      header: 'DPS',
      accessor: (row) => row.avgBattleTime > 0 ? row.avgDamage / row.avgBattleTime : 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Performance',
      exportFormat: { alignment: 'right', numFmt: '0.0"/sec"' },
      render: (row, value) => (
        <span className="font-mono text-purple-600">
          {value.toFixed(1)}/sec
        </span>
      )
    },
    {
      key: 'combatScore',
      header: 'Combat Score',
      accessor: (row) => row.combatPerformanceScore,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Performance',
      exportFormat: { alignment: 'right', numFmt: '0', bold: true, colorScale: 'greenYellowRed' },
      render: (row, value) => (
        <span className="text-lg font-bold text-orange-600">
          {Math.round(value)}
        </span>
      )
    },
    {
      key: 'avgBattleTime',
      header: 'Avg Time',
      accessor: (row) => row.avgBattleTime,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Performance',
      exportFormat: { alignment: 'right', numFmt: '[mm]:ss' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="font-mono">{formatTime(value)}</span>
        </div>
      )
    },

    // ========================================================================
    // C. SURVIVAL & HEALTH (8 columns)
    // ========================================================================
    {
      key: 'avgHPGaugeValueMax',
      header: 'Max HP',
      accessor: (row) => row.avgHPGaugeValueMax,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '#,##0' },
      render: (row, value) => (
        <span className="font-mono text-gray-600">{formatNumber(value)}</span>
      )
    },
    {
      key: 'avgHealth',
      header: 'Avg HP Left',
      accessor: (row) => row.avgHealth,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '#,##0', colorScale: 'green' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="font-mono">{formatNumber(value)}</span>
        </div>
      )
    },
    {
      key: 'healthRetention',
      header: 'HP Retention %',
      accessor: (row) => row.avgHPGaugeValueMax > 0 ? (row.avgHealth / row.avgHPGaugeValueMax) * 100 : 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '0.0"%"', colorScale: 'redYellowGreen' },
      render: (row, value) => (
        <span className={`font-mono ${
          value >= 70 ? 'text-green-600' : 
          value >= 40 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {value.toFixed(1)}%
        </span>
      )
    },
    {
      key: 'survivalRate',
      header: 'Survival Rate %',
      accessor: (row) => row.survivalRate || 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '0.0"%"', iconSet: 'hearts' },
      render: (row, value) => (
        <span className={`font-mono font-bold ${
          value >= 80 ? 'text-green-600' : 
          value >= 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {value.toFixed(1)}%
        </span>
      )
    },
    {
      key: 'avgGuards',
      header: 'Avg Guards',
      accessor: (row) => row.avgGuards,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-blue-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgRevengeCounters',
      header: 'Avg Revenge Counters',
      accessor: (row) => row.avgRevengeCounters,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-purple-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgSuperCounters',
      header: 'Avg Super Counters',
      accessor: (row) => row.avgSuperCounters,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-indigo-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgZCounters',
      header: 'Avg Z-Counters',
      accessor: (row) => row.avgZCounters,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-cyan-600">{value.toFixed(1)}</span>
      )
    },

    // ========================================================================
    // D. SPECIAL ABILITIES (9 columns)
    // ========================================================================
    {
      key: 'avgSPM1',
      header: 'Avg Super 1',
      accessor: (row) => row.avgSPM1,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-orange-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgSPM2',
      header: 'Avg Super 2',
      accessor: (row) => row.avgSPM2,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-red-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgSkill1',
      header: 'Avg Skill 1',
      accessor: (row) => row.avgEXA1,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-purple-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgSkill2',
      header: 'Avg Skill 2',
      accessor: (row) => row.avgEXA2,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-pink-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgUltimates',
      header: 'Avg Ultimates',
      accessor: (row) => row.avgUltimates,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true, highlight: 'gold' },
      render: (row, value) => (
        <span className="font-mono font-bold text-yellow-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgEnergyBlasts',
      header: 'Avg Ki Blasts',
      accessor: (row) => row.avgEnergyBlasts,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-cyan-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgCharges',
      header: 'Avg Charges',
      accessor: (row) => row.avgCharges,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span className="font-mono">{value.toFixed(1)}</span>
        </div>
      )
    },
    {
      key: 'avgSparking',
      header: 'Avg Sparking',
      accessor: (row) => row.avgSparking,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0.0', highlight: 'gold', icon: 'spark' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-orange-500" />
          <span className="font-mono font-bold text-orange-600">{value.toFixed(1)}</span>
        </div>
      )
    },
    {
      key: 'avgDragonDashMileage',
      header: 'Avg Dragon Dash',
      accessor: (row) => row.avgDragonDashMileage,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0.0' },
      render: (row, value) => (
        <span className="font-mono text-gray-400">{value.toFixed(1)}</span>
      )
    },

    // ========================================================================
    // E. COMBAT MECHANICS (11 columns)
    // ========================================================================
    {
      key: 'avgMaxCombo',
      header: 'Avg Max Combo',
      accessor: (row) => row.avgMaxCombo,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0.0', dataBar: true },
      render: (row, value) => (
        <span className="font-mono text-purple-600 font-bold">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgMaxComboDamage',
      header: 'Avg Max Combo Dmg',
      accessor: (row) => row.avgMaxComboDamage,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '#,##0' },
      render: (row, value) => (
        <span className="font-mono text-purple-600">{formatNumber(value)}</span>
      )
    },
    {
      key: 'avgThrows',
      header: 'Avg Throws',
      accessor: (row) => row.avgThrows,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-gray-400">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgLightningAttacks',
      header: 'Avg Lightning',
      accessor: (row) => row.avgLightningAttacks,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-yellow-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgVanishingAttacks',
      header: 'Avg Vanishing',
      accessor: (row) => row.avgVanishingAttacks,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-blue-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgDragonHoming',
      header: 'Avg Dragon Homing',
      accessor: (row) => row.avgDragonHoming,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-indigo-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'avgSpeedImpacts',
      header: 'Avg Speed Impacts',
      accessor: (row) => row.avgSpeedImpacts,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0.0' },
      render: (row, value) => (
        <span className="font-mono text-red-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'speedImpactWinRate',
      header: 'Speed Impact Win %',
      accessor: (row) => row.avgSpeedImpacts > 0 ? (row.avgSpeedImpactWins / row.avgSpeedImpacts) * 100 : 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0.0"%"', trafficLights: true },
      render: (row, value) => (
        <span className={`font-mono ${
          value >= 70 ? 'text-green-600' : 
          value >= 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {value.toFixed(1)}%
        </span>
      )
    },
    {
      key: 'avgSparkingCombo',
      header: 'Avg Sparking Combo',
      accessor: (row) => row.avgSparkingCombo,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0.0', highlight: 'gold' },
      render: (row, value) => (
        <span className="font-mono text-orange-600 font-bold">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'totalKills',
      header: 'Total KOs',
      accessor: (row) => row.totalKills,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0', bold: true, icon: 'trophy' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="font-mono font-bold">{value}</span>
        </div>
      )
    },
    {
      key: 'avgKills',
      header: 'Avg KOs',
      accessor: (row) => row.avgKills,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0.0' },
      render: (row, value) => (
        <span className="font-mono text-yellow-600">{value.toFixed(1)}</span>
      )
    },

    // ========================================================================
    // F. BUILD & EQUIPMENT (7 columns)
    // ========================================================================
    {
      key: 'buildArchetype',
      header: 'Build Type',
      accessor: (row) => row.buildArchetype || 'No Build',
      sortable: true,
      filterable: true,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'center', colorCoded: true },
      render: (row, value) => {
        const colors = {
          'Aggressive': darkMode ? 'bg-red-900/30 text-red-300 border-red-600' : 'bg-red-100 text-red-700 border-red-300',
          'Defensive': darkMode ? 'bg-green-900/30 text-green-300 border-green-600' : 'bg-green-100 text-green-700 border-green-300',
          'Technical': darkMode ? 'bg-blue-900/30 text-blue-300 border-blue-600' : 'bg-blue-100 text-blue-700 border-blue-300',
          'Hybrid': darkMode ? 'bg-purple-900/30 text-purple-300 border-purple-600' : 'bg-purple-100 text-purple-700 border-purple-300',
          'No Build': darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-300'
        };
        return (
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${colors[value] || colors['No Build']}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'damageCapsules',
      header: 'Damage Caps',
      accessor: (row) => row.damageCapsules || 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-red-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'defensiveCapsules',
      header: 'Def Caps',
      accessor: (row) => row.defensiveCapsules || 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-green-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'utilityCapsules',
      header: 'Utility Caps',
      accessor: (row) => row.utilityCapsules || 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'right', numFmt: '0.0', heatmap: true },
      render: (row, value) => (
        <span className="font-mono text-blue-600">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'totalCapsuleCost',
      header: 'Capsule Cost',
      accessor: (row) => row.totalCapsuleCost || 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'right', numFmt: '$#,##0' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Package className="w-4 h-4 text-gray-500" />
          <span className="font-mono">{value}</span>
        </div>
      )
    },
    {
      key: 'topCapsules',
      header: 'Most Used Capsules',
      accessor: (row) => {
        if (!row.topCapsules || row.topCapsules.length === 0) return '';
        return row.topCapsules
          .slice(0, 3)
          .map(cap => cap.name)
          .join(', ');
      },
      sortable: false,
      filterable: false,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'left', wrapText: true, fontSize: 9 },
      render: (row, value) => (
        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ maxWidth: '200px', display: 'block' }}>
          {value || '—'}
        </span>
      )
    },
    {
      key: 'primaryAIStrategy',
      header: 'Primary AI Strategy',
      accessor: (row) => row.primaryAIStrategy || 'Unknown',
      sortable: true,
      filterable: true,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'left', badge: true },
      render: (row, value) => (
        <span className={`inline-block px-2 py-1 rounded text-xs ${
          darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
        }`}>
          {value}
        </span>
      )
    },

    // ========================================================================
    // G. FORM CHANGES (3 columns)
    // ========================================================================
    {
      key: 'hasMultipleForms',
      header: 'Multiple Forms',
      accessor: (row) => row.hasMultipleForms ? 'Yes' : 'No',
      sortable: true,
      filterable: true,
      group: 'Form Changes',
      exportFormat: { alignment: 'center', icon: 'checkmark' },
      render: (row, value) => (
        <span className={`text-center block ${value === 'Yes' ? 'text-green-600' : 'text-gray-400'}`}>
          {value === 'Yes' ? '✓' : '✗'}
        </span>
      )
    },
    {
      key: 'formCount',
      header: 'Form Count',
      accessor: (row) => row.allFormsUsed?.size || row.formStatsArray?.length || 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Form Changes',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <div className="flex items-center gap-1 justify-center">
          <GitBranch className="w-4 h-4 text-gray-500" />
          <span className="font-mono">{value}</span>
        </div>
      )
    },
    {
      key: 'formHistory',
      header: 'Form History',
      accessor: (row) => row.formHistory || '',
      sortable: false,
      filterable: false,
      group: 'Form Changes',
      exportFormat: { alignment: 'left', wrapText: true, italic: true, fontSize: 9 },
      render: (row, value) => (
        <span className={`text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ maxWidth: '250px', display: 'block' }}>
          {value || '—'}
        </span>
      )
    }
  ]
});

// ==============================================================================
// DATA PREPARATION FUNCTIONS
// ==============================================================================

/**
 * Prepares character averages data for table display
 * Transforms aggregatedData into table-ready format with all required columns
 * @param {Array} aggregatedData - Array of character objects with aggregated stats
 * @returns {Array} Formatted data ready for table rendering
 */
export const prepareCharacterAveragesData = (aggregatedData) => {
  if (!aggregatedData || !Array.isArray(aggregatedData)) return [];
  
  return aggregatedData.map(char => ({
    // Original data
    ...char,
    
    // Ensure all required fields exist with defaults
    name: char.name || 'Unknown',
    primaryTeam: char.primaryTeam || 'Unknown',
    primaryAIStrategy: char.primaryAIStrategy || 'Unknown',
    matchCount: char.matchCount || 0,
    
    // Combat Performance
    avgDamage: Math.round(char.avgDamage || 0),
    avgTaken: Math.round(char.avgTaken || 0),
    combatPerformanceScore: Math.round(char.combatPerformanceScore || 0),
    avgBattleTime: char.avgBattleTime || 0,
    
    // Survival & Health
    avgHPGaugeValueMax: Math.round(char.avgHPGaugeValueMax || 0),
    avgHealth: Math.round(char.avgHealth || 0),
    survivalRate: char.survivalRate || 0,
    avgGuards: char.avgGuards || 0,
    avgRevengeCounters: char.avgRevengeCounters || 0,
    avgSuperCounters: char.avgSuperCounters || 0,
    avgZCounters: char.avgZCounters || 0,
    
    // Special Abilities
    avgSPM1: char.avgSPM1 || 0,
    avgSPM2: char.avgSPM2 || 0,
    avgEXA1: char.avgEXA1 || 0,
    avgEXA2: char.avgEXA2 || 0,
    avgUltimates: char.avgUltimates || 0,
    avgEnergyBlasts: char.avgEnergyBlasts || 0,
    avgCharges: char.avgCharges || 0,
    avgSparking: char.avgSparking || 0,
    avgDragonDashMileage: char.avgDragonDashMileage || 0,
    
    // Combat Mechanics
    avgMaxCombo: char.avgMaxCombo || 0,
    avgMaxComboDamage: Math.round(char.avgMaxComboDamage || 0),
    avgThrows: char.avgThrows || 0,
    avgLightningAttacks: char.avgLightningAttacks || 0,
    avgVanishingAttacks: char.avgVanishingAttacks || 0,
    avgDragonHoming: char.avgDragonHoming || 0,
    avgSpeedImpacts: char.avgSpeedImpacts || 0,
    avgSpeedImpactWins: char.avgSpeedImpactWins || 0,
    avgSparkingCombo: char.avgSparkingCombo || 0,
    totalKills: char.totalKills || 0,
    avgKills: char.avgKills || 0,
    
    // Build & Equipment
    buildArchetype: char.primaryBuildArchetype || 'No Build',
    damageCapsules: char.avgDamageCaps || 0,
    defensiveCapsules: char.avgDefensiveCaps || 0,
    utilityCapsules: char.avgUtilityCaps || 0,
    totalCapsuleCost: char.avgCapsuleCost || 0,
    topCapsules: char.topCapsules || [],
    
    // Form Changes
    hasMultipleForms: char.hasMultipleForms || false,
    allFormsUsed: char.allFormsUsed || new Set(),
    formHistory: char.formHistory || '',
    formStatsArray: char.formStatsArray || [],
    
    // Keep matches for detailed capsule analysis
    matches: char.matches || []
  }));
};

// ==============================================================================
// MATCH DETAILS TABLE CONFIGURATION  
// ==============================================================================
// Purpose: Granular per-match data for deep-dive analysis
// Structure: Multiple rows per character (one row per match)
// Total Columns: ~59 columns across 7 category groups
// Supports up to 7 capsules per match
// ==============================================================================

export const getMatchDetailsTableConfig = (darkMode = false) => ({
  title: 'Individual Match Performance Details',
  description: 'Per-match statistics for detailed analysis and trend identification',
  
  columnGroups: [
    { name: 'Match Identity', columns: ['name', 'matchNumber', 'team', 'opponentTeam', 'matchResult', 'fileName'] },
    { name: 'Combat Performance', columns: ['damageDone', 'damageTaken', 'efficiency', 'dps', 'battleDuration', 'kills'] },
    { name: 'Survival & Health', columns: ['hpRemaining', 'hpMax', 'hpRetention', 'guards', 'revengeCounters', 'superCounters', 'zCounters'] },
    { name: 'Special Abilities', columns: ['spm1', 'spm2', 'skill1', 'skill2', 'ultimates', 'kiBlasts', 'charges', 'sparkings', 'dragonDashMileage'] },
    { name: 'Combat Mechanics', columns: ['maxComboHits', 'maxComboDamage', 'throws', 'lightningAttacks', 'vanishingAttacks', 'dragonHoming', 'speedImpacts', 'speedImpactWins', 'speedImpactWinRate', 'sparkingComboHits'] },
    { name: 'Build & Equipment', columns: ['buildArchetype', 'capsule1', 'capsule2', 'capsule3', 'capsule4', 'capsule5', 'capsule6', 'capsule7', 'totalCapsuleCost', 'damageCaps', 'defensiveCaps', 'utilityCaps', 'aiStrategy'] },
    { name: 'Form Changes', columns: ['startedAs', 'formsUsed', 'formChangeCount'] }
  ],
  
  columns: [
    // ========================================================================
    // A. MATCH IDENTITY (6 columns)
    // ========================================================================
    {
      key: 'name',
      header: 'Character',
      accessor: (row) => row.name,
      sortable: true,
      filterable: true,
      group: 'Match Identity',
      exportFormat: { bold: true, alignment: 'left' },
      render: (row, value) => (
        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'matchNumber',
      header: 'Match #',
      accessor: (row) => row.matchNumber,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Match Identity',
      exportFormat: { alignment: 'center', bgColor: 'E0E0E0' },
      render: (row, value) => (
        <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${
          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
        }`}>
          #{value}
        </span>
      )
    },
    {
      key: 'team',
      header: 'Team',
      accessor: (row) => row.team || 'Unknown',
      sortable: true,
      filterable: true,
      group: 'Match Identity',
      exportFormat: { alignment: 'left' },
      render: (row, value) => (
        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'opponentTeam',
      header: 'Opponent',
      accessor: (row) => row.opponentTeam || 'Unknown',
      sortable: true,
      filterable: true,
      group: 'Match Identity',
      exportFormat: { alignment: 'left' },
      render: (row, value) => (
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'matchResult',
      header: 'Result',
      accessor: (row) => row.matchResult,
      sortable: true,
      filterable: true,
      group: 'Match Identity',
      exportFormat: { alignment: 'center', conditional: true },
      render: (row, value) => {
        const isWin = value === 'Win' || value === 'W';
        return (
          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
            isWin 
              ? darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
              : darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
          }`}>
            {isWin ? '✓ W' : '✗ L'}
          </span>
        );
      }
    },
    {
      key: 'fileName',
      header: 'Source File',
      accessor: (row) => row.fileName || '',
      sortable: true,
      filterable: false,
      group: 'Match Identity',
      exportFormat: { alignment: 'left', fontSize: 8, color: '808080' },
      render: (row, value) => (
        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} style={{ fontSize: '10px' }}>
          {value}
        </span>
      )
    },

    // ========================================================================
    // B. COMBAT PERFORMANCE (6 columns)
    // ========================================================================
    {
      key: 'damageDone',
      header: 'Damage Done',
      accessor: (row) => row.damageDone,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Performance',
      exportFormat: { alignment: 'right', numFmt: '#,##0', heatmap: true },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Target className="w-4 h-4 text-red-500" />
          <span className="font-mono">{formatNumber(value)}</span>
        </div>
      )
    },
    {
      key: 'damageTaken',
      header: 'Damage Taken',
      accessor: (row) => row.damageTaken,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Performance',
      exportFormat: { alignment: 'right', numFmt: '#,##0', heatmap: true },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="font-mono">{formatNumber(value)}</span>
        </div>
      )
    },
    {
      key: 'efficiency',
      header: 'Efficiency',
      accessor: (row) => row.damageTaken > 0 ? row.damageDone / row.damageTaken : 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Performance',
      exportFormat: { alignment: 'right', numFmt: '0.00', iconSet: 'arrows' },
      render: (row, value) => (
        <span className={`font-mono ${
          value >= 2 ? 'text-green-600' : 
          value >= 1 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {value.toFixed(2)}×
        </span>
      )
    },
    {
      key: 'dps',
      header: 'DPS',
      accessor: (row) => row.battleTime > 0 ? row.damageDone / row.battleTime : 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Performance',
      exportFormat: { alignment: 'right', numFmt: '0.0"/sec"' },
      render: (row, value) => (
        <span className="font-mono text-purple-600">
          {value.toFixed(1)}/s
        </span>
      )
    },
    {
      key: 'battleDuration',
      header: 'Duration',
      accessor: (row) => row.battleTime,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Performance',
      exportFormat: { alignment: 'right', numFmt: '[mm]:ss' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="font-mono">{formatTime(value)}</span>
        </div>
      )
    },
    {
      key: 'kills',
      header: 'KOs',
      accessor: (row) => row.kills,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Performance',
      exportFormat: { alignment: 'right', numFmt: '0', icon: 'trophy' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="font-mono font-bold">{value}</span>
        </div>
      )
    },

    // ========================================================================
    // C. SURVIVAL & HEALTH (7 columns)
    // ========================================================================
    {
      key: 'hpRemaining',
      header: 'HP Left',
      accessor: (row) => row.hPGaugeValue,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '#,##0' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="font-mono">{formatNumber(value)}</span>
        </div>
      )
    },
    {
      key: 'hpMax',
      header: 'Max HP',
      accessor: (row) => row.hPGaugeValueMax,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '#,##0' },
      render: (row, value) => (
        <span className="font-mono text-gray-600">{formatNumber(value)}</span>
      )
    },
    {
      key: 'hpRetention',
      header: 'HP %',
      accessor: (row) => row.hPGaugeValueMax > 0 ? (row.hPGaugeValue / row.hPGaugeValueMax) * 100 : 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '0.0"%"', colorScale: 'redYellowGreen' },
      render: (row, value) => (
        <span className={`font-mono font-bold ${
          value >= 70 ? 'text-green-600' : 
          value >= 40 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {value.toFixed(1)}%
        </span>
      )
    },
    {
      key: 'guards',
      header: 'Guards',
      accessor: (row) => row.guardCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-blue-600">{value}</span>
      )
    },
    {
      key: 'revengeCounters',
      header: 'Revenge Counters',
      accessor: (row) => row.revengeCounterCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-purple-600">{value}</span>
      )
    },
    {
      key: 'superCounters',
      header: 'Super Counters',
      accessor: (row) => row.superCounterCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-indigo-600">{value}</span>
      )
    },
    {
      key: 'zCounters',
      header: 'Z-Counters',
      accessor: (row) => row.zCounterCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Survival & Health',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-cyan-600">{value}</span>
      )
    },

    // ========================================================================
    // D. SPECIAL ABILITIES (9 columns)
    // ========================================================================
    {
      key: 'spm1',
      header: 'Super 1',
      accessor: (row) => row.spm1Count,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-orange-600">{value}</span>
      )
    },
    {
      key: 'spm2',
      header: 'Super 2',
      accessor: (row) => row.spm2Count,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-red-600">{value}</span>
      )
    },
    {
      key: 'skill1',
      header: 'Skill 1',
      accessor: (row) => row.exa1Count,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-purple-600">{value}</span>
      )
    },
    {
      key: 'skill2',
      header: 'Skill 2',
      accessor: (row) => row.exa2Count,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-pink-600">{value}</span>
      )
    },
    {
      key: 'ultimates',
      header: 'Ultimates',
      accessor: (row) => row.uLTCount || row.ultCount || 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0', highlight: 'gold' },
      render: (row, value) => (
        <span className="font-mono font-bold text-yellow-600">{value}</span>
      )
    },
    {
      key: 'kiBlasts',
      header: 'Ki Blasts',
      accessor: (row) => row.shotEnergyBulletCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-cyan-600">{value}</span>
      )
    },
    {
      key: 'charges',
      header: 'Charges',
      accessor: (row) => row.chargeCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span className="font-mono">{value}</span>
        </div>
      )
    },
    {
      key: 'sparkings',
      header: 'Sparkings',
      accessor: (row) => row.sparkingCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0', highlight: 'gold', icon: 'spark' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-orange-500" />
          <span className="font-mono font-bold text-orange-600">{value}</span>
        </div>
      )
    },
    {
      key: 'dragonDashMileage',
      header: 'Dragon Dash',
      accessor: (row) => row.dragonDashMileage,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Special Abilities',
      exportFormat: { alignment: 'right', numFmt: '0.0' },
      render: (row, value) => (
        <span className="font-mono text-gray-400">{value.toFixed(1)}</span>
      )
    },

    // ========================================================================
    // E. COMBAT MECHANICS (10 columns)
    // ========================================================================
    {
      key: 'maxComboHits',
      header: 'Max Combo',
      accessor: (row) => row.maxComboNum,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0', dataBar: true },
      render: (row, value) => (
        <span className="font-mono text-purple-600 font-bold">{value}</span>
      )
    },
    {
      key: 'maxComboDamage',
      header: 'Max Combo Dmg',
      accessor: (row) => row.maxComboDamage,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '#,##0' },
      render: (row, value) => (
        <span className="font-mono text-purple-600">{formatNumber(value)}</span>
      )
    },
    {
      key: 'throws',
      header: 'Throws',
      accessor: (row) => row.throwCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-gray-400">{value}</span>
      )
    },
    {
      key: 'lightningAttacks',
      header: 'Lightning',
      accessor: (row) => row.lightningAttackCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-yellow-600">{value}</span>
      )
    },
    {
      key: 'vanishingAttacks',
      header: 'Vanishing',
      accessor: (row) => row.vanishingAttackCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-blue-600">{value}</span>
      )
    },
    {
      key: 'dragonHoming',
      header: 'Dragon Homing',
      accessor: (row) => row.dragonHomingCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-indigo-600">{value}</span>
      )
    },
    {
      key: 'speedImpacts',
      header: 'Speed Impacts',
      accessor: (row) => row.speedImpactCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-red-600">{value}</span>
      )
    },
    {
      key: 'speedImpactWins',
      header: 'Speed Impact Wins',
      accessor: (row) => row.speedImpactWins,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0', conditional: true },
      render: (row, value) => (
        <span className="font-mono text-green-600">{value}</span>
      )
    },
    {
      key: 'speedImpactWinRate',
      header: 'SI Win %',
      accessor: (row) => row.speedImpactCount > 0 ? (row.speedImpactWins / row.speedImpactCount) * 100 : 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0.0"%"', trafficLights: true },
      render: (row, value) => (
        <span className={`font-mono ${
          value >= 70 ? 'text-green-600' : 
          value >= 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {value.toFixed(1)}%
        </span>
      )
    },
    {
      key: 'sparkingComboHits',
      header: 'Sparking Combo',
      accessor: (row) => row.sparkingComboCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Combat Mechanics',
      exportFormat: { alignment: 'right', numFmt: '0', highlight: 'gold' },
      render: (row, value) => (
        <span className="font-mono text-orange-600 font-bold">{value}</span>
      )
    },

    // ========================================================================
    // F. BUILD & EQUIPMENT (13 columns - supports up to 7 capsules)
    // ========================================================================
    {
      key: 'buildArchetype',
      header: 'Build',
      accessor: (row) => row.buildArchetype || 'No Build',
      sortable: true,
      filterable: true,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'center', colorCoded: true },
      render: (row, value) => {
        const colors = {
          'Aggressive': darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700',
          'Defensive': darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700',
          'Technical': darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700',
          'Hybrid': darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700',
          'No Build': darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
        };
        return (
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colors[value] || colors['No Build']}`}>
            {value}
          </span>
        );
      }
    },
    // Capsule slots 1-7
    ...[1, 2, 3, 4, 5, 6, 7].map(num => ({
      key: `capsule${num}`,
      header: `Capsule ${num}`,
      accessor: (row) => {
        const capsules = row.equippedCapsules || [];
        return capsules[num - 1]?.capsule?.name || capsules[num - 1]?.id || '—';
      },
      sortable: false,
      filterable: false,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'left', wrapText: true, fontSize: 9 },
      render: (row, value) => (
        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ maxWidth: '150px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value}
        </span>
      )
    })),
    {
      key: 'totalCapsuleCost',
      header: 'Total Cost',
      accessor: (row) => row.totalCapsuleCost || 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'right', numFmt: '$#,##0' },
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Package className="w-4 h-4 text-gray-500" />
          <span className="font-mono">{value}</span>
        </div>
      )
    },
    {
      key: 'damageCaps',
      header: 'Dmg',
      accessor: (row) => row.capsuleTypes?.damage || 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-red-600 text-xs">{value}</span>
      )
    },
    {
      key: 'defensiveCaps',
      header: 'Def',
      accessor: (row) => row.capsuleTypes?.defensive || 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-green-600 text-xs">{value}</span>
      )
    },
    {
      key: 'utilityCaps',
      header: 'Util',
      accessor: (row) => row.capsuleTypes?.utility || 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <span className="font-mono text-blue-600 text-xs">{value}</span>
      )
    },
    {
      key: 'aiStrategy',
      header: 'AI Strategy',
      accessor: (row) => row.aiStrategy || 'Unknown',
      sortable: true,
      filterable: true,
      group: 'Build & Equipment',
      exportFormat: { alignment: 'left', badge: true },
      render: (row, value) => (
        <span className={`inline-block px-2 py-1 rounded text-xs ${
          darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
        }`}>
          {value}
        </span>
      )
    },

    // ========================================================================
    // G. FORM CHANGES (3 columns)
    // ========================================================================
    {
      key: 'formsUsed',
      header: 'Forms Used',
      accessor: (row) => {
        if (!row.formChangeHistory || row.formChangeHistory.length === 0) return '—';
        return row.formChangeHistory;
      },
      sortable: false,
      filterable: false,
      group: 'Form Changes',
      exportFormat: { alignment: 'left', wrapText: true, italic: true, fontSize: 9 },
      render: (row, value) => (
        <span className={`text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ maxWidth: '200px', display: 'block' }}>
          {value}
        </span>
      )
    },
    {
      key: 'formChangeCount',
      header: 'Form Changes',
      accessor: (row) => row.formChangeCount || 0,
      sortType: 'number',
      sortable: true,
      filterable: false,
      group: 'Form Changes',
      exportFormat: { alignment: 'right', numFmt: '0' },
      render: (row, value) => (
        <div className="flex items-center gap-1 justify-center">
          <GitBranch className="w-4 h-4 text-gray-500" />
          <span className="font-mono">{value}</span>
        </div>
      )
    },
    {
      key: 'startedAs',
      header: 'Started As',
      accessor: (row) => row.name, // In individual matches, name is the starting form
      sortable: false,
      filterable: false,
      group: 'Form Changes',
      exportFormat: { alignment: 'left', bold: true },
      render: (row, value) => (
        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </span>
      )
    }
  ]
});

// ==============================================================================
// DATA PREPARATION: Match Details
// ==============================================================================

export const prepareMatchDetailsData = (aggregatedData) => {
  if (!aggregatedData || !Array.isArray(aggregatedData)) return [];
  
  // Flatten: Each character's matches become individual rows
  const flattened = [];
  
  aggregatedData.forEach(char => {
    if (!char.matches || !Array.isArray(char.matches)) return;
    
    char.matches.forEach((match, index) => {
      flattened.push({
        // Match Identity
        name: char.name || 'Unknown',
        matchNumber: index + 1,
        team: match.team || char.primaryTeam || 'Unknown',
        opponentTeam: match.opponentTeam || 'Unknown',
        matchResult: match.won ? 'Win' : 'Loss',
        fileName: match.fileName || match.source || '',
        
        // Combat Performance
        damageDone: Math.round(match.damageDone || 0),
        damageTaken: Math.round(match.damageTaken || 0),
        battleTime: match.battleTime || 0,
        kills: match.kills || 0,
        
        // Survival & Health
        hPGaugeValue: match.hPGaugeValue || 0,
        hPGaugeValueMax: match.hPGaugeValueMax || 0,
        guardCount: match.guardCount || 0,
        revengeCounterCount: match.revengeCounterCount || 0,
        superCounterCount: match.superCounterCount || 0,
        zCounterCount: match.zCounterCount || 0,
        
        // Special Abilities
        spm1Count: match.spm1Count || 0,
        spm2Count: match.spm2Count || 0,
        exa1Count: match.exa1Count || 0,
        exa2Count: match.exa2Count || 0,
        uLTCount: match.ultimatesUsed || match.uLTCount || 0,
        ultCount: match.ultimatesUsed || match.uLTCount || 0,
        shotEnergyBulletCount: match.shotEnergyBulletCount || 0,
        chargeCount: match.chargeCount || 0,
        sparkingCount: match.sparkingCount || 0,
        dragonDashMileage: match.dragonDashMileage || 0,
        
        // Combat Mechanics
        maxComboNum: match.maxComboNum || 0,
        maxComboDamage: match.maxComboDamage || 0,
        throwCount: match.throwCount || 0,
        lightningAttackCount: match.lightningAttackCount || 0,
        vanishingAttackCount: match.vanishingAttackCount || 0,
        dragonHomingCount: match.dragonHomingCount || 0,
        speedImpactCount: match.speedImpactCount || 0,
        speedImpactWins: match.speedImpactWins || 0,
        sparkingComboCount: match.sparkingComboCount || 0,
        
        // Build & Equipment
        buildArchetype: match.buildArchetype || 'No Build',
        equippedCapsules: match.equippedCapsules || [],
        totalCapsuleCost: match.totalCapsuleCost || 0,
        capsuleTypes: match.capsuleTypes || { damage: 0, defensive: 0, utility: 0 },
        aiStrategy: match.aiStrategy || char.primaryAIStrategy || 'Unknown',
        
        // Form Changes
        formChangeHistory: match.formChangeHistory || '—',
        formChangeCount: match.formChangeCount || 0,
      });
    });
  });
  
  return flattened;
};

// ==============================================================================
// LEGACY TABLE CONFIGURATIONS (kept for backwards compatibility)
// ==============================================================================

export const getCharacterTableConfig = getCharacterAveragesTableConfig;

export const getPositionTableConfig = (darkMode = false) => ({
  columns: [
    {
      key: 'position',
      header: 'Position',
      accessor: (row) => row.position,
      sortable: true,
      filterable: true,
      render: (row, value) => {
        const colors = {
          'Lead': darkMode ? 'text-red-400 bg-red-900/20' : 'text-red-600 bg-red-50',
          'Middle': darkMode ? 'text-blue-400 bg-blue-900/20' : 'text-blue-600 bg-blue-50',
          'Anchor': darkMode ? 'text-green-400 bg-green-900/20' : 'text-green-600 bg-green-50'
        };
        return (
          <span className={`px-2 py-1 rounded text-sm font-medium ${colors[value] || 'text-gray-500'}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'name',
      header: 'Character',
      accessor: (row) => row.name,
      sortable: true,
      filterable: true,
      render: (row, value) => (
        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'matchCount',
      header: 'Matches',
      accessor: (row) => row.matchCount,
      sortType: 'number',
      sortable: true,
      filterable: false
    },
    {
      key: 'winRate',
      header: 'Win Rate',
      accessor: (row) => row.winRate,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <div className={`font-medium ${
          value >= 70 ? 'text-green-600' : 
          value >= 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {value}%
        </div>
      )
    },
    {
      key: 'avgDamage',
      header: 'Avg Damage',
      accessor: (row) => row.avgDamage,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => formatNumber(value)
    },
    {
      key: 'avgHealth',
      header: 'Avg HP Left',
      accessor: (row) => row.avgHealth,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-red-500" />
          <span>{formatNumber(value)}</span>
        </div>
      )
    },
    {
      key: 'avgBattleTime',
      header: 'Avg Time',
      accessor: (row) => row.avgBattleTime,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => `${value}s`
    },
    {
      key: 'avgKills',
      header: 'Avg KOs',
      accessor: (row) => row.avgKills,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span>{value.toFixed(1)}</span>
        </div>
      )
    },
    {
      key: 'avgSparking',
      header: 'Avg Sparking',
      accessor: (row) => row.avgSparking,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-orange-500" />
          <span>{value.toFixed(1)}</span>
        </div>
      )
    }
  ]
});

export const getMetaTableConfig = (darkMode = false) => ({
  columns: [
    {
      key: 'rank',
      header: 'Rank',
      accessor: (row, index) => index + 1,
      sortable: false,
      filterable: false,
      render: (row, value) => (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          value <= 3 
            ? 'bg-yellow-500 text-white' 
            : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
        }`}>
          {value}
        </div>
      )
    },
    {
      key: 'name',
      header: 'Capsule Name',
      accessor: (row) => row.name,
      sortable: true,
      filterable: true,
      render: (row, value) => (
        <div>
          <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </div>
          {row.type && (
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {row.type}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'usage',
      header: 'Usage Count',
      accessor: (row) => row.usage,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <span className="font-mono">{value}</span>
      )
    },
    {
      key: 'winRate',
      header: 'Win Rate',
      accessor: (row) => row.winRate,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <div className={`font-medium ${
          value >= 70 ? 'text-green-600' : 
          value >= 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {value}%
        </div>
      )
    },
    {
      key: 'characterCount',
      header: 'Characters',
      accessor: (row) => row.characterCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-500" />
          <span>{value}</span>
        </div>
      )
    }
  ]
});

// Helper function to prepare data for table display
export const prepareCharacterData = (aggregatedData) => {
  if (!aggregatedData) return [];
  
  return Object.values(aggregatedData).map(char => ({
    ...char,
    // Ensure all numeric values are properly formatted
    winRate: Math.round(char.winRate || 0),
    totalDamage: char.totalDamage || 0,
    avgDamage: Math.round(char.avgDamage || 0),
    totalDamageTaken: char.totalDamageTaken || 0,
    totalKills: char.totalKills || 0,
    avgBattleTime: Math.round(char.avgBattleTime || 0),
    totalSparking: char.totalSparking || 0,
    maxCombo: char.maxCombo || 0
  }));
};

export const preparePositionData = (positionData) => {
  if (!positionData) return [];
  
  const positions = ['Lead', 'Middle', 'Anchor'];
  const result = [];
  
  [1, 2, 3].forEach((position, index) => {
    const posData = positionData[position];
    if (posData?.sortedCharacters) {
      posData.sortedCharacters.forEach(char => {
        result.push({
          ...char,
          position: positions[index],
          winRate: Math.round(char.winRate || 0),
          avgDamage: Math.round(char.avgDamage || 0),
          avgHealth: Math.round(char.avgHealth || 0),
          avgBattleTime: Math.round(char.avgBattleTime || 0),
          avgKills: char.avgKills || 0,
          avgSparking: char.avgSparking || 0
        });
      });
    }
  });
  
  return result;
};

export const prepareMetaData = (metaData) => {
  if (!metaData?.topCapsules) return [];
  
  return metaData.topCapsules.map(capsule => ({
    ...capsule,
    winRate: Math.round(capsule.winRate || 0),
    usage: capsule.usage || 0,
    characterCount: capsule.characterCount || 0
  }));
};