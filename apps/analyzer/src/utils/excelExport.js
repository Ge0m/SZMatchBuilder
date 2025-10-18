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
import { processTeamGroups } from './teamPerformanceMatrix';

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

    // Generate Team Performance Matrix (Pivot Table)
    if (characterData?.length > 0) {
      await generateTeamPerformanceMatrix(workbook, characterData, includeFormatting);
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

  // Set column widths manually (don't use sheet.columns as it conflicts with tables)
  columns.forEach((col, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = calculateColumnWidth(col.header, col.key);
  });

  // Insert group header row at the top (Row 1)
  sheet.addRow([]);
  
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

  // Add column header row (Row 2) - manually add headers
  const headerRow = sheet.addRow(columns.map(col => col.header));
  
  // Add data rows (starting from row 3)
  data.forEach(row => {
    const rowValues = columns.map(col => {
      let value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.key];
      return formatCellValue(value, col.key);
    });
    sheet.addRow(rowValues);
  });

  // Apply formatting AFTER adding all data
  if (includeFormatting) {
    applyCharacterAveragesFormatting(sheet, columns, columnGroups, data.length);
  }

  // Add named range for pivot table support (no formal table to avoid Excel conflicts)
  createNamedRange(sheet, columns, data.length, 'CharacterAverages');

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

  // Set column widths manually (don't use sheet.columns as it conflicts with tables)
  columns.forEach((col, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = calculateColumnWidth(col.header, col.key);
  });

  // Insert group header row at the top (Row 1)
  sheet.addRow([]);
  
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

  // Add column header row (Row 2) - manually add headers
  const headerRow = sheet.addRow(columns.map(col => col.header));

  // Add data rows (starting from row 3)
  data.forEach(row => {
    const rowValues = columns.map(col => {
      let value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.key];
      return formatCellValue(value, col.key);
    });
    sheet.addRow(rowValues);
  });

  // Apply formatting AFTER adding all data
  if (includeFormatting) {
    applyMatchDetailsFormatting(sheet, columns, columnGroups, data.length);
  }

  // Add named range for pivot table support (no formal table to avoid Excel conflicts)
  createNamedRange(sheet, columns, data.length, 'MatchDetails');

  return sheet;
}

