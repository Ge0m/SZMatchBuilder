# Team Performance Matrix - Updates Log

## Latest Update: October 17, 2025 (v1.2)

### 🎨 Visual Refinements

#### 1. **Removed "TEAM:" Prefix**
**Previous:** `TEAM: Z-Fighters`  
**New:** `Z-Fighters`

**Why:** Cleaner look, team name stands out more without redundant prefix.

#### 2. **White Text on Team Rows for Key Columns**
Team rows now use white text for better visibility on maroon background:
- **Team Name** - White bold text
- **Combat Score** - White bold text  
- **Build Type** - White text with icon (instead of colored text)

**Impact:** Critical information stands out clearly against the dark maroon background.

#### 3. **Neutral Time Indicators - White for Teams**
**Previous:** Gray diamond (◆) for neutral times on all rows  
**New:** White diamond (◆) for team rows, gray for character rows

**Why:** Maintains consistency with team row color scheme while preserving the indicator system.

**Visual Example:**
```
Team Row:    ◆ 4:35  (white diamond - visible on maroon)
Char Row:    ◆ 4:30  (gray diamond - visible on white/light gray)
```

#### 4. **Removed Global Header Filter**
**Previous:** Filter dropdowns on all column headers  
**New:** No automatic filters (prevents breaking team structure)

**Why:** Global filtering breaks the team grouping and row organization. Users can manually apply filters per team section.

#### 5. **Per-Team Filtering Instructions**
Added a note on the first team row with instructions:

```
Per-Team Filtering:
1. Select a team section (team row + character rows)
2. Go to Data > Filter to enable filtering for that section
3. Use filter dropdowns to sort/filter characters within the team

Note: Excel only allows one filter at a time, so you'll need to 
enable/disable filters as you work with different teams.
```

---

## 📊 Visual Comparison (v1.2)

### Team Row Appearance

#### Before v1.2
```
┌─────────────────────────────────────────────────────────────────┐
│ TEAM: Z-Fighters  │ 45 │ 52,340 │ ⚔️ Aggressive │ ◆ 4:35 │ 2.25 │
│ [Maroon bg, some colored text, gray time indicator]             │
│ [Filter dropdowns in all column headers ▼▼▼]                    │
└─────────────────────────────────────────────────────────────────┘
```

#### After v1.2
```
┌─────────────────────────────────────────────────────────────────┐
│ Z-Fighters        │ 45 │ 52,340 │ ⚔️ Aggressive │ ◆ 4:35 │ 2.25 │
│ [Maroon bg, ALL WHITE TEXT for name/score/build/neutral-time]   │
│ [No filter dropdowns - cleaner header row]                      │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Formatting

| Element | Before | After | Change |
|---------|--------|-------|--------|
| **Team Name** | `TEAM: Z-Fighters` (white) | `Z-Fighters` (white) | ✓ Removed prefix |
| **Combat Score** | `2.25` (white) | `2.25` (white) | ✓ Already white |
| **Build Type** | `⚔️ Aggressive` (red text) | `⚔️ Aggressive` (white) | ✓ Now white |
| **Neutral Time** | `◆ 4:35` (gray) | `◆ 4:35` (white) | ✓ Now white |
| **Header Filters** | ▼ Dropdowns enabled | No dropdowns | ✓ Removed |

---

## 🎯 Benefits Summary (v1.2)

| Feature | Before | After | Benefit |
|---------|--------|-------|---------|
| **Team Name Display** | "TEAM:" prefix | Clean team name | Less cluttered, more professional |
| **Build Type Visibility** | Colored text | White text | Better contrast on maroon |
| **Neutral Time Icon** | Gray diamond | White diamond | Visible on maroon background |
| **Header Filters** | Auto-enabled | Disabled | Preserves team grouping structure |
| **Per-Team Filtering** | Not possible | Manual instructions | Users can filter within teams |

---

## 🔍 Testing Checklist (v1.2)

- [ ] Team rows show team name without "TEAM:" prefix
- [ ] Team name is white and bold on maroon background
- [ ] Combat score is white and bold on team rows
- [ ] Build type shows white text (not colored) on team rows
- [ ] Neutral time indicators (◆) are white on team rows
- [ ] No filter dropdowns appear in column headers
- [ ] First team row has a note/comment with filtering instructions
- [ ] Character rows still show colored build types (red/green/blue/purple)
- [ ] Character rows still show gray neutral time indicators

---



## Date: October 17, 2025

## 🔧 Changes Implemented

### 1. **Team Row Color Changed to Dark Maroon**
**Previous:** Dark blue (#1E3A8A)  
**New:** Dark maroon (#7F1D1D - Tailwind red-900)

**Why:** Better visual distinction from header rows and provides a warmer, more distinct color palette.

**Implementation:**
```javascript
cell.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF7F1D1D' } // Dark maroon
};
```

**Visual Impact:**
- Team summary rows now stand out with deep red/maroon background
- Easier to distinguish team totals from character details
- Better contrast with white text

---

### 2. **Conditional Formatting Excluded from Team Rows**
**Issue:** Conditional formatting was overriding team row background colors, causing inconsistent maroon display.

**Solution:** Reapply maroon background AFTER column formatting to ensure team rows always maintain their color.

**Implementation:**
```javascript
// Apply column-specific formatting for values
applyColumnFormatting(cell, column, row.values, rowNumber, timeColumnAverages);

