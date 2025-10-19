# Team Performance Matrix - Implementation Guide

## 📊 Overview

The **Team Performance Matrix** is a hierarchical pivot table that provides team-level insights with drill-down capability to individual character performance. It combines all statistics from the Character Averages sheet with intelligent aggregation at the team level.

## 🎯 Features

### Structure
```
Sheet: "Team Performance Matrix"

Row 1: Group Headers (merged cells, color-coded)
Row 2: Column Headers (same as Character Averages)
Row 3+: Team → Character hierarchy

Example:
┌─────────────────────────────────────────────────────┐
│ TEAM: Z-Fighters    | 45 | 52,340 | 38,120 | 1.37  │
│   Goku              | 12 | 55,200 | 35,400 | 1.56  │
│   Vegeta            | 10 | 58,100 | 36,200 | 1.60  │
│   Gohan             |  8 | 48,900 | 42,500 | 1.15  │
├─────────────────────────────────────────────────────┤
│ TEAM: Saiyans       | 32 | 49,800 | 40,100 | 1.24  │
│   Goku SSB          |  9 | 62,300 | 38,900 | 1.60  │
│   Vegeta SSB        |  7 | 60,100 | 39,200 | 1.53  │
└─────────────────────────────────────────────────────┘
```

### Team Row Formatting
- **Dark Maroon Background** (#7F1D1D - Tailwind red-900)
- **White Bold Text** (11pt)
- **Height:** 22px (taller than character rows)
- **Prefix:** "TEAM: [Name]"
- **Borders:** Medium top/bottom, thin sides
- **No Conditional Formatting:** Team rows maintain solid maroon color

### Character Row Formatting
- **Normal Background** (alternating gray on even rows within team)
- **Black Text** (10pt)
- **Height:** 18px
- **Indent:** Two spaces before name
- **Borders:** Thin white borders
- **Conditional Formatting:** Applied per team group (see below)

### Row Grouping (Collapsible)
- **Excel Outline Level 1** applied to character rows
- Click [-] next to team name to collapse characters
- Click [+] to expand
- Shows only team summaries when collapsed

## 📈 Aggregation Logic

### Team-Level Statistics

#### Totals (Sum)
- `matchCount` - Total matches across all characters
- `totalKills` - Sum of all character kills

#### Weighted Averages (by Match Count)
Used for most numeric statistics to properly weight characters with more matches:

```javascript
weighted_avg = Σ(character_value × character_matches) / Σ(character_matches)
```

**Applied to:**
- Combat Performance: avgDamage, avgTaken, dps, combatScore, avgBattleTime, avgKills
- Survival & Health: avgHealth, avgHPGaugeValueMax, hpRetention, avgGuards, avgRevengeCounters, avgSuperCounters, avgZCounters
- Special Abilities: avgSPM1, avgSPM2, avgSkill1, avgSkill2, avgUltimates, avgEnergyBlasts, avgCharges, avgSparking, avgDragonDashMileage
- Combat Mechanics: avgMaxCombo, avgMaxComboDamage, avgThrows, avgLightningAttacks, avgVanishingAttacks, avgDragonHoming, avgSpeedImpacts, speedImpactWinRate, avgSparkingCombo

#### Calculated Values
- `efficiency` - Calculated as `avgDamage / avgTaken` from team aggregates
- `combatScore` - Fixed: Now uses correct field name `combatPerformanceScore`
- `dps` - Weighted average of character DPS values

#### Most Common Value
- `buildArchetype` - Most frequently used build across team characters
- Falls back to "Mixed" if no clear winner

#### Combined Lists
- `topCapsules` - Top 3 most-used capsules across all team characters
- `formHistory` - All unique forms used by any character on the team

#### Boolean Aggregate
- `hasMultipleForms` - "Yes" if ANY character on team has multiple forms, else "No"

## 🎨 Formatting Features

### All Standard Features Applied
- ✅ Freeze panes (first column + first 2 rows)
- ✅ Auto-filter on column headers
- ✅ **Team-scoped conditional formatting** (characters compared within their own team)
- ✅ Duration indicators (▲▲ ▲ ◆ ▼ ▼▼)
- ✅ White borders on all cells
- ✅ Number formatting (commas, percentages, time)
- ✅ Named range: `TeamPerformanceMatrixData`

### Team-Specific Formatting
- **Team rows:** Dark maroon background, NO conditional formatting applied
- **Character rows:** Conditional formatting scoped to team group (not global)
- **Alternating rows:** Within each team group (gray/white pattern)

### Team-Scoped Conditional Formatting

**Key Feature:** Characters are compared only to their teammates, not to the entire dataset.

**How it works:**
```
Team: Z-Fighters
├─ Character A: 50,000 damage
├─ Character B: 60,000 damage  ← Darkest color in team (highest)
└─ Character C: 55,000 damage  ← Medium color in team

Team: Saiyans  
├─ Character D: 45,000 damage  ← Darkest color in team (highest)
└─ Character E: 40,000 damage  ← Lighter color in team (lowest)
```

**Benefits:**
- Identify top performers **within each team**
- See which characters carry vs underperform relative to teammates
- Fair comparison for mixed-power teams
- Each team has its own color gradient range

**Color Scales (Applied Per Team):**
- **Combat Performance:** Red (low) → White (mid) → Blue (high)
- **Survival & Health:** White (low) → Green (high)
- **Special Abilities:** White (low) → Purple (high)
- **Combat Mechanics:** White (low) → Peach (high)

## 💡 Use Cases

### 1. Team Comparison
- Quickly see which teams perform best overall
- Compare damage output, survivability, efficiency across teams
- Identify strongest and weakest team compositions

### 2. Character Context
- Understand individual character performance within team context
- See if certain characters carry their team's stats
- Identify balanced vs top-heavy teams

### 3. Build Strategy Analysis
- See which build archetypes dominate each team
- Compare capsule usage patterns across teams
- Identify team-specific equipment strategies

### 4. Drill-Down Analysis
- Start with high-level team view (collapsed)
- Expand specific teams for character details
- Collapse again for clean summary view

## 🔧 Technical Implementation

### Files Modified
1. **`src/utils/excelExport.js`**
   - Added `generateTeamPerformanceMatrix()` function
   - Added `applyTeamMatrixFormatting()` function
   - Updated main export to include Team Matrix sheet

2. **`src/utils/teamPerformanceMatrix.js`** (NEW)
   - `processTeamGroups()` - Groups characters by team
   - `calculateTeamAggregates()` - Computes team-level stats
   - Helper functions for weighted averages, sums, most common values

### Data Flow
```
characterData (array)
    ↓
processTeamGroups()
    ↓
teamGroups (array of objects)
    ├─ teamName
    ├─ totalMatches
    ├─ characters (array)
    └─ aggregates (object)
    ↓
generateTeamPerformanceMatrix()
    ↓
Excel Sheet with hierarchical rows
```

### Row Metadata
Custom properties added to Excel rows for formatting logic:
- `row._isTeamRow = true` - Marks team summary rows
- `row._teamName = "Z-Fighters"` - Team identifier
- `row._isCharacterRow = true` - Marks character detail rows
- `row._parentTeam = "Z-Fighters"` - Links character to team

## 📊 Statistics Validation

### Weighted Average Example
```
Team: Z-Fighters
├─ Goku: 55,000 damage (12 matches)
├─ Vegeta: 58,000 damage (10 matches)
└─ Gohan: 48,000 damage (8 matches)

Team Avg Damage = (55,000×12 + 58,000×10 + 48,000×8) / (12+10+8)
                = (660,000 + 580,000 + 384,000) / 30
                = 1,624,000 / 30
                = 54,133

This properly weights Goku's performance (more matches) over Gohan's.
```

### Simple Average (Incorrect) Example
```
Team Avg Damage = (55,000 + 58,000 + 48,000) / 3
                = 161,000 / 3
                = 53,667

This incorrectly gives equal weight to all characters regardless of match count.
```

## 🎯 User Experience

### Initial View
- All teams visible with summary rows
- Characters collapsed under teams
- Clean, scannable overview
- Sort and filter available

### Interaction
1. **Click [-] to collapse** team's characters
   - Shows only "TEAM: [Name]" row
   - Hides all character rows beneath
   - Reduces visual clutter

2. **Click [+] to expand** team's characters
   - Shows all characters under team
   - Maintains alternating row colors
   - Easy to see individual contributions

3. **Filter by team name**
   - Use auto-filter on Row 2
   - Filter to specific teams
   - Characters automatically shown/hidden

4. **Sort by any metric**
   - Sorts teams by selected column
   - Character rows stay grouped with parent team
   - Maintains hierarchy

## 🚀 Next Steps

### Potential Enhancements

1. **Grand Totals Row**
   - Add "ALL TEAMS" summary at top or bottom
   - Shows overall statistics across entire dataset

2. **Team Win/Loss Records**
   - If win/loss data available, add team win rate
   - Compare team success rates

3. **Character Count Column**
   - Show how many characters are on each team
   - Helps understand team size impact on averages

4. **Most Used Character Indicator**
   - Highlight character with most matches on each team
   - Visual indicator (★ or bold)

5. **Team Position Analysis**
   - If position data available, show distribution
   - Lead/Middle/Anchor breakdown per team

6. **Sparkline Trend Charts**
   - Mini charts showing performance trends
   - In-cell visualizations for key metrics

7. **Color Coding by Performance**
   - Teams with efficiency > 1.5 get green indicator
   - Teams with efficiency < 1.0 get red indicator
   - Quick visual performance assessment

## 📝 Testing Checklist

- [ ] Export file with multiple teams (3+ teams, 2+ characters each)
- [ ] Verify team summary rows have dark blue background
- [ ] Verify character rows are indented and grouped
- [ ] Test collapse/expand functionality (click [-] and [+])
- [ ] Verify weighted averages are calculated correctly
- [ ] Check that conditional formatting applies to character rows
- [ ] Verify team rows maintain formatting over conditional formatting
- [ ] Test auto-filter functionality
- [ ] Verify sorting maintains team groupings
- [ ] Check that all 43 columns from Character Averages are present
- [ ] Verify duration indicators appear in time columns
- [ ] Test with edge cases (team with 1 character, characters with 1 match)
- [ ] Verify "No Team" handling for characters without team assignment
- [ ] Check performance with large datasets (50+ characters, 10+ teams)

## 🐛 Known Issues / Limitations

### Current Limitations
1. **No Grand Total** - No overall summary row across all teams
2. **Static Grouping** - Groups are fixed at export time (not dynamic)
3. **No Team Badges** - Team rows don't have special icons/badges yet

### Future Considerations
- Consider adding sub-totals for each column group
- Add visual separators between team sections
- Implement team performance badges (🥇 🥈 🥉 for top 3)
- Add trend indicators for team improvement over time

## 📚 Related Documentation
- `DATA_TABLES_EXPORT_PLAN.md` - Overall export implementation plan
- `EXCEL_ICON_ENHANCEMENTS.md` - Icon system documentation
- `DURATION_ICON_REFERENCE.md` - Duration indicator guide
- `UNIFIED_CONDITIONAL_FORMATTING.md` - Conditional formatting details

---

**Version:** 1.0  
**Date:** October 17, 2025  
**Status:** ✅ Implemented  
**Next Phase:** Build Archetype Analysis Pivot Table
