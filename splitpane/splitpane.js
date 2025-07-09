// Copyright (c) 2024 Matthijs Keuper
// SPDX-License-Identifier: MIT
/**
 * Simple SplitPane Container
 * A minimal, easy-to-use splitpane implementation
 * CSS is automatically injected - no external CSS file needed!
 * 
 * USAGE:
 * 
 * Basic usage:
 *   const split = new SplitPane(container, {
 *     orientation: 'horizontal',  // or 'vertical'
 *     splitRatio: 0.3,           // 30% left/top, 70% right/bottom
 *     minSize: 200               // minimum panel size in pixels
 *   });
 * 
 * Set content (getPanel always returns scrollable content area):
 *   split.setPanel(1, '<div>Left panel content</div>');
 *   split.setPanel(2, domElement);
 *   new TreeView({ container: split.getPanel(1), data: treeData });
 * 
 * Set content with titles:
 *   split.setPanel(1, myContent, { title: 'Explorer' });
 *   split.setPanelTitle(2, 'Properties'); // Set title separately
 * 
 * Set content during creation:
 *   const split = new SplitPane(container, {
 *     panel1: { title: 'Explorer', content: myTreeView },
 *     panel2: { title: 'Properties', content: myPropertyTable }
 *   });
 * 
 * Access content areas (always returns .scrollable-content):
 *   const leftContent = split.getPanel(1);   // Always scrollable content
 *   const rightContent = split.getPanel(2);  // Always scrollable content
 * 
 * Control the split:
 *   split.setSplit(0.5);              // 50/50 split
 *   split.setOrientation(true);       // horizontal
 *   split.destroy();                  // cleanup
 * 
 * 
 * // Show/hide titles dynamically
 * split.setPanelTitle(1, 'Explorer');     // Show title
 *  split.setPanelTitle(1, null);      
 */


export class SplitPane {
    static cssInjected = false;
    
    static injectCSS() {
        if (SplitPane.cssInjected) return;
        
        const css = `
/* SplitPane Core CSS - Essential styles only */
.splitpane-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
}

.splitpane-panel {
    position: absolute;
    overflow: hidden;
    box-sizing: border-box;
}

.splitpane-splitter {
    position: absolute;
    background-color: #3a3a3a;
    user-select: none;
    transition: background-color 0.2s ease;
    z-index: 1000;
}

.splitpane-splitter:hover {
    background-color: #555;
}

.splitpane-splitter.dragging {
    background-color: #007acc;
}

.splitpane-splitter.horizontal {
    cursor: col-resize;
}

.splitpane-splitter.vertical {
    cursor: row-resize;
}

/* Panel Structure - Used internally by SplitPane */
.panel-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.panel-header {
    background-color: #333;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 500;
    border-bottom: 1px solid #404040;
    flex-shrink: 0;
}

.scrollable-content {
    overflow: auto;
    flex: 1;
}
        `;
        
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        SplitPane.cssInjected = true;
    }

    constructor(container, options = {}) {
        // Auto-inject CSS on first use
        SplitPane.injectCSS();
        
        this.container = container;
        this.isHorizontal = options.orientation !== 'vertical';
        this.splitRatio = options.splitRatio || 0.5;
        this.splitterSize = options.splitterSize || 8;
        this.minSize = options.minSize || 50;
        
        this.isDragging = false;
        this.startPos = 0;
        this.startRatio = 0;
        
        this.init();
        
        // Set initial content if provided
        if (options.panel1) {
            if (typeof options.panel1 === 'object' && options.panel1.title) {
                this.setPanelTitle(1, options.panel1.title);
                this.setPanel(1, options.panel1.content);
            } else {
                this.setPanel(1, options.panel1);
            }
        }
        if (options.panel2) {
            if (typeof options.panel2 === 'object' && options.panel2.title) {
                this.setPanelTitle(2, options.panel2.title);
                this.setPanel(2, options.panel2.content);
            } else {
                this.setPanel(2, options.panel2);
            }
        }
    }
    
    init() {



        // Create elements
        this.element = document.createElement('div');
        this.element.className = 'splitpane-container';
        
        this.panel1 = this.createPanel();
        this.panel2 = this.createPanel();
        
        this.splitter = document.createElement('div');
        this.splitter.className = `splitpane-splitter ${this.isHorizontal ? 'horizontal' : 'vertical'}`;
        
        // Append to DOM
        this.element.appendChild(this.panel1);
        this.element.appendChild(this.splitter);
        this.element.appendChild(this.panel2);
        this.container.appendChild(this.element);
        
        // Setup events
        this.splitter.addEventListener('mousedown', e => this.startDrag(e));
        document.addEventListener('mousemove', e => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());
        
        // Initial layout
        this.updateLayout();
        
        // Resize observer
        if (window.ResizeObserver) {
            new ResizeObserver(() => this.updateLayout()).observe(this.container);
        }
    }
    
    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'splitpane-panel';
        
