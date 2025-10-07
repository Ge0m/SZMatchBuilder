import React, { useState } from 'react';
import { Upload, Trophy, Swords, Target, Zap, Clock, Heart, Shield } from 'lucide-react';

const MatchAnalyzer = () => {
  const [matchData, setMatchData] = useState(null);
  const [error, setError] = useState(null);

  const parseMatchData = (jsonText) => {
    try {
      // Find the start of the main JSON object (the one with battleWinLose)
      const battleWinLoseIndex = jsonText.indexOf('"battleWinLose"');
      
      if (battleWinLoseIndex === -1) {
        throw new Error('Could not find battle data in file');
      }
      
      // Search backwards to find the opening brace of this object
      let braceCount = 0;
      let startIndex = battleWinLoseIndex;
      
      for (let i = battleWinLoseIndex; i >= 0; i--) {
        if (jsonText[i] === '}') braceCount++;
        if (jsonText[i] === '{') {
          if (braceCount === 0) {
            startIndex = i;
            break;
          }
          braceCount--;
        }
      }
      
      // Search forwards to find the closing brace
      braceCount = 0;
      let endIndex = jsonText.length;
      
      for (let i = startIndex; i < jsonText.length; i++) {
        if (jsonText[i] === '{') braceCount++;
        if (jsonText[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      
      const matchJson = jsonText.substring(startIndex, endIndex);
      const data = JSON.parse(matchJson);
      setMatchData(data);
      setError(null);
    } catch (e) {
      setError('Failed to parse match data: ' + e.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      parseMatchData(text);
    } catch (e) {
      setError('Failed to read file: ' + e.message);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      parseMatchData(text);
    } catch (e) {
      setError('Failed to read file: ' + e.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const formatTime = (timeStr) => {
    const match = timeStr.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      return `${match[2]}:${match[3]}`;
    }
    return timeStr;
  };

  const getCharacterName = (key) => {
    const charMap = {
      '0000_00': 'Goku (Z - Early)',
      '0000_10': 'Goku (Z - Mid)',
      '0000_11': 'Goku (Z - Mid) Super Saiyan',
      '0000_20': 'Goku (Z - End)',
      '0000_21': 'Goku (Z - End) Super Saiyan',
      '0000_22': 'Goku (Z - End) Super Saiyan 2',
      '0000_23': 'Goku (Z - End) Super Saiyan 3',
      '0000_33': 'Goku (GT) Super Saiyan 4',
      '0000_40': 'Goku (Super)',
      '0000_41': 'Goku (Super) Super Saiyan',
      '0000_43': 'Goku (Super) Super Saiyan God Super Saiyan',
      '0000_50': 'Goku (Super) Ultra Instinct -Sign-',
      '0000_51': 'Goku (Super) Ultra Instinct',
      '0001_42': 'Goku (Super) Super Saiyan God',
      '0002_30': 'Goku (GT)',
      '0002_31': 'Goku (GT) Super Saiyan',
      '0002_32': 'Goku (GT) Super Saiyan 3',
      '0002_50': 'Goku (Teen)',
      '0020_00': 'Vegeta (Z - Scouter)',
      '0020_10': 'Vegeta (Z - Early)',
      '0020_11': 'Vegeta (Z - Early) Super Saiyan',
      '0020_30': 'Vegeta (Z - End)',
      '0020_31': 'Vegeta (Z - End) Super Saiyan',
      '0020_32': 'Vegeta (Z - End) Super Saiyan 2',
      '0020_40': 'Majin Vegeta',
      '0020_50': 'Vegeta (GT) Super Saiyan 4',
      '0020_60': 'Vegeta (Super)',
      '0020_61': 'Vegeta (Super) Super Saiyan',
      '0020_63': 'Vegeta (Super) Super Saiyan God Super Saiyan',
      '0021_20': 'Super Vegeta',
      '0022_62': 'Vegeta (Super) Super Saiyan God',
      '0023_00': 'Great Ape Vegeta',
      '0030_00': 'Gohan (Kid)',
      '0031_00': 'Gohan (Teen)',
      '0031_01': 'Gohan (Teen) Super Saiyan',
      '0031_02': 'Gohan (Teen) Super Saiyan 2',
      '0032_00': 'Gohan (Adult)',
      '0032_01': 'Gohan (Adult) Super Saiyan',
      '0032_02': 'Gohan (Adult) Super Saiyan 2',
      '0032_10': 'Great Saiyaman',
      '0032_20': 'Ultimate Gohan',
      '0032_30': 'Gohan (Future)',
      '0032_31': 'Gohan (Future) Super Saiyan',
      '0040_00': 'Piccolo',
      '0040_10': 'Piccolo (Fused with Kami)',
      '0040_20': 'Nail',
      '0050_00': 'Krillin',
      '0060_00': 'Yamcha',
      '0070_00': 'Tien',
      '0080_00': 'Trunks (Sword)',
      '0080_01': 'Trunks (Sword) Super Saiyan',
      '0080_10': 'Trunks (Melee)',
      '0080_11': 'Trunks (Melee) Super Saiyan',
      '0080_30': 'Future Trunks',
      '0080_31': 'Future Trunks Super Saiyan',
      '0081_20': 'Super Trunks',
      '0082_00': 'Trunks (Kid)',
      '0082_01': 'Trunks (Kid) Super Saiyan',
      '0090_00': 'Goten',
      '0090_01': 'Goten Super Saiyan',
      '0100_00': 'Vegito',
      '0100_01': 'Super Vegito',
      '0100_02': 'Vegito Super Saiyan God Super Saiyan',
      '0110_00': 'Gogeta (Super)',
      '0110_01': 'Gogeta (Super) Super Saiyan',
      '0110_02': 'Gogeta (GT) Super Saiyan 4',
      '0110_03': 'Gogeta (Super) Super Saiyan God Super Saiyan',
      '0110_04': 'Super Gogeta (Z)',
      '0120_00': 'Gotenks',
      '0120_01': 'Gotenks Super Saiyan',
      '0120_02': 'Gotenks Super Saiyan 3',
      '0130_00': 'Videl',
      '0140_00': 'Master Roshi',
      '0141_00': 'Master Roshi Full Power',
      '0150_00': 'Frieza (Z) 1st Form',
      '0151_00': 'Frieza (Z) 2nd Form',
      '0152_00': 'Frieza (Z) 3rd Form',
      '0153_00': 'Frieza (Z) 4th Form',
      '0153_10': 'Mecha Frieza',
      '0153_20': 'Frieza (Super)',
      '0154_00': 'Frieza (Z) Full Power',
      '0155_00': 'Golden Frieza',
      '0160_00': 'Cell 1st Form',
      '0161_00': 'Cell 2nd Form',
      '0162_00': 'Cell Perfect Form',
      '0162_01': 'Perfect Cell',
      '0163_00': 'Cell Jr.',
      '0170_00': 'Majin Buu',
      '0171_00': 'Majin Buu (Evil)',
      '0172_00': 'Super Buu',
      '0172_10': 'Super Buu (Gotenks Absorbed)',
      '0172_11': 'Super Buu (Gohan Absorbed)',
      '0173_00': 'Kid Buu',
      '0180_00': 'Mr. Satan',
      '0190_00': 'Chiaotzu',
      '0210_00': 'Yajirobe',
      '0230_00': 'Pan (GT)',
      '0240_00': 'Uub (GT)',
      '0240_01': 'Majuub (GT)',
      '0310_00': 'Bardock',
      '0320_00': 'Raditz',
      '0330_00': 'Saibaman',
      '0340_00': 'Nappa',
      '0350_00': 'Zarbon',
      '0351_00': 'Super Zarbon',
      '0360_00': 'Dodoria',
      '0370_00': 'Cui',
      '0380_00': 'Captain Ginyu',
      '0390_00': 'Recoome',
      '0400_00': 'Burter',
      '0410_00': 'Jeice',
      '0420_00': 'Guldo',
      '0430_00': 'King Cold',
      '0440_00': 'Android 16',
      '0450_00': 'Android 17 (Z)',
      '0450_10': 'Android 17 (Super)',
      '0460_00': 'Android 18',
      '0470_00': 'Android 19',
      '0480_00': 'Dr. Gero',
      '0490_00': 'Babidi',
      '0500_00': 'Dabura',
      '0540_00': 'Frieza Force Soldier',
      '0550_00': 'Broly (Z)',
      '0551_00': 'Broly (Z) Super Saiyan',
      '0552_00': 'Broly (Z) Legendary Super Saiyan',
      '0553_00': 'Broly (Super)',
      '0554_00': 'Broly (Super) Super Saiyan',
      '0555_00': 'Broly (Super) Super Saiyan (Full Power)',
      '0561_00': 'Super Garlic Jr.',
      '0570_00': 'Dr. Wheelo',
      '0580_00': 'Turles',
      '0590_00': 'Lord Slug',
      '0591_00': 'Lord Slug Giant Form',
      '0600_00': 'Cooler',
      '0600_10': 'Metal Cooler',
      '0601_00': 'Cooler Final Form',
      '0620_00': 'Android 13',
      '0621_00': 'Fusion Android 13',
      '0630_00': 'Bojack',
      '0631_00': 'Full-Power Bojack',
      '0650_00': 'Janemba',
      '0651_00': 'Super Janemba',
      '0660_00': 'Tapion',
      '0670_00': 'Hirudegarn',
      '0680_00': 'Baby Vegeta (GT)',
      '0680_01': 'Super Baby 1 (GT)',
      '0680_02': 'Super Baby 2 (GT)',
      '0681_00': 'Great Ape Baby (GT)',
      '0700_00': 'Syn Shenron (GT)',
      '0700_01': 'Omega Shenron (GT)',
      '0760_00': 'Spopovich',
      '0780_00': 'Beerus',
      '0790_00': 'Whis',
      '0800_00': 'Goku Black',
      '0800_01': 'Goku Black Super Saiyan Rosé',
      '0810_00': 'Zamasu',
      '0810_01': 'Fused Zamasu',
      '0811_00': 'Fused Zamasu Half-Corrupted',
      '0870_00': 'Hit',
      '0881_00': 'Frost',
      '0890_00': 'Cabba',
      '0890_01': 'Cabba Super Saiyan',
      '0890_02': 'Cabba Super Saiyan 2',
      '0900_00': 'Caulifla',
      '0900_02': 'Caulifla Super Saiyan 2',
      '0910_00': 'Kale',
      '0911_00': 'Kale Super Saiyan (Berserk)',
      '0912_00': 'Kale Super Saiyan',
      '0920_00': 'Kefla',
      '0920_01': 'Kefla Super Saiyan',
      '0920_02': 'Kefla Super Saiyan 2',
      '0930_00': 'Jiren',
      '0931_00': 'Jiren Full Power',
      '0940_00': 'Toppo',
      '0941_00': 'Toppo God of Destruction',
      '0950_00': 'Dyspo',
      '1190_00': 'Bergamo',
      '1321_00': 'Ribrianne',
      '1331_00': 'Kakunsa',
      '1341_00': 'Roasie',
      '1500_00': 'Anilaza',
      '3000_00': 'Gohan (Super Hero)',
      '3000_01': 'Gohan (Super Hero) Super Saiyan',
      '3000_02': 'Ultimate Gohan (Super Hero)',
      '3000_03': 'Gohan Beast',
      '3010_00': 'Piccolo (Super Hero)',
      '3010_01': 'Piccolo (Super Hero) Power Awakening',
      '3011_00': 'Orange Piccolo',
      '3012_00': 'Orange Piccolo Giant Form',
      '3020_00': 'Gamma 1',
      '3030_00': 'Gamma 2',
      '3040_00': 'Cell Max',
      '3050_00': 'Goku (Mini)',
      '3050_01': 'Goku (Mini) Super Saiyan',
      '3050_14': 'Goku (Mini) Super Saiyan 4',
      '3060_00': 'Vegeta (Mini)',
      '3060_01': 'Vegeta (Mini) Super Saiyan',
      '3060_02': 'Vegeta (Mini) Super Saiyan 2',
      '3060_03': 'Vegeta (Mini) Super Saiyan 3',
      '3070_00': 'Glorio',
      '3080_00': 'Third Eye Goham',
      '3100_03': 'Vegeta (Daima) Super Saiyan 3',
      '3110_00': 'Majin Kuu',
      '3120_04': 'Goku (Daima) Super Saiyan 4',
      '3130_00': 'Panzy',
      '3140_00': 'Majin Duu',
      '3150_00': 'Giant Gomah',
      '3160_00': 'Shallot'
    };
    return charMap[key] || key;
  };

  if (!matchData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-600 to-purple-700 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <Swords className="w-16 h-16 mx-auto mb-4 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Dragon Ball Sparking Zero
            </h1>
            <h2 className="text-xl text-gray-600 mb-6">Match Analyzer</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Click to upload match data (JSON)</span>
              <input 
                type="file" 
                className="hidden" 
                accept=".json,.txt"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  const characters = Object.entries(matchData.characterRecord || {});
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-600 to-purple-700 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className={`w-10 h-10 ${matchData.battleWinLose === 'Win' ? 'text-yellow-500' : 'text-gray-400'}`} />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Match Result</h1>
                <p className={`text-xl font-semibold ${matchData.battleWinLose === 'Win' ? 'text-green-600' : 'text-red-600'}`}>
                  {matchData.battleWinLose}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setMatchData(null)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Load New Match
            </button>
          </div>
        </div>

        {/* Character Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {characters.map(([key, charData], idx) => {
            const char = charData.battlePlayCharacter;
            const stats = charData.battleCount;
            const charName = getCharacterName(char.character.key);
            const isWinner = char.hPGaugeValue > 0;
            
            return (
              <div key={idx} className={`bg-white rounded-2xl shadow-xl p-6 ${isWinner ? 'ring-4 ring-green-500' : 'opacity-90'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{charName}</h2>
                    <p className="text-sm text-gray-600">{char.character.key}</p>
                    <p className="text-xs text-gray-500">Costume: {char.costume.key}</p>
                  </div>
                  {isWinner && <Trophy className="w-8 h-8 text-yellow-500" />}
                </div>

                {/* HP Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      HP
                    </span>
                    <span>{char.hPGaugeValue.toLocaleString()} / {char.hPGaugeValueMax.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full ${char.hPGaugeValue > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${(char.hPGaugeValue / char.hPGaugeValueMax) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600">Damage Dealt</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600">{stats.givenDamage.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-red-600" />
                      <span className="text-xs text-gray-600">Damage Taken</span>
                    </div>
                    <p className="text-xl font-bold text-red-600">{stats.takenDamage.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-gray-600">Max Combo</span>
                    </div>
                    <p className="text-xl font-bold text-purple-600">{stats.maxComboNum}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-xs text-gray-600">Battle Time</span>
                    </div>
                    <p className="text-lg font-bold text-orange-600">{formatTime(stats.battleTime)}</p>
                  </div>
                </div>

                {/* Battle Stats */}
                <div className="space-y-2 text-sm">
                  <h3 className="font-bold text-gray-700 mb-2">Battle Statistics</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kills:</span>
                      <span className="font-semibold">{stats.killCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Combo DMG:</span>
                      <span className="font-semibold">{stats.maxComboDamage.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sparking Count:</span>
                      <span className="font-semibold">{stats.battleNumCount.sparkingCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Guard Count:</span>
                      <span className="font-semibold">{stats.battleNumCount.guardCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Super Counter:</span>
                      <span className="font-semibold">{stats.battleNumCount.superCounterCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Crash Impact:</span>
                      <span className="font-semibold">{stats.battleNumCount.crashImpactCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ULT Count:</span>
                      <span className="font-semibold">{stats.battleNumCount.uLTCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SPM Count:</span>
                      <span className="font-semibold">{stats.battleNumCount.sPMCount || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Character State */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Blast Stock:</span>
                    <span className="font-semibold">{char.blastStockCount}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">SP Gauge:</span>
                    <span className="font-semibold">{Math.round(char.sPGaugeValue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold">{char.bKnockDown ? 'KO' : 'Standing'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Match Details */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Match Details</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Map:</span>
              <span className="ml-2 font-semibold">{matchData.originalMap?.key || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-gray-600">Finish Type:</span>
              <span className="ml-2 font-semibold">{matchData.battleSettleTransitionType}</span>
            </div>
            <div>
              <span className="text-gray-600">Finishing Move:</span>
              <span className="ml-2 font-semibold">{matchData.battleFinishBlast?.key || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Special Fate:</span>
              <span className="ml-2 font-semibold">{matchData.bSpecialFatePreBattleProduction ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-gray-600">Dramatic Finish:</span>
              <span className="ml-2 font-semibold">{matchData.bDramaticFinish ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-gray-600">Finishing Character:</span>
              <span className="ml-2 font-semibold">{getCharacterName(matchData.battleFinishCharacterId?.key)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchAnalyzer;