// Copyright (c) 2024 Matthijs Keuper
// SPDX-License-Identifier: MIT

import { Pane } from './tweakpane-4.0.4.js';

/**
 * Context Menu and Popup utilities for Tweakpane property tables
 * 
 * Features:
 * - Dynamic popup creation with positioning
 * - Context menus for different binding types
 * - Constraint controls for numbers and vectors
 * - Type detection and validation
 */

// Constants for popup styling and configuration
const POPUP_CONSTANTS = {
    DEFAULTS: {
        WIDTH: 300,
        HEIGHT: 20,
        MARGIN_TOP: 20,
        MARGINS: { left: 5, right:5, top: 4 },
        Z_INDEX: 9999,
        MAXWIDTH:300
    },
    STYLES: {
        POPUP: {
            position: 'fixed',
            background: '#bbb',
            borderRadius: '1px',
            boxShadow: '0 4px 24px #0008',
            padding: '2px'
        },
        TITLE: {
            position: 'absolute', left: '8px', top: '4px', background: 'none', border: 'none',
            color: '#000', fontSize: '12px', opacity: 0.6, 
            fontFamily: 'Segoe UI, Arial, sans-serif', fontWeight: 'bold'
        },
        CLOSE_BUTTON: {
            position: 'absolute', right: '8px', top: '1px', background: 'none', border: 'none',
            color: '#000', fontSize: '20px', cursor: 'pointer', opacity: 0.5
        }
    },
    CONSTRAINTS: {
        DEFAULT_MIN: 0,
        DEFAULT_MAX: 100,
        DEFAULT_STEP: 0.1
    },
    VECTOR_COMPONENTS: {
        vec2: ['x', 'y'],
        vec3: ['x', 'y', 'z'],
        vec4: ['x', 'y', 'z', 'w']
    },
    SUPPORTED_TYPES: ['number', 'vec2', 'vec3', 'vec4', 'string']
};

/**
 * Creates a popup pane with Tweakpane instance
 * @param {Object} options - Configuration options
 * @param {string} options.title - Optional popup title
 * @param {HTMLElement} options.positionElement - Element to position popup relative to
 * @param {number} options.width - Popup width
 * @param {number} options.height - Popup height
 * @param {Function} options.onClose - Callback when popup closes
 * @param {Function} options.fill - Callback to populate pane content
 * @param {number} options.x - Manual x position
 * @param {number} options.y - Manual y position
 * @returns {Pane} Tweakpane instance with _popup property
 */
export function createPopupPane({ 
    title = null, 
    positionElement = null, 
    width = POPUP_CONSTANTS.DEFAULTS.WIDTH, 
    height = POPUP_CONSTANTS.DEFAULTS.HEIGHT, 
    onClose, 
    fill, 
    x, 
    y 
}) {
    const popup = _createPopupContainer();
    
    if (title) {
        _addTitle(popup, title);
    }
    
    _addCloseButton(popup, onClose);
    _positionPopup(popup, positionElement, x, y, width, height);
    
    const paneContainer = _createPaneContainer(popup);
    const pane = _createTweakpane(paneContainer, fill);
    
    _setupOutsideClickHandler(popup, onClose);
    
    pane._popup = popup;
    return pane;
}

// Helper functions for createPopupPane
function _createPopupContainer() {
    const popup = document.createElement('div');
    Object.assign(popup.style, {
        ...POPUP_CONSTANTS.STYLES.POPUP,
        zIndex: POPUP_CONSTANTS.DEFAULTS.Z_INDEX
    });
    return popup;
}

function _addTitle(popup, title) {
    const titleElem = document.createElement('div');
    titleElem.textContent = title;
    Object.assign(titleElem.style, POPUP_CONSTANTS.STYLES.TITLE);
    popup.appendChild(titleElem);
}

function _addCloseButton(popup, onClose) {
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, POPUP_CONSTANTS.STYLES.CLOSE_BUTTON);
    
    closeBtn.onmouseenter = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseleave = () => closeBtn.style.opacity = '0.5';
    closeBtn.onclick = () => {
        popup.remove();
        onClose?.();
    };
    popup.appendChild(closeBtn);
}

