/**
 * Generic Tree View Component
 * 
 * Features:
 * - Hierarchical data display
 * - Expandable/collapsible nodes
 * - Selection support (single/multi)
 * - Customizable node rendering
 * - Event handling for selection and expansion
 * 
 * Node Structure:
 * {
 *   id?: string,            // Optional unique identifier
 *   label: string,          // Display text for the node
 *   children?: Array,       // Child nodes (optional)
 *   expanded?: boolean,     // Initial expansion state (null/0/false = collapsed, true = expanded)
 *   data?: any,            // Custom data associated with the node
 *   [key: string]: any     // Any additional properties
 * }
 * 
 * @class TreeView
 */
export class TreeView {
    
    static CONSTANTS = {
        ICONS: {
            EXPANDED: '▼',
            COLLAPSED: '▶'
        },
        STYLES: {
            CONTAINER: {
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.4',
                color: '#e0e0e0',
                backgroundColor: '#2d2d2d',
                padding: '8px',
                height: '100%',
                overflow: 'auto',
                boxSizing: 'border-box',
                // Prevent nested scrollbar issues
                position: 'relative'
            },
            NODE: {
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '3px',
                userSelect: 'none',
                whiteSpace: 'nowrap'
            },
            NODE_HOVER: {
                backgroundColor: '#404040'
            },
            NODE_SELECTED: {
                backgroundColor: '#007acc',
                color: '#ffffff'
            },
            NODE_CONTENT: {
                display: 'flex',
                alignItems: 'center'
            },
            ICON: {
                marginRight: '4px',
                minWidth: '12px',
                textAlign: 'center'
            },
            CHILDREN: {
                marginLeft: '16px'
            }
        }
    };

    constructor(options = {}) {
        this.options = {
            container: options.container || document.body,
            data: options.data || [],
            showIcons: options.showIcons !== false,
            multiSelect: options.multiSelect || false,
            nodeRenderer: options.nodeRenderer || null,
            toggleDefinitions: options.toggleDefinitions || {},
            toggleOrder: options.toggleOrder || [],
            nodeTypes: options.nodeTypes || {},
            ...options
        };

        this.selectedNodes = new Set();
        this.expandedNodes = new Set();
        this.nodeElements = new Map();
        this.onSelectionChange = options.onSelectionChange || (() => {});
        this.onNodeExpand = options.onNodeExpand || (() => {});
        this.onToggleClick = options.onToggleClick || (() => {});

        // Initialize expansion state from data
        this._initializeExpansionState(this.options.data, '');

        this._createContainer();
        this._render();
    }

    /**
     * Initialize expansion state from node data
     * Processes the 'expanded' property on nodes to set initial expansion state
     * @private
     */
    _initializeExpansionState(nodes, path) {
        nodes.forEach((node, index) => {
            const nodePath = path ? `${path}.${index}` : `${index}`;
            
            // Check if node has expanded property and it's truthy (not null, 0, false, undefined)
            if (node.expanded && node.expanded !== 0 && node.expanded !== null) {
                this.expandedNodes.add(nodePath);
            }
            
            // Recursively process children
            if (node.children && node.children.length > 0) {
                this._initializeExpansionState(node.children, nodePath);
            }
        });
    }

    _createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'treeview-container';
        Object.assign(this.container.style, TreeView.CONSTANTS.STYLES.CONTAINER);
        
