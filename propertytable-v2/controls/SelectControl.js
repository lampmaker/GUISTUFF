/**
 * Select Control - A dropdown selection control
 */
import { PropertyControl } from '../core/PropertyControl.js';

export class SelectControl extends PropertyControl {
    constructor(object, property, options = {}) {
        super(object, property, options);
        this.options = options;
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'prop-control prop-select';

        // Create label
        this.labelElement = document.createElement('label');
        this.labelElement.className = 'prop-label';
        this.labelElement.textContent = this.options.label || this.property;

        // Create select element
        this.selectElement = document.createElement('select');
        this.selectElement.className = 'prop-select-input';

        // Add options
        this.options.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            this.selectElement.appendChild(optionElement);
        });

        // Set initial value
        this.selectElement.value = this.value;

        // Add change event
        this.selectElement.addEventListener('change', (e) => {
            this.setValue(e.target.value);
        });

        this.element.appendChild(this.labelElement);
        this.element.appendChild(this.selectElement);

        return this.element;
    }

    updateElement() {
        if (this.selectElement) {
            this.selectElement.value = this.value;
        }
    }
}
