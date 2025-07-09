/**
 * Demo Model Configuration
 * Defines the TreeView setup, node types, toggle definitions, and event callbacks
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
 * Event callbacks for the demo
 */
export const demoCallbacks = {
    onSelectionChange: (selectedPaths, node, logEvent) => {
        logEvent(`<span style="color:#4fc3f7;">Selection:</span> ${selectedPaths.join(', ')} | <span style="color:#ffeb3b;">Node:</span> ${node.label}`);
    },

    onNodeExpand: (path, expanded, logEvent) => {
        logEvent(`<span style="color:#4caf50;">Node:</span> ${expanded ? 'expanded' : 'collapsed'} → ${path}`);
    },

    onToggleClick: (path, property, newValue, oldValue, node, logEvent, updateJsonViewer) => {
        logEvent(`<span style="color:#ff9800;">Toggle:</span> '${property}' ${oldValue} → ${newValue} for '${node.label}' (${path})`);
        updateJsonViewer();
    }
};
