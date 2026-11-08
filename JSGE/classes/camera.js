import { maskLightEngine } from "./maskLightEngine.js";
class Camera {
    #canvas;
    #ctx;
    #cameraCanvas;
    #cameraCtx;
    #position={x:0,y:0};
    #dimensions;
    #backgroundType;
    #backgroundColor;
    #backgroundImage;
    #backgroundImageVelocity;
    #backgroundImagePosition;
    #backgroundImageLoop;
    #backgroundImageDimension;
    #backgroundImageFillStyle;
    #cacheCanvas;
    #targetFPS;
    #updateTime=undefined;
    #newFrame= true;
    #drawList = [];
    #scenes = [];
    #toleranceDelta = 2; // Number of ms the camera will tolerate to consider a frame must be redraw (avoid imprecision of requestAnimationFrame)
    #childCamera = false;
    #childCameras = [];
    #lightEngine= false;
    #onMouseMouve
    #onUpdate;
    #postProcess;
    static mouseEvent = false;
    static mousePosition={x:0,y:0};
    #cameraMousePosition={x:0,y:0}
    static cameras = []
    /**
     * Creates a camera object that will be used to render the scene
     * @param {canvas} string - The canvas element that the camera will render to (must be an ID)
     * @param {position} object - The position of the camera in the scene (x,y)
     * @param {dimensions} object - The dimensions of the camera (width,height)
     * @param {backgroundColor} string - The background color of the camera
     * @param {backgroundImage} img - The background image of the camera
     * @param {targetFPS} int - the number of images per secondes the camera will try to stabilize
     * @returns {void}
     */
    constructor({canvas,position={x:0,y:0},dimensions={width:100,height:100},backgroundColor=null,backgroundImage=null},targetFPS=60) {
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d");
        this.cameraCanvas = document.createElement('canvas');
        this.cameraCanvas.width = dimensions.width;
        this.cameraCanvas.height = dimensions.height;
        this.cameraCtx = this.cameraCanvas.getContext("2d");
        this.position = position;
        this.dimensions = dimensions;
        this.backgroundType = backgroundColor ? "color": null;
        if (backgroundColor || backgroundImage) {
            this.cacheCanvas = document.createElement('canvas');
            this.cacheCanvas.width = this.dimensions.width;
            this.cacheCanvas.height = this.dimensions.height;
            if(backgroundImage) {
                this.backgroundImage = backgroundImage;
            }else {
                this.#updateCacheCanvas();
            }
        }
        this.backgroundColor = backgroundColor;
        this.#targetFPS = 1000/targetFPS;
        this.#setListeners();
        Camera.cameras.push(this);
    }

