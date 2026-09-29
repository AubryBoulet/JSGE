import {Sprite} from './sprites.js'
import {Camera} from './camera.js'
import {Element} from './element.js'
class Entity {
    #sprite;
    #position;
    #scale;
    #physic;
    #physics = [];
    #gravity=0;
    #gravityAcceleration=0;
    #acceleration = 0;
    #velocity={x:0,y:0};
    #currentAnimation = undefined;
    #currentAcceleration = 0;
    #currentGravity=0;
    #cliped;
    #flippedX = false;
    #flippedY = false;
    #autoUpdate = true;
    constructor({sprite,position={x:0,y:0},scale=1,physic=false,gravity=0,gravityAcceleration=1,acceleration={x:0,y:0},velocity={x:0,y:0}}){
        this.sprite = sprite;
        this.position = position;
        this.scale = scale;
        this.physic = physic;
        this.gravity = gravity;
        this.acceleration = acceleration;
        this.velocity = velocity;
        this.currentAcceleration = {x:0,y:0};
        this.cliped = undefined;
        this.#gravityAcceleration=gravityAcceleration;
    }
    /*** 
     * Create a new instance of Entity
     * @param {object} datas - An object representing the datas information for entity creation, default values are :{sprite,position={x:0,y:0},scale=1,physic=false,gravity=0,acceleration={x:0,y:0},velocity={x:0,y:0}}
     * @param {Array} assigns - An Array containing object with specific datas (optional). Use this if you want specific information and / or function for this entity (ex: player life, player damage function etc...)
     */
    static create(datas, assigns) {
        if (assigns && !Array.isArray(assigns)) {
            throw new Error('Error creating entity, assigns must be an Array of objects');
        }
        const entity = new Entity(datas);

        if (assigns) {
            entity.assign(assigns);
        }
        return entity;
    }
    // Public methodes
    draw(cam,zOrder=0){
        cam._addToDrawList(this,zOrder);
    }
    resetAcceleration(){
        this.#currentAcceleration = 0;
    }
    addColisionWithEntity(entity,onCollision){
        if(!entity instanceof Entity) throw new Error('Invalid entity !');
        if(typeof onCollision !== "function" ) throw new Error('Invalid collision, must be a function !');
        this.#physics.push({entity:entity,onCollision:onCollision});
    }
    update() {
        if(this.sprite.animate && !this.currentAnimation) throw new Error('You must set a currentAnimation first')
        this.#updatePositionX();
        this.#updatePositionY();
        if(this.sprite.animate) this.#updateAnimationFrame();
        if(this.physic) this.#checkEntityCollision();
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
    
    // Private methodes
    _processDraw(cam){
        if(!cam instanceof Camera) throw new Error('Invalide camera object in ',cam);
        if(this.#autoUpdate)
            this.update();
        let width, height, frame
        if(this.sprite.animate){
            frame = this.currentAnimation.frames[this.currentAnimation.currentFrame]
            width = this.currentAnimation.frameWidth;
            height = this.currentAnimation.frameHeight;
        } else {
            width = this.#sprite.width;
            height = this.#sprite.height;
            frame = undefined
        }
        const dimension = {
            x: frame ? frame.column * this.currentAnimation.frameWidth : 0,
            y: frame ? frame.row * this.currentAnimation.frameHeight : 0,
            width: width,
            height: height
        }
        const position = {
            x: this.position.x,
            y: this.position.y,
            width: width* this.scale,
            height: height * this.scale
        }
        this.#drawEntiry(cam,dimension,position);
    }
    #drawEntiry(camera,dimension,position) {
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
    #updateAnimationFrame(){
        this.currentAnimation.elapsedFrames++;
        if(this.currentAnimation.elapsedFrames >= this.currentAnimation.frameRate){
            this.currentAnimation.currentFrame++;
            if(this.currentAnimation.currentFrame >= this.currentAnimation.frames.length){
                this.currentAnimation.currentFrame = 0;
            }
            this.currentAnimation.elapsedFrames = 0;
        }     
    }
    #updatePositionX(){
        if(this.velocity.x === 0){
            return
        }
        if(this.acceleration && (this.#currentAcceleration < Math.abs(this.velocity.x))){
            this.#currentAcceleration += this.acceleration;
            if(this.#currentAcceleration > Math.abs(this.velocity.x)) this.#currentAcceleration = Math.abs(this.velocity.x);
            if(this.velocity.x > 0){
                this.position.x += this.#currentAcceleration;
            } else {
                this.position.x -= this.#currentAcceleration;
            }
        } else {
            this.position.x += this.velocity.x
        }
    }
    #updatePositionY(){
        if(this.velocity.y === 0 && !this.#gravity){
            return
        }     
        if(this.acceleration && this.#currentAcceleration < Math.abs(this.velocity.y)){
            this.#currentAcceleration += this.acceleration;
            if(this.#currentAcceleration > Math.abs(this.velocity.y)) this.#currentAcceleration = Math.abs(this.velocity.y);
            if(this.velocity.y > 0){
                this.position.y += this.#currentAcceleration;
            } else {
                this.position.y -= this.#currentAcceleration;
            }
        } else {
            this.position.y += this.velocity.y
        }
        if(this.gravity){
            //Check if colision with element
            let colide = false;
            Element.displayedElement.forEach((elem)=>{
                if(this.position.x+this.#currentAnimation.frameHitBox.startWidth * this.scale < elem.position.x+elem.sprite.width*elem.scale &&
                    this.position.x+this.#currentAnimation.frameHitBox.endWidth * this.scale > elem.position.x
                ){
                    if(this.position.y+this.#currentAnimation.frameHitBox.endHeight * this.scale >= elem.position.y){
                        if(this.#currentGravity){
                            this.position.y = elem.position.y - this.currentAnimation.frameHitBox.endHeight * this.scale
                            this.#currentGravity = 0
                            if(this.#velocity.y) this.#velocity.y = 0;
                        }
                        colide = true;
                        if(typeof elem.onGravityContact === 'function'){
                            elem.onGravityContact(elem,this);
                        }
                    }
                }
            })
            if(colide === false){
                if(this.#velocity.y){
                    if(this.#velocity.y < 0){
                        this.#velocity.y += this.#currentGravity
                        if(this.#velocity.y >0){
                            this.#velocity.y = 0;
                            this.#currentGravity = 0;
                        }
                    }
                }else {
                    this.position.y+= this.#currentGravity;
                }
                this.#currentGravity+=this.#gravityAcceleration
                if(this.#currentGravity > this.#gravity)
                    this.#currentGravity = this.#gravity;
            }
        }
    }
    #checkEntityCollision(){
        this.physics.forEach(elem => {
            const el = elem.entity
            const onCollision = elem.onCollision
            if(!el instanceof Entity || !el instanceof Element) {console.error('Invalid physics object'); return};
            // Check if the entity is colliding with another entity or element
            if(this.position.x + this.#currentAnimation.frameHitBox.startWidth *this.#scale < el.position.x + el.currentAnimation.frameHitBox.endWidth * el.scale &&
                this.position.x + this.#currentAnimation.frameHitBox.endWidth * this.scale> el.position.x + el.currentAnimation.frameHitBox.startWidth * el.scale&&
                this.position.y + this.#currentAnimation.frameHitBox.startHeight * this.#scale < el.position.y + el.currentAnimation.frameHitBox.endHeight * el.scale &&
                this.position.y + this.#currentAnimation.frameHitBox.endHeight * this.scale > el.position.y + el.currentAnimation.frameHitBox.startHeight * el.scale) {
                // Collision detected!
                if(onCollision && typeof onCollision === 'function') {
                    onCollision(el);
                }
            }
        })
    }

    // Setters
    set sprite(sprite){
        if(!sprite instanceof Sprite){
            throw new Error('Invalide sprite');
        }
        this.#sprite = sprite;
    }
    set position(position){
        if(!(position instanceof Object) || !('x' in position) || !('y' in position)) {
            throw new Error("Invalid dimensions object, position must be {x, y}");
        }
        this.#position=position;
    }
    set scale(scale){
        this.#scale=scale;
    }
    set physic(physic){
        this.#physic = physic;
    }
    set physics(physics){
        this.#physics = physics;
    }
    set gravity(gravity){
        this.#gravity = gravity;
    }
    set gravityAcceleration(acceleration){
        this.#gravityAcceleration=acceleration;
    }
    set acceleration(acceleration) {
        this.#acceleration = acceleration;
    }
    set velocity(velocity){
        console.log(velocity)
        if(!(velocity instanceof Object) || !('x' in velocity) || !('y' in velocity)) {
            throw new Error("Invalid dimensions object, velocity must be {x, y}");
        }
        if(velocity.x === this.#velocity.x && velocity.y === this.#velocity.y) return;
        if(velocity.x === 0 && velocity.y === 0)
            this.#currentAcceleration = 0;
        if(velocity.y !==0)
            this.#currentGravity=0;
        this.#velocity = velocity;
    }
    set currentAnimation(animationName) {
        try{
            const animation = this.sprite.animations.getAnimationFrame(animationName)
            this.#currentAnimation = animation;
        } catch(error){
            throw new Error(error);
        }
    }
    set frameRate(frameRate){
        if(this.currentAnimation){
            this.currentAnimation.frameRate = frameRate
        } else {
            throw new Error('No animation set')
        }
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
    set autoUpdate(autoUpdate){
        if(typeof autoUpdate === 'boolean'){
            this.#autoUpdate=autoUpdate;
        } else {
            throw new Error('Invalid value for autoUpdate, must be a boolean');
        }
    }

    // Getters
    get sprite(){
        return this.#sprite;
    }
    get position(){
        return this.#position;
    }
    get scale(){
        return this.#scale;
    }
    get physic(){
        return this.#physic;
    }
    get physics(){
        return this.#physics;
    }
    get gravity(){
        return this.#gravity;
    }
    get gravityAcceleration(){
        return this.#gravityAcceleration;
    }
    get acceleration(){
        return this.#acceleration;
    }
    get velocity(){
        return this.#velocity;
    }
    get currentAnimation(){
        return this.#currentAnimation;
    }
    get flippedX(){
        return this.#flippedX;
    }
    get flippedY(){
        return this.#flippedY;
    }
    get autoUpdate(){
        return this.#autoUpdate;
    }
}

export  {Entity};