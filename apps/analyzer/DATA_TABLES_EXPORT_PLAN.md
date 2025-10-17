# 📊 Data Tables & Export Implementation Plan

**Dragon Ball Sparking Zero - Battle Analyzer**  
**Version:** 2.0  
**Date:** October 17, 2025  
**Status:** Design Phase - Ready for Implementation

---

## 🎯 **OVERVIEW**

This document outlines the comprehensive redesign of the Data Tables section and enhanced export functionality for the DBSZ Battle Analyzer. The goal is to provide detailed, formatted, and easily analyzable data exports for immediate human use.

### **Key Objectives:**
1. ✅ Split data into two comprehensive tables (Averages + Individual Matches)
2. ✅ Provide richly formatted Excel exports with visual indicators
3. ✅ Generate automated pivot tables and analysis sheets
4. ✅ Enable direct Google Sheets integration
5. ✅ Maintain all character stats and details currently tracked

---

## 📋 **TABLE 1: CHARACTER PERFORMANCE AVERAGES**

### **Purpose**
High-level overview of each character's overall performance across all matches.

### **Data Structure**
**One row per character** containing aggregated/averaged statistics.

---

### **Column Groups**

#### **A. Identity & Context** (4 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Character Name | String | Character's name | Bold, left-aligned |
| Primary Team | String | Most commonly used team | Normal text |
| Primary AI Strategy | String | Most frequently used AI | Badge-style |
| Matches Played | Integer | Total matches analyzed | Right-aligned, numeric |

---

#### **B. Combat Performance** (6 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Avg Damage Dealt | Integer | Average damage per match | Number format with comma separator |
| Avg Damage Taken | Integer | Average damage received per match | Number format with comma separator |
| Damage Efficiency | Decimal | Ratio: Damage Dealt / Damage Taken | 2 decimal places, icon sets (arrows) |
| Damage Over Time (DPS) | Decimal | Damage / Battle Time | 1 decimal place, "/sec" suffix |
| Combat Performance Score | Integer | Overall performance score | Color scale (red→yellow→green), bold |
| Avg Battle Time | Decimal | Average match duration in seconds | Time format (mm:ss) |

**Export Formatting:**
- Conditional formatting: Heatmap for Combat Score (excellent = dark green)
- Data bars for Avg Damage Dealt
- Icon sets for Damage Efficiency (↑ good, → average, ↓ poor)

---

#### **C. Survival & Health** (6 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Max Health | Integer | Maximum HP value | Number format with comma separator |
| Avg HP Remaining | Integer | Average health left after match | Number format, conditional green scale |
| HP Retention % | Percentage | (HP Remaining / Max HP) × 100 | Percentage format, 1 decimal |
| Survival Rate % | Percentage | % of matches survived | Percentage format, conditional formatting |
| Avg Guards | Decimal | Average guard count per match | 1 decimal place |
| Avg Revenge Counters | Decimal | Average revenge counter uses | 1 decimal place |
| Avg Super Counters | Decimal | Average super counter uses | 1 decimal place |
| Avg Z-Counters | Decimal | Average Z-counter uses | 1 decimal place |

**Export Formatting:**
- HP Retention: Color scale (0% = red, 100% = green)
- Survival Rate: Icon sets (❤️ for high survival)
- Counter stats: Heatmap coloring

---

#### **D. Special Abilities** (7 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Avg Super 1 Blasts (SPM1) | Decimal | Average Super 1 special move usage | 1 decimal place |
| Avg Super 2 Blasts (SPM2) | Decimal | Average Super 2 special move usage | 1 decimal place |
| Avg Ultimate 1 (EXA1) | Decimal | Average Ultimate 1 usage | 1 decimal place |
| Avg Ultimate 2 (EXA2) | Decimal | Average Ultimate 2 usage | 1 decimal place |
| Avg Skill 1 Usage | Decimal | Average Skill 1 button usage | 1 decimal place |
| Avg Skill 2 Usage | Decimal | Average Skill 2 button usage | 1 decimal place |
| Avg Ki Blasts | Decimal | Average energy bullet count | 1 decimal place |
| Avg Charges | Decimal | Average ki charge count | 1 decimal place |
| Avg Sparkings | Decimal | Average sparking activation count | 1 decimal place, ⚡ icon |
| Avg Dragon Dash Mileage | Decimal | Average distance traveled | 1 decimal place |

**Export Formatting:**
- Heatmap: Higher usage = darker color
- Sparking row: Special highlight (gold/orange background)
- Data bars for high-usage abilities

---

