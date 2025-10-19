# 📊 Excel Table Features Guide

**Dragon Ball Sparking Zero - Battle Analyzer**  
**Feature:** Hybrid Excel Tables with Custom Formatting  
**Version:** 2.1  
**Date:** October 17, 2025

---

## 🎯 **WHAT'S NEW**

Your exported Excel files now include **structured Excel Table objects** while preserving all custom formatting! This gives you the best of both worlds:

✅ **Keep:** Ultra-dark theme, build type icons, group headers, conditional formatting  
✅ **Gain:** Structured references, one-click pivot tables, auto-expansion, slicers

---

## 📋 **TABLE STRUCTURE**

### **How It Works**

Each sheet now has a **hybrid structure**:

```
Row 1:  [Group Headers - Custom Formatting]  ← Outside the table
        ┌─────────────────────────────────────┐
Row 2:  │ [Column Headers - Table Starts Here] │ ← Table header row
Row 3+: │ [Data Rows - Part of Table]          │ ← Table data
        └─────────────────────────────────────┘
```

**Row 1** = Custom merged group headers (Identity & Context, Combat Performance, etc.)  
**Rows 2+** = Excel Table object with filter dropdowns and structured references

---

## ✨ **NEW FEATURES**

### **1. Filter Dropdowns**

Every column header (Row 2) now has a **dropdown arrow** for filtering:

- Click the arrow next to any column name
- Select/deselect values to filter
- Use text filters, number filters, or custom conditions
- **Multiple columns can be filtered at once**

**Example:**
- Filter by "Primary Team" = "Z-Fighters"
- Then filter by "Build Archetype" = "Aggressive"
- See only aggressive Z-Fighter builds!

---

### **2. Structured References in Formulas**

Instead of using cell ranges like `E2:E100`, you can now use **table column names**:

#### **Old Way (Still Works):**
```excel
=AVERAGE(E2:E100)
=SUM(G2:G50)
```

#### **New Way (Easier to Read):**
```excel
=AVERAGE(CharacterAverages[Avg Damage Dealt])
=SUM(CharacterAverages[Total Kills])
```

#### **Benefits:**
- **Self-documenting** - formulas explain what they calculate
- **Auto-adjusting** - adding/removing rows automatically updates ranges
- **Safer** - column name changes update all references

#### **Table Names:**
- **Character Averages sheet:** `CharacterAverages`
- **Match Details sheet:** `MatchDetails`

---

### **3. One-Click Pivot Tables**

Creating pivot tables is now **much easier**:

#### **Method 1: Right-Click the Table**
1. Click any cell inside the table
2. Right-click → **Summarize with PivotTable**
3. Choose where to place it (new sheet recommended)
4. Drag fields to build your analysis

#### **Method 2: Insert Tab**
1. Click any cell inside the table
2. Go to **Insert** → **PivotTable**
3. Table range is auto-selected
4. Click OK

#### **Quick Pivot Ideas:**

**Analyze by Team:**
- **Rows:** Primary Team
- **Values:** Average Combat Score, Average Damage Dealt
- **Result:** Which teams perform best?

**Analyze by Build:**
- **Rows:** Build Archetype
- **Values:** Average Win Rate, Average Survival Rate
- **Result:** Which build type is most effective?

**Analyze by Character:**
- **Rows:** Character Name
- **Columns:** Primary Team
- **Values:** Match Count, Average Damage
- **Result:** How does each character perform across teams?

---

### **4. Named Ranges**

Each table also has a **named data range** for advanced users:

- **CharacterAveragesData** → Points to all character data (excluding headers)
- **MatchDetailsData** → Points to all match data (excluding headers)

#### **How to Use:**

In the **Name Box** (left of formula bar), you can type:
```
CharacterAveragesData
```
Press Enter, and Excel will select the entire data range!

#### **In Formulas:**
```excel
=COUNTIF(CharacterAveragesData[Build Archetype], "Aggressive")
=SUMIF(MatchDetailsData[Team Name], "Z-Fighters", MatchDetailsData[Damage Dealt])
```

---

### **5. Slicers (Visual Filters)**

Slicers are **interactive filter buttons** you can add to your table:

#### **How to Add Slicers:**
1. Click any cell in the table
2. Go to **Table Design** → **Insert Slicer**
3. Check the columns you want to filter by:
   - ✅ Primary Team
   - ✅ Build Archetype
   - ✅ Has Multiple Forms
