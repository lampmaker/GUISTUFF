/**
 * Demo Contents
 * Sample data structure for the TreeView demo
 */

export const demoContents = [
    {
        id: 'project',
        label: 'My Project',
        type: 'folder',
        toggles: {
            visible: true,
            enabled: true
        },
        children: [
            {
                id: 'src',
                label: 'src',
                type: 'folder',
                toggles: {
                    visible: true,
                    enabled: true,
                    locked: false
                },
                children: [
                    {
                        id: 'main.js',
                        label: 'main.js',
                        type: 'file',
                        toggles: {
                            visible: true,
                            enabled: true,
                            locked: false
                        }
                    },
                    {
                        id: 'utils.js',
                        label: 'utils.js',
                        type: 'file',
                        toggles: {
                            visible: false,
                            locked: true
                        }
                    }
                ]
            },
            {
                id: 'components',
                label: 'components',
                type: 'folder',
                toggles: {
                    visible: true,
                    enabled: true
                },
                children: [
                    {
                        id: 'header',
                        label: 'Header Component',
                        type: 'component',
                        toggles: {
                            visible: true,
                            enabled: false,
                            active: 'idle'
                        }
                    },
                    {
                        id: 'sidebar',
                        label: 'Sidebar Component',
                        type: 'component',
                        toggles: {
                            visible: true,
                            enabled: true,
                            active: 'running'
                        }
                    }
                ]
            },
            {
                id: 'assets',
                label: 'assets',
                type: 'folder',
                toggles: {
                    visible: true,
                    enabled: true
                },
                children: [
                    {
                        id: 'logo.png',
                        label: 'logo.png',
                        type: 'file',
                        toggles: {
                            visible: true,
                            locked: false
                        }
                    },
                    {
                        id: 'styles.css',
                        label: 'styles.css',
                        type: 'file',
                        toggles: {
                            visible: true,
                            enabled: true
                        }
                    }
                ]
            },
            {
                id: 'layers',
                label: 'Visual Layers',
                type: 'folder',
                toggles: {
                    visible: true,
                    enabled: true
                },
                children: [
                    {
                        id: 'background',
                        label: 'Background Layer',
                        type: 'layer',
                        toggles: {
                            visible: true,
                            enabled: true,
                            locked: false
                        }
                    },
                    {
                        id: 'ui',
                        label: 'UI Layer',
                        type: 'layer',
                        toggles: {
                            visible: false,
                            locked: true,
                            active: 'paused'
                        }
                    },
                    {
                        id: 'effects',
                        label: 'Effects Layer',
                        type: 'layer',
                        toggles: {
                            visible: true,
                            enabled: false,
                            active: 'stopped'
                        }
                    }
                ]
            }
        ]
    }
];
