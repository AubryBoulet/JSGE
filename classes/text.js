class Text {
    #textInfos={
        font:"24px arial",
        align:'start',
        baseline:'alphabetic',
        direction:'inherit',
        lineHeight:3,
        color:'black',
    };
    #value="";
    #canvas;
    #ctx;
    #width;
    #height;
    #textEffects=[];
    #effectInfos={
        amplitude:5, // Amount of pixels the text will move up and down
        frequency:9, // Amount of frame before updating the text position
        speed:3, // Amount of pixels the text will move per update
        duration:0, // Duration of the effect in seconds, 0 for infinite
    };
    #updateEffect=false;
    static motionedEffects = ["wave","shake"];
    constructor(value,width,height){
        this.#value = value;
        this.#canvas = document.createElement('canvas');
        this.#ctx = this.#canvas.getContext('2d');
        this.#width = width;
        this.#height = height;
        this.#canvas.width = width;
        this.#canvas.height = height;
        this.#updateEffect = true;
        this.#updateCanvas();
    }
    _updateEffect(){ // Force the recalculation of the text effects
        this.#updateEffect = true;
        this.#updateCanvas();
    }
    _update(){ // Check if the text effects need to be updated, useful for animations
        if(this.#textEffects.length>0){
            let redrawNeeded = false;
            this.#textEffects.forEach((effect)=>{
                effect.framePassed++;
                if(effect.framePassed >= effect.frequency){
                    redrawNeeded = true;
                }
            })
            if(redrawNeeded){
                this.#updateCanvas();
                return true;
            }
        }
    }
    #updateCanvas(){
        this.#ctx.clearRect(0,0,this.#canvas.width,this.#canvas.height);
        const words = this.#value.split(' ');
        if(this.#updateEffect)
            this.#checkTextEffects(words);
        const textMetrics = this.#ctx.measureText(this.#value);
        const lines = this.#makeMultilineText(words);
        const rows = lines.length;
        const{x,y} = this.#calcPosition(textMetrics,rows);
        let offsetY = 0;
        let wordIndex = 0;
        for(let i=0;i<lines.length;i++){
            if(lines[i].offset)
                offsetY += lines[i].offset;
            this.#drawLines(x,y,offsetY,lines[i],i,textMetrics,wordIndex);
            wordIndex += lines[i].length;
        }
    }
    #drawLines(x,y,offsetY,line,i,textMetrics,wordIndex){
        this.#ctx.font = this.#textInfos.font;
        this.#ctx.textAlign = this.#textInfos.align;
        this.#ctx.textBaseline = this.#textInfos.baseline;
        this.#ctx.direction = this.#textInfos.direction;
        if(line.effect){
            const words = line.str.split(' ');
            const lineWidth = this.#ctx.measureText(line.str).width
            let offsetX = this.#textInfos.align === 'center' // Recalculate offsetX based on text alignment
                ? -lineWidth / 2
                : this.#textInfos.align === 'end' || this.#textInfos.align === 'right'
                    ? -lineWidth
                    : 0;
            this.#ctx.textAlign = 'left'; // Set textAlign to 'left' for individual word rendering
            this.#drawTextEffect(x,y,offsetY,offsetX,line,i,textMetrics,wordIndex,words);
        } else {
            this.#ctx.fillStyle=this.#textInfos.color;
            this.#ctx.textAlign = this.#textInfos.align;
            this.#ctx.fillText(line.str,x,y+i*textMetrics.emHeightAscent+this.#textInfos.lineHeight*i+offsetY);
        }
    }
    #drawTextEffect(x,y,offsetY,offsetX,line,i,textMetrics,wordIndex,words){
        const effects = this.#textEffects.filter((effect)=>effect.startIndex >= wordIndex && effect.endIndex < wordIndex+words.length);
        for(let j=0;j<line.length;j++){
            let draw = true;
            // Search for blink effect
            const blinkEffect = effects.find((effect)=>effect.effect === 'blink' && wordIndex+j >= effect.startIndex && wordIndex+j <= effect.endIndex);
            if(blinkEffect){
                if (!this.#processBlinkEffect(blinkEffect,wordIndex+j)){
                    offsetX+=this.#ctx.measureText(words[j]+" ").width;
                    // Check if word is in a wave to increase wave index before skiping word rendering
                    const waveEffect = (effects.find((effect)=>effect.effect === 'wave' && wordIndex+j >= effect.startIndex && wordIndex+j <= effect.endIndex))
                    if(waveEffect){
                        waveEffect.data.index += words[j].length+1; // Update the index for the next word
                    }
                    continue; // Skip drawing this word if blink effect is off
                }
            }
            // Search for shake effect
            const shakeEffect = effects.find((effect)=>effect.effect === 'shake' && wordIndex+j >= effect.startIndex && wordIndex+j <= effect.endIndex);
            if(shakeEffect){
                this.#processShakeEffect(shakeEffect,wordIndex+j);
                offsetX += shakeEffect.effectOffset.x;
                offsetY += shakeEffect.effectOffset.y;
            }
            // Search for wave effect
            const waveEffect = effects.find((effect)=>effect.effect === 'wave' && wordIndex+j >= effect.startIndex && wordIndex+j <= effect.endIndex);
            if(waveEffect){
                const waveData = this.#processWaveEffect(waveEffect);
                if(waveData){
                    // Draw each letter of the word with the corresponding wave offset
                    const letters = words[j]+' '.split('');
                    for (let k = waveData.index; k < letters.length+waveData.index; k++) {
                        const letterOffsetY = waveData.waveOffsets[k];
                        const letter = letters[k-waveData.index];
                        this.#ctx.fillText(letter, x + offsetX, y + i * textMetrics.emHeightAscent + this.#textInfos.lineHeight * i + offsetY + letterOffsetY);
                        offsetX += this.#ctx.measureText(letter).width;
                    }
                    waveData.index += letters.length; // Update the index for the next word
                }
                draw = false;
            }
            if(draw){
                this.#ctx.fillText(words[j],x+offsetX,y+i*textMetrics.emHeightAscent+this.#textInfos.lineHeight*i+offsetY);
                offsetX+=this.#ctx.measureText(words[j]+" ").width;
            }
            if (shakeEffect){
                offsetX -= shakeEffect.effectOffset.x; // Reset offsetX after drawing the word
                offsetY -= shakeEffect.effectOffset.y; // Reset offsetY after drawing the word
            }
            if (waveEffect){
                offsetY -= waveEffect.effectOffset.y; // Reset offsetY after drawing the word
                draw = true // Reset draw status
            }
        }
    }
    //////////////////////////////
    // Process effects
    #updateCondition(effect){
        if(effect.duration>0){
            if(effect.startTime===0){
                effect.startTime = performance.now();
            }else{
                const elapsedTime = (performance.now() - effect.startTime) / 1000; // Convert to seconds
                if(elapsedTime >= effect.duration){
                    this.#disableEffect(effect);
                    return false; // Effect duration has passed
                }
            }
        }
        if(effect.framePassed<effect.frequency || effect.framePassed===0){
            return false; // Not enough frames have passed to update the effect
        }
        return true; // Effect should be updated
    }
    #disableEffect(effect){
        effect.active = false;
        switch(effect.effect){
            case 'blink':
                effect.blinkState = true; // Reset blink state to visible
                break;
            case 'shake':
                effect.effectOffset = {x:0, y:0}; // Reset shake offset
                break;
            case 'wave':
                effect.effectOffset = {x:0, y:0}; // Reset wave offset
                break;
        }
    }
    #processBlinkEffect(effect){
        if(this.#updateCondition(effect)){
            effect.blinkState = !effect.blinkState;
            effect.framePassed = 0;
        }
        return effect.blinkState;
    }
    #processShakeEffect(effect){
        if(this.#updateCondition(effect)){
            const x = Math.random() * effect.amplitude * 2 - effect.amplitude; // Random offset between -amplitude and +amplitude
            const y = Math.random() * effect.amplitude * 2 - effect.amplitude; // Random offset between -amplitude and +amplitude
            effect.effectOffset = {x:x, y:y};
            effect.framePassed = 0;
        }
    }
    #processWaveEffect(effect){
        if(effect.framePassed === 0)
            return effect.data; // Return the existing effect data if no frames have passed
        if(effect.startTime === 0){
            effect.startTime = performance.now(); // Force the start time to be use ase frequency
        }
        const elapsedTime = (performance.now() - effect.startTime) / 1000; // Convert to seconds
        // Get all the words that are affected by the wave effect
        const waveWords = this.#value.split(' ').slice(effect.startIndex, effect.endIndex + 1).join(' '); // Join the words into a single string
        // Make an array of every letter in the waveWords string
        const letters = waveWords.split('');
        // Calculate the wave offset for each letter based on its index and the elapsed time
        const waveOffsets = letters.map((letter, index) => {
            const phase = (index / letters.length) * Math.PI * 2; // Phase shift based on letter index
            const sinOffsetY = Math.sin(elapsedTime * effect.speed + phase) * effect.amplitude; // Calculate vertical offset
            return sinOffsetY;
        });
        // Set the effectOffset to the average of the waveOffsets for the entire word
        const averageOffsetY = waveOffsets.reduce((sum, offset) => sum + offset, 0) / waveOffsets.length;
        effect.effectOffset = {x:0, y:averageOffsetY};
        effect.framePassed = 0;
        effect.data = {letters: letters, waveOffsets: waveOffsets,index:0}; // Store the letters and their corresponding wave offsets in the effect data
        return effect.data; // Return the effect data for use in drawing the letters
    }

    // End process effects
    ////////////////////////////////
    #calcPosition(textMetrics,rows){
        let x=0,y=0,textHeight=textMetrics.emHeightAscent*rows+this.#textInfos.lineHeight*(rows-1);
        switch(this.#textInfos.align){
            //'start','end','left','right' or 'center'
            case 'end':
            case 'right':
                x+=this.#width;
                y+=textMetrics.emHeightAscent;
                break;
            case 'center':
                x+=this.#width/2;
                if(textHeight>=this.#height){
                    y=textMetrics.emHeightAscent;
                }else{
                    y+=this.#height/2-textHeight/2+textMetrics.emHeightAscent;
                }
                break;
            default:
                y+=textMetrics.emHeightAscent;
        }
        return {x:x,y:y};
    }
    #makeMultilineText(words){
        const lines = [];
        let currentLine = '';
        let currentOffset = 0;
        let effectFound = false;
        let amplidudeEffect = false;
        let wordCount = 0;
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + word + ' ';
            const textMetrics = this.#ctx.measureText(testLine);
            if (textMetrics.width > this.#width && i > 0) {
                lines.push({str:currentLine.trim(),offset:currentOffset,effect:effectFound,amplitudeEffect:amplidudeEffect,length:wordCount});
                currentLine = '';
                currentOffset = 0;
                effectFound = false;
                amplidudeEffect = false;
                wordCount = 0;
                i--; // Re-evaluate the current word in the next iteration
            } else {
                this.#textEffects.forEach((effect) => { // search for effects in the current line
                    if(i >= effect.startIndex && i <= effect.endIndex){ // check if effect is in the line
                        effectFound = true;
                        if(currentOffset < effect.amplitude) // check if the current offset is less than the amplitude of the effect
                            currentOffset = effect.amplitude;
                        amplidudeEffect = true;
                    }
                })
                currentLine = testLine;
                wordCount++;
            }
        }
        lines.push({str:currentLine.trim(),offset:currentOffset,effect:effectFound,amplitudeEffect:amplidudeEffect,length:wordCount});
        return lines;
    }
    #checkTextEffects(words){
        this.#textEffects = []; // Reset text effects
        const effectList = [];
        let currentIndex= 0;
        for(let i=0;i<words.length;i++){
            if(words[i].startsWith("${")){
                let j = i;
                let closedEffects = 0;
                this.#parseEffect(words[j].replace("${",""),j,effectList);
                words.splice(i,1); // Remove the starting effect word
                while (j < words.length && closedEffects < effectList.length) {
                    if (words[j].startsWith("${")) {
                        this.#parseEffect(words[j].replace("${",""),j,effectList);
                        currentIndex=effectList.length-1;
                        words.splice(j, 1); // Remove the starting effect word
                        j--;
                    } 
                    if (words[j].endsWith("}")) {
                        if(words[j].startsWith("}")){
                            words.splice(j, 1);
                            j--;
                        } else{
                            words[j] = words[j].slice(0,-1);
                        }
                        effectList[currentIndex].endIndex=j;
                        closedEffects++;
                        currentIndex=effectList.length-1-closedEffects;
                        if(closedEffects===effectList.length){
                            closedEffects=0;
                        }
                        j--;
                    }
                    j++;
                }
                this.#textEffects=effectList;
            }
        }
        this.#updateEffect = false;
        this.#value = words.join(' '); //Rebuild the text value without the effect markers
    }
    #parseEffect(string,startIndex,effectList){
        const startInfo = string.indexOf('(');
        const endInfo = string.indexOf(')');
        if(startInfo!==-1 && endInfo!==-1){
            const effectName = string.substring(0,startInfo);
            const effectParams = string.substring(startInfo+1,endInfo).split(',');
            // effect info order: amplitude, frequency, speed, duration
            effectList.push({effect:effectName,
                startIndex:startIndex,
                amplitude:Text.motionedEffects.find((el)=>el===effectName) ? effectParams[0] ? parseFloat(effectParams[0]) : this.#effectInfos.amplitude : 0,
                frequency:effectParams[1] ? parseFloat(effectParams[1]) : this.#effectInfos.frequency,
                speed:effectParams[2] ? parseFloat(effectParams[2]) : this.#effectInfos.speed,
                duration:effectParams[3] ? parseFloat(effectParams[3]) : this.#effectInfos.duration,
                framePassed:0,
                effectOffset:{x:0, y:0},
                startTime:0,
                active:true,
                data:{},
            })
        }else{
            effectList.push({effect:string,
                startIndex:startIndex,
                amplitude:Text.motionedEffects.find((el)=>el===string) ? this.#effectInfos.amplitude : 0,
                frequency:this.#effectInfos.frequency,
                speed:this.#effectInfos.speed,
                duration:this.#effectInfos.duration,
                framePassed:0,
                effectOffset:{x:0, y:0},
                startTime:0,
                active:true,
                data:{},
            })
        }
    }

    // Setters
    set value(value){
        this.#value = value;
        this.#updateEffect = true;
        this.#updateCanvas();
    }
    set font(font){
        this.#textInfos.font = font;
        this.#updateCanvas();
    }
    set textAlign(align){
        this.#textInfos.align = align;
        this.#updateCanvas();
    }
    set textBaseline(baseline){
        this.#textInfos.baseline = baseline;
        this.#updateCanvas();
    }
    set textDirection(direction){
        this.#textInfos.direction = direction;
        this.#updateCanvas();
    }
    set width(width){
        this.#width = width;
        this.#canvas.width = width;
        this.#updateCanvas();
    }
    set height(height){
        this.#height = height;
        this.#canvas.height = height;
        this.#updateCanvas();
    }
    set amplitude(amplitude){
        this.#effectInfos.amplitude = amplitude;
    }
    set frequency(frequency){
        this.#effectInfos.frequency = frequency;
    }
    set speed(speed){
        this.#effectInfos.speed = speed;
    }
    set duration(duration) {
        this.#effectInfos.duration = duration;
    }

    // Getters
    get value(){
        return this.#value;
    }
    get font(){
        return this.#textInfos.font;
    }
    get textAlign(){
        return this.#textInfos.align;
    }
    get textBaseline(){
        return this.#textInfos.baseline;
    }
    get textDirection(){
        return this.#textInfos.direction;
    }
    get canvas(){
        return this.#canvas;
    }
    get ctx(){
        return this.#ctx;
    }
    get width(){
        return this.#width;
    }
    get height(){
        return this.#height;
    }
    get amplitude(){
        return this.#effectInfos.amplitude;
    }
    get frequency(){
        return this.#effectInfos.frequency;
    }
    get speed(){
        return this.#effectInfos.speed;
    }
    get duration(){
        return this.#effectInfos.duration;
    }
    get effects(){
        if(this.#textEffects.length>0){
            return true;
        }else{
            return false;
        }
    }
}

export {Text}