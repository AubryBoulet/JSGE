import { Bezier } from "./bezier.js";
class Transition {
    #id;
    #duration;
    #timingFunction;
    #startTime;
	#initialValue;
	#targetValue;
    #callback;
    #delay;
    #endCallback; // Callback executed when the animation is finished
    #boundAutoUpdate = () =>this.#autoUpdate();
    static #transitions = [];
    static #idCount=0;
    constructor(duration,timingFunction,delay, initialValue, targetValue, callback,endCallback) {
        this.#id = Transition.#idCount;
        Transition.#idCount++;
        this.#duration = duration;
        this.#timingFunction = timingFunction;
        this.#initialValue = initialValue;
        this.#targetValue = targetValue;
        this.#callback = callback;
        this.#startTime = performance.now()+delay;
        this.#endCallback = endCallback;
        this.#delay = delay;
        Transition.#transitions.push(this);
        if(Transition.#transitions.length === 1)
            this.#autoUpdate()
    }

    static create(args){
        const [initialValue, targetValue, timingFunction="linear", callback = ()=>{}, duration=1, delay=0,endCallback = ()=>{}] = args;
        if(typeof timingFunction !== 'string' && typeof timingFunction !== 'function')
            throw new Error('Invalid timingFunction type, must be a string or a function.')
        if(typeof timingFunction === 'string' && typeof Bezier[timingFunction] !== 'function')
            throw new Error(`Invalid timingFunction, ${timingFunction} does not exist`)
        const transition = new Transition(duration*1000,timingFunction,delay*1000,initialValue,targetValue-initialValue,callback,endCallback)
        return transition.#id;
    }

    static delete(transition){ // Cancel one transition
        Transition.#transitions = Transition.#transitions.filter((transi)=>transi.#id !== transition);
    }

    static clear(){ // Cancel all transitions
        Transition.#transitions = [];
    }
    
    static reset(transition) { // Reset startTime so the transition restart from 0
        const index = Transition.#transitions.findIndex((transi)=> transi.#id === transition)
        if(index !== -1)
            Transition.#transitions[index].#startTime = performance.now()+Transition.#transitions[index].#delay;
    }

    #autoUpdate(){
    // t: current time, b: beginning value, c: change in value, d: duration
        Transition.#transitions.forEach((transi,i)=>{
            const currentTime = performance.now()-transi.#startTime;
            if(currentTime < 0)
                return
            if(typeof transi.#timingFunction === 'string') {
                const result =(Bezier[transi.#timingFunction](currentTime,transi.#initialValue,transi.#targetValue,transi.#duration))
                transi.#callback(result);
                if(currentTime > transi.#duration){
                    if(typeof transi.#endCallback === 'function')
                        transi.#endCallback();
                    Transition.#transitions.splice(i,1);
                }
            } else { // Custom function
                const result = transi.#timingFunction(currentTime,transi.#initialValue,transi.#targetValue,transi.#duration)
                transi.#callback(result);
                if(currentTime > transi.#duration){
                    if(typeof transi.#endCallback === 'function')
                        transi.#endCallback();
                    Transition.#transitions.splice(i,1);
                }
            }
        })
        if(Transition.#transitions.length){
            requestAnimationFrame(this.#boundAutoUpdate)
        }
    }

}

export {Transition}