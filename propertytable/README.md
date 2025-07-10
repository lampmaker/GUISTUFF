<!-- Matthijs Keuper - MIT License -->
# PropertyTable API

`PropertyTable` extends Tweakpane and exposes utilities for quickly binding objects to interactive controls.

## Creating
```javascript
import { PropertyTable } from './propertytable/propertytable.js';
const pane = new PropertyTable(options);
```

## Features
- Context menus for each binding with type specific options.
- Automatic detection of binding types.
- Multiline text fields with syntax highlighting.
- Line numbers support for multiline text fields.
- Folder helpers for adding and removing child objects.

## Multiline Text with Line Numbers

For multiline text fields, you can enable line numbers by setting the `lineNumbers` option:

```javascript
const options = {
    myCode: {
        multiline: true,
        rows: 12,
        highlighting: 'glsl',  // Optional syntax highlighting
        lineNumbers: true      // Enable line numbers
    }
};

pane.bindControls(myObject, options);
```

## Key Methods
- `bindControls(object, options, onClick)` – bind multiple properties at once.
- `addBinding(target, key, options)` – overridden to inject custom behaviour.
- `addFolder(params)` – create folders that automatically bind child objects.
- `bindingPrepper` and `bindingModifier` – hooks used internally when creating bindings.

The pane inherits all base methods from Tweakpane. Use `destroy()` when finished to remove any DOM elements and listeners.
