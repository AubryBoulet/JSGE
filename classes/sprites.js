import {Animation} from "./animation.js";
import {Camera} from "./camera.js";
class Sprite {
    #image;
    #imageLoaded = false;
    #animate;
    #animations;
    #width;
    #height;
    constructor(imageSrc,animate) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.animate = animate;
        this.animations = new Animation({image:this.image,row:1,column:1,frameRate:1});
    }
    static async create(imageSrc,animate) {
        const sprite = new Sprite(imageSrc,animate);
        return new Promise((resolve, reject) => {
            sprite.image.onload = () => {
                sprite.#imageLoaded = true;
                if(sprite.animate) {
                    sprite.animations.initSpritSheet();
                } else {
                    sprite.initSpriteSheet();
                }
                resolve(sprite);
            }
            sprite.image.onerror = () => {
                reject(new Error(`Failed to load image ${sprite.imageSrc}`));
            }
        }
    )}

    initSpriteSheet(){
        this.width = this.image.width * this.scale
        this.height = this.image.height * this.scale
    }

    // Setters
    set image(image) {
        this.#image = image;
    }
    set imageLoaded(loaded) {
        this.#imageLoaded = loaded;
    }
    set animate(animate) {
        this.#animate = animate;
    }
    set animations(animations) {
        this.#animations = animations;
    }
    set width(width) {
        this.#width = width;
    }
    set height(height) {
        this.#height = height;
    }

    // Getters
    get image() {
        return this.#image;
    }
    get imageLoaded() {
        return this.#imageLoaded;
    }
    get animate() {
        return this.#animate;
    }
    get animations() {
        return this.#animations;
    }
    get width() {
        return this.#width;
    }
    get height() {
        return this.#height;
    }
}

export  {Sprite};