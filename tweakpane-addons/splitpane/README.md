# SplitPane Container System

A comprehensive splitpane container system for creating flexible, resizable layouts in web applications. Designed to work seamlessly with Tweakpane PropertyTable and TreeView components.

## Features

### Core SplitPane Features
- **Draggable splitters** with visual feedback and smooth animations
- **Horizontal and vertical orientations** with easy switching
- **Multiple sizing modes**:
  - `fit-to-parent` - Fills parent container
  - `fit-to-screen` - Fills entire viewport
  - `manual` - Custom width/height
- **Min/max size constraints** for panels with intelligent constraint handling
- **Nested splitpane support** for complex layouts
- **Responsive design** with ResizeObserver for automatic updates
- **Keyboard shortcuts** for quick layout adjustments

### Advanced Features
- **Layout presets** for common UI patterns
- **Layout management** with save/restore functionality  
- **Fluent builder API** for programmatic creation
- **Integration helpers** for PropertyTable and TreeView
- **Breakpoint handling** for responsive behavior
- **Event system** for layout changes and interactions

## Quick Start

### Basic Usage

```javascript
import { SplitPane } from './splitpane/splitpane.js';

// Create a horizontal split
const split = new SplitPane({
    container: document.getElementById('myContainer'),
    orientation: 'horizontal',
    splitRatio: 0.3,
    sizingMode: 'fit-to-parent',
    minSizes: [200, 300]
});

// Add content to panels
split.addToPanel(1, '<h2>Left Panel</h2>');
split.addToPanel(2, '<h2>Right Panel</h2>');
```

### Using Layout Presets

```javascript
import { LayoutPresets } from './splitpane/splitpane-utils.js';

// Create a three-column layout (sidebar | content | properties)
const layout = LayoutPresets.threeColumn(container, {
    main: { splitRatio: 0.25, minSizes: [200, 600] },
    right: { splitRatio: 0.7, minSizes: [400, 300] }
});

// Access panels
layout.sidebar      // Left panel
layout.content      // Center panel  
layout.properties   // Right panel
```

### Using the Builder API

```javascript
import { SplitPaneUtils } from './splitpane/splitpane-utils.js';

const split = SplitPaneUtils.builder(container)
    .horizontal()
    .ratio(0.4)
    .minSizes([250, 400])
    .fitToParent()
    .splitterSize(10)
    .build();
```

## Configuration Options

### SplitPane Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | HTMLElement | document.body | Parent container element |
| `orientation` | string | 'horizontal' | 'horizontal' or 'vertical' |
| `splitRatio` | number | 0.5 | Initial split ratio (0-1) |
| `sizingMode` | string | 'fit-to-parent' | 'manual', 'fit-to-screen', 'fit-to-parent' |
| `width` | string | '100%' | Container width (manual mode) |
| `height` | string | '100%' | Container height (manual mode) |
| `minSizes` | array | [50, 50] | Minimum panel sizes in pixels |
| `maxSizes` | array | [null, null] | Maximum panel sizes in pixels |
| `splitterSize` | number | 8 | Splitter thickness in pixels |

### Layout Preset Options

```javascript
// Three Column Layout
LayoutPresets.threeColumn(container, {
    main: { splitRatio: 0.25, minSizes: [200, 600] },
    right: { splitRatio: 0.7, minSizes: [400, 300] }
});

// IDE Layout
LayoutPresets.ideLayout(container, {
    main: { splitRatio: 0.25 },
    right: { splitRatio: 0.7 }
});

// Dashboard Layout
LayoutPresets.dashboard(container, {
    vertical: { splitRatio: 0.15, maxSizes: [100, null] },
    bottom: { splitRatio: 0.85, maxSizes: [null, 100] },
    main: { splitRatio: 0.2 },
    right: { splitRatio: 0.8 }
});
```

## API Reference

### SplitPane Class

#### Methods

```javascript
// Panel management
addToPanel(panelIndex, content)    // Add content to panel (1 or 2)
getPanel(panelIndex)               // Get panel element

// Layout control
setSplitRatio(ratio)               // Update split ratio (0-1)
setOrientation(orientation)        // Change orientation
setSizingMode(mode)                // Change sizing mode

// Lifecycle
destroy()                          // Clean up and remove
```

### SplitPaneManager Class

```javascript
const manager = new SplitPaneManager();

// Registration
manager.register('main', splitPane);
manager.create('sidebar', container, options);

// Layout management
manager.saveLayout('myLayout');
manager.restoreLayout('myLayout');

// Bulk operations
manager.toggleAllOrientations();
manager.setSizingModeAll('fit-to-screen');
manager.resetAll();
manager.destroyAll();
```

### Integration Helpers

```javascript
import { SplitPaneIntegration } from './splitpane/splitpane-utils.js';

// With PropertyTable
const { split, propertyTable, leftPanel } = SplitPaneIntegration.withPropertyTable(
    container, PropertyTable, options
);

// With TreeView
const { split, treeView, rightPanel } = SplitPaneIntegration.withTreeView(
    container, TreeView, treeData, options
);

// Complete development environment
const env = SplitPaneIntegration.devEnvironment(container, {
    PropertyTable, TreeView
}, {
    treeData: myTreeData,
    main: { splitRatio: 0.25 },
    right: { splitRatio: 0.7 }
});
```