/**
 * Calculate average for a specific column in the sheet
 */
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
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  // Data rows formatting (starting from row 3)
  const lastDataRow = dataRowCount + 2; // +2 for group header and column header
  
  // Calculate averages for time columns (for duration indicators)
  const timeColumnAverages = {};
  columns.forEach((col, index) => {
    if (['avgBattleTime', 'battleDuration', 'battleTime'].includes(col.key)) {
      timeColumnAverages[col.key] = calculateColumnAverage(sheet, index + 1, 3, lastDataRow);
    }
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return; // Skip group header and column header
    if (rowNumber > lastDataRow) return; // Skip beyond data

    // Set compact row height
    row.height = 18;

    row.eachCell((cell, colNumber) => {
      const column = columns[colNumber - 1];
      if (!column) return;

      // Apply column-specific formatting (pass time averages)
      applyColumnFormatting(cell, column, row.values, rowNumber, timeColumnAverages);

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

      // Add black borders to all data cells
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
  });

  // Apply conditional formatting with darker gradients to specific column groups
  applyConditionalFormattingToColumns(sheet, columns, 'Combat Performance', lastDataRow);
  applyConditionalFormattingToColumns(sheet, columns, 'Survival & Health', lastDataRow);
  applyConditionalFormattingToColumns(sheet, columns, 'Special Abilities', lastDataRow);
  applyConditionalFormattingToColumns(sheet, columns, 'Combat Mechanics', lastDataRow);
  
  // Add auto-filter to header row (row 2) - provides filter dropdowns
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
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  // Data rows formatting (starting from row 3)
  const lastDataRow = dataRowCount + 2; // +2 for group header and column header
  
  // Calculate averages for time columns (for duration indicators)
  const timeColumnAverages = {};
  columns.forEach((col, index) => {
    if (['avgBattleTime', 'battleDuration', 'battleTime'].includes(col.key)) {
      timeColumnAverages[col.key] = calculateColumnAverage(sheet, index + 1, 3, lastDataRow);
    }
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return; // Skip group header and column header
    if (rowNumber > lastDataRow) return; // Skip beyond data

    // Set compact row height
    row.height = 18;

    row.eachCell((cell, colNumber) => {
      const column = columns[colNumber - 1];
      if (!column) return;

      // Apply column-specific formatting (pass time averages)
      applyColumnFormatting(cell, column, row.values, rowNumber, timeColumnAverages);

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

      // Add black borders to all data cells
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
  });

  // Apply conditional formatting with darker gradients - ensure it extends to last row
  applyConditionalFormattingToColumns(sheet, columns, 'Combat Performance', lastDataRow);
  applyConditionalFormattingToColumns(sheet, columns, 'Survival & Health', lastDataRow);
  applyConditionalFormattingToColumns(sheet, columns, 'Special Abilities', lastDataRow);
  applyConditionalFormattingToColumns(sheet, columns, 'Combat Mechanics', lastDataRow);
  
  // Add auto-filter to header row (row 2) - provides filter dropdowns
  sheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: columns.length }
  };
}

/**
 * Apply conditional formatting to columns in a specific group
 * Each group uses a unique color scale
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

    // Combat Performance: Red → White → Green (3-color scale)
    if (groupName === 'Combat Performance') {
      sheet.addConditionalFormatting({
        ref: `${colLetter}3:${colLetter}${lastDataRow}`,
        rules: [
          {
            type: 'colorScale',
            cfvo: [
              { type: 'min' },
              { type: 'percentile', value: 50 },
              { type: 'max' }
            ],
            color: [
              { argb: 'FFE06666' }, // Darker Red (low values)
              { argb: 'FFFFFFFF' }, // White (medium values)
              { argb: 'FF7EC8E3' }  // Darker Baby Blue (high values)
            ]
          }
        ]
      });
    }
    // Other groups: White → Color scale (2-color gradient)
    else {
      // Define unique color for each group
      const groupColorMap = {
        'Survival & Health': 'FF6AA84F',   // Green
        'Special Abilities': 'FFC6A6F7',   // Purple
        'Combat Mechanics': 'FFFFBC99'     // Peach/orange
      };

      const groupColor = groupColorMap[groupName] || 'FF6AA84F'; // Default to green if not found

      sheet.addConditionalFormatting({
        ref: `${colLetter}3:${colLetter}${lastDataRow}`,
        rules: [
          {
            type: 'colorScale',
            cfvo: [
              { type: 'min' },
              { type: 'max' }
            ],
            color: [
              { argb: 'FFFFFFFF' },  // White (low values)
              { argb: groupColor }    // Group-specific color (high values)
            ]
          }
        ]
      });
    }
  });
}

/**
 * Apply formatting to individual cells based on column type
 */
function applyColumnFormatting(cell, column, rowValues, rowNumber, timeColumnAverages = {}, isTeamRow = false) {
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

  // Time columns (mm:ss format) with 5-level duration indicator icons
  if (['avgBattleTime', 'battleDuration', 'battleTime'].includes(key)) {
    let timeInSeconds = 0;
    
    // Convert to seconds if numeric
    if (typeof cell.value === 'number') {
      timeInSeconds = cell.value;
      const mins = Math.floor(cell.value / 60);
      const secs = Math.floor(cell.value % 60);
      cell.value = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    // Parse if already formatted as mm:ss
    else if (typeof cell.value === 'string' && cell.value.includes(':')) {
      const [mins, secs] = cell.value.split(':').map(Number);
      timeInSeconds = (mins * 60) + secs;
    }
    
    // Add 5-level duration indicator with color (matches Combat Performance colors)
    const avgTime = timeColumnAverages[key];
    if (avgTime && timeInSeconds > 0) {
      const percentDiff = ((timeInSeconds - avgTime) / avgTime) * 100;
      
      let durationIcon = '';
      let iconColor = 'FF000000'; // Default black
      
      // 5 levels of duration indicators using bold, visible icons
      // Blue gradient for above average (slower/longer battles)
      // Red gradient for below average (faster/shorter battles)
      if (percentDiff > 20) {
        // Much slower (>20% above average)
        durationIcon = '▲▲ '; // Double filled triangles - very visible
        iconColor = 'FF1E40AF'; // Dark blue (matches Combat Performance)
      } else if (percentDiff > 10) {
        // Moderately slower (10-20% above average)
        durationIcon = '▲ '; // Single filled triangle
        iconColor = 'FF60A5FA'; // Medium blue
      } else if (percentDiff < -20) {
        // Much faster (<20% below average)
        durationIcon = '▼▼ '; // Double filled triangles - very visible
        iconColor = 'FFB91C1C'; // Dark red (matches Combat Performance)
      } else if (percentDiff < -10) {
        // Moderately faster (-10 to -20% below average)
        durationIcon = '▼ '; // Single filled triangle
        iconColor = 'FFEF4444'; // Medium red
      } else {
        // Near average (within ±10%)
        durationIcon = '◆ '; // Black diamond as neutral indicator
        iconColor = isTeamRow ? 'FFFFFFFF' : 'FF6B7280'; // White for team rows, gray for character rows
      }
      
      cell.value = `${durationIcon}${cell.value}`;
      
      // Apply color to the entire cell text (icon + time)
      cell.font = { 
        color: { argb: iconColor }, 
        size: 10,
        bold: false 
      };
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
    
    // Use white color for team rows for better visibility on maroon background
    const textColor = isTeamRow ? 'FFFFFFFF' : buildInfo.color;
    cell.font = { bold: true, color: { argb: textColor }, size: 10 };
    cell.alignment = { horizontal: 'center' };
  }

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
    'Combat Performance': 'FF276FA1',       // Ultra dark baby blue
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
    'Combat Performance': 'FF4A90C2',       // Very dark baby blue
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

/**
 * Create a named range for the data (without creating a formal Excel Table)
 * 
 * This approach avoids conflicts between ExcelJS table objects and pre-formatted cells.
 * Instead, we:
 * - Use auto-filter for filter dropdowns (already applied in formatting)
 * - Create named ranges for pivot table support
 * - Users can manually convert to table in Excel if desired (Ctrl+T)
 * 
 * @param {Worksheet} sheet - The worksheet to add the named range to
 * @param {Array} columns - Column configuration array
 * @param {Number} dataRowCount - Number of data rows
 * @param {String} rangeName - Name for the range (e.g., 'CharacterAverages')
 */
function createNamedRange(sheet, columns, dataRowCount, rangeName) {
  // Skip if no data
  if (dataRowCount === 0) {
    console.log(`⚠️ Skipping named range creation for "${rangeName}" - no data rows`);
    return;
  }

  const lastRow = dataRowCount + 2; // +2 for group header row and column header row
  const lastCol = columns.length;
  const lastColLetter = getColumnLetter(lastCol);
  
  // Add named range for the data area (excluding headers)
  const namedRangeName = `${rangeName}Data`;
  const namedRangeRef = `'${sheet.name}'!$A$3:$${lastColLetter}$${lastRow}`;
  
  try {
    sheet.workbook.definedNames.add(namedRangeName, namedRangeRef);
    console.log(`✅ Added Named Range: "${namedRangeName}" (${namedRangeRef})`);
    console.log(`   Filter dropdowns enabled on Row 2 via auto-filter`);
    console.log(`   Users can convert to Table: Select data → Press Ctrl+T`);
  } catch (error) {
    console.warn(`⚠️ Could not add named range "${namedRangeName}":`, error.message);
  }
}

/**
 * Generate Team Performance Matrix sheet (Pivot Table style)
 * Shows teams with aggregated stats, with characters grouped beneath each team
 */
async function generateTeamPerformanceMatrix(workbook, data, includeFormatting) {
  const sheet = workbook.addWorksheet('Team Performance Matrix', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 2 }] // Freeze first 2 columns (Team Name + Character Name) and first 2 rows
  });

  // Get column configuration (same as Character Averages)
  const config = getCharacterAveragesTableConfig();
  const columns = config.columns;
  const columnGroups = config.columnGroups;

  // Process data into team groups
  const teamGroups = processTeamGroups(data);

  // Insert a "Team Name" column at the beginning
  const teamNameColumn = {
    header: 'Team Name',
    key: 'teamName',
    width: 20,
    group: 'Identity & Context' // Same group as Character Name and Primary Team
  };
  
  // Add team name column at the start
  columns.unshift(teamNameColumn);

  // Set column widths (including new team name column)
  columns.forEach((col, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = col.width || calculateColumnWidth(col.header, col.key);
  });

  // Insert group header row at the top (Row 1)
  sheet.addRow([]);
  
  // Add group headers with merged cells and themed colors
  let currentCol = 1;
  columnGroups.forEach(group => {
    const groupColumnCount = columns.filter(col => col.group === group.name).length;
    const startCol = currentCol;
    const endCol = currentCol + groupColumnCount - 1;
    
    if (endCol > startCol) {
      sheet.mergeCells(1, startCol, 1, endCol);
    }
    
    const groupCell = sheet.getCell(1, startCol);
    groupCell.value = group.name;
    groupCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    
    const groupColor = getGroupColor(group.name);
    groupCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: groupColor }
    };
    
    groupCell.alignment = { vertical: 'middle', horizontal: 'center' };
    groupCell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } }, // Black borders
      left: { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'medium', color: { argb: 'FF000000' } }
    };
    
    currentCol = endCol + 1;
  });

  // Add column header row (Row 2)
  const headerRow = sheet.addRow(columns.map(col => col.header));

  // Track merge ranges for team name cells
  const teamMergeRanges = [];
  
  // Add team and character data rows (starting from row 3)
  let totalDataRows = 0;
  let currentRow = 3; // Start from row 3 (after headers)
  
  teamGroups.forEach(team => {
    const teamStartRow = currentRow;
    
    // Add team summary row
    const teamRowValues = columns.map(col => {
      if (col.key === 'teamName') {
        return team.teamName; // Team name in first column
      } else if (col.key === 'name') {
        return ''; // Leave character name blank for team row
      } else {
        const value = team.aggregates[col.key];
        return formatCellValue(value, col.key);
      }
    });
    
    const teamRow = sheet.addRow(teamRowValues);
    totalDataRows++;
    currentRow++;
    
    // Mark this row for team-level formatting
    teamRow._isTeamRow = true;
    teamRow._teamName = team.teamName;
    
    // Add character rows under this team
    team.characters.forEach(character => {
      const charRowValues = columns.map(col => {
        if (col.key === 'teamName') {
          return team.teamName; // Team name (will be merged)
        } else if (col.key === 'name') {
          // Character name (second column)
          let value = typeof col.accessor === 'function' ? col.accessor(character) : character[col.key];
          return value; // No indent since team name is in separate column
        } else {
          let value = typeof col.accessor === 'function' ? col.accessor(character) : character[col.key];
          return formatCellValue(value, col.key);
        }
      });
      
      const charRow = sheet.addRow(charRowValues);
      totalDataRows++;
      currentRow++;
      
      charRow._isCharacterRow = true;
      charRow._parentTeam = team.teamName;
    });
    
    // Store merge range for this team (first column, all rows for this team)
    const teamEndRow = currentRow - 1;
    if (teamEndRow > teamStartRow) {
      teamMergeRanges.push({
        teamName: team.teamName,
        startRow: teamStartRow,
        endRow: teamEndRow
      });
    }
  });

  // Apply formatting
  if (includeFormatting) {
    applyTeamMatrixFormatting(sheet, columns, columnGroups, totalDataRows, teamGroups, teamMergeRanges);
  }

  // Add named range
  createNamedRange(sheet, columns, totalDataRows, 'TeamPerformanceMatrix');

  return sheet;
}

