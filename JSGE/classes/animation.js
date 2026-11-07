class Animation {
    #image;
    #row;
    #column;
    #frameRate;
    #animationFrames = [];
    #frameWidth = 0;
    #frameHeight = 0;
    constructor({image,row,column,frameRate}){
        this.image = image
        this.row = row
        this.column = column
        this.frameRate = frameRate
    }

    initSpritSheet(image=this.image,row=this.row,column=this.column){ 
        // Calculate the width and height of each frame in the sprite sheet
        this.frameWidth = image.width / column;
        this.frameHeight = image.height / row;
    }

    /*** Creates animation frames for the sprite sheet
     * @param {number} startFrame - The frame number to start from
     * @param {number} endFrame - The frame number to end at
     * @param {number} frameRate - The rate at which the frames should be displayed (use default frame rate if not specified)
     * @param {string} animationName - The name of the animation
     * @param {number} frameWidth - The width of each frame (use default frame with if not specified)
     * @param {number} frameHeight - The height of each frame (use default frame height if not specified)
     * @returns {void}
     ***/
    createAnimationFrames(startFrame,endFrame,animationName,frameRate=1,frameWidth=undefined,frameHeight=undefined){
        const frames = [];
        for (let i = startFrame; i <= endFrame; i++) {
            const row = Math.floor(i / this.column);
            const column = i % this.column;
            frames.push({ row, column });
        }
        const animation = {
            frameRate:frameRate || this.frameRate,
            currentFrame:0,
            frames:frames,
            animationName:animationName,
            elapsedFrames:0,
            frameWidth:frameWidth || this.frameWidth,
            frameHeight:frameHeight || this.frameHeight,
            frameHitBox: {
                startWidth: 0,
                endWidth: frameWidth || this.frameWidth,
                startHeight: 0,
                endHeight: frameHeight || this.frameHeight
            }
        }
        this.#animationFrames.push(animation);
    }
    /***
     * Deletes animation frames for the specified animation name
     * @param {string} animationName - The name of the animation to delete
     * @returns {void}
     ***/
    deleteAnimationFrames(animationName){
        this.animationFrames = this.animationFrames.filter(animation => animation.animationName !== animationName);
    }
    /***
     * Updates the animation frame based on the elapsed time
     * @returns {void}
     ***/
    updateAnimationFrame(){
        if(this.currentAnimation){
            this.currentAnimation.elapsedFrames++;
            if(this.currentAnimation.elapsedFrames >= this.currentAnimation.frameRate){
                this.currentAnimation.currentFrame++;
                if(this.currentAnimation.currentFrame >= this.currentAnimation.frames.length){
                    this.currentAnimation.currentFrame = 0;
                }
                this.currentAnimation.elapsedFrames = 0;
            }
        }
    }
    getAnimationFrame(animationName){
        const animation = structuredClone(this.#animationFrames.find(animation => animation.animationName === animationName));
        if(animation) {
            return animation;
        } else {
            throw new Error(`Animation ${animationName} not found`)
        }
    }
    setAnimationFrameHitBox(animationName,startWidth,endWidth,startHeight,endHeight){
        if(typeof animationName !== 'string')
            throw new Error('Invalid animationName')
        const animationFrame = this.#animationFrames.find((animation) => animation.animationName === animationName);
        if (animationFrame) {
            animationFrame.frameHitBox = {startWidth:startWidth,endWidth:endWidth,startHeight:startHeight,endHeight:endHeight}
        } else {
            throw new Error(`Animation ${animationName} not found`)
        }
    }

    // Setters
    set image(image) {
        this.#image = image;
        this.initSpritSheet(image, this.row, this.column);
        // this.frameWidth = result.frameWidth;
        // this.frameHeight = result.frameHeight;
    }
    set row(row) {
        this.#row = row;
        this.initSpritSheet();
    }
    set column(column) {
        this.#column = column;
        const result = this.initSpritSheet();
    }
    set frameRate(frameRate) {
        this.#frameRate = frameRate;
    }
    set frameWidth(frameWidth) {
        this.#frameWidth = frameWidth;
    }
    set frameHeight(frameHeight) {
        this.#frameHeight = frameHeight;
    }

    //Getters
    get image(){
        return this.#image
    }
    get row() {
        return this.#row;
    }
    get column() {
        return this.#column;
    }
    get frameWidth() {
        return this.#frameWidth;
    }
    get frameHeight() {
        return this.#frameHeight;
    }

}

export  {Animation};