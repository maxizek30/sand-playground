import { updateSandDynamics } from "./sandSimulation";

let animationFrameId: number;

//animation loop
export function animate(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, mesh: THREE.InstancedMesh, sandArray: number[][][], platformHeight: number, fanOn: boolean, fanIndex: number): void {
    function loop(): void {
        updateSandDynamics(sandArray, mesh, platformHeight, fanOn, fanIndex);
        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(loop);
    }

    // Cancel any existing animation frame to avoid multiple loops
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    loop();
}
