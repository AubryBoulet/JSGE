import { Element } from "./element.js";

class Scene {
    #elements
    #maxZorder=0;
    constructor(){
        this.#elements=[];
    }
    add(elem,zOrder=0){
        this.#elements.push({el:elem,zOrder:zOrder});
        if(elem instanceof Element)
            Element._addToDisplayedElement(elem);
        if(zOrder<this.#maxZorder){
            this.#elements.sort((a,b)=>a.zOrder-b.zOrder);
        } else {
            this.#maxZorder = zOrder;
        }
    }
    remove(elem){
        this.#elements=this.#elements.filter((el)=>el.el !== elem);
        if(elem instanceof Element)
            Element._removeFromDisplayedElement(elem);
    }
    zOrder(elem,zOrder){
        this.#elements[this.#elements.findIndex((el)=>el.el === elem)].zOrder = zOrder;
        this.#elements.sort((a,b)=>a.zOrder-b.zOrder);
    }
    draw(cam){
        cam._addToDrawScene(this.#elements);
    }

}

export { Scene}