        this.options.container.appendChild(this.container);
    }

    _render() {
        this.container.innerHTML = '';
        this.nodeElements.clear();
        this._renderNodes(this.options.data, this.container, '');
    }

    _renderNodes(nodes, parentElement, path) {
        nodes.forEach((node, index) => {
            const nodePath = path ? `${path}.${index}` : `${index}`;
            const nodeElement = this._createNodeElement(node, nodePath);
            parentElement.appendChild(nodeElement);
            
            if (node.children && node.children.length > 0) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'treeview-children';
                Object.assign(childrenContainer.style, TreeView.CONSTANTS.STYLES.CHILDREN);
                
                const isExpanded = this.expandedNodes.has(nodePath);
                childrenContainer.style.display = isExpanded ? 'block' : 'none';
                
                this._renderNodes(node.children, childrenContainer, nodePath);
                parentElement.appendChild(childrenContainer);
            }
        });
    }

    _createNodeElement(node, path) {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'treeview-node';
        nodeDiv.dataset.path = path;
        Object.assign(nodeDiv.style, TreeView.CONSTANTS.STYLES.NODE);
        
        const contentDiv = document.createElement('div');
        Object.assign(contentDiv.style, TreeView.CONSTANTS.STYLES.NODE_CONTENT);
        
        // Use custom renderer if provided, otherwise use default
        if (this.options.nodeRenderer) {
            const customContent = this.options.nodeRenderer(node, path, {
                isExpanded: this.expandedNodes.has(path),
                isSelected: this.selectedNodes.has(path),
                hasChildren: node.children && node.children.length > 0
            });
            if (customContent) {
                if (typeof customContent === 'string') {
                    contentDiv.innerHTML = customContent;
                } else {
                    contentDiv.appendChild(customContent);
                }
            }
        } else {
            // Use default renderer with toggle support
            const defaultContent = this._defaultNodeRenderer(node, path, {
                isExpanded: this.expandedNodes.has(path),
                isSelected: this.selectedNodes.has(path),
                hasChildren: node.children && node.children.length > 0
            });
            if (defaultContent) {
                contentDiv.appendChild(defaultContent);
            }
        }
        
        nodeDiv.appendChild(contentDiv);
        
        // Event listeners
        nodeDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleNodeClick(node, path, nodeDiv);
        });
        
        nodeDiv.addEventListener('mouseenter', () => {
            if (!this.selectedNodes.has(path)) {
                Object.assign(nodeDiv.style, TreeView.CONSTANTS.STYLES.NODE_HOVER);
            }
        });
        
        nodeDiv.addEventListener('mouseleave', () => {
            if (!this.selectedNodes.has(path)) {
                nodeDiv.style.backgroundColor = '';
            }
        });
        
        // Apply selection styling if selected
        if (this.selectedNodes.has(path)) {
            Object.assign(nodeDiv.style, TreeView.CONSTANTS.STYLES.NODE_SELECTED);
        }
        
        this.nodeElements.set(path, nodeDiv);
        return nodeDiv;
    }

    _handleNodeClick(node, path, nodeElement) {
        // Handle expansion/collapse
        if (node.children && node.children.length > 0) {
            this._toggleNode(path);
        }
        
        // Handle selection
        if (this.options.multiSelect && event.ctrlKey) {
            if (this.selectedNodes.has(path)) {
                this.selectedNodes.delete(path);
                nodeElement.style.backgroundColor = '';
                nodeElement.style.color = '';
            } else {
                this.selectedNodes.add(path);
                Object.assign(nodeElement.style, TreeView.CONSTANTS.STYLES.NODE_SELECTED);
            }
        } else {
            // Single selection
            this.selectedNodes.forEach(selectedPath => {
                const selectedElement = this.nodeElements.get(selectedPath);
                if (selectedElement) {
                    selectedElement.style.backgroundColor = '';
                    selectedElement.style.color = '';
                }
            });
            
            this.selectedNodes.clear();
            this.selectedNodes.add(path);
            Object.assign(nodeElement.style, TreeView.CONSTANTS.STYLES.NODE_SELECTED);
        }
        
        this.onSelectionChange(Array.from(this.selectedNodes), node);
    }

    _toggleNode(path) {
        const isExpanded = this.expandedNodes.has(path);
        
        if (isExpanded) {
            this.expandedNodes.delete(path);
        } else {
            this.expandedNodes.add(path);
        }
        
        // Update expansion icon
        const nodeElement = this.nodeElements.get(path);
        if (nodeElement && this.options.showIcons) {
            const expandIcon = nodeElement.querySelector('.treeview-expand-icon');
            if (expandIcon) {
                expandIcon.textContent = isExpanded 
                    ? TreeView.CONSTANTS.ICONS.COLLAPSED 
                    : TreeView.CONSTANTS.ICONS.EXPANDED;
            }
        }
        
        // Toggle children visibility
        const childrenContainer = nodeElement.nextElementSibling;
        if (childrenContainer && childrenContainer.classList.contains('treeview-children')) {
            childrenContainer.style.display = isExpanded ? 'none' : 'block';
        }
        
        this.onNodeExpand(path, !isExpanded);
    }

    /**
     * Creates a property toggle element
     * @private
     */
    _createPropertyToggle(node, path, toggleKey, toggleDefinition, onToggleClick) {
        const isActionToggle = !toggleDefinition?.values || toggleDefinition.values.length === 0;
        const value = isActionToggle ? null : this._getToggleValue(node, toggleKey);
        let iconData = '?';
        
        if (toggleDefinition && toggleDefinition.icons) {
            if (isActionToggle) {
                // For action toggles, use the icon directly (not based on value)
                iconData = typeof toggleDefinition.icons === 'string' 
                    ? toggleDefinition.icons 
                    : (toggleDefinition.icons.default || '?');
            } else {
                // For regular toggles, use icon based on current value
                iconData = toggleDefinition.icons[value] || '?';
            }
        } else {
            iconData = isActionToggle ? '⚡' : (value ? '✓' : '✗');
        }
        
        const toggle = document.createElement('span');
        toggle.className = 'treeview-property-toggle';
        toggle.dataset.property = toggleKey;
        toggle.dataset.path = path;
        toggle.style.cursor = 'pointer';
        toggle.style.padding = '2px';
        toggle.style.borderRadius = '2px';
        toggle.style.fontSize = '12px';
        toggle.style.display = 'inline-block';
        toggle.style.width = '16px';
        toggle.style.textAlign = 'center';
        
        // Set the icon content
        if (typeof iconData === 'string' && iconData.trim().startsWith('<svg')) {
            toggle.innerHTML = iconData;
            const svg = toggle.querySelector('svg');
            if (svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
                svg.style.display = 'block';
            }
        } else {
            toggle.textContent = iconData;
        }
        
        toggle.title = isActionToggle 
            ? (toggleDefinition?.label || toggleKey)
            : `${toggleDefinition?.label || toggleKey}: ${value}`;
        
        toggle.addEventListener('mouseenter', () => {
            toggle.style.backgroundColor = '#555';
        });
        
        toggle.addEventListener('mouseleave', () => {
            toggle.style.backgroundColor = '';
        });
        
        // Add click handler
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleToggleClick(node, path, toggleKey, toggleDefinition, onToggleClick);
        });
        
        return toggle;
    }

    /**
     * Handle toggle click events
     * @private
     */
    _handleToggleClick(node, path, toggleKey, toggleDefinition, onToggleClick) {
        // Check if this is an action toggle (no values or empty values array)
        const isActionToggle = !toggleDefinition?.values || toggleDefinition.values.length === 0;
        
        if (isActionToggle) {
            // Action toggle - just call the callback without changing node data
            if (onToggleClick) {
                onToggleClick(path, toggleKey, null, null, node, 'action');
            }
            return;
        }
        
        // Regular toggle - cycle through values
        if (this._shouldShowToggle(node, toggleKey) && !isActionToggle) {
            // Ensure node.toggles exists
            if (!node.toggles) {
                node.toggles = {};
            }
            
            const oldValue = this._getToggleValue(node, toggleKey);
            let newValue;
            
            if (toggleDefinition && toggleDefinition.values && toggleDefinition.values.length > 0) {
                // Cycle through defined values
                const currentIndex = toggleDefinition.values.indexOf(oldValue);
                const nextIndex = (currentIndex + 1) % toggleDefinition.values.length;
                newValue = toggleDefinition.values[nextIndex];
            } else {
                // Default boolean toggle
                newValue = !oldValue;
            }
            
            node.toggles[toggleKey] = newValue;
            
            // Update the toggle icon (only for regular toggles, not action toggles)
            const nodeElement = this.nodeElements.get(path);
            if (nodeElement) {
                const toggle = nodeElement.querySelector(`[data-property="${toggleKey}"]`);
                if (toggle) {
                    if (toggleDefinition && toggleDefinition.icons) {
                        toggle.textContent = toggleDefinition.icons[newValue] || '?';
                        toggle.title = `${toggleDefinition.label || toggleKey}: ${newValue}`;
                    } else {
                        toggle.textContent = newValue ? '✓' : '✗';
                        toggle.title = `${toggleKey}: ${newValue}`;
                    }
                }
            }
            
            // Call the callback for regular toggles
            if (onToggleClick) {
                onToggleClick(path, toggleKey, newValue, oldValue, node, 'toggle');
            }
        }
    }

    /**
     * Default node renderer with toggle support
     * @private
     */
    _defaultNodeRenderer(node, path, state) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.width = '100%';

        // Expansion icon (only if showIcons is enabled)
        if (this.options.showIcons && state.hasChildren) {
            const expandIcon = document.createElement('span');
            expandIcon.className = 'treeview-expand-icon';
            expandIcon.style.marginRight = '4px';
            expandIcon.style.minWidth = '12px';
            expandIcon.style.textAlign = 'center';
            expandIcon.textContent = state.isExpanded ? '▼' : '▶';
            container.appendChild(expandIcon);
        }

        // Type icon (only if showIcons is enabled and we have node types defined)
        if (this.options.showIcons && this.options.nodeTypes) {
            const typeIcon = document.createElement('span');
            typeIcon.className = 'treeview-type-icon';
            typeIcon.style.marginRight = '4px';
            typeIcon.style.minWidth = '12px';
            typeIcon.style.textAlign = 'center';
            
            const nodeType = node.type || 'custom';
            const typeIcons = this.options.nodeTypes[nodeType];
            let icon = node.icon || typeIcons?.default || '•';
            
            // Use expanded/collapsed icons for folders
            if (nodeType === 'folder' && state.hasChildren) {
                icon = state.isExpanded ? (typeIcons?.expanded || icon) : (typeIcons?.collapsed || icon);
            }
            
            typeIcon.textContent = icon;
            container.appendChild(typeIcon);
        }

        // Label
        const label = document.createElement('span');
        label.className = 'treeview-label';
        label.textContent = node.label || node.name || `Node ${path}`;
        container.appendChild(label);

        // Property toggles with column alignment
        if (this.options.toggleOrder?.length > 0) {
            const togglesContainer = document.createElement('span');
            togglesContainer.className = 'treeview-toggles';
            togglesContainer.style.marginLeft = 'auto';
            togglesContainer.style.display = 'flex';
            togglesContainer.style.alignItems = 'center';
            
            // Create toggles in the specified order for consistent column alignment
            this.options.toggleOrder.forEach(toggleKey => {
                const toggleColumn = document.createElement('span');
                toggleColumn.style.width = '20px';
                toggleColumn.style.textAlign = 'center';
                toggleColumn.style.display = 'inline-block';
                
                // Check if this toggle should be visible for this node
                if (this._shouldShowToggle(node, toggleKey)) {
                    const toggleDef = this.options.toggleDefinitions[toggleKey];
                    const toggle = this._createPropertyToggle(node, path, toggleKey, toggleDef, this.onToggleClick);
                    toggleColumn.appendChild(toggle);
                }
                // If toggle shouldn't be shown, leave the column empty for alignment
                
                togglesContainer.appendChild(toggleColumn);
            });
            
            container.appendChild(togglesContainer);
        }

        return container;
    }

    /**
     * Check if a toggle should be visible for a given node
     * @private
     */
    _shouldShowToggle(node, toggleKey) {
        // Check if node explicitly hides this toggle with null
        if (node.toggles && toggleKey in node.toggles && node.toggles[toggleKey] === null) {
            return false; // Explicitly hidden
        }
        
        // Check if node has explicit toggle visibility override
        if (node.toggles && toggleKey in node.toggles && node.toggles[toggleKey] !== null) {
            return true; // Node explicitly defines this toggle
        }
        
        // Check node type defaults
        const nodeType = node.type || 'custom';
        const typeDefinition = this.options.nodeTypes[nodeType];
        if (typeDefinition && typeDefinition.defaultToggles && toggleKey in typeDefinition.defaultToggles) {
            // For action toggles, check if the default value is truthy
            const toggleDef = this.options.toggleDefinitions[toggleKey];
            const isActionToggle = !toggleDef?.values || toggleDef.values.length === 0;
            
            if (isActionToggle) {
                return typeDefinition.defaultToggles[toggleKey] === true;
            } else {
                return true; // Regular toggles are shown if they're in defaultToggles
            }
        }
        
        // Default: don't show toggle
        return false;
    }

    /**
     * Get the effective toggle value for a node (considering defaults)
     * @private
     */
    _getToggleValue(node, toggleKey) {
        // Check if node has explicit value (but not null, which means hidden)
        if (node.toggles && toggleKey in node.toggles && node.toggles[toggleKey] !== null) {
            return node.toggles[toggleKey];
        }
        
        // Use node type default
        const nodeType = node.type || 'custom';
        const typeDefinition = this.options.nodeTypes[nodeType];
        if (typeDefinition && typeDefinition.defaultToggles && toggleKey in typeDefinition.defaultToggles) {
            return typeDefinition.defaultToggles[toggleKey];
        }
        
        // Fallback defaults
        const toggleDef = this.options.toggleDefinitions[toggleKey];
        if (toggleDef && toggleDef.values && toggleDef.values.length > 0) {
            return toggleDef.values[0]; // First value as default
        }
        
        return false; // Boolean default
    }

    // Public API methods
    
    /**
     * Update the tree data and re-render
     * @param {Array} data - New tree data
     */
    setData(data) {
        this.options.data = data;
        // Re-initialize expansion state from new data
        this.expandedNodes.clear();
        this._initializeExpansionState(this.options.data, '');
        this._render();
    }

    /**
     * Get currently selected node paths
     * @returns {Array} Array of selected paths
     */
    getSelection() {
        return Array.from(this.selectedNodes);
    }

    /**
     * Programmatically select nodes
     * @param {Array} paths - Array of paths to select
     */
    setSelection(paths) {
        // Clear current selection
        this.selectedNodes.forEach(path => {
            const element = this.nodeElements.get(path);
            if (element) {
                element.style.backgroundColor = '';
                element.style.color = '';
            }
        });
        
        this.selectedNodes.clear();
        
        // Apply new selection
        paths.forEach(path => {
            this.selectedNodes.add(path);
            const element = this.nodeElements.get(path);
            if (element) {
                Object.assign(element.style, TreeView.CONSTANTS.STYLES.NODE_SELECTED);
            }
        });
    }

    /**
     * Expand or collapse a node
     * @param {string} path - Node path
     * @param {boolean} expanded - Whether to expand or collapse
     */
    setNodeExpanded(path, expanded) {
        const isCurrentlyExpanded = this.expandedNodes.has(path);
        if (expanded !== isCurrentlyExpanded) {
            this._toggleNode(path);
        }
    }

    /**
     * Expand all nodes
     */
    expandAll() {
        this._visitAllNodes(this.options.data, '', (node, path) => {
            if (node.children && node.children.length > 0) {
                this.expandedNodes.add(path);
            }
        });
        this._render();
    }

    /**
     * Collapse all nodes
     */
    collapseAll() {
        this.expandedNodes.clear();
        this._render();
    }

    /**
     * Get the expansion state of a node
     * @param {string} path - The path to the node
     * @returns {boolean} True if the node is expanded, false otherwise
     */
    isNodeExpanded(path) {
        return this.expandedNodes.has(path);
    }

    /**
     * Get all expanded node paths
     * @returns {Array<string>} Array of expanded node paths
     */
    getExpandedNodes() {
        return Array.from(this.expandedNodes);
    }

    /**
     * Set the expansion state for multiple nodes
     * @param {Array<string>} paths - Array of node paths to expand
     */
    setExpandedNodes(paths) {
        this.expandedNodes.clear();
        paths.forEach(path => this.expandedNodes.add(path));
        this._render();
    }

    /**
     * Get the current data with expansion state merged in
     * This creates a copy of the original data with 'expanded' properties updated
     * to reflect the current expansion state of the TreeView
     * @returns {Array} Data structure with current expansion state
     */
    getDataWithExpansionState() {
        return this._mergeExpansionState(this.options.data, '');
    }

    /**
     * Merge current expansion state into data structure
     * @private
     */
    _mergeExpansionState(nodes, basePath) {
        return nodes.map((node, index) => {
            const path = basePath ? `${basePath}.${index}` : `${index}`;
            const nodeCopy = { ...node };
            
            // Only add expanded property if the node has children
            if (node.children && node.children.length > 0) {
                nodeCopy.expanded = this.expandedNodes.has(path);
                nodeCopy.children = this._mergeExpansionState(node.children, path);
            }
            
            return nodeCopy;
        });
    }

    _visitAllNodes(nodes, basePath, callback) {
        nodes.forEach((node, index) => {
            const path = basePath ? `${basePath}.${index}` : `${index}`;
            callback(node, path);
            if (node.children) {
                this._visitAllNodes(node.children, path, callback);
            }
        });
    }

    /**
     * Destroy the tree view and clean up
     */
    destroy() {
        this.container.remove();
        this.nodeElements.clear();
        this.selectedNodes.clear();
        this.expandedNodes.clear();
    }
}
