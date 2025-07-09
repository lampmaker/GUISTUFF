// Copyright (c) 2024 Matthijs Keuper
// SPDX-License-Identifier: MIT

import { Pane } from './tweakpane-4.0.4.js';
import { createPopupPane, addContextMenu, detectBindingType } from './contextmenu.js';
import { setTextareaStyle } from './highlighter.js';

/**
 * Enhanced Tweakpane with advanced property table functionality
 * 
 * Features:
 * - Context menus for all bindings
 * - Multiline text controls with syntax highlighting
 * - Expandable folders with add/remove functionality
 * - Automatic type detection and constraint management
 * - Modern JavaScript with error handling
 * 
 * @extends Pane
 */
// Enhanced Tweakpane with property table functionality
class PropertyTable extends Pane {

    // Constants for styling and configuration
    static CONSTANTS = {
        TIMEOUTS: {
            DOM_MODIFICATION: 0
        },
        STYLES: {
            HIDDEN: { display: 'none' },
            FULL_WIDTH: { width: '100%', marginLeft: '0' },
            FLEX_CENTER: { display: 'flex', alignItems: 'center' },
            PLUS_BUTTON: {
                marginLeft: 'auto', marginRight: '4px', cursor: 'pointer',
                opacity: '0.5', background: 'none', color: 'inherit',
                padding: '0', width: '24px', height: '24px',
                border: 'none', outline: 'none', fontSize: '18px',
                transition: 'opacity 0.2s'
            }
        },
        DEFAULT_VALUES: {
            NUMBER_MIN: 0,
            NUMBER_MAX: 100,
            TYPE_VALUES: ["text here", 0.0, { x: 0, y: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 0 }, false],
            TYPE_OPTIONS: { string: 0, float: 1, vec2: 2, vec3: 3, vec4: 4, boolean: 5 },
            SCROLLBARS: true
        },
        OPACITY: {
            HOVER: '1',
            DEFAULT: '0.5'
        }
    };

    constructor(options) {
        super(options);
    }
    //========================================================================================================================================
    // This method binds multiple properties of an object to the pane
    // It takes an object with properties and an options object for each property. if there are no options, it will use an empty object.
    bindControls(objects, options = {}, onclick = () => {}) {
        Object.entries(objects).forEach(([key, value]) => {
            this.addBinding(objects, key, options[key] || {}).on('click', onclick);
        });
    }

    //========================================================================================================================================  
    // This method prepares the binding options before they are added to the pane
    bindingPrepper(target, property, options) {
        const type = detectBindingType(target, property);
        
        switch (type) {
            case "number": {
                options.showSlider = true;
                const value = target[property];
                if (!options.min && !options.max) {
                    const { NUMBER_MIN, NUMBER_MAX } = PropertyTable.CONSTANTS.DEFAULT_VALUES;
                    options.min = Math.min(value, options.min ?? NUMBER_MIN);
                    options.max = Math.max(value, options.max ?? NUMBER_MAX);
                    options.showSlider = false; // default to showing the slider
                }
                break;
            }
            case "string": {
                if (options.multiline) {
                    options.readonly = true; // force to switch log control (which uses textarea)  for multiline strings
                    options.wordwrap = true;
                    if (options.scrollbars === undefined) {
                        options.scrollbars = PropertyTable.CONSTANTS.DEFAULT_VALUES.SCROLLBARS;
                    }
                }
                break;
            }
            default:
                break;
        }
        return { target, property, options };
    }

    //========================================================================================================================================  
    // Modifies controls after they are added to the pane
    bindingModifier(binding, target, property, options) {
        const type = detectBindingType(target, property);
        
        switch (type) {
            case "string": {
                if (options.multiline) {
                    setTimeout(() => {
                        try {
                            const element = binding.element;
                            const label = element?.querySelector('.tp-lblv_l');
                            const container = element?.querySelector('.tp-lblv_v');
                            
                            // Apply styles using constants
                            if (label) Object.assign(label.style, PropertyTable.CONSTANTS.STYLES.HIDDEN);
                            if (container) Object.assign(container.style, PropertyTable.CONSTANTS.STYLES.FULL_WIDTH);
                            
                            const textarea = element?.querySelector('textarea');
                            if (textarea) {
                                textarea.readOnly = false;
                                setTextareaStyle(textarea, options);
                                const ticker = binding.controller?.value?.ticker;
                                ticker?.dispose?.();
                                textarea.addEventListener('input', (e) => target[property] = e.target.value);
                                binding.update = () => setTextareaStyle(textarea, options);
                            }
                        } catch (error) {
                            console.warn('Failed to modify textarea binding:', error);
                        }
                    }, PropertyTable.CONSTANTS.TIMEOUTS.DOM_MODIFICATION);
                }
                break;
            }
            default:
                break;
        }
    }

