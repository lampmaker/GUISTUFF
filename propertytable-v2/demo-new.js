// Copyright (c) 2025 Matthijs Keuper
// SPDX-License-Identifier: MIT

/**
 * Demo to test NumberControl auto-detection capabilities
 */
import { NumberControl } from './controls/NumberControl.js';

// Test object with various value types to demonstrate auto-detection
const testObject = {
    // Scalar values
    intensity: 0.5,
    
    // Array vectors
    position: [1.0, 2.0],           // vec2
    size: [1.0, 1.0, 1.0],         // vec3  
    rotation: [0.0, 0.0, 0.0, 1.0], // vec4 (quaternion)
    
    // Object vectors  
    color: { r: 0.8, g: 0.4, b: 0.2 }  // vec3 as object
};

// Get containers
const container = document.getElementById('controls-container');
const dataDisplay = document.getElementById('data-display');

if (!container || !dataDisplay) {
    console.error('Required containers not found! Make sure demo.html has the correct structure.');
} else {
    console.log('Creating auto-detecting controls...');

    const controls = [
        new NumberControl(testObject, 'intensity', {
            label: 'Intensity (scalar)',
            mode: 'input+slider'
        }),
        
        new NumberControl(testObject, 'position', {
            label: 'Position (array vec2)',
            mode: 'input'
        }),
        
        new NumberControl(testObject, 'color', {
            label: 'Color (object vec3)',
            mode: 'slider'
        }),
        
        new NumberControl(testObject, 'size', {
            label: 'Size (array vec3)', 
            mode: 'knob'
        }),
        
        new NumberControl(testObject, 'rotation', {
            label: 'Rotation (array vec4)',
            mode: 'input'
        })
    ];

    // Add controls to container
    controls.forEach(control => {
        container.appendChild(control.getElement());
        
        // Add change listener
        control.onChange((event) => {
            console.log(`${event.property} changed from ${event.oldValue} to ${event.value}`);
            updateDisplay();
        });
    });

    function updateDisplay() {
        dataDisplay.textContent = JSON.stringify(testObject, null, 2);
    }

    // Initial display
    updateDisplay();

    // Log the auto-detection results
    console.log('Auto-detection results:');
    controls.forEach(control => {
        console.log(`${control.property}: ${control.isVector ? `vector (${control.componentCount} components)` : 'scalar'}`);
    });
}
