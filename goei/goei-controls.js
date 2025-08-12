// ==================================================================================
// GOEI CONTROLS - Menu System with Integrated Styling
//
// This module provides a complete menu/control system with built-in styling.
// The styles are automatically injected when the module loads, eliminating the
// need for external CSS files.
//
// Key Features:
// - Auto-injection of required CSS styles
// - Customizable styling through addCustomStyles()
// - Clean, modern control appearance
// - Responsive layout system
//
// Usage:
// import { createSliderControl, createMultiControl, addCustomStyles } from './goei-controls.js';
//
// The styles will be automatically injected. To add custom styling:
// addCustomStyles(`
//   .control { background: #custom-color; }
// `);
//
// ==================================================================================
// goei main controls

//===================================================================================
// CSS Styles for the control system
const GOEI_STYLES = `
    .control {
        background: white;
        border: none; /*1px solid #ddd;*/
        border-radius: 0;
        padding: 8px 12px;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border-bottom: none;
        box-sizing: border-box;
        width: 100%;
    }
    .control:last-child {
        border-bottom: 1px solid #ddd;
    }
    .control label,
    .control-text {
        min-width: 70px;
        font-weight: bold;
        font-family: Arial, sans-serif;
    }
    .inputs {
        display: flex;
        gap: 3px;
        margin-left: auto;
        width: 180px;
    }
    .inputs input {
        width: 30px;
        flex: 1;
        padding: 4px 6px;
        border: 1px solid #ccc;
        border: none;
        background-color: aliceblue;
        border-radius: 3px;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
    }
    
    input[type="button"] {
        background-color: #f8f9fa;
        border: 1px solid #ddd;
        color: #333;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    input[type="button"]:hover {
        background-color: #e9ecef;
        border-color: #adb5bd;
    }
    
    input[type="button"]:active {
        background-color: #dee2e6;
        border-color: #6c757d;
        transform: translateY(1px);
    }
    
    input[type="range"] {
        width: 180px;
        margin: 0;
        box-sizing: border-box;
    }
    .control-container {
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
        box-sizing: border-box;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0px;
    }
    .control-container .control-container {
        border-right: none;
        border-bottom: none;
        border-radius: 0;
    }
    /* Indentation for nested containers */
    .control-container.nested {
        padding-left: 20px;
    }
    /* Overlay style for context menus, popups, etc. */
    .control-container.overlay {
        position: absolute;
        z-index: 9999;
        min-width: 160px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        background: white;
        pointer-events: auto;
    }
    .control-text {
        font-family: Arial, sans-serif;
        color: #333;
    }

    .control-container.collapsed {
        display: none; /* Hide the container when collapsed */
    }


`;


//===================================================================================
// Function to inject CSS styles into the document
export let injectStyles = () => {
    // Check if styles are already injected
    if (document.getElementById('goei-styles')) return;

    const style = document.createElement('style');
    style.id = 'goei-styles';
    style.textContent = GOEI_STYLES;
    document.head.appendChild(style);
};

// Auto-inject styles when the module loads
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectStyles);
    } else {
        injectStyles();
    }
}

//===================================================================================
// helper functions to create basic DOM elements
let createE = a => document.createElement(a);                                                   // creates a new element
let addEvent = (el, ev) => { Object.keys(ev).map(k => el.addEventListener(k, ev[k])) }          // adds an event listener to an element
let appendC = (el, ...c) => c.map(f => el.appendChild(f))                                       // appends children to an element
let remove = el => el.parentNode?.removeChild(el)                                               // removes an element from its parent node, if it has one
let addProps = (a, b) => Object.assign(a, b);                                                        // adds properties to an object, like a class or methods

//===================================================================================
// creates a new div with a classname, defaults to 'control'
let newDiv = (classname = 'control', container = createE('div')) => (
    container.className = classname,
    container
)
//===================================================================================
// creates a new container with event listeners and properties
// This function creates a new container element with specified event listeners and properties
/// eg: newContainer({ click: () => console.log('clicked') }, { customProp: 'value' })
let newContainer = (events, props) => {
    const container = newDiv();
    container.style.boxSizing = 'border-box'; // Ensure proper box model
    addEvent(container, events); // Add event listeners to the main container
    addProps(container, {
        remove: () => remove(container), // Add a method to remove the container
        ...props
    });
    return container;
}



/*
element types:
- text: a simple text element
- input: a form input element
- slider: a range input element
- button: a button element


*/
//===================================================================================
// creates a new text element with text content (not a form label)
let newText = (textContent, events = {}, textEl = createE('span')) => (
    textEl.textContent = textContent,
    textEl.className = 'control-text',
    addEvent(textEl, events),
    textEl
)
//===================================================================================
// creates a new input element with type and value, and an onChange event handler
let newInput = (type, value, events = {}, inputEl = createE('input')) => (
    inputEl.type = type, inputEl.value = value,
    inputEl.autocomplete = "off",
    addEvent(inputEl, events),
    inputEl
)