4. Click OK

#### **Result:**
You get floating buttons that filter the table visually!

**Example:**
```
┌─────────────────┐  ┌─────────────────┐
│ Primary Team    │  │ Build Archetype │
├─────────────────┤  ├─────────────────┤
│ [Z-Fighters]    │  │ [Aggressive]    │
│ [ Saiyans  ]    │  │ [Defensive]     │
│ [ Namekians]    │  │ [ Technical]    │
└─────────────────┘  └─────────────────┘
```

Click a team + click a build → See only those matches!

---

## 🎨 **PRESERVED FORMATTING**

All your custom formatting is **still intact**:

### **✅ What's Preserved:**

- **Ultra-dark group headers** (Row 1) - Color-coded by category
- **Build type icons** - ⚔️ Aggressive, 🛡️ Defensive, ⚙️ Technical, 🔀 Hybrid
- **Conditional formatting** - Red→White→Green color scales
- **Alternating rows** - Subtle gray/white banding
- **White borders** - Clean cell separation
- **Number formatting** - Percentages, decimals, time formats
- **Column widths** - Optimized for readability

### **How It Works:**

The table is created **after** all formatting is applied, and we disable the table's built-in styling:

```javascript
style: {
  theme: null,              // No built-in theme (preserves custom colors)
  showRowStripes: false,    // We handle alternating rows manually
  showColumnStripes: false
}
```

This means you get table **functionality** without losing **visual polish**!

---

## 🔧 **TECHNICAL DETAILS**

### **Table Object Properties:**

| Property | Value | Notes |
|----------|-------|-------|
| **Table Name** | `CharacterAverages` or `MatchDetails` | Unique identifiers |
| **Header Row** | Row 2 | Filter dropdowns enabled |
| **Data Rows** | Row 3 onwards | Auto-expandable |
| **Table Style** | None (custom) | Preserves your formatting |
| **Filter Buttons** | Enabled | On every column |
| **Totals Row** | Disabled | Can enable manually if needed |

### **Named Ranges:**

| Name | Reference | Purpose |
|------|-----------|---------|
| `CharacterAveragesData` | `'Character Averages'!$A$3:$AQ$[lastRow]` | Full data range |
| `MatchDetailsData` | `'Match Details'!$A$3:$BG$[lastRow]` | Full data range |

### **Browser Console Output:**

When you export, you'll see:
```
✅ Created Excel Table: "CharacterAverages" (Rows 2-45, Columns A-AQ)
✅ Added Named Range: "CharacterAveragesData" for pivot table creation
✅ Created Excel Table: "MatchDetails" (Rows 2-142, Columns A-BG)
✅ Added Named Range: "MatchDetailsData" for pivot table creation
```

---

## 📚 **COMMON USE CASES**

### **Use Case 1: Find Top Performers**

**Goal:** See which characters have the highest damage efficiency

**Steps:**
1. Click **Avg Damage Dealt** column dropdown
2. Select **Sort Largest to Smallest**
3. Done! Top performers at the top

**Advanced:**
Add a slicer for "Primary Team" to filter by team first.

---

### **Use Case 2: Compare Builds**

**Goal:** See if Aggressive builds really do more damage

**Steps:**
1. Click any cell in the table
2. **Insert** → **PivotTable**
3. Drag **Build Archetype** to Rows
4. Drag **Avg Damage Dealt** to Values
5. Drag **Avg Damage Taken** to Values
6. Drag **Damage Efficiency** to Values
7. Compare the numbers!

---

### **Use Case 3: Team Performance Analysis**

**Goal:** Which team has the best survival rate?

**Steps:**
1. **Insert** → **PivotTable**
2. **Rows:** Primary Team
3. **Values:** Average of Survival Rate %
4. Sort by survival rate descending
5. See which teams stay alive longest!

---

### **Use Case 4: Character-Specific Deep Dive**

**Goal:** Analyze all matches for "Goku SSB"

**Steps:**
1. Go to **Match Details** sheet
2. Click **Character Name** dropdown
3. Uncheck "Select All"
4. Check only "Goku SSB"
5. See all Goku SSB matches with full details!

**Advanced:**
- Add slicers for **Team Name** and **Match Result**
- Filter to see only winning matches for Goku SSB on Z-Fighters

