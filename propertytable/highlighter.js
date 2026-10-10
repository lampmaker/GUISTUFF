// Copyright (c) 2024 Matthijs Keuper
// SPDX-License-Identifier: MIT
/**
 * Smart Textarea Syntax Highlighting System
 * 
 * Features:
 * - Plugin-based architecture for multiple languages
 * - Efficient overlay management with proper lifecycle
 * - Debounced highlighting with performance optimization
 * - Automatic cleanup and memory management
 * - CSS variable integration with Tweakpane theming
 */

import { GLSLHighlighter } from './highlighter_glsl.js';

// Configuration constants
const HIGHLIGHTER_CONFIG = {
    DEBOUNCE_DELAY: 50,
    Z_INDEX: { OVERLAY: 1, TEXTAREA: 2, LINE_NUMBERS: 0 },
    FALLBACK_CARET_COLOR: '#ffffff',
    SUPPORTED_STYLES: [
        'whiteSpace', 'wordWrap', 'overflowWrap', 'wordBreak',
        'fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
        'letterSpacing', 'textAlign', 'tabSize'
    ],
    WORD_WRAP_STYLES: {
        enabled: {
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
        },
        disabled: {
            whiteSpace: 'pre',
            wordWrap: 'normal',
            overflowWrap: 'normal',
            overflowX: 'auto'
        }
    },
    BASE_TEXTAREA_STYLES: {
        readOnly: false,
        cursor: 'text',
        backgroundColor: 'var(--in-bg)',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',        
    },
    LINE_NUMBERS: {
        WIDTH: '30px',
        PADDING: '0 4px 0 2px',
        BACKGROUND: 'var(--cnt-bg, #2d2d2d)',
        COLOR: 'var(--in-fg-disabled, #858585)',
        BORDER_RIGHT: '1px solid var(--cnt-bg-disabled, #404040)',
        FONT_FAMILY: 'monospace',
        TEXT_ALIGN: 'right',
        USER_SELECT: 'none'
    }
};

// Plugin registry for different highlighters
class HighlighterRegistry {
    constructor() {
        this.plugins = new Map();
        this.instances = new Map();
    }

    register(name, HighlighterClass) {
        this.plugins.set(name, HighlighterClass);
    }

    getInstance(name) {
        if (!this.instances.has(name)) {
            const HighlighterClass = this.plugins.get(name);
            if (!HighlighterClass) {
                throw new Error(`Unknown highlighter: ${name}`);
            }
            const instance = new HighlighterClass();
            instance.injectCSS?.();
            this.instances.set(name, instance);
        }
        return this.instances.get(name);
    }

    isSupported(name) {
        return this.plugins.has(name);
    }
}

// Global registry instance
const highlighterRegistry = new HighlighterRegistry();

// Register built-in highlighters
highlighterRegistry.register('glsl', GLSLHighlighter);

/**
 * Smart Textarea Highlighter Class
 * Manages syntax highlighting overlay for a single textarea with proper lifecycle
 */
class TextareaHighlighter {
    constructor(textarea, highlighterType, options = {}) {
        this.textarea = textarea;
        this.highlighterType = highlighterType;
        this.options = options;
        this.highlighter = highlighterRegistry.getInstance(highlighterType);
        this.container = null;
        this.overlay = null;
        this.lineNumbers = null;
        this.resizeObserver = null;
        this.highlightTimeout = null;
        this.isDestroyed = false;

        this._setupHighlighting();
    }

    _setupHighlighting() {
        this._createContainer();
        this._createOverlay();
        if (this.options.lineNumbers) {
            this._createLineNumbers();
        }
        this._setupTextarea();
        this._setupEventListeners();
        this._setupResizeObserver();
        this._initialUpdate();
    }

    _createContainer() {
        this.container = document.createElement('div');
        const computedStyle = getComputedStyle(this.textarea);
        
        Object.assign(this.container.style, {
            position: 'relative',
            width: '100%',
            backgroundColor: this.textarea.style.backgroundColor || 'var(--in-bg)',
            borderRadius: this.textarea.style.borderRadius || 'var(--bld-br)',
            border: this.textarea.style.border,
            padding: this.textarea.style.padding
        });

        // Insert container before textarea
        const parent = this.textarea.parentNode;
        parent.insertBefore(this.container, this.textarea);
    }

