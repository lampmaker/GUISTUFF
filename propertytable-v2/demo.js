// Copyright (c) 2025 Matthijs Keuper
// SPDX-License-Identifier: MIT

/**
 * Simple demo to test the NumberControl
 */
import { NumberControl } from './controls/NumberControl.js';

// Test object
const testObject = {
    intensity: 0.5,
    roughness: 0.3,
    metallic: 0.0,
    speed: 10.0
};

// Create container
const container = document.createElement('div');
container.style.width = '400px';
container.style.margin = '20px';
container.style.fontFamily = 'Arial, sans-serif';
document.body.appendChild(container);

// Add title
const title = document.createElement('h2');
title.textContent = 'PropertyTable v2 - NumberControl Demo';
title.style.color = '#e0e0e0';
title.style.marginBottom = '20px';
container.appendChild(title);

// Load CSS
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = './themes/default.css';
document.head.appendChild(link);

// Create controls with different modes
const controls = [
    new NumberControl(testObject, 'intensity', {
        label: 'Intensity',
        mode: 'input+slider',
        min: 0,
        max: 1,
        step: 0.01
    }),
    
    new NumberControl(testObject, 'roughness', {
        label: 'Roughness',
        mode: 'knob',
        min: 0,
        max: 1,
        step: 0.01,
        size: 'compact'
    }),
    
    new NumberControl(testObject, 'metallic', {
        label: 'Metallic',
        mode: 'slider',
        min: 0,
        max: 1,
        step: 0.01
    }),
    
    new NumberControl(testObject, 'speed', {
        label: 'Speed',
        mode: 'input',
        min: 0,
        max: 100,
        step: 0.1,
        precision: 1
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

// Add live data display
const dataDisplay = document.createElement('pre');
dataDisplay.style.background = '#1a1a1a';
dataDisplay.style.color = '#e0e0e0';
dataDisplay.style.padding = '10px';
dataDisplay.style.borderRadius = '4px';
dataDisplay.style.marginTop = '20px';
dataDisplay.style.fontSize = '12px';
container.appendChild(dataDisplay);

function updateDisplay() {
    dataDisplay.textContent = JSON.stringify(testObject, null, 2);
}

// Initial display
updateDisplay();

// Add instructions
const instructions = document.createElement('div');
instructions.innerHTML = `
<h3 style="color: #e0e0e0; margin-top: 20px;">Instructions:</h3>
<ul style="color: #a0a0a0; font-size: 14px;">
  <li><strong>Right-click</strong> any control to open context menu</li>
  <li><strong>Knob:</strong> Click and drag to rotate</li>
  <li><strong>Slider:</strong> Drag to change value</li>
  <li><strong>Input:</strong> Type or use arrow keys</li>
  <li><strong>Context Menu:</strong> Change min/max/step and interaction mode</li>
</ul>
`;
container.appendChild(instructions);
