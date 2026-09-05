import {Animation} from "./animation.js";
import {Camera} from "./camera.js";
class Sprite {
    #image;
    #imageLoaded = false;
    #animate;
    #animations;
    #width;
    #height;
    #ctx;
    constructor(imageSrc,animate,width,height) {
        if(!imageSrc) {
            this.image = document.createElement('canvas');
            this.#ctx = this.image.getContext('2d');
            this.image.width = width;
            this.image.height = height;
            this.imageLoaded = true;
            this.width = width;
            this.height = height;
        }else {
            this.image = new Image();
        }
        this.image.src = imageSrc;
        this.animate = animate;
        this.animations = new Animation({image:this.image,row:1,column:1,frameRate:1});
    }
    static async load(imageSrc,animate) {
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
    static create(width,height,animate) {
        return new Sprite(null,animate,width,height);
    }

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
    get ctx() {
        return this.#ctx;
    }
}

export  {Sprite};