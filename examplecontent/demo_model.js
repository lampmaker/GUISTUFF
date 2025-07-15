// Copyright (c) 2024 Matthijs Keuper
// SPDX-License-Identifier: MIT
/**
 * Demo Model Configuration
 * Defines the TreeView node types, toggle definitions, and event callbacks
 */

import { icons } from '../treeview/icons.js';

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
            },
            style: {
            //    backgroundColor: 'rgba(255, 193, 7, 0.1)',  // Light amber background
            //    borderLeft: '3px solid #ffc107'              // Amber left border
            },
            contentStyle: {
                //fontWeight: '600'                            // Bold text for folders
            },
            svgStyle: {
                color: '#ff8f00'                             // Orange folder icons
            },
            labelStyle: {
                color: '#fff'                             // Dark orange folder labels
            }
        },
        file: {
            default: icons.document,
            allowedChildren: [],
            defaultToggles: {
                add: false,     // Files typically don't add children
                visible: true,
                enabled: true,
                locked: false
            },
            style: {
          //      backgroundColor: 'rgba(33, 150, 243, 0.05)'  // Light blue background
            },
            svgStyle: {
                color: '#1976d2'                             // Blue file icons
            },
            labelStyle: {
                color: '#aaa',                            // Dark blue file labels
                fontStyle: 'italic'
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
            },
            style: {
                //backgroundColor: 'rgba(156, 39, 176, 0.08)', // Light purple background
                //borderRadius: '4px'
            },
            svgStyle: {
                color: '#7b1fa2'                             // Purple component icons
            },
            labelStyle: {
            //    color: '#4a148c',                            // Dark purple component labels
                fontWeight: '500'
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
            },
            style: {
                backgroundColor: 'rgba(76, 175, 80, 0.06)',  // Light green background
      //          borderBottom: '1px solid #4caf50'
            },
            svgStyle: {
                color: '#2e7d32'                             // Green layer icons
            },
            labelStyle: {
           //     color: '#1b5e20',                            // Dark green layer labels
                fontSize: '13px'
            }
        },
        custom: {
            default: '•',
            allowedChildren: ['folder', 'file', 'component', 'layer', 'custom'], // Custom nodes can have any children
            defaultToggles: {
                add: true,      // Custom nodes are flexible
                visible: true,
                enabled: true
            },
            style: {
                backgroundColor: 'rgba(158, 158, 158, 0.05)' // Light gray background
            },
            labelStyle: {
                color: '#616161',                            // Gray custom labels
                fontSize: '12px'
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
                default: { color: '#FFF', "background-color":"#444"}  // Green color for add button
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

    onNodeAdd: (node, newChild, action, childType, logEvent, updateJsonViewer) => {
        logEvent(`<span style="color:#4caf50;">Node Added:</span> '${newChild.label}' (${childType}) to '${node.label}'`);
        updateJsonViewer();
    },
        // Notify via callbac

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
    },

    onNodeDrop: (sourcePath, targetPath, action, sourceNode, targetNode, errorReason, logEvent, updateJsonViewer) => {
        switch (action) {
            case 'dragstart':
                logEvent(`<span style="color:#ff9800;">Drag Start:</span> Moving '${sourceNode.label}' (${sourceNode.type})`);
                break;
            case 'drop':
                if (targetNode) {
                    logEvent(`<span style="color:#4caf50;">Drop:</span> Moved '${sourceNode.label}' to '${targetNode.label}' | <span style="color:#81c784;">Valid drop zone</span>`);
                    updateJsonViewer();
                } else {
                    logEvent(`<span style="color:#f44336;">Drop Failed:</span> Invalid drop target for '${sourceNode.label}'`);
                }
                break;
            case 'drop_failed':
                logEvent(`<span style="color:#f44336;">Drop Failed:</span> ${errorReason || 'Invalid drop operation'}`);
                break;
            case 'dragend':
                logEvent(`<span style="color:#9e9e9e;">Drag End:</span> Drag operation completed`);
                break;
        }
    }
};
