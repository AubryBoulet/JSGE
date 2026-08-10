import {Camera} from './camera.js'
class Gadget {
    #position = {x:0,y:0,offsetX:0,offsetY:0};
    #dimension = {width:0,height:0};
    static mouseEvent = false;
    static mousePosition={x:0,y:0};
    static shadowCanvas = document.createElement('canvas');
    static shadowCtx = this.shadowCanvas.getContext('2d');
    _cachCanvas;
    #MouseOver= false;
    #MouseEnter= false;
    #active= false;
    #onMouseOver;
    #onMouseEnter;
    #onMouseLeave;
    #onClick;
    #drawInfos;
    #value;
    #textInfos={
        font:"24px arial",
        align:'start',
        baseline:'alphabetic',
        direction:'inherit',
    };
    #transitions=[];

    constructor({position,dimension,value}) {
        this.position = position;
        this.dimension = dimension;
        this.value = value;
        this._cachCanvas = document.createElement('canvas');
        this.#drawInfos = {border: null,boxShadow:null,backgroundColor:"#fff",color:"#000",font:null,borderRadius:null};
        this.#updateCachCanvas();
        this.#setListener();
    }

    #setListener(){
        if(!Gadget.mouseEvent){
            Gadget.mouseEvent = true;
            document.addEventListener('mousemove',(e)=>{
                Gadget.mousePosition.x = e.pageX;
                Gadget.mousePosition.y = e.pageY;
            })
        }
    }
    draw(cam){
        if(!cam instanceof Camera) throw new Error('Invalide camera object in ',cam);
        const displayedPosition = {x:this.position.x+cam.position.x-this.#position.offsetX,y:this.position.y+cam.position.y-this.#position.offsetY}
        if(displayedPosition.x > cam.dimensions.width+cam.position.x || displayedPosition.x + this._cachCanvas.width <= cam.position.x ||
            displayedPosition.y > cam.dimensions.height+cam.position.y || displayedPosition.y + this._cachCanvas.height <= cam.position.y)
            return;
        const position = {x:0,y:0};
        const dimension = {x:displayedPosition.x,y:displayedPosition.y,width:this._cachCanvas.width,height:this._cachCanvas.height};
        if(displayedPosition.x < cam.position.x){
            position.x=cam.position.x-displayedPosition.x;
            dimension.x=cam.position.x;
            dimension.width=dimension.width-position.x;
        }
        if(displayedPosition.y <  cam.position.y){
            position.y=cam.position.y-displayedPosition.y;
            dimension.y=cam.position.y;
            dimension.height=dimension.height-position.y
        }
        if(displayedPosition.x+this._cachCanvas.width>cam.position.x+cam.dimensions.width){
            dimension.width=this._cachCanvas.width-((displayedPosition.x+this._cachCanvas.width)-(cam.position.x+cam.dimensions.width));
        }
        if(displayedPosition.y+this._cachCanvas.height>cam.position.y+cam.dimensions.height){
            dimension.height=this._cachCanvas.height-((displayedPosition.y+this._cachCanvas.height)-(cam.position.y+cam.dimensions.height));
        }
        this.#update(displayedPosition,cam)
        cam.ctx.drawImage(this._cachCanvas,position.x,position.y,dimension.width,dimension.height,
            dimension.x,dimension.y,dimension.width,dimension.height)
    }
    #update(displayedPosition,cam){
        const mouseX = Gadget.mousePosition.x, mouseY = Gadget.mousePosition.y
        if(mouseX > displayedPosition.x && 
            mouseX < displayedPosition.x+this.dimension.width  &&
            mouseY > displayedPosition.y && 
            mouseY < displayedPosition.y+this.dimension.height ){
            if(!this.MouseEnter){this.MouseEnter=true;this.#mouseEnter(cam)}   
        } else{
            if(this.MouseEnter){this.MouseEnter=false;this.#mouseLeave(cam)}
        }
    }
    #updateCachCanvas(){
        let width = this.#dimension.width, height = this.#dimension.height
        if(this.#drawInfos.boxShadow){
            if(Array.isArray(this.#drawInfos.boxShadow)){
                this.#drawInfos.boxShadow.forEach((box)=>{
                    if(box.inset===false){
                        width+=Math.abs(box.offsetX)||0;
                        height+=Math.abs(box.offsetY)||0;
                    }
                })
            }else{
                width+=Math.abs(this.#drawInfos.boxShadow.offsetX)||0;
                height+=Math.abs(this.#drawInfos.boxShadow.offsetY)||0;
            }
        }
        this._cachCanvas.width = width;
        this._cachCanvas.height = height;
        this.#drawCachCanvas();
    }
    #drawCachCanvas(){
        let startX=0,startY=0;
        const ctx=this._cachCanvas.getContext('2d');
        ctx.clearRect(0,0,this._cachCanvas.width,this._cachCanvas.height)
        const inset = [];
        if(this.#drawInfos.boxShadow){
            if(Array.isArray(this.#drawInfos.boxShadow)){
                this.#drawInfos.boxShadow.forEach((boxShadow)=>{
                    if(boxShadow.inset){
                        inset.push(boxShadow);
                        return;
                    }
                    const os = this.#drawBoxShadow(ctx,boxShadow,{x:startX,y:startY});
                    startX+=os.osX;startY+=os.osY;
                })
            }
        }
        this.#drawCustomRec(ctx,startX,startY,this.#drawInfos.backgroundColor,this.#drawInfos.border?true:false)
        this.#position.offsetX=startX;this.#position.offsetY=startY;
        if(inset.length){
            inset.forEach((boxShadow)=>this.#drawInsetBoxShadow(ctx,boxShadow,{x:startX,y:startY}))
        }
        this.#drawGadgetText(ctx,startX,startY);
    }
    #drawGadgetText(ctx,x,y){
        if(this.#value === '' || !this.#value)
            return;
        ctx.font = this.#textInfos.font;
        ctx.textAlign = this.#textInfos.align;
        ctx.textBaseline = this.#textInfos.baseline;
        ctx.direction = this.#textInfos.direction;
        ctx.fillStyle = this.#drawInfos.color;
        ctx.strokeStyle = this.#drawInfos.color;
        const metric = ctx.measureText(this.#value)
        switch(this.#textInfos.align){
            //'start','end','left','right' or 'center'
            case 'end':
            case 'right':
                x+=this.#dimension.width;
                y+=metric.emHeightAscent;
                break;
            case 'center':
                x+=this.#dimension.width/2;
                y+=metric.emHeightAscent/2+this.#dimension.height/2;
                break;
            default:
            y+=metric.emHeightAscent;
        }
        ctx.fillText(this.#value,x,y,this.#dimension.width)
    }
    #drawBoxShadow(ctx, boxShadow,offset={x:0,y:0}) {
        const x = boxShadow.offsetX >= 0? boxShadow.offsetX+offset.x : 0+offset.x;
        const y = boxShadow.offsetY >= 0? boxShadow.offsetY+offset.y : 0+offset.y;
        if(boxShadow.blur){
            Gadget.shadowCanvas.width = this.#dimension.width;
            Gadget.shadowCanvas.height = this.#dimension.height;
            Gadget.shadowCtx.clearRect(0,0,this.#dimension.width,this.#dimension.height)
            this.#drawCustomRec(Gadget.shadowCtx,0,0,boxShadow.color,false,this.#dimension.width,this.#dimension.height,boxShadow.blur)
            ctx.drawImage(Gadget.shadowCanvas,x,y)
        } else {
            this.#drawCustomRec(ctx,x,y,boxShadow.color)
        }
        return {
            osX: x > 0 ? 0 : Math.abs(boxShadow.offsetX),
            osY: y > 0 ? 0 : Math.abs(boxShadow.offsetY)
        };
    }
    #drawInsetBoxShadow(ctx,boxShadow,offset={x:0,y:0}){
        console.log(boxShadow)
        ctx.fillStyle = boxShadow.color;
        const wx = boxShadow.offsetX >= 0 ? offset.x:this.#dimension.width+-boxShadow.offsetX;
        const hy = boxShadow.offsetY >= 0 ? offset.y:this.#dimension.height-boxShadow.offsetY;
        const hx = boxShadow.offsetX >= 0 ? offset.x+boxShadow.offsetX: offset.x
        ctx.fillRect(wx,offset.y,boxShadow.offsetX,this.#dimension.height);
        ctx.fillRect(hx,hy,this.#dimension.width-offset.x,boxShadow.offsetY)
    }
    #drawCustomRec(ctx,x,y,color,border=false,width=this.#dimension.width,height=this.#dimension.height,blur=false){
        const lineWidth = border ? this.#drawInfos.border.lineWidth : 0;
        const arc=this.#drawInfos.borderRadius?this.#drawInfos.borderRadius:{tl:0,tr:0,bl:0,br:0};
        width+=(x-lineWidth); height+=(y-lineWidth);
        x+=lineWidth;
        y+=lineWidth;
        ctx.beginPath();
        if(blur)
            ctx.filter = `blur(${blur}px)`;
        ctx.lineWidth = lineWidth;
        ctx.fillStyle = color;
        ctx.strokeStyle = border ?this.#drawInfos.border.color:color;
        ctx.moveTo(x,y+arc.tl);
        ctx.arcTo(x,y,x+arc.tl,y,arc.tl);
        ctx.lineTo(width-arc.tr,y);
        ctx.arcTo(width,y,width,y+arc.tr,arc.tr);
        ctx.lineTo(width,height-arc.br);
        ctx.arcTo(width,height,width-arc.br,height,arc.br);
        ctx.lineTo(x+arc.bl,height);
        ctx.arcTo(x,height,x,height-arc.bl,arc.bl);
        ctx.lineTo(x,y+arc.tl);
        ctx.fill();
        ctx.stroke();
    }
    #mouseEnter(cam){
        if(typeof this.onMouseEnter === 'function')
            this.onMouseEnter(cam);
    }
    #mouseLeave(cam){
        if(typeof this.onMouseLeave === 'function')
            this.onMouseLeave(cam);
    }
    #mouseOver(cam){
        if(typeof this.onMouseOver === 'function')
            this.onMouseOver(cam);
    }
    #mouseClick(cam){
        if(typeof this.onClick === 'function')
            this.onClick(cam);
    }

    // Setters
    set position(position){
        if(!(position instanceof Object) || !('x' in position) || !('y' in position)) {
            throw new Error("Invalid position object, position must be {x,y}");
        }
        this.#position = position;
    }
    set dimension(dimension){
        if(!(dimension instanceof Object) || !('width' in dimension) || !('height' in dimension)) {
            throw new Error("Invalid dimension object, dimension must be {width,height}");
        }
        this.#dimension = dimension;
    }
    set onMouseOver(callback){
        if(typeof callback !== 'function')
            throw new Error('Invalid callback, must be a function');
        this.#onMouseOver = callback;
    }
    set onMouseEnter(callback){
        if(typeof callback !== 'function')
            throw new Error('Invalid callback, must be a function');
        this.#onMouseEnter = callback;
    }
    set onMouseLeave(callback){
        if(typeof callback !== 'function')
            throw new Error('Invalid callback, must be a function');
        this.#onMouseLeave = callback;
    }
    set onClick(callback){
        if(typeof callback !== 'function')
            throw new Error('Invalid callback, must be a function');
        this.#onClick = callback;
    }
    set border({lineWidth=1,color=this.#drawInfos.backgroundColor,style="solid"}){
        if(isNaN(lineWidth))
            throw new Error('Invalid lineWidth, must be a number');
        if(style !== "solid")
            throw new Error('Invalid style, must be "solid"');
        this.#drawInfos.border={color:color,lineWidth:lineWidth,style:style};
        this.#updateCachCanvas();
    }
    set borderRadius(value){
        if(!Array.isArray(value))
            throw new Error('Invalid value, must be an Array');
        let [tl=null,tr=null,bl=null,br=null] = value;
        if(isNaN(tl))
            throw new Error('Invalid tl, must be a number');
        if(isNaN(tr)&&tr!==null)
            throw new Error('Invalid tr, must be a numer');
        if(isNaN(bl)&&bl!==null)
            throw new Error('Invalid bl, must be a number');
        if(isNaN(br)&&br!==null)
            throw new Error('Invalid br, must be a number');
        const noBot = (bl===null&&br===null) ? true : false;
        if(br===null){
            if(tr === null){
                br = tl;
            }else{
                br = tr;
            }
        }
        if(bl===null){
            if(tr===null){
                bl=tl;
            }else{
                bl=tr;
            }
        }
        if(tr===null){
            tr=tl;
        }else if(noBot){
            tr=tl;
        }
        this.#drawInfos.borderRadius={tl:tl,tr:tr,bl:bl,br:br};
        this.#updateCachCanvas();
    }
    set backgroundColor(color){
        this.#drawInfos.backgroundColor = color;
        this.#updateCachCanvas();
    }
    set color(color){
        this.#drawInfos.color = color;
        this.#updateCachCanvas();
    }
    set boxShadow(value) {
        if (Array.isArray(value)) {
            const firstElement = value[0];
            if (typeof firstElement === 'object' && !Array.isArray(firstElement)) {
                // Tableau d'objets
                this.#drawInfos.boxShadow = value.map(shadow => ({
                    offsetX: shadow.offsetX || 0,
                    offsetY: shadow.offsetY || 0,
                    color: shadow.color || "#fff",
                    blur: shadow.blur || 0,
                    inset: shadow.inset || false,
                }));
            } else if (Array.isArray(firstElement)) {
                // Tableau de tableaux
                this.#drawInfos.boxShadow = value.map(shadowArgs => {
                    const [offsetX = 0, offsetY = 0, color = "#fff", blur = 0, inset = false] = shadowArgs;
                    if (isNaN(offsetX) || isNaN(offsetY) || isNaN(blur)) {
                        throw new Error('Invalid boxShadow values, must be numbers');
                    }
                    return { offsetX, offsetY, blur, inset, color };
                });
            } else {
                const [offsetX = 0, offsetY = 0, color = "#fff", blur = 0, inset = false] = value;
                if (isNaN(offsetX) || isNaN(offsetY) || isNaN(blur)) {
                    throw new Error('Invalid boxShadow values, must be numbers');
                }
                this.#drawInfos.boxShadow = [{ offsetX, offsetY, blur, inset, color }];
            }
        } else if (typeof value === 'object' && value !== null) {
            // Objet unique
            const { offsetX = 0, offsetY = 0, color = "#fff" , blur = 0, inset = false } = value;
            if (isNaN(offsetX) || isNaN(offsetY) || isNaN(blur)) {
                throw new Error('Invalid boxShadow values, must be numbers');
            }
            this.#drawInfos.boxShadow = [{ offsetX, offsetY, blur, inset, color }];
        } else {
            throw new Error('Invalid boxShadow value. Use an object, an array of objects, or an array of arrays.');
        }
        this.#updateCachCanvas();
    }
    set value(value){
        this.#value = value;
    }
    set font(font){
        if(typeof font !== "string")
            throw new Error('Invalid font, must be a string');
        this.#textInfos.font=font;
    }
    set textAlign(align){
        if(align!=='start' && align!=='end' && align !=='left' && align !=='right' && align!=='center')
            throw new Error("Invalid value, textAligne must be 'start','end','left','right' or 'center'");
        this.#textInfos.align = align;
    }
    set textBaseline(baseline){
        if(baseline!=='top' && baseline!=='hanging' && baseline!=='middle' && baseline!=='alphabetic' && baseline!=='ideographoc' && baseline!=='bottom')
            throw new Error("Invalid value, textBaseline must be 'top','hanging','middle','alphabetic','ideographic' or 'bottom'");
        this.#textInfos.baseline = baseline;
    }
    set textDirection(direction){
        if(direction!=='ltr' && direction!=='rtl' && direction!=='inherit')
            throw new Error("Invalid value, textDirection must be 'ltr','rtl' or 'inherit'");
        this.#textInfos.direction = direction;
    }
    set transition(transition){
        if(!Array.isArray(transition))
            throw new Error('Invalid value, transition must be an array');
        const [name, duration=0, timingFunction='linear', delay=0] = transition;
        if(typeof name !== 'string')
            throw new Error('Invalid value, transition name must be a string');
        if(isNaN(duration))
            throw new Error('Invalid value, transition duration must be a number');
        if(timingFunction !== 'linear' && timingFunction !== 'ease' && timingFunction !== 'ease-in' && timingFunction !== 'ease-out' && timingFunction !== 'ease-in-out')
            throw new Error('Invalid value, transition timing function must be "linear","ease","ease-in","ease-out" or "ease-in-out"');
        if(isNaN(delay))
            throw new Error('Invalid value, transition delay must be a number');
        this.#transitions.push({name,duration,timingFunction,delay});
    }

    // Getters
    get position(){
        return this.#position;
    }
    get dimension(){
        return this.#dimension;
    }
    get onMouseEnter(){
        return this.#onMouseEnter;
    }
    get onMouseLeave(){
        return this.#onMouseLeave;
    }
    get onMouseOver(){
        return this.#onMouseOver;
    }
    get mouseEnter(){
        return this.#MouseEnter;
    }
    get onClick(){
        return this.#onClick;
    }
    get border(){
        return this.#drawInfos.border;
    }
    get backgroundColor(){
        return this.#drawInfos.backgroundColor;
    }
    get color(){
        return this.#drawInfos.color;
    }
    get boxShadow(){
        return this.#drawInfos.boxShadow;
    }
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
    get transitions(){
        return this.#transitions;
    }
}

export {Gadget}