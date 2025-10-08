import React from 'react';
import { formatNumber } from '../utils/formatters';
import { 
  Trophy, 
  Target, 
  Heart, 
  Clock, 
  Zap,
  Shield,
  Users
} from 'lucide-react';

// Table configuration for different data types
export const getCharacterTableConfig = (darkMode = false) => ({
  columns: [
    {
      key: 'name',
      header: 'Character',
      accessor: (row) => row.name,
      sortable: true,
      filterable: true,
      render: (row, value) => (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </span>
          {row.buildArchetype && (
            <span className={`text-xs px-2 py-1 rounded ${
              row.buildArchetype.includes('Aggressive') 
                ? darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                : darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
            }`}>
              {row.buildArchetype}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'matchCount',
      header: 'Matches',
      accessor: (row) => row.matchCount,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-500" />
          <span>{value}</span>
        </div>
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
      key: 'totalDamage',
      header: 'Total Damage',
      accessor: (row) => row.totalDamage,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Target className="w-4 h-4 text-red-500" />
          <span>{formatNumber(value)}</span>
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
      key: 'totalDamageTaken',
      header: 'Damage Taken',
      accessor: (row) => row.totalDamageTaken,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Shield className="w-4 h-4 text-blue-500" />
          <span>{formatNumber(value)}</span>
        </div>
      )
    },
    {
      key: 'totalKills',
      header: 'Total KOs',
      accessor: (row) => row.totalKills,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span>{value}</span>
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
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-500" />
          <span>{value}s</span>
        </div>
      )
    },
    {
      key: 'totalSparking',
      header: 'Sparking',
      accessor: (row) => row.totalSparking,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-orange-500" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'maxCombo',
      header: 'Max Combo',
      accessor: (row) => row.maxCombo,
      sortType: 'number',
      sortable: true,
      filterable: false,
      render: (row, value) => (
        <span className="font-mono text-purple-600">{value}</span>
      )
    }
  ]
});

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