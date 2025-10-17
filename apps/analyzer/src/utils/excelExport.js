/**
 * Excel Export Utility for Dragon Ball Sparking Zero Battle Analyzer
 * 
 * This module provides comprehensive Excel export functionality for battle analysis data.
 * It generates richly formatted .xlsx files with multiple sheets, custom styling,
 * and professional presentation.
 * 
 * Features:
 * - Two data sheets: Character Performance Averages & Individual Match Details
 * - Full formatting support (colors, fonts, borders, alignment)
 * - Header row styling (bold, colored background)
 * - Auto-fit column widths
 * - Freeze panes and auto-filter
 * - Number formatting (currency, percentage, time, decimals)
 * 
 * @module excelExport
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { getCharacterAveragesTableConfig, getMatchDetailsTableConfig } from '../components/TableConfigs';

/**
 * Main export function - generates complete Excel workbook
 * @param {Array} characterData - Aggregated character performance data
 * @param {Array} matchData - Individual match details data
 * @param {Object} options - Export options (filename, includeFormatting, etc.)
 */
export async function exportToExcel(characterData, matchData, options = {}) {
  const {
    filename = `DBSZ_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`,
    includeCharacterAverages = true,
    includeMatchDetails = true,
    includeFormatting = true
  } = options;

  try {
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DBSZ Battle Analyzer';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Generate sheets
    if (includeCharacterAverages && characterData?.length > 0) {
      await generateCharacterAveragesSheet(workbook, characterData, includeFormatting);
    }

    if (includeMatchDetails && matchData?.length > 0) {
      await generateMatchDetailsSheet(workbook, matchData, includeFormatting);
    }

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Trigger download
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(blob, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate Character Performance Averages sheet
 */
async function generateCharacterAveragesSheet(workbook, data, includeFormatting) {
  const sheet = workbook.addWorksheet('Character Averages', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }] // Freeze first column and first 2 rows (group header + column header)
  });

  // Get column configuration
  const config = getCharacterAveragesTableConfig();
  const columns = config.columns;
  const columnGroups = config.columnGroups;

  // Define Excel columns with wider widths
  const excelColumns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: calculateColumnWidth(col.header, col.key)
  }));

  sheet.columns = excelColumns;

  // Insert group header row at the top
  sheet.insertRow(1, []);
  
  // Add group headers with merged cells and themed colors
  let currentCol = 1;
  columnGroups.forEach(group => {
    // Count actual columns that belong to this group in the columns array
    const groupColumnCount = columns.filter(col => col.group === group.name).length;
    
    const startCol = currentCol;
    const endCol = currentCol + groupColumnCount - 1;
    
    // Merge cells for group header
    if (endCol > startCol) {
      sheet.mergeCells(1, startCol, 1, endCol);
    }
    
    const groupCell = sheet.getCell(1, startCol);
    groupCell.value = group.name;
    groupCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }; // White text
    
    // Get color based on group name
    const groupColor = getGroupColor(group.name);
    groupCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: groupColor }
    };
    groupCell.alignment = { horizontal: 'center', vertical: 'middle' };
    groupCell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'medium', color: { argb: 'FF000000' } }
    };
    
    currentCol = endCol + 1;
  });

  // Add data rows (starting from row 3 now, since row 1 is group header, row 2 is column header)
  data.forEach(row => {
    const rowData = {};
    columns.forEach(col => {
      let value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.key];
      
      // Format special values
      value = formatCellValue(value, col.key);
      rowData[col.key] = value;
    });
    sheet.addRow(rowData);
  });

  // Apply formatting BEFORE creating the table
  if (includeFormatting) {
    applyCharacterAveragesFormatting(sheet, columns, columnGroups, data.length);
  }

  return sheet;
}

/**
 * Generate Individual Match Details sheet
 */