//===================================================================================
// creates a new button element with text content and an onClick event handler
let newSlider = ({ min = 0, max = 1, step = 0.01, value }, events = {}, sliderEl = createE('input')) => (
    sliderEl.type = 'range', sliderEl.min = min, sliderEl.max = max, sliderEl.value = value, sliderEl.step = step,
    sliderEl.autocomplete = "off",
    addEvent(sliderEl, events),
    sliderEl
)


//===================================================================================
// creates a simple control with just text and event handlers
// this can be use for folder headers for instance.
export function createTextControl({ text, events = {} }) {
    const textElement = newText(text, events);
    const container = newContainer(events, {
        get text() { return textElement.textContent; },
        set text(value) { textElement.textContent = value; }
    });
    appendC(container, textElement);
    return container;
}

//===================================================================================
// creates a simple slider control with label
//
//
export function createSliderControl({ label, value, min = 0, max = 1, step = 0.01, events = {} }) {
    const sliderElement = newSlider({ min, max, step, value }, {
        input: (e) => {
            value = parseFloat(e.target.value);
            events.onChange?.(value);
        }
    });

    const container = newContainer(events, {
        updateValue: (newValue) => {
            value = newValue;
            sliderElement.value = newValue;
        },
        get value() { return value; }
    });
    appendC(container, newText(label), sliderElement);
    return container;
}


//===================================================================================
// creates a very simple textcontrol with label
// common events can be added to the control as a whole.
// valueEvents are attached to the individual inputs
export function createMultiControl({ type = 'text', label, values, events = {}, valueEvents = {} }) {
    const inputsContainer = newDiv('inputs');
    values = [...values].flat()                             // if values is not an array, convert it to one
    const inputs = [];
    values.forEach((val, i) => {
        const inputEl = newInput(type, val, {
            input: (e) => {
                values[i] = e.target.value;
                events.onChange?.([...values]);
            }
        });

        addEvent(inputEl, valueEvents)
        inputs.push(inputEl);
        appendC(inputsContainer, inputEl);
    });

    const container = newContainer(events, {
        updateValues: (newValues) => {
            newValues = [...newValues].flat();
            inputs.forEach((input, i) => input.value = newValues[i] || '');
            values.splice(0, values.length, ...newValues);      // write the newvalues into the values
        },
        get values() { return [...values]; }

    })                              // add the methods to the element
    appendC(container, newText(label), inputsContainer);
    return container;
}

//===================================================================================
// creates a multi-button control using createMultiControl as a wrapper
// buttons: array of { text, onClick }
export function createButtonControl({ label, buttons, events = {} }) {
    return createMultiControl({
        type: 'button',
        label,
        values: buttons.map(btn => btn.text),
        events,
        valueEvents: {
            click: (e) => {
                const idx = Array.from(e.target.parentNode.children).indexOf(e.target);
                buttons[idx]?.onClick?.(e);
            }
        }
    });
}

// ===================================================================================
// creates a simple container that can hold multiple controls.
// this can be nestered to create a hierarchy of controls
export function createContainer({ indent = false, overlay = false, events = {}, collapsed = false }) {
    const container = newDiv('control-container');
    if (indent) container.classList.add('nested');
    if (overlay) container.classList.add('overlay');
    if (collapsed) container.classList.add('collapsed');
    // Add event listeners if provided
    addEvent(container, events);
    // Add utility methods
    addProps(container, {
        remove: () => remove(container),
        // Add a child control
        addControl: (control) => {
            control.style.width = '100%';
            control.style.boxSizing = 'border-box';
            appendC(container, control);
            return container;
        },
        // Set indentation (true/false)
        setIndent: (isNested) => {
            container.classList.toggle('nested', !!isNested);
            return container;
        },
        // Set overlay (true/false)
        setOverlay: (isOverlay) => {
            container.classList.toggle('overlay', !!isOverlay);
            return container;
        },
        // Set collapsed (true/false)
        setCollapsed: (isCollapsed) => {
            container.classList.toggle('collapsed', !!isCollapsed);
            return container;
        }
    });
    return container;
}




//===================================================================================
// Function to add custom styles to the goei system
export function addCustomStyles(customCSS) {
    const customStyleId = 'goei-custom-styles';
    let customStyle = document.getElementById(customStyleId);

    if (!customStyle) {
        customStyle = document.createElement('style');
        customStyle.id = customStyleId;
        document.head.appendChild(customStyle);
    }

    customStyle.textContent += '\n' + customCSS;
}

//===================================================================================
// Function to reset/clear custom styles
export function clearCustomStyles() {
    const customStyle = document.getElementById('goei-custom-styles');
    if (customStyle) {
        customStyle.remove();
    }
}