    // Public Methodes
    static createChildCamera(parentCamera, position, dimensions, backgroundColor=null, backgroundImage=null) {
        if(position.x + dimensions.width > parentCamera.dimensions.width || position.y + dimensions.height > parentCamera.dimensions.height) {
            throw new Error("Child camera dimensions exceed parent camera dimensions");
        }
        const childCamera = new Camera({canvas: parentCamera.canvas, position: {x: position.x + parentCamera.position.x, y: position.y + parentCamera.position.y}, dimensions, backgroundColor, backgroundImage}, 1000/parentCamera.targetFPS);
        childCamera.#childCamera = true;
        parentCamera.#childCameras.push(childCamera);
        return childCamera;
    }
    clear() {
        if(!this.#isNewFrame())
            return;
        let x = 0, y = 0, startX = 0, startY = 0, endX = this.dimensions.width, endY = this.dimensions.height
        if(!this.#childCamera){ // Child cameras will not clear the canvas, they will only draw on top of the parent camera
            this.ctx.clearRect(x, y, this.dimensions.width, this.dimensions.height);
            this.cameraCtx.clearRect(0, 0, this.dimensions.width, this.dimensions.height);
        }
        if (this.backgroundType === "color" || this.backgroundType === "image") {
            if(this.backgroundType === "image" && this.backgroundImageVelocity) {
                this.backgroundImagePosition.x += this.backgroundImageVelocity.x;
                this.backgroundImagePosition.y += this.backgroundImageVelocity.y;
                if(this.backgroundImageLoop) {
                    const updates = this.#calcLoop(startX, startY, x, y, endX, endY);
                    startX=updates.startX; startY=updates.startY; x=updates.x; y=updates.y; endX=updates.endX;endY=updates.endY;
                }
            }
            this.#renderClear(startX,startY,x,y,endX,endY)
        }
        if(this.#childCameras.length) { // Clear child cameras
            this.#childCameras.forEach((childCamera)=>{
                childCamera.clear();
            });
        };
    }
    moveCamera(newPosition, mode="relative") {
        if (mode === "relative") {
            this.position.x += newPosition.x;
            this.position.y += newPosition.y;
        } else if (mode === "absolute") {
            this.position.x = newPosition.x;
            this.position.y = newPosition.y;
        }
    }
    drawCameraBorder(color) {
        const zeroX = this.position.x;
        const zeroY = this.position.y
        this.ctx.beginPath();
        this.ctx.moveTo(zeroX,zeroY);
        this.ctx.lineTo(this.dimensions.width+zeroX,zeroY);
        this.ctx.lineTo(this.dimensions.width+zeroX,this.dimensions.height+zeroY);
        this.ctx.lineTo(zeroX,this.dimensions.height+zeroY);
        this.ctx.lineTo(zeroX,zeroY);
        this.ctx.strokeStyle = color
        this.ctx.stroke()
    }
    flipBuffer(){
        const newFrame = this.#newFrame;
        const drawAfterLight = [];
        if(this.#newFrame || this.#childCamera){
            // Process onUpdate function
            if(typeof this.#onUpdate === 'function'){
                this.#onUpdate();
            }
            // Process scenes drawing
            if(this.#scenes.length){
                this.#scenes.forEach((scene)=>{
                    scene.forEach((item) =>{
                        if(this.#lightEngine){
                            if(item.zOrder > this.#lightEngine.zOrder){
                                drawAfterLight.push(item.el)
                            } else{
                                item.el._processDraw(this)
                            }
                        }else{
                            item.el._processDraw(this);
                        }
                    });
                });
            }
            // Process direct draw call list
            if(this.#drawList.length){
                this.#drawList.sort((a,b)=>a.zOrder-b.zOrder);
                this.#drawList.forEach((item) => {
                        if(this.#lightEngine){
                            if(item.zOrder > this.#lightEngine.zOrder){
                                drawAfterLight.push(item.el)
                            } else{
                                item.el._processDraw(this)
                            }
                        }else{
                            item.el._processDraw(this);
                        }
                });
            }
            // Process child camera drawing
            if(this.#childCameras.length) { // Flip child cameras
                this.#childCameras.forEach((childCamera)=>{
                    childCamera.flipBuffer();
                });
            }
            // Process light engine drawing
            if(this.#lightEngine){ // Draw light emitters if the light engine is initialized
                this.#lightEngine._drawLightEmitters(this);
            }
            // Process drawing of element with a zOrder > to the light mask zOrder
            if(drawAfterLight.length){
                for(const item of drawAfterLight){
                    item._processDraw(this);
                }
            }
            // Process postProcess function
            if(this.#postProcess && typeof this.#postProcess === 'function'){
                this.#postProcess(this);
            }
            // Draw the camera canvas to the main canvas
            this.ctx.drawImage(this.cameraCanvas, this.position.x, this.position.y);
            this.#newFrame = false; // Reset newFrame to false to respect frame rate
        }
        this.#scenes.length = 0;
        this.#drawList.length = 0
        return newFrame;
    }
    initMaskLightEngine() {
        const mask = {x:0,y:0,width:this.dimensions.width,height:this.dimensions.height};
        this.#lightEngine = new maskLightEngine(mask);
        return this.#lightEngine;
    }

    // Private methodes
    #setListeners(){
        if(!Camera.mouseEvent){
            Camera.mouseEvent = true;
            document.addEventListener('mousemove',(e)=>{
            Camera.mousePosition.x = e.pageX;
            Camera.mousePosition.y = e.pageY;
            Camera.cameras.forEach((cam) => {
                if(e.pageX >= cam.position.x && e.pageX <= cam.position.x + cam.dimensions.width && e.pageY >= cam.position.y && e.pageY <= cam.position.y + cam.dimensions.height) {
                    cam.#cameraMousePosition = {
                        x:e.pageX - cam.position.x,
                        y:e.pageY - cam.position.y
                    }
                    if(cam.#onMouseMouve) cam.#onMouseMouve(cam.cameraMousePosition);
                }
            })
            })
        }
    }
    _addToDrawList(elem,zOrder){
        this.#drawList.push({el:elem,zOrder:zOrder});
    }
    _addToDrawScene(scene){
        this.#scenes.push(scene);
    }
    #isNewFrame(){
        const time = performance.now()
        if(time-(this.#updateTime - this.#toleranceDelta ) >=  this.#targetFPS || this.#updateTime===undefined){
            this.#updateTime = time;
            this.#newFrame = true;
            return true;
        }
        return false ;
    }
    #renderClear(startX,startY,x,y,endX,endY){
        if(this.backgroundType === "color" || !this.backgroundImageLoop){
            this.cameraCtx.drawImage(this.cacheCanvas, startX, startY,endX,endY,x,y,endX,endY);
            return
        }
        const width = this.cacheCanvas.width;
        const height = this.cacheCanvas.height;
        let loopX = Math.ceil((this.dimensions.width)/ width);
        let loopY = Math.ceil(this.dimensions.height / height);
        if(loopX === 1 && this.backgroundImagePosition.x !== 0) loopX++;
        if(loopY === 1 && this.backgroundImagePosition.y !== 0) loopY++;
        const firstStartX = this.backgroundImagePosition.x === 0 ? 0 : this.backgroundImagePosition.x > 0 ? 
            this.backgroundImageDimension.width - this.backgroundImagePosition.x : Math.abs(this.backgroundImagePosition.x);
        const firstStartY = this.backgroundImagePosition.y === 0 ? 0 : this.backgroundImagePosition.y > 0 ?
            this.backgroundImageDimension.height - this.backgroundImagePosition.y : Math.abs(this.backgroundImagePosition.y);
        const firstEndX = this.backgroundImageDimension.width - firstStartX;
        const firstEndY = this.backgroundImageDimension.height - firstStartY;
        if(this.dimensions.width -((loopX-2)*width+(width-firstStartX)) > width ) loopX++;
        if(this.dimensions.height - ((loopY-2)*height+(height-firstStartY)) > height) loopY++
        let lastEndX = this.dimensions.width - this.backgroundImageDimension.width*(loopX-1)+firstStartX;
        let lastEndY = this.dimensions.width - this.backgroundImageDimension.height*(loopY-1)+firstStartY;
        // Draw the 'mosaic' to fill the camera
        for (let i = 0; i < loopX; i++){
            for (let j = 0; j < loopY; j++) {
                let newEndX = i === 0 ? this.backgroundImageDimension.width - firstStartX : i === loopX-1 ? lastEndX : width;
                if(newEndX > this.#dimensions.width) newEndX = firstStartX > 0 ? this.#dimensions.width : this.#dimensions.width - firstStartX;
                let newEndY = j === 0 ? this.backgroundImageDimension.height - firstStartY : j === loopY-1 ? lastEndY : height;
                if(newEndY > this.#dimensions.height) newEndY = firstStartY > 0 ? this.#dimensions.height : this.#dimensions.height - firstStartY;
                const newStartX = i === 0 ? firstStartX : 0;
                const newStartY = j === 0 ? firstStartY : 0;
                const startDrawX = i === 0 ? 0 : width*(i-1)+firstEndX
                const startDrawY = j === 0 ? 0 : height*(j-1)+firstEndY
                this.cameraCtx.drawImage(this.cacheCanvas,newStartX,newStartY,newEndX,newEndY,startDrawX,startDrawY,newEndX,newEndY);
                // if(j == loopY-1) console.log(startDrawY+newEndY)
            }
        }
    }
    #calcLoop(startX,startY,x,y,endX,endY){
        if(this.backgroundImagePosition.x > this.backgroundImageDimension.width || this.backgroundImagePosition.x + this.backgroundImageDimension.width < 0) {
            this.backgroundImagePosition.x = 0
        }
        if(this.backgroundImagePosition.y > this.backgroundImageDimension.height || this.backgroundImagePosition.y + this.backgroundImageDimension.height < 0){
            this.backgroundImagePosition.y = 0;
        }
        if(this.backgroundImagePosition.x !== 0){
            startX = 0; 
            x = Math.abs(this.backgroundImagePosition.x);// + this.position.x;
            endX = this.dimensions.width;// - this.backgroundImagePosition.x;
        } else {
            startX += Math.abs(this.backgroundImagePosition.x);
        }
        if(this.backgroundImagePosition.y !== 0){
            startY = 0;
            y = Math.abs(this.backgroundImagePosition.y);// + this.position.y;
            endY = this.dimensions.height;// - this.backgroundImagePosition.y;
        } else {
            startY += Math.abs(this.backgroundImagePosition.y);
        }
        return {startX,startY,x,y,endX,endY}
    }
    #updateCacheCanvas() {
        if(this.cacheCanvas) {
            const cacheCtx = this.cacheCanvas.getContext('2d');
            cacheCtx.clearRect(0,0,this.dimensions.width,this.dimensions.height)
            if(this.backgroundType === "color") {
                cacheCtx.fillStyle = this.backgroundColor;
                cacheCtx.fillRect(0, 0, this.dimensions.width, this.dimensions.height);
            } else if(this.backgroundType === "image") {
                if(this.backgroundImage){
                    if(!this.backgroundImageFillStyle || this.backgroundImageFillStyle === "fill"){
                        this.cacheCanvas.width = this.dimensions.width;
                        this.cacheCanvas.height = this.dimensions.height;
                        this.backgroundImageDimension = {width: this.dimensions.width, height: this.dimensions.height};
                        if(!this.#backgroundImagePosition) this.backgroundImagePosition = {x:0,y:0};
                    }else {
                        this.cacheCanvas.width = this.backgroundImage.width;
                        this.cacheCanvas.height = this.backgroundImage.height;
                        this.backgroundImageDimension = {width: this.backgroundImage.width, height: this.backgroundImage.height};
                    }
                    cacheCtx.drawImage(this.backgroundImage, 0, 0, this.#backgroundImageDimension.width, this.#backgroundImageDimension.height);
                }
            }
        }
    }

    //Setters
    set position(position) {
        this.#position = position;
    }
    set dimensions(dimensions) {
        if(!(dimensions instanceof Object) || !('width' in dimensions) || !('height' in dimensions)) {
            throw new Error("Invalid dimensions object, dimensions must be {width, height}");
        }
        this.#dimensions = dimensions;
        if(this.cacheCanvas) {
            this.cacheCanvas.width = dimensions.width;
            this.cacheCanvas.height = dimensions.height;
            this.#updateCacheCanvas();
        }
        this.cameraCanvas.width = dimensions.width;
        this.cameraCanvas.height = dimensions.height;
    }
    set canvas(canvas){
        if(canvas instanceof HTMLCanvasElement) {
            this.#canvas = canvas;
        } else {
            throw new Error("Invalid canvas object");
        }
    }
    set cameraCanvas(cameraCanvas){
        if(cameraCanvas instanceof HTMLCanvasElement) {
            this.#cameraCanvas = cameraCanvas;
        } else {
            throw new Error("Invalid camera canvas object");
        }
    }
    set backgroundType(backgroundType) {
        if(backgroundType !== "color" && backgroundType !== "image" && backgroundType !== null) {
            throw new Error("Invalid background type, must be 'color', 'image' or null");
        }
        this.#backgroundType = backgroundType;
    }
    set backgroundColor(backgroundColor) {
        this.#backgroundColor = backgroundColor;
        this.#updateCacheCanvas();
    }
    set backgroundImage(backgroundImage) {
        try {
            const img = new Image();
            img.src = backgroundImage;
            img.onload = () => {
                this.#backgroundImage = img;
                this.#backgroundType = 'image';
                this.#updateCacheCanvas();
            }
            img.onerror = () => {
                throw new Error("Invalid background image path");
            }
        } catch (error) {
            throw new Error("Invalid background image path");
        }
    }
    set backgroundImageVelocity(velocity) {
        if(velocity && typeof velocity === 'object' && 'x' in velocity && 'y' in velocity) {
            this.#backgroundImageVelocity = velocity;
            if(!this.#backgroundImagePosition) {
                this.#backgroundImagePosition = {x:0,y:0};
            }
        } else {
            throw new Error("Invalid velocity object, must be an object with x and y properties");
        }
    }
    set backgroundImageLoop(loop) {
        this.#backgroundImageLoop = loop;
    }
    set backgroundImageFillStyle(style) {
        if (!style === 'fill' && !style === 'imageSize')
            throw new Error("Invalid style, style must be 'fill' or 'imageSize")
        this.#backgroundImageFillStyle = style
        this.#updateCacheCanvas()
    }
    set backgroundImageDimension(dimensions) {
        if(!(dimensions instanceof Object) || !('width' in dimensions) || !('height' in dimensions)) {
            throw new Error("Invalid dimensions object, dimensions must be {width, height}");
        }
        this.#backgroundImageDimension = dimensions;
    }
    set backgroundImagePosition(position) {
        if(!(position instanceof Object) || !('x' in position) || !('y' in position)) {
            throw new Error("Invalid position object, position must be {x,y}");
        }
        this.#backgroundImagePosition = position;
    }
    set ctx(ctx) {
        if(ctx instanceof CanvasRenderingContext2D) {
            this.#ctx = ctx;
        } else {
            throw new Error("Invalid context object");
        }
    }
    set cameraCtx(cameraCtx) {
        if(cameraCtx instanceof CanvasRenderingContext2D) {
            this.#cameraCtx = cameraCtx;
        } else {
            throw new Error("Invalid camera context object");
        }
    }
    set cacheCanvas(cacheCanvas) {
        if(cacheCanvas instanceof HTMLCanvasElement) {
            this.#cacheCanvas = cacheCanvas;
        }
    }
    set targetFPS(targetFPS){
        this.#targetFPS=1000/targetFPS;
    }
    set toleranceDelta(tolerance){
        this.#toleranceDelta=tolerance;
    }
    set onMouseMouve(callback){
        if(typeof callback !== 'function') {
            throw new Error("Invalid callback, must be a function");
        }
        this.#onMouseMouve = callback;
    }
    set onUpdate(callback){
        if(typeof callback !== 'function'){
            throw new Error("Invalid callback, must be a function");
        }
        this.#onUpdate = callback;
    }
    set postProcess(callback){
        if(typeof callback !== 'function'){
            throw new Error("Invalid callback, must be a function");
        }
        this.#postProcess = callback;
    }

    //Getters
    get position() {
        return this.#position;
    }
    get dimensions() {
        return this.#dimensions;
    }
    get ctx() {
        return this.#ctx;
    }
    get canvas(){
        return this.#canvas;
    }
    get cameraCanvas(){
        return this.#cameraCanvas;
    }
    get cameraCtx(){
        return this.#cameraCtx;
    }
    get backgroundType(){
        return this.#backgroundType;
    }
    get backgroundColor(){
        return this.#backgroundColor;
    }
    get backgroundImage(){
        return this.#backgroundImage;
    }
    get backgroundImageVelocity() {
        return this.#backgroundImageVelocity;
    }
    get backgroundImageLoop() {
        return this.#backgroundImageLoop;
    }
    get backgroundImagePosition() {
        return this.#backgroundImagePosition;
    }
    get backgroundImageFillStyle(){
        return this.#backgroundImageFillStyle;
    }
    get backgroundImageDimension(){
        return this.#backgroundImageDimension;
    }
    get cacheCanvas() {
        return this.#cacheCanvas;
    }
    get targetFPS() {
        return this.#targetFPS;
    }
    get toleranceDelta() {
        return this.#toleranceDelta;
    }
    get onMouseMouve(){
        return this.#onMouseMouve;
    }
    get cameraMousePosition(){
        return this.#cameraMousePosition;
    }
    get onUpdate(){
        return this.#onUpdate;
    }
    get postProcess(){
        return this.#postProcess;
    }
}
export  {Camera};
