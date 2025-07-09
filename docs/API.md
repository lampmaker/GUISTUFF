# API Overview

This page provides a short reference for the main classes exported by the examples.

## SplitPane

```
new SplitPane(options)
```

Creates a container with two resizable panels.

**Options**

| Name | Type | Description |
| --- | --- | --- |
| `container` | HTMLElement | Element that will host the layout |
| `orientation` | `'horizontal'` \| `'vertical'` | Direction of the splitter |
| `splitRatio` | number | Initial ratio between panels (0-1) |
| `minSizes` | number[] | Minimum pixel sizes for panels |

Panels can be accessed with `getPanel(index)` where `index` is `1` or `2`.

## PropertyTable

```
new PropertyTable(options)
```

Extends Tweakpane with context menus and multiline text fields.

**Important options**

- `container` – parent element
- `title` – optional section header
- `expanded` – start opened or collapsed

## TreeView

```
new TreeView(options)
```

Displays hierarchical data with expandable nodes.

**Common options**

- `container` – element that receives the tree
- `data` – array describing nodes `{ label, children }`
- `onSelectionChange(paths, node)` – callback when a node is selected

## Additional Resources

See the inline comments in each source file for more advanced methods and events.
