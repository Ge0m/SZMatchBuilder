# Duration Icon Reference Guide

## 5-Level Duration Indicator System

This guide provides a visual reference for the duration indicator icons used in Excel exports. All icons are tested for compatibility with both Microsoft Excel and Google Sheets.

---

## Icon Hierarchy

### Level 1: Much Slower (>20% Above Average)
```
Icon: ▲▲ (Double Triangle)
Color: Dark Blue (#1E40AF)
Unicode: U+25B2 × 2 (BLACK UP-POINTING TRIANGLE)
Example: ▲▲ 4:30
Meaning: Significantly longer battles/durations
Context: Defensive playstyle, tank characters, control-heavy matches
Visibility: ⭐⭐⭐⭐⭐ (Extremely visible - bold filled triangles)
```

### Level 2: Moderately Slower (10-20% Above Average)
```
Icon: ▲ (Single Triangle)
Color: Medium Blue (#60A5FA)
Unicode: U+25B2 (BLACK UP-POINTING TRIANGLE)
Example: ▲ 3:45
Meaning: Noticeably longer battles/durations
Context: Balanced with defensive tendencies
Visibility: ⭐⭐⭐⭐ (Very visible - bold filled triangle)
```

### Level 3: Near Average (±10%)
```
Icon: ⬛ (Filled Square)
Color: Gray (#6B7280)
Unicode: U+2B1B (BLACK LARGE SQUARE)
Example: ⬛ 2:30
Meaning: Typical/expected battle duration
Context: Standard performance, no significant deviation
Visibility: ⭐⭐⭐⭐ (Very visible - bold filled square)
```

### Level 4: Moderately Faster (-10 to -20% Below Average)
```
Icon: ▼ (Single Triangle)
Color: Medium Red (#EF4444)
Unicode: U+25BC (BLACK DOWN-POINTING TRIANGLE)
Example: ▼ 1:45
Meaning: Noticeably shorter battles/durations
Context: Balanced with aggressive tendencies
Visibility: ⭐⭐⭐⭐ (Very visible - bold filled triangle)
```

### Level 5: Much Faster (<-20% Below Average)
```
Icon: ▼▼ (Double Triangle)
Color: Dark Red (#B91C1C)
Unicode: U+25BC × 2 (BLACK DOWN-POINTING TRIANGLE)
Example: ▼▼ 1:15
Meaning: Significantly shorter battles/durations
Context: Aggressive playstyle, glass cannon characters, rush strategies
Visibility: ⭐⭐⭐⭐⭐ (Extremely visible - bold filled triangles)
```

---

## Visual Spectrum

```
▲▲ SLOWER ←------------------------→ FASTER ▼▼
│                                                │
Dark Blue  →  Med Blue  →  Gray  →  Med Red  →  Dark Red
#1E40AF       #60A5FA      #6B7280   #EF4444     #B91C1C
  >20%         10-20%       ±10%     -10→-20%     <-20%

Filled Triangles = Bolder & More Visible Than Arrows
Double Triangles = Extreme Values (High Visual Priority)
Square = Neutral/Average (No directional bias)
```

---

## Color Philosophy

### Why Blue for Slower?
- **Defensive association:** Blue is traditionally associated with defense, shields, and protection
- **Calm/Patient:** Represents patient, methodical gameplay
- **Matches Combat Performance:** Aligns with the existing conditional formatting where blue = high values in defensive stats
- **Universal understanding:** Blue = cool = slow (temperature metaphor)

### Why Red for Faster?
- **Aggressive association:** Red represents aggression, damage, and speed
- **Urgency/Action:** Represents fast-paced, intense gameplay
- **Matches Combat Performance:** Aligns with existing conditional formatting where red = high damage output
- **Universal understanding:** Red = hot = fast (temperature metaphor)

### Why Gray for Neutral?
- **No judgment:** Gray is neutral and doesn't imply good or bad
- **Background element:** Indicates "nothing special to note here"
- **Reduced visual noise:** Allows extreme values (blue/red) to stand out
- **Professional appearance:** Maintains clean, readable exports

---

## Threshold Examples

### Example Dataset
Average battle time: **2:30** (150 seconds)

| Time | Difference | Percentage | Icon | Color |
|------|-----------|------------|------|-------|
| 3:15 | +45s | +30% | ▲▲ | Dark Blue |
| 2:55 | +25s | +17% | ▲ | Medium Blue |
| 2:40 | +10s | +7% | ⬛ | Gray |
| 2:30 | 0s | 0% | ⬛ | Gray |
| 2:20 | -10s | -7% | ⬛ | Gray |
| 2:05 | -25s | -17% | ▼ | Medium Red |
| 1:45 | -45s | -30% | ▼▼ | Dark Red |

### Threshold Boundaries
- **>20% threshold:** 150s × 1.20 = **180s (3:00)**
  - Anything above 3:00 gets ⬆ (dark blue)
- **10% threshold:** 150s × 1.10 = **165s (2:45)**
  - Between 2:45-3:00 gets ↗ (medium blue)
- **-10% threshold:** 150s × 0.90 = **135s (2:15)**
  - Between 2:15-2:45 gets ➡ (gray)