/**
 * Apply formatting to Team Performance Matrix sheet
 */
function applyTeamMatrixFormatting(sheet, columns, columnGroups, dataRowCount, teamGroups, teamMergeRanges) {
  // Column header row formatting (row 2) - same as other sheets
  const headerRow = sheet.getRow(2);
  headerRow.height = 35;

  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    const darkGroupColor = getDarkGroupColor(col.group);
    
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: darkGroupColor }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } }, // Black borders
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  // Calculate averages for time columns (for duration indicators)
  const lastDataRow = dataRowCount + 2;
  const timeColumnAverages = {};
  columns.forEach((col, index) => {
    if (['avgBattleTime', 'battleDuration', 'battleTime'].includes(col.key)) {
      timeColumnAverages[col.key] = calculateColumnAverage(sheet, index + 1, 3, lastDataRow);
    }
  });

  // Data rows formatting (starting from row 3)
  let currentTeam = null;
  let rowsInCurrentTeam = [];
  
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return; // Skip headers
    if (rowNumber > lastDataRow) return;

      // Check if this is a team row or character row
    const isTeamRow = row._isTeamRow;
    const isCharacterRow = row._isCharacterRow;
    
    if (isTeamRow) {
      // Apply team row formatting
      row.height = 22; // Slightly taller than data rows
      
      row.eachCell((cell, colNumber) => {
        const column = columns[colNumber - 1];
        if (!column) return;

        // Skip the team name column (it will be in merged cell)
        if (column.key === 'teamName') {
          return; // Will be formatted with merge cell
        }

        // Team row: Bold, dark maroon background, white text
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF7F1D1D' } // Dark maroon (red-900)
        };
        
        // Team name column (col 2) is left aligned, others follow normal rules
        cell.alignment = { 
          horizontal: column.key === 'name' ? 'left' : (column.key.includes('Rate') || column.key.includes('Retention') ? 'right' : 'center'),
          vertical: 'middle'
        };
        
        // Apply column-specific formatting for values (but NOT conditional formatting colors)
        applyColumnFormatting(cell, column, row.values, rowNumber, timeColumnAverages, true); // Pass true for isTeamRow
        
        // Override any background colors from conditional formatting - force maroon
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF7F1D1D' } // Dark maroon - reapply after formatting
        };
        
        // CRITICAL: Ensure key columns stay white on team rows
        // Team name, character name, combat score, and build type should be white for visibility
        if (column.key === 'name' || column.key === 'combatScore' || column.key === 'combatPerformanceScore' || column.key === 'buildArchetype') {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        }
        
        // Add black borders (matching headers)
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } }, // Black
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });      // Track rows for grouping
      if (currentTeam && rowsInCurrentTeam.length > 0) {
        // Group previous team's character rows
        const startRow = rowsInCurrentTeam[0];
        const endRow = rowsInCurrentTeam[rowsInCurrentTeam.length - 1];
        if (endRow > startRow) {
          sheet.getRow(startRow).outlineLevel = 1;
          for (let r = startRow + 1; r <= endRow; r++) {
            sheet.getRow(r).outlineLevel = 1;
          }
        }
      }
      
      currentTeam = row._teamName;
      rowsInCurrentTeam = [];
      
    } else if (isCharacterRow) {
      // Apply character row formatting (normal data row style)
      row.height = 18;
      
      row.eachCell((cell, colNumber) => {
        const column = columns[colNumber - 1];
        if (!column) return;

        // Apply column-specific formatting
        applyColumnFormatting(cell, column, row.values, rowNumber, timeColumnAverages);

        // Alternating row colors (light gray for even rows)
        if (rowsInCurrentTeam.length % 2 === 0) {
          const key = column.key;
          if (!['matchResult', 'hasMultipleForms'].includes(key)) {
            if (!cell.fill || cell.fill.fgColor?.argb === 'FFFFFFFF' || !cell.fill.fgColor) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE5E7EB' }
              };
            }
          }
        }

        // Add black borders to character rows
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      
      rowsInCurrentTeam.push(rowNumber);
    }
  });

  // Group last team's rows
  if (rowsInCurrentTeam.length > 0) {
    const startRow = rowsInCurrentTeam[0];
    const endRow = rowsInCurrentTeam[rowsInCurrentTeam.length - 1];
    if (endRow > startRow) {
      for (let r = startRow; r <= endRow; r++) {
        sheet.getRow(r).outlineLevel = 1;
      }
    }
  }

  // Merge team name cells (first column) for each team
  teamMergeRanges.forEach(mergeInfo => {
    const { teamName, startRow, endRow } = mergeInfo;
    
    // Merge cells in first column (Team Name column)
    sheet.mergeCells(startRow, 1, endRow, 1);
    
    // Format the merged cell
    const mergedCell = sheet.getCell(startRow, 1);
    mergedCell.value = teamName;
    mergedCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    mergedCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7F1D1D' } // Dark maroon
    };
    mergedCell.alignment = { 
      vertical: 'middle', 
      horizontal: 'center' 
    };
    mergedCell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'medium', color: { argb: 'FF000000' } }
    };
  });

  // Apply conditional formatting per team group (compare characters within their own teams)
  applyTeamGroupConditionalFormatting(sheet, columns, teamGroups);
  
  // Add per-team auto-filters instead of global header filter
  addPerTeamAutoFilters(sheet, columns, teamGroups);
  
  // Style unused area: Make gridlines/unused cells blend with Excel's default gray background
  // Set sheet properties to hide gridlines (cleaner look)
  sheet.properties = {
    ...sheet.properties,
    showGridLines: false // Hide gridlines for cleaner appearance
  };
  
  // Alternative: If you want to keep gridlines but make unused area black, 
  // you could set a default row style, but ExcelJS doesn't support this directly.
  // Hiding gridlines is the cleanest professional approach for used-area-only sheets.
}