async function generateMatchDetailsSheet(workbook, data, includeFormatting) {
  const sheet = workbook.addWorksheet('Match Details', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }] // Freeze first column and first 2 rows
  });

  // Get column configuration
  const config = getMatchDetailsTableConfig();
  const columns = config.columns;
  const columnGroups = config.columnGroups;

  // Define Excel columns with wider widths
  const excelColumns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: calculateColumnWidth(col.header, col.key)
  }));

  sheet.columns = excelColumns;

  // Insert group header row at the top
  sheet.insertRow(1, []);
  
  // Add group headers with merged cells and themed colors
  let currentCol = 1;
  columnGroups.forEach(group => {
    // Count actual columns that belong to this group in the columns array
    const groupColumnCount = columns.filter(col => col.group === group.name).length;
    
    const startCol = currentCol;
    const endCol = currentCol + groupColumnCount - 1;
    
    // Merge cells for group header
    if (endCol > startCol) {
      sheet.mergeCells(1, startCol, 1, endCol);
    }
    
    const groupCell = sheet.getCell(1, startCol);
    groupCell.value = group.name;
    groupCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }; // White text
    
    // Get color based on group name
    const groupColor = getGroupColor(group.name);
    groupCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: groupColor }
    };
    groupCell.alignment = { horizontal: 'center', vertical: 'middle' };
    groupCell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'medium', color: { argb: 'FF000000' } }
    };
    
    currentCol = endCol + 1;
  });

  // Add data rows
  data.forEach(row => {
    const rowData = {};
    columns.forEach(col => {
      let value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.key];
      
      // Format special values
      value = formatCellValue(value, col.key);
      rowData[col.key] = value;
    });
    sheet.addRow(rowData);
  });

  // Apply formatting BEFORE creating the table
  if (includeFormatting) {
    applyMatchDetailsFormatting(sheet, columns, columnGroups, data.length);
  }

  return sheet;
}

/**
 * Apply formatting to Character Averages sheet
 */
function applyCharacterAveragesFormatting(sheet, columns, columnGroups, dataRowCount) {
  // Column header row formatting (row 2) with darker group-themed colors
  const headerRow = sheet.getRow(2);
  headerRow.height = 35; // Taller to accommodate wrapped text and filter icons

  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    const darkGroupColor = getDarkGroupColor(col.group);
    
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }; // White text
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: darkGroupColor }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; // Allow wrap
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
    };
  });

  // Data rows formatting (starting from row 3)
  const lastDataRow = dataRowCount + 2; // +2 for group header and column header
  
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return; // Skip group header and column header
    if (rowNumber > lastDataRow) return; // Skip beyond data

    // Set compact row height
    row.height = 18;

    row.eachCell((cell, colNumber) => {
      const column = columns[colNumber - 1];
      if (!column) return;

      // Apply column-specific formatting
      applyColumnFormatting(cell, column, row.values, rowNumber);

      // Apply alternating row colors with light gray
      if (rowNumber % 2 === 0) {
        // Only apply background if cell doesn't have special formatting (like match result)
        const key = column.key;
        if (!['matchResult', 'hasMultipleForms'].includes(key)) {
          // Check if cell already has conditional formatting fill
          if (!cell.fill || cell.fill.fgColor?.argb === 'FFFFFFFF' || !cell.fill.fgColor) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE5E7EB' } // Darker gray for alternating rows
            };
          }
        }
      }

      // Add white borders to all data cells
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      };
    });
  });

  // Apply conditional formatting with darker gradients to specific column groups
  applyConditionalFormattingToColumns(sheet, columns, 'Combat Performance', lastDataRow);
  applyConditionalFormattingToColumns(sheet, columns, 'Survival & Health', lastDataRow);
  applyConditionalFormattingToColumns(sheet, columns, 'Special Abilities', lastDataRow);
  applyConditionalFormattingToColumns(sheet, columns, 'Combat Mechanics', lastDataRow);
  
  // Add auto-filter to header row (row 2)
  sheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: columns.length }
  };
}

/**
 * Apply formatting to Match Details sheet
 */
