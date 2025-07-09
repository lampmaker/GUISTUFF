<!-- Matthijs Keuper - MIT License -->
# TreeView API

The `TreeView` component provides a lightweight hierarchical view with optional drag and drop support.

## Constructor
```javascript
new TreeView(options)
```

### Options
- **container**: DOM element that receives the tree.
- **data**: Array describing the tree structure.
- **showIcons**: Whether to display expand/type icons.
- **multiSelect**: Enable multi node selection.
- **nodeRenderer**: Optional function `(node, path, state) => HTMLElement` used to render custom node content.
- **toggleDefinitions**: Map of toggle property definitions.
- **toggleOrder**: Ordered list of toggles for the default renderer.
- **nodeTypes**: Map describing node types and allowed children.
- **enableDragDrop**: Enable drag and drop reordering.
- **onSelectionChange(paths, node)**: Callback when selection changes.
- **onNodeExpand(path, expanded)**: Fired when a node is toggled.
- **onToggleClick(...)**: Fired when property toggles are clicked.
- **onNodeDrop(source, target, action, dragged, targetNode)**: Fired during drag and drop operations.

## Methods
- `isNodeExpanded(path)` – check expansion state.
- `getData()` – retrieve the underlying data with modifications.
- `debugPaths()` – log all node paths for debugging.
- `destroy()` – remove the view from the DOM.

Drag and drop operations call `onNodeDrop` with actions `dragstart`, `drop`, `drop_failed` and `dragend`. Reordering is supported by dropping above or below a node. A blue line indicates the drop position.
