import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Fan {
    private fan: THREE.Object3D;
    private posIndex: number;
    private platformWidth: number;
    private platformDepth: number;

    constructor(posIndex: number, platformWidth: number, platformDepth: number) {
        this.posIndex = posIndex;
        this.platformWidth = platformWidth;
        this.platformDepth = platformDepth;
        this.loadFanModel();
    }

    private loadFanModel() {
        const loader = new GLTFLoader();
        loader.load(
            'models/fan.glb',
            (glb) => {
                console.log("Fan model loaded");
                this.fan = glb.scene;
                this.fan.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xc0c0c0,
                            metalness: 1.0,
                            roughness: 0.4
                        });
                    }
                });
                this.setPositionAndRotation();
                this.fan.scale.set(8, 8, 8);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + "% loaded");
            },
            (error) => {
                console.log("Error loading fan model:", error);
            }
        );
    }

    private setPositionAndRotation() {
        if (this.fan) {
            switch (this.posIndex) {
                case 0:
                    this.fan.position.set(0, 0, (-this.platformDepth / 2) - 15);
                    break;
                case 1:
                    this.fan.position.set((this.platformWidth / 2) + 15, 0, 0);
                    this.fan.rotation.y = -Math.PI / 2;
                    break;
                case 2:
                    this.fan.position.set(0, 0, (this.platformDepth / 2) + 15);
                    this.fan.rotation.y = -Math.PI;
                    break;
                case 3:
                    this.fan.position.set((-this.platformWidth / 2) - 15, 0, 0);
                    this.fan.rotation.y = -Math.PI * 3 / 2;
                    break;
            }
        }
    }

    public getFan(): THREE.Object3D {
        return this.fan;
    }

    public setScale(x: number, y: number, z: number) {
        if (this.fan) {
            this.fan.scale.set(x, y, z);
            console.log('Fan scale set to:', this.fan.scale);
        } else {
            console.log('Fan model not loaded yet.');
        }
    }

    public setPosition(x: number, y: number, z: number) {
        if (this.fan) {
            this.fan.position.set(x, y, z);
            console.log('Fan position set to:', this.fan.position);
        } else {
            console.log('Fan model not loaded yet.');
        }
    }

}
