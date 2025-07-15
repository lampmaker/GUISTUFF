# PropertyTable v2 - Modular Implementation

A clean, modular reimplementation of PropertyTable with highly focused, single-purpose controls.

## Architecture

```
propertytable-v2/
├── core/
│   └── PropertyControl.js      # Base class for all controls
├── controls/
│   ├── NumberControl.js        # Number input/slider/knob variants  
│   ├── VectorControl.js        # Vec2/3/4 controls (coming next)
│   ├── StringControl.js        # Text input controls
│   └── ColorControl.js         # Color picker controls
├── themes/
│   └── default.css             # Clean, modern styling
└── demo.js                     # Live demo

```

## Key Design Principles

### 1. **Ultra-Modular Design**
- Each control type has its own file
- Multiple interaction modes per control (input, slider, knob)
- Easy to add new control types

### 2. **Context Menu Innovation**
- **Expandable style** - appears below control like a folder expansion
- **Live editing** - change min/max/step/mode on the fly
- **No popup positioning issues** - always positioned correctly

### 3. **Multiple Interaction Modes**
```javascript
// Number control supports 4 modes:
new NumberControl(obj, 'prop', { mode: 'input' });        // Text input only
new NumberControl(obj, 'prop', { mode: 'slider' });       // Slider only  
new NumberControl(obj, 'prop', { mode: 'knob' });         // Rotating knob
new NumberControl(obj, 'prop', { mode: 'input+slider' }); // Combined
```

### 4. **Compact Design Options**
```javascript
// Vec4 with knobs will be super compact
new VectorControl(obj, 'rotation', { 
  mode: 'knobs',           // 4 mini knobs in a row
  size: 'compact'          // 24px height
});
```

## Current Implementation Status

✅ **Base Architecture** - PropertyControl base class  
✅ **NumberControl** - Complete with input/slider/knob modes  
✅ **Context Menu System** - Expandable style, no positioning issues  
✅ **Theming System** - Clean CSS with CSS custom properties  
✅ **Live Demo** - Working demo with all number modes  

## Next Steps

1. **VectorControl.js** - Vec2/3/4 with multiple knob layouts
2. **StringControl.js** - Text input with multiline support
3. **PropertyContainer.js** - Folder/grouping system
4. **Nested binding system** - Automatic structure detection

## Demo

Open `index.html` to see the NumberControl in action with:
- **Input+Slider combo** for intensity
- **Rotating knob** for roughness  
- **Slider only** for metallic
- **Input only** for speed
- **Right-click context menus** to change modes and constraints

The context menu appears as an expandable panel below each control - no popup positioning headaches!