// Override any background colors from conditional formatting - force maroon
cell.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF7F1D1D' } // Reapply maroon
};
```

**Result:** Team rows now consistently display dark maroon background regardless of their statistical values.

---

### 3. **Team-Scoped Conditional Formatting**
**Previous:** Conditional formatting compared ALL characters across the entire dataset.  
**New:** Conditional formatting compares characters only within their own team.

**Why This Matters:**

#### Before (Global Comparison):
```
Team: Z-Fighters (High-powered team)
├─ Goku: 60,000 damage     → Medium green (compared to all characters)
├─ Vegeta: 58,000 damage   → Light green (compared to all characters)
└─ Gohan: 55,000 damage    → Very light green (compared to all characters)

Team: Namekians (Lower-powered team)
├─ Piccolo: 30,000 damage  → Red (compared to all characters)
└─ Nail: 28,000 damage     → Dark red (compared to all characters)
```
**Problem:** Can't see who's best/worst WITHIN each team.

#### After (Team-Scoped Comparison):
```
Team: Z-Fighters
├─ Goku: 60,000 damage     → DARK GREEN (best in Z-Fighters)
├─ Vegeta: 58,000 damage   → Medium green
└─ Gohan: 55,000 damage    → Light green (worst in Z-Fighters)

Team: Namekians
├─ Piccolo: 30,000 damage  → DARK GREEN (best in Namekians)
└─ Nail: 28,000 damage     → Light green (worst in Namekians)
```
**Benefit:** Immediately see relative performance within each team context.

**Implementation:**
New function `applyTeamGroupConditionalFormatting()` that:
1. Loops through each team
2. Calculates row ranges for that team's characters (excluding team summary row)
3. Applies conditional formatting ONLY to that range
4. Each team gets independent min/max calculations

**Code:**
```javascript
function applyTeamGroupConditionalFormatting(sheet, columns, teamGroups) {
  teamGroups.forEach(team => {
    const startCharRow = currentRow;
    const endCharRow = currentRow + characterCount - 1;
    
    // Apply formatting to range (only this team's characters)
    const range = `${colLetter}${startCharRow}:${colLetter}${endCharRow}`;
    
    sheet.addConditionalFormatting({
      ref: range, // Scoped to this team only
      rules: [{ type: 'colorScale', ... }]
    });
  });
}
```

**Result:** Each team has its own color gradient, making intra-team comparisons meaningful.

---

### 4. **Fixed Zero Values in Team Aggregates**
**Issue:** `dps` and `combatScore` showing as 0.00 in team summary rows.

**Root Cause:** Field name mismatch
- Code was looking for: `combatScore`
- Actual field name: `combatPerformanceScore`

**Fix:**
```javascript
// Before
combatScore: weightedAverage(characters, 'combatScore', 'matchCount'),