#### **E. Combat Mechanics** (11 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Avg Max Combo Hits | Decimal | Average maximum combo length | 1 decimal place |
| Avg Max Combo Damage | Integer | Average max combo damage value | Number format |
| Avg Throws | Decimal | Average throw count | 1 decimal place |
| Avg Lightning Attacks | Decimal | Average lightning attack usage | 1 decimal place |
| Avg Vanishing Attacks | Decimal | Average vanishing attack usage | 1 decimal place |
| Avg Dragon Homing | Decimal | Average dragon homing usage | 1 decimal place |
| Avg Speed Impacts | Decimal | Average speed impact triggers | 1 decimal place |
| Speed Impact Win Rate % | Percentage | (Speed Impact Wins / Speed Impacts) × 100 | Percentage, conditional color |
| Avg Sparking Combo | Decimal | Average combo during sparking | 1 decimal place, gold highlight |
| Total Kills | Integer | Total KOs across all matches | Bold, trophy icon 🏆 |
| Avg Kills | Decimal | Average KOs per match | 1 decimal place |

**Export Formatting:**
- Max Combo: Data bars (longer = better)
- Speed Impact Win Rate: Traffic light colors (red/yellow/green)
- Total Kills: Bold with trophy icon
- Throw/Attack stats: Subtle heatmap

---

#### **F. Build & Equipment** (6 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Build Archetype | String | Primary build type (Aggressive/Defensive/Technical/Hybrid) | Color-coded badges |
| Damage Capsules Count | Integer | Number of offensive capsules | Number format |
| Defensive Capsules Count | Integer | Number of defensive capsules | Number format |
| Utility Capsules Count | Integer | Number of utility capsules | Number format |
| Total Capsule Cost | Integer | Combined cost of all capsules | Currency-style format |
| Most Used Capsules | String | Top 3 capsules (comma-separated) | Wrapped text, smaller font |

**Build Archetype Color Coding:**
- **Aggressive:** Red background, white text
- **Defensive:** Green background, white text
- **Technical:** Blue background, white text
- **Hybrid:** Purple background, white text
- **No Build:** Gray background, dark text

**Export Formatting:**
- Build Archetype: Colored cell with bold text
- Capsule costs: "$" prefix, comma separator
- Heatmap for capsule type counts

---

#### **G. Form Changes** (3 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Has Multiple Forms | Boolean | Y/N indicator | Center-aligned, icon (✓/✗) |
| Form Count | Integer | Number of unique forms used | Number format |
| Form History | String | All forms used (comma-separated) | Wrapped text, italic |

**Export Formatting:**
- Has Multiple Forms: ✓ (green) or ✗ (gray)
- Form History: Italic, smaller font, wrapped text

---

### **Total Columns: ~43 columns**

### **Export Sheet Configuration**

**Sheet Name:** `Character Averages`

