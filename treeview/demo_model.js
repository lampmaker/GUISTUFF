/**
 * Demo Model Configuration
 * Defines the TreeView s    // TreeView configuration
    treeViewConfig: {
        showIcons: true,
        multiSelect: true
    } node types, toggle definitions, and event callbacks
 */

export const demoModel = {
    // Node type definitions with their icons and default toggles
    nodeTypes: {
        folder: {
            expanded: '📁',
            collapsed: '📂',
            default: '📁',
            allowedChildren: ['folder', 'file', 'component', 'layer', 'custom'],
            defaultToggles: {
                add: true,      // Folders can add children
                visible: true,
                enabled: true,
                locked: false
            }
        },
        file: {
            default: '📄',
            allowedChildren: ['component', 'layer', 'custom'],
            defaultToggles: {
                add: false,     // Files typically don't add children
                visible: true,
                enabled: true,
                locked: false
            }
        },
        component: {
            default: '🧩',
            allowedChildren: ['layer', 'custom'],
            defaultToggles: {
                add: true,      // Components can have child elements
                visible: true,
                enabled: true,
                active: 'idle'
            }
        },
        layer: {
            default: '👁️',
            allowedChildren: ['custom'],
            defaultToggles: {
                add: false,     // Layers usually don't add children
                visible: true,
                enabled: true,
                locked: false,
                active: 'stopped'
            }
        },
        custom: {
            default: '•',
            allowedChildren: [], // Custom nodes can have any children
            defaultToggles: {
                add: true,      // Custom nodes are flexible
                visible: true,
                enabled: true
            }
        }
    },

    // Toggle definitions - what toggles are available and how they behave
    toggleDefinitions: {
        add:{            
            label: 'Add Child Node',
            icons:'➕',
            values: [],     //=> callback? how? 
        },
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
    toggleOrder: ['add', 'visible', 'enabled', 'locked', 'active'],

    // TreeView configuration
    treeViewConfig: {
        showIcons: true,
        multiSelect: false
    }
};

/**
 * Event callbacks for the demo
 */
export const demoCallbacks = {
    onSelectionChange: (selectedPaths, node, logEvent) => {
        logEvent(`<span style="color:#4fc3f7;">Selection:</span> ${selectedPaths.join(', ')} | <span style="color:#ffeb3b;">Node:</span> ${node.label}`);
    },

    onNodeExpand: (path, expanded, logEvent) => {
        logEvent(`<span style="color:#4caf50;">Node:</span> ${expanded ? 'expanded' : 'collapsed'} → ${path}`);
    },

    onToggleClick: (path, property, newValue, oldValue, node, logEvent, updateJsonViewer, type) => {
        if (type === 'action') {
            // Handle action toggles
            if (property === 'add') {
                logEvent(`<span style="color:#4caf50;">Action:</span> Add child node requested for '${node.label}' (${path})`);
                // Here you could show a dialog, add a default child, etc.
                // For demo, let's add a simple child node
                if (!node.children) {
                    node.children = [];
                }
                const newChild = {
                    id: `new_${Date.now()}`,
                    label: `New Node ${node.children.length + 1}`,
                    type: 'custom',
                    toggles: {
                        visible: true,
                        enabled: true
                    }
                };
                node.children.push(newChild);
                updateJsonViewer();
                logEvent(`<span style="color:#4caf50;">Added:</span> New child '${newChild.label}' to '${node.label}'`);
            }
        } else {
            // Handle regular toggles
            logEvent(`<span style="color:#ff9800;">Toggle:</span> '${property}' ${oldValue} → ${newValue} for '${node.label}' (${path})`);
            updateJsonViewer();
        }
    }
};
