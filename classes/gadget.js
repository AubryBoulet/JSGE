import {Camera} from './camera.js'
class Gadget {
    #position = {x:0,y:0};
    #dimension = {width:0,height:0};
    static mouseEvent = false;
    static mousePosition={x:0,y:0};
    #cachCanvas;
    #MouseOver= false;
    #MouseEnter= false;
    #active= false;
    #onMouseOver;
    #onMouseEnter;
    #onMouseLeave;
    #onClick;

    constructor({position,dimension}) {
        this.position = position;
        this.dimension = dimension;
        this.#cachCanvas = document.createElement('canvas');
        this.#updateCachCanvas();
        this.#setListener();
    }

    #setListener(){
        if(!Gadget.mouseEvent){
            Gadget.mouseEvent = true;
            document.addEventListener('mousemove',(e)=>{
                Gadget.mousePosition.x = e.pageX;
                Gadget.mousePosition.y = e.pageY;
            })
        }
    }
    draw(cam){
        if(!cam instanceof Camera) throw new Error('Invalide camera object in ',cam);
        const displayedPosition = {x:this.position.x+cam.position.x,y:this.position.y+cam.position.y}
        cam.ctx.fillRect(displayedPosition.x,displayedPosition.y,this.dimension.width,this.dimension.height)
        this.#update(displayedPosition,cam)
    }
    #update(displayedPosition,cam){
        const mouseX = Gadget.mousePosition.x, mouseY = Gadget.mousePosition.y
        if(mouseX > displayedPosition.x && 
            mouseX < displayedPosition.x+this.dimension.width  &&
            mouseY > displayedPosition.y && 
            mouseY < displayedPosition.y+this.dimension.height ){
            if(!this.MouseEnter){this.MouseEnter=true;this.#mouseEnter(cam)}   
        } else{
            if(this.MouseEnter){this.MouseEnter=false;this.#mouseLeave(cam)}
        }
    }
    #updateCachCanvas(){
        this.#cachCanvas.width = this.dimension.width;
        this.#cachCanvas.height = this.dimension.height;
    }
    #mouseEnter(cam){
        if(typeof this.onMouseEnter === 'function')
            this.onMouseEnter(cam);
    }
    #mouseLeave(cam){
        if(typeof this.onMouseLeave === 'function')
            this.onMouseLeave(cam);
    }
    #mouseOver(cam){
        if(typeof this.onMouseOver === 'function')
            this.onMouseOver(cam);
    }
    #mouseClick(cam){
        if(typeof this.onClick === 'function')
            this.onClick(cam);
    }

    // Setters
    set position(position){
        if(!(position instanceof Object) || !('x' in position) || !('y' in position)) {
            throw new Error("Invalid position object, position must be {x,y}");
        }
        this.#position = position;
    }
    set dimension(dimension){
        if(!(dimension instanceof Object) || !('width' in dimension) || !('height' in dimension)) {
            throw new Error("Invalid dimension object, dimension must be {width,height}");
        }
        this.#dimension = dimension;
    }
    set onMouseOver(callback){
        this.#onMouseOver = callback;
    }
    set onMouseEnter(callback){
        this.#onMouseEnter = callback;
    }
    set onMouseLeave(callback){
        this.#onMouseLeave = callback;
    }
    set onClick(callback){
        this.#onClick = callback;
    }

    // Getters
    get position(){
        return this.#position;
    }
    get dimension(){
        return this.#dimension;
    }
    get onMouseEnter(){
        return this.#onMouseEnter;
    }
    get onMouseLeave(){
        return this.#onMouseLeave;
    }
    get onMouseOver(){
        return this.#onMouseOver;
    }
    get onClick(){
        return this.#onClick;
    }
}

export {Gadget}