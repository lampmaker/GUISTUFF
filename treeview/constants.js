// Copyright (c) 2024 Matthijs Keuper
// SPDX-License-Identifier: MIT
import { icons } from './icons.js';

export const ICONS = {
    EXPANDED: icons.chevronDown,
    COLLAPSED: icons.chevronRight,
};

export const STYLES = {
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
        position: 'relative',
    },
    NODE: {
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: '3px',
        userSelect: 'none',
        whiteSpace: 'nowrap',
    },
    NODE_HOVER: {
        backgroundColor: '#404040',
    },
    NODE_SELECTED: {
        backgroundColor: '#007acc',
        color: '#ffffff',
    },
    NODE_CONTENT: {
        display: 'flex',
        alignItems: 'center',
    },
    ICON: {
        marginRight: '4px',
        minWidth: '12px',
        textAlign: 'center',
    },
    CHILDREN: {
        marginLeft: '16px',
    },
    DROP_INDICATOR: {
        position: 'absolute',
        height: '4px',
        backgroundColor: '#007acc',
        borderRadius: '1px',
        boxShadow: '0 0 4px rgba(0, 122, 204, 0.5)',
        zIndex: '1000',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'opacity 0.2s ease',
    },
};