        // Always create wrapper structure
        const wrapper = document.createElement('div');
        wrapper.className = 'panel-wrapper';
        
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.style.height = '0px'; // Hidden by default
        header.style.overflow = 'hidden';
        header.style.padding = '0px'; // No padding when hidden
        
        const content = document.createElement('div');
        content.className = 'scrollable-content';
        
        wrapper.appendChild(header);
        wrapper.appendChild(content);
        panel.appendChild(wrapper);
        
        return panel;
    }
    
    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.startPos = this.isHorizontal ? e.clientX : e.clientY;
        this.startRatio = this.splitRatio;
        this.splitter.classList.add('dragging');
        document.body.style.userSelect = 'none';
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        const currentPos = this.isHorizontal ? e.clientX : e.clientY;
        const containerSize = this.isHorizontal ? this.element.clientWidth : this.element.clientHeight;
        const delta = currentPos - this.startPos;
        const deltaRatio = delta / containerSize;
        
        let newRatio = this.startRatio + deltaRatio;
        
        // Apply constraints
        const minRatio = this.minSize / containerSize;
        const maxRatio = 1 - (this.minSize / containerSize);
        newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
        
        this.splitRatio = newRatio;
        this.updateLayout();
    }
    
    endDrag() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.splitter.classList.remove('dragging');
        document.body.style.userSelect = '';
    }
    
    updateLayout() {
        const w = this.element.clientWidth;
        const h = this.element.clientHeight;
        const s = this.splitterSize;
        
        if (this.isHorizontal) {
            const leftW = Math.floor((w - s) * this.splitRatio);
            const rightW = w - leftW - s;
            
            Object.assign(this.panel1.style, { left: '0', top: '0', width: leftW + 'px', height: h + 'px' });
            Object.assign(this.splitter.style, { left: leftW + 'px', top: '0', width: s + 'px', height: h + 'px' });
            Object.assign(this.panel2.style, { left: (leftW + s) + 'px', top: '0', width: rightW + 'px', height: h + 'px' });
        } else {
            const topH = Math.floor((h - s) * this.splitRatio);
            const bottomH = h - topH - s;
            
            Object.assign(this.panel1.style, { left: '0', top: '0', width: w + 'px', height: topH + 'px' });
            Object.assign(this.splitter.style, { left: '0', top: topH + 'px', width: w + 'px', height: s + 'px' });
            Object.assign(this.panel2.style, { left: '0', top: (topH + s) + 'px', width: w + 'px', height: bottomH + 'px' });
        }
    }
    
    // Simple API - always returns the content area
    getPanel(index) { 
        const panel = index === 1 ? this.panel1 : this.panel2;
        return panel.querySelector('.scrollable-content');
    }
    
    setPanelTitle(index, title) {
        const panel = index === 1 ? this.panel1 : this.panel2;
        const header = panel.querySelector('.panel-header');
        
        if (title) {
            header.textContent = title;
            header.style.height = ''; // Reset to default CSS height
            header.style.overflow = '';
            header.style.padding = ''; // Reset to default CSS padding
        } else {
            header.textContent = '';
            header.style.height = '0px';
            header.style.overflow = 'hidden';
            header.style.padding = '0px'; // Remove padding when hidden
        }
    }
    
    setPanel(index, content, options = {}) {
        // Set title if provided
        if (options.title) {
            this.setPanelTitle(index, options.title);
        }
        
        // Always get the content area (consistent now!)
        const contentArea = this.getPanel(index);
        
        // Set content
        if (typeof content === 'string') {
            contentArea.innerHTML = content;
        } else if (content && content.appendChild) {
            contentArea.innerHTML = '';
            contentArea.appendChild(content);
        } else if (content && content.container) {
            content.container = contentArea;
        }
        
        return contentArea;
    }
    
    setSplit(ratio) { this.splitRatio = ratio; this.updateLayout(); }
    setOrientation(horizontal) { this.isHorizontal = horizontal; this.init(); }
    destroy() { this.element.remove(); }
}