## Keyboard Shortcuts

When enabled, the following keyboard shortcuts are available:

| Shortcut | Action |
|----------|--------|
| `Alt+H` | Switch to horizontal orientation |
| `Alt+V` | Switch to vertical orientation |  
| `Alt+R` | Reset split to 50/50 |
| `Alt+1` | Set split to 25% |
| `Alt+2` | Set split to 50% |
| `Alt+3` | Set split to 75% |

```javascript
// Enable keyboard shortcuts
const removeShortcuts = SplitPaneUtils.addKeyboardShortcuts(splitPane, {
    'Ctrl+Shift+T': () => console.log('Custom shortcut!'),
    // ... custom shortcuts
});

// Clean up when done
removeShortcuts();
```

## Responsive Design

### Breakpoint Handling

```javascript
// Create responsive splitpane
const removeHandler = SplitPaneUtils.createBreakpointHandler(splitPane, [
    [1200, { orientation: 'horizontal', ratio: 0.3 }],
    [768, { orientation: 'vertical', ratio: 0.5 }],
    [480, { orientation: 'vertical', ratio: 0.8 }]
]);

// Clean up
removeHandler();
```

### CSS Media Queries

The splitpane system works well with CSS media queries for styling adjustments:

```css
/* Mobile adjustments */
@media (max-width: 768px) {
    .splitpane-splitter {
        width: 12px !important; /* Larger touch target */
    }
}

/* Hide panels on very small screens */
@media (max-width: 480px) {
    .splitpane-panel-1 {
        display: none;
    }
}
```

## Integration Examples

### With PropertyTable

```javascript
import { PropertyTable } from './propertytable/propertytable.js';

const split = new SplitPane({
    container: document.getElementById('app'),
    orientation: 'horizontal',
    splitRatio: 0.7
});

// Add PropertyTable to right panel
const propertyTable = new PropertyTable({
    container: split.getPanel(2),
    title: 'Properties',
    expanded: true
});

const sampleObject = {
    name: "My Object",
    position: { x: 1, y: 2, z: 3 },
    color: '#ff0000',
    enabled: true
};

propertyTable.bindControls(sampleObject);
```

### With TreeView

```javascript
import { TreeView } from './treeview/treeview.js';

const split = new SplitPane({
    container: document.getElementById('app'),
    orientation: 'horizontal',
    splitRatio: 0.3
});

// Add TreeView to left panel
const treeView = new TreeView({
    container: split.getPanel(1),
    data: [
        {
            label: 'Project',
            children: [
                { label: 'src', children: [
                    { label: 'main.js' },
                    { label: 'utils.js' }
                ]},
                { label: 'package.json' }
            ]
        }
    ],
    onSelectionChange: (paths, node) => {
        console.log('Selected:', node?.label);
    }
});
```

## Advanced Usage

### Complex Nested Layouts

```javascript
// Create a development environment layout
const mainSplit = new SplitPane({
    container: document.getElementById('app'),
    orientation: 'horizontal',
    splitRatio: 0.25,
    minSizes: [200, 500]
});

// Right side: editor above, tools below
const rightSplit = new SplitPane({
    container: mainSplit.getPanel(2),
    orientation: 'vertical',
    splitRatio: 0.7,
    minSizes: [300, 200]
});

// Bottom right: console and properties
const bottomSplit = new SplitPane({
    container: rightSplit.getPanel(2),
    orientation: 'horizontal',
    splitRatio: 0.6,
    minSizes: [200, 200]
});

// Result: sidebar | (editor / (console | properties))
```

### Custom Styling

```css
/* Custom splitter appearance */
.splitpane-splitter {
    background: linear-gradient(45deg, #333, #555);
    position: relative;
}

.splitpane-splitter:hover {
    background: linear-gradient(45deg, #555, #777);
}

.splitpane-splitter::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 20px;
    background: #888;
    border-radius: 2px;
}

/* Custom panel styling */
.splitpane-panel {
    border: 1px solid #404040;
    border-radius: 4px;
    background: #252526;
}
```

## Demo Files

1. **`splitpane-demo.html`** - Basic demo showing splitpane with PropertyTable and TreeView
2. **`advanced-splitpane-demo.html`** - Comprehensive demo with all layout presets and features

## File Structure

```
splitpane/
├── splitpane.js           # Core SplitPane class
├── splitpane-utils.js     # Utilities, presets, and helpers
│
treeview/
├── treeview.js           # TreeView component
│
splitpane-demo.html       # Basic demo
advanced-splitpane-demo.html # Advanced demo with all features
```

## Browser Support

- Chrome 60+
- Firefox 55+  
- Safari 12+
- Edge 79+

Requires ES6 module support and ResizeObserver API.

## License

This project is part of the Tweakpane addons collection and follows the same licensing terms.
