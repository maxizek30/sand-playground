import * as THREE from 'three';
import { updateSandDynamics } from './sandSimulation';

export class DroppingSquare {
    private mesh: THREE.Mesh;
    private position: { x: number, z: number };
    private sandArray: number[][][];
    private platformHeight: number;
    private meshContainer: THREE.InstancedMesh;
    private platformWidth: number;
    private platformDepth: number;
    private width: number;
    private depth: number;
    private keydownListener: (event: KeyboardEvent) => void;
    private fanIndex: number;
    private fanOn: boolean;


    constructor(width: number, depth: number, sandArray: number[][][], platformHeight: number, meshContainer: THREE.InstancedMesh, platformWidth: number, platformDepth: number, fanOn: boolean, fanIndex: number, ) {
        this.position = { x: 0, z: 0 };
        this.sandArray = sandArray;
        this.platformHeight = platformHeight;
        this.meshContainer = meshContainer;
        this.platformWidth = platformWidth;
        this.platformDepth = platformDepth;
        this.width = width;
        this.depth = depth;
        this.mesh = this.createDroppingSquare(width, depth);
        this.setupKeyControls();
        this.fanIndex = fanIndex;
        this.fanOn = fanOn;
        
    }

    //create a dropping square mesh based on width and depth
    private createDroppingSquare(width: number, depth: number): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(width, depth, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        const droppingSquare = new THREE.Mesh(geometry, material);
        // Position the square above the sand showcase
        droppingSquare.position.set(0, 65, 0);
        // Rotate to lay flat
        droppingSquare.rotation.x = -Math.PI / 2;
        return droppingSquare;
    }

    private setupKeyControls() {
        this.keydownListener = (event: KeyboardEvent) => {
            let moveDistance;
            if (event.shiftKey) {
                moveDistance = 5;
            } else {  moveDistance = 1; }
            switch (event.key) {
                case 'ArrowUp':
                    this.position.z -= moveDistance;
                    break;
                case 'ArrowDown':
                    this.position.z += moveDistance;
                    break;
                case 'ArrowLeft':
                    this.position.x -= moveDistance;
                    break;
                case 'ArrowRight':
                    this.position.x += moveDistance;
                    break;
                case ' ':
                    // Spacebar to drop sand
                    this.dropSand();
                    break;
            }
            this.updateDroppingSquarePosition();
        };
        window.addEventListener('keydown', this.keydownListener);
    }
    private updateDroppingSquarePosition() {
        // Ensure the position is within the platform bounds
        this.position.x = Math.max(-this.platformWidth / 2, Math.min(this.platformWidth / 2 - 1, this.position.x));
        this.position.z = Math.max(-this.platformDepth / 2, Math.min(this.platformDepth / 2 - 1, this.position.z));
        this.mesh.position.set(this.position.x, 65, this.position.z);
        console.log(`Dropping square position updated to (${this.position.x}, 65, ${this.position.z})`);
    }

    private dropSand() {
        // Convert world space position to array space position
        const arrayX = Math.floor(this.position.x + this.platformWidth / 2);
        const arrayZ = Math.floor(this.position.z + this.platformDepth / 2);
        const topY = this.sandArray[0][0].length - 1;

        console.log(`Attempting to drop sand at world space (${this.position.x}, 65, ${this.position.z}) converted to array space (${arrayX}, ${arrayZ}, ${topY})`);

        // Place the sand particles in the area defined by the width and depth of the dropping square
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.depth; j++) {
                const dropX = arrayX + i - Math.floor(this.width / 2);
                const dropZ = arrayZ + j - Math.floor(this.depth / 2);
                if (dropX >= 0 && dropX < this.sandArray.length && dropZ >= 0 && dropZ < this.sandArray[0].length) {
                    if (this.sandArray[dropX][dropZ][topY] === 0) {
                        this.sandArray[dropX][dropZ][topY] = 1;
                    } else {
                        console.log(`Top position (${dropX}, ${dropZ}, ${topY}) is already occupied`);
                    }
                } else {
                    console.log(`Position (${dropX}, ${dropZ}, ${topY}) is out of bounds`);
                }
            }
        }

        updateSandDynamics(this.sandArray, this.meshContainer, this.platformHeight, this.fanOn, this.fanIndex);
        console.log(`Sand dropped at array space (${arrayX}, ${arrayZ}, ${topY})`);
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }
    public dispose() {
        window.removeEventListener('keydown', this.keydownListener);
    }
}
