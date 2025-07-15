// Copyright (c) 2025 Matthijs Keuper
// SPDX-License-Identifier: MIT

/**
 * Number Control - Base class for numeric controls
 * Supports different interaction modes: input, slider, knob
 */
import { PropertyControl } from '../core/PropertyControl.js';

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

    createElement() {
        this.element = document.createElement('div');
        this.element.className = `prop-control prop-number prop-number--${this.options.mode} prop-number--${this.options.size}`;
        
        // Create label
        this.labelElement = document.createElement('label');
        this.labelElement.className = 'prop-label';
        this.labelElement.textContent = this.options.label;
        
        // Create control container
        this.controlContainer = document.createElement('div');
        this.controlContainer.className = 'prop-control-container';
        
        // Create the appropriate control based on mode
        this.createControlForMode();
        
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

    setupEvents() {
        super.setupEvents();
        
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

    updateElement() {
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

    showSliderPopup() {
        // Remove existing popup
        this.removeSliderPopup();
        
        // Create popup container
        this.sliderPopup = document.createElement('div');
        this.sliderPopup.className = 'prop-slider-popup';
        
        // Position below the control and match the full control width
        const rect = this.element.getBoundingClientRect();
        this.sliderPopup.style.position = 'absolute';
        this.sliderPopup.style.top = (rect.bottom + 4) + 'px';
        this.sliderPopup.style.left = rect.left + 'px';
        this.sliderPopup.style.width = rect.width + 'px';
        this.sliderPopup.style.zIndex = '1000';
        
        // Create slider
        this.popupSlider = document.createElement('input');
        this.popupSlider.type = 'range';
        this.popupSlider.className = 'prop-number-slider'; // Use same class as regular slider
        this.popupSlider.min = this.options.min;
        this.popupSlider.max = this.options.max;
        this.popupSlider.step = this.options.step;
        this.popupSlider.value = this.value;
        
        // Create value display
        this.popupValueDisplay = document.createElement('div');
        this.popupValueDisplay.className = 'prop-popup-value';
        this.popupValueDisplay.textContent = this.value.toFixed(this.options.precision);
        
        this.sliderPopup.appendChild(this.popupSlider);
        this.sliderPopup.appendChild(this.popupValueDisplay);
        
        document.body.appendChild(this.sliderPopup);
        
        // Setup slider events - same as regular slider
        this.popupSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.setValue(value);
            this.popupValueDisplay.textContent = value.toFixed(this.options.precision);
        });
        
        // Add keyboard support like regular controls
        this.popupSlider.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                const increment = e.shiftKey ? this.options.step * 10 : this.options.step;
                const delta = e.key === 'ArrowUp' ? increment : -increment;
                const newValue = Math.max(this.options.min, 
                    Math.min(this.options.max, this.value + delta));
                this.setValue(newValue);
                this.popupSlider.value = newValue;
                this.popupValueDisplay.textContent = newValue.toFixed(this.options.precision);
            }
        });
        
        // Close on click outside or escape
        setTimeout(() => {
            document.addEventListener('click', this.handleSliderPopupClose);
            document.addEventListener('keydown', this.handleSliderPopupKeydown);
        }, 0);
        
        // Focus the slider for immediate keyboard control
        this.popupSlider.focus();
    }

    removeSliderPopup() {
        if (this.sliderPopup) {
            document.removeEventListener('click', this.handleSliderPopupClose);
            document.removeEventListener('keydown', this.handleSliderPopupKeydown);
            
            if (this.sliderPopup.parentNode) {
                this.sliderPopup.parentNode.removeChild(this.sliderPopup);
            }
            this.sliderPopup = null;
            this.popupSlider = null;
            this.popupValueDisplay = null;
        }
    }

    handleSliderPopupClose = (event) => {
        if (this.sliderPopup && !this.sliderPopup.contains(event.target) && 
            event.target !== this.inputElement) {
            this.removeSliderPopup();
        }
    }

    handleSliderPopupKeydown = (event) => {
        if (event.key === 'Escape') {
            this.removeSliderPopup();
        }
    }

    showContextMenu(event) {
        // Create expandable context menu below the control
        this.createExpandableContextMenu(event);
    }

    createExpandableContextMenu(event) {
        // Remove existing context menu
        this.removeContextMenu();
        
        // Create context menu container
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'prop-context-menu prop-context-menu--expandable';
        
        // Position below the control - use same positioning as slider popup
        const rect = this.element.getBoundingClientRect();
        this.contextMenu.style.position = 'absolute';
        this.contextMenu.style.top = (rect.bottom + 4) + 'px';
        this.contextMenu.style.left = rect.left + 'px';
        this.contextMenu.style.width = rect.width + 'px'; // Changed from minWidth to width
        this.contextMenu.style.zIndex = '1000';
        
        // Add controls for min/max/step
        this.addContextMenuControls();
        
        document.body.appendChild(this.contextMenu);
        
        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', this.handleContextMenuClose);
        }, 0);
    }

    addContextMenuControls() {
        const controls = [
            { label: 'Min', property: 'min', value: this.options.min },
            { label: 'Max', property: 'max', value: this.options.max },
            { label: 'Step', property: 'step', value: this.options.step }
        ];
        
        controls.forEach(({ label, property, value }) => {
            const row = document.createElement('div');
            row.className = 'prop-context-row';
            
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            labelEl.className = 'prop-context-label';
            
            const input = document.createElement('input');
            input.type = 'number';
            input.value = value;
            input.className = 'prop-context-input';
            input.step = property === 'step' ? 0.001 : 0.1;
            
            input.addEventListener('change', () => {
                this.options[property] = parseFloat(input.value);
                this.updateConstraints();
            });
            
            row.appendChild(labelEl);
            row.appendChild(input);
            this.contextMenu.appendChild(row);
        });
        
        // Add mode selector
        const modeRow = document.createElement('div');
        modeRow.className = 'prop-context-row';
        
        const modeLabel = document.createElement('label');
        modeLabel.textContent = 'Mode';
        modeLabel.className = 'prop-context-label';
        
        const modeSelect = document.createElement('select');
        modeSelect.className = 'prop-context-select';
        
        const modes = ['input', 'slider', 'knob', 'input+slider'];
        modes.forEach(mode => {
            const option = document.createElement('option');
            option.value = mode;
            option.textContent = mode;
            option.selected = mode === this.options.mode;
            modeSelect.appendChild(option);
        });
        
        modeSelect.addEventListener('change', () => {
            this.options.mode = modeSelect.value;
            this.recreateControl();
        });
        
        modeRow.appendChild(modeLabel);
        modeRow.appendChild(modeSelect);
        this.contextMenu.appendChild(modeRow);
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
            document.removeEventListener('click', this.handleContextMenuClose);
            if (this.contextMenu.parentNode) {
                this.contextMenu.parentNode.removeChild(this.contextMenu);
            }
            this.contextMenu = null;
        }
    }

    handleContextMenuClose = (event) => {
        if (this.contextMenu && !this.contextMenu.contains(event.target)) {
            this.removeContextMenu();
        }
    }

    dispose() {
        this.removeSliderPopup();
        this.removeContextMenu();
        super.dispose();
    }
}