/**
 * Apply conditional formatting per team group
 * This compares characters only within their own team, not across all teams
 */
function applyTeamGroupConditionalFormatting(sheet, columns, teamGroups) {
  let currentRow = 3; // Start after header rows
  
  teamGroups.forEach(team => {
    const teamRowNumber = currentRow;
    currentRow++; // Skip team summary row (don't apply conditional formatting to it)
    
    const characterCount = team.characters.length;
    if (characterCount === 0) return;
    
    const startCharRow = currentRow;
    const endCharRow = currentRow + characterCount - 1;
    currentRow = endCharRow + 1;
    
    // Only apply if there are at least 2 characters to compare
    if (characterCount < 2) return;
    
    // Apply conditional formatting to each column group for this team's character rows
    const columnGroups = ['Combat Performance', 'Survival & Health', 'Special Abilities', 'Combat Mechanics'];
    
    columnGroups.forEach(groupName => {
      // Find columns in this group
      const columnsInGroup = [];
      columns.forEach((column, index) => {
        if (column.group === groupName) {
          columnsInGroup.push({ column, index });
        }
      });

      if (columnsInGroup.length === 0) return;

      // Define color for this group
      const groupColorMap = {
        'Combat Performance': { min: 'FFE06666', mid: 'FFFFFFFF', max: 'FF7EC8E3' }, // Red → White → Blue
        'Survival & Health': { color: 'FF6AA84F' },   // Green
        'Special Abilities': { color: 'FFC6A6F7' },   // Purple
        'Combat Mechanics': { color: 'FFFFBC99' }     // Peach
      };

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

        // Apply conditional formatting for character rows only (skip team row)
        const range = `${colLetter}${startCharRow}:${colLetter}${endCharRow}`;

        if (groupName === 'Combat Performance') {
          // 3-color scale for Combat Performance
          sheet.addConditionalFormatting({
            ref: range,
            rules: [{
              type: 'colorScale',
              cfvo: [
                { type: 'min' },
                { type: 'percentile', value: 50 },
                { type: 'max' }
              ],
              color: [
                { argb: groupColorMap[groupName].min },
                { argb: groupColorMap[groupName].mid },
                { argb: groupColorMap[groupName].max }
              ]
            }]
          });
        } else {
          // 2-color scale for other groups
          sheet.addConditionalFormatting({
            ref: range,
            rules: [{
              type: 'colorScale',
              cfvo: [
                { type: 'min' },
                { type: 'max' }
              ],
              color: [
                { argb: 'FFFFFFFF' },  // White
                { argb: groupColorMap[groupName].color }
              ]
            }]
          });
        }
      });
    });
  });
}

