/**
 * Simple SplitPane Container
 * A minimal, easy-to-use splitpane implementation
 */
export class SplitPane {
    constructor(container, options = {}) {
        this.container = container;
        this.isHorizontal = options.orientation !== 'vertical';
        this.splitRatio = options.splitRatio || 0.5;
        this.splitterSize = options.splitterSize || 8;
        this.minSize = options.minSize || 50;
        
        this.isDragging = false;
        this.startPos = 0;
        this.startRatio = 0;
        
        this.init();
    }
    
    init() {
        // Create elements
        this.element = document.createElement('div');
        this.element.className = 'splitpane-container';
        
        this.panel1 = document.createElement('div');
        this.panel1.className = 'splitpane-panel';
        
        this.panel2 = document.createElement('div');
        this.panel2.className = 'splitpane-panel';
        
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
    
    // Simple API
    getPanel(index) { return index === 1 ? this.panel1 : this.panel2; }
    setSplit(ratio) { this.splitRatio = ratio; this.updateLayout(); }
    setOrientation(horizontal) { this.isHorizontal = horizontal; this.init(); }
    destroy() { this.element.remove(); }
}