function applyMatchDetailsFormatting(sheet, columns, columnGroups, dataRowCount) {
  // Column header row formatting (row 2) with darker group-themed colors
  const headerRow = sheet.getRow(2);
  headerRow.height = 35; // Taller to accommodate wrapped text and filter icons

  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    const darkGroupColor = getDarkGroupColor(col.group);
    
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }; // White text
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: darkGroupColor }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; // Allow wrap
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
    };
  });

  // Data rows formatting (starting from row 3)
  const lastDataRow = dataRowCount + 2; // +2 for group header and column header
  
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return; // Skip group header and column header
    if (rowNumber > lastDataRow) return; // Skip beyond data

    // Set compact row height
    row.height = 18;

    row.eachCell((cell, colNumber) => {
      const column = columns[colNumber - 1];
      if (!column) return;

      // Apply column-specific formatting
      applyColumnFormatting(cell, column, row.values, rowNumber);

      // Apply alternating row colors with light gray
      if (rowNumber % 2 === 0) {
        // Only apply background if cell doesn't have special formatting
        const key = column.key;
        if (!['matchResult', 'hasMultipleForms'].includes(key)) {
          // Check if cell already has conditional formatting fill
          if (!cell.fill || cell.fill.fgColor?.argb === 'FFFFFFFF' || !cell.fill.fgColor) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE5E7EB' } // Darker gray for alternating rows
            };
          }
        }
      }

      // Add white borders to all data cells
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      };
    });
  });

  // Apply conditional formatting with darker gradients - ensure it extends to last row
  applyConditionalFormattingToColumns(sheet, columns, 'Combat Performance', lastDataRow);
  applyConditionalFormattingToColumns(sheet, columns, 'Survival & Health', lastDataRow);
  applyConditionalFormattingToColumns(sheet, columns, 'Special Abilities', lastDataRow);
  applyConditionalFormattingToColumns(sheet, columns, 'Combat Mechanics', lastDataRow);
  
  // Add auto-filter to header row (row 2)
  sheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: columns.length }
  };
}

/**
 * Apply conditional formatting to columns in a specific group
 */
function applyConditionalFormattingToColumns(sheet, columns, groupName, lastDataRow) {
  // Find the column group by iterating through columns to find matching group
  const columnsInGroup = [];
  
  columns.forEach((column, index) => {
    if (column.group === groupName) {
      columnsInGroup.push({ column, index });
    }
  });

  if (columnsInGroup.length === 0) return;

  columnsInGroup.forEach(({ column, index }) => {
    const colKey = column.key;
    const excelCol = index + 1;
    const colLetter = getColumnLetter(excelCol);

    // Skip non-numeric columns
    if (['name', 'primaryTeam', 'primaryAIStrategy', 'buildArchetype', 'topCapsules', 
         'formHistory', 'hasMultipleForms', 'team', 'opponentTeam', 'fileName',
         'formsUsed', 'startedAs', 'matchResult', 'aiStrategy'].includes(colKey)) {
      return;
    }

    // Apply darker gradient conditional formatting (3-color scale)
    // Using darker red to white to darker green (no yellow middle)
    sheet.addConditionalFormatting({
      ref: `${colLetter}3:${colLetter}${lastDataRow}`, // From row 3 to last data row
      rules: [
        {
          type: 'colorScale',
          cfvo: [
            { type: 'min' },
            { type: 'percentile', value: 50 },
            { type: 'max' }
          ],
          color: [
            { argb: 'FFE06666' }, // Darker red (low values)
            { argb: 'FFFFFFFF' }, // White (medium values)
            { argb: 'FF6AA84F' }  // Darker green (high values)
          ]
        }
      ]
    });
  });
}

/**
 * Apply formatting to individual cells based on column type
 */
