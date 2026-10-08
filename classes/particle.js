class Particle {
    #x
    #y
    #vx
    #vy
    #size
    #color
    #lifetime
    constructor(x, y, vx, vy, size, color, lifetime) {
        this.#x = x;
        this.#y = y;
        this.#vx = vx;
        this.#vy = vy;
        this.#size = size;
        this.#color = color;
        this.#lifetime = lifetime;
    }
    
    // Setters
    set x(value) {
        this.#x = value;
    }

    set y(value) {
        this.#y = value;
    }

    set vx(value) {
        this.#vx = value;
    }

    set vy(value) {
        this.#vy = value;
    }

    set size(value) {
        this.#size = value;
    }

    set color(value) {
        this.#color = value;
    }

    set lifetime(value) {
        this.#lifetime = value;
    }

    // Getters
    get x() {
        return this.#x;
    }

    get y() {
        return this.#y;
    }

    get vx() {
        return this.#vx;
    }

    get vy() {
        return this.#vy;
    }

    get size() {
        return this.#size;
    }

    get color() {
        return this.#color;
    }

    get lifetime() {
        return this.#lifetime;
    }

}

export { Particle };