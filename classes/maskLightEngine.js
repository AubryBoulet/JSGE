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
    #zIndex = 999;
    #maskCanvas = document.createElement('canvas');
    #RenderCanvas = document.createElement('canvas');
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
        const lightEmitterInstance = new LightEmitter(x, y, radius, color);
        this.#lightEmitters.push(lightEmitterInstance);
        return lightEmitterInstance;
    }
    removeLightEmitter(lightEmitterInstance) {
        this.#lightEmitters = this.#lightEmitters.filter(emitter => emitter !== lightEmitterInstance);
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
        const ctx = cam.canvas.getContext('2d');
        ctx.drawImage(this.#RenderCanvas, this.#mask.x+cam.position.x, this.#mask.y+cam.position.y);
    }
    #updateMaskCanvas() {
        const maskCtx = this.#maskCanvas.getContext('2d');
        maskCtx.clearRect(0, 0, this.#maskCanvas.width, this.#maskCanvas.height);
        maskCtx.fillStyle = this.#mask.color;
        maskCtx.fillRect(this.#mask.x, this.#mask.y, this.#mask.width, this.#mask.height);
    }
    #updateRenderCanvas() {
        const renderCtx = this.#RenderCanvas.getContext('2d');
        renderCtx.clearRect(0, 0, this.#RenderCanvas.width, this.#RenderCanvas.height);
        renderCtx.drawImage(this.#maskCanvas, 0, 0);
        renderCtx.globalCompositeOperation = 'destination-out';
        for (const emitter of this.#lightEmitters)  {
            renderCtx.beginPath();
            if(emitter.angleRange === 360){
                renderCtx.arc(emitter.x, emitter.y, emitter.radius, 0, 2 * Math.PI);
            } else {
                renderCtx.lineTo(emitter.x, emitter.y); // Move to the center of the light source
                renderCtx.arc(emitter.x, emitter.y, emitter.radius, emitter.lineAngle - (emitter.angleRange/2* Math.PI/180), emitter.lineAngle + (emitter.angleRange/2* Math.PI/180));
            }
            if(emitter.color){
                renderCtx.fillStyle = emitter.color;
                renderCtx.fill();
            } else {
                renderCtx.fillStyle = 'rgb(0, 0, 0)';
                renderCtx.fill();
            }
        }
        renderCtx.globalCompositeOperation = 'source-over'; // Reset to default
    }
    // Setters
    set mask(value) {
        console.log("??")
        this.#mask.x = value.x || this.#mask.x;
        this.#mask.y = value.y || this.#mask.y;
        this.#mask.width = value.width || this.#mask.width;
        this.#mask.height = value.height || this.#mask.height;
        this.#mask.color = value.color || this.#mask.color;
        this.#maskCanvas.width = this.#mask.width;
        this.#maskCanvas.height = this.#mask.height;
        this.#updateMaskCanvas();
    }
    set zIndex(value) {
        this.#zIndex = value;
    }
    // Getters
    get mask() {
        return this.#mask;
    }
    get zIndex() {
        return this.#zIndex;
    }
}

export { maskLightEngine };