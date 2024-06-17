import * as THREE from 'three';

export function updateSandDynamics(sandArray: number[][][], mesh: THREE.InstancedMesh, platformHeight: number, fanOn: boolean, fanIndex: number): void {
    let changes = false;

    const gravityDirections = [
        [1, 0, -1], [-1, 0, -1],  // left and right below
        [0, 1, -1], [0, -1, -1],  // forward and backward below
        [1, 1, -1], [1, -1, -1],  // forward-right and backward-right below
        [-1, 1, -1], [-1, -1, -1] // forward-left and backward-left below
    ];

    const fanDirections = [
        [0, 1, 0],  // front
        [-1, 0, 0], // right
        [0, -1, 0], // back
        [1, 0, 0]   // left
    ];

    const diagonalFanDirections = [
        [0, 1, -1],  // front
        [-1, 0, -1], // right
        [0, -1, -1], // back
        [1, 0, -1]   // left
    ];

    // Helper function to apply fan influence and gravity
    function applyMovements(x: number, y: number, z: number) {
        let moved = false;

        if (fanOn) {
            const [dx, dz, dy] = diagonalFanDirections[fanIndex];
            const nx = x + dx;
            const nz = z + dz;
            const ny = y + dy;
            if (nx >= 0 && nx < sandArray.length && nz >= 0 && nz < sandArray[0].length && ny >= 0 && ny < sandArray[0][0].length && sandArray[nx][nz][ny] === 0) {
                sandArray[nx][nz][ny] = 1;
                sandArray[x][z][y] = 0;
                changes = true;
                moved = true;
            } else {
                const [dx, dz, dy] = fanDirections[fanIndex];
                const nx = x + dx;
                const nz = z + dz;
                const ny = y;
                if (nx >= 0 && nx < sandArray.length && nz >= 0 && nz < sandArray[0].length && sandArray[nx][nz][ny] === 0) {
                    sandArray[nx][nz][ny] = 1;
                    sandArray[x][z][y] = 0;
                    changes = true;
                    moved = true;
                }
            }
        }

        if (!moved) {
            if (y - 1 >= 0 && sandArray[x][z][y - 1] === 0) {
                sandArray[x][z][y - 1] = 1;
                sandArray[x][z][y] = 0;
                changes = true;
            } else {
                const sidesArray: number[] = [];
                gravityDirections.forEach(([dx, dz, dy], direction) => {
                    const nx = x + dx;
                    const nz = z + dz;
                    const ny = y + dy;
                    if (nx >= 0 && nx < sandArray.length && nz >= 0 && nz < sandArray[0].length && ny >= 0 && ny < sandArray[0][0].length && sandArray[nx][nz][ny] === 0) {
                        sidesArray.push(direction);
                    }
                });

                if (sidesArray.length > 0) {
                    const randomDirection = sidesArray[Math.floor(Math.random() * sidesArray.length)];
                    const [dx, dz, dy] = gravityDirections[randomDirection];
                    const nx = x + dx;
                    const nz = z + dz;
                    const ny = y + dy;
                    sandArray[nx][nz][ny] = 1;
                    sandArray[x][z][y] = 0;
                    changes = true;
                }
            }
        }
    }

    // Loop through the sand array based on fan position
    if (fanOn && fanIndex === 0) {
        // Fan at the front
        for (let y = 0; y < sandArray[0][0].length; y++) {
            for (let z = sandArray[0].length - 1; z >= 0; z--) {
                for (let x = 0; x < sandArray.length; x++) {
                    if (sandArray[x][z][y] === 1) {
                        applyMovements(x, y, z);
                    }
                }
            }
        }
    } else if (fanOn && fanIndex === 1) {
        // Fan at the right
        for (let y = 0; y < sandArray[0][0].length; y++) {
            for (let x = 0; x < sandArray.length; x++) {
                for (let z = 0; z < sandArray[x].length; z++) {
                    if (sandArray[x][z][y] === 1) {
                        applyMovements(x, y, z);
                    }
                }
            }
        }
    } else if (fanOn && fanIndex === 2) {
        // Fan at the back
        for (let y = 0; y < sandArray[0][0].length; y++) {
            for (let z = 0; z < sandArray[0].length; z++) {
                for (let x = 0; x < sandArray.length; x++) {
                    if (sandArray[x][z][y] === 1) {
                        applyMovements(x, y, z);
                    }
                }
            }
        }
    } else if (fanOn && fanIndex === 3) {
        // Fan at the left
        for (let y = 0; y < sandArray[0][0].length; y++) {
            for (let x = sandArray.length - 1; x >= 0; x--) {
                for (let z = 0; z < sandArray[x].length; z++) {
                    if (sandArray[x][z][y] === 1) {
                        applyMovements(x, y, z);
                    }
                }
            }
        }
    } else {
        // Default gravity application when fan is off
        for (let y = 0; y < sandArray[0][0].length; y++) {
            for (let x = 0; x < sandArray.length; x++) {
                for (let z = 0; z < sandArray[x].length; z++) {
                    if (sandArray[x][z][y] === 1) {
                        applyMovements(x, y, z);
                    }
                }
            }
        }
    }

    if (changes) {
        updateMesh(sandArray, mesh, platformHeight);
    }
}

