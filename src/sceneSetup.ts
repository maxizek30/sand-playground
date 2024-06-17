import * as THREE from 'three';

export function initializeScene(canvas: HTMLCanvasElement, width: number, height: number): [THREE.WebGLRenderer, THREE.Scene, THREE.PerspectiveCamera, THREE.Mesh] {
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, canvas.width / canvas.height, 0.5, 2000);
    camera.position.z = 135;
    camera.position.y = 60;

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const colorTexture = textureLoader.load('maps/marble_0008_color_4k.jpg');
    const aoTexture = textureLoader.load('maps/marble_0008_ao_4k.jpg');
    const heightTexture = textureLoader.load('maps/marble_0008_height_4k.png');
    const normalTexture = textureLoader.load('maps/marble_0008_normal_opengl_4k.png');
    const roughnessTexture = textureLoader.load('maps/marble_0008_roughness_4k.jpg');

    // Create platform
    const platformGeometry = new THREE.BoxGeometry(width, height, 5);
    const platformMaterial = new THREE.MeshStandardMaterial({
        map: colorTexture,
        aoMap: aoTexture,
        displacementMap: heightTexture,
        displacementScale: 0.1,
        normalMap: normalTexture,
        roughnessMap: roughnessTexture,
        roughness: 1,
        metalness: 0,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.rotation.x = -Math.PI / 2;
    platform.receiveShadow = true;
    scene.add(platform);

    // Setup ambient lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Reduced intensity
    scene.add(ambientLight);

    //setup directional lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(50, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    scene.add(directionalLight);

    // Create sun sphere
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.position.copy(directionalLight.position);
    scene.add(sunMesh);

    // Create starfield
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
    const starVertices = [];

    //creates star Locations
    for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    return [renderer, scene, camera, platform];
}

//updates platform dimensions
export function updatePlatformDimensions(platform: THREE.Mesh, width: number, depth: number): void {
    platform.geometry.dispose();
    platform.geometry = new THREE.BoxGeometry(width, depth, 5);
}