- **-20% threshold:** 150s × 0.80 = **120s (2:00)**
  - Between 2:00-2:15 gets ↘ (medium red)
  - Below 2:00 gets ⬇ (dark red)

---

## Use Cases

### Character Averages Sheet
**Column:** `avgBattleTime`

**Interpretation:**
- ⬆ **Dark Blue:** This character tends to have long, drawn-out battles (tanky, defensive)
- ↗ **Medium Blue:** Slightly longer than average battles
- ➡ **Gray:** Balanced character with typical match lengths
- ↘ **Medium Red:** Slightly shorter than average battles
- ⬇ **Dark Red:** This character tends to finish battles quickly (glass cannon, aggressive)

### Match Details Sheet
**Column:** `battleDuration`

**Interpretation:**
- ⬆ **Dark Blue:** This specific match took much longer than usual
- ↗ **Medium Blue:** Match went a bit longer than typical
- ➡ **Gray:** Standard match length
- ↘ **Medium Red:** Match ended a bit quicker than typical
- ⬇ **Dark Red:** This specific match ended very quickly (decisive victory/defeat)

---

## Analytical Insights

### Pattern Recognition

**Looking for Defensive Characters:**
1. Filter for characters with mostly ▲▲/▲ icons
2. Sort by avgBattleTime descending
3. Cross-reference with high HP Retention and Guard stats

**Looking for Aggressive Characters:**
1. Filter for characters with mostly ▼▼/▼ icons
2. Sort by avgBattleTime ascending
3. Cross-reference with high DPS and damage output

**Looking for Balanced Characters:**
1. Filter for characters with mostly ⬛ icons
2. Indicates versatile playstyle that adapts to matchups

### Outlier Detection

**Unusual Patterns to Investigate:**
- Character with low DPS but ▼▼ icon (fast matches despite low damage → opponent suiciding?)
- Character with high HP but ▼▼ icon (tanky but wins quickly → dominant matchup?)
- Character with high damage but ▲▲ icon (slow matches despite damage → opponent equally tanky?)

---

## Technical Implementation

### Calculation Formula
```javascript
const percentDiff = ((timeInSeconds - avgTime) / avgTime) * 100;

if (percentDiff > 20) {
  icon = '▲▲ '; color = 'FF1E40AF'; // Dark blue - double triangle
} else if (percentDiff > 10) {
  icon = '▲ '; color = 'FF60A5FA'; // Medium blue - single triangle
} else if (percentDiff < -20) {
  icon = '▼▼ '; color = 'FFB91C1C'; // Dark red - double triangle
} else if (percentDiff < -10) {
  icon = '▼ '; color = 'FFEF4444'; // Medium red - single triangle
} else {
  icon = '⬛ '; color = 'FF6B7280'; // Gray - filled square
}
```

### Unicode Compatibility
All icons are part of Unicode standard blocks:
- **Arrow blocks:** U+2190–U+21FF (basic arrows)
- **Supplemental Arrows-A:** U+27A0–U+27FF (additional arrows)
- **Miscellaneous Symbols:** U+2B00–U+2BFF (geometric shapes and arrows)

These blocks have **excellent cross-platform support:**
- ✅ Microsoft Excel (all versions)
- ✅ Google Sheets
- ✅ LibreOffice Calc
- ✅ Apple Numbers
- ✅ Web browsers (for viewing exported files)

---

## Customization Options

### Adjusting Sensitivity

**More Granular (Smaller Thresholds):**
```javascript
// Change thresholds to 5% and 15%
if (percentDiff > 15) { /* Level 1 */ }
else if (percentDiff > 5) { /* Level 2 */ }
else if (percentDiff < -15) { /* Level 5 */ }
else if (percentDiff < -5) { /* Level 4 */ }
else { /* Level 3 */ }
```

**Less Granular (Larger Thresholds):**
```javascript
// Change thresholds to 15% and 30%
if (percentDiff > 30) { /* Level 1 */ }
else if (percentDiff > 15) { /* Level 2 */ }
else if (percentDiff < -30) { /* Level 5 */ }
else if (percentDiff < -15) { /* Level 4 */ }
else { /* Level 3 */ }
```

### Alternative Icon Sets

**Triangle Set (More Subtle):**
- ▲ (U+25B2) - Much slower
- ◥ (U+25E5) - Moderately slower
- ■ (U+25A0) - Average
- ◢ (U+25E2) - Moderately faster
- ▼ (U+25BC) - Much faster

**Circle Set (Minimalist):**
- ● (U+25CF) + dark blue - Much slower
- ◐ (U+25D0) + medium blue - Moderately slower
- ○ (U+25CB) + gray - Average
- ◑ (U+25D1) + medium red - Moderately faster
- ● (U+25CF) + dark red - Much faster

---

## Version Information
- **Implementation Date:** October 17, 2025
- **File:** `src/utils/excelExport.js`
- **Function:** `applyColumnFormatting()`
- **Status:** Production Ready
- **Compatibility:** Excel 2016+, Google Sheets, LibreOffice Calc 7.0+