function _positionPopup(popup, positionElement, x, y, width, height) {
    const { DEFAULTS } = POPUP_CONSTANTS;
    let positionStyle = {
        minWidth: `${width}px`,
        minHeight: `${height}px`
    };

    if (positionElement) {
        const rect = positionElement.getBoundingClientRect();
        let width= rect.width - (DEFAULTS.MARGINS.left + DEFAULTS.MARGINS.right);
        let left= rect.left + DEFAULTS.MARGINS.left;
        left+=width;
        width= Math.min(width, POPUP_CONSTANTS.DEFAULTS.MAXWIDTH);
        left-=width;
        Object.assign(positionStyle, {
            left: `${left}px`,
            top: `${rect.bottom + DEFAULTS.MARGINS.top}px`,
            width: `${width}px`,
            minWidth: `${width}px`,
            maxWidth: `${width}px`,
            transform: 'none'
        });
    } else if (x != null && y != null) {
        Object.assign(positionStyle, {
            left: `${x}px`,
            top: `${y}px`,
            transform: 'none'
        });
    } else {
        Object.assign(positionStyle, {
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
        });
    }

    Object.assign(popup.style, positionStyle);
}

function _createPaneContainer(popup) {
    const paneDiv = document.createElement('div');
    paneDiv.style.marginTop = `${POPUP_CONSTANTS.DEFAULTS.MARGIN_TOP}px`;
    popup.appendChild(paneDiv);
    document.body.appendChild(popup);
    return paneDiv;
}

function _createTweakpane(container, fill) {
    const pane = new Pane({ container });
    if (typeof fill === 'function') {
        fill(pane);
    }
    return pane;
}

function _setupOutsideClickHandler(popup, onClose) {
    const closeOnOutsideClick = (e) => {
        if (!popup.contains(e.target)) {
            popup.remove();
            document.removeEventListener('click', closeOnOutsideClick);
            onClose?.();
        }
    };
    
    // Add listener on next frame to avoid immediate closure
    setTimeout(() => {
        document.addEventListener('click', closeOnOutsideClick);
    }, 0);
}









/**
 * Detects the binding type based on the property value
 * @param {Object} target - The target object
 * @param {string} property - The property name
 * @returns {string} The detected type: 'boolean', 'string', 'number', 'vec2', 'vec3', 'vec4', 'color', or 'unknown'
 */
export function detectBindingType(target, property) {
    const value = target[property];

    // Early returns for primitive types
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    
    if (typeof value === 'string') {
        // Detect hex color strings
        return /^#[0-9A-Fa-f]{6}$/.test(value) ? 'color' : 'string';
    }

    // Object type detection for vectors
    if (value && typeof value === 'object') {
        const keys = Object.keys(value);
        const hasKeys = (requiredKeys) => requiredKeys.every(key => keys.includes(key));
        
        if (hasKeys(['x', 'y', 'z', 'w'])) return 'vec4';
        if (hasKeys(['x', 'y', 'z'])) return 'vec3';
        if (hasKeys(['x', 'y'])) return 'vec2';
    }

    return 'unknown';
}





// Global state for context menu management
let activeContextMenu = null;

/**
 * Adds a context menu to a binding for constraint editing
 * @param {Object} binding - The Tweakpane binding
 * @param {Object} target - The target object
 * @param {string} property - The property name
 * @param {Object} options - Binding options
 */
export function addContextMenu(binding, target, property, options) {
    const type = detectBindingType(target, property);
    
    // Only add context menu for supported types
    if (!POPUP_CONSTANTS.SUPPORTED_TYPES.includes(type)) {
        return;
    }
    
    // Skip string types that aren't multiline
    if (type === "string" && !options.multiline) {
        return;
    }
    
    _initializeSliderVisibility(binding, options);
    _attachContextMenuListener(binding, target, property, options, type);
}

// Helper functions for addContextMenu
function _initializeSliderVisibility(binding, options) {
    const sliderContainer = binding.element?.querySelector('.tp-sldtxtv_s');
    if (sliderContainer) {
        sliderContainer.style.display = options.showSlider ? '' : 'none';
    }
}

function _attachContextMenuListener(binding, target, property, options, type) {
    binding.element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        _closeActiveContextMenu();
        
        const pane = createPopupPane({
            positionElement: binding.element,
            title: `Property: ${property}`,
            fill: (pane) => _populateContextMenu(pane, binding, target, property, options, type)
        });
        
        activeContextMenu = pane._popup;
    });
}

