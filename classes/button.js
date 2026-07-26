import {Camera} from './camera.js'
class Button {
    #position= {x:0,y:0};
    #dimension= {width: 0,height: 0};
    #backgroundType;
    #backgroundInfos;
    #cachCanvas;
    #MouseOver= false;
    #MouseEnter= false;
    #active= false;
    #onMouseOver;
    #onMouserEnter;
    #onMouseLeave;
    #onClick;
    static mouseEvent= false;
    static mousePosition={x:0,y:0};

    constructor({position,dimension,backgroundType}){
        this.#position= position;
        this.#dimension= dimension;
        backgroundType= backgroundType;
        this.#setListener();
    }
    static create(dimension,position={x:0,y:0},backgroundType='color',src=undefined){
        if(backgroundType !=='color' && backgroundType !== 'image')
            throw new Error('Invalid backgroundType, must be "color" or "image"');
        const button = new Button({dimension:dimension,position:position,backgroundType:backgroundType === 'image' ? undefined:backgroundType})
        this.cachCanvas = document.createElement('canvas');
        if(backgroundType === 'image'&&src) {
            this.backgroundImage = src
        } else if(backgroundType === 'color') {
            const backgroundInfo = {
                width: dimension.width,
                height: dimension.height,
            }
            this.backgroundInfos = backgroundInfo;
        }
        return button;
    }
    draw(cam){
        if(!cam instanceof Camera) throw new Error('Invalide camera object in ',cam);
        const displayedPosition = {x:this.position.x+cam.position.x,y:this.position.y+cam.position.y}
        cam.ctx.fillRect(displayedPosition.x,displayedPosition.y,this.dimension.width,this.dimension.height)
        this.#update(displayedPosition)
    }
    #update(displayedPosition){
        const mouseX = Button.mousePosition.x, mouseY = Button.mousePosition.y
        if(mouseX > displayedPosition.x && 
            mouseX < displayedPosition.x+this.#dimension.width  &&
            mouseY > displayedPosition.y && 
            mouseY < displayedPosition.y+this.#dimension.height ){
            if(!this.#MouseEnter){this.#MouseEnter=true;this.#onMouserEnter()}   
        } else{
            if(this.#MouseEnter){this.#MouseEnter=false;this.#onMouseLeave=true}//;this.#onMouseLeave()}
        }
    }
    #setListener(){
        if(!Button.mouseEvent){
            Button.mouseEvent = true;
            document.addEventListener('mousemove',(e)=>{
                Button.mousePosition.x = e.pageX;
                Button.mousePosition.y = e.pageY;
            })
        }
    }

    // Setters
    set backgroundImage(backgroundImage){
        try{
            const img = new Image();
            img.src = backgroundImage;
            img.onload=() =>{
                this.#backgroundType = 'image';
                const backgroundInfo = {
                    image: img,
                    width: img.width,
                    height: img.height,
                    // Complet if needed
                }
                this.#backgroundInfos = backgroundInfo;
            }
            img.onerror = () =>{
                throw new Error('Invalid button image path');
            }
        } catch(error){
            throw new Error(error)
        }
    }
    set backgroundInfos(backgroundInfos){
        this.#backgroundInfos = backgroundInfos
    }
    set onMouseOver(callback){
        this.#onMouseOver = callback;
    }
    set onMouseEnter(callback){
        this.#onMouserEnter = callback;
    }
    set onMouseLeave(callback){
        this.#onMouseLeave = callback;
    }
    set onClick(callback){
        this.#onClick = callback;
    }
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

    // Getters
    get position(){
        return this.#position;
    }
    get dimension(){
        return this.#dimension;
    }
    get backgroundType(){
        return this.#backgroundType;
    }
    get backgroundInfo(){
        return this.#backgroundInfos;
    }
    get onMouseEnter(){
        return this.#onMouserEnter;
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

export {Button}