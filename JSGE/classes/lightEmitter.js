class LightEmitter {
    #x
    #y
    #radius
    #color
    #angleRange
    #lookAt={x:1,y:0}
    #lineAngle
    _cachCanvas
    constructor(x, y, radius, color, angleRange=360) {
        this.#x = x;
        this.#y = y;
        this.#radius = radius;
        this.#color = color;
        this.#angleRange = angleRange;
        this._cachCanvas = document.createElement('canvas')
        this._cachCanvas.width = radius*4;
        this._cachCanvas.height = radius*2;
        this.#calculateLineAngle();
    }
    // Public methode
    createGradient(r0,r1,stops){
        if(!Array.isArray(stops))
            throw new Error('invalid Stops, must be an array, refer to the radialGradient documentation : https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createRadialGradient')
        const ctx = this._cachCanvas.getContext('2d');
        const rad = ctx.createRadialGradient(this.#radius*3,this.#radius,r0,this.#radius*3,this.#radius,r1);
        for (const point of stops){
            rad.addColorStop(point[0],point[1]);
        }
        this.#color = rad;
    }

    // Private methode
    #calculateLineAngle() {
        if(this.#angleRange !== 360){
            const dx = this.#lookAt.x - this.#x;
            const dy = this.#lookAt.y - this.#y;
            this.#lineAngle = Math.atan2(dy, dx); // Calculate the angle in radians
        }
        this.#updateCanvas();
    }
    #updateCanvas(){
        const ctx = this._cachCanvas.getContext('2d');
        ctx.clearRect(0,0,this._cachCanvas.width,this._cachCanvas.height);
        ctx.beginPath()
        if(this.#angleRange === 360){
            ctx.fillStyle = '#000';
            ctx.arc(this.#radius,this.#radius,this.#radius,0,2 * Math.PI);
            ctx.fill();
            if(this.#color){
                ctx.fillStyle = this.#color;
                ctx.arc(this.#radius*3,this.#radius,this.#radius,0,2 * Math.PI);
                ctx.fill();
            }
        } else {
            ctx.fillStyle = '#000';
            ctx.lineTo(this.#radius,this.#radius); // Move to the center of the light source
            ctx.arc(this.#radius,this.#radius,this.#radius,this.#lineAngle-(this.#angleRange/2* Math.PI/180),this.#lineAngle+(this.#angleRange/2* Math.PI/180))
            ctx.fill();
            if(this.#color){
                if(typeof this.#color){
                    ctx.fillStyle = this.#color;
                    ctx.moveTo(this.#radius*3,this.#radius); // Move to the center of the light source
                    ctx.arc(this.#radius*3,this.#radius,this.#radius,this.#lineAngle-(this.#angleRange/2* Math.PI/180),this.#lineAngle+(this.#angleRange/2* Math.PI/180))
                    ctx.lineTo(this.#radius*3,this.#radius); 
                    ctx.fill();
                }
            }
        }
    }

    // Setters
    set x(value) {
        this.#x = value;
    }
    set y(value) {
        this.#y = value;
    }
    set radius(value) {
        this.#radius = value;
        this.#calculateLineAngle();
    }
    set color(value) {
        this.#color = value;
        this.#calculateLineAngle();
    }
    set angleRange(value) {
        if (typeof value !== 'number') {
            throw new Error('angleRange must be an object with start and stop properties.');
        }
        this.#angleRange = value;
        this.#calculateLineAngle();
    }
    set lookAt(value) {
        if (typeof value !== 'object' || !('x' in value) || !('y' in value)) {
            throw new Error('lookAt must be an object with x and y properties.');
        }
        if(value.x === 0 && value.y === 0) {
            throw new Error('lookAt cannot be the zero vector.');
        }
        this.#lookAt = value;
        this.#calculateLineAngle();
    }
    // Getters
    get x() {
        return this.#x;
    }
    get y() {
        return this.#y;
    }
    get radius() {
        return this.#radius;
    }
    get color() {
        return this.#color;
    }
    get angleRange() {
        return this.#angleRange;
    }
    get lookAt() {
        return this.#lookAt;
    }
    get lineAngle() {
        return this.#lineAngle;
    }
}

export {LightEmitter};