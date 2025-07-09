/**
 * Comprehensive Tree View Component
 * 
 * Features:
 * - Hierarchical data display with multiple node types
 * - Expandable/collapsible nodes
 * - Selection support (single/multi)
 * - Toggleable node properties (visible, enabled, etc.)
 * - Custom icons and styling per node type
 * - Event handling for selection and expansion
 * 
 * Node Structure:
 * {
 *   id: string,              // Unique identifier for the node
 *   label: string,           // Display text for the node
 *   type: string,            // Node type (determines icons, behavior)
 *   children?: Array,        // Child nodes (optional)
 *   data?: any,             // Custom data associated with the node
 *   properties?: {          // Toggleable properties
 *     visible?: boolean,
 *     enabled?: boolean,
 *     locked?: boolean,
 *     // ... custom properties based on node type
 *   },
 *   icon?: string,          // Custom icon override
 *   tooltip?: string        // Tooltip text
 * }
 * 
 * Node Types:
 * - 'folder': Container nodes with children
 * - 'file': Leaf nodes without children
 * - 'component': Special nodes representing UI components
 * - 'layer': Visual layer nodes with visibility toggles
 * - 'custom': User-defined node types
 * 
 * @class TreeView
 */
export class TreeView {
    
    static CONSTANTS = {
        ICONS: {
            EXPANDED: '▼',
            COLLAPSED: '▶',
            LEAF: '•'
        },
        NODE_TYPES: {
            FOLDER: 'folder',
            FILE: 'file',
            COMPONENT: 'component',
            LAYER: 'layer',
            CUSTOM: 'custom'
        },
        TYPE_ICONS: {
            folder: {
                expanded: '📁',
                collapsed: '📂',
                default: '📁'
            },
            file: {
                default: '📄'
            },
            component: {
                default: '🧩'
            },
            layer: {
                default: '👁️'
            },
            custom: {
                default: '•'
            }
        },
        PROPERTY_ICONS: {
            visible: {
                true: '👁️',
                false: '🙈'
            },
            enabled: {
                true: '✅',
                false: '❌'
            },
            locked: {
                true: '🔒',
                false: '🔓'
            }
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
            showTypeIcons: options.showTypeIcons !== false,
            showPropertyToggles: options.showPropertyToggles || [],
            multiSelect: options.multiSelect || false,
            nodeTypes: options.nodeTypes || {},
            ...options
        };

        this.selectedNodes = new Set();
        this.expandedNodes = new Set();
        this.nodeElements = new Map();
        this.onSelectionChange = options.onSelectionChange || (() => {});
        this.onNodeExpand = options.onNodeExpand || (() => {});
        this.onPropertyToggle = options.onPropertyToggle || (() => {});

        this._createContainer();
        this._render();
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
        nodeDiv.dataset.nodeType = node.type || TreeView.CONSTANTS.NODE_TYPES.CUSTOM;
        Object.assign(nodeDiv.style, TreeView.CONSTANTS.STYLES.NODE);
        
        const contentDiv = document.createElement('div');
        Object.assign(contentDiv.style, TreeView.CONSTANTS.STYLES.NODE_CONTENT);
        
        // Expansion icon (for nodes with children)
        if (this.options.showIcons && node.children && node.children.length > 0) {
            const expandIcon = document.createElement('span');
            expandIcon.className = 'treeview-expand-icon';
            Object.assign(expandIcon.style, TreeView.CONSTANTS.STYLES.ICON);
            
            const isExpanded = this.expandedNodes.has(path);
            expandIcon.textContent = isExpanded 
                ? TreeView.CONSTANTS.ICONS.EXPANDED 
                : TreeView.CONSTANTS.ICONS.COLLAPSED;
            contentDiv.appendChild(expandIcon);
        }
        
        // Type icon
        if (this.options.showTypeIcons) {
            const typeIcon = document.createElement('span');
            typeIcon.className = 'treeview-type-icon';
            Object.assign(typeIcon.style, TreeView.CONSTANTS.STYLES.ICON);
            
            const nodeType = node.type || TreeView.CONSTANTS.NODE_TYPES.CUSTOM;
            const typeIcons = TreeView.CONSTANTS.TYPE_ICONS[nodeType];
            let icon = node.icon || typeIcons?.default || '•';
            
            // Use expanded/collapsed icons for folders if available
            if (nodeType === TreeView.CONSTANTS.NODE_TYPES.FOLDER && node.children?.length > 0) {
                const isExpanded = this.expandedNodes.has(path);
                icon = isExpanded ? (typeIcons?.expanded || icon) : (typeIcons?.collapsed || icon);
            }
            
            typeIcon.textContent = icon;
            contentDiv.appendChild(typeIcon);
        }
        
        // Label
        const labelSpan = document.createElement('span');
        labelSpan.className = 'treeview-label';
        labelSpan.textContent = node.label || node.name || `Node ${path}`;
        contentDiv.appendChild(labelSpan);
        
        // Property toggles
        if (this.options.showPropertyToggles.length > 0 && node.properties) {
            const togglesContainer = document.createElement('span');
            togglesContainer.className = 'treeview-toggles';
            togglesContainer.style.marginLeft = 'auto';
            togglesContainer.style.display = 'flex';
            togglesContainer.style.gap = '4px';
            
            this.options.showPropertyToggles.forEach(property => {
                if (property in node.properties) {
                    const toggle = this._createPropertyToggle(node, path, property);
                    togglesContainer.appendChild(toggle);
                }
            });
            
            contentDiv.appendChild(togglesContainer);
        }
        
        nodeDiv.appendChild(contentDiv);
        
        // Event listeners
        nodeDiv.addEventListener('click', (e) => {
            // Don't handle node click if clicking on property toggles
            if (e.target.closest('.treeview-toggles')) {
                return;
            }
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

    _createPropertyToggle(node, path, property) {
        const toggle = document.createElement('span');
        toggle.className = 'treeview-property-toggle';
        toggle.dataset.property = property;
        toggle.style.cursor = 'pointer';
        toggle.style.padding = '2px';
        toggle.style.borderRadius = '2px';
        toggle.style.fontSize = '12px';
        
        const value = node.properties[property];
        const icons = TreeView.CONSTANTS.PROPERTY_ICONS[property];
        toggle.textContent = icons ? icons[value] : (value ? '✓' : '✗');
        toggle.title = `${property}: ${value}`;
        
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handlePropertyToggle(node, path, property);
        });
        
        toggle.addEventListener('mouseenter', () => {
            toggle.style.backgroundColor = '#555';
        });
        
        toggle.addEventListener('mouseleave', () => {
            toggle.style.backgroundColor = '';
        });
        
        return toggle;
    }

    _handlePropertyToggle(node, path, property) {
        if (node.properties && property in node.properties) {
            const oldValue = node.properties[property];
            const newValue = !oldValue;
            node.properties[property] = newValue;
            
            // Update the toggle icon
            const nodeElement = this.nodeElements.get(path);
            if (nodeElement) {
                const toggle = nodeElement.querySelector(`[data-property="${property}"]`);
                if (toggle) {
                    const icons = TreeView.CONSTANTS.PROPERTY_ICONS[property];
                    toggle.textContent = icons ? icons[newValue] : (newValue ? '✓' : '✗');
                    toggle.title = `${property}: ${newValue}`;
                }
            }
            
            this.onPropertyToggle(path, property, newValue, oldValue, node);
        }
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
        
        // Update type icon for folders
        if (nodeElement && this.options.showTypeIcons) {
            const typeIcon = nodeElement.querySelector('.treeview-type-icon');
            const nodeType = nodeElement.dataset.nodeType;
            if (typeIcon && nodeType === TreeView.CONSTANTS.NODE_TYPES.FOLDER) {
                const typeIcons = TreeView.CONSTANTS.TYPE_ICONS[nodeType];
                if (typeIcons) {
                    typeIcon.textContent = isExpanded 
                        ? (typeIcons.collapsed || typeIcons.default)
                        : (typeIcons.expanded || typeIcons.default);
                }
            }
        }
        
        // Toggle children visibility
        const childrenContainer = nodeElement.nextElementSibling;
        if (childrenContainer && childrenContainer.classList.contains('treeview-children')) {
            childrenContainer.style.display = isExpanded ? 'none' : 'block';
        }
        
        this.onNodeExpand(path, !isExpanded);
    }

    // Public API methods
    
    /**
     * Update the tree data and re-render
     * @param {Array} data - New tree data
     */
    setData(data) {
        this.options.data = data;
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