function applyColumnFormatting(cell, column, rowValues, rowNumber) {
  const key = column.key;

  // Character name - bold
  if (key === 'name') {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'left' };
  }

  // Percentage columns
  if (key.includes('Rate') || key.includes('Retention') || key.includes('hpRetention') || 
      key === 'healthRetention' || key === 'speedImpactWinRate') {
    cell.numFmt = '0.0"%"';
    cell.alignment = { horizontal: 'right' };
  }

  // Number columns with comma separator
  if (['avgDamage', 'avgTaken', 'avgMaxComboDamage', 'avgHPGaugeValueMax', 'avgHealth',
       'damageDone', 'damageTaken', 'hPGaugeValue', 'hPGaugeValueMax', 'totalKills',
       'maxHP', 'hpMax', 'hpRemaining'].includes(key)) {
    cell.numFmt = '#,##0';
    cell.alignment = { horizontal: 'right' };
  }

  // Decimal columns (1 decimal place)
  if (['avgSPM1', 'avgSPM2', 'avgSkill1', 'avgSkill2', 'avgUltimates', 'avgEnergyBlasts',
       'avgCharges', 'avgSparking', 'avgDragonDashMileage', 'avgMaxCombo', 'avgThrows',
       'avgLightningAttacks', 'avgVanishingAttacks', 'avgDragonHoming', 'avgSpeedImpacts',
       'avgSparkingCombo', 'avgKills', 'avgGuards', 'avgRevengeCounters', 'avgSuperCounters',
       'avgZCounters', 'damageCapsules', 'defensiveCapsules', 'utilityCapsules'].includes(key)) {
    cell.numFmt = '0.0';
    cell.alignment = { horizontal: 'right' };
  }

  // Efficiency and DPS (2 decimal places)
  if (['efficiency', 'dps'].includes(key)) {
    cell.numFmt = '0.00';
    cell.alignment = { horizontal: 'right' };
  }

  // Time columns (mm:ss format)
  if (['avgBattleTime', 'battleDuration', 'battleTime'].includes(key)) {
    // Convert seconds to Excel time format if needed
    if (typeof cell.value === 'number') {
      const mins = Math.floor(cell.value / 60);
      const secs = Math.floor(cell.value % 60);
      cell.value = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    cell.alignment = { horizontal: 'right' };
  }

  // Combat Score - bold with softer conditional coloring
  if (key === 'combatScore' || key === 'combatPerformanceScore') {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center' };
    
    const score = typeof cell.value === 'number' ? cell.value : 0;
    // Don't apply fill here - let conditional formatting handle it
  }

  // Build Archetype - colored icons instead of background colors
  if (key === 'buildArchetype') {
    cell.alignment = { horizontal: 'center' };
    const value = cell.value || 'No Build';
    
    const iconMap = {
      'Aggressive': { icon: '⚔️', color: 'FFB91C1C' },    // Crossed swords - red
      'Defensive': { icon: '🛡️', color: 'FF047857' },    // Shield - green
      'Technical': { icon: '⚙️', color: 'FF1D4ED8' },    // Gear - blue
      'Hybrid': { icon: '🔀', color: 'FF6D28D9' },       // Shuffle/mix - purple
      'No Build': { icon: '—', color: 'FF6B7280' }       // Em dash - gray
    };

    const buildInfo = iconMap[value] || iconMap['No Build'];
    cell.value = `${buildInfo.icon} ${value}`;
    cell.font = { bold: true, color: { argb: buildInfo.color }, size: 10 };
    cell.alignment = { horizontal: 'center' };
  }

  // Match Result - even darker highlighting with white text
  if (key === 'matchResult') {
    const isWin = cell.value === 'Win' || cell.value === 'W';
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isWin ? 'FF047857' : 'FFB91C1C' } // Even darker green for win, even darker red for loss
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text
    cell.alignment = { horizontal: 'center' };
  }

  // Sparking-related columns - remove gold highlight, let conditional formatting handle it
  if (key === 'avgSparking' || key === 'avgSparkingCombo' || key === 'sparkingCombo') {
    // Just apply number format, no special highlighting
    cell.numFmt = '0.0';
    cell.alignment = { horizontal: 'right' };
  }

  // Match count - center aligned
  if (key === 'matchCount' || key === 'matchNumber') {
    cell.alignment = { horizontal: 'center' };
  }

  // Text columns - left aligned
  if (['primaryTeam', 'primaryAIStrategy', 'team', 'opponentTeam', 'fileName',
       'formHistory', 'topCapsules', 'formsUsed', 'startedAs'].includes(key)) {
    cell.alignment = { horizontal: 'left', wrapText: false }; // No wrapping
  }

  // Boolean columns - center aligned with checkmarks
  if (key === 'hasMultipleForms') {
    cell.alignment = { horizontal: 'center' };
    if (cell.value === 'Yes' || cell.value === true) {
      cell.value = '✓';
      cell.font = { color: { argb: 'FF00B050' }, bold: true };
    } else {
      cell.value = '✗';
      cell.font = { color: { argb: 'FFA6A6A6' } };
    }
  }
}

