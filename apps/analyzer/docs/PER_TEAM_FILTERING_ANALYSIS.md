# Per-Team Filtering - Technical Analysis & Options

## Current Status (v1.2)

### What Was Changed
- **Removed:** Global auto-filter from column headers
- **Added:** Instructional note on first team row explaining manual filtering
- **Result:** Clean sheet without automatic filters that could break team structure

### Why This Approach?

**Excel Limitation:**
Excel (and ExcelJS) only supports **ONE autofilter per worksheet**. This is a fundamental Excel limitation, not an ExcelJS restriction.

From ExcelJS documentation:
> "sheet.autoFilter" - Sets auto-filtering on a range. Only ONE autofilter allowed per sheet.

---

## Available Options for Per-Team Filtering

### Option 1: Manual Filtering (Current Implementation) ✅

**How it works:**
1. User selects a team section (team row + character rows)
2. User clicks Data > Filter in Excel
3. Filter dropdowns appear for that selection
4. User can filter/sort within that team
5. User must disable filter before working with another team

**Pros:**
- ✅ No code changes needed
- ✅ Preserves all custom formatting (maroon team rows, conditional formatting, etc.)
- ✅ Clean sheet appearance
- ✅ Full user control

**Cons:**
- ❌ Manual process (not automatic)
- ❌ Only one team filterable at a time
- ❌ User must remember to enable/disable filters

**Implementation Status:** ✅ Complete
- Instructional note added to first team cell
- No global filter interfering with layout

---

### Option 2: Excel Tables Per Team

**How it works:**
1. Each team section becomes an Excel Table
2. Each table has its own independent filter
3. Tables can be filtered simultaneously

**Pros:**
- ✅ True per-team filtering
- ✅ Multiple teams filterable at once
- ✅ Built-in Excel table features

**Cons:**
- ❌ **Table formatting overrides custom formatting**
  - Maroon team rows would become table headers (different style)
  - Conditional formatting may conflict with table styling
  - Alternating row colors controlled by table theme, not our code
- ❌ Team row becomes "header row" for the table
  - May look different than current design
  - Header styling different from data styling
- ❌ Tables add visual clutter (table borders, resize handles)
- ❌ Complex to implement while preserving current look

**Implementation Complexity:** HIGH
- Would require significant refactoring
- May require choosing between tables OR current formatting
- Testing needed to see if formatting can coexist

**Recommendation:** ❌ Not recommended
- **Formatting loss is too significant**
- Current visual design would be compromised

---

### Option 3: Separate Sheets Per Team

**How it works:**
1. Create one sheet for overall "Team Performance Matrix"
2. Create additional sheets: "Team: Z-Fighters", "Team: Namekians", etc.
3. Each team sheet has its own auto-filter
4. Users can filter individual teams on their own sheets

**Pros:**
- ✅ True independent filtering per team
- ✅ No formatting conflicts
- ✅ One filter per sheet (Excel's limit respected)
- ✅ Clean separation of data

**Cons:**
- ❌ Data duplication (same data in multiple sheets)
- ❌ More sheets to navigate
- ❌ Larger file size
- ❌ Updates would need to be synced across sheets

**Implementation Complexity:** MEDIUM
- Create duplicate sheets filtered by team
- Add sheet navigation
- Moderate code changes

**Recommendation:** ⚠️ Possible but not ideal
- Good for users who want to focus on one team
- Consider as future enhancement

---

### Option 4: Collapsible Team Sections (Current Feature)

**How it works:**
1. Team sections use Excel's outline/grouping feature
2. Users can collapse/expand teams using [+]/[-] buttons
3. Combined with manual filtering for focused analysis

**Pros:**
- ✅ Already implemented!
- ✅ Reduces visual clutter
- ✅ Works with manual filtering
- ✅ No formatting conflicts

**Cons:**
- ❌ Still requires manual filter setup
- ❌ Grouping doesn't provide filtering

**Implementation Status:** ✅ Already exists
- Row outline levels set for each team
- Team sections are collapsible

---

## Recommended Solution

### Current Approach is Best ✅

**Why:**
1. **Preserves Custom Formatting**
   - Maroon team rows stay maroon
   - Team-scoped conditional formatting works perfectly
   - No conflicts with table styling

2. **Clean User Experience**
   - No automatic filters that could confuse users
   - Clear instructions via cell note
   - Users have full control

3. **Follows Excel Best Practices**
   - Respects Excel's one-filter-per-sheet limitation
   - Doesn't try to work around fundamental restrictions
   - Uses Excel features as intended

4. **Professional Appearance**
   - No table borders or resize handles
   - Consistent formatting throughout
   - Looks polished and intentional

---

## User Workflow (Current Implementation)

### To Filter a Team:

**Step 1:** Collapse other teams (optional)
- Click [-] button next to team names to hide other teams
- Focuses view on one team

**Step 2:** Select team section
- Click on team row (e.g., "Z-Fighters")
- Shift+Click on last character row in that team
- Selection should include team row + all character rows

**Step 3:** Enable filter
- Go to Data tab → Filter
- OR press Ctrl+Shift+L
- Filter dropdowns appear on team row

**Step 4:** Use filters
- Click dropdown arrows
- Sort by any column
- Filter by values
- Filter by conditions

**Step 5:** When done
- Data tab → Filter (toggle off)
- OR Ctrl+Shift+L again
- Move to next team

---

## Future Enhancement Possibilities

### Option A: Keyboard Macro/VBA
Users could create a simple Excel macro:
```vba
Sub FilterTeam()
    ' Auto-select current team region and apply filter
    ActiveCell.CurrentRegion.Select
    Selection.AutoFilter
End Sub
```

### Option B: Instructions Sheet
Add a "How To Filter" worksheet with:
- Step-by-step screenshots
- Video link (if available)
- Keyboard shortcuts

### Option C: Team Comparison View
Create a separate pivot table or sheet that shows:
- Side-by-side team comparisons
- Top performers per team
- Team vs team statistics

---

## Technical Documentation

### Current Implementation Details:

**File:** `excelExport.js`

**Function:** `addPerTeamAutoFilters()`
- Adds instructional note to first team cell
- Explains manual filtering process
- Located after conditional formatting application

**Function:** `applyTeamMatrixFormatting()`
- Sets row outline levels for grouping
- Each team is a collapsible section
- Works with manual filtering

**No Global Filter:**
- Removed `sheet.autoFilter = { ... }` code
- Prevents accidental filter application
- Cleaner sheet presentation

---

## Summary

**Question:** "Can it be possible to add filtering/sorting options on a per team basis instead?"

**Answer:** 
Due to Excel's fundamental limitation of one autofilter per sheet, true automatic per-team filtering is **not possible without compromising the current formatting** (via Excel Tables).

**Current Solution:**
- Manual filtering workflow (documented above)
- Instructional note on first team
- Collapsible team sections for focus
- Clean, professional appearance

**This is the best approach because:**
1. Preserves all custom formatting
2. Respects Excel limitations
3. Provides clear user guidance
4. Maintains professional appearance
5. Gives users full control

**Recommendation:** ✅ Keep current implementation
No changes needed - the manual filtering approach is the optimal solution given Excel's constraints and our formatting requirements.