function updateMesh(sandArray: number[][][], mesh: THREE.InstancedMesh, platformHeight: number) {
    const particleCount = countParticles(sandArray);

    if (particleCount > mesh.count) {
        const newBufferSize = Math.max(particleCount, mesh.count * 2);
        mesh.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(newBufferSize * 16), 16);
        mesh.count = newBufferSize;
    }

    let instanceId = 0;
    const offset = platformHeight / 2 + 0.5;

    for (let x = 0; x < sandArray.length; x++) {
        for (let z = 0; z < sandArray[x].length; z++) {
            for (let y = 0; y < sandArray[x][z].length; y++) {
                if (sandArray[x][z][y] === 1) {
                    const matrix = new THREE.Matrix4();
                    matrix.setPosition(x - sandArray.length / 2, y + offset, z - sandArray[x].length / 2);
                    mesh.setMatrixAt(instanceId, matrix);
                    instanceId++;
                }
            }
        }
    }
    mesh.instanceMatrix.needsUpdate = true;
}

function countParticles(array: number[][][]): number {
    let count = 0;
    array.forEach(layer => layer.forEach(row => row.forEach(cell => {
        if (cell === 1) count++;
    })));
    return count;
}
//creates a 3d array of a certain size
export function create3DArray(width: number, depth: number, height: number): number[][][] {
    const sandArray = new Array(width);
    for (let x = 0; x < width; x++) {
        sandArray[x] = new Array(depth);
        for (let z = 0; z < depth; z++) {
            sandArray[x][z] = new Array(height).fill(0);
        }
    }
    return sandArray;
}
//populates the 3d array with sand
export function populateSandArray(sandArray: number[][][]): void {
    for (let x = Math.floor(sandArray.length * .40); x < Math.floor(sandArray.length * .90); x++) {
        for (let z = Math.floor(sandArray[0].length * .10); z < Math.floor(sandArray[0].length * .60); z++) {
            for (let y = 0; y < 60; y++) {
                sandArray[x][z][y] = 1;
            }
        }
    }
}
//creates the square instances representing sand
export function createSquareInstances(sandArray: number[][][], platformHeight: number): THREE.InstancedMesh {
    const particleCount = countParticles(sandArray);
    const initialBufferSize = Math.max(particleCount + 1000, 10000);

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // Load the textures
    const textureLoader = new THREE.TextureLoader();
    const sandColorMap = textureLoader.load('maps/ground_0043_color_1k.jpg');
    const sandNormalMap = textureLoader.load('maps/ground_0043_normal_opengl_1k.png');
    const sandRoughnessMap = textureLoader.load('maps/ground_0043_roughness_1k.jpg');
    const sandAOMap = textureLoader.load('maps/ground_0043_ao_1k.jpg');
    const sandHeightMap = textureLoader.load('maps/ground_0043_height_1k.png');

    // Define the sand material with textures
    const sandMaterial = new THREE.MeshStandardMaterial({
        map: sandColorMap,
        normalMap: sandNormalMap,
        roughnessMap: sandRoughnessMap,
        aoMap: sandAOMap,
        displacementMap: sandHeightMap,
        displacementScale: 0.05,
    });

    const mesh = new THREE.InstancedMesh(geometry, sandMaterial, initialBufferSize);
    let instanceId = 0;

    const offset = platformHeight / 2 + 0.5;

    for (let x = 0; x < sandArray.length; x++) {
        for (let z = 0; z < sandArray[x].length; z++) {
            for (let y = 0; y < sandArray[x][z].length; y++) {
                if (sandArray[x][z][y] === 1) {
                    const matrix = new THREE.Matrix4();
                    matrix.setPosition(x - sandArray.length / 2, y + offset, z - sandArray[x].length / 2);
                    mesh.setMatrixAt(instanceId, matrix);
                    instanceId++;
                }
            }
        }
    }
    mesh.instanceMatrix.needsUpdate = true;

    return mesh;
}