    //========================================================================================================================================
    // Common binding setup logic - used by both pane and folder addBinding methods
    _setupBinding(originalAddBinding, target, property, options) {
        ({ target, property, options } = this.bindingPrepper(target, property, options));
        const binding = originalAddBinding(target, property, options);
        addContextMenu(binding, target, property, options);
        this.bindingModifier(binding, target, property, options);
        return binding;
    }

    //========================================================================================================================================    
    // // Override the addBinding method to customize how properties are added to the pane
    // This method allows you to add custom logic for handling property tables
    addBinding(target, property, options) {
        return this._setupBinding(super.addBinding.bind(this), target, property, options);
    }



    //========================================================================================================================================
    // Override the addFolder method to customize how folders are created
    addFolder(params) {
        const folder = super.addFolder(params);

        this._enhanceFolderWithBindings(folder);
        if(params?.object)folder.bindControls(params.object, params.options || {});

        //if (params?.expandable && params?.object) {
        if (params?.expandable) {
            this._makeExpandableFolder(folder, params);
        }
        
        return folder;
    }

    //========================================================================================================================================
    // Enhance folder with custom binding behavior and bindControls method
    _enhanceFolderWithBindings(folder) {
        // Override addBinding to add context menu
        const originalAddBinding = folder.addBinding;
        folder.addBinding = (target, property, options) => {
            return this._setupBinding(originalAddBinding.bind(folder), target, property, options);
        }

        // Attach bindControls to the folder
        folder.bindControls = (objects, options = {}, onclick = () => {}) => {
            folder.bindings = { objects, options };
            
            Object.entries(objects).forEach(([key, value]) => {
                const binding = folder.addBinding(objects, key, options?.[key] || {}).on('click', onclick);
                addContextMenu(binding, objects, key, options);
            });
        };
    }

    //========================================================================================================================================
    // Make folder expandable with add/remove functionality
    _makeExpandableFolder(folder, params) {
//        folder.bindControls(params.object, params.options || {});
        this._addElementCreator(folder);
        this._addPlusButton(folder);
        this._setupFolderRefresh(folder);
    }

    //========================================================================================================================================
    // Add element creator popup functionality to folder
    _addElementCreator(folder) {
        folder._addElement = () => {
            const { TYPE_VALUES, TYPE_OPTIONS } = PropertyTable.CONSTANTS.DEFAULT_VALUES;
            const params = { name: "name", type: 1, value: 0. };
            let currentPopup;
            
            function showPopup() {
                currentPopup?.remove();
                params.value = TYPE_VALUES[params.type];
                const pane = createPopupPane({ 
                    positionElement: folder.element.querySelector('.tp-fldv_t'), 
                    title: "Add Variable" 
                });
                currentPopup = pane._popup;
                pane.addBinding(params, 'name', { label: "Name" });
                pane.addBinding(params, 'type', { label: "Type", options: TYPE_OPTIONS })
                    .on('change', () => showPopup());
                pane.addBinding(params, 'value', { label: "Value" });
                pane.addButton({ title: 'Apply' }).on('click', () => {
                    folder.bindings.objects[params.name] = params.value;
                    folder.bindings.options[params.name] = { type: params.type, removable: true };
                    currentPopup.remove();
                    folder.refresh();
                });
            }
            showPopup();
        }
    }

    //========================================================================================================================================
    // Add plus button to folder header for adding new properties
    _addPlusButton(folder) {
        setTimeout(() => {
            const folderElem = folder.element;
            const header = folderElem.querySelector('.tp-fldv_t');
            if (header) {
                Object.assign(header.style, PropertyTable.CONSTANTS.STYLES.FLEX_CENTER);
                
                const plusBtn = document.createElement('button');
                plusBtn.textContent = '+';
                plusBtn.title = 'Add property';
                Object.assign(plusBtn.style, PropertyTable.CONSTANTS.STYLES.PLUS_BUTTON);
                
                const { HOVER, DEFAULT } = PropertyTable.CONSTANTS.OPACITY;
                plusBtn.onmouseenter = () => plusBtn.style.opacity = HOVER;
                plusBtn.onmouseleave = () => plusBtn.style.opacity = DEFAULT;
                plusBtn.onclick = e => {
                    e.stopPropagation();
                    folder._addElement();
                };
                header.appendChild(plusBtn);
            }
        }, PropertyTable.CONSTANTS.TIMEOUTS.DOM_MODIFICATION);
    }

    //========================================================================================================================================
    // Setup folder refresh functionality
    _setupFolderRefresh(folder) {
        const origRefresh = folder._refresh?.bind(folder) ?? (() => {});
        folder.refresh = () => {
            // Clear existing controls
            folder.children.slice().forEach(child => child.dispose());
            // Rebind all controls
            Object.entries(folder.bindings.objects).forEach(([key, value]) => {
                folder.addBinding(folder.bindings.objects, key, folder.bindings.options?.[key] || {});
            });
            origRefresh();
        };
    }

}

export { PropertyTable };
// Legacy export for backward compatibility
export { PropertyTable as propertyTable };

