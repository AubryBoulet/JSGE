import { Camera } from "./camera.js";

class Element {
    #sprite;
    #position;
    #scale;
    #flippedX;
    #flippedY;
    #onGravityContact;
    static displayedElement = [];

    constructor({sprite,position={x:0,y:0},scale=1}){
        this.sprite = sprite;
        this.position = position;
        this.scale = scale;       
    }
    static create(datas, assigns) {
        if (assigns && !Array.isArray(assigns)) {
            throw new Error('Error creating element, assigns must be an Array of objects');
        }
        const element = new Element(datas);

        if (assigns) {
            assigns.forEach((assign) => {
                if (typeof assign !== 'object' || assign === null) {
                    throw new Error(`Error creating element, ${assign} is not an object!`);
                }
                const conflicts = Object.keys(assign).filter(key => element.hasOwnProperty(key));
                if (conflicts.length > 0) {
                    console.warn(`Property conflicts: ${conflicts.join(', ')} already exist in element!`);
                }
                Object.assign(element, assign);
            });
        }
        return element;
    }
    static _addToDisplayedElement(element){
        Element.displayedElement.push(element);
    }
    static _removeFromDisplayedElement(element){
        Element.displayedElement = Element.displayedElement.filter((elem)=>elem !== element)
    }
    assign(assigns, { overwrite = false } = {}) {
        assigns.forEach((assign) => {
            if (typeof assign !== 'object' || assign === null) {
                throw new Error(`Error creating entity, ${assign} is not an object!`);
            }

            const safeAssign = {};
            for (const key of Object.keys(assign)) {
                if (key in this && !overwrite) {
                    console.warn(`assign: "${key}" already exists, ignored. Use overwrite: true to force.`);
                } else {
                    safeAssign[key] = assign[key];
                }
            }
        Object.assign(this, safeAssign);
        });
    }

    _processDraw(cam){
        if(!cam instanceof Camera) throw new Error('Invalide camera object in ',cam);
        let width, height
        if(this.sprite.animate){
            throw new Error('Element cannot be animated');
        } else {
            width = this.#sprite.width;
            height = this.#sprite.height;
        }
        const dimension = {
            x: 0,
            y: 0,
            width: width,
            height: height
        };
        const position = {
            x: this.position.x,
            y: this.position.y,
            width: width* this.scale,
            height: height * this.scale
        }
        this.#drawElement(cam,dimension,position);
    }
    #drawElement(camera,dimension,position) {
        if(position.x > camera.dimensions.width || position.y > camera.dimensions.height || 
            position.x+dimension.width*this.scale <= 0 || position.y+dimension.height*this.scale <= 0) 
            return
        if (position.x < 0){
            dimension.x -= position.x;
            dimension.width += position.x;
            position.width += position.x;
            position.x = 0;
        }
        if (position.x + position.width > camera.dimensions.width){
            const reduction = (position.width + position.x - camera.dimensions.width);
            dimension.width -= reduction/this.scale;
            position.width -= reduction
        }
        if (position.y <0) {
            dimension.y -= position.y;
            dimension.height += position.y;
            position.height += position.y;
            position.y = 0;
        }
        if (position.y + position.height > camera.dimensions.height){
            const reduction = (position.height + position.y - camera.dimensions.height)
            dimension.height -= reduction/this.scale;
            position.height -= reduction
        }
        position.x += camera.position.x; position.y += camera.position.y
        const ctx = camera.ctx
        let scaleX =1, scaleY =1;
        if(this.flippedX || this.flippedY){
            if(this.flippedX) {scaleX = -1;position.x = -position.x;position.width = -position.width}
            if(this.flippedY) {scaleY = -1;position.y = -position.y;position.height = -position.height}
            ctx.save();
            ctx.scale(scaleX,scaleY);
        }
        ctx.drawImage(this.sprite.image,
            dimension.x,dimension.y,dimension.width,dimension.height,
            position.x,position.y,position.width,position.height
        )
        if(this.flippedX || this.flippedY){
            ctx.restore();
        }
    }

    // Setters
    set sprite(sprite) {
        this.#sprite = sprite;
    }
    set position(position) {
        this.#position = position;
    }
    set scale(scale) {
        this.#scale = scale;
    }
    set flippedX(flipped){
        if(typeof flipped === 'boolean'){
            this.#flippedX = flipped;
        } else {throw new Error('Invalid value for flipperX, must be a boolean');}
    }
    set flippedY(flipped){
        if(typeof flipped === 'boolean'){
            this.#flippedY = flipped;
        } else {throw new Error('Invalid value for flippedY, must be a boolean');}
    }
    set onGravityContact(callback){
        if(typeof callback !== 'function')
            throw new Error('Invalid callback, must be a function');
        this.#onGravityContact=callback;
    }

    // Getters
    get sprite() {
        return this.#sprite;
    }
    get position() {
        return this.#position;
    }
    get scale() {
        return this.#scale;
    }
    get flippedX(){
        return this.#flippedX;
    }
    get flippedY(){
        return this.#flippedY;
    }
    get onGravityContact(){
        return this.#onGravityContact;
    }
}

export  {Element};