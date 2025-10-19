# Team Performance Matrix - Top 5 Aggregation Changes

## Overview
Modified the Team Performance Matrix to show Top 5 character totals instead of team-wide averages for most statistics. This provides a better representation of team strength by focusing on the best performers.

## Changes Made

### 1. Win Rate Column
- **Replaced**: "Primary Team" column
- **New**: "Win Rate" column showing team win percentage
- Calculated from all character match records where `won: true`

### 2. Top 5 Character Selection
Teams are now evaluated based on their **top 5 characters by Combat Performance Score**:
- Characters sorted by `combatPerformanceScore` (descending)
- Top 5 selected for aggregation
- Provides fair comparison across teams of different sizes

### 3. Changed from Averages to Top 5 Totals

The following fields now show **Top 5 Totals** instead of team averages:

#### Combat Performance
- ~~Avg Damage~~ → **Top 5 Total Damage**
- ~~Avg Taken~~ → **Top 5 Total Taken**
- ~~Efficiency~~ → **Top 5 Efficiency** (calculated as Top5Damage / Top5Taken)
- ~~DPS~~ → **Top 5 Total DPS**
- ~~Combat Score~~ → **Top 5 Total Combat Score**

#### Survival & Health
- ~~Avg Max HP~~ → **Top 5 Total Max HP**
- ~~Avg HP Left~~ → **Top 5 Total HP Left**
- ~~Avg Guards~~ → **Top 5 Total Guards**
- ~~Avg Revenge Counters~~ → **Top 5 Total Revenge Counters**
- ~~Avg Super Counters~~ → **Top 5 Total Super Counters**
- ~~Avg Z-Counters~~ → **Top 5 Total Z-Counters**

#### Special Abilities
- ~~Avg Super 1~~ → **Top 5 Total Super 1**
- ~~Avg Super 2~~ → **Top 5 Total Super 2**
- ~~Avg Skill 1~~ → **Top 5 Total Skill 1**
- ~~Avg Skill 2~~ → **Top 5 Total Skill 2**
- ~~Avg Ultimates~~ → **Top 5 Total Ultimates**
- ~~Avg Ki Blasts~~ → **Top 5 Total Ki Blasts**
- ~~Avg Charges~~ → **Top 5 Total Charges**
- ~~Avg Sparkings~~ → **Top 5 Total Sparkings**
- ~~Avg Dragon Dash Mileage~~ → **Top 5 Total Dragon Dash Mileage**

#### Combat Mechanics
- ~~Avg Throws~~ → **Top 5 Total Throws**
- ~~Avg Lightning~~ → **Top 5 Total Lightning**
- ~~Avg Vanishing~~ → **Top 5 Total Vanishing**
- ~~Avg Dragon Homing~~ → **Top 5 Total Dragon Homing**
- ~~Avg Speed Impacts~~ → **Top 5 Total Speed Impacts**

#### Build & Equipment
- ~~Avg Damage Capsules~~ → **Top 5 Total Damage Capsules**
- ~~Avg Defense Capsules~~ → **Top 5 Total Defense Capsules**
- ~~Avg Utility Capsules~~ → **Top 5 Total Utility Capsules**

### 4. Fields Unchanged (Still Team Averages)
- Avg Battle Time
- Total Kills (already a sum)
- Avg Kills
- HP Retention %
- Speed Impact Win Rate
- Avg Max Combo
- Avg Max Combo Damage
- Avg Sparking Combo
- Build Archetype (most common)
- Top Capsules (most common)
- Has Multiple Forms
- Form History

## Technical Implementation

### Files Modified

#### 1. `teamPerformanceMatrix.js`
- Added `sumTop5()` function to calculate totals for top 5 characters
- Modified `calculateTeamAggregates()` to:
  - Sort characters by combat score
  - Select top 5
  - Calculate win rate from match records
  - Use `sumTop5()` for specified fields
  - Maintain `weightedAverage()` for remaining fields

#### 2. `excelExport.js`
- Added `teamFieldMapping` object to map column keys to new aggregate field names
- Added `teamHeaderMapping` to update column headers for team rows
- Modified team row value generation to use mapped field names
- Updated column headers to show "Top 5" prefixes

### Example Calculation

For "Master and Student" team with characters sorted by combat score:
1. Kale Super Saiyan (Berserk) - Score: 1261.72
2. Goten Super Saiyan - Score: 584.39
3. Majuub (GT) - Score: 452.34
4. Gohan (Teen) Super Saiyan 2 - Score: 455.84
5. Vegeta (Super) - Score: 379.55

**Top 5 Total Damage** = Sum of (avgDamage × matchCount) for these 5 characters

This gives a much better representation of team strength than averaging across all 20+ characters on the roster.

## Benefits

1. **Better Team Comparison**: Top performers represent team strength better than team-wide averages
2. **Fairer Metrics**: Teams with large rosters aren't penalized by including rarely-used characters
3. **Strategic Insight**: Shows the actual combat power teams can bring to matches
4. **Win Rate**: Direct measure of team success
5. **Consistent Scaling**: Totals scale with match counts, showing sustained performance
