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
- **nodeTypes**: Map describing node types. Per type:
  - `allowedChildren` — the types that may be **dropped** into it, and, unless `addMenu` is
    given, what its `+` offers (flat, "Add <type>").
  - `addMenu` (optional) — what the `+` offers, when that should differ from the drop rule. Each
    entry is a type name, `{ type, label?, value? }`, or `{ label, items: [...] }` for a submenu,
    which opens to the side on hover (or click). A node may override it with its own `addMenu`.
    ```javascript
    addMenu: [
        'folder',
        { label: 'Primitives', items: [
            { label: 'Sphere', type: 'object', value: 'sphere' },
            { label: 'Box',    type: 'object', value: 'box' },
        ] },
    ]
    ```
- **enableDragDrop**: Enable drag and drop reordering.
- **onSelectionChange(paths, node)**: Callback when selection changes.
- **onNodeExpand(path, expanded)**: Fired when a node is toggled.
- **onToggleClick(...)**: Fired when property toggles are clicked.
- **onNodeAdd(parent, newChild, action, childType, value)**: Fired after `+` added a child;
  `value` is what the chosen `addMenu` entry carried (undefined for a plain type).
- **onNodeDrop(source, target, action, dragged, targetNode)**: Fired during drag and drop operations.

## Methods
- `isNodeExpanded(path)` – check expansion state.
- `getData()` – retrieve the underlying data with modifications.
- `debugPaths()` – log all node paths for debugging.
- `destroy()` – remove the view from the DOM.

Drag and drop operations call `onNodeDrop` with actions `dragstart`, `drop`, `drop_failed` and `dragend`. The component no longer auto-expands nodes while dragging. A thick blue line indicates where the dragged item will be inserted.
