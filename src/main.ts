import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { initializeScene, updatePlatformDimensions } from './sceneSetup';
import { setupControls } from './controls';
import { create3DArray, createSquareInstances, populateSandArray } from "./sandSimulation";
import { DroppingSquare } from './droppingSquare';
import { Fan } from './fan';
import { animate } from './animation';

window.addEventListener("DOMContentLoaded", main);
window.addEventListener("resize", resize);

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let canvas: HTMLCanvasElement;
let platform: THREE.Mesh;
let gui: GUI;
let droppingSquare: DroppingSquare;
let fan: Fan | null = null;
let audio = new Audio("fanSounds.mp3");

let sandArray: number[][][];
let mesh: THREE.InstancedMesh;
//information about the fan
let fanInfo = {
    index: 0,
    enabled: false,
};
//dimensions of the platform/sand array
let dimensions = {
    width: 100,
    depth: 100,
    height: 60,
};
//size of the dropper
let dropperSize = {
    r: 1,
};

async function main() {
    canvas = document.querySelector('#main-canvas') as HTMLCanvasElement;

    //get scene info
    [renderer, scene, camera, platform] = initializeScene(canvas, dimensions.width, dimensions.depth);

    //setup controls
    const controls = setupControls(camera, canvas);

    //create and populate array
    sandArray = create3DArray(dimensions.width, dimensions.depth, dimensions.height);
    populateSandArray(sandArray);

    //create and add sand mesh using array
    mesh = createSquareInstances(sandArray, 5);
    scene.add(mesh);

    //create and add dropping square
    droppingSquare = new DroppingSquare(1, 1, sandArray, 5, mesh, dimensions.width, dimensions.depth, fanInfo.enabled, fanInfo.index);
    scene.add(droppingSquare.getMesh());

    await manageFan(scene, fanInfo, dimensions);

    //create lilgui
    gui = new GUI();
    gui.add(dropperSize, 'r', 1, 20).name('Dropper Size').step(1).onChange((newValue: number) => {
        scene.remove(droppingSquare.getMesh());
        droppingSquare.dispose();
        droppingSquare = new DroppingSquare(newValue, newValue, sandArray, 5, mesh, dimensions.width, dimensions.depth, fanInfo.enabled, fanInfo.index);
        scene.add(droppingSquare.getMesh());
    });

    gui.add(dimensions, 'width', 50, 400).name('Width').step(1).onChange(async (newValue: number) => {
        updatePlatformDimensions(platform, newValue, dimensions.depth);
        sandArray = create3DArray(newValue, dimensions.depth, dimensions.height);
        populateSandArray(sandArray);
        scene.remove(mesh);
        mesh = createSquareInstances(sandArray, 5);
        scene.add(mesh);

        scene.remove(droppingSquare.getMesh());
        droppingSquare.dispose();
        droppingSquare = new DroppingSquare(dropperSize.r, dropperSize.r, sandArray, 5, mesh, newValue, dimensions.depth, fanInfo.enabled, fanInfo.index);
        scene.add(droppingSquare.getMesh());

        await manageFan(scene, fanInfo, { ...dimensions, width: newValue });

        // Restart animation loop
        animate(renderer, scene, camera, mesh, sandArray, 5, fanInfo.enabled, fanInfo.index);
    });

    gui.add(dimensions, 'depth', 50, 400).name('Depth').step(1).onChange(async (newValue: number) => {
        updatePlatformDimensions(platform, dimensions.width, newValue);
        sandArray = create3DArray(dimensions.width, newValue, dimensions.height);
        populateSandArray(sandArray);
        scene.remove(mesh);
        mesh = createSquareInstances(sandArray, 5);
        scene.add(mesh);

        scene.remove(droppingSquare.getMesh());
        droppingSquare.dispose();
        droppingSquare = new DroppingSquare(dropperSize.r, dropperSize.r, sandArray, 5, mesh, dimensions.width, newValue, fanInfo.enabled, fanInfo.index);
        scene.add(droppingSquare.getMesh());

        await manageFan(scene, fanInfo, { ...dimensions, depth: newValue });

        // Restart animation loop
        animate(renderer, scene, camera, mesh, sandArray, 5, fanInfo.enabled, fanInfo.index);
    });

    gui.add(fanInfo, 'enabled').name("Fan Enabled").onChange(async (enabled: boolean) => {
        await manageFan(scene, fanInfo, dimensions);
        animate(renderer, scene, camera, mesh, sandArray, 5, enabled, fanInfo.index);
    });

    gui.add(fanInfo, 'index', { Front: 0, Right: 1, Back: 2, Left: 3 }).name("Fan Position").onChange(async (newValue: number) => {
        await manageFan(scene, fanInfo, dimensions);
        animate(renderer, scene, camera, mesh, sandArray, 5, fanInfo.enabled, newValue);
    });

    // Add controls information to lilgui
    const controlsInfo = {
        "Move Dropper": "Arrow keys",
        "Move Dropper by 5": "Shift + Arrow keys",
        "Drop Sand": "Space"
    };
    const controlsFolder = gui.addFolder('Controls');
    Object.keys(controlsInfo).forEach(key => {
        controlsFolder.add({ [key]: controlsInfo[key] }, key).name(key).disable();
    });

    resize();
    animate(renderer, scene, camera, mesh, sandArray, 5, fanInfo.enabled, fanInfo.index);
}

async function manageFan(scene: THREE.Scene, fanInfo: { index: number, enabled: boolean }, dimensions: { width: number, depth: number }) {
    if (fan) {
        scene.remove(fan.getFan());
        //pause fan audio
        audio.pause();
        fan = null;
    }
    if (fanInfo.enabled) {
        fan = new Fan(fanInfo.index, dimensions.width, dimensions.depth);
        let fanModel = await waitForFanModel(fan);
        //play fan audio
        audio.play();
        if (fanModel) {
            scene.add(fanModel);
            console.log('Fan added to the scene');
        } else {
            console.log("Fan not loaded");
        }
    }
}
//ensure fan model is loaded properly
function waitForFanModel(fan: Fan): Promise<THREE.Object3D> {
    return new Promise((resolve) => {
        const checkFanLoaded = () => {
            const fanModel = fan.getFan();
            if (fanModel) {
                resolve(fanModel);
            } else {
                requestAnimationFrame(checkFanLoaded);
            }
        };
        checkFanLoaded();
    });
}

function resize(): void {
    const canvasContainer = canvas.parentElement!;
    const w = canvasContainer.clientWidth;
    const h = canvasContainer.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}
