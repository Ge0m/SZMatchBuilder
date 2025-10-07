
import React, { useState, useMemo } from 'react';
import './App.css'; // We'll create this CSS file
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
  Star
} from 'lucide-react';

// Dynamically import all JSON files in BR_Data
const dataFiles = import.meta.glob('../BR_Data/*.json', { eager: true });
// Import characters.csv for key-to-name mapping
import charactersCSV from '../referencedata/characters.csv?raw';

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

function StatBar({ value, maxValue, type = 'damage', isInverse = false, label = '', icon: Icon = Target }) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  // For inverse stats (like damage taken), invert the visual representation
  const displayPercentage = isInverse ? 100 - percentage : percentage;
  
  const getColorClass = () => {
    switch (type) {
      case 'damage': return 'bg-red-500';
      case 'health': return 'bg-green-500';
      case 'special': return 'bg-purple-500';
      case 'ultimate': return 'bg-orange-500';
      case 'taken': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-gray-800">{formatNumber(value)}</span>
        <span className="text-xs text-gray-500">{displayPercentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getColorClass()}`}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>
    </div>
  );
}

function PerformanceIndicator({ value, allValues, type = 'damage', isInverse = false }) {
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  
  let level, colorClass, icon;
  if (isInverse) {
    // For inverse stats, lower values are better
    const range = maxValue - minValue;
    const normalizedValue = (value - minValue) / range;
    if (normalizedValue <= 0.2) {
      level = 'excellent';
      colorClass = 'bg-green-100 text-green-800 border-green-200';
      icon = <Star className="w-3 h-3" />;
    } else if (normalizedValue <= 0.4) {
      level = 'good';
      colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
      icon = <TrendingUp className="w-3 h-3" />;
    } else if (normalizedValue <= 0.6) {
      level = 'average';
      colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      icon = <Eye className="w-3 h-3" />;
    } else {
      level = 'below-average';
      colorClass = 'bg-red-100 text-red-800 border-red-200';
      icon = <Target className="w-3 h-3" />;
    }
  } else {
    level = getPerformanceLevel(value, maxValue);
    switch (level) {
      case 'excellent':
        colorClass = 'bg-green-100 text-green-800 border-green-200';
        icon = <Star className="w-3 h-3" />;
        break;
      case 'good':
        colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
        icon = <TrendingUp className="w-3 h-3" />;
        break;
      case 'average':
        colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
        icon = <Eye className="w-3 h-3" />;
        break;
      default:
        colorClass = 'bg-red-100 text-red-800 border-red-200';
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
  // Character name - use original form name if available, otherwise current form
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

function getAggregatedCharacterData(files, charMap) {
  const characterStats = {};
  
  files.forEach(file => {
    if (file.error) return;
    
    let characterRecord, characterIdRecord;
    if (file.content.BattleResults) {
      characterRecord = file.content.BattleResults.characterRecord;
      characterIdRecord = file.content.BattleResults.characterIdRecord;
    } else {
      characterRecord = file.content.characterRecord;
      characterIdRecord = file.content.characterIdRecord;
    }
    
    if (!characterRecord) return;
    
    Object.values(characterRecord).forEach(char => {
      const stats = extractStats(char, charMap);
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
          totalSpecial: 0,
          totalUltimates: 0,
          totalSkills: 0,
          totalKills: 0,
          matchCount: 0,
          allFormsUsed: new Set(), // Track all forms used across matches
          formStats: {} // Track per-form aggregated stats
        };
      }
      
      const charData = characterStats[aggregationKey];
      charData.totalDamage += stats.damageDone;
      charData.totalTaken += stats.damageTaken;
      charData.totalHealth += stats.hPGaugeValue;
      charData.totalSpecial += stats.specialMovesUsed;
      charData.totalUltimates += stats.ultimatesUsed;
      charData.totalSkills += stats.skillsUsed;
      charData.totalKills += stats.kills;
      charData.matchCount += 1;
      
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
            formData.totalSpecial += formNumCount.sPMCount || 0;
            formData.totalUltimates += formNumCount.uLTCount || 0;
            formData.totalSkills += formNumCount.eXACount || 0;
            formData.totalKills += formCount.killCount || 0;
            formData.matchCount += 1;
          }
        });
      }
    });
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
      avgSpecial: Math.round((char.totalSpecial / char.matchCount) * 10) / 10,
      avgUltimates: Math.round((char.totalUltimates / char.matchCount) * 10) / 10,
      avgSkills: Math.round((char.totalSkills / char.matchCount) * 10) / 10,
      avgKills: Math.round((char.totalKills / char.matchCount) * 10) / 10
    };
  }).sort((a, b) => b.totalDamage - a.totalDamage);
}


export default function App() {
  const [mode, setMode] = useState('reference'); // 'reference' or 'manual'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [viewType, setViewType] = useState('single'); // 'single' or 'aggregated'
  const [manualFiles, setManualFiles] = useState([]);
  // Expanded state for character rows: { [teamType_rowIndex]: bool }
  const [expandedRows, setExpandedRows] = useState({});

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
      setFileContent(null);
      setSelectedFile(null);
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

  // Handle single manual file selection
  const handleManualFileSelect = (fileName) => {
    const file = manualFiles.find(f => f.name === fileName);
    if (file && !file.error) {
      setFileContent(file.content);
      setSelectedFile(fileName);
    }
    setExpandedRows({});
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

  // Extract teams for single file view
  let p1Team = [], p2Team = [];
  let allCharKeys = [];
  if (characterRecord) {
    allCharKeys = Object.keys(characterRecord);
    const teams = getTeams(characterRecord);
    p1Team = teams.p1;
    p2Team = teams.p2;
  }

  // Team summaries for single file view
  const p1Summary = getTeamStats(p1Team, charMap);
  const p2Summary = getTeamStats(p2Team, charMap);

  // Aggregated data for reference mode
  const aggregatedData = useMemo(() => {
    if (mode === 'reference' && viewType === 'aggregated') {
      const allFiles = fileNames.map(fileName => {
        const fullPath = Object.keys(dataFiles).find((p) => p.endsWith(fileName));
        return fullPath ? { name: fileName, content: dataFiles[fullPath] } : { name: fileName, error: 'Not found' };
      });
      return getAggregatedCharacterData(allFiles, charMap);
    } else if (mode === 'manual' && manualFiles.length > 1) {
      return getAggregatedCharacterData(manualFiles, charMap);
    }
    return [];
  }, [mode, viewType, charMap, manualFiles]);

  // Helper to toggle expanded state
  const toggleRow = (teamType, idx) => {
    setExpandedRows(prev => ({ ...prev, [`${teamType}_${idx}`]: !prev[`${teamType}_${idx}`] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-600 to-purple-700 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Swords className="w-12 h-12 text-orange-600" />
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800">Dragon Ball Sparking Zero</h1>
              <h2 className="text-xl text-gray-600">Match Analyzer</h2>
            </div>
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
        
        {/* Mode Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-bold text-gray-800">Analysis Mode</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              mode === 'reference' 
                ? 'border-orange-500 bg-orange-50 text-orange-700' 
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
                ? 'border-orange-500 bg-orange-50 text-orange-700' 
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
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">View Type</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                viewType === 'single' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
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
                    <span className="font-semibold">Single Match Analysis</span>
                    <p className="text-sm opacity-75">Detailed view of one match</p>
                  </div>
                </div>
              </label>
              <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                viewType === 'aggregated' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
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
                    <span className="font-semibold">Aggregated Character Stats</span>
                    <p className="text-sm opacity-75">Combined data across matches</p>
                  </div>
                </div>
              </label>
            </div>

            {viewType === 'single' && (
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a test data file to analyze:
                </label>
                <select
                  value={selectedFile || ''}
                  onChange={e => handleSelect(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Choose a battle result file...</option>
                  {fileNames.map((file) => (
                    <option key={file} value={file}>{file}</option>
                  ))}
                </select>
              </div>
            )}

            {viewType === 'aggregated' && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">
                    Showing aggregated character performance across {fileNames.length} reference files
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Upload Mode */}
        {mode === 'manual' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-800">Upload JSON Battle Result Files</h3>
            </div>
            
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Click to upload JSON files or drag and drop</span>
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
                    <button 
                      onClick={() => setViewType('aggregated')}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-5 h-5" />
                      View Aggregated Stats
                    </button>
                    <select
                      value={selectedFile || ''}
                      onChange={e => handleManualFileSelect(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" disabled>Or analyze single file...</option>
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
        <div className="aggregated-container">
          <div className="aggregated-header">
            <h2 className="aggregated-title">📊 Aggregated Character Performance</h2>
            <p className="aggregated-subtitle">
              Data from {mode === 'reference' ? fileNames.length : manualFiles.filter(f => !f.error).length} files
            </p>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            {aggregatedData.map((char, i) => {
              const expanded = expandedRows[`agg_${i}`] || false;
              const allDamageValues = aggregatedData.map(c => c.totalDamage);
              const allDamageTakenValues = aggregatedData.map(c => c.totalTaken);
              const allAvgDamageValues = aggregatedData.map(c => c.avgDamage);
              const allAvgTakenValues = aggregatedData.map(c => c.avgTaken);
              const allAvgHealthValues = aggregatedData.map(c => c.avgHealth);
              
              return (
                <div key={i} className="character-card">
                  <div className="character-row" style={{ gridTemplateColumns: '2fr 1.2fr 1.2fr 1.2fr 1.2fr 1.2fr 1fr 1fr 1fr 1fr 1fr 0.5fr' }}>
                    <div>
                      <div className="character-name">
                        🥊 {char.name}
                        <PerformanceIndicator value={char.totalDamage} allValues={allDamageValues} />
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        📊 {char.matchCount} matches
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Total Damage</div>
                      <StatBar value={char.totalDamage} maxValue={Math.max(...allDamageValues)} type="damage" />
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Avg Damage</div>
                      <StatBar value={char.avgDamage} maxValue={Math.max(...allAvgDamageValues)} type="damage" />
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Total Taken</div>
                      <StatBar value={char.totalTaken} maxValue={Math.max(...allDamageTakenValues)} type="damage" isInverse={true} />
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Avg Taken</div>
                      <StatBar value={char.avgTaken} maxValue={Math.max(...allAvgTakenValues)} type="damage" isInverse={true} />
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Avg HP Left</div>
                      <StatBar value={char.avgHealth} maxValue={Math.max(...allAvgHealthValues)} type="health" />
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Kills</div>
                      <div className="stat-value">🏆 {char.totalKills}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Avg Kills</div>
                      <div className="stat-value">⚔️ {char.avgKills}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Avg Blasts</div>
                      <div className="stat-value">Blasts: {char.avgSpecial}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Avg Ults</div>
                      <div className="stat-value">Ults: {char.avgUltimates}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Avg Skills</div>
                      <div className="stat-value">Skills: {char.avgSkills}</div>
                    </div>
                    
                    <div>
                      <button 
                        onClick={() => toggleRow('agg', i)} 
                        className="expand-button"
                        title="View detailed stats"
                      >
                        {expanded ? '−' : '+'}
                      </button>
                    </div>
                  </div>
                  
                  {expanded && (
                    <div className="form-breakdown">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        
                        {/* Combat Performance */}
                        <div className="stat-section">
                          <h4>⚔️ Combat Performance</h4>
                          <div className="detailed-stats">
                            <div className="stat-row">
                              <span>Total Damage Dealt:</span>
                              <strong>{char.totalDamage.toLocaleString()}</strong>
                              <PerformanceIndicator value={char.totalDamage} allValues={allDamageValues} />
                            </div>
                            <div className="stat-row">
                              <span>Average Damage per Match:</span>
                              <strong>{char.avgDamage.toLocaleString()}</strong>
                            </div>
                            <div className="stat-row">
                              <span>Total Damage Taken:</span>
                              <strong>{char.totalTaken.toLocaleString()}</strong>
                              <PerformanceIndicator value={char.totalTaken} allValues={allDamageTakenValues} isInverse={true} />
                            </div>
                            <div className="stat-row">
                              <span>Average Damage Taken:</span>
                              <strong>{char.avgTaken.toLocaleString()}</strong>
                            </div>
                            <div className="stat-row">
                              <span>Damage Efficiency:</span>
                              <strong>{(char.totalDamage / Math.max(char.totalTaken, 1)).toFixed(2)}x</strong>
                            </div>
                          </div>
                        </div>

                        {/* Survival & Health */}
                        <div className="stat-section">
                          <h4>❤️ Survival & Health</h4>
                          <div className="detailed-stats">
                            <div className="stat-row">
                              <span>Average HP Remaining:</span>
                              <strong>{char.avgHealth.toLocaleString()}</strong>
                              <PerformanceIndicator value={char.avgHealth} allValues={allAvgHealthValues} />
                            </div>
                            <div className="stat-row">
                              <span>Survival Rate:</span>
                              <strong>{((char.avgHealth / 40000) * 100).toFixed(1)}%</strong>
                            </div>
                            <div className="stat-row">
                              <span>Total Eliminations:</span>
                              <strong>{char.totalKills} 🏆</strong>
                            </div>
                            <div className="stat-row">
                              <span>Average Kills per Match:</span>
                              <strong>{char.avgKills}</strong>
                            </div>
                            <div className="stat-row">
                              <span>Kill/Death Efficiency:</span>
                              <strong>{char.avgHealth > 0 ? '∞' : char.avgKills.toFixed(2)}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Special Abilities */}
                        <div className="stat-section">
                          <h4>✨ Special Abilities</h4>
                          <div className="detailed-stats">
                            <div className="stat-row">
                              <span>Total Blast Skills Used:</span>
                              <strong>{char.totalSpecial} Blasts</strong>
                            </div>
                            <div className="stat-row">
                              <span>Avg Blast Skills per Match:</span>
                              <strong>{char.avgSpecial}</strong>
                            </div>
                            <div className="stat-row">
                              <span>Total Ultimate Attacks:</span>
                              <strong>{char.totalUltimates} Ults</strong>
                            </div>
                            <div className="stat-row">
                              <span>Avg Ultimates per Match:</span>
                              <strong>{char.avgUltimates}</strong>
                            </div>
                            <div className="stat-row">
                              <span>Total Skills Used:</span>
                              <strong>{char.totalSkills} Skills</strong>
                            </div>
                            <div className="stat-row">
                              <span>Avg Skills per Match:</span>
                              <strong>{char.avgSkills}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Forms & Transformations */}
                        {char.hasMultipleForms && (
                          <div className="stat-section" style={{ gridColumn: '1 / -1' }}>
                            <h4>🔄 Form Breakdown</h4>
                            <table className="form-table">
                              <thead>
                                <tr>
                                  <th>Form</th>
                                  <th>Matches</th>
                                  <th>Total Damage</th>
                                  <th>Avg Damage</th>
                                  <th>Total Taken</th>
                                  <th>Avg Taken</th>
                                  <th>Avg HP</th>
                                  <th>Total Kills</th>
                                  <th>Avg Kills</th>
                                  <th>Avg Blasts</th>
                                  <th>Avg Ultimates</th>
                                  <th>Avg Skills</th>
                                </tr>
                              </thead>
                              <tbody>
                                {char.formStatsArray.map((formStat, idx) => (
                                  <tr key={idx}>
                                    <td><strong>🔥 {formStat.name}</strong></td>
                                    <td>{formStat.matchCount}</td>
                                    <td>{formStat.totalDamage.toLocaleString()}</td>
                                    <td>{formStat.avgDamage.toLocaleString()}</td>
                                    <td>{formStat.totalTaken.toLocaleString()}</td>
                                    <td>{formStat.avgTaken.toLocaleString()}</td>
                                    <td>{formStat.avgHealth.toLocaleString()}</td>
                                    <td>{formStat.totalKills}</td>
                                    <td>{formStat.avgKills}</td>
                                    <td>{formStat.avgSpecial}</td>
                                    <td>{formStat.avgUltimates}</td>
                                    <td>{formStat.avgSkills}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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

      {/* Single File Analysis Results */}
      {((mode === 'reference' && selectedFile && viewType === 'single') || 
        (mode === 'manual' && selectedFile && fileContent)) && (
        <div style={{ marginTop: '2rem' }}>
          <div className="aggregated-header">
            <h2 className="aggregated-title">🎯 Match Summary: {selectedFile}</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
              <div className={`win-indicator ${battleWinLose === 'Win' ? 'win' : 'loss'}`}>
                P1 Team: {battleWinLose === 'Win' ? '🏆 Win' : '💀 Loss'}
              </div>
              <div className={`win-indicator ${battleWinLose === 'Win' ? 'loss' : 'win'}`}>
                P2 Team: {battleWinLose === 'Win' ? '💀 Loss' : '🏆 Win'}
              </div>
            </div>
          </div>
          
          <div className="stats-grid">
            {/* P1 Team */}
            <div className="team-card">
              <div className="team-header">
                <h3 className="team-title">👤 P1 Team</h3>
                <div className={`win-indicator ${battleWinLose === 'Win' ? 'win' : 'loss'}`}>
                  {battleWinLose === 'Win' ? 'WINNER' : 'LOSER'}
                </div>
              </div>
              
              <div className="summary-stats">
                <div className="stat-item">
                  <div className="stat-value">{formatNumber(p1Summary.totalDamage)}</div>
                  <div className="stat-label">Total Damage</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatNumber(p1Summary.totalTaken)}</div>
                  <div className="stat-label">Damage Taken</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatNumber(p1Summary.totalHealth)}</div>
                  <div className="stat-label">HP Remaining</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{p1Summary.totalSpecial}</div>
                  <div className="stat-label">Blast Skills</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{p1Summary.totalUltimates}</div>
                  <div className="stat-label">Ultimates</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{p1Summary.totalSkills}</div>
                  <div className="stat-label">Skills</div>
                </div>
              </div>

              <h4 style={{ marginBottom: '1rem', color: '#333' }}>⚔️ Characters</h4>
              {p1Team.map((char, i) => {
                const stats = extractStats(char, charMap);
                const formHistory = Array.isArray(char.formChangeHistory) ? char.formChangeHistory : [];
                const originalForm = char.battlePlayCharacter?.originalCharacter?.key;
                const allForms = originalForm ? [originalForm, ...formHistory.map(f => f.key)] : [];
                const hasMultipleForms = allForms.length > 1;
                const expanded = expandedRows[`p1_${i}`] || false;
                const maxDamage = Math.max(...p1Team.map(c => extractStats(c, charMap).damageDone));
                
                let formStats = [];
                if (hasMultipleForms && fileContent && fileContent.characterIdRecord) {
                  formStats = allForms.map(formId => {
                    const rec = fileContent.characterIdRecord[`(Key="${formId}")`];
                    if (!rec) return null;
                    const name = charMap[formId] || formId;
                    const count = rec.battleCount || {};
                    const numCount = count.battleNumCount || {};
                    return {
                      name,
                      damageDone: count.givenDamage || 0,
                      damageTaken: count.takenDamage || 0,
                      hPGaugeValue: count.hPGaugeValue || 0,
                      specialMovesUsed: numCount.sPMCount || 0,
                      ultimatesUsed: numCount.uLTCount || 0,
                      skillsUsed: numCount.eXACount || 0,
                      kills: count.killCount || 0
                    };
                  }).filter(Boolean);
                }
                
                return (
                  <div key={i} className="character-card">
                    <div className="character-row">
                      <div className="character-name">{stats.name}</div>
                      <StatBar value={stats.damageDone} maxValue={maxDamage} type="damage" />
                      <StatBar value={stats.damageTaken} maxValue={maxDamage} type="damage" isInverse={true} />
                      <StatBar value={stats.hPGaugeValue} maxValue={40000} type="health" />
                      <div className="stat-value">Blasts: {stats.specialMovesUsed}</div>
                      <div className="stat-value">Ults: {stats.ultimatesUsed}</div>
                      <div className="stat-value">Skills: {stats.skillsUsed}</div>
                      <div className="stat-value">🏆 {stats.kills}</div>
                      <div>
                        {hasMultipleForms ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem' }}>{stats.formChangeHistory}</span>
                            <button 
                              onClick={() => toggleRow('p1', i)} 
                              className="expand-button"
                            >
                              {expanded ? '−' : '+'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.9rem', color: '#999' }}>
                            {stats.formChangeHistory || 'No forms'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {hasMultipleForms && expanded && (
                      <div className="form-breakdown">
                        <h4>🔄 Form History Breakdown</h4>
                        <table className="form-table">
                          <thead>
                            <tr>
                              <th>Form</th>
                              <th>Damage</th>
                              <th>Taken</th>
                              <th>HP Remaining</th>
                              <th>Blasts</th>
                              <th>Ultimates</th>
                              <th>Skills</th>
                              <th>Kills</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formStats.map((fs, idx) => (
                              <tr key={idx}>
                                <td><strong>{fs.name}</strong></td>
                                <td>{fs.damageDone.toLocaleString()}</td>
                                <td>{fs.damageTaken.toLocaleString()}</td>
                                <td>{fs.hPGaugeValue.toLocaleString()}</td>
                                <td>{fs.specialMovesUsed}</td>
                                <td>{fs.ultimatesUsed}</td>
                                <td>{fs.skillsUsed}</td>
                                <td>{fs.kills}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* P2 Team */}
            <div className="team-card">
              <div className="team-header">
                <h3 className="team-title">🤖 P2 Team</h3>
                <div className={`win-indicator ${battleWinLose === 'Win' ? 'loss' : 'win'}`}>
                  {battleWinLose === 'Win' ? 'LOSER' : 'WINNER'}
                </div>
              </div>
              
              <div className="summary-stats">
                <div className="stat-item">
                  <div className="stat-value">{formatNumber(p2Summary.totalDamage)}</div>
                  <div className="stat-label">Total Damage</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatNumber(p2Summary.totalTaken)}</div>
                  <div className="stat-label">Damage Taken</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatNumber(p2Summary.totalHealth)}</div>
                  <div className="stat-label">HP Remaining</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{p2Summary.totalSpecial}</div>
                  <div className="stat-label">Blast Skills</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{p2Summary.totalUltimates}</div>
                  <div className="stat-label">Ultimates</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{p2Summary.totalSkills}</div>
                  <div className="stat-label">Skills</div>
                </div>
              </div>

              <h4 style={{ marginBottom: '1rem', color: '#333' }}>⚔️ Characters</h4>
              {p2Team.map((char, i) => {
                const stats = extractStats(char, charMap);
                const formHistory = Array.isArray(char.formChangeHistory) ? char.formChangeHistory : [];
                const originalForm = char.battlePlayCharacter?.originalCharacter?.key;
                const allForms = originalForm ? [originalForm, ...formHistory.map(f => f.key)] : [];
                const hasMultipleForms = allForms.length > 1;
                const expanded = expandedRows[`p2_${i}`] || false;
                const maxDamage = Math.max(...p2Team.map(c => extractStats(c, charMap).damageDone));
                
                let formStats = [];
                if (hasMultipleForms && fileContent && fileContent.characterIdRecord) {
                  formStats = allForms.map(formId => {
                    const rec = fileContent.characterIdRecord[`(Key="${formId}")`];
                    if (!rec) return null;
                    const name = charMap[formId] || formId;
                    const count = rec.battleCount || {};
                    const numCount = count.battleNumCount || {};
                    return {
                      name,
                      damageDone: count.givenDamage || 0,
                      damageTaken: count.takenDamage || 0,
                      hPGaugeValue: count.hPGaugeValue || 0,
                      specialMovesUsed: numCount.sPMCount || 0,
                      ultimatesUsed: numCount.uLTCount || 0,
                      skillsUsed: numCount.eXACount || 0,
                      kills: count.killCount || 0
                    };
                  }).filter(Boolean);
                }
                
                return (
                  <div key={i} className="character-card">
                    <div className="character-row">
                      <div className="character-name">{stats.name}</div>
                      <StatBar value={stats.damageDone} maxValue={maxDamage} type="damage" />
                      <StatBar value={stats.damageTaken} maxValue={maxDamage} type="damage" isInverse={true} />
                      <StatBar value={stats.hPGaugeValue} maxValue={40000} type="health" />
                      <div className="stat-value">Blasts: {stats.specialMovesUsed}</div>
                      <div className="stat-value">Ults: {stats.ultimatesUsed}</div>
                      <div className="stat-value">Skills: {stats.skillsUsed}</div>
                      <div className="stat-value">🏆 {stats.kills}</div>
                      <div>
                        {hasMultipleForms ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem' }}>{stats.formChangeHistory}</span>
                            <button 
                              onClick={() => toggleRow('p2', i)} 
                              className="expand-button"
                            >
                              {expanded ? '−' : '+'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.9rem', color: '#999' }}>
                            {stats.formChangeHistory || 'No forms'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {hasMultipleForms && expanded && (
                      <div className="form-breakdown">
                        <h4>🔄 Form History Breakdown</h4>
                        <table className="form-table">
                          <thead>
                            <tr>
                              <th>Form</th>
                              <th>Damage</th>
                              <th>Taken</th>
                              <th>HP Remaining</th>
                              <th>Blasts</th>
                              <th>Ultimates</th>
                              <th>Skills</th>
                              <th>Kills</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formStats.map((fs, idx) => (
                              <tr key={idx}>
                                <td><strong>{fs.name}</strong></td>
                                <td>{fs.damageDone.toLocaleString()}</td>
                                <td>{fs.damageTaken.toLocaleString()}</td>
                                <td>{fs.hPGaugeValue.toLocaleString()}</td>
                                <td>{fs.specialMovesUsed}</td>
                                <td>{fs.ultimatesUsed}</td>
                                <td>{fs.skillsUsed}</td>
                                <td>{fs.kills}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
