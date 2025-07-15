// Copyright (c) 2025 Matthijs Keuper
// SPDX-License-Identifier: MIT

/**
 * Base PropertyControl class
 * All property controls inherit from this base class
 */
export class PropertyControl {
    constructor(target, property, options = {}) {
        this.target = target;
        this.property = property;
        this.options = { ...this.getDefaultOptions(), ...options };
        this.element = null;
        this.disposed = false;
        this.changeCallbacks = new Set();
        
        this.value = this.target[this.property];
        this.init();
    }

    /**
     * Override in subclasses to provide default options
     */
    getDefaultOptions() {
        return {
            label: this.property,
            disabled: false,
            contextMenu: true
        };
    }

    /**
     * Initialize the control - override in subclasses
     */
    init() {
        this.createElement();
        this.setupEvents();
        this.update();
    }

    /**
     * Create the DOM element - must be implemented in subclasses
     */
    createElement() {
        throw new Error('createElement must be implemented in subclass');
    }

    /**
     * Setup event listeners - override in subclasses
     */
    setupEvents() {
        // Base implementation - can be extended
    }

    /**
     * Update the control to reflect current value
     */
    update() {
        this.value = this.target[this.property];
        this.updateElement();
    }

    /**
     * Update the DOM element - override in subclasses
     */
    updateElement() {
        // Override in subclasses
    }

    /**
     * Set the value and update target object
     */
    setValue(newValue) {
        const oldValue = this.value;
        this.value = newValue;
        this.target[this.property] = newValue;
        this.updateElement();
        this.emitChange(newValue, oldValue);
    }

    /**
     * Get current value
     */
    getValue() {
        return this.value;
    }

    /**
     * Add change listener
     */
    onChange(callback) {
        this.changeCallbacks.add(callback);
        return this; // For chaining
    }

    /**
     * Remove change listener
     */
    offChange(callback) {
        this.changeCallbacks.delete(callback);
        return this;
    }

    /**
     * Emit change event
     */
    emitChange(newValue, oldValue) {
        const event = {
            control: this,
            property: this.property,
            value: newValue,
            oldValue: oldValue,
            target: this.target
        };

        this.changeCallbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.warn('Error in change callback:', error);
            }
        });
    }

    /**
     * Enable/disable the control
     */
    setDisabled(disabled) {
        this.options.disabled = disabled;
        if (this.element) {
            this.element.classList.toggle('disabled', disabled);
            // Disable all input elements
            this.element.querySelectorAll('input, button, select').forEach(el => {
                el.disabled = disabled;
            });
        }
    }

    /**
     * Show/hide the control
     */
    setVisible(visible) {
        if (this.element) {
            this.element.style.display = visible ? '' : 'none';
        }
    }

    /**
     * Get the DOM element
     */
    getElement() {
        return this.element;
    }

    /**
     * Dispose of the control and clean up
     */
    dispose() {
        if (this.disposed) return;
        
        this.changeCallbacks.clear();
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.disposed = true;
    }

    /**
     * Create a context menu for this control
     */
    createContextMenu() {
        // Will be implemented when we add context menu system
        console.log('Context menu not yet implemented');
    }
}