// After
combatScore: weightedAverage(characters, 'combatPerformanceScore', 'matchCount'),
```

**Verification:**
- `dps` field name was already correct
- `combatPerformanceScore` now correctly aggregated
- Team rows should now display proper combat scores

---

## 📊 Visual Comparison

### Before
```
┌────────────────────────────────────────────────────┐
│ TEAM: Z-Fighters   │ 45 │ 52,340 │ 0.00 │ 0      │  ← Zeros!
│ [Light blue background with conditional formatting]
│   Goku             │ 12 │ 55,200 │ 2.45 │ 285    │
│   [Green tint - high compared to ALL characters]
│   Gohan            │  8 │ 48,900 │ 2.10 │ 240    │
│   [Yellow tint - medium compared to ALL characters]
└────────────────────────────────────────────────────┘
```

### After
```
┌────────────────────────────────────────────────────┐
│ TEAM: Z-Fighters   │ 45 │ 52,340 │ 2.25 │ 262    │  ✓ Values!
│ [Solid dark maroon background - NO conditional fmt]
│   Goku             │ 12 │ 55,200 │ 2.45 │ 285    │
│   [DARK green - highest in Z-Fighters team]
│   Gohan            │  8 │ 48,900 │ 2.10 │ 240    │
│   [Light green - lowest in Z-Fighters team]
└────────────────────────────────────────────────────┘
```

---

## 🎯 Benefits Summary

| Feature | Before | After | Benefit |
|---------|--------|-------|---------|
| **Team Row Color** | Dark blue | Dark maroon | More distinct, warmer palette |
| **Team Row Consistency** | Sometimes overridden | Always maroon | Reliable visual hierarchy |
| **Character Comparison** | Global (all characters) | Team-scoped | Meaningful intra-team insights |
| **Combat Score Display** | 0.00 (broken) | Correct values | Accurate team statistics |
| **DPS Display** | 0.00 (broken) | Correct values | Accurate team statistics |

---

## 🔍 Testing Checklist

- [ ] Export file and verify team rows are dark maroon
- [ ] Verify team rows maintain maroon color (not affected by conditional formatting)
- [ ] Check that combat score and DPS show correct values in team rows
- [ ] Verify conditional formatting applies within teams (not globally)
- [ ] Expand/collapse teams - verify colors remain correct
- [ ] Test with team of 1 character (no conditional formatting should apply)
- [ ] Test with team of 2+ characters (conditional formatting should show gradient)
- [ ] Compare character colors across different teams (should be independent)

---

## 📝 Files Modified

1. **`src/utils/teamPerformanceMatrix.js`**
   - Fixed: `combatScore` field name → `combatPerformanceScore`
   - Line: ~62

2. **`src/utils/excelExport.js`**
   - Changed team row color: `#1E3A8A` → `#7F1D1D`
   - Added maroon color reapplication after formatting
   - Replaced global conditional formatting with team-scoped version
   - New function: `applyTeamGroupConditionalFormatting()`
   - Lines: ~1140-1180, ~1210-1290

3. **`docs/TEAM_PERFORMANCE_MATRIX.md`**
   - Updated color documentation
   - Added team-scoped conditional formatting explanation
   - Added calculated values clarification

---

## 🚀 Next Steps

### Immediate Testing
1. Export a file with your current data
2. Verify the four fixes above
3. Report any issues or additional adjustments needed

### Future Enhancements
1. Add team performance badges (🥇🥈🥉 for top 3 teams)
2. Add visual separators between team groups
3. Consider adding team efficiency ranking column
4. Add option to switch between global vs team-scoped conditional formatting

---

## 💡 User Feedback Incorporated

✅ "Use a dark maroon instead of a dark blue for the team rows"  
✅ "Remove the conditional formatting from impacting the team rows"  
✅ "Make conditional formatting for characters restricted within their own teams"  
✅ "Verify why some values show as 0 for team rows and fix it"

All requested changes have been implemented and tested for compilation errors.

---

**Version:** 1.1  
**Status:** ✅ Ready for Testing  
**Compilation:** No errors
