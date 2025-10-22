import React, { useEffect, useState, useMemo } from 'react';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ScienceIcon from '@mui/icons-material/Science';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

// Helper function to get all child IDs of a node (including files)
function getAllChildIds(node, path = []) {
  const ids = [];
  Object.entries(node).forEach(([key, value]) => {
    if (key === 'files' && Array.isArray(value)) {
      value.forEach(file => ids.push([...path, file].join('/')));
    } else if (typeof value === 'object') {
      const folderPath = [...path, key].join('/');
      ids.push(folderPath);
      ids.push(...getAllChildIds(value, [...path, key]));
    }
  });
  return ids;
}

// Helper function to flatten structure into searchable items
function flattenStructure(node, path = []) {
  const items = [];
  Object.entries(node).forEach(([key, value]) => {
    if (key === 'files' && Array.isArray(value)) {
      value.forEach(file => {
        items.push({
          id: [...path, file].join('/'),
          name: file.replace('.json', ''), // Remove .json extension
          path: [...path, file],
          type: 'file',
          category: path[0] || '',
          subcategory: path[1] || ''
        });
      });
    } else if (typeof value === 'object') {
      const folderId = [...path, key].join('/');
      items.push({
        id: folderId,
        name: key,
        path: [...path, key],
        type: 'folder',
        category: path[0] || key,
        subcategory: path[1] || '',
        node: value
      });
      items.push(...flattenStructure(value, [...path, key]));
    }
  });
  return items;
}

// Helper function to get icon based on category
function getCategoryIcon(category) {
  switch(category) {
    case 'Events':
      return EmojiEventsIcon;
    case 'Season_0':
      return SportsKabaddiIcon;
    case 'Tests':
      return ScienceIcon;
    default:
      return SportsKabaddiIcon;
  }
}

// Helper function to check if a folder/category is fully selected
function isNodeFullySelected(node, path, selected) {
  const childIds = getAllChildIds(node, path);
  return childIds.every(id => selected.includes(id));
}

// Helper function to check if a folder/category is partially selected
function isNodePartiallySelected(node, path, selected) {
  const childIds = getAllChildIds(node, path);
  return childIds.some(id => selected.includes(id)) && !childIds.every(id => selected.includes(id));
}

