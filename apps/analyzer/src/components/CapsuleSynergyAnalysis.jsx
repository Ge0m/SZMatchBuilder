/**
 * Capsule Meta Analysis - Individual Performance Component
 * Simplified from Phase 1.1 implementation
 * 
 * Shows individual capsule performance metrics only.
 * Synergy Pairs and Build Analyzer removed per November 6, 2025 plan.
 * 
 * Created: November 5, 2025
 * Updated: November 6, 2025
 */

import React, { useState, useEffect, useMemo } from 'react';
import { loadCapsuleData } from '../utils/capsuleDataProcessor.js';
import { calculateCapsulePerformance, calculateAIStrategyCapsuleCompatibility } from '../utils/capsuleSynergyCalculator.js';
import IndividualCapsulePerformance from './capsule-synergy/IndividualCapsulePerformance.jsx';
import capsulesCSV from '../../referencedata/capsules.csv?raw';

/**
 * Main Capsule Synergy Analysis Component
 */
export default function CapsuleSynergyAnalysis({ aggregatedData, darkMode = false }) {
  const [capsuleData, setCapsuleData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [aiCompatibilityData, setAiCompatibilityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [characterSearchTerm, setCharacterSearchTerm] = useState('');
  const [showCharacterDropdown, setShowCharacterDropdown] = useState(false);

  // Extract unique characters from aggregated data
  const availableCharacters = useMemo(() => {
    if (!aggregatedData || aggregatedData.length === 0) return [];
    const uniqueChars = new Set();
    aggregatedData.forEach(char => {
      if (char.name) uniqueChars.add(char.name);
    });
    return Array.from(uniqueChars).sort();
  }, [aggregatedData]);

  // Filter characters based on search term
  const filteredCharacters = useMemo(() => {
    if (!characterSearchTerm) return availableCharacters;
    const searchLower = characterSearchTerm.toLowerCase();
    return availableCharacters.filter(char => 
      char.toLowerCase().includes(searchLower)
    );
  }, [availableCharacters, characterSearchTerm]);

  // Toggle character selection
  const toggleCharacter = (character) => {
    setSelectedCharacters(prev => 
      prev.includes(character)
        ? prev.filter(c => c !== character)
        : [...prev, character]
    );
  };

  // Select all filtered characters
  const selectAllFiltered = () => {
    const newSelections = [...new Set([...selectedCharacters, ...filteredCharacters])];
    setSelectedCharacters(newSelections);
  };

  // Deselect all filtered characters
  const deselectAllFiltered = () => {
    setSelectedCharacters(prev => prev.filter(c => !filteredCharacters.includes(c)));
  };

  // Load and process capsule data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Load capsule definitions from imported CSV text
        const capsuleInfo = loadCapsuleData(capsulesCSV);
        setCapsuleData(capsuleInfo);

        // Calculate performance metrics if we have match data
        if (aggregatedData && Object.keys(aggregatedData).length > 0) {
          // Filter aggregated data by selected characters
          const filteredData = selectedCharacters.length > 0
            ? aggregatedData.filter(char => selectedCharacters.includes(char.name))
            : aggregatedData;

          // Individual capsule performance
          const performance = calculateCapsulePerformance(filteredData, capsuleInfo.capsuleMap);
          setPerformanceData(performance);

          // AI strategy compatibility
          const aiCompat = calculateAIStrategyCapsuleCompatibility(filteredData, capsuleInfo.capsuleMap);
          setAiCompatibilityData(aiCompat);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading capsule synergy data:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    loadData();
  }, [aggregatedData, selectedCharacters]);

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading capsule synergy data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 m-4">
        <h3 className="text-red-400 font-bold text-lg mb-2">Error Loading Data</h3>
        <p className="text-gray-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Render no data state
  if (!aggregatedData || Object.keys(aggregatedData).length === 0) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-6 m-4">
        <h3 className="text-yellow-400 font-bold text-lg mb-2">No Match Data</h3>
        <p className="text-gray-300">
          Upload battle result files to see capsule synergy analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="capsule-synergy-analysis">
      {/* Character Filter */}
      {availableCharacters.length > 0 && (
        <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Filter by Character(s)
            </label>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedCharacters.length > 0 
                  ? `${selectedCharacters.length} of ${availableCharacters.length} selected`
                  : `All ${availableCharacters.length} characters`
                }
              </span>
              {selectedCharacters.length > 0 && (
                <button
                  onClick={() => setSelectedCharacters([])}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    darkMode
                      ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Search characters..."
              value={characterSearchTerm}
              onChange={(e) => setCharacterSearchTerm(e.target.value)}
              onFocus={() => setShowCharacterDropdown(true)}
              className={`w-full px-3 py-2 pl-9 rounded border transition-colors ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              }`}
            />
            <svg className={`absolute left-3 top-2.5 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Selected Characters Pills - Scrollable */}
          {selectedCharacters.length > 0 && (
            <div className={`max-h-24 overflow-y-auto mb-3 p-2 rounded border ${
              darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'
            }`}>
              <div className="flex flex-wrap gap-2">
                {selectedCharacters.map(char => (
                  <span
                    key={char}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      darkMode
                        ? 'bg-blue-900/30 text-blue-300 border border-blue-600'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                    }`}
                  >
                    {char}
                    <button
                      onClick={() => toggleCharacter(char)}
                      className={`hover:text-red-500 transition-colors`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Character Dropdown */}
          {showCharacterDropdown && (
            <div className={`relative border rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`}>
              {/* Quick Actions */}
              <div className={`flex gap-2 p-2 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <button
                  onClick={selectAllFiltered}
                  className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${
                    darkMode
                      ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Select All {filteredCharacters.length < availableCharacters.length ? `(${filteredCharacters.length})` : ''}
                </button>
                <button
                  onClick={deselectAllFiltered}
                  className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${
                    darkMode
                      ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Deselect All {filteredCharacters.length < availableCharacters.length ? `(${filteredCharacters.length})` : ''}
                </button>
                <button
                  onClick={() => setShowCharacterDropdown(false)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    darkMode
                      ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Done
                </button>
              </div>

              {/* Character List - More Compact */}
              <div className="max-h-48 overflow-y-auto p-2">
                {filteredCharacters.length > 0 ? (
                  <div className="space-y-0.5">
                    {filteredCharacters.map(char => (
                      <label
                        key={char}
                        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                          darkMode
                            ? 'hover:bg-gray-600'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCharacters.includes(char)}
                          onChange={() => toggleCharacter(char)}
                          className="w-4 h-4 rounded"
                        />
                        <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                          {char}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No characters found matching "{characterSearchTerm}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Show/Hide Dropdown Button (when closed) */}
          {!showCharacterDropdown && (
            <button
              onClick={() => setShowCharacterDropdown(true)}
              className={`w-full px-3 py-2 text-sm rounded border transition-colors ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {selectedCharacters.length > 0 
                ? `Click to modify selection (${selectedCharacters.length} selected)`
                : 'Click to select characters'
              }
            </button>
          )}
        </div>
      )}

      {/* Individual Capsule Performance - Only Feature */}
      <div className="capsule-performance">
        <IndividualCapsulePerformance
          performanceData={performanceData}
          capsuleMap={capsuleData.capsuleMap}
          aiCompatibilityData={aiCompatibilityData}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
}
