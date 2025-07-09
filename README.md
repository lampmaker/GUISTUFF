# Tweakpane Addons Examples

This repository contains a small collection of experimental UI widgets built on top of [Tweakpane](https://cocopon.github.io/tweakpane/). The code demonstrates how to integrate a property table, tree view, and a flexible split-pane container. A few HTML files in the root folder showcase these components in action.

## Getting Started

No build step is required. Open any of the HTML files in a modern browser that supports ES6 modules:

- `example.html` – a basic property table and split pane demo
- `splitpane-demo.html` – minimal split pane usage
- `advanced-splitpane-demo.html` – complex layouts with presets

If your browser restricts module loading from the local file system, start a tiny HTTP server:

```bash
python3 -m http.server
```

Then navigate to `http://localhost:8000` and open the desired demo file.

## Directory Overview

- `propertytable/` – enhanced Tweakpane with context menus and syntax highlighting
- `treeview/` – a lightweight hierarchical view component
- `splitpane/` – resizable panel container with layout helpers
- `tweakpane-addons/` – placeholder directory for packaging
- `tweakpanemultitool_pending_deletion/` – legacy experiments

See `splitpane/README.md` for an in‑depth guide to the split pane module.

## Basic Usage

```javascript
import { PropertyTable } from './propertytable/propertytable.js';
import { TreeView } from './treeview/treeview.js';
import { SplitPane } from './splitpane/splitpane.js';

// create a horizontal split pane
const layout = new SplitPane({
  container: document.getElementById('root'),
  orientation: 'horizontal',
  splitRatio: 0.3,
});

// left panel with a tree view
new TreeView({
  container: layout.getPanel(1),
  data: [{ label: 'Item 1' }, { label: 'Item 2' }],
});

// right panel with a property table
new PropertyTable({
  container: layout.getPanel(2),
  title: 'Properties',
  expanded: true,
});
```

## License

The code in this repository follows the same licensing terms as Tweakpane. See the individual file headers for details.

