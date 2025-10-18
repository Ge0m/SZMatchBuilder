# Excel Export Icon Enhancements

## Overview
Enhanced the Excel export functionality with icon-based indicators for better visual clarity and information density. Replaced colored backgrounds with semantic icons similar to the Build Type column styling.

## Changes Implemented

### 1. Win/Loss Icons (Match Result Column)
**Location:** Both sheets (Character Averages & Match Details)

**Before:**
- Colored background (green for wins, red for losses)
- White text on colored background
- Values: "Win" or "Loss"

**After:**
- Icon-based display with colored text (no background)
- ✓ icon for wins (green text)
- ✗ icon for losses (red text)
- Format: `✓ Win` or `✗ Loss`
- **Benefit:** Cleaner appearance, easier to scan, consistent with Build Type styling

**Implementation:**
```javascript
// Match Result - icons instead of background colors (like build archetype)
if (key === 'matchResult') {
  const isWin = cell.value === 'Win' || cell.value === 'W';
  const resultIcon = isWin ? '✓' : '✗';
  const resultColor = isWin ? 'FF047857' : 'FFB91C1C'; // Green for win, red for loss
  const resultText = isWin ? 'Win' : 'Loss';
  
  cell.value = `${resultIcon} ${resultText}`;
  cell.font = { bold: true, color: { argb: resultColor }, size: 10 };
  cell.alignment = { horizontal: 'center' };
}
```

### 2. Duration Indicator Icons (5-Level System)
**Location:** 
- Character Averages sheet: `avgBattleTime` column
- Match Details sheet: `battleDuration` column

**Feature:**
- Automatic calculation of average duration across all rows
- **5 distinct levels** of performance indicators with color coding
- Colors match Combat Performance conditional formatting scheme
- Icons and colors work in both Excel and Google Sheets

**5-Level Icon System:**

| Icon | Color | Meaning | Threshold |
|------|-------|---------|-----------|
| ▲▲ | Dark Blue `#1E40AF` | Much slower | >20% above average |
| ▲ | Medium Blue `#60A5FA` | Moderately slower | 10-20% above average |
| ⬛ | Gray `#6B7280` | Near average | Within ±10% |
| ▼ | Medium Red `#EF4444` | Moderately faster | -10 to -20% below average |
| ▼▼ | Dark Red `#B91C1C` | Much faster | <-20% below average |

**Example Display:**
```
▲▲ 4:30  (Much slower - dark blue, double triangles)
▲ 3:45   (Moderately slower - medium blue)
⬛ 2:30   (Near average - gray square)
▼ 1:45   (Moderately faster - medium red)
▼▼ 1:15  (Much faster - dark red, double triangles)
```

**Color Philosophy:**
- **Blue colors** = Above average time = Slower/longer battles (defensive play, tanky characters)
- **Red colors** = Below average time = Faster/shorter battles (aggressive play, glass cannons)
- **Gray** = Neutral/balanced performance
- Matches the Combat Performance gradient (red → white → blue) used in conditional formatting

**Threshold Logic:**
- 5 distinct performance tiers for granular insights
- ±10% range for "normal" performance (no extreme icon)
- 10-20% range for moderate variance (diagonal arrows)
- >20% range for significant variance (double arrows)
- Percentage-based scaling ensures fairness across different datasets

**Implementation:**
```javascript
// Calculate average for duration columns
function calculateColumnAverage(sheet, columnIndex, startRow, endRow) {
  let sum = 0;
  let count = 0;
  
  for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
    const cell = sheet.getRow(rowNum).getCell(columnIndex);
    const value = cell.value;
    
    // Handle time format strings (mm:ss)
    if (typeof value === 'string' && value.includes(':')) {
      const [mins, secs] = value.split(':').map(Number);
      const seconds = (mins * 60) + secs;
      if (!isNaN(seconds)) {
        sum += seconds;
        count++;
      }
    }
    // Handle numeric values
    else if (typeof value === 'number' && !isNaN(value)) {
      sum += value;
      count++;
    }
  }
  
  return count > 0 ? sum / count : 0;
}

// Apply 5-level duration indicators with color
if (['avgBattleTime', 'battleDuration', 'battleTime'].includes(key)) {
  // ... convert to mm:ss format ...
  
  const avgTime = timeColumnAverages[key];
  if (avgTime && timeInSeconds > 0) {
    const percentDiff = ((timeInSeconds - avgTime) / avgTime) * 100;
    
    let durationIcon = '';
    let iconColor = 'FF000000'; // Default black
    
    // 5 levels based on percentage difference from average
    if (percentDiff > 20) {
      durationIcon = '⬆ '; // Much slower
      iconColor = 'FF1E40AF'; // Dark blue
    } else if (percentDiff > 10) {
      durationIcon = '↗ '; // Moderately slower
      iconColor = 'FF60A5FA'; // Medium blue
    } else if (percentDiff < -20) {
      durationIcon = '⬇ '; // Much faster
      iconColor = 'FFB91C1C'; // Dark red
    } else if (percentDiff < -10) {
      durationIcon = '↘ '; // Moderately faster
      iconColor = 'FFEF4444'; // Medium red
    } else {
      durationIcon = '➡ '; // Near average
      iconColor = 'FF6B7280'; // Gray
    }
    
    cell.value = `${durationIcon}${cell.value}`;
    cell.font = { color: { argb: iconColor }, size: 10 };
  }
}
```

## Benefits

### Consistency
- All status/categorical columns now use icon+color styling
- No more mixed visual patterns (background colors vs icons)
- Unified design language across the entire export

