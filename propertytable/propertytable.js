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

    /* BOXES: a folder drawn as a box of its own -- a border, rounded corners, its own ground, the title in the
       input colour at 12.5px (an icon before it, if given), a folder inside it set in a little. One look for every
       table that asks for it, so a change here changes them all: ShadyTracer had it as its host's rules over
       Tweakpane's classes, copied once per panel that wanted boxes, and a third panel would have been a third copy.
       The colours are custom properties a host sets (on the table or any ancestor); unset, each falls back to
       Tweakpane's own theme, so a plain page gets boxes too.
       NOT overflow: hidden. The rounded corner could have been clipped that way, but so would anything a row
       opens below itself -- Tweakpane's colour picker is a popup positioned inside its row, and on a box's last
       rows it was cut off at the border. The one thing that reached the corner is the fold's indent strip, and a
       box has no use for it -- its border says what is inside -- so a box has none.
       A folder in a box is set in by margins of the same specificity as Tweakpane's spacing between blades, so
       Tweakpane's still decides its top (none after another folder); a box in a box keeps a box's margins. */
    static BOX_CSS = `
.tp-fldv.pt-box { margin: var(--pt-box-margin, 8px); border: 1px solid var(--pt-box-border-color, rgba(187, 188, 196, 0.25));
    border-radius: var(--pt-box-border-radius, 7px); background: var(--pt-box-background-color, rgba(0, 0, 0, 0.15)); }
.tp-fldv.pt-box > .tp-fldv_b { position: relative; height: auto; padding: 8px 10px 4px 12px; background: transparent;
    color: var(--pt-box-title-color, var(--tp-input-foreground-color, hsl(230, 7%, 75%)));
    font-family: inherit; font-size: var(--pt-box-title-font-size, 12.5px); font-weight: 600; line-height: normal;
    text-transform: none; letter-spacing: 0; }
.tp-fldv.pt-box > .tp-fldv_i { display: none; }
.tp-fldv.pt-box > .tp-fldv_c { padding-bottom: 4px; }
.tp-fldv.pt-box.pt-icon > .tp-fldv_b { padding-left: 33px; }
.tp-fldv.pt-box.pt-icon > .tp-fldv_b::before { content: ''; position: absolute; left: 10px; top: 50%; width: 15px; height: 15px;
    margin-top: -5.5px; background: currentColor;
    -webkit-mask: var(--pt-icon) center / contain no-repeat; mask: var(--pt-icon) center / contain no-repeat; }
.tp-fldv.pt-box .tp-fldv { margin: 2px 4px 2px 8px; }
.tp-fldv.pt-box .tp-fldv.pt-box { margin: var(--pt-box-margin, 8px); }
`;

    /**
     * @param options  Tweakpane's, and:
     *   boxes  true: every folder added at the table's top level is a box (a folder's own `box` decides otherwise)
     */
    constructor(options) {
        super(options);
        this._boxes = options?.boxes === true;
        // the rules once per document, as Tweakpane embeds its own -- so a window a panel is moved into, which
        // copies the page's stylesheets, has them too
        this.registerPlugin({ id: 'propertytable', css: PropertyTable.BOX_CSS, plugins: [] });
    }

    //========================================================================================================================================
    /**
     * A box's icon, drawn before its title in the title's colour: SVG markup (a string), an SVG element, or the URL
     * of an image -- only its shape counts, as a mask. Nothing for a folder that is not a box. Static, so a host can
     * give one to a folder it did not make itself; null takes it away.
     */
    static setIcon(folder, icon) {
        const el = folder?.element;
        if (!el?.classList?.contains('tp-fldv')) return folder;
        if (icon == null || icon === '') {
            el.classList.remove('pt-icon');
            el.style.removeProperty('--pt-icon');
            return folder;
        }
        let url;
        const markup = typeof icon === 'string' ? (icon.trim().startsWith('<') ? icon : null) : icon?.outerHTML;
        if (markup != null) {
            // a data: URL's SVG needs its namespace, which markup taken from an inline <svg> leaves out
            const svg = /^\s*<svg\b[^>]*\bxmlns=/.test(markup) ? markup : markup.replace(/<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"');
            url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
        } else {
            url = `url("${String(icon).replace(/["\\]/g, '\\$&')}")`;
        }
        el.classList.add('pt-icon');
        el.style.setProperty('--pt-icon', url);
        return folder;
    }

    //========================================================================================================================================
    // This method checks if the object is a vector type (vec2, vec3, vec4).. used for binding; if it is a vector, it will use the appropriate binding type,
    // if it is another object, it will create a folder and bind the properties of the object to the folder
    isVector(o) {
        return ['xy', 'xyz', 'wxyz','bgr','abgr'].includes(Object.keys(o).sort().join(''));
    }

    //========================================================================================================================================
    // Shared bindControls logic used by both class and instance methods
    _bindControlsLogic(container, objects, options = {}, onclick = () => {}) {
        Object.entries(objects).forEach(([key, value]) => {
            // Check if the value is an object but not a vector type
            if (typeof value === 'object' && value !== null && !this.isVector(value)) {
                // Create folder parameters
                const folderParams = {
                    title: key,
                    object: value,
                    options: options[key] || {}
                };
                
                // Check if this nested object should be expandable
                if (options[key]?.expandable) {
                    folderParams.expandable = true;
                }
                
                // Create the folder and enhance it
                const subfolder = container.addFolder(folderParams);
                this._enhanceFolderWithBindings(subfolder);
            } else {
                // Bind normally for primitives and vectors
                if (key!="expandable"){             // ignore expandable key
                const propertyOptions = options?.[key] || {};
                const binding = container.addBinding(objects, key, propertyOptions);
                // Store the change callback on the binding for use in popup sliders
                binding._onChange = onclick;
                binding.on('change', onclick);
                addContextMenu(binding, objects, key, propertyOptions);
                }
            }
        });
    }

    //========================================================================================================================================
    // This method binds multiple properties of an object to the pane
    // It takes an object with properties and an options object for each property. if there are no options, it will use an empty object.
    bindControls(objects, options = {}, onclick = () => {}) {
        this._bindControlsLogic(this, objects, options, onclick);
    }

    //========================================================================================================================================
    // Clear all controls and bind to new objects
    clearAndBindControls(objects, options = {}, onclick = () => {}) {
        this.clearControls();
        this.bindControls(objects, options, onclick);
    }

    //========================================================================================================================================
    // Clear all existing controls from the pane
    clearControls() {
        // Clear all children by disposing them
        this.children.slice().forEach(child => child.dispose());
    }

    //========================================================================================================================================  
    // This method prepares the binding options before they are added to the pane
    bindingPrepper(target, property, options) {
        const type = detectBindingType(target, property);
        
        switch (type) {
            case "color":{
                options.color={type:"float"}
            }
            case "number": {
                options.showSlider = true;
                const value = target[property];
                /* NO RANGE GIVEN: a default one, widened to hold the value. "Given" is not "truthy":
                   `!options.min` took a caller's min: 0 for no range at all, and gave its field a
                   maximum of max(value at the time, 100) -- a light's flux in RAYTRACER_WEBGPU could
                   not be raised past whatever it had been when the panel was drawn, a different
                   ceiling in every scene. A min alone means a field unbounded above, as Tweakpane has it. */
                if (options.min == null && options.max == null) {
                    const { NUMBER_MIN, NUMBER_MAX } = PropertyTable.CONSTANTS.DEFAULT_VALUES;
                    options.min = Math.min(value, options.min ?? NUMBER_MIN);
                    options.max = Math.max(value, options.max ?? NUMBER_MAX);
                    options.showSlider = false; // default to showing the slider
                }
                /* A RANGE GIVEN, AND A VALUE OUTSIDE IT: the range widened to hold the value. A range is
                   the slider's reach, not a limit on the value -- a range shared by many values (a shape
                   type's width, 0.01 to 10) met one of 60, drew its slider pinned at the end, and the
                   first drag wrote 10 over the 60 (ShadyTracer's RGBW example, 2026-10-12). Only a bound
                   given is moved; a min alone stays a field unbounded above. Widened on a copy: an options
                   object a caller hands every row of a kind would otherwise carry one row's value into
                   the next row's range. */
                else if (typeof value === "number" && Number.isFinite(value)
                         && ((options.min != null && value < options.min) || (options.max != null && value > options.max))) {
                    options = { ...options };
                    if (options.min != null && value < options.min) options.min = value;
                    if (options.max != null && value > options.max) options.max = value;
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
    bindingModifier(binding, target, property, options, { sliders = true } = {}) {
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
                                /* A REFRESH MUST NOT MOVE THE CARET. The box is a monitor made editable, and every
                                   refresh (a host refreshing its tables whenever its settings change -- the camera,
                                   any live value) writes its text through textContent (tweakpane MultiLogView
                                   update_). Until a key is typed the textarea's value follows that text, and the caret
                                   went back to the start: the cursor could be put in the box but not kept there (a
                                   path's points in RAYTRACER_WEBGPU, 2026-10-02). The same text now writes nothing;
                                   other text becomes the value, the caret kept where it was while the box has focus. */
                                const nodeText = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
                                Object.defineProperty(textarea, 'textContent', {
                                    configurable: true,
                                    get() { return nodeText.get.call(this); },
                                    set(text) {
                                        if (text === this.value) return;
                                        const focused = this.ownerDocument.activeElement === this;
                                        const start = this.selectionStart, end = this.selectionEnd;
                                        this.value = text;
                                        if (focused) this.setSelectionRange(Math.min(start, text.length), Math.min(end, text.length));
                                    },
                                });
                            }
                        } catch (error) {
                            console.warn('Failed to modify textarea binding:', error);
                        }
                    }, PropertyTable.CONSTANTS.TIMEOUTS.DOM_MODIFICATION);
                }
                break;
            }
            case "vec3":
            case "vec4": {
                if (!sliders) break;
                setTimeout(() => {
                    try {
                        const element = binding.element;
                        const label = element?.querySelector('.tp-lblv_l') || element;
                        
                        // Check if plus button already exists to prevent duplicates
                        if (label.querySelector('.vector-plus-btn')) {
                            return;
                        }
                        
                        Object.assign(label.style, PropertyTable.CONSTANTS.STYLES.FLEX_CENTER);

                        const plusBtn = document.createElement('button');
                        plusBtn.className = 'vector-plus-btn'; // Add class for identification
                        plusBtn.textContent = '+';
                        plusBtn.title = 'Show sliders';
                        Object.assign(plusBtn.style, PropertyTable.CONSTANTS.STYLES.PLUS_BUTTON);

                        const { HOVER, DEFAULT } = PropertyTable.CONSTANTS.OPACITY;
                        plusBtn.onmouseenter = () => plusBtn.style.opacity = HOVER;
                        plusBtn.onmouseleave = () => plusBtn.style.opacity = DEFAULT;

                        let currentPopup;
                        const keys = type === 'vec3' ? ['x', 'y', 'z'] : ['x', 'y', 'z', 'w'];

                        // Store original change callback to call from popup sliders
                        const changeCallback = binding._onChange;

                        function showPopup() {
                            currentPopup?.remove();
                            const pane = createPopupPane({
                                positionElement: element, // Use the full control element, not just the plus button
                                title: property
                            });
                            currentPopup = pane._popup;
                            keys.forEach(k => {
                                const componentOptions = options?.[k] || {};
                                const finalOptions = Object.assign({ 
                                    label: k,
                                    min: 0,
                                    max: 1,
                                    step: 0.001
                                }, componentOptions);
                                pane.addBinding(target[property], k, finalOptions).on('change', () => {
                                    // Call the stored change callback
                                    if (changeCallback) {
                                        try {
                                            changeCallback({ value: target[property] });
                                        } catch (e) {
                                            console.warn('Error calling change callback:', e);
                                        }
                                    }
                                });
                            });
                        }

                        plusBtn.onclick = e => {
                            e.stopPropagation();
                            if (currentPopup) {
                                currentPopup.remove();
                                currentPopup = null;
                            } else {
                                showPopup();
                            }
                        };

                        label.appendChild(plusBtn);
                    } catch (error) {
                        console.warn('Failed to add vector slider popup:', error);
                    }
                }, PropertyTable.CONSTANTS.TIMEOUTS.DOM_MODIFICATION);
                break;
            }
            default:
                break;
        }
    }

    //========================================================================================================================================
    // Common binding setup logic - used by both pane and folder addBinding methods
    _setupBinding(originalAddBinding, target, property, options) {
        /* sliders: false -- a vector as its numbers only, without the + that opens a slider per component
           (a camera's position: "no sliders, just value"). Taken off before Tweakpane sees the options. */
        const sliders = options?.sliders !== false;
        if (options && 'sliders' in options) { options = { ...options }; delete options.sliders; }
        ({ target, property, options } = this.bindingPrepper(target, property, options));
        const binding = originalAddBinding(target, property, options);
        addContextMenu(binding, target, property, options);
        this.bindingModifier(binding, target, property, options, { sliders });
        return binding;
    }

    //========================================================================================================================================    
    // // Override the addBinding method to customize how properties are added to the pane
    // This method allows you to add custom logic for handling property tables
    addBinding(target, property, options) {
        return this._setupBinding(super.addBinding.bind(this), target, property, options);
    }



    //========================================================================================================================================
    // Shared folder creation logic used by both class and instance addFolder methods
    _createEnhancedFolder(originalAddFolder, params, context) {
        const folder = originalAddFolder.call(context, params);
//         console.log("add folder", params);
        // a box: asked for (`box`), or a top-level folder of a table of boxes
        if (params?.box ?? (context === this && this._boxes)) folder.element.classList.add('pt-box');
        if (params?.icon != null) PropertyTable.setIcon(folder, params.icon);
        this._enhanceFolderWithBindings(folder);
        if (params?.object) folder.bindControls(params.object, params.options || {},params?.onChange);

        if (params?.expandable || params?.object?.expandable) {
            this._makeExpandableFolder(folder, params);
        }
        
        return folder;
    }

    //========================================================================================================================================
    // Override the addFolder method to customize how folders are created
    addFolder(params) {
     
        return this._createEnhancedFolder(super.addFolder, params, this);
    }

    //========================================================================================================================================
    // Enhance folder with custom binding behavior and bindControls method
    _enhanceFolderWithBindings(folder) {
        // Override addBinding to add context menu
        const originalAddBinding = folder.addBinding;
        folder.addBinding = (target, property, options) => {
            return this._setupBinding(originalAddBinding.bind(folder), target, property, options);
        }

        // Override addFolder to use the same logic as the class addFolder method
        const originalAddFolder = folder.addFolder;
        folder.addFolder = (params) => {
            return this._createEnhancedFolder(originalAddFolder, params, folder);
        }

        // Attach bindControls to the folder
        folder.bindControls = (objects, options = {}, onclick = () => {}) => {
            folder.bindings = { objects, options };
            this._bindControlsLogic(folder, objects, options, onclick);
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

    //========================================================================================================================================
    // Public method to make a folder expandable after creation
    makeExpandable(folder, params = {}) {
        if (!folder.bindings) {
            console.warn('Folder must have bindings (object and options) to be made expandable');
            return;
        }
        this._makeExpandableFolder(folder, params);
    }

}

export { PropertyTable };
// Legacy export for backward compatibility
export { PropertyTable as propertyTable };

