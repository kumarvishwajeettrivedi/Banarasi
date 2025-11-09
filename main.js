    // main.js
    import * as THREE from 'three';

    // Asset paths
    const assets = {
    front: '/assets/thandai-front.png',
    back: '/assets/thandai-back.png',
    background: '/assets/ghat-layer.jpg'
    };
    // Initialize Three.js
    const canvas = document.querySelector('.webgl');
    const loadingScreen = document.querySelector('.loading-screen');

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFF7E8);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 5);
    scene.add(camera);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Texture loader
    const textureLoader = new THREE.TextureLoader();

    // Create bottle
    const createBottle = () => {
        const group = new THREE.Group();
        
        // Make bottle larger
        const scale = 1.9;
        group.scale.set(scale, scale, scale);
        
        group.rotation.z = -0.1;
        
        // Front and back materials
        const frontMaterial = new THREE.MeshBasicMaterial({
        map: textureLoader.load(assets.front),
        transparent: true
        });
        
        const backMaterial = new THREE.MeshBasicMaterial({
        map: textureLoader.load(assets.back),
        transparent: true,
        side: THREE.DoubleSide
        });
        
        // Geometry
        const geometry = new THREE.PlaneGeometry(1, 1.6);
        
        const frontMesh = new THREE.Mesh(geometry, frontMaterial);
        frontMesh.position.z = 0;
        group.add(frontMesh);
        
        const backMesh = new THREE.Mesh(geometry, backMaterial);
        backMesh.position.z = -0.01;
        backMesh.rotation.y = Math.PI;
        group.add(backMesh);
        
        return { group, frontMesh, backMesh };
    };

    let hovered = false;
    let targetRotationZ = -0.1;
    let rotationSpeed = 0.05;

    // Create bottle
    const { group: bottleGroup, frontMesh, backMesh } = createBottle();
    scene.add(bottleGroup);

    // Background
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    const bgGeometry = new THREE.PlaneGeometry(10, 10);
    const bgMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load(assets.background),
    side: THREE.BackSide
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.position.z = -8;
    scene.add(background);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // View controls
    const viewButtons = document.querySelectorAll('.view-btn');
    let currentView = 'front';

    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
        viewButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentView = button.dataset.view;
        
        if (currentView === 'back') {
            // When showing ingredients:
            // 1. Straighten the bottle (set rotation.z to 0)
            // 2. Scale up the bottle slightly
            gsap.to(bottleGroup.rotation, {
            z: 0,
            duration: 1,
            ease: "power2.inOut"
            });
            gsap.to(bottleGroup.scale, {
            x: 2.2,
            y: 2.2,
            z: 2.2,
            duration: 1,
            ease: "power2.inOut"
            });
        } else {
            // When showing front view:
            // 1. Return to slight tilt (rotation.z to -0.1)
            // 2. Return to original scale
            gsap.to(bottleGroup.rotation, {
            z: -0.1,
            duration: 1.2,
            ease: "power2.inOut"
            });
            gsap.to(bottleGroup.scale, {
            x: 1.9,
            y: 1.9,
            z: 1.9,
            duration: 1,
            ease: "power2.inOut"
            });
        }
        
        // Rotate bottle to show front or back
        gsap.to(bottleGroup.rotation, {
            y: currentView === 'front' ? 0 : Math.PI,
            duration: 1,
            ease: "power2.inOut"
        });
        });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Hide loading screen when assets are loaded
    window.addEventListener('load', () => {
    gsap.to(loadingScreen, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
        loadingScreen.style.display = 'none';
        }
    });
    });

    // -------- NEW FUNCTIONALITY: random shake or straighten on hover ----------
    let action = null; // "shake", "straight", or "both"
    let shakeTime = 0;

    window.addEventListener('mousemove', () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(frontMesh);

    if (intersects.length > 0 && !hovered) {
        hovered = true;
        // Pick random action: 0 = shake, 1 = straighten, 2 = both
        const rand = Math.floor(Math.random() * 3);
        action = rand === 0 ? "shake" : rand === 1 ? "straight" : "both";
        shakeTime = Date.now();
    } else if (intersects.length === 0) {
        hovered = false;
        action = null;
    }
    });

    // Animation loop
    const animate = () => {
    requestAnimationFrame(animate);

    // Run random action when hovered
    if (hovered && action) {
        if (action === "shake" || action === "both") {
        bottleGroup.rotation.z = -0.1 + Math.sin((Date.now() - shakeTime) * 0.02) * 0.05;
        }
        if (action === "straight" || action === "both") {
        gsap.to(bottleGroup.rotation, { z: 0, duration: 0.3 });
        }
    } else if (!hovered) {
        gsap.to(bottleGroup.rotation, { z: -0.1, duration: 0.5 });
    }

    renderer.render(scene, camera);
    };
    animate();

    // Ingredient image parallax
    document.querySelectorAll(".ingredient img").forEach(img => {
    img.addEventListener("mousemove", (e) => {
        const rect = img.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const moveX = (x - rect.width / 2) / 15;
        const moveY = (y - rect.height / 2) / 15;
        img.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    img.addEventListener("mouseleave", () => {
        img.style.transform = `translate(0, 0)`;
    });
    });

// Audio Control
const audio = new Audio('/assets/mystic-dawn-in-varanasi-stocktune.mp3'); // Update path
audio.loop = true;
let isMusicPlaying = true;

const musicToggle = document.querySelector('.music-toggle');
const speakerIcon = document.querySelector('.speaker-icon');
const mutedIcon = document.querySelector('.muted-icon');
const musicTooltip = document.querySelector('.music-tooltip');

// Enable audio after user interaction
const enableAudio = () => {
  if (!isMusicPlaying) {
    audio.play()
      .then(() => {
        isMusicPlaying = true;
        speakerIcon.style.display = 'block';
        mutedIcon.style.display = 'none';
        musicTooltip.textContent = 'Pause music';
      })
      .catch(e => {
        console.log('Audio playback failed:', e);
        musicTooltip.textContent = 'Click to enable audio';
      });
  } else {
    audio.pause();
    isMusicPlaying = false;
    speakerIcon.style.display = 'none';
    mutedIcon.style.display = 'block';
    musicTooltip.textContent = 'Play music';
  }
};

// Click handler
musicToggle.addEventListener('click', enableAudio);

// Touch handler for mobile
musicToggle.addEventListener('touchend', (e) => {
  e.preventDefault();
  enableAudio();
}, { passive: false });

// Start with music off by default
speakerIcon.style.display = 'none';
mutedIcon.style.display = 'block';