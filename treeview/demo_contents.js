/**
 * Demo Contents
 * Sample data structure for the TreeView demo
 */

let noToggles = {
    add: null,     // Layers usually don't add children
    visible: null,
    enabled: null,
    locked: null,
    active: null
}


/*
// Show all toggles with custom values
toggles: {
    visible: false,   // Override default
    active: 'paused'  // Set specific state
    // other toggles inherited from node type
}
*/






export const demoContents = [
    {
        id: 'project',
        label: 'My Project',
        type: 'folder',
        toggles: noToggles,
        expanded: true,  // Start expanded for demo purposes
        // toggles will inherit from folder type defaults
        children: [
            {
                id: 'src',
                label: 'src',
                type: 'folder',
                expanded: true,  // Start expanded to show contents
                toggles: {
                    locked: false  // Override default
                },
                children: [
                    {
                        id: 'main.js',
                        label: 'main.js',
                        type: 'file',
                        // toggles inherit from file type defaults
                    },
                    {
                        id: 'utils.js',
                        label: 'utils.js',
                        type: 'file',
                        toggles: {
                            visible: false,  // Override default
                            locked: true     // Override default
                        }
                    }
                ]
            },
            {
                id: 'components',
                label: 'components',
                type: 'folder',
                expanded: true,  // Start expanded to show components
                // toggles inherit from folder type defaults
                children: [
                    {
                        id: 'header',
                        label: 'Header Component',
                        type: 'component',
                        toggles: {
                            enabled: false,  // Override default
                            active: 'idle'   // Set specific value
                        }
                    },
                    {
                        id: 'sidebar',
                        label: 'Sidebar Component',
                        type: 'component',
                        toggles: {
                            active: 'running'  // Override default
                        }
                    }
                ]
            },
            {
                id: 'assets',
                label: 'assets',
                type: 'folder',
                // toggles inherit from folder type defaults
                children: [
                    {
                        id: 'logo.png',
                        label: 'logo.png',
                        type: 'file',
                        // toggles inherit from file type defaults
                    },
                    {
                        id: 'styles.css',
                        label: 'styles.css',
                        type: 'file',
                        // toggles inherit from file type defaults
                    }
                ]
            },
            {
                id: 'layers',
                label: 'Visual Layers',
                type: 'folder',
                expanded: false,  // Start collapsed
                // toggles inherit from folder type defaults
                children: [
                    {
                        id: 'background',
                        label: 'Background Layer',
                        type: 'layer',
                        // toggles inherit from layer type defaults
                    },
                    {
                        id: 'ui',
                        label: 'UI Layer',
                        type: 'layer',
                        toggles: {
                            visible: false,    // Override default
                            locked: true,      // Override default
                            active: 'paused'   // Override default
                        }
                    },
                    {
                        id: 'effects',
                        label: 'Effects Layer',
                        type: 'layer',
                        toggles: {
                            enabled: false,      // Override default
                            active: 'stopped'   // Already matches default
                        }
                    }
                ]
            }
        ]
    }
];
