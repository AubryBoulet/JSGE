import { Particle } from "./particle.js";
class ParticleEmitter {
    #x
    #y
    #particleAcceleration={x:0,y:0} // Set the particle acceleration to control the movement of particles over time
    #particleEmissionSpeed = {min: 1, max: 3} // Set a range for the speed of particles, a random speed will be chosen from this range for each particle
    #particleSize={width:1,height:1} 
    #particleColorRange={startColor:"#ffffff",endColor:"#000000"} // Set a range of colors, a random color will be chosen from this range for each particle
    #particleColorChangeRate={r:0,g:0,b:0} // Set the rate at which the particle color changes over time
    #particleLifetime={min:1000,max:2000} // Set a range for the lifetime of particles, a random lifetime will be chosen from this range for each particle
    #emissionRate=10 // Number of particles emitted per second
    #particlesPerEmission=1 // Number of particles emitted per emission
    #emissionDuration=1000 // Duration of the emission in milliseconds
    #emissionTimer=0
    #isEmitting=false
    #particleEmitterAngleRange={rangeMin:45,rangeMax:90} // The particle range (in degree) between 0 and 360. For example a range of 45 to 90 will only emit particle with an random angle between 45 and 90 degrees.
    #particleEmitterDirection={x:0,y:-1} // The direction of the particle emitter, this will be used to calculate the angle of the particles emitted. For example a direction of {x:0,y:-1} will emit particles upwards.
    #particles = [] // Array to hold the particles emitted by this emitter
    #lastEmittedTime = 0 // Time past from the last emitted particle, used to control the emission rate
    #endCallback = () => {} // Callback function to be called when the emission is finished

    constructor(x, y) {
        this.#x = x;
        this.#y = y;
    }

