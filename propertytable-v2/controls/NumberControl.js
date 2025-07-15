// Copyright (c) 2025 Matthijs Keuper
// SPDX-License-Identifier: MIT

/**
 * Number Control - Base class for numeric controls
 * Supports different interaction modes: input, slider, knob
 */
import { PropertyControl } from '../core/PropertyControl.js';
import { PropertyTable } from '../core/PropertyTable.js';

export class NumberControl extends PropertyControl {
    constructor(target, property, options = {}) {
        super(target, property, options);
    }

    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            min: 0,
            max: 1,
            step: 0.01,
            precision: 2,
            mode: 'input', // 'input', 'slider', 'knob', 'input+slider'
            size: 'normal' // 'compact', 'normal', 'large'
        };
    }

    init() {
        // Auto-detect if this is a vector control based on the value
        this.detectVectorMode();
        super.init();
    }

    detectVectorMode() {
        const value = this.target[this.property];
        
        if (Array.isArray(value)) {
            // Handle arrays: [x, y] or [x, y, z] or [x, y, z, w]
            this.isVector = true;
            this.componentCount = value.length;
            this.componentLabels = this.getDefaultArrayLabels(value.length);
            this.componentKeys = Array.from({length: value.length}, (_, i) => i);
        } else if (value && typeof value === 'object') {
            // Handle objects: {x: 1, y: 2} or {r: 1, g: 0, b: 0}
            this.isVector = true;
            this.componentKeys = Object.keys(value);
            this.componentCount = this.componentKeys.length;
            this.componentLabels = this.componentKeys.map(key => key.toUpperCase());
        } else {
            // Regular scalar value
            this.isVector = false;
            this.componentCount = 1;
        }
    }

    getDefaultArrayLabels(count) {
        const labelSets = {
            2: ['X', 'Y'],
            3: ['X', 'Y', 'Z'],
            4: ['X', 'Y', 'Z', 'W']
        };
        return labelSets[count] || Array.from({length: count}, (_, i) => `${i}`);
    }

    createElement() {
        this.element = document.createElement('div');
        
        if (this.isVector) {
            this.element.className = `prop-control prop-vector prop-vector--${this.componentCount} prop-vector--${this.options.mode}`;
        } else {
            this.element.className = `prop-control prop-number prop-number--${this.options.mode} prop-number--${this.options.size}`;
        }
        
        // Create label
        this.labelElement = document.createElement('label');
        this.labelElement.className = 'prop-label';
        this.labelElement.textContent = this.options.label;
        
        // Create control container
        this.controlContainer = document.createElement('div');
        this.controlContainer.className = this.isVector ? 'prop-vector-container' : 'prop-control-container';
        
        // Create the appropriate control based on mode
        if (this.isVector) {
            this.createVectorControls();
        } else {
            this.createControlForMode();
        }
        
        this.element.appendChild(this.labelElement);
        this.element.appendChild(this.controlContainer);
        
        // Add context menu if enabled
        if (this.options.contextMenu) {
            this.element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e);
            });
        }
    }

    createVectorControls() {
        this.componentElements = [];
        this.componentSliders = [];
        this.componentKnobs = [];
        
        for (let i = 0; i < this.componentCount; i++) {
            const componentContainer = document.createElement('div');
            componentContainer.className = 'prop-vector-component';
            
            // Create component label
            const componentLabel = document.createElement('label');
            componentLabel.className = 'prop-component-label';
            componentLabel.textContent = this.componentLabels[i];
            componentContainer.appendChild(componentLabel);
            
            // Create controls for this component based on mode
            this.createComponentControls(componentContainer, i);
            
            this.controlContainer.appendChild(componentContainer);
        }
    }

    createComponentControls(container, index) {
        switch (this.options.mode) {
            case 'input':
                this.createComponentInput(container, index);
                break;
            case 'slider':
                this.createComponentSlider(container, index);
                break;
            case 'knob':
                this.createComponentKnob(container, index);
                break;
            case 'input+slider':
                this.createComponentInput(container, index);
                this.createComponentSlider(container, index);
                break;
            default:
                this.createComponentInput(container, index);
        }
    }

    createComponentInput(container, index) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'prop-number-input prop-component-input';
        input.title = 'Click to open slider popup';
        
        // Add event listeners
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                this.setComponentValue(index, value);
            }
        });
        
        input.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showComponentSliderPopup(index);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                const increment = e.shiftKey ? this.options.step * 10 : this.options.step;
                const delta = e.key === 'ArrowUp' ? increment : -increment;
                const currentValue = this.getComponentValue(index);
                const newValue = Math.max(this.options.min, 
                    Math.min(this.options.max, currentValue + delta));
                this.setComponentValue(index, newValue);
            }
            if (e.key === 'Enter') {
                input.blur();
            }
        });
        
        container.appendChild(input);
        this.componentElements[index] = input;
    }

    createComponentSlider(container, index) {
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'prop-number-slider prop-component-slider';
        slider.min = this.options.min;
        slider.max = this.options.max;
        slider.step = this.options.step;
        
        slider.addEventListener('input', (e) => {
            this.setComponentValue(index, parseFloat(e.target.value));
        });
        
        container.appendChild(slider);
        this.componentSliders[index] = slider;
    }

    createComponentKnob(container, index) {
        const knobContainer = document.createElement('div');
        knobContainer.className = 'prop-number-knob prop-component-knob';
        
        // Create SVG knob (simplified version of createSVGKnob)
        const size = this.options.size === 'compact' ? 20 : this.options.size === 'large' ? 36 : 28;
        this.createComponentSVGKnob(knobContainer, index, size);
        
        container.appendChild(knobContainer);
    }

    createControlForMode() {
        switch (this.options.mode) {
            case 'input':
                this.createInputControl();
                break;
            case 'slider':
                this.createSliderControl();
                break;
            case 'knob':
                this.createKnobControl();
                break;
            case 'input+slider':
                this.createInputControl();
                this.createSliderControl();
                break;
            default:
                this.createInputControl();
        }
    }

    createInputControl() {
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text'; // Changed from number to text to hide arrows
        this.inputElement.className = 'prop-number-input';
        this.inputElement.title = 'Click to open slider popup';
        
        this.controlContainer.appendChild(this.inputElement);
    }

    createSliderControl() {
        this.sliderElement = document.createElement('input');
        this.sliderElement.type = 'range';
        this.sliderElement.className = 'prop-number-slider';
        this.sliderElement.min = this.options.min;
        this.sliderElement.max = this.options.max;
        this.sliderElement.step = this.options.step;
        
        this.controlContainer.appendChild(this.sliderElement);
    }

    createKnobControl() {
        this.knobContainer = document.createElement('div');
        this.knobContainer.className = 'prop-number-knob';
        
        // Create SVG knob
        this.createSVGKnob();
        
        this.controlContainer.appendChild(this.knobContainer);
    }

    createSVGKnob() {
        const size = this.options.size === 'compact' ? 24 : this.options.size === 'large' ? 48 : 32;
        
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', size);
        this.svg.setAttribute('height', size);
        this.svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        this.svg.style.cursor = 'grab';
        
        // Background circle
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', size/2);
        bgCircle.setAttribute('cy', size/2);
        bgCircle.setAttribute('r', size/2 - 2);
        bgCircle.setAttribute('fill', 'none');
        bgCircle.setAttribute('stroke', '#444');
        bgCircle.setAttribute('stroke-width', '2');
        
        // Value arc
        this.valueArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.valueArc.setAttribute('fill', 'none');
        this.valueArc.setAttribute('stroke', '#007acc');
        this.valueArc.setAttribute('stroke-width', '3');
        this.valueArc.setAttribute('stroke-linecap', 'round');
        
        // Center dot
        const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        centerDot.setAttribute('cx', size/2);
        centerDot.setAttribute('cy', size/2);
        centerDot.setAttribute('r', '2');
        centerDot.setAttribute('fill', '#007acc');
        
        // Indicator line
        this.indicator = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.indicator.setAttribute('x1', size/2);
        this.indicator.setAttribute('y1', size/2);
        this.indicator.setAttribute('stroke', '#007acc');
        this.indicator.setAttribute('stroke-width', '2');
        this.indicator.setAttribute('stroke-linecap', 'round');
        
        this.svg.appendChild(bgCircle);
        this.svg.appendChild(this.valueArc);
        this.svg.appendChild(this.indicator);
        this.svg.appendChild(centerDot);
        
        this.knobContainer.appendChild(this.svg);
        
        this.setupKnobInteraction();
    }

    setupKnobInteraction() {
        let isDragging = false;
        let startAngle = 0;
        let startValue = 0;
        
        const getAngleFromMouse = (e) => {
            const rect = this.svg.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            return angle;
        };
        
        this.svg.addEventListener('mousedown', (e) => {
            isDragging = true;
            startAngle = getAngleFromMouse(e);
            startValue = this.value;
            
            // Enlarge knob on interaction
            this.svg.style.cursor = 'grabbing';
            this.svg.style.transform = 'scale(1.3)';
            this.svg.style.transition = 'transform 0.1s ease';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const currentAngle = getAngleFromMouse(e);
            const angleDiff = currentAngle - startAngle;
            const sensitivity = 0.005; // Reduced sensitivity for better control
            const valueChange = angleDiff * sensitivity * (this.options.max - this.options.min);
            
            let newValue = startValue + valueChange;
            newValue = Math.max(this.options.min, Math.min(this.options.max, newValue));
            newValue = Math.round(newValue / this.options.step) * this.options.step;
            
            this.setValue(newValue);
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                
                // Return knob to normal size
                this.svg.style.cursor = 'grab';
                this.svg.style.transform = 'scale(1)';
                
                // Small delay before removing transition to avoid visual glitch
                setTimeout(() => {
                    this.svg.style.transition = '';
                }, 150);
            }
        });
    }

    getComponentValue(index) {
        if (Array.isArray(this.value)) {
            return this.value[index] || 0;
        } else if (this.value && typeof this.value === 'object') {
            return this.value[this.componentKeys[index]] || 0;
        }
        return 0;
    }

    setComponentValue(index, newValue) {
        // Ensure we have a proper value structure
        if (!this.value) {
            if (Array.isArray(this.target[this.property])) {
                this.value = [...this.target[this.property]];
            } else {
                this.value = {...this.target[this.property]};
            }
        }

        const oldValue = this.isVector ? [...(Array.isArray(this.value) ? this.value : Object.values(this.value))] : this.value;

        // Update the component
        if (Array.isArray(this.value)) {
            this.value[index] = newValue;
        } else if (this.value && typeof this.value === 'object') {
            this.value[this.componentKeys[index]] = newValue;
        }

        // Update target object
        this.target[this.property] = this.value;
        
        // Update display
        this.updateElement();
        
        // Emit change event
        this.emitChange(this.value, oldValue);
    }

    createComponentSVGKnob(container, index, size) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        svg.style.cursor = 'grab';
        
        // Background circle
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', size/2);
        bgCircle.setAttribute('cy', size/2);
        bgCircle.setAttribute('r', size/2 - 2);
        bgCircle.setAttribute('fill', 'none');
        bgCircle.setAttribute('stroke', '#444');
        bgCircle.setAttribute('stroke-width', '1');
        
        // Value arc
        const valueArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        valueArc.setAttribute('fill', 'none');
        valueArc.setAttribute('stroke', '#007acc');
        valueArc.setAttribute('stroke-width', '2');
        valueArc.setAttribute('stroke-linecap', 'round');
        
        // Indicator line
        const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        indicator.setAttribute('x1', size/2);
        indicator.setAttribute('y1', size/2);
        indicator.setAttribute('stroke', '#007acc');
        indicator.setAttribute('stroke-width', '1');
        indicator.setAttribute('stroke-linecap', 'round');
        
        svg.appendChild(bgCircle);
        svg.appendChild(valueArc);
        svg.appendChild(indicator);
        
        container.appendChild(svg);
        
        // Store references for updates
        if (!this.componentKnobs) this.componentKnobs = [];
        this.componentKnobs[index] = { svg, valueArc, indicator, size };
        
        // Setup interaction
        this.setupComponentKnobInteraction(index, svg);
    }

    setupComponentKnobInteraction(index, svg) {
        let isDragging = false;
        let startAngle = 0;
        let startValue = 0;
        
        const getAngleFromMouse = (e) => {
            const rect = svg.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            return angle;
        };
        
        svg.addEventListener('mousedown', (e) => {
            isDragging = true;
            startAngle = getAngleFromMouse(e);
            startValue = this.getComponentValue(index);
            
            svg.style.cursor = 'grabbing';
            svg.style.transform = 'scale(1.2)';
            svg.style.transition = 'transform 0.1s ease';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const currentAngle = getAngleFromMouse(e);
            const angleDiff = currentAngle - startAngle;
            const sensitivity = 0.005;
            const valueChange = angleDiff * sensitivity * (this.options.max - this.options.min);
            
            let newValue = startValue + valueChange;
            newValue = Math.max(this.options.min, Math.min(this.options.max, newValue));
            newValue = Math.round(newValue / this.options.step) * this.options.step;
            
            this.setComponentValue(index, newValue);
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                svg.style.cursor = 'grab';
                svg.style.transform = 'scale(1)';
                setTimeout(() => { svg.style.transition = ''; }, 150);
            }
        });
    }

    async showComponentSliderPopup(index) {
        const rect = this.element.getBoundingClientRect();
        
        const popupData = {
            [this.componentLabels[index]]: {
                type: 'number',
                mode: 'slider',
                value: this.getComponentValue(index),
                min: this.options.min,
                max: this.options.max,
                step: this.options.step,
                precision: this.options.precision,
                onChange: (newValue) => {
                    this.setComponentValue(index, newValue);
                }
            }
        };

        const popup = await PropertyTable.createPopup(popupData, {
            x: rect.left,
            y: rect.bottom + 5,
            width: rect.width,
            onClose: () => {}
        });
    }

    setupEvents() {
        super.setupEvents();
        
        // For scalar controls, setup original events
        if (!this.isVector) {
            if (this.inputElement) {
                this.inputElement.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                        this.setValue(value);
                    }
                });
                
                // Click to open slider popup
                this.inputElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showSliderPopup();
                });
                
                this.inputElement.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        const increment = e.shiftKey ? this.options.step * 10 : this.options.step;
                        const delta = e.key === 'ArrowUp' ? increment : -increment;
                        const newValue = Math.max(this.options.min, 
                            Math.min(this.options.max, this.value + delta));
                        this.setValue(newValue);
                    }
                    if (e.key === 'Enter') {
                        this.inputElement.blur();
                    }
                });
            }
            
            if (this.sliderElement) {
                this.sliderElement.addEventListener('input', (e) => {
                    this.setValue(parseFloat(e.target.value));
                });
            }
        }
        // Vector component events are handled in createComponentControls
    }

    updateElement() {
        if (this.isVector) {
            // Update vector components
            for (let i = 0; i < this.componentCount; i++) {
                const value = this.getComponentValue(i);
                const displayValue = parseFloat(value.toFixed(this.options.precision));
                
                // Update input
                if (this.componentElements && this.componentElements[i]) {
                    this.componentElements[i].value = displayValue;
                }
                
                // Update slider
                if (this.componentSliders && this.componentSliders[i]) {
                    this.componentSliders[i].value = value;
                }
                
                // Update knob
                if (this.componentKnobs && this.componentKnobs[i]) {
                    this.updateComponentKnobVisual(i);
                }
            }
        } else {
            // Update scalar control
            const displayValue = parseFloat(this.value.toFixed(this.options.precision));
            
            if (this.inputElement) {
                this.inputElement.value = displayValue;
            }
            
            if (this.sliderElement) {
                this.sliderElement.value = this.value;
            }
            
            if (this.svg) {
                this.updateKnobVisual();
            }
        }
    }

    updateComponentKnobVisual(index) {
        const knob = this.componentKnobs[index];
        if (!knob) return;
        
        const { svg, valueArc, indicator, size } = knob;
        const center = size / 2;
        const radius = size / 2 - 3;
        
        const value = this.getComponentValue(index);
        const normalized = (value - this.options.min) / (this.options.max - this.options.min);
        const angle = normalized * 300 - 150;
        const radians = (angle * Math.PI) / 180;
        
        // Update indicator line
        const x2 = center + Math.cos(radians) * radius * 0.7;
        const y2 = center + Math.sin(radians) * radius * 0.7;
        indicator.setAttribute('x2', x2);
        indicator.setAttribute('y2', y2);
        
        // Update value arc
        if (normalized > 0) {
            const startAngle = -150;
            const endAngle = startAngle + (normalized * 300);
            const startRadians = (startAngle * Math.PI) / 180;
            const endRadians = (endAngle * Math.PI) / 180;
            
            const x1 = center + Math.cos(startRadians) * radius;
            const y1 = center + Math.sin(startRadians) * radius;
            const x2 = center + Math.cos(endRadians) * radius;
            const y2 = center + Math.sin(endRadians) * radius;
            
            const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
            const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
            valueArc.setAttribute('d', pathData);
        } else {
            valueArc.setAttribute('d', '');
        }
    }

    updateKnobVisual() {
        const size = parseInt(this.svg.getAttribute('width'));
        const center = size / 2;
        const radius = size / 2 - 4;
        
        // Calculate angle (0-360 degrees)
        const normalized = (this.value - this.options.min) / (this.options.max - this.options.min);
        const angle = normalized * 300 - 150; // -150 to +150 degrees
        const radians = (angle * Math.PI) / 180;
        
        // Update indicator line
        const x2 = center + Math.cos(radians) * radius * 0.7;
        const y2 = center + Math.sin(radians) * radius * 0.7;
        this.indicator.setAttribute('x2', x2);
        this.indicator.setAttribute('y2', y2);
        
        // Update value arc
        if (normalized > 0) {
            const startAngle = -150;
            const endAngle = startAngle + (normalized * 300);
            const startRadians = (startAngle * Math.PI) / 180;
            const endRadians = (endAngle * Math.PI) / 180;
            
            const x1 = center + Math.cos(startRadians) * radius;
            const y1 = center + Math.sin(startRadians) * radius;
            const x2 = center + Math.cos(endRadians) * radius;
            const y2 = center + Math.sin(endRadians) * radius;
            
            const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
            
            const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
            this.valueArc.setAttribute('d', pathData);
        } else {
            this.valueArc.setAttribute('d', '');
        }
    }

    async showSliderPopup() {
        // Remove existing popup
        this.removeSliderPopup();
        
        // Get element position for positioning
        const rect = this.element.getBoundingClientRect();
        
        // Create popup data for PropertyTable
        const popupData = {
            [this.options.label || 'Value']: {
                type: 'number',
                mode: 'slider',
                value: this.value,
                min: this.options.min,
                max: this.options.max,
                step: this.options.step,
                precision: this.options.precision,
                onChange: (newValue) => {
                    this.setValue(newValue);
                }
            }
        };

        // Create popup using PropertyTable
        this.sliderPopup = await PropertyTable.createPopup(popupData, {
            x: rect.left,
            y: rect.bottom + 5,
            width: rect.width,
            onClose: () => {
                this.sliderPopup = null;
            }
        });
    }

    removeSliderPopup() {
        if (this.sliderPopup) {
            this.sliderPopup.dispose();
            this.sliderPopup = null;
        }
    }

    showContextMenu(event) {
        // Create expandable context menu below the control
        this.createExpandableContextMenu(event);
    }

    async createExpandableContextMenu(event) {
        // Remove existing context menu
        this.removeContextMenu();
        
        // Get element position for positioning
        const rect = this.element.getBoundingClientRect();
        
        // Create context menu data for PropertyTable
        const contextData = {
            'Min': {
                type: 'number',
                mode: 'input',
                value: this.options.min,
                step: 0.1,
                onChange: (newValue) => {
                    this.options.min = newValue;
                    this.updateConstraints();
                }
            },
            'Max': {
                type: 'number', 
                mode: 'input',
                value: this.options.max,
                step: 0.1,
                onChange: (newValue) => {
                    this.options.max = newValue;
                    this.updateConstraints();
                }
            },
            'Step': {
                type: 'number',
                mode: 'input',
                value: this.options.step,
                min: 0.001,
                max: 1,
                step: 0.001,
                precision: 4,
                onChange: (newValue) => {
                    this.options.step = newValue;
                    this.updateConstraints();
                }
            },
            'Mode': {
                type: 'select',
                value: this.options.mode,
                options: ['input', 'slider', 'knob', 'input+slider'],
                onChange: (newValue) => {
                    this.options.mode = newValue;
                    this.recreateControl();
                }
            }
        };

        // Create context menu using PropertyTable
        this.contextMenu = await PropertyTable.createPopup(contextData, {
            x: rect.left,
            y: rect.bottom + 4,
            width: rect.width,
            onClose: () => {
                this.contextMenu = null;
            }
        });
    }

    updateConstraints() {
        if (this.inputElement) {
            this.inputElement.min = this.options.min;
            this.inputElement.max = this.options.max;
            this.inputElement.step = this.options.step;
        }
        
        if (this.sliderElement) {
            this.sliderElement.min = this.options.min;
            this.sliderElement.max = this.options.max;
            this.sliderElement.step = this.options.step;
        }
        
        // Clamp current value to new constraints
        const clampedValue = Math.max(this.options.min, 
            Math.min(this.options.max, this.value));
        if (clampedValue !== this.value) {
            this.setValue(clampedValue);
        }
    }

    recreateControl() {
        // Clear existing controls
        this.controlContainer.innerHTML = '';
        
        // Recreate with new mode
        this.createControlForMode();
        this.setupEvents();
        this.updateElement();
        
        this.removeContextMenu();
    }

    removeContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.dispose();
            this.contextMenu = null;
        }
    }

    dispose() {
        this.removeSliderPopup();
        this.removeContextMenu();
        super.dispose();
    }
}
