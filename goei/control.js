// creates a very basic control element


//===================================================================================
// helper functions to create basic DOM elements
let createE = a => document.createElement(a);
let addEvent = (el, ev) => { Object.keys(ev).map(k => el.addEventListener(k, ev[k])) }
let appendC = (el, ...c) => c.map(f => el.appendChild(f))
let remove=el=>el.parentNode?.removeChild(el)
let add = (a, b) => Object.assign(a, b);

let newDiv = (classname, container = createE('div')) => (
    container.className = classname,
    container
)

let newLabel = (labelname, labelEl = createE('label')) => (
    labelEl.textContent = labelname,
    labelEl
)

let newInput = (type, value, onChange = _ => { }, inputEl = createE('input')) => (
    inputEl.type = type, inputEl.value = value,
    addEvent(inputEl, { input: (e) => onChange(e) }),
    inputEl
)

let newSlider = (min, max, value, onChange = _ => { }, sliderEl = createE('input')) => (
    sliderEl.type = 'range', sliderEl.min = min, sliderEl.max = max, sliderEl.value = value,
    addEvent(sliderEl, { input: (e) => onChange(e) }),
    sliderEl
)

//===================================================================================
// creates a simple slider control with label
export function createSliderControl({ label, value, min = 0, max = 100, onChange = _ => { } }) {
    const container = newDiv('slider-control');
    const sliderEl = newSlider(min, max, value, (e) => {
        value = parseFloat(e.target.value);
        onChange(value);
    });
    
    let methods = {
        updateValue: (newValue) => {
            value = newValue;
            sliderEl.value = newValue;
        },
        remove: () => remove(container)
    }
    
    add(container, methods);
    if (label) {
        const labelEl = newLabel(label);
        appendC(container, labelEl, sliderEl);
    } else {
        appendC(container, sliderEl);
    }
    return container;
}

//===================================================================================
// creates a very simple textcontrol with label
export function createMultiControl({ label, values,
    onChange = _ => { },
    onRightClick = _ => { },
    onLeftClick = _ => { },
    onValueClick = _ => { },
    onDragStart = _ => { } }) {
    // Create container
    const container = newDiv('control');
    const inputsContainer = newDiv('inputs');
    values = [...values].flat()       // if values is not an array, convert it to one
    const inputs = [];
    values.forEach((val, i) => {
        const inputEl = newInput('text', val, (e) => {
            values[i] = e.target.value;
            onChange([...values]);
        });
        addEvent(inputEl, { click: (e) => onValueClick(e, i, val) });
        inputs.push(inputEl);
        appendC(inputsContainer, inputEl);
    });

    // Add event listeners
    addEvent(container, {
        contextmenu: (e) => (e.preventDefault(), onRightClick(e)),
        click: (e) => onLeftClick(e),
        onDragStart: e => onDragStart(e)
    })

    // additional methods available:
    let methods = {
        updateValues: (newValues) => {
            newValues = [...newValues].flat();
            inputs.forEach((input, i) => input.value = newValues[i] || '');
            values.splice(0, values.length, ...newValues);      // write the newvalues into the values
        },
        remove: () => remove(container)
    }
    add(container, methods)                              // add the methods to the element
    
    // Assemble with or without label
    if (label) {
        const labelEl = newLabel(label);
        appendC(container, labelEl, inputsContainer);
    } else {
        appendC(container, inputsContainer);
    }
    return container;
}










/* 
Enhanced multicontrol with:
- Right click on control (onRightClick)
- Click on individual values (onValueClick) 
- Left click on control (onLeftClick)
- Update method to change values externally (control.updateValues(newValues))
- Remove method to clean up the control (control.remove())

Simple slider control with:
- Value change callback (onChange)
- Update method to change value externally (control.updateValue(newValue))
- Remove method to clean up the control (control.remove())

Usage:
const multiControl = createMultiControl({
    label: 'Position',
    values: [10, 20, 30],
    onChange: (vals) => console.log('Changed:', vals),
    onRightClick: (e) => console.log('Right clicked'),
    onLeftClick: (e) => console.log('Left clicked'),
    onValueClick: (e, index, value) => console.log('Value clicked:', index, value)
});

const sliderControl = createSliderControl({
    label: 'Opacity',
    value: 50,
    min: 0,
    max: 100,
    onChange: (val) => console.log('Slider changed:', val)
});

// Update values later:
multiControl.updateValues([40, 50, 60]);
sliderControl.updateValue(75);

// Remove controls:
multiControl.remove();
sliderControl.remove();
*/