---

## ⚙️ **ADVANCED TIPS**

### **Tip 1: Add Calculated Columns**

You can add custom columns to the table that auto-calculate:

1. Click the first empty column next to the table
2. Type a header (e.g., "Damage Rating")
3. In the first data cell, enter a formula:
   ```excel
   =[@[Avg Damage Dealt]] / 1000
   ```
4. Press Enter - **formula auto-copies to all rows!**

### **Tip 2: Enable Totals Row**

Want to see column totals at the bottom?

1. Click any cell in the table
2. **Table Design** → Check **Total Row**
3. Click the total cell in any column
4. Choose function: Sum, Average, Count, etc.

**Example:** See total kills across all characters!

### **Tip 3: Convert Back to Range**

If you want to remove the table (keep data and formatting):

1. Click any cell in the table
2. **Table Design** → **Convert to Range**
3. Confirm "Yes"
4. Table features removed, formatting stays!

### **Tip 4: Duplicate for Experimentation**

Before experimenting with filters/sorts:

1. Right-click the sheet tab
2. **Move or Copy** → Check **Create a copy**
3. Experiment on the copy, keep original pristine!

---

## 🐛 **TROUBLESHOOTING**

### **Problem: Can't see filter dropdowns**

**Solution:** Filter buttons might be hidden
1. Click any cell in the table
2. **Table Design** → Check **Filter Button**

---

### **Problem: Formulas show #REF! error**

**Solution:** Table structure might be broken
1. Check that you didn't delete the header row (Row 2)
2. Re-export if needed (takes 5 seconds!)

---

### **Problem: Structured references not working**

**Solution:** You might be outside the table
1. Click inside the table (Rows 2+)
2. **Table Design** tab should appear in ribbon
3. If it doesn't, you're outside the table

---

### **Problem: Row 1 group headers look weird**

**Solution:** Row 1 is intentionally outside the table
- This is normal! Row 1 provides visual grouping
- The actual table starts at Row 2
- Don't try to sort/filter Row 1

---

### **Problem: Custom colors disappeared**

**Solution:** You may have applied a table style accidentally
1. Click in the table
2. **Table Design** → **Table Styles** → **Clear**
3. Re-export if colors still gone

---

## 📖 **LEARNING RESOURCES**

### **Microsoft Documentation:**
- [Excel Tables Overview](https://support.microsoft.com/excel-tables)
- [Structured References](https://support.microsoft.com/structured-references)
- [PivotTables from Tables](https://support.microsoft.com/pivot-tables)
- [Slicers](https://support.microsoft.com/excel-slicers)

### **Quick Video Tutorials:**
- "Excel Tables 101" - Search YouTube
- "Structured References Explained" - Search YouTube
- "Pivot Tables Made Easy" - Search YouTube

---

## 🎯 **QUICK REFERENCE CARD**

| Want to... | Do this... |
|------------|------------|
| **Filter data** | Click dropdown arrow in any column header (Row 2) |
| **Sort data** | Column dropdown → Sort A to Z / Z to A |
| **Create pivot table** | Right-click table → Summarize with PivotTable |
| **Add slicer** | Table Design → Insert Slicer → Pick columns |
| **Use column in formula** | `=SUM(CharacterAverages[Column Name])` |
| **Select whole table** | Click top-left corner of table (▼ icon) |
| **Jump to data range** | Name Box → Type `CharacterAveragesData` → Enter |
| **Add totals row** | Table Design → Check Total Row |
| **Remove table (keep data)** | Table Design → Convert to Range |

---

## 🎉 **CONCLUSION**

You now have **professional-grade Excel exports** with:

✅ Beautiful custom formatting (ultra-dark theme, icons, colors)  
✅ Powerful table features (filters, structured references, pivots)  
✅ Easy analysis capabilities (slicers, sorting, calculated columns)  
✅ Named ranges for advanced formulas  

**The best part?** Row 1 group headers stay outside the table, so you get visual organization **AND** table functionality!

---

**Enjoy your enhanced exports!** 🚀

If you have questions or want to add more features, let me know!

---

**Document Version:** 1.0  
**Last Updated:** October 17, 2025  
**Related Files:**
- `src/utils/excelExport.js` - Table implementation
- `DATA_TABLES_EXPORT_PLAN.md` - Full specification
