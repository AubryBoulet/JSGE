import {Camera,Sprite,Entity,Button,Transition,Scene,Element,ParticleEmitter} from "./classes/jsge.js";
const canvas = document.querySelector("#gameCanvas")
const ctx = canvas.getContext("2d");
const mainCam = new Camera({canvas:canvas,position:{x:200,y:50},backgroundImage:'./assets/sprites/test.png'})
const secCam = new Camera({canvas:canvas,position:{x:900,y:0},backgroundColor:"black"})
mainCam.dimensions={width:400, height:400}
secCam.dimensions={width:100,height:450}
secCam.targetFPS=120;
let skel1, skel2, female1;
// Sprites loading
const skel = Sprite.load("./assets/sprites/skeleton.png",true);
const female = Sprite.load("./assets/sprites/lpcfemalelight.png",true);
// Create a red rectangle sprite
const rect = Sprite.create(150,50,false);
rect.ctx.fillStyle = "red";
rect.ctx.fillRect(0,0,150,50);
const rect1 = Element.create({sprite:rect});
rect1.position = {x:10,y:300};
// Create custom methods for the skeleton entity
const skelStats = {
    life:100,
    takeDamage(damage) {
        this.life -= damage;
        console.log(`life : ${this.life}`)
        if(this.life <= 0)
            mainScene.remove(this)
    },
    jumping:true,
};
rect1.onGravityContact=((_,et)=>et.jumping = false)

