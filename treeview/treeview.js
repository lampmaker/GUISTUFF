/**
 * Simple Tree View Component
 * 
 * Features:
 * - Hierarchical data display
 * - Expandable/collapsible nodes
 * - Selection support
 * - Custom icons and styling
 * - Event handling for selection and expansion
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
            ...options
        };

        this.selectedNodes = new Set();
        this.expandedNodes = new Set();
        this.nodeElements = new Map();
        this.onSelectionChange = options.onSelectionChange || (() => {});
        this.onNodeExpand = options.onNodeExpand || (() => {});

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
        Object.assign(nodeDiv.style, TreeView.CONSTANTS.STYLES.NODE);
        
        const contentDiv = document.createElement('div');
        Object.assign(contentDiv.style, TreeView.CONSTANTS.STYLES.NODE_CONTENT);
        
        // Icon
        if (this.options.showIcons) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'treeview-icon';
            Object.assign(iconSpan.style, TreeView.CONSTANTS.STYLES.ICON);
            
            let icon;
            if (node.children && node.children.length > 0) {
                icon = this.expandedNodes.has(path) 
                    ? TreeView.CONSTANTS.ICONS.EXPANDED 
                    : TreeView.CONSTANTS.ICONS.COLLAPSED;
            } else {
                icon = TreeView.CONSTANTS.ICONS.LEAF;
            }
            iconSpan.textContent = icon;
            contentDiv.appendChild(iconSpan);
        }
        
        // Label
        const labelSpan = document.createElement('span');
        labelSpan.className = 'treeview-label';
        labelSpan.textContent = node.label || node.name || 'Unnamed';
        contentDiv.appendChild(labelSpan);
        
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
        
        // Update icon
        const nodeElement = this.nodeElements.get(path);
        if (nodeElement && this.options.showIcons) {
            const icon = nodeElement.querySelector('.treeview-icon');
            if (icon) {
                icon.textContent = isExpanded 
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