/**
 * Add auto-filter capability for each team group
 * Since Excel only supports one autofilter per sheet, we add a note to the first team
 * explaining how users can manually filter each team section
 */
function addPerTeamAutoFilters(sheet, columns, teamGroups) {
  // Excel limitation: Only ONE autofilter allowed per sheet
  // We can't have independent filters for each team
  
  // OPTION 1: Add a single filter that covers all data (but this breaks team grouping)
  // OPTION 2: Use Excel Tables for each team (complex, may break formatting)
  // OPTION 3: Add instructions via cell comments for manual filtering
  
  // For now, we'll skip the global filter entirely and add a comment
  // to the first team row explaining how to use Sort & Filter
  
  if (teamGroups.length > 0) {
    const firstTeamRow = sheet.getRow(3); // First team row
    const nameCell = firstTeamRow.getCell(1);
    
    // Add comment/note explaining filtering
    nameCell.note = {
      texts: [{
        font: { size: 10, bold: false, name: 'Calibri' },
        text: 'Per-Team Filtering:\n\n' +
              '1. Select a team section (team row + character rows)\n' +
              '2. Go to Data > Filter to enable filtering for that section\n' +
              '3. Use filter dropdowns to sort/filter characters within the team\n\n' +
              'Note: Excel only allows one filter at a time, so you\'ll need to ' +
              'enable/disable filters as you work with different teams.'
      }]
    };
  }
  
  // Alternative: Don't add any filters, let users manually apply them
  // This is cleaner and doesn't interfere with the team grouping structure
}
