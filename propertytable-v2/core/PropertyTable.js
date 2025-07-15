// Copyright (c) 2025 Matthijs Keuper
// SPDX-License-Identifier: MIT

/**
 * PropertyTable - Main container for property controls
 * A clean, modular implementation with recursive popup support
 */
import { PropertyControl } from './PropertyControl.js';
import { SelectControl } from '../controls/SelectControl.js';

export class PropertyTable {
    constructor(options = {}) {
        this.options = {
            container: options.container || document.body,
            title: options.title || '',
            expanded: options.expanded !== false,
            ...options
        };
        
        this.controls = new Map();
        this.disposed = false;
        
        this.createElement();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'prop-table';
        
        if (this.options.title) {
            this.titleElement = document.createElement('div');
            this.titleElement.className = 'prop-table-title';
            this.titleElement.textContent = this.options.title;
            this.element.appendChild(this.titleElement);
        }
        
        this.containerElement = document.createElement('div');
        this.containerElement.className = 'prop-table-container';
        this.element.appendChild(this.containerElement);
        
        if (this.options.container) {
            this.options.container.appendChild(this.element);
        }
    }

    /**
     * Add a control to the property table
     */
    addControl(control) {
        if (!(control instanceof PropertyControl)) {
            throw new Error('Control must be an instance of PropertyControl');
        }
        
        const key = `${control.property}_${Date.now()}`;
        this.controls.set(key, control);
        this.containerElement.appendChild(control.getElement());
        
        return control;
    }

    /**
     * Create and add a number control
     */
    addNumber(target, property, options = {}) {
        // Import dynamically to avoid circular dependencies
        return import('../controls/NumberControl.js').then(({ NumberControl }) => {
            const control = new NumberControl(target, property, options);
            return this.addControl(control);
        });
    }

    /**
     * Create and add a select control
     */
    addSelect(target, property, options = {}) {
        const control = new SelectControl(target, property, options);
        return this.addControl(control);
    }

    /**
     * Bind multiple properties at once
     */
    bind(target, properties, options = {}) {
        const promises = [];
        
        Object.entries(properties).forEach(([property, value]) => {
            const propOptions = options[property] || {};
            
            // Auto-detect control type
            if (typeof value === 'number') {
                promises.push(this.addNumber(target, property, propOptions));
            }
            // Add more types as needed
        });
        
        return Promise.all(promises);
    }

    /**
     * Remove a control
     */
    removeControl(control) {
        for (const [key, ctrl] of this.controls) {
            if (ctrl === control) {
                ctrl.dispose();
                this.controls.delete(key);
                break;
            }
        }
    }

    /**
     * Clear all controls
     */
    clear() {
        this.controls.forEach(control => control.dispose());
        this.controls.clear();
        this.containerElement.innerHTML = '';
    }

    /**
     * Get the DOM element
     */
    getElement() {
        return this.element;
    }

    /**
     * Dispose of the property table
     */
    dispose() {
        if (this.disposed) return;
        
        this.clear();
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.disposed = true;
    }

    /**
     * Create a popup PropertyTable positioned with controls
     */
    static async createPopup(data, options = {}) {
        const popup = new PropertyTable({
            title: options.title || '',
            container: null // Don't auto-append
        });
        
        // Add popup-specific styling
        popup.element.className += ' prop-table-popup';
        
        // Position the popup
        popup.element.style.position = 'fixed';
        popup.element.style.left = (options.x || 0) + 'px';
        popup.element.style.top = (options.y || 0) + 'px';
        popup.element.style.width = (options.width || 200) + 'px';
        popup.element.style.zIndex = '1000';
        
        document.body.appendChild(popup.element);
        
        // Create temporary object to bind controls to
        const tempObject = {};
        
        // Add controls for each data entry
        const controlPromises = Object.entries(data).map(async ([label, config]) => {
            tempObject[label] = config.value;
            
            if (config.type === 'number') {
                const control = await popup.addNumber(tempObject, label, {
                    label: label,
                    mode: config.mode || 'input',
                    min: config.min,
                    max: config.max,
                    step: config.step,
                    precision: config.precision
                });
                
                // Register the onChange callback if provided
                if (config.onChange) {
                    control.onChange((event) => {
                        config.onChange(event.value);
                    });
                }
                
                return control;
            } else if (config.type === 'select') {
                const control = popup.addSelect(tempObject, label, {
                    label: label,
                    options: config.options
                });
                
                // Register the onChange callback if provided
                if (config.onChange) {
                    control.onChange((event) => {
                        config.onChange(event.value);
                    });
                }
                
                return control;
            }
        });
        
        // Wait for all controls to be created
        await Promise.all(controlPromises);
        
        // Auto-cleanup on click outside
        popup._cleanupHandler = (event) => {
            if (!popup.element.contains(event.target)) {
                popup.dispose();
                if (options.onClose) {
                    options.onClose();
                }
            }
        };
        
        popup._keydownHandler = (event) => {
            if (event.key === 'Escape') {
                popup.dispose();
                if (options.onClose) {
                    options.onClose();
                }
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', popup._cleanupHandler);
            document.addEventListener('keydown', popup._keydownHandler);
        }, 0);
        
        // Override dispose to clean up event listeners
        const originalDispose = popup.dispose.bind(popup);
        popup.dispose = () => {
            document.removeEventListener('click', popup._cleanupHandler);
            document.removeEventListener('keydown', popup._keydownHandler);
            originalDispose();
        };
        
        return popup;
    }
}
