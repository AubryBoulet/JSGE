import {Gadget} from './gadget.js'
class Button extends Gadget {
    #backgroundType;
    #backgroundInfos;

    constructor({position,dimension,backgroundType,value}){
        super({position,dimension,value})
        this.#backgroundType= backgroundType;
    }
    static create(value = "", dimension = { width: 0, height: 0 }, position = { x: 0, y: 0 }, backgroundType = 'color', src = undefined) {
        if (backgroundType !== 'color' && backgroundType !== 'image')
            throw new Error('Invalid backgroundType, must be "color" or "image"');
        const button = new Button({ dimension, position, value });
        button.borderRadius = [5];
        button.backgroundColor = "lightGrey";
        button.border = { color: "black" };
        button.hoverStyle = { backgroundColor: "darkGrey" };
        button.activeStyle = { backgroundColor: "grey" };
        return button;
    }

    // Setters
    set backgroundImage(backgroundImage){
        try{
            const img = new Image();
            img.src = backgroundImage;
            img.onload=() =>{
                this.#backgroundType = 'image';
                const backgroundInfo = {
                    image: img,
                    width: img.width,
                    height: img.height,
                    // Complet if needed
                }
                this.#backgroundInfos = backgroundInfo;
            }
            img.onerror = () =>{
                throw new Error('Invalid button image path');
            }
        } catch(error){
            throw new Error(error)
        }
    }
    set backgroundInfos(backgroundInfos){
        this.#backgroundInfos = backgroundInfos
    }

    // Getters
    get backgroundType(){
        return this.#backgroundType;
    }
    get backgroundInfo(){
        return this.#backgroundInfos;
    }
}

export {Button}
