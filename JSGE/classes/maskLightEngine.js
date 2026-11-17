import {LightEmitter} from './lightEmitter.js';
class maskLightEngine {
    #mask = {
        x:0,
        y:0,
        width:0,
        height:0,
        color:'rgba(0,0,0,1)'
    }
    #lightEmitters = [];
    #zOrder = 999;
    #maskCanvas = document.createElement('canvas');
    #RenderCanvas = document.createElement('canvas');
    _renderCanvasUpToDate = false;
    constructor(mask) {
        this.#mask = mask;
        this.#maskCanvas.width = mask.width;
        this.#maskCanvas.height = mask.height;
        this.#RenderCanvas.width = mask.width;
        this.#RenderCanvas.height = mask.height;
        this.#updateMaskCanvas();
    }
    // Public methods
    addLightEmitter(x,y,radius,color=null) {
        const lightEmitterInstance = new LightEmitter(this,x, y, radius, color);
        this.#lightEmitters.push(lightEmitterInstance);
        this._renderCanvasUpToDate = false;
        return lightEmitterInstance;
    }
    removeLightEmitter(lightEmitterInstance) {
        this.#lightEmitters = this.#lightEmitters.filter(emitter => emitter !== lightEmitterInstance);
        this._renderCanvasUpToDate = false;
    }
    getLightEmitters() {
        return this.#lightEmitters;
    }
    getRenderCtx(){
        return this.#RenderCanvas.getContext('2d');
    }

    // Private methods
    _drawLightEmitters(cam) {
        this.#updateRenderCanvas();
        const ctx = cam.cameraCtx;
        ctx.drawImage(this.#RenderCanvas, this.#mask.x, this.#mask.y);
    }
    #updateMaskCanvas() {
        const maskCtx = this.#maskCanvas.getContext('2d');
        maskCtx.clearRect(0, 0, this.#maskCanvas.width, this.#maskCanvas.height);
        maskCtx.fillStyle = this.#mask.color;
        maskCtx.fillRect(this.#mask.x, this.#mask.y, this.#mask.width, this.#mask.height);
    }
    #updateRenderCanvas() {
        if(this._renderCanvasUpToDate) return;
        const renderCtx = this.#RenderCanvas.getContext('2d');
        renderCtx.clearRect(0, 0, this.#RenderCanvas.width, this.#RenderCanvas.height);
        renderCtx.drawImage(this.#maskCanvas, 0, 0);
        renderCtx.globalCompositeOperation = 'destination-out';
        for (const emitter of this.#lightEmitters)  { // Make a 'hole' in the mask
            renderCtx.drawImage(emitter._cachCanvas,0,0,emitter.radius*2,emitter.radius*2,
                emitter.x-emitter.radius,emitter.y-emitter.radius,emitter.radius*2,emitter.radius*2);
        }
        renderCtx.globalCompositeOperation = 'source-over';
        for (const emitter of this.#lightEmitters){ // Apply the light color filter
            if(emitter.color){
                renderCtx.drawImage(emitter._cachCanvas,emitter.radius*2,0,emitter.radius*2,emitter.radius*2,
                    emitter.x-emitter.radius,emitter.y-emitter.radius,emitter.radius*2,emitter.radius*2);
            }
        }
        renderCtx.globalCompositeOperation = 'source-over';
        this._renderCanvasUpToDate = true;
    }
    // Setters
    set mask(value) {
        this.#mask.x = value.x || this.#mask.x;
        this.#mask.y = value.y || this.#mask.y;
        this.#mask.width = value.width || this.#mask.width;
        this.#mask.height = value.height || this.#mask.height;
        this.#mask.color = value.color || this.#mask.color;
        this.#maskCanvas.width = this.#mask.width;
        this.#maskCanvas.height = this.#mask.height;
        this.#updateMaskCanvas();
        this._renderCanvasUpToDate = false;
    }
    set zOrder(value) {
        this.#zOrder = value;
    }
    // Getters
    get mask() {
        return this.#mask;
    }
    get zOrder() {
        return this.#zOrder;
    }
}

export { maskLightEngine };