    _createOverlay() {
        this.overlay = document.createElement('div');
        this._copyStyles();
        this._setupOverlayStyles();
        this.container.appendChild(this.overlay);
    }

    _copyStyles() {
        const computedStyle = getComputedStyle(this.textarea);
        HIGHLIGHTER_CONFIG.SUPPORTED_STYLES.forEach(prop => {
            this.overlay.style[prop] = computedStyle[prop];
        });
    }

    /* The overlay must lay its text out in exactly the box the textarea does, or a wrapped
       line breaks at a different character in each and the caret (the textarea's) lands
       somewhere other than the text you are reading (the overlay's). It used to sit 30px
       to the right at the textarea's full width, so it wrapped 30px plus a scrollbar later
       than the textarea did. Now it sits on the textarea with the same padding, and
       _syncOverlay gives it the textarea's clientWidth, which excludes the scrollbar. */
    _setupOverlayStyles() {
        const basePadding = '4px'; // Match textarea padding
        Object.assign(this.overlay.style, {
            position: 'absolute',
            top: '0', 
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            padding: basePadding,
            paddingLeft: this.options.lineNumbers ?
                `calc(${HIGHLIGHTER_CONFIG.LINE_NUMBERS.WIDTH} + ${basePadding})` : basePadding,
            margin: '0', 
            border: 'none',
            color: 'var(--in-fg)',
            zIndex: HIGHLIGHTER_CONFIG.Z_INDEX.OVERLAY,
            overflow: 'hidden',
            boxSizing: 'border-box'
        });
    }

    _createLineNumbers() {
        this.lineNumbers = document.createElement('div');
        this._setupLineNumbersStyles();
        this.container.appendChild(this.lineNumbers);
    }

    _setupLineNumbersStyles() {
        const computedStyle = getComputedStyle(this.textarea);
        const basePadding = '4px'; // Match textarea padding
        Object.assign(this.lineNumbers.style, {
            position: 'absolute',
            top: '0', left: '0',
            width: HIGHLIGHTER_CONFIG.LINE_NUMBERS.WIDTH,
            height: '100%',
            padding: `${basePadding} 4px ${basePadding} 2px`, // Match textarea vertical padding
            backgroundColor: HIGHLIGHTER_CONFIG.LINE_NUMBERS.BACKGROUND,
            color: HIGHLIGHTER_CONFIG.LINE_NUMBERS.COLOR,
            borderRight: HIGHLIGHTER_CONFIG.LINE_NUMBERS.BORDER_RIGHT,
            fontFamily: computedStyle.fontFamily || HIGHLIGHTER_CONFIG.LINE_NUMBERS.FONT_FAMILY,
            fontSize: computedStyle.fontSize,
            lineHeight: computedStyle.lineHeight,
            textAlign: HIGHLIGHTER_CONFIG.LINE_NUMBERS.TEXT_ALIGN,
            userSelect: HIGHLIGHTER_CONFIG.LINE_NUMBERS.USER_SELECT,
            zIndex: HIGHLIGHTER_CONFIG.Z_INDEX.LINE_NUMBERS,
            overflow: 'hidden',
            whiteSpace: 'pre',
            boxSizing: 'border-box'
        });
    }

    _setupTextarea() {
        // Make textarea transparent but keep caret visible
        const basePadding = '4px'; // Add some base padding for readability
        const leftPadding = this.options.lineNumbers ? 
            `calc(${HIGHLIGHTER_CONFIG.LINE_NUMBERS.WIDTH} + ${basePadding})` : 
            basePadding;
        
        Object.assign(this.textarea.style, {
            position: 'relative',
            zIndex: HIGHLIGHTER_CONFIG.Z_INDEX.TEXTAREA,
            background: 'transparent',
            backgroundColor: 'transparent',
            color: 'transparent',
            border: 'none',
            outline: 'none',
            padding: basePadding, 
            paddingLeft: leftPadding,
            margin: '0',
            textShadow: 'none',
            webkitTextFillColor: 'transparent',
            boxSizing: 'border-box',
            width: '100%'
        });

        this._setupCaretVisibility();
        this.container.appendChild(this.textarea);
    }