/**
 * Calculate optimal column width based on header and content
 */
function calculateColumnWidth(header, key) {
  // Base width on header length with extra padding for filter icons
  let width = Math.max(header.length + 5, 12); // Minimum 12, add 5 for filter icon

  // Special cases for known wide/narrow columns with increased widths
  const widthMap = {
    // Identity columns - optimized
    'name': 30,  // Reduced from 35, headers can wrap
    'primaryTeam': 20,  // Expanded back to 20 for max value sizes
    'primaryAIStrategy': 35,  // Expanded to 35 for longer strategy names
    
    // Narrow numeric columns (1-4 digit numbers) - optimized
    'matchCount': 8,  // Reduced from 10
    'matchNumber': 8,  // Reduced from 10
    'kills': 7,  // Reduced from 8
    'guards': 7,  // Reduced from 8
    'revengeCounters': 12,  // Reduced from 14
    'superCounters': 12,  // Reduced from 14
    'zCounters': 9,  // Reduced from 10
    'spm1': 7,  // Reduced from 8
    'spm2': 7,  // Reduced from 8
    'skill1': 7,  // Reduced from 8
    'skill2': 7,  // Reduced from 8
    'ultimates': 9,  // Reduced from 10
    'kiBlasts': 9,  // Reduced from 10
    'charges': 7,  // Reduced from 8
    'sparkings': 9,  // Reduced from 10
    'throws': 7,  // Reduced from 8
    'formChangeCount': 10,  // Reduced from 12
    'formCount': 10,  // Reduced from 12
    
    // Multi-word columns with small numbers - optimized
    'avgSparking': 10,  // Reduced from 12
    'avgSparkingCombo': 13,  // Reduced from 16
    'sparkingComboHits': 13,  // Reduced from 16
    'avgGuards': 9,  // Reduced from 10
    'avgRevengeCounters': 14,  // Reduced from 18
    'avgSuperCounters': 13,  // Reduced from 16
    'avgZCounters': 10,  // Reduced from 12
    'avgThrows': 9,  // Reduced from 10
    'avgCharges': 9,  // Reduced from 10
    'avgKills': 8,  // Reduced from 10
    'totalKills': 9,  // Reduced from 10
    
    // Standard numeric columns - optimized
    'avgDamage': 12,  // Reduced from 15
    'avgTaken': 12,  // Reduced from 15
    'damageDone': 12,  // Reduced from 15
    'damageTaken': 12,  // Reduced from 15
    'efficiency': 10,  // Reduced from 12
    'dps': 8,  // Reduced from 10
    'combatScore': 12,  // Reduced from 15
    'avgBattleTime': 12,  // Reduced from 15
    'battleDuration': 11,  // Reduced from 12
    'battleTime': 12,  // Reduced from 15
    
    // HP columns - optimized
    'avgHPGaugeValueMax': 14,  // Reduced from 18
    'avgHealth': 12,  // Reduced from 15
    'hPGaugeValue': 12,  // Reduced from 15
    'hPGaugeValueMax': 14,  // Reduced from 18
    'hpRemaining': 12,  // Reduced from 15
    'hpMax': 10,  // Reduced from 12
    'healthRetention': 13,  // Reduced from 16
    'hpRetention': 11,  // Reduced from 12
    'survivalRate': 13,  // Reduced from 16
    
    // Build & Capsule columns - optimized
    'buildArchetype': 14,  // Reduced from 18
    'capsule1': 32,  // Reduced from 35
    'capsule2': 32,  // Reduced from 35
    'capsule3': 32,  // Reduced from 35
    'capsule4': 32,  // Reduced from 35
    'capsule5': 32,  // Reduced from 35
    'capsule6': 32,  // Reduced from 35
    'capsule7': 32,  // Reduced from 35
    'totalCapsuleCost': 12,  // Reduced from 14
    'damageCaps': 11,  // Reduced from 12
    'defensiveCaps': 11,  // Reduced from 12
    'utilityCaps': 11,  // Reduced from 12
    'damageCapsules': 11,  // Reduced from 12
    'defensiveCapsules': 12,  // Reduced from 14
    'utilityCapsules': 11,  // Reduced from 12
    'topCapsules': 55,  // Reduced from 60
    'aiStrategy': 30,  // EXPANDED from 25 to prevent cutoff
    
    // Form columns - optimized
    'formHistory': 55,  // Reduced from 60
    'formsUsed': 40,  // Reduced from 45
    'startedAs': 28,  // Reduced from 30
    'hasMultipleForms': 12,  // Reduced from 14
    
    // Other
    'fileName': 32,  // Reduced from 35
    'team': 18,  // Reduced from 20
    'opponentTeam': 18,  // Reduced from 20
    'matchResult': 10  // Reduced from 12
  };

  return widthMap[key] || Math.min(width + 3, 50); // Default: header + 3, max 50
}

