
import { Camera } from "./camera.js";
import { Sprite } from "./sprites.js";
import { Entity } from "./entity.js";
import { Button } from "./button.js";
import { Transition } from "./transition.js";
import { Scene } from "./scene.js";
import { Element } from "./element.js";

// Re-export nommés (pour pouvoir faire import { Camera } from "./jsge.js")
export { Camera, Sprite, Entity, Button, Transition, Scene, Element };

// OU export par défaut sous forme d'objet regroupant tout
const JSGE = { Camera, Sprite, Entity, Button, Transition, Scene, Element };
export default JSGE;