    // Public methods
    startEmission(endCallback = () => {}) {
        this.#isEmitting = true;
        this.#emissionTimer = performance.now();
        this.#lastEmittedTime = 0;
        if (typeof endCallback === 'function') {
            this.#endCallback = endCallback;
        } else {
            throw new Error("endCallback must be a function.");
        }
    }
    stopEmission() {
        this.#isEmitting = false;
    }
    draw(camera,zOrder=0) {
        if (this.#isEmitting || this.#particles.length > 0) {
            camera._addToDrawList(this,zOrder);
        }
    }
    clone() {
        const newEmitter = new ParticleEmitter(this.#x, this.#y);
        newEmitter.particleAcceleration = {...this.#particleAcceleration};
        newEmitter.particleEmissionSpeed = {...this.#particleEmissionSpeed};
        newEmitter.particleSize = {...this.#particleSize};
        newEmitter.particleColorRange = {...this.#particleColorRange};
        newEmitter.particleColorChangeRate = {...this.#particleColorChangeRate};
        newEmitter.particleLifetime = {...this.#particleLifetime};
        newEmitter.emissionRate = this.#emissionRate;
        newEmitter.particlesPerEmission = this.#particlesPerEmission;
        newEmitter.emissionDuration = this.#emissionDuration;
        newEmitter.particleEmitterAngleRange = {...this.#particleEmitterAngleRange};
        newEmitter.particleEmitterDirection = {...this.#particleEmitterDirection};
        return newEmitter;
    }

    // Private methods
    _processDraw(cam) {
        // check if particle is in camera view
        if (this.#x < cam.x || this.#x > cam.x + cam.width || this.#y < cam.y || this.#y > cam.y + cam.height) {
            return;
        }
        this.#updateEmission(cam);
        this.#particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx += this.#particleAcceleration.x;
            particle.vy += this.#particleAcceleration.y;

            // Update color based on change rate
            const colorRGB = this.#convertColorToRGB(particle.color);
            colorRGB.r = Math.max(0, Math.min(255, colorRGB.r + this.#particleColorChangeRate.r));
            colorRGB.g = Math.max(0, Math.min(255, colorRGB.g + this.#particleColorChangeRate.g));
            colorRGB.b = Math.max(0, Math.min(255, colorRGB.b + this.#particleColorChangeRate.b));
            particle.color = `rgb(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b})`;

            // Decrease lifetime
            particle.lifetime -= cam.targetFPS;
            // Remove particle if lifetime is over
            if (particle.lifetime <= 0) {
                this.#particles.splice(index, 1);
            }
            // Remove particle if it goes out of camera view
            if (particle.x <= 0 || particle.x + this.#particleSize.width >= cam.dimensions.width || particle.y <= 0 || particle.y + this.#particleSize.height >= cam.dimensions.height) {
                this.#particles.splice(index, 1);
            }
        });
        this.#drawParticles(cam);
        if(!this.#isEmitting && this.#particles.length === 0) {
            this.#endCallback();
        }
    }
    #drawParticles(cam) {
        const ctx = cam.ctx;
        this.#particles.forEach((particle) => {
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x + cam.position.x, particle.y + cam.position.y, this.#particleSize.width, this.#particleSize.height);
        });
    }
    #updateEmission(cam) {
        if (!this.#isEmitting) return;

        const currentTime = performance.now();
        const elapsedTime = currentTime - this.#emissionTimer;
        if (elapsedTime >= this.#emissionDuration && this.#emissionDuration) {
            this.stopEmission();
            return;
        }
        const camFPS = cam.targetFPS; // Target duration between frames in milliseconds
        const timeToEmit = 1000 / this.#emissionRate; // Time between emissions in milliseconds
        this.#lastEmittedTime += camFPS; // Increment the last emitted time by the target frame duration
        const particlesToEmit = Math.floor(this.#lastEmittedTime / timeToEmit);
        for (let i = 0; i < particlesToEmit; i++) {
            this.#emitParticles();
        }
        this.#lastEmittedTime -= particlesToEmit * timeToEmit; // Reset the last emitted time based on the number of particles emitted
    }
    #emitParticles() {
        for (let i = 0; i < this.#particlesPerEmission; i++) {
            const angle = Math.random() * (this.#particleEmitterAngleRange.rangeMax - this.#particleEmitterAngleRange.rangeMin) + this.#particleEmitterAngleRange.rangeMin;
            const speed = Math.random() * (this.#particleEmissionSpeed.max - this.#particleEmissionSpeed.min) + this.#particleEmissionSpeed.min;
            const vx = speed * Math.cos(angle * (Math.PI / 180)) + this.#particleEmitterDirection.x;
            const vy = speed * Math.sin(angle * (Math.PI / 180)) + this.#particleEmitterDirection.y;
            const startColorRGB = this.#convertColorToRGB(this.#particleColorRange.startColor);
            const endColorRGB = this.#convertColorToRGB(this.#particleColorRange.endColor);
            const color = `rgb(${Math.floor(Math.random() * (endColorRGB.r - startColorRGB.r) + startColorRGB.r)}, ${Math.floor(Math.random() * (endColorRGB.g - startColorRGB.g) + startColorRGB.g)}, ${Math.floor(Math.random() * (endColorRGB.b - startColorRGB.b) + startColorRGB.b)})`;
            const lifetime = Math.random() * (this.#particleLifetime.max - this.#particleLifetime.min) + this.#particleLifetime.min;
            const particle = new Particle(this.#x, this.#y, vx, vy, this.#particleSize, color, lifetime);
            this.#particles.push(particle);
        }
    }
    #convertColorToRGB(color) {
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const bigint = parseInt(hex, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return { r, g, b };
        } else if (color.startsWith('rgb')) {
            const rgbValues = color.match(/\d+/g).map(Number);
            return { r: rgbValues[0], g: rgbValues[1], b: rgbValues[2] };
        } else {
            throw new Error("Unsupported color format. Use hex or rgb.");
        }
    }

    // Setters
    set x(value) {
        this.#x = value;
    }
    set y(value) {
        this.#y = value;
    }
    set particleAcceleration(value) {
        if (typeof value === 'object' && value !== null && 'x' in value && 'y' in value) {
            this.#particleAcceleration = value;
        } else {
            throw new Error("particleAcceleration must be an object with x and y properties.");
        }
    }
    set particleEmissionSpeed(value) {
        if (typeof value === 'object' && value !== null && 'min' in value && 'max' in value) {
            this.#particleEmissionSpeed = value;
        } else {
            throw new Error("particleEmissionSpeed must be an object with min and max properties.");
        }
    }
    set particleSize(value) {
        if (typeof value === 'object' && value !== null && 'width' in value && 'height' in value) {
            this.#particleSize = value;
        } else {
            throw new Error("particleSize must be an object with width and height properties.");
        }
    }
    set particleColorRange(value) {
        if (typeof value === 'object' && value !== null && 'startColor' in value && 'endColor' in value) {
            if (value.startColor.startsWith('#') || value.startColor.startsWith('rgb') && value.endColor.startsWith('#') || value.endColor.startsWith('rgb')) {
                this.#particleColorRange = value;
            } else {
                throw new Error("startColor and endColor must be in hex or rgb format.");
            }
        } else {
            throw new Error("particleColorRange must be an object with startColor and endColor properties.");
        }
    }
    set particleColorChangeRate(value) {
        if (typeof value === 'object' && value !== null && 'r' in value && 'g' in value && 'b' in value) {
            this.#particleColorChangeRate = value;
        } else {
            throw new Error("particleColorChangeRate must be an object with r, g, and b properties.");
        }
    }
    set particleLifetime(value) {
        if (typeof value === 'object' && value !== null && 'min' in value && 'max' in value) {
            this.#particleLifetime = value;
        } else {
            throw new Error("particleLifetime must be an object with min and max properties.");
        }
    }
    set emissionRate(value) {
        this.#emissionRate = value;
    }
    set particlesPerEmission(value) {
        this.#particlesPerEmission = value;
    }
    set emissionDuration(value) {
        this.#emissionDuration = value;
    }
    set particleEmitterAngleRange(value) {
        if (typeof value === 'object' && value !== null && 'rangeMin' in value && 'rangeMax' in value) {
            this.#particleEmitterAngleRange = value;
        } else {
            throw new Error("particleEmitterAngleRange must be an object with rangeMin and rangeMax properties.");
        }
    }
    set particleEmitterDirection(value) {
        if (typeof value === 'object' && value !== null && 'x' in value && 'y' in value) {
            this.#particleEmitterDirection = value;
        } else {
            throw new Error("particleEmitterDirection must be an object with x and y properties.");
        }
    }

    // Getters
    get x() {
        return this.#x;
    }
    get y() {
        return this.#y;
    }
    get particleAcceleration() {
        return this.#particleAcceleration;
    }
    get particleEmissionSpeed() {
        return this.#particleEmissionSpeed;
    }
    get particleSize() {
        return this.#particleSize;
    }
    get particleColorRange() {
        return this.#particleColorRange;
    }
    get particleColorChangeRate() {
        return this.#particleColorChangeRate;
    }
    get particleLifetime() {
        return this.#particleLifetime;
    }
    get emissionRate() {
        return this.#emissionRate;
    }
    get particlesPerEmission() {
        return this.#particlesPerEmission;
    }
    get emissionDuration() {
        return this.#emissionDuration;
    }
    get particleEmitterAngleRange() {
        return this.#particleEmitterAngleRange;
    }
    get particleEmitterDirection() {
        return this.#particleEmitterDirection;
    }
}

export { ParticleEmitter };