    _setupCaretVisibility() {
        const caretColor = 'var(--in-fg)';
        this.textarea.style.setProperty('caret-color', caretColor, 'important');
        
        // Fallback for older browsers
        if (!CSS.supports('caret-color', caretColor)) {
            this.textarea.style.setProperty('caret-color', HIGHLIGHTER_CONFIG.FALLBACK_CARET_COLOR, 'important');
        }

        this.textarea.addEventListener('focus', () => {
            this.textarea.style.setProperty('caret-color', caretColor, 'important');
        });
    }

    _setupEventListeners() {
        this.textarea.addEventListener('input', () => this._updateHighlighting());
        this.textarea.addEventListener('scroll', () => this._syncOverlay());
        this.textarea.addEventListener('resize', () => this._syncOverlay());
    }

    _setupResizeObserver() {
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this._syncOverlay();
                this._updateHighlighting();
            });
            this.resizeObserver.observe(this.textarea);
            this.resizeObserver.observe(this.container);
        }
    }

    _updateHighlighting() {
        if (this.isDestroyed) return;
        
        clearTimeout(this.highlightTimeout);
        this.highlightTimeout = setTimeout(() => {
            if (!this.isDestroyed && this.overlay) {
                this._syncOverlay();
                this.overlay.innerHTML = this._highlightLines(this.textarea.value);
                this._updateLineNumbers();
                this._syncOverlay();
            }
        }, HIGHLIGHTER_CONFIG.DEBOUNCE_DELAY);
    }

    /* One block per source line, so the gutter can ask each how tall it wrapped to. The
       highlighter works on the whole text (a block comment spans lines), so its HTML is cut
       at the newlines afterwards, closing and reopening any span that crosses one. */
    _highlightLines(code) {
        const html = this.highlighter.highlight(code);
        const out = [];
        let line = '', open = [];
        for (const part of html.split(/(<span[^>]*>|<\/span>|\n)/)) {
            if (part === '\n') {
                out.push(line + '</span>'.repeat(open.length));
                line = open.join('');
            } else {
                if (part.startsWith('<span')) open.push(part);
                else if (part === '</span>') open.pop();
                line += part;
            }
        }
        out.push(line);
        // an empty line has no height as a div; a <br> gives it one, as the textarea does
        return out.map(l => `<div>${l.replace(/<[^>]*>/g, '') ? l : l + '<br>'}</div>`).join('');
    }

    /* A number per source line, each as tall as that line wrapped to in the overlay --
       one number per visual row put every number after a wrapped line on the wrong row. */
    _updateLineNumbers() {
        if (this.isDestroyed || !this.lineNumbers) return;
        
        const rows = this.overlay.children;
        this.lineNumbers.innerHTML = Array.from(rows, (row, i) =>
            `<div style="height:${row.getBoundingClientRect().height}px">${i + 1}</div>`).join('');
    }

    _syncOverlay() {
        if (this.isDestroyed || !this.overlay) return;
        
        this.overlay.scrollTop = this.textarea.scrollTop;
        this.overlay.scrollLeft = this.textarea.scrollLeft;
        
        // Sync line numbers scroll if they exist
        if (this.lineNumbers) {
            this.lineNumbers.scrollTop = this.textarea.scrollTop;
        }
        
        // clientWidth/Height leave out the textarea's scrollbars, which narrow its text too
        this.overlay.style.width = `${this.textarea.clientWidth}px`;
        this.overlay.style.height = `${this.textarea.clientHeight}px`;
    }

    _initialUpdate() {
        this._updateHighlighting();
        this._syncOverlay();
    }

    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        clearTimeout(this.highlightTimeout);
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // Restore textarea to original state
        this._restoreTextarea();
        
        // Remove container
        if (this.container && this.container.parentNode) {
            this.container.parentNode.insertBefore(this.textarea, this.container);
            this.container.remove();
        }
    }

    _restoreTextarea() {
        Object.assign(this.textarea.style, {
            position: '', zIndex: '', 
            background: 'var(--in-bg)', color: 'var(--in-fg)',
            caretColor: '', border: '', outline: '',
            padding: '', margin: '', textShadow: '',
            webkitTextFillColor: ''
        });
    }
}

// WeakMap to track highlighter instances per textarea
const textareaHighlighters = new WeakMap();
/**
 * Smart API for textarea styling and syntax highlighting
 */

