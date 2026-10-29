# 🎮 JSGE - Lightweight 2D JavaScript Game Engine

[![Version](https://img.shields.io/badge/version-0.1-blue.svg)](https://github.com/AubryBoulet/JSGE)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-🌧%20Complete-brightgreen)](https://jsge.netlify.app/)
![JavaScript](https://img.shields.io/badge/javascript-ES6%2B-yellow.svg)
![No Dependencies](https://img.shields.io/badge/dependencies-0%20🌧-lightgrey.svg)

---

**JSGE** is a **lightweight 2D game engine** written in **pure JavaScript (ES6+)** with **zero dependencies**.
Designed for rapid game prototyping with advanced visual effects, it's perfect for:
✅ **Quick prototyping** of game mechanics
✅ **Learning** game development
✅ **Personal projects** or small HTML5 games
✅ **Experiments** with Canvas and animations

---

## ⚡ **Key Features**
   Feature | Description | Docs |
 |---------|-------------|------|
 | 🎇 **Particle System** | Create fire, smoke, explosions with precise control over speed, color, lifetime | [View](https://aubryboulet.github.io/docJSGE/pages/particleEmitter.html) |
 | 💡 **Light Engine** | **Basic** mask-based lighting system for visual effects. *Note: This is a lightweight implementation without true shadow casting. A raycasting-based shadow system is planned for future versions.* | [View](https://aubryboulet.github.io/docJSGE/pages/maskLightEngine.html) |
 | 📹 **Nested Cameras** | Parallax and filter effects with child cameras. Child cameras do **not** clear their content automatically - parent camera handles this. | [View](https://aubryboulet.github.io/docJSGE/pages/camera.html) |
 | 🎭 **Scene Management** | Optimized element organization with automatic z-order sorting | [View](https://aubryboulet.github.io/docJSGE/pages/scene.html) |
 | 🎨 **Animated Backgrounds** | Parallax, loops, velocity for dynamic backgrounds | [View](https://aubryboulet.github.io/docJSGE/pages/camera.html) |
 | 🔄 **Smooth Transitions** | Large library of easing functions | [View](https://aubryboulet.github.io/docJSGE/pages/transition.html) |
 | 🎮 **Entity System** | Game object management with position, physics, and collisions | [View](https://aubryboulet.github.io/docJSGE/pages/entity.html) |

---

## 🚀 **Installation**

### Via CDN (Recommended for quick testing)
```html
<!DOCTYPE html>
<html>
<head>
    <title>My JSGE Game</title>
</head>
<body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>

    <!-- Import JSGE from jsDelivr -->
    <script type="module">
        import { Camera, ParticleEmitter, Scene } from "https://cdn.jsdelivr.net/gh/AubryBoulet/JSGE@0.1/classes/jsge.js";

        // Your code here
        const canvas = document.getElementById("gameCanvas");
        const camera = new Camera({
            canvas: canvas,
            position: { x: 0, y: 0 },
            dimensions: { width: 800, height: 600 },
            backgroundColor: "#166088"
        });

        // Example: Add a particle emitter
        const emitter = new ParticleEmitter(400, 300);
        emitter.particleColorRange = { startColor: "#ff4400", endColor: "#ffff00" };
        emitter.startEmission();

        // Game loop
        function gameLoop() {
            camera.clear();           // ⚠️ Initiates a new frame
            emitter.draw(camera);     // Draw particles
            camera.flipBuffer();      // ⚠️ MUST be called manually after establishing draw list
            requestAnimationFrame(gameLoop);
        }
        gameLoop();
    </script>
</body>
</html>
```

Via GitHub (For development)
```
# Clone the repository
git clone https://github.com/AubryBoulet/JSGE.git

# Import classes directly
import { Camera, ParticleEmitter, LightEmitter } from "./classes/jsge.js";
```

🎮 Complete Example: Fire Effect

```
import { Camera, ParticleEmitter } from "./jsge.js";

// 1. Create a camera
const canvas = document.getElementById("gameCanvas");
const camera = new Camera({
    canvas: canvas,
    position: { x: 0, y: 0 },
    dimensions: { width: 800, height: 600 },
    backgroundColor: "#000000" // Black background for light effect
});

// 2. Create a particle emitter for fire
const fireEmitter = new ParticleEmitter(400, 500);
fireEmitter.particleEmissionSpeed = { min: 1, max: 3 };
fireEmitter.particleSize = { width: 6, height: 6 };
fireEmitter.particleColorRange = { startColor: "#ff4400", endColor: "#ffff00" };
fireEmitter.particleColorChangeRate = { r: -1, g: 0, b: 0 }; // Fade to red
fireEmitter.particleLifetime = { min: 500, max: 1500 };
fireEmitter.particleAcceleration = { x: 0, y: -0.1 }; // Particles go up
fireEmitter.emissionRate = 20;
fireEmitter.particleEmitterAngleRange = { rangeMin: 80, rangeMax: 100 };
fireEmitter.particleEmitterDirection = { x: 0, y: -1 };

// 3. Start emission
fireEmitter.startEmission();

// 4. Game loop
function gameLoop() {
    camera.clear();               // ⚠️ Initiates a new frame
    fireEmitter.draw(camera);    // Draw particles
    camera.flipBuffer();        // ⚠️ MUST be called manually
    requestAnimationFrame(gameLoop);
}
gameLoop();
```

📖 Complete Documentation

👉 [Read the full documentation](https://jsge.netlify.app/)

The documentation includes:

   📘 Detailed guides for each class  
   🎯 Practical examples with copyable code  
   ⚠️ Important warnings about pitfalls to avoid  
   🔍 Explanations of usage patterns  

💡 Best Practices & Pitfalls to Avoid
✅ DO THIS

   Always use Scenes: Elements MUST be added to a Scene to be drawn. scene.draw(camera) followed by camera.flipBuffer() is MANDATORY.  
   Call flipBuffer() manually: This method is NOT called automatically. You must call it after establishing the draw list.  
   Use clear() to initiate new frame: Calling camera.clear() every frame prevents visual artifacts.  
   Limit light emitters: The light engine uses multiple canvases. Too many lights may impact performance.   

❌ AVOID THIS

   Don't use private methods: Methods starting with _ or # are PRIVATE. Incorrect usage can crash the engine.  
   Don't draw without Scene: Entities and Elements do NOT have their own draw functions. They MUST be drawn via a Scene.  
   Don't forget flipBuffer(): Without this call, nothing will be displayed on screen.  
   Don't use moveCamera() for scrolling: This method moves the camera and its content, it is NOT a scrolling solution. A dedicated scrolling method is planned but not yet implemented.  

🤝 Contributing

All contributions are welcome! Here's how you can help:
🐞 Report a Bug

   Open an [Issue](https://github.com/AubryBoulet/JSGE/issues)  
   Describe the problem with:  
       Steps to reproduce  
       Expected behavior  
       Actual behavior  
       Your browser and version  

💻 Contribute Code

   Fork the project
   Create a branch (git checkout -b feature/my-feature)  
   Commit your changes (git commit -m "Add my feature")  
   Push to the branch (git push origin feature/my-feature)  
   Open a Pull Request  

📝 Improve Documentation

   Fix errors  
   Add examples  
   Translate to other languages  

🗺️ Roadmap

| Version | Planned Features | Status |
| :--- | :--- | :--- |
| **0.1** | Core engine (Particles, Basic Lighting, Cameras, Scenes) | ✅ Current |
| **0.2** | Stabilization & Optimization - Fix bugs based on user feedback. Add multitasking for draw phases on different canvases, then synchronize before final render on camera canvas. | 🚧 Planned |
| **0.3** | Advanced collision system, Basic audio support, Spritesheets | ⏳ Planned |
| **0.4** | Advanced lighting with raycasting shadows, Particle improvements | ⏳ Planned |
| **1.0** | Stable version with full feature set | ⏳ Future |


    Note: This roadmap is flexible and may change based on community feedback and contributions.

📜 License

This project is licensed under the MIT License - see the LICENSE file for details.  
🙏 Acknowledgments

   To all contributors who will help improve JSGE  
   To the GameDev community for its support  
   To you, for using JSGE!  

📢 Stay in Touch

   GitHub: AubryBoulet/JSGE  
   Documentation: aubryboulet.github.io/docJSGE  
   Questions: Open an Issue  

⚠️ Version 0.1 - Pre-Alpha

   ⚠️ This project is version 0.1 (pre-alpha) and is intended for testing and feedback collection only.  
   All features may change before version 1.0.  
   Use it for prototyping and testing, not for production projects.  

⭐ If you like JSGE, don't hesitate to ⭐ the project to support it!
