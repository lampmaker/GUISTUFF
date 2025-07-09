// Copyright (c) 2024 Matthijs Keuper
// SPDX-License-Identifier: MIT
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

import { ICONS, STYLES } from './constants.js';
import { getNodeByPath, debugNodes, moveNode, validateDragDropOperation, canNodeAcceptChild } from './helpers.js';

export class TreeView {

    static CONSTANTS = { ICONS, STYLES };

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
            enableDragDrop: options.enableDragDrop !== false, // Enable by default
            ...options
        };

        this.selectedNodes = new Set();
        this.nodeElements = new Map();
        this.onSelectionChange = options.onSelectionChange || (() => {});
        this.onNodeExpand = options.onNodeExpand || (() => {});
        this.onToggleClick = options.onToggleClick || (() => {});
        this.onNodeDrop = options.onNodeDrop || (() => {}); // New callback for drag/drop events

        // Drag and drop state
        this.draggedNode = null;
        this.draggedPath = null;
        this.dropIndicator = null;
        this.currentDropTarget = null;
        this.dropPosition = 'inside';
        this.lastIndicatorElement = null;

        this._createContainer();
        this._render();
    }

    _createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'treeview-container';
        Object.assign(this.container.style, TreeView.CONSTANTS.STYLES.CONTAINER);
        
        // Create and style the drop indicator
        this._createDropIndicator();
        
        this.options.container.appendChild(this.container);
    }

    /**
     * Create the visual drop indicator
     * @private
     */
    _createDropIndicator() {
        this.dropIndicator = document.createElement('div');
        this.dropIndicator.className = 'treeview-drop-indicator';
        Object.assign(this.dropIndicator.style, TreeView.CONSTANTS.STYLES.DROP_INDICATOR);
        document.body.appendChild(this.dropIndicator);
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
                
                // Simple: just check the node's expanded property directly
                const isExpanded = node.expanded === true;
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
        
        // Apply node type styling
        const nodeType = node.type || 'custom';
        const nodeTypeDefinition = this.options.nodeTypes[nodeType];
        if (nodeTypeDefinition?.style) {
            Object.assign(nodeDiv.style, nodeTypeDefinition.style);
        }
        
        const contentDiv = document.createElement('div');
        Object.assign(contentDiv.style, TreeView.CONSTANTS.STYLES.NODE_CONTENT);
        
        // Apply node type content styling
        if (nodeTypeDefinition?.contentStyle) {
            Object.assign(contentDiv.style, nodeTypeDefinition.contentStyle);
        }
        
        // Use custom renderer if provided, otherwise use default
        if (this.options.nodeRenderer) {
            const customContent = this.options.nodeRenderer(node, path, {
                isExpanded: node.expanded || false,
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
                isExpanded: node.expanded || false,
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
        
        // Add drag and drop event listeners if enabled
        if (this.options.enableDragDrop) {
            nodeDiv.setAttribute('draggable', 'true');
            nodeDiv.title = `Drag to reorder. Can be dropped into: ${this._getAllowedParentTypes(node).join(', ') || 'none'}`;
            
            nodeDiv.addEventListener('dragstart', (e) => {
                this._handleDragStart(e, node, path, nodeDiv);
            });
            
            nodeDiv.addEventListener('dragover', (e) => {
                this._handleDragOver(e, node, path, nodeDiv);
            });
            
            nodeDiv.addEventListener('dragenter', (e) => {
                this._handleDragEnter(e, node, path, nodeDiv);
            });
            
            nodeDiv.addEventListener('dragleave', (e) => {
                this._handleDragLeave(e, node, path, nodeDiv);
            });
            
            nodeDiv.addEventListener('drop', (e) => {
                this._handleDrop(e, node, path, nodeDiv);
            });
            
            nodeDiv.addEventListener('dragend', (e) => {
                this._handleDragEnd(e);
            });
        }
        
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
        const node = getNodeByPath(this.options.data, path);
        if (!node) {
            return;
        }
        
        // Simple: just flip the expanded property on the node itself
        // Handle undefined as false
        const currentExpanded = node.expanded === true;
        node.expanded = !currentExpanded;
        
        // Update the UI
        this._render();
        
        this.onNodeExpand(path, node.expanded);
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
        toggle.style.display = 'inline-flex';
        toggle.style.alignItems = 'center';
        toggle.style.justifyContent = 'center';
        toggle.style.width = '16px';
        toggle.style.height = '16px';
        
        // Apply custom styles from toggle definition
        if (toggleDefinition?.style) {
            Object.assign(toggle.style, toggleDefinition.style);
        }
        
        // Set the icon content
        if (typeof iconData === 'string' && iconData.trim().startsWith('<svg')) {
            toggle.innerHTML = iconData;
            const svg = toggle.querySelector('svg');
            if (svg) {
                svg.style.width = '12px';
                svg.style.height = '12px';
                svg.style.display = 'block';
                
                // Apply value-specific styles for SVG
                if (toggleDefinition?.styles && !isActionToggle) {
                    const valueStyles = toggleDefinition.styles[value];
                    if (valueStyles) {
                        Object.assign(svg.style, valueStyles);
                    }
                } else if (toggleDefinition?.styles && isActionToggle) {
                    const actionStyles = toggleDefinition.styles.default || toggleDefinition.styles;
                    if (actionStyles && typeof actionStyles === 'object') {
                        Object.assign(svg.style, actionStyles);
                    }
                }
            }
        } else {
            toggle.textContent = iconData;
            // Apply value-specific styles for text icons
            if (toggleDefinition?.styles && !isActionToggle) {
                const valueStyles = toggleDefinition.styles[value];
                if (valueStyles) {
                    Object.assign(toggle.style, valueStyles);
                }
            }
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
            // Handle built-in actions like 'add'
            if (toggleKey === 'add') {
                this._handleAddChildNode(node, path);
            } else {
                // Custom action toggle - call the callback
                if (onToggleClick) {
                    onToggleClick(path, toggleKey, null, null, node, 'action');
                }
            }
            return;
        }
        
        // Regular toggle handling
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
                        const iconData = toggleDefinition.icons[newValue] || '?';
                        // Handle SVG icons properly
                        if (typeof iconData === 'string' && iconData.trim().startsWith('<svg')) {
                            toggle.innerHTML = iconData;
                            const svg = toggle.querySelector('svg');
                            if (svg) {
                                if (toggleDefinition.styles && toggleDefinition.styles[newValue]) {
                                    Object.assign(svg.style, toggleDefinition.styles[newValue]);
                                }
                            }
                        } else {
                            toggle.textContent = iconData;
                            // Apply value-specific styles for text icons
                            if (toggleDefinition.styles && toggleDefinition.styles[newValue]) {
                                Object.assign(toggle.style, toggleDefinition.styles[newValue]);
                            }
                        }
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
     * Handle adding child nodes
     * @private
     */
    _handleAddChildNode(node, path) {
        const nodeType = node.type || 'custom';
        // Check if node has its own allowedChildren override, otherwise use node type default
        const allowedChildren = node.allowedChildren || this.options.nodeTypes[nodeType]?.allowedChildren || [];
        
        if (allowedChildren.length === 0) {
            console.warn(`No allowed child types for node '${node.label}' (type: ${nodeType})`);
            return;
        }
        
        if (allowedChildren.length === 1) {
            this._addChildNode(node, allowedChildren[0]);
        } else {
            this._showChildTypeMenu(node, allowedChildren, path);
        }
    }

    /**
     * Add a child node of the specified type
     * @private
     */
    _addChildNode(node, childType) {
        if (!node.children) {
            node.children = [];
        }
        
        const defaultToggles = this.options.nodeTypes[childType]?.defaultToggles || {};
        const newChild = {
            id: `new_${Date.now()}`,
            label: `New ${childType} ${node.children.length + 1}`,
            type: childType,
            toggles: { ...defaultToggles }
        };
        
        node.children.push(newChild);
        node.expanded = true; // Expand parent to show new child
        this._render();
        
        // Notify via callback
        if (this.onToggleClick) {
            this.onToggleClick(null, 'add', null, null, newChild, 'add_child');
        }
    }

    /**
     * Show context menu for child type selection
     * @private
     */
    _showChildTypeMenu(node, allowedChildren, path) {
        // Remove any existing menu
        this._removeChildTypeMenu();
        
        const menu = document.createElement('div');
        menu.className = 'treeview-child-type-menu';
        menu.style.cssText = `
            position: absolute;
            background: #2d2d2d;
            color: #e0e0e0;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 4px;
            z-index: 1000;
            font-family: monospace;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        allowedChildren.forEach(childType => {
            const item = document.createElement('div');
            item.textContent = `Add ${childType}`;
            item.style.cssText = `
                padding: 4px 8px;
                cursor: pointer;
                border-radius: 2px;
            `;
            item.onmouseenter = () => item.style.backgroundColor = '#404040';
            item.onmouseleave = () => item.style.backgroundColor = '';
            item.onclick = () => {
                this._addChildNode(node, childType);
                this._removeChildTypeMenu();
            };
            menu.appendChild(item);
        });
        
        document.body.appendChild(menu);
        this._currentMenu = menu;
        
        // Position menu near the add button
        const nodeElement = this.nodeElements.get(path);
        if (nodeElement) {
            const addButton = nodeElement.querySelector('[data-property="add"]');
            if (addButton) {
                const rect = addButton.getBoundingClientRect();
                menu.style.left = `${rect.left}px`;
                menu.style.top = `${rect.bottom + 2}px`;
            }
        }
        
        // Close menu on outside click
        setTimeout(() => {
            document.addEventListener('click', this._closeMenuHandler = () => this._removeChildTypeMenu(), { once: true });
        }, 0);
    }

    /**
     * Remove child type menu
     * @private
     */
    _removeChildTypeMenu() {
        if (this._currentMenu && this._currentMenu.parentNode) {
            this._currentMenu.parentNode.removeChild(this._currentMenu);
        }
        this._currentMenu = null;
        if (this._closeMenuHandler) {
            document.removeEventListener('click', this._closeMenuHandler);
            this._closeMenuHandler = null;
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
            expandIcon.style.display = 'inline-flex';
            expandIcon.style.alignItems = 'center';
            expandIcon.style.justifyContent = 'center';
            
            const iconSvg = state.isExpanded ? TreeView.CONSTANTS.ICONS.EXPANDED : TreeView.CONSTANTS.ICONS.COLLAPSED;
            if (iconSvg.includes('<svg')) {
                expandIcon.innerHTML = iconSvg;
                const svg = expandIcon.querySelector('svg');
                if (svg) {
                    svg.style.width = '12px';
                    svg.style.height = '12px';
                    svg.style.display = 'block';
                }
            } else {
                expandIcon.textContent = iconSvg;
            }
            container.appendChild(expandIcon);
        }

        // Type icon (only if showIcons is enabled and we have node types defined)
        if (this.options.showIcons && this.options.nodeTypes) {
            const typeIcon = document.createElement('span');
            typeIcon.className = 'treeview-type-icon';
            typeIcon.style.marginRight = '4px';
            typeIcon.style.minWidth = '12px';
            typeIcon.style.textAlign = 'center';
            typeIcon.style.display = 'inline-flex';
            typeIcon.style.alignItems = 'center';
            typeIcon.style.justifyContent = 'center';
            
            const nodeType = node.type || 'custom';
            const typeIcons = this.options.nodeTypes[nodeType];
            let icon = node.icon || typeIcons?.default || '•';
            
            // Use expanded/collapsed icons for folders
            if (nodeType === 'folder' && state.hasChildren) {
                icon = state.isExpanded ? (typeIcons?.expanded || icon) : (typeIcons?.collapsed || icon);
            }
            
            // Apply icon-specific styling from node type definition
            if (typeIcons?.iconStyle) {
                Object.assign(typeIcon.style, typeIcons.iconStyle);
            }
            
            if (typeof icon === 'string' && icon.includes('<svg')) {
                typeIcon.innerHTML = icon;
                const svg = typeIcon.querySelector('svg');
                if (svg) {
                    svg.style.width = '12px';
                    svg.style.height = '12px';
                    svg.style.display = 'block';
                    
                    // Apply SVG-specific styling from node type definition
                    if (typeIcons?.svgStyle) {
                        Object.assign(svg.style, typeIcons.svgStyle);
                    }
                }
            } else {
                typeIcon.textContent = icon;
            }
            container.appendChild(typeIcon);
        }

        // Label
        const label = document.createElement('span');
        label.className = 'treeview-label';
        label.textContent = node.label || node.name || `Node ${path}`;
        
        // Apply label-specific styling from node type definition
        const nodeType = node.type || 'custom';
        const typeDefinition = this.options.nodeTypes[nodeType];
        if (typeDefinition?.labelStyle) {
            Object.assign(label.style, typeDefinition.labelStyle);
        }
        
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
        const node = getNodeByPath(this.options.data, path);
        if (node && node.expanded !== expanded) {
            node.expanded = expanded;
            this._render();
            this.onNodeExpand(path, expanded);
        }
    }

    /**
     * Get the expansion state of a node
     * @param {string} path - The path to the node
     * @returns {boolean} True if the node is expanded, false otherwise
     */
    isNodeExpanded(path) {
        const node = getNodeByPath(this.options.data, path);
        return node ? (node.expanded || false) : false;
    }

    /**
     * Get the current data (which already contains expansion state)
     * @returns {Array} The current data structure with expansion state
     */
    getData() {
        return this.options.data;
    }


    /**
     * Destroy the tree view and clean up
     */
    destroy() {
        this._removeChildTypeMenu();
        if (this.dropIndicator && this.dropIndicator.parentNode) {
            this.dropIndicator.parentNode.removeChild(this.dropIndicator);
        }
        this.container.remove();
        this.nodeElements.clear();
        this.selectedNodes.clear();
    }

    /**
     * Debug method to print all node paths
     */
    debugPaths() {
        console.log('=== TreeView Debug Paths ===');
        debugNodes(this.options.data);
    }

    // Drag and drop handling

    /**
     * Handle drag start event
     * @private
     */
    _handleDragStart(event, node, path, nodeElement) {
        this.draggedNode = node;
        this.draggedPath = path;
        
        // Set drag data
        event.dataTransfer.setData('text/plain', path);
        event.dataTransfer.effectAllowed = 'move';
        
        // Add visual feedback to dragged element
        nodeElement.style.opacity = '0.5';
        
        // Notify callback
        if (this.onNodeDrop) {
            this.onNodeDrop(path, null, 'dragstart', node);
        }
    }

    /**
     * Handle drag over event - determines if drop is allowed
     * @private
     */
    _handleDragOver(event, node, path, nodeElement) {
        if (!event || typeof event.preventDefault !== 'function') return;
        if (!this.draggedNode || this.draggedPath === path) {
            return;
        }
        
        // Check if this node can accept the dragged node
        const canDrop = canNodeAcceptChild(
            node,
            this.draggedNode,
            this.options.nodeTypes,
            this.draggedPath,
            path
        );
        
        if (canDrop) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            
            // Show drop indicator
            this._showDropIndicator(nodeElement, event);
        }
    }

    /**
     * Handle drag enter event
     * @private
     */
    _handleDragEnter(event, node, path, nodeElement) {
        if (!this.draggedNode || this.draggedPath === path) {
            return;
        }
        
        this.currentDropTarget = { node, path, element: nodeElement };
        const canDrop = canNodeAcceptChild(
            node,
            this.draggedNode,
            this.options.nodeTypes,
            this.draggedPath,
            path
        );
        
        if (canDrop) {
            nodeElement.classList.add('drag-over-valid');
            nodeElement.style.backgroundColor = '#007acc33'; // Light blue background
            nodeElement.style.border = '1px solid #007acc';
        } else {
            nodeElement.classList.add('drag-over-invalid');
            // Visual feedback for invalid drop
            nodeElement.style.backgroundColor = '#ff444433'; // Light red background
            nodeElement.style.border = '1px solid #ff4444';
        }
        
        // Show tooltip indicating drop zone details
        this._showDropTooltip(nodeElement, node, canDrop);
    }

    /**
     * Handle drag leave event
     * @private
     */
    _handleDragLeave(event, node, path, nodeElement) {
        if (!nodeElement || typeof nodeElement.contains !== 'function') return;
        if (!event || !event.relatedTarget || !nodeElement.contains(event.relatedTarget)) {
            this._clearDropStyling(nodeElement);
            this._hideDropIndicator();
            this._hideDropTooltip();
            if (this.currentDropTarget && this.currentDropTarget.path === path) {
                this.currentDropTarget = null;
            }
        }
    }

    /**
     * Handle drop event
     * @private
     */
    _handleDrop(event, targetNode, targetPath, nodeElement) {
        if (!event || typeof event.preventDefault !== 'function') return;
        event.preventDefault();
        
        if (!this.draggedNode || this.draggedPath === targetPath) {
            return;
        }
        
        // Validate the drop operation
        const validation = validateDragDropOperation(
            this.options.data,
            this.draggedPath,
            targetPath,
            this.options.nodeTypes,
            this.dropPosition
        );
        
        if (validation.valid) {
            // Perform the move operation
            moveNode(this.options.data, this.draggedPath, targetPath, this.dropPosition);
            this._render();
            
            // Notify callback
            if (this.onNodeDrop) {
                this.onNodeDrop(this.draggedPath, targetPath, 'drop', this.draggedNode, targetNode);
            }
        } else {
            // Log validation error
            console.warn('Drop operation failed:', validation.reason);
            
            // Notify callback of failed drop
            if (this.onNodeDrop) {
                this.onNodeDrop(this.draggedPath, targetPath, 'drop_failed', this.draggedNode, targetNode, validation.reason);
            }
        }
        
        this._clearDropStyling(nodeElement);
        this._hideDropIndicator();
        this._hideDropTooltip();
    }

    /**
     * Handle drag end event
     * @private
     */
    _handleDragEnd(event) {
        // Restore original opacity
        if (this.draggedPath) {
            const draggedElement = this.nodeElements.get(this.draggedPath);
            if (draggedElement) {
                draggedElement.style.opacity = '';
            }
        }
        
        // Clear all drop styling
        this.nodeElements.forEach(element => {
            this._clearDropStyling(element);
        });

        this._hideDropIndicator();
        this._hideDropTooltip();
        this.draggedNode = null;
        this.draggedPath = null;
        this.currentDropTarget = null;
        
        // Notify callback
        if (this.onNodeDrop) {
            this.onNodeDrop(null, null, 'dragend');
        }
    }

    /**
     * Get all node types that can accept this node as a child
     * @private
     */
    _getAllowedParentTypes(node) {
        const nodeType = node.type || 'custom';
        const allowedParents = [];
        
        // Check all defined node types to see which ones accept this node type
        Object.entries(this.options.nodeTypes).forEach(([parentType, parentDefinition]) => {
            const allowedChildren = parentDefinition.allowedChildren || [];
            if (allowedChildren.includes(nodeType)) {
                allowedParents.push(parentType);
            }
        });
        
        return allowedParents;
    }

    /**
     * Show the drop indicator at the appropriate position
     * @private
     */
    _showDropIndicator(nodeElement, event) {
        const rect = nodeElement.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        // Position the indicator
        this.dropIndicator.style.left = `${rect.left}px`;
        this.dropIndicator.style.width = `${rect.width}px`;
        
        // Determine if we should show above or below the node
        const mouseY = event.clientY;
        const nodeMiddle = rect.top + rect.height / 2;
        
        this._clearIndicatorSpacing();
        if (mouseY < nodeMiddle) {
            // Show above
            this.dropIndicator.style.top = `${rect.top - 1}px`;
            nodeElement.style.marginTop = '8px';
            this.dropPosition = 'before';
        } else {
            // Show below
            this.dropIndicator.style.top = `${rect.bottom + 1}px`;
            nodeElement.style.marginBottom = '8px';
            this.dropPosition = 'after';
        }
        this.lastIndicatorElement = nodeElement;
        
        this.dropIndicator.style.opacity = '1';
    }

    /**
     * Hide the drop indicator
     * @private
     */
    _hideDropIndicator() {
        this.dropIndicator.style.opacity = '0';
        this._clearIndicatorSpacing();
        this.dropPosition = 'inside';
    }

    /**
     * Clear drop-related styling from a node element
     * @private
     */
    _clearDropStyling(nodeElement) {
        nodeElement.classList.remove('drag-over-valid', 'drag-over-invalid');
        nodeElement.style.border = '';
        if (!this.selectedNodes.has(nodeElement.dataset.path)) {
            nodeElement.style.backgroundColor = '';
        }
        if (nodeElement === this.lastIndicatorElement) {
            this._clearIndicatorSpacing();
        }
    }

    _clearIndicatorSpacing() {
        if (this.lastIndicatorElement) {
            this.lastIndicatorElement.style.marginTop = '';
            this.lastIndicatorElement.style.marginBottom = '';
            this.lastIndicatorElement = null;
        }
    }


    /**
     * Show tooltip indicating what types can be dropped on this node
     * @private
     */
    _showDropTooltip(nodeElement, node, isValid) {
        // Remove any existing tooltip
        this._hideDropTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'treeview-drop-tooltip';
        
        const nodeType = node.type || 'custom';
        const allowedChildren = node.allowedChildren || 
            this.options.nodeTypes[nodeType]?.allowedChildren || [];
        
        if (isValid) {
            tooltip.innerHTML = `
                <div style="color: #4caf50; font-weight: bold;">✓ Valid Drop Zone</div>
                <div style="font-size: 11px; margin-top: 2px;">
                    ${node.label} (${nodeType}) accepts: ${allowedChildren.join(', ')}
                </div>
            `;
            tooltip.style.backgroundColor = '#1a4a1a';
            tooltip.style.borderColor = '#4caf50';
        } else {
            const draggedType = this.draggedNode?.type || 'custom';
            tooltip.innerHTML = `
                <div style="color: #f44336; font-weight: bold;">✗ Invalid Drop Zone</div>
                <div style="font-size: 11px; margin-top: 2px;">
                    ${node.label} (${nodeType}) cannot accept ${draggedType}
                </div>
                <div style="font-size: 10px; margin-top: 2px; color: #999;">
                    Accepts: ${allowedChildren.length > 0 ? allowedChildren.join(', ') : 'no children'}
                </div>
            `;
            tooltip.style.backgroundColor = '#4a1a1a';
            tooltip.style.borderColor = '#f44336';
        }
        
        tooltip.style.cssText += `
            position: absolute;
            background: #2d2d2d;
            color: #e0e0e0;
            border: 1px solid;
            border-radius: 4px;
            padding: 6px 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 2000;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            max-width: 200px;
        `;
        
        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;
        
        // Position tooltip near the node
        const rect = nodeElement.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;
        
        // Adjust position if tooltip goes off screen
        setTimeout(() => {
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipRect.right > window.innerWidth) {
                tooltip.style.left = `${rect.left - tooltipRect.width - 10}px`;
            }
            if (tooltipRect.bottom > window.innerHeight) {
                tooltip.style.top = `${rect.bottom - tooltipRect.height}px`;
            }
        }, 0);
    }

    /**
     * Hide drop tooltip
     * @private
     */
    _hideDropTooltip() {
        if (this.currentTooltip && this.currentTooltip.parentNode) {
            this.currentTooltip.parentNode.removeChild(this.currentTooltip);
        }
        this.currentTooltip = null;
    }
}