const gradient = ctx.createLinearGradient(0, 0, 200, 0);
gradient.addColorStop(0, "green");
gradient.addColorStop(1, "rgba(0, 255, 0, 0.09)");
const button = Button.create("${grad(myGrad) test mais cette} ${wave ${shake(2,5,5) fois} ${blink(0,20) un} ${red peut}} plus ${wave(2,5,10) long}",{width:200,height:90});
const button2 = Button.create('bouton ${wave(5,2,7) avec ${blink(0,20) effets}}',{width:150,height:60})
button.addTextGradient("myGrad",gradient);
button.updateText(); // Update text because gradient is added after button creation
button.position={x:360,y:200};
button2.position={x:10,y:200};
let buttonSlideInTransition;
button.onMouseEnter=()=>{
    Transition.delete(buttonSlideInTransition);
    buttonSlideInTransition = Transition.create([button.position.x,200,'easeOutElastic',(t)=>button.position.x = t]);
};
button.onMouseLeave=()=>{
    Transition.delete(buttonSlideInTransition);
    buttonSlideInTransition = Transition.create([button.position.x,360,'easeOutBounce',(t)=>button.position.x = t]);
};
button.onClick=()=>{
    console.log('clicked button 1')
}
button2.onMouseEnter=()=>{
    console.log('Button 2 mouse enter')
}
button2.onClick=()=>{
    const x = button2.position.x
    Transition.create([x,x+5,(t,b,c,d)=>{
        const normalizedTime = t / d;
        const amplitude = c * Math.pow(0.9, normalizedTime * d / 1000);
        const oscillation = Math.sin(2 * Math.PI * 10 * (t / 1000));
        return b + amplitude * oscillation;
    },(t)=>{button2.position.x = x + t},2,0,()=>{button2.position.x = x;emitter.particleAcceleration = {x:0,y:0};}]);
    emitter.particleAcceleration = {x:-0.02,y:-0.05};
}
button.backgroundColor='#F0F';
// button.boxShadow=[-6,-5];
button.textAlign = 'center';
button.boxShadow=[[-6,-10,'#FFA',1],[6,5,'rgba(0, 0, 255, 0.61)',3]];
// button.font = '48px sherif'
button.borderRadius = [10,5,20,0];
const mainScene = new Scene();
const mainLight = mainCam.initMaskLightEngine()
mainLight.mask = {color:"rgba(0,0,0,0.8)"}
const lightGrad = mainLight.getRenderCtx().createRadialGradient(200, 100, 0, 200, 100, 150);
lightGrad.addColorStop(0, "rgb(255, 255, 255)");
lightGrad.addColorStop(0.7, "rgb(255, 255, 255)");
lightGrad.addColorStop(1, "rgba(255, 255, 255, 0.3)");
const light = mainLight.addLightEmitter(200,100,200,lightGrad);
const light2 = mainLight.addLightEmitter(200,200,50);
light.angleRange = 90;
mainCam.onMouseMouve=((mouse) => light.lookAt={x:mouse.x,y:mouse.y})
// light.color = 'rgba(0,0,0,1)';
Promise.all([skel,female])
.then(([skel, female]) => {
    // Entities creation & animations
    skel.animations.column = 13;
    skel.animations.row = 21;
    skel.animations.frameRate = 10;
    skel.animations.createAnimationFrames(26,32,"idle",10);
    female.animations.column = 13;
    female.animations.row = 21;
    female.animations.createAnimationFrames(143,150,"walk_right",7);
    skel.animations.setAnimationFrameHitBox("idle",15,49,10,54);
    female.animations.setAnimationFrameHitBox("walk_right",15,49,10,54);
    skel1 = Entity.create({sprite:skel,physic:true,gravity:2},[skelStats]); // add skelStats to the skeleton entity
    skel2 = Entity.create({sprite:skel});
    female1 = Entity.create({sprite:female});
    skel2.scale = 1.5;
    skel1.currentAnimation = "idle";
    skel2.currentAnimation = "idle";
    skel2.frameRate = 5;
    skel1.acceleration = 0.3;
    female1.currentAnimation = "walk_right";
    female1.position = {x:100,y:20};
    female1.physic = true;
    female1.addColisionWithEntity(skel1,()=>{skel1.velocity = {x:-skel1.velocity.x,y:-skel1.velocity.y};skel1.takeDamage(10)})
    mainCam.backgroundImageVelocity = {x:1,y:1};
    mainCam.backgroundImageLoop = true;
    mainCam.backgroundImageFillStyle = 'imageSize'
    // Build main scene
    mainScene.add(skel1,2);
    mainScene.add(female1);
    mainScene.add(rect1,1);
    mainScene.add(button);
    mainScene.add(button2);
    test()
})
const emitter = new ParticleEmitter(170, 200);
emitter.particleSize = {width: 5, height: 5};
emitter.particleColorRange = {startColor: '#FF0000', endColor: '#FFFF00'};
emitter.particleLifetime = {min: 500, max: 1000};
emitter.emissionRate = 50;
emitter.emissionDuration= 0;
emitter.startEmission();
mainScene.add(emitter,3);
function getRandomColor() {
  let letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
// Redering loop
let startTime = performance.now();
function test() {
    // const renderingFrame = performance.now();
    //clear the screen before draw again
    mainCam.clear();
    secCam.clear();
    //Draw camera border
    mainCam.drawCameraBorder("yellow");
    secCam.drawCameraBorder("green");
    mainScene.draw(mainCam);
    skel2.draw(secCam);
    if(performance.now() - startTime > 2000) {
        startTime = performance.now();
        secCam.backgroundColor = getRandomColor() 
    }
    mainCam.flipBuffer();
    secCam.flipBuffer();
    // console.log('Frame rending in :',performance.now()-renderingFrame,'ms')
    // mainCam.moveCamera({x:skel1.velocity.x,y:skel1.velocity.y},"relative");
    requestAnimationFrame(test)
}

// check keyboard input
document.addEventListener("keydown", (event) => {
    switch(event.key){
        case 'ArrowUp':
            if(skel1.jumping === false){
                skel1.velocity.y = -10;
                skel1.jumping = true;
                break;
            }
            break;
        case 'ArrowLeft':
            skel1.velocity = {x:-1,y:0};
            break;
        case 'ArrowRight':
            skel1.velocity = {x:1,y:0};
            break;
        case 'f':
            female1.flippedX = !female1.flippedX;
            break;
        case 'g':
            female1.flippedY = !female1.flippedY;
            break;
    }
})