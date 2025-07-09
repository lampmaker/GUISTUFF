<!-- Matthijs Keuper - MIT License -->
# SplitPane API

`SplitPane` creates a container with two resizable panels. CSS required for the layout is injected automatically.

## Usage
```javascript
const layout = new SplitPane(container, {
  orientation: 'horizontal',   // 'horizontal' or 'vertical'
  splitRatio: 0.3,             // initial ratio of panel1
  minSize: 100                 // minimum size of each panel in pixels
});
```

### Options on creation
- **panel1** / **panel2**: content or `{title, content}` objects.
- **orientation**: layout direction, defaults to horizontal.
- **splitRatio**: ratio between panels.
- **splitterSize**: width of the draggable splitter.
- **minSize**: minimum panel size in pixels.

### Methods
- `getPanel(index)` – returns the scrollable content element for the panel.
- `setPanel(index, content, opts)` – set the content of a panel.
- `setPanelTitle(index, title)` – show or hide the panel header.
- `setSplit(ratio)` – update the split ratio.
- `setOrientation(horizontal)` – change layout orientation.
- `destroy()` – remove elements and event listeners.

Dragging the splitter updates the ratio in real time. `SplitPane.injectCSS()` can be called manually to inject the stylesheet before constructing any panes.