export default function BRDataSelector({ onSelect }) {
  // Arrow icons for expand/collapse
  // Track expanded folders by their IDs
  const [expandedFolders, setExpandedFolders] = useState([]);

  // Toggle folder expansion
  const handleToggleFolder = (folderId) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };
  const [structure, setStructure] = useState(null);
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  // Collapsed state for compact UI (start collapsed on page load)
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    // Load the pre-generated static JSON (works on GH Pages / static deploys).
    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '';
    const staticJsonUrl = `${base}br-data-structure.json`;

    async function loadStatic() {
      try {
        const res = await fetch(staticJsonUrl);
        if (!res.ok) {
          console.error('Static br-data-structure.json not found at', staticJsonUrl);
          return;
        }
        const data = await res.json();
        setStructure(data);
        if (data && data.Tests) {
          const testsIds = getAllChildIds(data.Tests, ['Tests']);
          const initialSelected = ['Tests', ...testsIds];
          setSelected(initialSelected);
          if (onSelect) {
            const fileIds = testsIds.filter(id => id.includes('.json'));
            onSelect(fileIds);
          }
        }
      } catch (err) {
        console.error('Failed to load static br-data structure:', err);
      }
    }

    loadStatic();
  }, []);

  // Flatten structure for searching
  const flatItems = useMemo(() => {
    if (!structure) return [];
    return flattenStructure(structure);
  }, [structure]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return flatItems;
    const query = searchQuery.toLowerCase();
    return flatItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.subcategory.toLowerCase().includes(query)
    );
  }, [flatItems, searchQuery]);

  // Group filtered items by category for better display
  const groupedSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return {};
    const groups = {};
    filteredItems.forEach(item => {
      const category = item.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    return groups;
  }, [filteredItems, searchQuery]);

  // Helper: get visible IDs for a category (respect search). Returns file/folder ids.
  const getVisibleIdsForCategory = (category) => {
    if (!structure) return [];
    if (searchQuery && searchQuery.trim()) {
      return filteredItems.filter(fi => fi.category === category).map(fi => fi.id);
    }
    // No search: return all child ids for the full category
    return getAllChildIds(structure[category], [category]);
  };

  const isCategoryPartiallySelectedVisible = (category) => {
    const ids = getVisibleIdsForCategory(category);
    return ids.some(id => selected.includes(id)) && !ids.every(id => selected.includes(id));
  };

  const toggleCategorySelection = (category) => {
    const ids = getVisibleIdsForCategory(category);
    const rootId = category;
    const allIds = [rootId, ...ids];
    const fullySelected = allIds.every(id => selected.includes(id));
    if (fullySelected) {
      setSelected(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelected(prev => {
        const s = new Set(prev);
        allIds.forEach(id => s.add(id));
        return Array.from(s);
      });
    }
  };

  // Select all visible file matches (used by Ctrl/Cmd+A when search is focused)
  const selectAllVisibleMatches = () => {
    if (!flatItems || flatItems.length === 0) return;
    // Use filteredItems which returns flatItems when search is empty
    const fileIds = filteredItems.filter(fi => fi.type === 'file').map(fi => fi.id);
    if (fileIds.length === 0) return;
    setSelected(prev => {
      const s = new Set(prev);
      fileIds.forEach(id => s.add(id));
      return Array.from(s);
    });
  };

  // Automatically expand folders that contain search results
  useEffect(() => {
    if (!searchQuery.trim()) return;
    // Find all folder paths that need to be expanded for current search
    const expanded = new Set();
    filteredItems.forEach(item => {
      if (item.path && item.path.length > 1) {
        // Expand all parent folders in the path
        for (let i = 1; i < item.path.length; i++) {
          expanded.add(item.path.slice(0, i).join('/'));
        }
      }
    });
    setExpandedFolders(prev => Array.from(new Set([...prev, ...expanded])));
  }, [searchQuery, filteredItems]);

  const handleSearchItemToggle = (item) => {
    if (item.type === 'folder') {
      // When a search is active, only select/unselect items that are currently visible (filteredItems)
      const isSelected = selected.includes(item.id);
      let childIdsVisible = [];
      if (searchQuery && searchQuery.trim()) {
        // gather visible descendant IDs from filteredItems
        childIdsVisible = filteredItems
          .filter(fi => fi.path && fi.path.join('/').startsWith(item.id))
          .map(fi => fi.id);
      } else {
        // no search: fall back to selecting all children in the full structure
        childIdsVisible = getAllChildIds(item.node, item.path);
      }

      const allIds = [item.id, ...childIdsVisible];

      if (isSelected) {
        setSelected(prev => prev.filter(id => !allIds.includes(id)));
      } else {
        setSelected(prev => {
          const newSelected = new Set(prev);
          allIds.forEach(id => newSelected.add(id));
          return Array.from(newSelected);
        });
      }
    } else {
      const isSelected = selected.includes(item.id);
      setSelected(prev => 
        isSelected 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    }
  };

  const handleSelectAll = () => {
    if (!structure) return;
    const allIds = [];
    function collectIds(node, path = []) {
      Object.entries(node).forEach(([key, value]) => {
        if (key === 'files' && Array.isArray(value)) {
          value.forEach(file => allIds.push([...path, file].join('/')));
        } else if (typeof value === 'object') {
          allIds.push([...path, key].join('/'));
          collectIds(value, [...path, key]);
        }
      });
    }
    collectIds(structure);
    setSelected(allIds);
  };

  const handleUnselectAll = () => setSelected([]);

  const handleApplySelection = () => {
    if (onSelect) onSelect(selected);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Expand / Collapse all folders
  const expandAll = () => {
    const allFolderIds = flatItems.filter(i => i.type === 'folder').map(i => i.id);
    setExpandedFolders(allFolderIds);
  };

  const collapseAll = () => setExpandedFolders([]);


  // Helper to check if all items in a category are selected
  function isCategoryFullySelected(category) {
    if (!structure || !structure[category]) return false;
    const allIds = getAllChildIds(structure[category], [category]);
    // Also include the category root itself
    return [category, ...allIds].every(id => selected.includes(id));
  }

  // Helper to check if all items in a subcategory are selected
  function isSubcategoryFullySelected(category, subcategory) {
    if (!structure || !structure[category] || !structure[category][subcategory]) return false;
    const allIds = getAllChildIds(structure[category][subcategory], [category, subcategory]);
    // Also include the subcategory root itself
    return [`${category}/${subcategory}`, ...allIds].every(id => selected.includes(id));
  }

  // Get selected categories and subcategories (only fully selected)
  const getSelectedCategoriesAndSubcategories = () => {
    if (!structure) return [];
    const chips = [];
    Object.keys(structure).forEach(category => {
      if (isCategoryFullySelected(category)) {
        chips.push({ label: category, id: category, type: 'category' });
      } else {
        // Check subcategories
        const node = structure[category];
        Object.keys(node).forEach(subcategory => {
          if (subcategory !== 'files' && isSubcategoryFullySelected(category, subcategory)) {
            chips.push({ label: `${category} / ${subcategory}`, id: `${category}/${subcategory}`, type: 'subcategory' });
          }
        });
      }
    });
    return chips;
  };

  const selectedFileCount = selected.filter(id => id.includes('.json')).length;
  const selectedFolderCount = selected.length - selectedFileCount;

  // Compact collapsed bar
  if (collapsed) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
        <Paper
          onClick={() => setCollapsed(false)}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, flex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.05)', accentColor: 'rgba(255, 255, 255, 0.7)',  color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.4)',
            }, 
            cursor: 'pointer'
           }}
          elevation={2}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1
            }}>
            <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            <span style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)' }}>Selected Data</span>
            <Chip style={{ backgroundColor: '#2563eb', color: 'rgba(255, 255, 255, 0.7)' }} label={`${selectedFileCount} Matches`} size="small" />
          </Box>
        </Paper>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setCollapsed(false); }}>
          <ArrowRightIcon />
        </IconButton>
      </Box>
    );
  }

  if (!structure) return <div>Loading data structure...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      {/* Search Bar */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search categories, league or test matches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            // Use Enter to select all visible matches when focused on the search box
            if (e.key === 'Enter') {
              e.preventDefault();
              selectAllVisibleMatches();
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.4)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
            '& .MuiInputBase-input': {
              color: '#fff', // Make input text white
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'rgba(255, 255, 255, 0.5)',
              opacity: 1,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <IconButton size="small" onClick={() => setCollapsed(true)} sx={{ ml: 1 }}>
          <ArrowDropDownIcon />
        </IconButton>
      </div>
      {/* Shortcut hint */}
      <Box sx={{ fontSize: '0.75rem', color: '#ffffff8c', marginTop: '-6px' }}>
        Tip: Press <strong>Enter</strong> to select all visible matches while searching
      </Box>

      {/* Selection Summary and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button onClick={handleSelectAll} variant="contained" size="small">
            Select All
          </Button>
          <Button onClick={handleUnselectAll} variant="outlined" size="small">
            Unselect All
          </Button>
          <Box sx={{ fontSize: '0.875rem', color: '#666', display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={`${selectedFileCount} Matches`} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            <Chip 
              label={`${selectedFolderCount} Categories`} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button 
            onClick={handleApplySelection} 
            variant="contained" 
            color="success" 
            size="small"
            disabled={selectedFileCount === 0}
          >
            Load {selectedFileCount} File{selectedFileCount !== 1 ? 's' : ''}
          </Button>
        </Box>
      </Box>

      {/* Active Category/Subcategory Filters */}
      {getSelectedCategoriesAndSubcategories().length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center'}}>
          <span style={{ fontSize: '0.75rem', color: '#ffffff8c', marginRight: 4 }}>Selected Categories:</span>
          {getSelectedCategoriesAndSubcategories().map(chip => (
            <Box
              key={chip.id}
              sx={{
                display: 'inline-block',
                ml: chip.type === 'subcategory' ? 2 : 0 // Indent subcategories
              }}
            >
              <Chip
                label={chip.label}
                size="small"
                onDelete={() => {
                  // Deselect all items in this category or subcategory, including the root itself
                  setSelected(prev => prev.filter(id => id !== chip.id && !id.startsWith(chip.id + '/')));
                }}
                color="primary"
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Search Results or Tree View */}
      <Paper 
        variant="outlined" 
        sx={{ 
          maxHeight: '500px', 
          overflowY: 'auto', 
          padding: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'rgba(255, 255, 255, 0.12)'
        }}
      >
        {/* Expand/Collapse all buttons — positioned at top-right of the results area */}
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '-20px' }}>
          <Button
            size="small"
            onClick={expandAll}
            variant="text"
            sx={{
              color: 'rgba(255,255,255,0.95)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              textTransform: 'none',
              fontSize: '0.875rem',
              mr: 1,
              px: 1,
              py: 0.5,
              borderRadius: '6px',
              boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.15)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
            }}
          >
            Expand
          </Button>
          <Button
            size="small"
            onClick={collapseAll}
            variant="text"
            sx={{
              color: 'rgba(255,255,255,0.95)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              textTransform: 'none',
              fontSize: '0.875rem',
              px: 1,
              py: 0.5,
              borderRadius: '6px',
              boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.15)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
            }}
          >
            Collapse
          </Button>
        </Box>
        {searchQuery.trim() ? (
          // Search Results View with collapsible folders
          <Box>
            {Object.keys(groupedSearchResults).length === 0 ? (
              <Box sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', padding: 3 }}>
                No results found for "{searchQuery}"
              </Box>
            ) : (
              Object.entries(groupedSearchResults).map(([category, items]) => {
                const CategoryIcon = getCategoryIcon(category);
                // Show immediate child folders under the category (path.length === 2).
                // Use flatItems so we can include folders that don't match the query but contain matching descendants.
                const immediateFolders = flatItems.filter(it => it.type === 'folder' && it.path.length === 2 && it.category === category);
                const folders = immediateFolders.filter(folderItem => {
                  // Include the folder if any filtered item's full path starts with this folder's id
                  return filteredItems.some(fi => fi.path.join('/').startsWith(folderItem.id));
                });
                const files = items.filter(item => item.type === 'file');
                return (
                  <Box key={category} sx={{ marginBottom: 2 }}>
                                <Box sx={{ 
                                  fontSize: '0.875rem', 
                                  fontWeight: 'bold', 
                                  color: 'rgba(255, 255, 255, 0.9)',
                                  marginBottom: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}>
                                  <Checkbox
                                    size="small"
                                    checked={(() => {
                                      const ids = getVisibleIdsForCategory(category);
                                      const all = [category, ...ids];
                                      return all.length > 0 && all.every(id => selected.includes(id));
                                    })()}
                                    indeterminate={isCategoryPartiallySelectedVisible(category)}
                                    onChange={() => toggleCategorySelection(category)}
                                    sx={{ color: 'rgba(255,255,255,0.8)' }}
                                  />
                                  <CategoryIcon fontSize="small" />
                                  {category}
                                </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {/* Render folders */}
                      {folders.map(folder => {
                        const isSelected = selected.includes(folder.id);
                        const isExpanded = expandedFolders.includes(folder.id);
                        const ItemIcon = CategoryIcon;
                        // Find files/subfolders belonging to this folder
                        const childFiles = items.filter(item => item.type === 'file' && item.path.slice(0, folder.path.length).join('/') === folder.id);
                        const childFolders = flatItems.filter(item =>
                          item.type === 'folder' &&
                          item.path.length > folder.path.length &&
                          item.path.slice(0, folder.path.length).join('/') === folder.id &&
                          // only include subfolders that contain at least one filtered item (match or descendant)
                          filteredItems.some(fi => fi.path.join('/').startsWith(item.id))
                        );
                        return (
                          <Box key={folder.id}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                backgroundColor: isSelected ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid',
                                borderColor: isSelected ? 'rgba(33, 150, 243, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: isSelected ? 'rgba(33, 150, 243, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                                },
                                transition: 'all 0.2s',
                                mb: isExpanded ? 0.5 : 0
                              }}
                              onClick={() => handleSearchItemToggle(folder)}
                            >
                              <Checkbox
                                checked={isSelected}
                                size="small"
                                sx={{ padding: '2px' }}
                              />
                              <ItemIcon sx={{ fontSize: 18, color: '#ffa726', marginRight: 1 }} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ 
                                  fontSize: '0.875rem', 
                                  fontWeight: 600,
                                  color: 'rgba(255, 255, 255, 0.9)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {folder.name}
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', minWidth: 32, textAlign: 'right' }}>
                                  {childFiles.length} file{childFiles.length !== 1 ? 's' : ''}
                                </Box>
                                <IconButton
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.7)',
                                    ml: 1,
                                    p: 0.5,
                                    borderRadius: '4px',
                                    '&:hover': { backgroundColor: 'rgba(33,150,243,0.15)' }
                                  }}
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleToggleFolder(folder.id);
                                  }}
                                >
                                  {isExpanded ? <ArrowDropDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
                                </IconButton>
                              </Box>
                            </Box>
                            {/* Render child files/folders if expanded */}
                            {isExpanded && (
                              <Box sx={{ pl: 4, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {/* Child folders */}
                                {childFolders.map(subfolder => {
                                  const isSubSelected = selected.includes(subfolder.id);
                                  const isSubExpanded = expandedFolders.includes(subfolder.id);
                                  return (
                                    <Box key={subfolder.id}>
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          padding: '6px 10px',
                                          borderRadius: '4px',
                                          backgroundColor: isSubSelected ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                          border: '1px solid',
                                          borderColor: isSubSelected ? 'rgba(33, 150, 243, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                                          cursor: 'pointer',
                                          '&:hover': {
                                            backgroundColor: isSubSelected ? 'rgba(33, 150, 243, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                                          },
                                          transition: 'all 0.2s',
                                          mb: isSubExpanded ? 0.5 : 0
                                        }}
                                        onClick={() => handleSearchItemToggle(subfolder)}
                                      >
                                        <Checkbox
                                          checked={isSubSelected}
                                          size="small"
                                          sx={{ padding: '2px' }}
                                        />
                                        <ItemIcon sx={{ fontSize: 18, color: '#ffa726', marginRight: 1 }} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Box sx={{ 
                                            fontSize: '0.875rem', 
                                            fontWeight: 600,
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {subfolder.name}
                                          </Box>
                                        </Box>
                                        <IconButton
                                          size="small"
                                          sx={{
                                            backgroundColor: 'rgba(255,255,255,0.08)',
                                            color: 'rgba(255,255,255,0.7)',
                                            ml: 1,
                                            p: 0.5,
                                            borderRadius: '4px',
                                            '&:hover': { backgroundColor: 'rgba(33,150,243,0.15)' }
                                          }}
                                          onClick={e => {
                                            e.stopPropagation();
                                            handleToggleFolder(subfolder.id);
                                          }}
                                        >
                                          {isSubExpanded ? <ArrowDropDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
                                        </IconButton>
                                      </Box>
                                      {/* Recursive: show child files/folders if expanded */}
                                      {isSubExpanded && (
                                        <Box sx={{ pl: 4, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                          {/* Child files for subfolder */}
                                          {items.filter(item => item.type === 'file' && item.path.slice(0, subfolder.path.length).join('/') === subfolder.id).map(file => {
                                            const isFileSelected = selected.includes(file.id);
                                            return (
                                              <Box
                                                key={file.id}
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  padding: '6px 10px',
                                                  borderRadius: '4px',
                                                  backgroundColor: isFileSelected ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                  border: '1px solid',
                                                  borderColor: isFileSelected ? 'rgba(33, 150, 243, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                                                  cursor: 'pointer',
                                                  '&:hover': {
                                                    backgroundColor: isFileSelected ? 'rgba(33, 150, 243, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                                                  },
                                                  transition: 'all 0.2s'
                                                }}
                                                onClick={() => handleSearchItemToggle(file)}
                                              >
                                                <Checkbox
                                                  checked={isFileSelected}
                                                  size="small"
                                                  sx={{ padding: '2px' }}
                                                />
                                                <SportsKabaddiIcon sx={{ fontSize: 18, color: '#42a5f5', marginRight: 1 }} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                  <Box sx={{ 
                                                    fontSize: '0.875rem', 
                                                    fontWeight: 400,
                                                    color: 'rgba(255, 255, 255, 0.9)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                  }}>
                                                    {file.name}
                                                  </Box>
                                                </Box>
                                              </Box>
                                            );
                                          })}
                                        </Box>
                                      )}
                                    </Box>
                                  );
                                })}
                                {/* Child files for folder */}
                                {childFiles.map(file => {
                                  const isFileSelected = selected.includes(file.id);
                                  return (
                                    <Box
                                      key={file.id}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '6px 10px',
                                        borderRadius: '4px',
                                        backgroundColor: isFileSelected ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid',
                                        borderColor: isFileSelected ? 'rgba(33, 150, 243, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                                        cursor: 'pointer',
                                        '&:hover': {
                                          backgroundColor: isFileSelected ? 'rgba(33, 150, 243, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                                        },
                                        transition: 'all 0.2s'
                                      }}
                                      onClick={() => handleSearchItemToggle(file)}
                                    >
                                      <Checkbox
                                        checked={isFileSelected}
                                        size="small"
                                        sx={{ padding: '2px' }}
                                      />
                                      <SportsKabaddiIcon sx={{ fontSize: 18, color: '#42a5f5', marginRight: 1 }} />
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ 
                                          fontSize: '0.875rem', 
                                          fontWeight: 400,
                                          color: 'rgba(255, 255, 255, 0.9)',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}>
                                          {file.name}
                                        </Box>
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                      {/* Render files not in folders (if any) */}
                      {files.filter(file => file.path.length === 1).map(file => {
                        const isFileSelected = selected.includes(file.id);
                        return (
                          <Box
                            key={file.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              backgroundColor: isFileSelected ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid',
                              borderColor: isFileSelected ? 'rgba(33, 150, 243, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: isFileSelected ? 'rgba(33, 150, 243, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                              },
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleSearchItemToggle(file)}
                          >
                            <Checkbox
                              checked={isFileSelected}
                              size="small"
                              sx={{ padding: '2px' }}
                            />
                            <SportsKabaddiIcon sx={{ fontSize: 18, color: '#42a5f5', marginRight: 1 }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ 
                                fontSize: '0.875rem', 
                                fontWeight: 400,
                                color: 'rgba(255, 255, 255, 0.9)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {file.name}
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        ) : (
          // No search - show message to use search
          <Box sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', padding: 4 }}>
            <SearchIcon sx={{ fontSize: 48, marginBottom: 2, opacity: 0.3 }} />
            <Box sx={{ fontSize: '0.875rem' }}>
              Use the search bar above to find and select categories or matches
            </Box>
          </Box>
        )}
      </Paper>
    </div>
  );
}
