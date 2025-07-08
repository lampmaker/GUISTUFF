     import { Pane } from './tweakpane-4.0.4.js';



     // make an extension of the Tweakpane Pane class
 class propertyTable extends Pane {

    constructor(options) {
        super(options);
     
    }


    addBinding(target, property, options) {
        const binding = super.addBinding(target, property, options);
        // Add custom logic for property table if needed
        return binding;
    }

    addPane(target, property, options) {
        const binding = super.addPane(target, property, options);
        // Add custom logic for property table if needed
        return binding;
    }

 }





 export { propertyTable };

