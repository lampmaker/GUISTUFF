/**
 * Demo Model Configuration
 * Defines the TreeView node types, toggle definitions, and event callbacks
 */

import { icons } from './icons.js';

export const demoModel = {
    // Node type definitions with their icons and default toggles
    nodeTypes: {
        folder: {
            expanded: icons.folderOpen,
            collapsed: icons.folder,
            default: icons.folder,
            allowedChildren: ['folder', 'file', 'component', 'layer', 'custom'],
            defaultToggles: {
                add: true,      // Folders can add children
                visible: true,
                enabled: true,
                locked: false
            }
        },
        file: {
            default: icons.document,
            allowedChildren: ['component', 'layer', 'custom'],
            defaultToggles: {
                add: false,     // Files typically don't add children
                visible: true,
                enabled: true,
                locked: false
            }
        },
        component: {
            default: icons.component,
            allowedChildren: ['layer', 'custom'],
            defaultToggles: {
                add: true,      // Components can have child elements
                visible: true,
                enabled: true,
                active: 'idle'
            }
        },
        layer: {
            default: icons.layer,
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
            allowedChildren: ['folder', 'file', 'component', 'layer', 'custom'], // Custom nodes can have any children
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
            icons: icons.plus,
            values: [],     // Action toggle
            styles: {
                default: { color: '#4caf50' }  // Green color for add button
            }
        },
        visible: {
            label: 'Visibility',
            icons: { true: icons.eye, false: icons.eyeSlash },
            values: [true, false],
            styles: {
                true: { color: '#2196f3' },   // Blue for visible
                false: { color: '#757575' }   // Gray for hidden
            }
        },
        enabled: {
            label: 'Enabled',
            icons: { true: icons.check, false: icons.xMark },
            values: [true, false],
            styles: {
                true: { color: '#4caf50' },   // Green for enabled
                false: { color: '#f44336' }   // Red for disabled
            }
        },
        locked: {
            label: 'Locked',
            icons: { true: icons.lock, false: icons.lockOpen },
            values: [true, false],
            styles: {
                true: { color: '#ff9800' },   // Orange for locked
                false: { color: '#9e9e9e' }   // Gray for unlocked
            }
        },
        active: {
            label: 'Status',
            icons: { 
                'running': icons.play, 
                'paused': icons.pause, 
                'stopped': icons.stop,
                'idle': icons.pause
            },
            values: ['running', 'paused', 'stopped', 'idle'],
            styles: {
                'running': { color: '#4caf50' },  // Green for running
                'paused': { color: '#ff9800' },   // Orange for paused
                'stopped': { color: '#f44336' },  // Red for stopped
                'idle': { color: '#607d8b' }      // Blue-gray for idle
            }
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

    onToggleClick: (path, property, newValue, oldValue, node, type, logEvent, updateJsonViewer) => {
        if (type === 'add_child') {
            logEvent(`<span style="color:#4caf50;">Added:</span> New child '${node.label}' (type: ${node.type})`);
            updateJsonViewer();
        } else if (type === 'action') {
            logEvent(`<span style="color:#4caf50;">Action:</span> ${property} triggered`);
        } else {
            logEvent(`<span style="color:#ff9800;">Toggle:</span> '${property}' ${oldValue} → ${newValue} for '${node.label}' (${path})`);
            updateJsonViewer();
        }
    }
};
