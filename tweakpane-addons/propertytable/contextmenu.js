import { Pane } from './tweakpane-4.0.4.js';


//=========================================================================================================================================
// Function to create a popup pane with Tweakpane
// This function creates a popup with a Tweakpane instance inside it.



export function createPopupPane({ title = null, positionElement = null, width = 300, height = 20, onClose, fill, x, y }) {
    // Create popup container
    const popup = document.createElement('div');
    // add title
    if (title) {
        const titleElem = document.createElement('div');
        titleElem.textContent = title;
        Object.assign(titleElem.style, {
            position: 'absolute', left: '8px', top: '4px', background: 'none', border: 'none',
            color: '#000', fontSize: '12px', opacity: 0.6, fontFamily: 'Segoe UI, Arial, sans-serif', fontWeight: 'bold'
        });
        popup.appendChild(titleElem);
    }

    // Compute popup position and size-----------------------------------------------------------------------------------
    let computedStyle = {
        position: 'fixed',
        zIndex: 9999,
        background: '#bbb',
        borderRadius: '8px',
        boxShadow: '0 4px 24px #0008',
        padding: '2px',
        minWidth: width + 'px',
        minHeight: height + 'px'
    };

    if (positionElement) {
        const rect = positionElement.getBoundingClientRect();
        x = rect.left;
        y = rect.bottom;
        Object.assign(computedStyle, {
            left: rect.left + 5 + 'px',
            top: (rect.bottom + 4) + 'px',
            width: rect.width + 'px',
            minWidth: rect.width + 'px',
            maxWidth: rect.width + 'px',
            transform: 'none'
        });
    } else if (x != null && y != null) {
        Object.assign(computedStyle, {
            left: x + 'px',
            top: y + 'px',
            transform: 'none'
        });
    } else {
        Object.assign(computedStyle, {
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)'
        });
    }

    Object.assign(popup.style, computedStyle);


    // Optional close button ----------------------------------------------------------------------------------------------------
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, {
        position: 'absolute', right: '8px', top: '1px', background: 'none', border: 'none',
        color: '#000', fontSize: '20px', cursor: 'pointer', opacity: 0.5
    });
    closeBtn.onmouseenter = () => closeBtn.style.opacity = 1;
    closeBtn.onmouseleave = () => closeBtn.style.opacity = 0.5;
    closeBtn.onclick = () => { popup.remove(); if (onClose) onClose(); };
    popup.appendChild(closeBtn);

    // Container for tweakpane ------------------------------------------------------------------------------------
    const paneDiv = document.createElement('div');
    paneDiv.style.marginTop = '20px'; // Add space for the close button
    popup.appendChild(paneDiv);
    document.body.appendChild(popup);

    // Close popup when clicking outside------------------------------------------------------------------------------------
    const closeOnOutsideClick = (e) => {
        if (!popup.contains(e.target)) {
            popup.remove();
            document.removeEventListener('click', closeOnOutsideClick);
            if (onClose) onClose();
        }
    };
    // Add the listener on the next frame to avoid immediate closure    -
    setTimeout(() => {
        document.addEventListener('click', closeOnOutsideClick);
    }, 0);

    // Create tweakpane instance    ----------------------------------------------------------------------------------
    const pane = new Pane({ container: paneDiv });
    if (typeof fill === 'function') fill(pane);
    pane._popup = popup;
    return pane;
}










//=========================================================================================================================================
// returns the type of binding based on the value of the property: 
// 'boolean', 'string', 'number', 'vec2', 'vec3', 'vec4' or 'unknown'
function detectBindingType(target, property) {
    const value = target[property];

    // detect color strings
    if (typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)) return 'color'; // hex color
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';

    if (value && typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.includes('x') && keys.includes('y') && keys.includes('z') && keys.includes('w')) return 'vec4';
        if (keys.includes('x') && keys.includes('y') && keys.includes('z')) return 'vec3';
        if (keys.includes('x') && keys.includes('y')) return 'vec2';
    }

    return 'unknown';
}







//=========================================================================================================================================
// Function to add a context menu to a binding
// This function creates a context menu for a binding that allows the user to modify constraints on the property.
// It supports boolean, string, number, vec2, vec3, and vec4 types
let activeContextmenu = null;
export function addContextMenu(binding, target, property, options) {
    // only for specific types of bindings
     let type = detectBindingType(target, property);
    if (![ 'number', 'vec2', 'vec3', 'vec4'].includes(type)) {
        return;
    }   
    binding.element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (activeContextmenu) {
            activeContextmenu.remove();
        }
        const pane = createPopupPane({
            positionElement: binding.element,
            title: `Property: ${property}`,
            fill: (pane) => {
                // // find the binding type 
               

                // Helper function to create constraint controls
                const createConstraintControl = (components, getValues, applyValues) => {
                    pane.addBlade({ readonly: true, view: 'text', label: '', parse: _ => { }, value: '  min  ,  max  ,  step' });

                    components.forEach(comp => {
                        const values = getValues(comp);
                        const vals = { range: { x: values.min, y: values.max, z: values.step } };

                        pane.addBinding(vals, "range", { label: comp || '' }).on('change', () => {
                            applyValues(comp, vals.range.x, vals.range.y, vals.range.z);
                        });
                    });
                };
                // add context menu for different types of properties====================================================================
                switch (type) {
                    case 'boolean':
                    case 'string':
                        break;

                    case 'number':
                        createConstraintControl([''],
                            () => ({ min: options.min || 0, max: options.max || 100, step: options.step || 0.1 }),
                            (_, min, max, step) => {
                                options.min = min; options.max = max; options.step = step;
                                if (binding.min !== undefined) binding.min = min;
                                if (binding.max !== undefined) binding.max = max;
                                if (binding.step !== undefined) binding.step = step;
                            }
                        );
                        break;

                    case 'vec2':
                    case 'vec3':
                    case 'vec4':
                        const components = type === 'vec2' ? ['x', 'y'] : type === 'vec3' ? ['x', 'y', 'z'] : ['x', 'y', 'z', 'w'];
                        createConstraintControl(components,
                            (comp) => {
                                options[comp] = options[comp] || {};
                                return { min: options[comp].min || 0, max: options[comp].max || 100, step: options[comp].step || 0.1 };
                            },
                            (comp, min, max, step) => {
                                options[comp].min = min; options[comp].max = max; options[comp].step = step;
                                if (binding[comp]) {
                                    if (binding[comp].min !== undefined) binding[comp].min = min;
                                    if (binding[comp].max !== undefined) binding[comp].max = max;
                                    if (binding[comp].step !== undefined) binding[comp].step = step;
                                }
                            }
                        );
                        break;

                    default:
                        console.warn(`Unknown type for property ${property}: ${type}`);
                        break;
                }
                pane.addButton({ title: 'Close', }).on('click', () => {
                    binding.refresh()
                    pane._popup.remove();
                })
                //===========================================================================================================================
                if (options?.removable) { // add the remove button if the property is removable
                    pane.addButton({ title: 'Remove', label: "Remove this item" }).on('click', () => {
                        delete target[property];
                        binding.dispose();
                        pane._popup.remove();
                    });
                }
            }
        });
        activeContextmenu = pane._popup;
    });
}