/**
 * Apply styling and optional syntax highlighting to a textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element to style
 * @param {Object} options - Configuration options
 * @param {boolean} options.wordwrap - Enable word wrapping
 * @param {string} options.highlighting - Type of syntax highlighting ('glsl', etc.)
 * @param {boolean} options.scrollbars - Show scrollbars
 */
export function setTextareaStyle(textarea, options = {}) {
    if (!textarea || !(textarea instanceof HTMLTextAreaElement)) {
        throw new Error('Invalid textarea element provided');
    }

    const { wordwrap, highlighting, scrollbars, lineNumbers } = options;

    // Apply base styling
    _applyBaseStyles(textarea, scrollbars);
    
    // Apply word wrap settings
    _applyWordWrapStyles(textarea, wordwrap);
    
    // Setup syntax highlighting if specified
    if (highlighting) {
        _setupSyntaxHighlighting(textarea, highlighting, { lineNumbers });
    } else {
        // Remove any existing highlighting
        _removeSyntaxHighlighting(textarea);
    }
}

function _applyBaseStyles(textarea, scrollbars) {
    Object.assign(textarea.style, HIGHLIGHTER_CONFIG.BASE_TEXTAREA_STYLES, {
        overflow: scrollbars ? 'auto' : 'hidden'
    });
}

function _applyWordWrapStyles(textarea, wordwrap) {
    const styles = wordwrap 
        ? HIGHLIGHTER_CONFIG.WORD_WRAP_STYLES.enabled
        : HIGHLIGHTER_CONFIG.WORD_WRAP_STYLES.disabled;
    
    Object.assign(textarea.style, styles);
}

function _setupSyntaxHighlighting(textarea, highlighterType, additionalOptions = {}) {
    if (!highlighterRegistry.isSupported(highlighterType)) {
        console.warn(`Unsupported highlighter type: ${highlighterType}`);
        return;
    }

    // Remove existing highlighting first
    _removeSyntaxHighlighting(textarea);

    // Set highlighting attribute
    textarea.setAttribute('data-highlighting', highlighterType);

    // Create new highlighter instance with options
    const highlighter = new TextareaHighlighter(textarea, highlighterType, additionalOptions);
    textareaHighlighters.set(textarea, highlighter);
}

function _removeSyntaxHighlighting(textarea) {
    const existing = textareaHighlighters.get(textarea);
    if (existing) {
        existing.destroy();
        textareaHighlighters.delete(textarea);
    }
    textarea.removeAttribute('data-highlighting');
}

/**
 * Remove syntax highlighting from a textarea and restore normal styling
 * @param {HTMLTextAreaElement} textarea - The textarea to remove highlighting from
 */
export function removeTextareaHighlighting(textarea) {
    _removeSyntaxHighlighting(textarea);
}

/**
 * Check if a textarea has syntax highlighting enabled
 * @param {HTMLTextAreaElement} textarea - The textarea to check
 * @returns {boolean} True if highlighting is enabled
 */
export function hasTextareaHighlighting(textarea) {
    return textareaHighlighters.has(textarea);
}

/**
 * Get the highlighting type for a textarea
 * @param {HTMLTextAreaElement} textarea - The textarea to check
 * @returns {string|null} The highlighting type or null if none
 */
export function getTextareaHighlightingType(textarea) {
    return textarea.getAttribute('data-highlighting');
}

/**
 * Register a new syntax highlighter plugin
 * @param {string} name - The highlighter name (e.g., 'javascript', 'python')
 * @param {Class} HighlighterClass - The highlighter class
 */
export function registerHighlighter(name, HighlighterClass) {
    highlighterRegistry.register(name, HighlighterClass);
}

/**
 * Get list of supported highlighter types
 * @returns {string[]} Array of supported highlighter names
 */
export function getSupportedHighlighters() {
    return Array.from(highlighterRegistry.plugins.keys());
}

/**
 * Update highlighting for a textarea (useful for external changes)
 * @param {HTMLTextAreaElement} textarea - The textarea to update
 */
export function updateTextareaHighlighting(textarea) {
    const highlighter = textareaHighlighters.get(textarea);
    if (highlighter) {
        highlighter._updateHighlighting();
    }
}
