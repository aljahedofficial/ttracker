import gsap from 'gsap';
import * as THREE from 'three';

export class ThesisScene {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.particles = null;
        this.chapterNodes = [];
        this.mouse = new THREE.Vector2();

        this.init();
    }

    init() {
        this.camera.position.z = 45;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.createParticles();
        this.createNodes();
        this.addLights();
        this.addEventListeners();
        this.animate();
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        const sizes = [];

        for (let i = 0; i < 2000; i++) {
            vertices.push(
                (Math.random() - 0.5) * 150,
                (Math.random() - 0.5) * 150,
                (Math.random() - 0.5) * 150
            );

            const color = new THREE.Color();
            // Indigo and purple hues
            color.setHSL(0.6 + Math.random() * 0.1, 0.8, 0.6);
            colors.push(color.r, color.g, color.b);
            sizes.push(Math.random() * 2);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createNodes() {
        for (let i = 1; i <= 7; i++) {
            const group = new THREE.Group();

            // Outer wireframe
            const nodeGeometry = new THREE.IcosahedronGeometry(3, 1);
            const nodeMaterial = new THREE.MeshPhongMaterial({
                color: 0x6366f1,
                transparent: true,
                opacity: 0.2,
                wireframe: true,
                emissive: 0x6366f1,
                emissiveIntensity: 0.5
            });
            const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            group.add(mesh);

            // Inner core
            const coreGeometry = new THREE.SphereGeometry(1.2, 16, 16);
            const coreMaterial = new THREE.MeshBasicMaterial({
                color: 0x6366f1,
                transparent: true,
                opacity: 0.8
            });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            group.add(core);

            // Glow effect
            const spriteMaterial = new THREE.SpriteMaterial({
                map: this.generateGlowTexture(),
                color: 0x6366f1,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(10, 10, 1);
            group.add(sprite);

            const angle = (i - 1) / 6 * Math.PI * 2;
            group.position.x = Math.cos(angle) * 30;
            group.position.y = Math.sin(angle) * 18;
            group.position.z = -10;

            this.chapterNodes.push({ group, mesh, core, sprite, chapter: i, basePos: group.position.clone() });
            this.scene.add(group);
        }
    }

    generateGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(99,102,241,0.3)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const mainLight = new THREE.PointLight(0x6366f1, 2, 100);
        mainLight.position.set(20, 20, 20);
        this.scene.add(mainLight);

        const accentLight = new THREE.PointLight(0xa855f7, 2, 80);
        accentLight.position.set(-20, -10, 10);
        this.scene.add(accentLight);
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            gsap.to(this.camera.position, {
                x: this.mouse.x * 12,
                y: this.mouse.y * 8,
                duration: 2,
                ease: 'power2.out'
            });
        });
    }

    updateNodeProgress(chapter, progress) {
        const node = this.chapterNodes.find(n => n.chapter === chapter);
        if (node) {
            const hue = progress === 100 ? 0.35 : (0.65 + progress * 0.002);
            node.core.material.color.setHSL(hue, 0.8, 0.5);
            node.mesh.material.emissive.setHSL(hue, 0.5, 0.3);
            node.sprite.material.color.setHSL(hue, 0.8, 0.5);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.particles) {
            this.particles.rotation.x += 0.0002;
            this.particles.rotation.y += 0.0003;
        }

        this.chapterNodes.forEach((node, i) => {
            node.group.rotation.y += 0.01;
            node.group.rotation.z += 0.005;

            // Smooth float
            const time = Date.now() * 0.001;
            node.group.position.y = node.basePos.y + Math.sin(time + i) * 1.5;
            node.group.position.z = node.basePos.z + Math.cos(time * 0.5 + i) * 2;
        });

        this.renderer.render(this.scene, this.camera);
    }
}
