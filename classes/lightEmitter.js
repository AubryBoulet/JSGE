class LightEmitter {
    #x
    #y
    #radius
    #color
    #angleRange
    #lookAt={x:1,y:0}
    #lineAngle
    constructor(x, y, radius, color, angleRange=360) {
        this.#x = x;
        this.#y = y;
        this.#radius = radius;
        this.#color = color;
        this.#angleRange = angleRange;
        this.#calculateLineAngle();
    }

    // Private methode
    #calculateLineAngle() {
        const dx = this.#lookAt.x - this.#x;
        const dy = this.#lookAt.y - this.#y;
        this.#lineAngle = Math.atan2(dy, dx); // Calculate the angle in radians
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
    }
    set color(value) {
        this.#color = value;
    }
    set angleRange(value) {
        if (typeof value !== 'number') {
            throw new Error('angleRange must be an object with start and stop properties.');
        }
        this.#angleRange = value;
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