**Features:**
- ✅ Freeze panes on header row
- ✅ Auto-filter enabled on all columns
- ✅ Column widths auto-fit to content
- ✅ Header row: Bold, white text, dark blue (#4472C4) background
- ✅ Alternating row colors for readability
- ✅ Conditional formatting applied to performance metrics
- ✅ Named range: "CharacterData" for easy pivot table creation

---

## 📋 **TABLE 2: INDIVIDUAL MATCH PERFORMANCE DETAILS**

### **Purpose**
Granular per-match data for deep-dive analysis and trend identification.

### **Data Structure**
**Multiple rows per character** (one row per match).

---

### **Column Groups**

#### **A. Match Identity** (6 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Character Name | String | Character's name | Bold, left-aligned |
| Match Number | Integer | Sequential match number per character | Gray background, center-aligned |
| Team Name | String | Team played on | Normal text |
| Opponent Team | String | Enemy team name | Normal text |
| Match Result | String | "Win" or "Loss" | Conditional: Win=Green ✓, Loss=Red ✗ |
| File Name | String | Source JSON file | Smaller font, gray text |

**Export Formatting:**
- Match Number: Gray (#E0E0E0) background
- Match Result: 
  - Win: Light green background, bold "W" with ✓
  - Loss: Light red background, bold "L" with ✗
- Alternating row colors per character for easy reading

---

#### **B. Combat Performance** (7 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Damage Dealt | Integer | Total damage in this match | Number format |
| Damage Taken | Integer | Total damage received | Number format |
| Damage Efficiency | Decimal | Dealt / Taken ratio | 2 decimals, icon sets |
| Damage Per Second (DPS) | Decimal | Damage / Battle Duration | 1 decimal, "/sec" suffix |
| Battle Duration (seconds) | Decimal | Match length | Time format (mm:ss) |
| Kills | Integer | Opponent characters defeated | Number, trophy icon 🏆 |
| Avg Kills | Decimal | Average kills in match | 1 decimal place |

**Export Formatting:**
- Damage columns: Heatmap per character (compare across their matches)
- Efficiency: Icon sets (↑↑ excellent, ↑ good, → average, ↓ poor)
- Sparkline charts showing damage trend per character (in margin column)

---

#### **C. Survival & Health** (7 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| HP Remaining | Integer | Health left at match end | Number format |
| Max HP | Integer | Maximum health value | Number format |
| HP Retention % | Percentage | (Remaining / Max) × 100 | Percentage, 1 decimal, conditional color |
| Guards Used | Integer | Guard count | Number |
| Revenge Counters | Integer | Revenge counter uses | Number |
| Super Counters | Integer | Super counter uses | Number |
| Z-Counters | Integer | Z-counter uses | Number |

**Export Formatting:**
- HP Retention: Color scale (red→yellow→green)
- Counter stats: Highlight max values per character (bold + border)
- Zero values: Light gray text

---

#### **D. Special Abilities** (10 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Super 1 Blasts (SPM1) | Integer | Super 1 move count | Number |
| Super 2 Blasts (SPM2) | Integer | Super 2 move count | Number |
| Ultimate 1 (EXA1) | Integer | Ultimate 1 count | Number |
| Ultimate 2 (EXA2) | Integer | Ultimate 2 count | Number |
| Skill 1 Usage | Integer | Skill 1 button presses | Number |
| Skill 2 Usage | Integer | Skill 2 button presses | Number |
| Ki Blasts | Integer | Energy bullet count | Number |
| Charges | Integer | Ki charge count | Number |
| Sparkings | Integer | Sparking activations | Number, ⚡ icon, gold highlight |
| Dragon Dash Mileage | Decimal | Distance traveled | 1 decimal |

**Export Formatting:**
- Heatmap by character (identify high-usage matches)
- Sparking row: Gold/orange background (#FFA500)
- Data bars for abilities with high variance

---

#### **E. Combat Mechanics** (11 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Max Combo Hits | Integer | Longest combo in match | Number, data bars |
| Max Combo Damage | Integer | Damage from max combo | Number format |
| Throws | Integer | Throw count | Number |
| Lightning Attacks | Integer | Lightning attack count | Number |
| Vanishing Attacks | Integer | Vanishing attack count | Number |
| Dragon Homing | Integer | Dragon homing count | Number |
| Speed Impacts | Integer | Speed impact triggers | Number |
| Speed Impact Wins | Integer | Speed impacts won | Number, conditional formatting |
| Speed Impact Win Rate % | Percentage | (Wins / Total) × 100 | Percentage, traffic lights |
| Sparking Combo Hits | Integer | Max combo during sparking | Number, gold highlight |
| Sparking Combo Damage | Integer | Combo damage during sparking | Number, gold highlight |

**Export Formatting:**
- Max Combo: Data bars showing relative length
- Speed Impact metrics: Conditional icons (✓ for wins, ✗ for losses)
- Sparking combos: Gold (#FFD700) cell background
- Zero values: Grayed out

---

#### **F. Build & Equipment** (Up to 15 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Build Archetype | String | Build type for this match | Color-coded badge |
| Capsule 1 | String | First equipped capsule name | Wrapped text |
| Capsule 2 | String | Second equipped capsule name | Wrapped text |
| Capsule 3 | String | Third equipped capsule name | Wrapped text |
| Capsule 4 | String | Fourth equipped capsule name | Wrapped text |
| Capsule 5 | String | Fifth equipped capsule name | Wrapped text |
| Capsule 6 | String | Sixth equipped capsule name | Wrapped text |
| Capsule 7 | String | Seventh equipped capsule name (max) | Wrapped text |
| Total Capsule Cost | Integer | Sum of all capsule costs | Currency format |
| Damage Capsules | Integer | Count of offensive capsules | Number |
| Defensive Capsules | Integer | Count of defensive capsules | Number |
| Utility Capsules | Integer | Count of utility capsules | Number |
| AI Strategy | String | AI strategy used | Badge-style |

**Export Formatting:**
- Build Archetype: Same color coding as Table 1
- Capsule names: Smaller font (9pt), wrapped text, light gray border
- Empty capsule slots: Display as "—" (em dash)
- Capsule costs: "$" prefix
- AI Strategy: Light blue background, rounded border effect

---

#### **G. Form Changes** (3 columns)
| Column Name | Data Type | Description | Export Format |
|-------------|-----------|-------------|---------------|
| Forms Used | String | All forms in this match (comma-separated) | Wrapped text, italic |
| Form Change Count | Integer | Number of transformations | Number |
| Started As | String | Initial form at match start | Bold |

**Export Formatting:**
- Forms Used: Italic, smaller font
- Form Change Count: Badge with number
- Started As: Bold, primary form indicator

---

### **Total Columns: ~59 columns**

### **Export Sheet Configuration**

**Sheet Name:** `Match Details`

**Features:**
- ✅ Freeze panes on header row
- ✅ Auto-filter enabled on all columns
- ✅ Group rows by character (expandable/collapsible)
- ✅ Header row: Bold, white text, dark blue background
- ✅ Alternating colors per character (not per row) for easy visual grouping
- ✅ Conditional formatting for standout performances
- ✅ Named range: "MatchData" for pivot table creation
- ✅ Sparkline charts in margin showing damage trend per character

---

## 📊 **ADDITIONAL ANALYSIS SHEETS**

### **Sheet 3: Character by Team (Pivot Table)**

**Purpose:** Analyze character performance across different teams.

**Configuration:**
```
Rows: Team Name
Columns: Character Name
Values:
  - Count of Matches
  - Average Damage Dealt
  - Average HP Retention %
  - Win Rate %
  - Average Combat Score
```

**Formatting:**
- Heatmap coloring (performance scale)
- Totals row and column
- Grand total with overall statistics
- Conditional formatting: Green for high performers, red for low

**Charts Included:**
- Stacked bar chart: Team composition frequency
- Scatter plot: Damage vs Survival by team

---

### **Sheet 4: Build Archetype Analysis (Pivot Table)**

**Purpose:** Compare performance across different build types.

**Configuration:**
```
Rows: Build Archetype (Aggressive, Defensive, Technical, Hybrid)
Values:
  - Count of Uses
  - Average Damage Dealt
  - Average Damage Taken
  - Average HP Retention %
  - Average Win Rate %
  - Average Survival Rate %
```

**Formatting:**
- Build archetype color coding
- Data bars for value columns
- Percentage formats with 1 decimal
- Summary statistics at bottom

**Charts Included:**
1. **Pie Chart:** Distribution of build archetypes used
2. **Bar Chart:** Win rate by build type
3. **Scatter Plot:** Damage vs Survival colored by build
4. **Line Chart:** Build popularity over time (if file timestamps available)

---

### **Sheet 5: Position Performance (Pivot Table)**

**Purpose:** Analyze how characters perform in Lead/Middle/Anchor positions.

**Configuration:**
```
Rows: Position (Lead, Middle, Anchor)
Columns: Character Name
Values:
  - Match Count
  - Average Damage Dealt
  - Average HP Retention %
  - Average Battle Time
  - Average Kills
```

**Formatting:**
- Position badges with color coding:
  - Lead: Red
  - Middle: Blue
  - Anchor: Green
- Heatmap for performance metrics
- Conditional icons for standout performers

**Charts Included:**
- Clustered bar chart: Damage by position
- Radar chart: Character performance across positions (for multi-position characters)

---

### **Sheet 6: Top Performers (Pre-Sorted Tables)**

**Purpose:** Quick reference for best-performing characters.

**Contains 6 Tables:**

1. **Top 10 by Total Damage**
2. **Top 10 by Survival Rate**
3. **Top 10 by Combat Performance Score**
4. **Top 10 by Win Rate**
5. **Top 10 by Efficiency (Damage/Taken Ratio)**
6. **Top 10 by Sparking Usage**

**Formatting:**
- Ranking column with medals:
  - 1st: 🥇 Gold background
  - 2nd: 🥈 Silver background
  - 3rd: 🥉 Bronze background
  - 4-10: Gradient fade
- Character names in bold
- Metric values highlighted
- Miniature bar charts for visual comparison

---

### **Sheet 7: Summary Dashboard**

**Purpose:** Executive summary with key insights.

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  DRAGON BALL SPARKING ZERO - ANALYSIS SUMMARY      │
│  Generated: [Date/Time]                             │
│  Data Source: [File Count] match files              │
└─────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Total Matches    │  │ Total Characters │  │ Date Range       │
│      142         │  │        58        │  │  Oct 1 - Oct 15  │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌─────────────────────────────────────────────────────┐
│  TOP 5 MOST USED CHARACTERS                         │
│  1. Goku (12 matches) ▓▓▓▓▓▓▓▓▓▓▓▓                  │
│  2. Vegeta (10 matches) ▓▓▓▓▓▓▓▓▓▓                  │
│  3. Gohan (9 matches) ▓▓▓▓▓▓▓▓▓                     │
│  4. Piccolo (8 matches) ▓▓▓▓▓▓▓▓                    │
│  5. Frieza (7 matches) ▓▓▓▓▓▓▓                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  TOP 5 TEAMS                                        │
│  1. Z-Fighters (35 matches)                         │
│  2. Saiyans (28 matches)                            │
│  3. Frieza Force (22 matches)                       │
│  4. Namekians (18 matches)                          │
│  5. Androids (15 matches)                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  BUILD DISTRIBUTION                  [Pie Chart]    │
│  • Aggressive: 35%                                  │
│  • Defensive: 25%                                   │
│  • Technical: 20%                                   │
│  • Hybrid: 15%                                      │
│  • No Build: 5%                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  OVERALL STATISTICS                                 │
│  • Avg Damage per Match: 45,230                     │
│  • Avg Match Duration: 2:45                         │
│  • Avg Survival Rate: 68.5%                         │
│  • Most Used Capsule: Z-Soul (45 times)             │
│  • Highest Combat Score: Goku SSB (325)             │
└─────────────────────────────────────────────────────┘
```

**Formatting:**
- Large, bold summary numbers (18pt font)
- Small charts and sparklines
- Color-coded KPIs (green=good, red=needs attention)
- Clean, professional layout
- Minimal borders, maximum readability

---

## 🎨 **EXCEL FORMATTING CAPABILITIES**

### **What We Can Do with XLSX Library:**

#### ✅ **Cell Formatting**
- **Fonts:** Bold, italic, underline, size, family, color
- **Alignment:** Horizontal (left/center/right), vertical (top/middle/bottom), text wrap
- **Borders:** All sides, custom sides, styles (thin/medium/thick/dashed/dotted)
- **Fills:** Background colors, pattern fills, gradients
- **Number Formats:** 
  - Currency: `$#,##0.00`
  - Percentage: `0.0%`
  - Time: `mm:ss`
  - Custom: `#,##0` (comma separator)

#### ✅ **Conditional Formatting**
- **Color Scales:** 2-color or 3-color gradients
- **Data Bars:** Visual bars representing values
- **Icon Sets:** Arrows, traffic lights, stars, flags, shapes
- **Rules:** Greater than, less than, between, above/below average

#### ✅ **Layout Features**
- **Freeze Panes:** Lock header rows/columns
- **Auto-Filter:** Enable filtering dropdowns
- **Column Width:** Auto-fit or custom pixel width
- **Row Height:** Auto or custom
- **Merge Cells:** Span multiple cells
- **Hide/Unhide:** Rows or columns

#### ✅ **Advanced Features**
- **Named Ranges:** Cell references with custom names
- **Formulas:** SUM, AVERAGE, IF, VLOOKUP, INDEX/MATCH (calculated on open)
- **Data Validation:** Dropdown lists, numeric constraints, custom rules
- **Comments:** Cell notes and annotations
- **Grouping:** Collapsible row/column groups
- **Sparklines:** Mini in-cell charts (line, column, win/loss)

#### ⚠️ **Limitations**
- Full pivot table creation requires `exceljs` library (XLSX has limited support)
- Some advanced chart types need post-processing in Excel
- Conditional formatting rules are simplified (basic support)

### **Recommended Library Upgrade:**

For full Excel feature support, consider using **`exceljs`** instead of `xlsx`:

```javascript
import ExcelJS from 'exceljs';

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet('Character Averages');

// Full styling support
sheet.getCell('A1').fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4472C4' }
};

// Advanced conditional formatting
sheet.addConditionalFormatting({
  ref: 'E2:E100',
  rules: [{
    type: 'colorScale',
    cfvo: [
      { type: 'min', color: { argb: 'FFF8696B' } },
      { type: 'percentile', value: 50, color: { argb: 'FFFFEB84' } },
      { type: 'max', color: { argb: 'FF63BE7B' } }
    ]
  }]
});

// Save file
await workbook.xlsx.writeBuffer();
```

**Benefits of ExcelJS:**
- Full Excel Open XML support
- Native pivot table creation
- Advanced chart generation
- Better performance with large datasets
- Active maintenance and community

---

## 🌐 **GOOGLE SHEETS INTEGRATION OPTIONS**

### **Option A: Google Sheets API (Recommended for Full Features)**

**How it works:**
1. User clicks "Export to Google Sheets"
2. OAuth authentication popup (one-time setup)
3. App creates new Google Sheet via API
4. Data and formatting uploaded directly
5. Share link returned to user

**Implementation Steps:**

1. **Setup Google Cloud Project**
   ```bash
   - Create project at console.cloud.google.com
   - Enable Google Sheets API
   - Create OAuth 2.0 credentials
   - Add authorized JavaScript origins
   ```

2. **Install Dependencies**
   ```bash
   npm install googleapis google-auth-library
   ```

3. **Authentication Code**
   ```javascript
   import { google } from 'googleapis';
   
   const oauth2Client = new google.auth.OAuth2(
     CLIENT_ID,
     CLIENT_SECRET,
     REDIRECT_URI
   );
   
   // Get authorization URL
   const authUrl = oauth2Client.generateAuthUrl({
     access_type: 'offline',
     scope: ['https://www.googleapis.com/auth/spreadsheets']
   });
   
   // After user authorizes, exchange code for tokens
   const { tokens } = await oauth2Client.getToken(code);
   oauth2Client.setCredentials(tokens);
   ```

4. **Create and Populate Sheet**
   ```javascript
   const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
   
   // Create new spreadsheet
   const spreadsheet = await sheets.spreadsheets.create({
     requestBody: {
       properties: { title: 'DBSZ Analysis - ' + new Date().toLocaleDateString() }
     }
   });
   
   // Add data
   await sheets.spreadsheets.values.update({
     spreadsheetId: spreadsheet.data.spreadsheetId,
     range: 'Character Averages!A1',
     valueInputOption: 'RAW',
     requestBody: { values: dataRows }
   });
   
   // Apply formatting
   await sheets.spreadsheets.batchUpdate({
     spreadsheetId: spreadsheet.data.spreadsheetId,
     requestBody: {
       requests: [
         {
           repeatCell: {
             range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
             cell: {
               userEnteredFormat: {
                 backgroundColor: { red: 0.27, green: 0.45, blue: 0.77 },
                 textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
               }
             },
             fields: 'userEnteredFormat(backgroundColor,textFormat)'
           }
         }
       ]
     }
   });
   
   // Return share URL
   return spreadsheet.data.spreadsheetUrl;
   ```

**Pros:**
✅ Direct integration, no file downloads  
✅ Full formatting support (colors, fonts, borders, etc.)  
✅ Can update existing sheets  
✅ Immediate sharing capabilities  
✅ Can add formulas and conditional formatting  

**Cons:**
❌ Requires OAuth setup and user authorization  
❌ More complex implementation  
❌ API rate limits (100 requests per 100 seconds)  
❌ Needs Google Cloud project configuration  

---

### **Option B: XLSX Export with Google Sheets Import Link (Balanced)**

**How it works:**
1. Generate XLSX file locally (existing functionality)
2. Show two buttons:
   - "Download Excel File" (standard download)
   - "Import to Google Sheets" (opens Google with file)
3. User uploads file to Google Sheets (one extra click)

**Implementation:**
```javascript
function exportWithGoogleSheetsOption(workbook, fileName) {
  // Generate XLSX blob
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  // Save to temporary URL
  const blobUrl = URL.createObjectURL(blob);
  
  // Show modal with options
  showExportModal({
    downloadUrl: blobUrl,
    downloadFileName: fileName,
    googleSheetsImportUrl: 'https://docs.google.com/spreadsheets/create?usp=drive_web',
    instructions: 'Click "Import to Google Sheets" and upload the downloaded file'
  });
}
```

**Pros:**
✅ No authentication required  
✅ Uses existing XLSX generation code  
✅ Simple implementation  
✅ Most formatting preserved  
✅ Works offline  

**Cons:**
⚠️ Requires manual import step  
⚠️ Some advanced formatting may not transfer perfectly  
⚠️ Two-click process (download + import)  

---

### **Option C: Direct CSV with Instant Google Sheets Creation (Simplest)**

**How it works:**
1. Generate CSV data from tables
2. Encode CSV as base64 or URL parameter
3. Open Google Sheets URL with CSV pre-loaded
4. User sees instant sheet (may need to sign in)

**Implementation:**
```javascript
function exportToGoogleSheetsCSV(data, columns) {
  // Generate CSV
  const csv = generateCSV(data, columns);
  
  // Method 1: Use Google Sheets import URL
  const encoded = encodeURIComponent(csv);
  const sheetsUrl = `https://docs.google.com/spreadsheets/d/create?usp=sheets_web#gid=0`;
  
  // Open in new tab (user will manually paste CSV or use import)
  window.open(sheetsUrl, '_blank');
  
  // Also copy CSV to clipboard for easy paste
  navigator.clipboard.writeText(csv);
  alert('CSV copied to clipboard! Paste into Google Sheets (Ctrl+V)');
}

// Method 2: Use Data URI (works for smaller datasets)
function exportSmallDatasetDirect(csvData) {
  const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = 'dbsz_analysis.csv';
  link.click();
  
  // Then show Google Sheets import link
  window.open('https://sheets.new', '_blank');
}
```

**Pros:**
✅ No authentication  
✅ Near-instant  
✅ Very simple code  
✅ No downloads needed  

**Cons:**
❌ No formatting (plain CSV)  
❌ URL length limits for large datasets  
❌ May require manual paste or import  
❌ Some data types may not transfer correctly  

---

### **Option D: Hybrid Approach (Recommended)**

Provide **all three options** in the export modal:

```
┌────────────────────────────────────────────────┐
│  Export Your Analysis                          │
├────────────────────────────────────────────────┤
│                                                │
│  Choose your preferred export method:          │
│                                                │
│  [📥 Download Excel File (.xlsx)]             │
│  Full formatting, works offline, ~2MB          │
│                                                │
│  [📊 Import to Google Sheets (via XLSX)]      │
│  Good formatting, requires upload step         │
│                                                │
│  [🔗 Open in Google Sheets (instant)]         │
│  Basic formatting, immediate access            │
│                                                │
│  [🔒 Export with Google API (best quality)]   │
│  Perfect formatting, requires sign-in (once)   │
│                                                │
└────────────────────────────────────────────────┘
```

**Implementation:**
```javascript
const ExportModal = ({ data, onClose }) => {
  const [exportMethod, setExportMethod] = useState(null);
  
  const handleExport = async (method) => {
    switch(method) {
      case 'download':
        await exportXLSX(data);
        break;
      case 'google-upload':
        await exportXLSXAndOpenGoogleImport(data);
        break;
      case 'google-instant':
        await exportCSVToGoogleSheets(data);
        break;
      case 'google-api':
        await exportViaGoogleAPI(data);
        break;
    }
    onClose();
  };
  
  return (
    <Modal>
      {/* UI with 4 export buttons */}
    </Modal>
  );
};
```

---

## ⚙️ **EXPORT CONFIGURATION OPTIONS**

### **Pre-Export Configuration Modal**

Allow users to customize their export before generation:

```
┌────────────────────────────────────────────────┐
│  Configure Your Export                         │
├────────────────────────────────────────────────┤
│                                                │
│  📋 Tables to Include:                         │
│  ☑ Character Performance Averages              │
│  ☑ Individual Match Details                    │
│  ☑ Build Archetype Analysis (Pivot)            │
│  ☑ Position Performance (Pivot)                │
│  ☑ Top Performers List                         │
│  ☑ Summary Dashboard                           │
│                                                │
│  🎨 Formatting:                                │
│  ● Full (All colors, icons, conditional)       │
│  ○ Medium (Colors and borders only)            │
│  ○ Minimal (Plain with borders)                │
│                                                │
│  🔍 Data Filters:                              │
│  Min matches per character: [5 ▼]              │
│  ☐ Only characters with multiple forms         │
│  ☐ Only winning matches                        │
│                                                │
│  📊 Column Visibility:                         │
│  [Customize Columns...]                        │
│                                                │
│  📁 File Options:                              │
│  File name: [dbsz_analysis_2025-10-17]        │
│  ☐ Include metadata sheet                      │
│  ☐ Add filter instructions sheet               │
│                                                │
│  [Cancel]  [Export with these settings]        │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 🚀 **IMPLEMENTATION ROADMAP**

### **Phase 1: Data Structure & Table Generation** (Priority: High)
**Time Estimate:** 2-3 hours

**Tasks:**
- [ ] Create `generateCharacterAveragesTable()` function
- [ ] Create `generateMatchDetailsTable()` function
- [ ] Ensure all stats from extractStats() are mapped correctly
- [ ] Add support for up to 7 capsules in match details
- [ ] Test with existing aggregatedData

**Files to Modify:**
- `/src/components/TableConfigs.jsx` - Add new table configurations
- `/src/components/DataTable.jsx` - Update to handle new column structures

---

### **Phase 2: Basic XLSX Export** (Priority: High)
**Time Estimate:** 3-4 hours

**Tasks:**
- [ ] Upgrade to `exceljs` library (or enhance `xlsx` usage)
- [ ] Implement basic sheet generation (2 data sheets)
- [ ] Add header row formatting (bold, colored background)
- [ ] Implement column width auto-fitting
- [ ] Add freeze panes and auto-filter
- [ ] Test file download functionality

**Files to Create/Modify:**
- `/src/utils/excelExport.js` - New utility file for Excel generation
- `/src/components/ExportManager.jsx` - Update export logic

---

### **Phase 3: Advanced Formatting** (Priority: Medium)
**Time Estimate:** 4-5 hours

**Tasks:**
- [ ] Implement conditional formatting (color scales, data bars, icons)
- [ ] Add cell-specific formatting (build archetype colors, match result badges)
- [ ] Create number formatting (currency, percentage, time)
- [ ] Add alternating row colors
- [ ] Implement grouped rows for match details
- [ ] Add sparklines for trend visualization

**Files to Modify:**
- `/src/utils/excelExport.js` - Enhanced formatting functions
- `/src/utils/formatters.js` - Add Excel-specific formatters

---

### **Phase 4: Pivot Tables & Analysis Sheets** (Priority: Medium)
**Time Estimate:** 5-6 hours

**Tasks:**
- [ ] Generate "Character by Team" pivot table
- [ ] Generate "Build Archetype Analysis" pivot table
- [ ] Generate "Position Performance" pivot table
- [ ] Create "Top Performers" pre-sorted tables
- [ ] Build "Summary Dashboard" sheet
- [ ] Add charts to pivot sheets (if using exceljs)

**Files to Create:**
- `/src/utils/pivotTableGenerator.js` - Pivot table creation logic
- `/src/utils/summaryDashboard.js` - Dashboard generation

---

### **Phase 5: Google Sheets Integration** (Priority: Low-Medium)
**Time Estimate:** 6-8 hours

**Tasks:**
- [ ] Set up Google Cloud project and OAuth
- [ ] Implement OAuth flow in React app
- [ ] Create Google Sheets API integration
- [ ] Add CSV export with clipboard copy
- [ ] Create export method selection modal
- [ ] Test all three Google Sheets export methods

**Files to Create:**
- `/src/services/googleSheetsAPI.js` - Google API integration
- `/src/components/ExportMethodModal.jsx` - Export choice UI
- `/src/utils/csvExport.js` - CSV generation

---

### **Phase 6: Export Configuration & UI** (Priority: Medium)
**Time Estimate:** 3-4 hours

**Tasks:**
- [ ] Create export configuration modal
- [ ] Add column visibility toggles
- [ ] Implement data filtering options
- [ ] Add formatting intensity selection
- [ ] Create export templates (Quick/Full/Team/Character)
- [ ] Add progress indicator for large exports

**Files to Create:**
- `/src/components/ExportConfigModal.jsx` - Configuration UI
- `/src/components/ExportTemplates.jsx` - Template presets

---

### **Phase 7: Testing & Polish** (Priority: High)
**Time Estimate:** 2-3 hours

**Tasks:**
- [ ] Test with large datasets (100+ matches)
- [ ] Verify all formatting renders correctly in Excel
- [ ] Test Google Sheets imports
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Error handling and user feedback
- [ ] Documentation updates

---

## 📦 **DEPENDENCIES TO INSTALL**

```json
{
  "dependencies": {
    "exceljs": "^4.4.0",           // Enhanced Excel generation
    "file-saver": "^2.0.5",         // Already installed
    "googleapis": "^128.0.0",       // Google Sheets API
    "google-auth-library": "^9.2.0" // OAuth for Google
  }
}
```

**Installation Command:**
```bash
npm install exceljs googleapis google-auth-library
```

---

## 📝 **NEXT STEPS**

### **Choose Your Starting Point:**

#### **Option 1: Start with Data Tables (Recommended)**
*Best for: Ensuring data structure is correct before export*

**What we'll do:**
1. Refactor Table 1 column definitions (corrected categories)
2. Refactor Table 2 column definitions (up to 7 capsules)
3. Test data mapping with existing aggregatedData
4. Verify all stats are accessible and correctly formatted

**Command to give me:**
> "Start with Phase 1 - Create the data table structures"

---

#### **Option 2: Start with Basic Export**
*Best for: Getting functional exports quickly*

**What we'll do:**
1. Install exceljs
2. Create basic two-sheet XLSX export
3. Add simple formatting (headers, borders)
4. Test download functionality

**Command to give me:**
> "Start with Phase 2 - Implement basic XLSX export"

---

#### **Option 3: Full Implementation**
*Best for: Complete solution in one go*

**What we'll do:**
1. Implement all phases sequentially
2. Regular checkpoints for testing
3. Full feature set delivered

**Command to give me:**
> "Implement the complete solution - all phases"

---

## 📌 **TECHNICAL NOTES**

### **Memory Considerations**
- Large exports (1000+ matches) may take 10-15 seconds
- Consider implementing:
  - Web Worker for export generation (non-blocking UI)
  - Progress bar with percentage
  - Chunked data processing

### **Browser Compatibility**
- File downloads work in all modern browsers
- Google Sheets API works in Chrome, Firefox, Edge, Safari
- OAuth popup may be blocked - provide instructions

### **Performance Optimizations**
- Cache formatted data for repeat exports
- Use batch updates for Google Sheets API
- Lazy-load pivot table generation
- Consider pagination for match details (export in chunks)

---

## 🎯 **SUCCESS CRITERIA**

✅ Both data tables export correctly with all columns  
✅ Excel file opens without errors  
✅ Formatting renders correctly (colors, icons, borders)  
✅ Pivot tables are functional and interactive  
✅ Google Sheets integration works (at least one method)  
✅ Export completes in <30 seconds for typical datasets (200 matches)  
✅ User receives clear feedback during export process  
✅ Exported files are immediately usable for analysis  

---

## 📚 **REFERENCE DOCUMENTATION**

- [ExcelJS Documentation](https://github.com/exceljs/exceljs)
- [Google Sheets API v4](https://developers.google.com/sheets/api/reference/rest)
- [XLSX Library](https://docs.sheetjs.com/)
- [OAuth 2.0 for Client-side Web Apps](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)

---

**Document Version:** 2.0  
**Last Updated:** October 17, 2025  
**Status:** ✅ Ready for Implementation  
**Estimated Total Time:** 25-35 hours for full implementation

---

## ❓ **FREQUENTLY ASKED QUESTIONS**

### **Q: Why 7 capsules instead of 5?**
A: The game allows up to 7 equipment capsules to be equipped at once. Our data structure should support the maximum to future-proof the export.

### **Q: Can we add charts to the Excel export?**
A: Yes! With `exceljs`, we can add:
- Pie charts
- Bar charts
- Line charts
- Scatter plots
- Sparklines (mini in-cell charts)

### **Q: Will this work with the existing data?**
A: Yes! All data is already collected in `aggregatedData` and individual match objects. We're just reformatting it for export.

### **Q: How large will the Excel files be?**
A: Estimated sizes:
- 100 matches: ~500KB
- 500 matches: ~2MB
- 1000 matches: ~4MB

### **Q: Can users edit the Excel file and re-import?**
A: Not in this phase, but that's a great feature for future enhancement!

---

**Ready to proceed? Pick your starting phase and let me know!** 🚀
