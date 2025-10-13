// Utility functions for data formatting and processing

export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function formatBattleTime(seconds) {
  if (!seconds) return '0s';
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

export function formatPercentage(value, total) {
  if (!total || total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function getPerformanceLevel(value, max) {
  const percentage = (value / max) * 100;
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'average';
  return 'below-average';
}

export function sortData(data, sortConfig) {
  if (!sortConfig.key) return data;
  
  return [...data].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function filterData(data, searchTerm, columnFilters = {}) {
  let filtered = [...data];
  
  // Apply global search
  if (searchTerm) {
    filtered = filtered.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }
  
  // Apply column-specific filters
  Object.entries(columnFilters).forEach(([key, filterValue]) => {
    if (filterValue) {
      filtered = filtered.filter(row =>
        String(row[key]).toLowerCase().includes(filterValue.toLowerCase())
      );
    }
  });
  
  return filtered;
}