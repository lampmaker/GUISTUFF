/**
 * Demo Model Configuration
 * Defines the TreeView setup, node types, toggle definitions, and rendering behavior
 */

export const demoModel = {
    // Node type definitions with their icons
    nodeTypes: {
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

    // Toggle definitions - what toggles are available and how they behave
    toggleDefinitions: {
        visible: {
            label: 'Visibility',
            icons: { true: '👁️', false: '🙈' },
            values: [true, false]
        },
        enabled: {
            label: 'Enabled',
            icons: { true: '✅', false: '❌' },
            values: [true, false]
        },
        locked: {
            label: 'Locked',
            icons: { true: '🔒', false: '🔓' },
            values: [true, false]
        },
        active: {
            label: 'Status',
            icons: { 
                'running': '▶️', 
                'paused': '⏸️', 
                'stopped': '⏹️',
                'idle': '⏯️'
            },
            values: ['running', 'paused', 'stopped', 'idle']
        }
    },

    // Order of toggle columns for consistent alignment
    toggleOrder: ['visible', 'enabled', 'locked', 'active'],

    // TreeView configuration
    treeViewConfig: {
        showIcons: true,
        multiSelect: true
    }
};

/**
 * Custom node renderer for the demo
 * This handles the application-specific rendering logic
 */
export function createDemoNodeRenderer(model) {
    return function(node, path, state) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.width = '100%';

        // Expansion icon
        if (state.hasChildren) {
            const expandIcon = document.createElement('span');
            expandIcon.className = 'treeview-expand-icon';
            expandIcon.style.marginRight = '4px';
            expandIcon.style.minWidth = '12px';
            expandIcon.style.textAlign = 'center';
            expandIcon.textContent = state.isExpanded ? '▼' : '▶';
            container.appendChild(expandIcon);
        }

        // Type icon
        const typeIcon = document.createElement('span');
        typeIcon.className = 'treeview-type-icon';
        typeIcon.style.marginRight = '4px';
        typeIcon.style.minWidth = '12px';
        typeIcon.style.textAlign = 'center';
        
        const nodeType = node.type || 'custom';
        const typeIcons = model.nodeTypes[nodeType];
        let icon = node.icon || typeIcons?.default || '•';
        
        // Use expanded/collapsed icons for folders
        if (nodeType === 'folder' && state.hasChildren) {
            icon = state.isExpanded ? (typeIcons?.expanded || icon) : (typeIcons?.collapsed || icon);
        }
        
        typeIcon.textContent = icon;
        container.appendChild(typeIcon);

        // Label
        const label = document.createElement('span');
        label.className = 'treeview-label';
        label.textContent = node.label || node.name || `Node ${path}`;
        container.appendChild(label);

        // Property toggles with column alignment
        if (model.toggleOrder?.length > 0) {
            const togglesContainer = document.createElement('span');
            togglesContainer.className = 'treeview-toggles';
            togglesContainer.style.marginLeft = 'auto';
            togglesContainer.style.display = 'flex';
            togglesContainer.style.alignItems = 'center';
            
            // Create toggles in the specified order for consistent column alignment
            model.toggleOrder.forEach(toggleKey => {
                const toggleColumn = document.createElement('span');
                toggleColumn.style.width = '20px';
                toggleColumn.style.textAlign = 'center';
                toggleColumn.style.display = 'inline-block';
                
                // Check if this node uses this toggle
                if (node.toggles && toggleKey in node.toggles) {
                    const toggle = createPropertyToggle(node, path, toggleKey, model);
                    toggleColumn.appendChild(toggle);
                }
                // If node doesn't use this toggle, leave the column empty for alignment
                
                togglesContainer.appendChild(toggleColumn);
            });
            
            container.appendChild(togglesContainer);
        }

        return container;
    };
}

/**
 * Creates a property toggle element
 */
function createPropertyToggle(node, path, toggleKey, model) {
    const toggle = document.createElement('span');
    toggle.className = 'treeview-property-toggle';
    toggle.dataset.property = toggleKey;
    toggle.style.cursor = 'pointer';
    toggle.style.padding = '2px';
    toggle.style.borderRadius = '2px';
    toggle.style.fontSize = '12px';
    toggle.style.display = 'inline-block';
    toggle.style.width = '16px';
    toggle.style.textAlign = 'center';
    
    const value = node.toggles[toggleKey];
    const toggleDef = model.toggleDefinitions[toggleKey];
    
    if (toggleDef && toggleDef.icons) {
        toggle.textContent = toggleDef.icons[value] || '?';
        toggle.title = `${toggleDef.label || toggleKey}: ${value}`;
    } else {
        toggle.textContent = value ? '✓' : '✗';
        toggle.title = `${toggleKey}: ${value}`;
    }
    
    toggle.addEventListener('mouseenter', () => {
        toggle.style.backgroundColor = '#555';
    });
    
    toggle.addEventListener('mouseleave', () => {
        toggle.style.backgroundColor = '';
    });
    
    return toggle;
}

/**
 * Handle property toggle logic
 */
export function handlePropertyToggle(node, path, toggleKey, model, onPropertyToggle, nodeElements) {
    if (node.toggles && toggleKey in node.toggles) {
        const toggleDef = model.toggleDefinitions[toggleKey];
        const oldValue = node.toggles[toggleKey];
        let newValue;
        
        if (toggleDef && toggleDef.values) {
            // Cycle through defined values
            const currentIndex = toggleDef.values.indexOf(oldValue);
            const nextIndex = (currentIndex + 1) % toggleDef.values.length;
            newValue = toggleDef.values[nextIndex];
        } else {
            // Default boolean toggle
            newValue = !oldValue;
        }
        
        node.toggles[toggleKey] = newValue;
        
        // Update the toggle icon
        const nodeElement = nodeElements.get(path);
        if (nodeElement) {
            const toggle = nodeElement.querySelector(`[data-property="${toggleKey}"]`);
            if (toggle) {
                if (toggleDef && toggleDef.icons) {
                    toggle.textContent = toggleDef.icons[newValue] || '?';
                    toggle.title = `${toggleDef.label || toggleKey}: ${newValue}`;
                } else {
                    toggle.textContent = newValue ? '✓' : '✗';
                    toggle.title = `${toggleKey}: ${newValue}`;
                }
            }
        }
        
        onPropertyToggle(path, toggleKey, newValue, oldValue, node);
    }
}
