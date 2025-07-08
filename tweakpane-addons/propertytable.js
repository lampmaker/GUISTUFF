import { Pane } from './tweakpane-4.0.4.js';


//=========================================================================================================================================
// Function to create a popup pane with Tweakpane
// This function creates a popup with a Tweakpane instance inside it.
function createPopupPane({ title = "HAHAHA", positionElement=null, width = 300, height = 200, onClose, fill, x, y }) {
    // Create popup container
 const popup = document.createElement('div');
 // add title
    if (title) {
        const titleElem = document.createElement('div');
        titleElem.textContent = title;
         Object.assign(titleElem.style, {
        position: 'absolute', left: '8px', top: '4px', background: 'none', border: 'none',
        color: '#000', fontSize: '12px',  opacity: 0.5,fontFamily: 'Segoe UI, Arial, sans-serif' ,fontWeight: 'bold'
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
       // minHeight: height + 'px'
    };

    if (positionElement) {
        const rect = positionElement.getBoundingClientRect();
        x = rect.left;
        y = rect.bottom;
        Object.assign(computedStyle, {
            left: rect.left + 'px',
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
    const pane = new propertyTable({ container: paneDiv });
    if (typeof fill === 'function') fill(pane);
    pane._popup = popup;
    return pane;
}


// make an extension of the Tweakpane Pane class
class propertyTable extends Pane {

    constructor(options) {
        super(options);

    }
    //========================================================================================================================================
    // This method binds multiple properties of an object to the pane
    // It takes an object with properties and an options object for each property. if there are no options, it will use an empty object.
    bindControls = (objects, options) => {
        for (let key in objects) {
            this.addBinding(objects, key, options[key] || {});
        }
    }


    //========================================================================================================================================







    //========================================================================================================================================    // Override the addBinding method to customize how properties are added to the pane
    // This method allows you to add custom logic for handling property tables
    addBinding(target, property, options) {
        const binding = super.addBinding(target, property, options);
        // Add custom logic for property table if needed
        return binding;
    }


    //========================================================================================================================================
    // Override the addFolder method to customize how folders are created
    addFolder(params) {
        const folder = super.addFolder(params);


        // Attach bindControls to the folder
        folder.bindControls = (objects, options) => {
            folder.bindings = {
                objects: objects,
                options: options
            }
            for (let key in objects) {
                folder.addBinding(objects, key, options?.[key] || {});
            }
        };


        // expandable folder section ====================================================================================================
        //===============================================================================================================================

        // this shows a popup that allows users to add a new property to the folder
        folder._addElement = (y) => {
            let params = { name: "name", type: 1, value: 0. };
            let currentPopup;
            function showPopup() {
                if (currentPopup) currentPopup.remove();
                params.value = ["text here", 0.0, { x: 0, y: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 0 }, false][params.type];
                let pane = createPopupPane({positionElement:folder.element.querySelector('.tp-fldv_t')});
                currentPopup = pane._popup;
                pane.addBinding(params, 'name',{label: "Name"});
                pane.addBinding(params, 'type', { label:"Type",options: { string: 0, float: 1, vec2: 2, vec3: 3, vec4: 4, boolean: 5 } })
                    .on('change', () => showPopup());
                pane.addBinding(params, 'value',{label:"Value"});
                pane.addButton({ title: 'Apply' }).on('click', () => {
                    folder.bindings.objects[params.name] = params.value;
                    currentPopup.remove();
                    folder.refresh();
                });
            }
            showPopup();
        }
        //===============================================================================================================================
        if (params?.expandable && params?.object) {
            // If the folder is expandable and has an object, bind the controls to the object
            folder.bindControls(params.object, params.options || {});
            // Add a button to add new properties to the folder
            setTimeout(() => {
                const folderElem = folder.element;
                const header = folderElem.querySelector('.tp-fldv_t');
                if (header) {
                    header.style.display = 'flex';
                    header.style.alignItems = 'center';
                    const plusBtn = document.createElement('button');
                    plusBtn.textContent = '+';
                    plusBtn.title = 'Add property';
                    Object.assign(plusBtn.style, {
                        marginLeft: 'auto', marginRight: '4px', cursor: 'pointer',
                        opacity: '0.5', background: 'none',
                        color: 'inherit', padding: '0', width: '24px', height: '24px',
                        border: 'none', outline: 'none', fontSize: '18px', transition: 'opacity 0.2s'
                    });
                    plusBtn.onmouseenter = () => plusBtn.style.opacity = '1';
                    plusBtn.onmouseleave = () => plusBtn.style.opacity = '0.5';
                    plusBtn.onclick = e => {
                        e.stopPropagation();
                        folder._addElement();
                    };
                    header.appendChild(plusBtn);
                }
            }, 0);



            // add actions to the refresh event.  clear the folder and rebind the controls
            const origRefresh = folder._refresh ? folder._refresh.bind(folder) : () => { };
            folder.refresh = () => {
                // clear existing controls
                folder.children.slice().forEach(child => child.dispose());
                for (let key in folder.bindings.objects) {
                    folder.addBinding(folder.bindings.objects, key, folder.bindings.options?.[key] || {});
                }
                origRefresh();
            };
        }
        return folder;
    }

}





export { propertyTable };

