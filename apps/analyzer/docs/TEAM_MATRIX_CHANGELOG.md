# Team Performance Matrix - Complete Changelog

## Version 1.2 - October 17, 2025 (Current)

### Changes Made

#### 1. Removed "TEAM:" Prefix from Team Names
**File:** `excelExport.js` line ~1023  
**Change:**
```javascript
// Before
teamRowValues[0] = `TEAM: ${team.teamName}`;

// After
teamRowValues[0] = team.teamName;
```

#### 2. Made Team Row Text White for Key Columns
**File:** `excelExport.js` line ~1115-1125  
**Change:** Added explicit white font color for team rows after formatting
```javascript
// CRITICAL: Ensure key columns stay white on team rows
if (column.key === 'name' || column.key === 'combatScore' || 
    column.key === 'combatPerformanceScore' || column.key === 'buildArchetype') {
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
}
```

#### 3. Updated Build Archetype to Use White Text on Team Rows
**File:** `excelExport.js` line ~660-670  
**Change:** Added `isTeamRow` parameter and conditional color
```javascript
// Use white color for team rows for better visibility on maroon background
const textColor = isTeamRow ? 'FFFFFFFF' : buildInfo.color;
cell.font = { bold: true, color: { argb: textColor }, size: 10 };
```

#### 4. Made Neutral Time Indicators White on Team Rows
**File:** `excelExport.js` line ~608  
**Change:** Conditional color based on row type
```javascript
// Before
iconColor = 'FF6B7280'; // Gray (neutral)

// After
iconColor = isTeamRow ? 'FFFFFFFF' : 'FF6B7280'; // White for teams, gray for chars
```

#### 5. Added `isTeamRow` Parameter to applyColumnFormatting()
**File:** `excelExport.js` line 532  
**Change:**
```javascript
// Before
function applyColumnFormatting(cell, column, rowValues, rowNumber, timeColumnAverages = {}) {

// After
function applyColumnFormatting(cell, column, rowValues, rowNumber, timeColumnAverages = {}, isTeamRow = false) {
```

#### 6. Removed Global Header Auto-Filter
**File:** `excelExport.js` line ~1217  
**Change:**
```javascript
// Before
sheet.autoFilter = {
  from: { row: 2, column: 1 },
  to: { row: 2, column: columns.length }
};

// After
// Removed - call addPerTeamAutoFilters() instead
addPerTeamAutoFilters(sheet, columns, teamGroups);
```

#### 7. Added Per-Team Filtering Instructions
**File:** `excelExport.js` line ~1325  
**New Function:** `addPerTeamAutoFilters()`
```javascript
function addPerTeamAutoFilters(sheet, columns, teamGroups) {
  // Adds instructional note to first team row
  // Explains how to manually filter each team section
}
```

---

## Version 1.1 - October 17, 2025

### Changes Made

#### 1. Team Row Color Changed to Dark Maroon
- Color: `#1E3A8A` → `#7F1D1D`
- Better visual distinction from headers

#### 2. Conditional Formatting Excluded from Team Rows
- Re-apply maroon fill after formatting
- Team rows maintain solid color

#### 3. Team-Scoped Conditional Formatting
- Characters compared only within their own team
- Each team gets independent color gradients
- New function: `applyTeamGroupConditionalFormatting()`

#### 4. Fixed Zero Values in Team Aggregates
- Fixed field name: `combatScore` → `combatPerformanceScore`
- Team DPS and Combat Score now calculate correctly

---

## Summary of All Active Features

### Team Row Formatting
- **Background:** Dark maroon (#7F1D1D)
- **Text Color:** White for all key columns
- **Font:** Bold, size 11
- **Height:** 22 (slightly taller than character rows)
- **Borders:** Medium top/bottom, thin sides

### White Text Columns (Team Rows Only)
1. Team Name
2. Combat Score
3. Build Archetype
4. Neutral Time Indicators (◆)

### Character Row Formatting
- **Background:** Alternating white/light gray within team
- **Text Color:** 
  - Build Type: Colored (red/green/blue/purple based on type)
  - Time Indicators: Colored (red/blue) or gray (neutral)
  - Other columns: Black
- **Conditional Formatting:** Team-scoped (compare to teammates)

### Filtering & Sorting
- **Global Filter:** Disabled (would break team structure)
- **Per-Team Filter:** Manual application via Data > Filter
- **Instructions:** Cell note on first team row

### Excel Features
- **Row Grouping:** Team sections collapsible (outline level 1)
- **Conditional Formatting:** 4 color schemes (Combat/Survival/Abilities/Mechanics)
- **Icons:** Win/Loss (✓/✗), Duration (▲▲/▲/◆/▼/▼▼), Build Type (⚔️/🛡️/⚙️/🔀)

---

## Files Modified

### v1.2
1. `apps/analyzer/src/utils/excelExport.js`
   - Line ~532: Added `isTeamRow` parameter
   - Line ~608: Conditional neutral time color
   - Line ~665: Conditional build type color
   - Line ~1023: Removed "TEAM:" prefix
   - Line ~1105: Added `isTeamRow=true` to function call
   - Line ~1115: Forced white text for key columns
   - Line ~1217: Removed global autofilter
   - Line ~1325: Added `addPerTeamAutoFilters()` function

2. `apps/analyzer/docs/TEAM_MATRIX_UPDATES.md`
   - Added v1.2 changelog section
   - Updated visual comparisons
   - Updated testing checklist

### v1.1
1. `apps/analyzer/src/utils/teamPerformanceMatrix.js`
   - Fixed combatScore field name
   
2. `apps/analyzer/src/utils/excelExport.js`
   - Changed team row color to maroon
   - Added conditional formatting protection
   - Implemented team-scoped conditional formatting

3. `apps/analyzer/docs/TEAM_PERFORMANCE_MATRIX.md`
   - Documented all features

---

## Next Steps

### Testing Required
1. Export file with current changes
2. Verify team row appearance (white text on maroon)
3. Test manual filtering on individual teams
4. Verify character row colors are unchanged
5. Check time indicator colors (white on teams, gray/colored on characters)

### Future Enhancements
1. Consider Excel Tables for true per-team filtering (if technically feasible)
2. Add team badges/medals (🥇🥈🥉) for performance rankings
3. Add visual separators between team sections
4. Consider adding a "Team Summary Only" view option

---

**Current Version:** 1.2  
**Status:** ✅ Ready for Testing  
**Compilation:** No errors  
**Breaking Changes:** None (backward compatible)
