import { Camera } from "./classes/camera.js";
import { Sprite } from "./classes/sprites.js";
import { Entity } from "./classes/entity.js";
import { Button } from "./classes/button.js";
const canvas = document.querySelector("#gameCanvas")
const ctx = canvas.getContext("2d");
const mainCam = new Camera({canvas:canvas,position:{x:200,y:50},backgroundImage:'./assets/sprites/test.png'})
const secCam = new Camera({canvas:canvas,position:{x:900,y:0},backgroundColor:"black"})
mainCam.dimensions={width:400, height:400}
secCam.dimensions={width:100,height:450}
let skel1, skel2, female1;
// Sprites loading
const skel = Sprite.create("./assets/sprites/skeleton.png",true)
const female = Sprite.create("./assets/sprites/lpcfemalelight.png",true)
const skelStats = {
    life:100,
    takeDamage(damage) {
        this.life -= damage;
        console.log(`life : ${this.life}`)
    }
};


const button = Button.create({width:100,height:50});
button.position={x:100,y:200};
button.onMouseEnter=()=>{console.log('mouse enter !')};
button.onMouseLeave=()=>console.log('mouse leave !');
button.backgroundColor='#F0F';
// button.boxShadow=[-6,-5];
// button.boxShadow=[[-6,-5,'#FFA',1],[6,5,'rgba(0, 0, 255, 0.61)',3]];
// button.borderRadius = [10,5,20,0];


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
    skel1 = Entity.create({sprite:skel},[skelStats]);
    skel2 = Entity.create({sprite:skel});
    female1 = Entity.create({sprite:female});
    skel2.scale = 1.5;
    skel1.currentAnimation = "idle";
    skel2.currentAnimation = "idle";
    skel2.frameRate = 5;
    skel1.acceleration = 0.3;
    female1.currentAnimation = "walk_right";
    female1.position = {x:100,y:50};
    female1.physic = true;
    female1.addColisionWithEntity(skel1,(res)=>{skel1.velocity = {x:-skel1.velocity.x,y:-skel1.velocity.y};skel1.takeDamage(5)})
    mainCam.backgroundImageVelocity = {x:-1,y:1};
    mainCam.backgroundImageLoop = true;
    mainCam.backgroundImageFillStyle = 'imageSize'
    test()
})
function getRandomColor() {
  let letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
let clipX = 0;
let startTime = performance.now();
function test() {
    const renderingFrame = performance.now();
    //clear the screen before draw again
    ctx.clearRect(0,0,canvas.width,canvas.height)
    mainCam.clear();
    secCam.clear();
    //Draw camera border
    mainCam.drawCameraBorder("yellow");
    secCam.drawCameraBorder("green");
    //Draw entities
    skel1.update();
    skel1.drawEntity(mainCam);
    female1.update();
    female1.drawEntity(mainCam);
    skel2.update();
    skel2.drawEntity(secCam);
    button.draw(mainCam);
    if(performance.now() - startTime > 2000) {
        startTime = performance.now();
        secCam.backgroundColor = getRandomColor() 
    }
    // console.log('Frame rending in :',performance.now()-renderingFrame,'ms')
    // mainCam.moveCamera({x:skel1.velocity.x,y:skel1.velocity.y},"relative");
    requestAnimationFrame(test)
}

// check keyboard input
document.addEventListener("keydown", (event) => {
    switch(event.key){
        case 'ArrowUp':
            skel1.velocity = {x:0,y:-1};
            break;
        case 'ArrowDown':
            skel1.velocity = {x:0,y:1};
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