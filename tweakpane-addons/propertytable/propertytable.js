import { Pane } from './tweakpane-4.0.4.js';
import { createPopupPane, addContextMenu, detectBindingType } from './contextmenu.js';
import { setTextareaStyle } from './textarea-highlighting.js';




// make an extension of the Tweakpane Pane class
class propertyTable extends Pane {


    constructor(options) {
        super(options);

    }
    //========================================================================================================================================
    // This method binds multiple properties of an object to the pane
    // It takes an object with properties and an options object for each property. if there are no options, it will use an empty object.
    bindControls = (objects, options, onclick = _ => { }) => {
        for (let key in objects) {
            this.addBinding(objects, key, options[key] || {}).on('click', onclick);
        }
    }

    //========================================================================================================================================  
    // This method prepares the binding options before they are added to the pane
    bindingPrepper(target, property, options) {
        let type = detectBindingType(target, property);
        switch (type) {
            case "number":      // force slider control. 
                options.showSlider = true;
                let val = target[property];
                if (!options.min && !options.max) {
                    options.min = Math.min(val, options.min || 0);
                    options.max = Math.max(val, options.max || 100);
                    options.showSlider = false; // default to showing the slider
                }
                break;
            case "string":
                if (options.multiline) {
                    options.readonly = true; // force to switch log control (which uses textarea)  for multiline strings
                    options.wordwrap=true;
                }
                break;
            default:
                break;
        }
        return { target, property, options }
    }

    //========================================================================================================================================  
    // modfies controls after they are added to the pane
    bindingModifier(binding, target, property, options) {
        let type = detectBindingType(target, property);
        switch (type) {
            case "string":      // force slider control. 
                if (options.multiline) {
                    setTimeout(() => {                              // modify the textarea control to use a textarea instead of an input
                        const element = binding.element;
                        const label = element.querySelector('.tp-lblv_l'); // Label element
                        const container = element.querySelector('.tp-lblv_v'); // Value container
                        if (label) label.style.display = 'none';
                        if (container) { container.style.width = '100%'; container.style.marginLeft = '0'; }
                        const textarea = element.querySelector('textarea');
                        setTextareaStyle(textarea, options);
                        textarea.addEventListener('input', (e) => target[property] = e.target.value);
                        binding.update=_=>setTextareaStyle(textarea, options); // Update textarea style on binding update

                    }, 0)
                }
                break;
            default:
                break;
        }
    }


    //========================================================================================================================================    
    // // Override the addBinding method to customize how properties are added to the pane
    // This method allows you to add custom logic for handling property tables
    addBinding(target, property, options,) {
        ({ target, property, options } = this.bindingPrepper(target, property, options))
        const binding = super.addBinding(target, property, options);
        addContextMenu(binding, target, property, options);
        this.bindingModifier(binding, target, property, options);
        return binding;
    }



    //========================================================================================================================================
    // Override the addFolder method to customize how folders are created
    addFolder(params) {
        const folder = super.addFolder(params);

        //----------------------override addBinding to add context menu
        const fbind = folder.addBinding;
        folder.addBinding = (target, property, options) => {
            ({ target, property, options } = this.bindingPrepper(target, property, options))
            const binding = fbind.call(folder, target, property, options);
            addContextMenu(binding, target, property, options);
            this.bindingModifier(binding, target, property, options);
            return binding;
        }

        // Attach bindControls to the folder
        folder.bindControls = (objects, options, onclick = _ => { }) => {
            folder.bindings = {
                objects: objects,
                options: options
            }
            for (let key in objects) {
                let b = folder.addBinding(objects, key, options?.[key] || {}).on('click', onclick);
                addContextMenu(b, objects, key, options);
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
                let pane = createPopupPane({ positionElement: folder.element.querySelector('.tp-fldv_t'), title: "Add Variable" });
                currentPopup = pane._popup;
                pane.addBinding(params, 'name', { label: "Name" });
                pane.addBinding(params, 'type', { label: "Type", options: { string: 0, float: 1, vec2: 2, vec3: 3, vec4: 4, boolean: 5 } })
                    .on('change', () => showPopup());
                pane.addBinding(params, 'value', { label: "Value" });
                pane.addButton({ title: 'Apply' }).on('click', () => {
                    folder.bindings.objects[params.name] = params.value;
                    folder.bindings.options[params.name] = { type: params.type, removable: true };
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