/**
 * Format cell values for Excel export
 */
function formatCellValue(value, key) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '';
  }

  // Handle arrays (join with comma)
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  // Handle objects (convert to string)
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Handle numbers - round to 2 decimals max
  if (typeof value === 'number' && !Number.isInteger(value)) {
    return Math.round(value * 100) / 100;
  }

  return value;
}

/**
 * Utility function to convert column index to Excel column letter
 */
function getColumnLetter(colIndex) {
  let letter = '';
  while (colIndex > 0) {
    const remainder = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    colIndex = Math.floor((colIndex - 1) / 26);
  }
  return letter;
}

/**
 * Get themed color for group headers based on group name
 * Colors match the web app's aggregated view theme - ultra dark versions for row 1
 */
function getGroupColor(groupName) {
  const colorMap = {
    'Identity & Context': 'FF1F2937',       // Ultra dark gray (almost black)
    'Match Identity': 'FF1F2937',           // Ultra dark gray (almost black)
    'Combat Performance': 'FF991B1B',       // Ultra dark red
    'Survival & Health': 'FF065F46',        // Ultra dark green
    'Special Abilities': 'FF5B21B6',        // Ultra dark purple
    'Combat Mechanics': 'FF92400E',         // Ultra dark amber
    'Build & Equipment': 'FF1E40AF',        // Ultra dark blue
    'Form Changes': 'FF065F46'              // Ultra dark forest green (same as Survival & Health)
  };
  
  return colorMap[groupName] || 'FF1F2937'; // Default ultra dark gray
}

/**
 * Get dark version of group color for column headers (row 2)
 * These are very dark with white text - ultra easy on the eyes
 */
function getDarkGroupColor(groupName) {
  const colorMap = {
    'Identity & Context': 'FF374151',       // Very dark gray
    'Match Identity': 'FF374151',           // Very dark gray
    'Combat Performance': 'FFB91C1C',       // Very dark red
    'Survival & Health': 'FF047857',        // Very dark green
    'Special Abilities': 'FF6D28D9',        // Very dark purple
    'Combat Mechanics': 'FFB45309',         // Very dark amber
    'Build & Equipment': 'FF1D4ED8',        // Very dark blue
    'Form Changes': 'FF047857'              // Very dark forest green (same as Survival & Health)
  };
  
  return colorMap[groupName] || 'FF374151'; // Default very dark gray
}

/**
 * Get light version of group color for column headers (kept for backwards compatibility)
 */
function getLightGroupColor(groupName) {
  const colorMap = {
    'Identity & Context': 'FFE5E7EB',       // Light gray
    'Match Identity': 'FFE5E7EB',           // Light gray
    'Combat Performance': 'FFFECACA',       // Light red
    'Survival & Health': 'FFD1FAE5',        // Light green
    'Special Abilities': 'FFE9D5FF',        // Light purple
    'Combat Mechanics': 'FFFEF3C7',         // Light amber
    'Build & Equipment': 'FFDBEAFE',        // Light blue
    'Form Changes': 'FFFCE7F3'              // Light pink
  };
  
  return colorMap[groupName] || 'FFE5E7EB'; // Default light gray
}
