import { Pane } from './tweakpane-4.0.4.js';









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
            folder.bindings={
                objects: objects,
                options: options
            }
            for (let key in objects) {
                folder.addBinding(objects, key, options?.[key] || {});
            }
        };


        // expandable folder ====================================================================================================

        folder.addElement=_=>{
            folder.bindings.objects["TEST"+Math.random(1).toFixed(2)]="Testje"
            folder.refresh();
        }

        








        if (params?.expandable && params?.object) {
            // If the folder is expandable and has an object, bind the controls to the object
            folder.bindControls(params.object, params.options || {});
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
                        folder.addElement();
                     };
                    header.appendChild(plusBtn);
                }
            }, 0);
        }




        // add actions to the refresh event
        const origRefresh = folder._refresh ? folder._refresh.bind(folder) : () => { };
        folder.refresh = () => {
            // clear existing controls
            folder.children.slice().forEach(child => child.dispose());
            

            for (let key in folder.bindings.objects) {
                folder.addBinding(folder.bindings.objects, key, folder.bindings.options?.[key] || {});
            }


            // Custom pre-refresh logic here
            // console.log('Custom refresh logic before');
            console.log('Refreshing folder:', folder.title);
            origRefresh();

        };
        return folder;
    }

}





export { propertyTable };

