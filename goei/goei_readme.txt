extremely simple and compact gui menu, similar to tweakpane or dat.gui but much simpler.
clear separation of data and gui elements:
controls only contains gui creation & callbacks.
goei.js binds the data with the controls.

STYLING SYSTEM:
- All control styling is now integrated into goei-controls.js
- Styles are automatically injected when the module loads
- No external CSS files needed
- Custom styling can be added via addCustomStyles() function
- Style injection can be controlled manually via injectStyles() export