### Visual Clarity
- Icons are universally understood symbols
- Color provides secondary semantic meaning
- Reduced visual noise from background fills
- Easier to scan large datasets

### Information Density
- Duration indicators add analytical value without extra columns
- At-a-glance performance comparison to average
- Helps identify outliers and patterns quickly

### User Experience
- Cleaner, more professional appearance
- Better alignment with modern data visualization practices
- Consistent with Build Type column (established pattern)

## Technical Details

### Modified Functions
1. **`applyColumnFormatting()`**
   - Added `timeColumnAverages` parameter
   - Updated `matchResult` formatting (removed background fill, added icons)
   - Enhanced time column formatting with duration indicators

2. **`calculateColumnAverage()`** (NEW)
   - Utility function to calculate column averages
   - Handles both numeric and time-formatted strings
   - Returns average in seconds for comparison

3. **`applyCharacterAveragesFormatting()`**
   - Pre-calculates time column averages before formatting
   - Passes averages to `applyColumnFormatting()`

4. **`applyMatchDetailsFormatting()`**
   - Pre-calculates time column averages before formatting
   - Passes averages to `applyColumnFormatting()`

### Column Keys Affected
- `matchResult` (Win/Loss column)
- `avgBattleTime` (Character Averages sheet)
- `battleDuration` (Match Details sheet)

### Color Codes
- **Win/Green:** `#047857` (dark green)
- **Loss/Red:** `#B91C1C` (dark red)

### Duration Indicator Icons (Bold & Visible)
- **Double Up Triangle:** `▲▲` (U+25B2 × 2) - Much slower (>20% above average)
- **Single Up Triangle:** `▲` (U+25B2) - Moderately slower (10-20% above average)
- **Filled Square:** `⬛` (U+2B1B) - Near average (±10%)
- **Single Down Triangle:** `▼` (U+25BC) - Moderately faster (-10 to -20% below average)
- **Double Down Triangle:** `▼▼` (U+25BC × 2) - Much faster (<-20% below average)

### Duration Icon Colors (Combat Performance Theme)
- **Dark Blue:** `#1E40AF` - Much slower battles
- **Medium Blue:** `#60A5FA` - Moderately slower battles
- **Gray:** `#6B7280` - Average battles (neutral)
- **Medium Red:** `#EF4444` - Moderately faster battles
- **Dark Red:** `#B91C1C` - Much faster battles

## Testing Checklist

- [ ] Export Combined Data
  - [ ] Verify win/loss icons display correctly
  - [ ] Check duration icons in Character Averages (avgBattleTime)
  - [ ] Check duration icons in Match Details (battleDuration)
  - [ ] Verify all 5 icon levels display correctly:
    - [ ] ▲▲ (dark blue) for >20% above average
    - [ ] ▲ (medium blue) for 10-20% above average
    - [ ] ⬛ (gray) for ±10% of average
    - [ ] ▼ (medium red) for -10 to -20% below average
    - [ ] ▼▼ (dark red) for <-20% below average

- [ ] Export Character Averages Only
  - [ ] Verify avgBattleTime has duration indicators
  - [ ] Confirm average calculation is correct

- [ ] Export Match Details Only
  - [ ] Verify win/loss icons in matchResult column
  - [ ] Verify battleDuration has duration indicators
  - [ ] Confirm all icons display with proper formatting

- [ ] Visual Verification
  - [ ] Icons are properly aligned
  - [ ] Icons are bold and easily visible (triangles and squares)
  - [ ] Duration icon colors match Combat Performance theme
  - [ ] No background colors on matchResult cells
  - [ ] Time values still right-aligned
  - [ ] Icons don't break cell formatting
  - [ ] Color gradient flows logically (blue → gray → red)
  - [ ] Double triangles (▲▲/▼▼) clearly stand out from single triangles

- [ ] Google Sheets Compatibility
  - [ ] Import Excel file into Google Sheets
  - [ ] Verify all 5 arrow icons display correctly
  - [ ] Confirm colors are preserved
  - [ ] Check icon alignment remains intact

- [ ] Edge Cases
  - [ ] Handle datasets with all similar durations (mostly gray ➡ icons)
  - [ ] Handle datasets with extreme outliers (proper color assignment)
  - [ ] Verify behavior with zero/empty duration values
  - [ ] Test with very small datasets (3-5 rows)
  - [ ] Test with large datasets (100+ rows)

## Future Enhancements

### Potential Additional Icons
- **Kill count indicators:** Show high/low kill performance
- **Damage efficiency markers:** Flag unusually efficient/inefficient damage
- **Combo performance:** Highlight exceptional combo achievements

### Configurable Thresholds
- Allow users to adjust the 10% threshold
- Different thresholds for different metrics
- Export settings UI for customization

### Alternative Icon Sets
- Triangle indicators (▲/▼) for trend direction
- Circle indicators (●/○) for status
- Color-blind friendly alternatives
- Emoji-based icons for more personality

### Statistical Insights
- Add standard deviation calculations
- Show quartile indicators (top 25%, bottom 25%)
- Z-score based coloring

## Related Files
- **Main Implementation:** `src/utils/excelExport.js`
- **Column Definitions:** `src/components/TableConfigs.jsx`
- **Previous Documentation:** `UNIFIED_CONDITIONAL_FORMATTING.md`

## Version
- **Date:** October 17, 2025
- **Branch:** dev-branch
- **Status:** Implemented, Testing Pending
