import { Text } from "./text.js";
import { Camera } from "./camera.js";

/* ------------------------------------------------------------------
   Normalisation des valeurs de style.
   Utilisées par les setters ET par hoverStyle / activeStyle, pour que
   les deux acceptent exactement les mêmes formats.
------------------------------------------------------------------ */
function normalizeBorder(value, fallbackColor) {
    if (value === null) return null;
    const { lineWidth = 1, color = fallbackColor, style = "solid" } = value;
    if (isNaN(lineWidth))
        throw new Error('Invalid lineWidth, must be a number');
    if (style !== "solid")
        throw new Error('Invalid style, must be "solid"');
    return { color, lineWidth, style };
}

function normalizeBorderRadius(value) {
    if (!Array.isArray(value))
        throw new Error('Invalid value, must be an Array');
    let [tl = null, tr = null, bl = null, br = null] = value;
    if (isNaN(tl))
        throw new Error('Invalid tl, must be a number');
    if (isNaN(tr) && tr !== null)
        throw new Error('Invalid tr, must be a number');
    if (isNaN(bl) && bl !== null)
        throw new Error('Invalid bl, must be a number');
    if (isNaN(br) && br !== null)
        throw new Error('Invalid br, must be a number');
    const noBot = (bl === null && br === null);
    if (br === null) br = (tr === null) ? tl : tr;
    if (bl === null) bl = (tr === null) ? tl : tr;
    if (tr === null) tr = tl;
    else if (noBot) tr = tl;
    return { tl, tr, bl, br };
}

function normalizeShadow({ offsetX = 0, offsetY = 0, color = "#fff", blur = 0, inset = false } = {}) {
    if (isNaN(offsetX) || isNaN(offsetY) || isNaN(blur))
        throw new Error('Invalid boxShadow values, must be numbers');
    return { offsetX, offsetY, blur, inset, color };
}

function normalizeBoxShadow(value) {
    if (Array.isArray(value)) {
        if (value.length === 0) return [];
        if (Array.isArray(value[0])) {          // tableau de tableaux
            return value.map(([offsetX, offsetY, color, blur, inset]) =>
                normalizeShadow({ offsetX, offsetY, color, blur, inset }));
        }
        if (typeof value[0] === 'object') {     // tableau d'objets
            return value.map(normalizeShadow);
        }
        const [offsetX, offsetY, color, blur, inset] = value;   // une seule ombre sous forme de tableau
        return [normalizeShadow({ offsetX, offsetY, color, blur, inset })];
    }
    if (typeof value === 'object' && value !== null)
        return [normalizeShadow(value)];
    throw new Error('Invalid boxShadow value. Use an object, an array of objects, or an array of arrays.');
}

function assertFunction(callback) {
    if (typeof callback !== 'function')
        throw new Error('Invalid callback, must be a function');
    return callback;
}

class Gadget {
    #position = { x: 0, y: 0 };
    #dimension = { width: 0, height: 0 };
    #hitbox = { width: 8, height: 8 };
    static mouseEvent = false;
    static shadowCanvas = document.createElement('canvas');
    static shadowCtx = this.shadowCanvas.getContext('2d');
    static gadgets = [];
    _cachCanvas;
    #shadowOffset = { x: 0, y: 0 };     // marge gauche/haut occupée par les ombres dans le cache
    #dirty = false;                     // le cache doit être redessiné (une seule fois par frame)
    #renderStyle;                       // style réellement utilisé pour le dernier dessin
    #hoverStyle = null;                 // surcharge appliquée pendant le survol
    #activeStyle = null;                // surcharge appliquée pendant l'appui
    #mouseOver = false;
    #active = false;
    #onMouseOver;
    #onMouseEnter;
    #onMouseLeave;
    #onClick;
    #onActived;
    #drawInfos;
    #textValue;
    #transitions = [];

