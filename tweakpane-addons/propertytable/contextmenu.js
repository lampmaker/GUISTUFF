import { Pane } from './tweakpane-4.0.4.js';


//=========================================================================================================================================
// Function to create a popup pane with Tweakpane
// This function creates a popup with a Tweakpane instance inside it.



export function createPopupPane({ title = null, positionElement = null, width = 300, height = 20, onClose, fill, x, y }) {
    // Create popup container
    const popup = document.createElement('div');
    // add title
    if (title) {
        const titleElem = document.createElement('div');
        titleElem.textContent = title;
        Object.assign(titleElem.style, {
            position: 'absolute', left: '8px', top: '4px', background: 'none', border: 'none',
            color: '#000', fontSize: '12px', opacity: 0.6, fontFamily: 'Segoe UI, Arial, sans-serif', fontWeight: 'bold'
        });
        popup.appendChild(titleElem);
    }

    // Compute popup position and size
    let computedStyle = {
        position: 'fixed',
        zIndex: 9999,
        background: '#bbb',
        borderRadius: '8px',
        boxShadow: '0 4px 24px #0008',
        padding: '2px',
        minWidth: width + 'px',
        minHeight: height + 'px'
    };

    if (positionElement) {
        const rect = positionElement.getBoundingClientRect();
        x = rect.left;
        y = rect.bottom;
        Object.assign(computedStyle, {
            left: rect.left+5 + 'px',
            top: (rect.bottom + 4) + 'px',
            width: rect.width + 'px',
            minWidth: rect.width + 'px',
            maxWidth: rect.width + 'px',
            transform: 'none'
        });
    } else if (x != null && y != null) {
        Object.assign(computedStyle, {
            left: x + 'px',
            top: y + 'px',
            transform: 'none'
        });
    } else {
        Object.assign(computedStyle, {
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)'
        });
    }

    Object.assign(popup.style, computedStyle);


    // Optional close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, {
        position: 'absolute', right: '8px', top: '1px', background: 'none', border: 'none',
        color: '#000', fontSize: '20px', cursor: 'pointer', opacity: 0.5
    });
    closeBtn.onmouseenter = () => closeBtn.style.opacity = 1;
    closeBtn.onmouseleave = () => closeBtn.style.opacity = 0.5;
    closeBtn.onclick = () => { popup.remove(); if (onClose) onClose(); };
    popup.appendChild(closeBtn);

    // Container for tweakpane
    const paneDiv = document.createElement('div');
    paneDiv.style.marginTop = '20px'; // Add space for the close button
    popup.appendChild(paneDiv);

    document.body.appendChild(popup);

    // Create tweakpane instance
    const pane = new Pane({ container: paneDiv });
    if (typeof fill === 'function') fill(pane);
    pane._popup = popup;
    return pane;
}


// make an extension of the Tweakpane Pane class