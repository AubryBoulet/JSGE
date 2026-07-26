class Element {
    #sprite;
    #position;
    #scale;
    #targetFPS;

    constructor({sprite,position={x:0,y:0},scale=1,targetFPS=60}){
        this.sprite = sprite;
        this.position = position;
        this.scale = scale;
        this.targetFPS = targetFPS;        
    }

    drawElement(cam){
        if(!cam instanceof Camera) throw new Error('Invalide camera object in ',cam);
        let width, height, frame
        if(this.sprite.animate){
            throw new Error('Element cannot be animated');
        } else {
            width = this.image.width;
            height = this.image.height;
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
        this.draw(cam,dimension,position);
    }
    draw(camera,dimension,position) {
        if(position.x > camera.dimensions.width || position.y > camera.dimensions.height || 
            position.x+dimension.width*this.scale <= 0 || position.y+dimension.height*this.scale <= 0) 
            return
        if (position.x < 0){
            dimension.x -= position.x
            dimension.width += position.x
            position.width += position.x
            position.x = 0
        }
        if (position.x + position.width > camera.dimensions.width){
            const reduction = (position.width + position.x - camera.dimensions.width)
            dimension.width -= reduction/this.scale;
            position.width -= reduction
        }
        if (position.y + position.height > camera.dimensions.height){
            const reduction = (position.height + position.y - camera.dimensions.height)
            dimension.height -= reduction/this.scale;
            position.height -= reduction
        }
        camera.ctx.drawImage(this.image,dimension.x,dimension.y,dimension.width,dimension.height,position.x,position.y,position.width,position.height)
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
    set targetFPS(targetFPS) {
        this.#targetFPS = targetFPS;
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
    get targetFPS() {
        return this.#targetFPS;
    }
}

export  {Element};