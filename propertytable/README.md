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
- Folders drawn as boxes, with an icon before the title.

## Boxes

A box is a folder drawn with a border, rounded corners and a ground of its own, its title larger and in the
input colour. A folder inside a box keeps Tweakpane's look, set in a little.

```javascript
const pane = new PropertyTable({ container, boxes: true });   // every top-level folder a box
const f = pane.addFolder({ title: 'Light', icon: '<svg viewBox="0 0 24 24">...</svg>' });
f.addFolder({ title: 'more' });                                // inside the box: not a box
pane.addFolder({ title: 'Plain', box: false });                // not a box, in a table of boxes
pane.addFolder({ title: 'Inner', box: true });                 // `box: true` makes one at any level
PropertyTable.setIcon(folder, svg);                            // an icon for a folder made elsewhere; null removes it
```

- **icon**: SVG markup, an SVG element, or an image URL. Only its shape counts: it is a mask in the title's colour.
- **The look is custom properties**, read from the table or any ancestor; each unset one falls back to Tweakpane's
  theme: `--pt-box-border-color`, `--pt-box-background-color`, `--pt-box-title-color` (default
  `--tp-input-foreground-color`), `--pt-box-title-font-size` (12.5px), `--pt-box-border-radius` (7px),
  `--pt-box-margin` (8px).
- The rules are embedded once per document, as Tweakpane embeds its own (`style[data-tp-style=plugin-propertytable]`).
- A box does not clip what it holds: a colour picker's popup opened on its last row reaches past its border.

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