function _closeActiveContextMenu() {
    activeContextMenu?.remove();
    activeContextMenu = null;
}

function _populateContextMenu(pane, binding, target, property, options, type) {
    switch (type) {
        case 'boolean':
        case 'string':
            _addStringControls(pane, binding, options);
            break;
        case 'number':
            _addNumberControls(pane, binding, options);
            break;
        case 'vec2':
        case 'vec3':
        case 'vec4':
            _addVectorControls(pane, binding, options, type);
            break;
        default:
            console.warn(`Unknown type for property ${property}: ${type}`);
            break;
    }
    
    _addCommonControls(pane, binding, target, property, options);
}

function _addStringControls(pane, binding, options) {
    if (options.multiline) {
        pane.addBinding(options, "wordwrap", { label: 'Word Wrap' })
            .on('change', () => binding.update());
        pane.addBinding(options, "scrollbars", { label: 'Scrollbars' })
            .on('change', () => binding.update());
    }
}

function _addNumberControls(pane, binding, options) {
    const { DEFAULT_MIN, DEFAULT_MAX, DEFAULT_STEP } = POPUP_CONSTANTS.CONSTRAINTS;
    
    _createConstraintControl(
        pane,
        [''],
        () => ({ 
            min: options.min ?? DEFAULT_MIN, 
            max: options.max ?? DEFAULT_MAX, 
            step: options.step ?? DEFAULT_STEP 
        }),
        (_, min, max, step) => {
            Object.assign(options, { min, max, step });
            _updateBindingConstraints(binding, { min, max, step });
        }
    );
    
    _addSliderToggle(pane, binding, options);
}

function _addVectorControls(pane, binding, options, type) {
    const components = POPUP_CONSTANTS.VECTOR_COMPONENTS[type];
    const { DEFAULT_MIN, DEFAULT_MAX, DEFAULT_STEP } = POPUP_CONSTANTS.CONSTRAINTS;
    
    _createConstraintControl(
        pane,
        components,
        (comp) => {
            // Ensure component options exist, but don't overwrite existing ones
            if (!options[comp]) {
                options[comp] = {};
            }
            return { 
                min: options[comp].min ?? DEFAULT_MIN,
                max: options[comp].max ?? DEFAULT_MAX,
                step: options[comp].step ?? DEFAULT_STEP
            };
        },
        (comp, min, max, step) => {
            Object.assign(options[comp], { min, max, step });
            if (binding[comp]) {
                _updateBindingConstraints(binding[comp], { min, max, step });
            }
        }
    );
}

function _createConstraintControl(pane, components, getValues, applyValues) {
    // Add header for constraint controls
    pane.addBlade({ 
        readonly: true, 
        view: 'text', 
        label: '', 
        parse: () => {}, 
        value: '  min  ,  max  ,  step' 
    });

    components.forEach(comp => {
        const values = getValues(comp);
        const constraintData = { range: { x: values.min, y: values.max, z: values.step } };

        pane.addBinding(constraintData, "range", { label: comp || '' })
            .on('change', () => {
                const { x: min, y: max, z: step } = constraintData.range;
                applyValues(comp, min, max, step);
            });
    });
}

function _addSliderToggle(pane, binding, options) {
    const sliderVisible = { showSlider: options.showSlider !== false };

    pane.addBinding(sliderVisible, 'showSlider', { label: 'Show Slider' })
        .on('change', () => {
            options.showSlider = sliderVisible.showSlider;
            const sliderContainer = binding.element?.querySelector('.tp-sldtxtv_s');
            if (sliderContainer) {
                sliderContainer.style.display = sliderVisible.showSlider ? '' : 'none';
            }
        });
}

function _updateBindingConstraints(binding, { min, max, step }) {
    if (binding.min !== undefined) binding.min = min;
    if (binding.max !== undefined) binding.max = max;
    if (binding.step !== undefined) binding.step = step;
}

function _addCommonControls(pane, binding, target, property, options) {
    // Close button
    pane.addButton({ title: 'Close' }).on('click', () => {
        binding.refresh();
        activeContextMenu?.remove();
    });
    
    // Remove button (if removable)
    if (options?.removable) {
        pane.addButton({ title: 'Remove', label: "Remove this item" })
            .on('click', () => {
                delete target[property];
                binding.dispose();
                activeContextMenu?.remove();
            });
    }
}