    constructor({ position, dimension, value }) {
        this.position = position;
        this.dimension = dimension;
        if (value !== "") {
            this.#textValue = new Text(value, this.#dimension.width, this.#dimension.height);
        }
        this._cachCanvas = document.createElement('canvas');
        this.#drawInfos = { border: null, boxShadow: null, backgroundColor: "#fff", color: "#000", font: null, borderRadius: null };
        this.#renderStyle = this.#drawInfos;
        Gadget.gadgets.push(this);
        this.#updateCachCanvas();
        this.#setListeners();
    }

    // Public methods
    addTextGradient(name, gradient) {
        if (this.#textValue)
            this.#textValue.addGradient(name, gradient);
    }
    updateText() {
        if (this.#textValue) {
            this.#textValue._updateEffect();
        } else {
            console.warn('No text value set for this gadget');
        }
    }
    draw(cam, zOrder = 0) {
        cam._addToDrawList(this, zOrder);
    }
    destroy() {
        Gadget.gadgets = Gadget.gadgets.filter((gadget) => gadget !== this);
        this.#mouseOver = false;
        this.#active = false;
    }

    // Events
    #setListeners() {
        if (Gadget.mouseEvent) return;
        Gadget.mouseEvent = true;
        document.addEventListener('mousedown', () => {
            for (const gadget of Gadget.gadgets) {
                if (gadget.#mouseOver) {
                    gadget.#active = true;
                    gadget.#dirty = true;
                    gadget.#isActived();
                    break;
                }
            }
        });
        document.addEventListener('mouseup', () => {
            for (const gadget of Gadget.gadgets) {
                if (gadget.#active) {
                    gadget.#active = false;
                    gadget.#dirty = true;
                }
            }
        });
        document.addEventListener('click', () => {
            for (const gadget of Gadget.gadgets) {
                if (gadget.#mouseOver) {
                    gadget.#mouseClick();
                    break;
                }
            }
        });
    }
    #mouseEnter(cam) {
        if (typeof this.onMouseEnter === 'function') this.onMouseEnter(cam);
    }
    #mouseLeave(cam) {
        if (typeof this.onMouseLeave === 'function') this.onMouseLeave(cam);
    }
    #mouseIsOver(cam) {
        if (typeof this.onMouseOver === 'function') this.onMouseOver(cam);
    }
    #mouseClick() {
        if (typeof this.onClick === 'function') this.onClick();
    }
    #isActived() {
        if (typeof this.onActived === 'function') this.onActived();
    }

    // Frame processing
    _processDraw(cam) {
        if (!(cam instanceof Camera)) throw new Error('Invalid camera object');
        const drawX = this.position.x - this.#shadowOffset.x;
        const drawY = this.position.y - this.#shadowOffset.y;
        if (drawX > cam.dimensions.width || drawX + this._cachCanvas.width <= 0 ||
            drawY > cam.dimensions.height || drawY + this._cachCanvas.height <= 0)
            return;
        if (this.#textValue && this.#textValue._update()) this.#dirty = true;
        this.#update(cam);
        if (this.#dirty) {
            this.#dirty = false;
            this.#updateCachCanvas();
        }
        cam.cameraCtx.drawImage(
            this._cachCanvas,
            this.position.x - this.#shadowOffset.x,
            this.position.y - this.#shadowOffset.y
        );
    }
    #update(cam) {
        const { x: mouseX, y: mouseY } = cam.cameraMousePosition;
        const over = cam.isMouseOver &&
            mouseX >= this.position.x - this.#hitbox.width &&
            mouseX <= this.position.x + this.dimension.width + this.#hitbox.width * 2 &&
            mouseY >= this.position.y - this.#hitbox.height &&
            mouseY <= this.position.y + this.dimension.height + this.#hitbox.height * 2;

        if (over) {
            if (!this.#mouseOver) {
                this.#mouseOver = true;
                this.#dirty = true;
                this.#mouseEnter(cam);
            }
        } else if (this.#mouseOver) {
            this.#mouseOver = false;
            this.#dirty = true;
            this.#mouseLeave(cam);
        }
        if (this.#mouseOver) this.#mouseIsOver(cam);
    }

    // Style : superposition
    #currentStyle() {
        let style = this.#drawInfos;
        if (this.#mouseOver && this.#hoverStyle)
            style = { ...style, ...this.#hoverStyle };
        if (this.#active && this.#mouseOver && this.#activeStyle)
            style = { ...style, ...this.#activeStyle };
        return style;
    }
    #normalizeStyle(style) {
        if (style === null) return null;
        if (typeof style !== 'object')
            throw new Error('Invalid style, must be an object or null');
        const out = {};
        if ('backgroundColor' in style) out.backgroundColor = style.backgroundColor;
        if ('color' in style) out.color = style.color;
        if ('border' in style)
            out.border = normalizeBorder(style.border, style.backgroundColor ?? this.#drawInfos.backgroundColor);
        if ('borderRadius' in style) out.borderRadius = normalizeBorderRadius(style.borderRadius);
        if ('boxShadow' in style) out.boxShadow = normalizeBoxShadow(style.boxShadow);
        return out;
    }

    // Cache canvas
    #blurMargin(blur) {
        return blur ? Math.ceil(blur * 2) : 0;  
    }
    #computeShadowBounds() {
        const bounds = { left: 0, right: 0, top: 0, bottom: 0 };
        const shadows = this.#renderStyle.boxShadow;
        if (!shadows) return bounds;
        for (const s of shadows) {
            if (s.inset) continue;
            const m = this.#blurMargin(s.blur);
            bounds.left   = Math.max(bounds.left,   Math.ceil(m - s.offsetX));
            bounds.right  = Math.max(bounds.right,  Math.ceil(m + s.offsetX));
            bounds.top    = Math.max(bounds.top,    Math.ceil(m - s.offsetY));
            bounds.bottom = Math.max(bounds.bottom, Math.ceil(m + s.offsetY));
        }
        return bounds;
    }
    #updateCachCanvas() {
        this.#renderStyle = this.#currentStyle();
        const b = this.#computeShadowBounds();
        this.#shadowOffset = { x: b.left, y: b.top };
        this._cachCanvas.width  = this.#dimension.width  + b.left + b.right;
        this._cachCanvas.height = this.#dimension.height + b.top  + b.bottom;
        this.#drawCachCanvas();
    }
    #drawCachCanvas() {
        const ctx = this._cachCanvas.getContext('2d');
        ctx.clearRect(0, 0, this._cachCanvas.width, this._cachCanvas.height);
        const { x: startX, y: startY } = this.#shadowOffset;
        const shadows = this.#renderStyle.boxShadow || [];

        for (let i = shadows.length - 1; i >= 0; i--) {
            if (!shadows[i].inset) this.#drawBoxShadow(ctx, shadows[i], { x: startX, y: startY });
        }
        this.#drawCustomRec(ctx, startX, startY, this.#renderStyle.backgroundColor, this.#renderStyle.border ? true : false);
        shadows.forEach((shadow) => {
            if (shadow.inset) this.#drawInsetBoxShadow(ctx, shadow, { x: startX, y: startY });
        });
        this.#drawGadgetText(ctx, startX, startY);
    }
    #drawGadgetText(ctx, x, y) {
        if (!this.#textValue) return;
        ctx.drawImage(this.#textValue.canvas, x, y, this.#textValue.canvas.width, this.#textValue.canvas.height);
    }
    #drawBoxShadow(ctx, shadow, origin) {
        const x = origin.x + shadow.offsetX;
        const y = origin.y + shadow.offsetY;
        if (shadow.blur) {
            const m = this.#blurMargin(shadow.blur);
            const sc = Gadget.shadowCanvas;
            sc.width  = this.#dimension.width  + m * 2;
            sc.height = this.#dimension.height + m * 2;
            this.#drawCustomRec(Gadget.shadowCtx, m, m, shadow.color, false,
                                this.#dimension.width, this.#dimension.height, shadow.blur);
            ctx.drawImage(sc, x - m, y - m);
        } else {
            this.#drawCustomRec(ctx, x, y, shadow.color);
        }
    }
    #drawInsetBoxShadow(ctx, boxShadow, offset = { x: 0, y: 0 }) {
        ctx.fillStyle = boxShadow.color;
        const wx = boxShadow.offsetX >= 0 ? offset.x : this.#dimension.width + -boxShadow.offsetX;
        const hy = boxShadow.offsetY >= 0 ? offset.y : this.#dimension.height - boxShadow.offsetY;
        const hx = boxShadow.offsetX >= 0 ? offset.x + boxShadow.offsetX : offset.x;
        ctx.fillRect(wx, offset.y, boxShadow.offsetX, this.#dimension.height);
        ctx.fillRect(hx, hy, this.#dimension.width - offset.x, boxShadow.offsetY);
    }
    #drawCustomRec(ctx, x, y, color, border = false, width = this.#dimension.width, height = this.#dimension.height, blur = false) {
        const lineWidth = border ? this.#renderStyle.border.lineWidth : 0;
        const arc = this.#renderStyle.borderRadius ? this.#renderStyle.borderRadius : { tl: 0, tr: 0, bl: 0, br: 0 };
        width += (x - lineWidth); height += (y - lineWidth);
        x += lineWidth;
        y += lineWidth;
        ctx.beginPath();
        if (blur) ctx.filter = `blur(${blur}px)`;
        ctx.fillStyle = color;
        ctx.moveTo(x, y + arc.tl);
        ctx.arcTo(x, y, x + arc.tl, y, arc.tl);
        ctx.lineTo(width - arc.tr, y);
        ctx.arcTo(width, y, width, y + arc.tr, arc.tr);
        ctx.lineTo(width, height - arc.br);
        ctx.arcTo(width, height, width - arc.br, height, arc.br);
        ctx.lineTo(x + arc.bl, height);
        ctx.arcTo(x, height, x, height - arc.bl, arc.bl);
        ctx.lineTo(x, y + arc.tl);
        ctx.fill();
        if (lineWidth) {                    
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = this.#renderStyle.border.color;
            ctx.stroke();
        }
    }

    // Setters
    set position(position) {
        if (!(position instanceof Object) || !('x' in position) || !('y' in position))
            throw new Error("Invalid position object, position must be {x,y}");
        this.#position = position;
    }
    set dimension(dimension) {
        if (!(dimension instanceof Object) || !('width' in dimension) || !('height' in dimension))
            throw new Error("Invalid dimension object, dimension must be {width,height}");
        this.#dimension = dimension;
        this.#dirty = true;
    }
    set onMouseOver(callback) { this.#onMouseOver = assertFunction(callback); }
    set onMouseEnter(callback) { this.#onMouseEnter = assertFunction(callback); }
    set onMouseLeave(callback) { this.#onMouseLeave = assertFunction(callback); }
    set onClick(callback) { this.#onClick = assertFunction(callback); }
    set onActived(callback) { this.#onActived = assertFunction(callback); }

    set border(value) {
        this.#drawInfos.border = normalizeBorder(value, this.#drawInfos.backgroundColor);
        this.#dirty = true;
    }
    set borderRadius(value) {
        this.#drawInfos.borderRadius = normalizeBorderRadius(value);
        this.#dirty = true;
    }
    set boxShadow(value) {
        this.#drawInfos.boxShadow = normalizeBoxShadow(value);
        this.#dirty = true;
    }
    set backgroundColor(color) {
        if (color === this.#drawInfos.backgroundColor) return;
        this.#drawInfos.backgroundColor = color;
        this.#dirty = true;
    }
    set color(color) {
        if (color === this.#drawInfos.color) return;
        this.#drawInfos.color = color;
        this.#dirty = true;
    }
    set hoverStyle(style) {
        this.#hoverStyle = this.#normalizeStyle(style);
        this.#dirty = true;
    }
    set activeStyle(style) {
        this.#activeStyle = this.#normalizeStyle(style);
        this.#dirty = true;
    }
    set value(value) {
        if (typeof value !== "string")
            throw new Error('Invalid value, must be a string');
        if (this.#textValue) {
            this.#textValue.value = value;
        } else {
            this.#textValue = new Text(value, this.#dimension.width, this.#dimension.height);
            this.#dirty = true;
        }
    }
    set font(font) {
        if (typeof font !== "string")
            throw new Error('Invalid font, must be a string');
        this.#ensureText().font = font;
    }
    set textAlign(align) {
        if (align !== 'start' && align !== 'end' && align !== 'left' && align !== 'right' && align !== 'center')
            throw new Error("Invalid value, textAlign must be 'start','end','left','right' or 'center'");
        this.#ensureText().textAlign = align;
    }
    set textBaseline(baseline) {
        if (baseline !== 'top' && baseline !== 'hanging' && baseline !== 'middle' && baseline !== 'alphabetic' && baseline !== 'ideographic' && baseline !== 'bottom')
            throw new Error("Invalid value, textBaseline must be 'top','hanging','middle','alphabetic','ideographic' or 'bottom'");
        this.#ensureText().textBaseline = baseline;
    }
    set textDirection(direction) {
        if (direction !== 'ltr' && direction !== 'rtl' && direction !== 'inherit')
            throw new Error("Invalid value, textDirection must be 'ltr','rtl' or 'inherit'");
        this.#ensureText().textDirection = direction;
    }
    #ensureText() {
        if (!this.#textValue) {
            this.#textValue = new Text("", this.#dimension.width, this.#dimension.height);
            this.#dirty = true;
        }
        return this.#textValue;
    }
    set transition(transition) {
        if (!Array.isArray(transition))
            throw new Error('Invalid value, transition must be an array');
        const [name, duration = 0, timingFunction = 'linear', delay = 0] = transition;
        if (typeof name !== 'string')
            throw new Error('Invalid value, transition name must be a string');
        if (isNaN(duration))
            throw new Error('Invalid value, transition duration must be a number');
        if (!['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'].includes(timingFunction))
            throw new Error('Invalid value, transition timing function must be "linear","ease","ease-in","ease-out" or "ease-in-out"');
        if (isNaN(delay))
            throw new Error('Invalid value, transition delay must be a number');
        this.#transitions.push({ name, duration, timingFunction, delay });
    }

    // Getters
    get position() { return this.#position; }
    get dimension() { return this.#dimension; }
    get onMouseEnter() { return this.#onMouseEnter; }
    get onMouseLeave() { return this.#onMouseLeave; }
    get onMouseOver() { return this.#onMouseOver; }
    get onActived() { return this.#onActived; }
    get mouseOver() { return this.#mouseOver; }
    get onClick() { return this.#onClick; }
    get border() { return this.#drawInfos.border; }
    get backgroundColor() { return this.#drawInfos.backgroundColor; }
    get color() { return this.#drawInfos.color; }
    get boxShadow() { return this.#drawInfos.boxShadow; }
    get hoverStyle() { return this.#hoverStyle; }
    get activeStyle() { return this.#activeStyle; }
    get value() { return this.#textValue?.value; }
    get font() { return this.#textValue?.font; }
    get textAlign() { return this.#textValue?.textAlign; }
    get textBaseline() { return this.#textValue?.textBaseline; }
    get textDirection() { return this.#textValue?.textDirection; }
    get transitions() { return this.#transitions; }
}

export { Gadget };
