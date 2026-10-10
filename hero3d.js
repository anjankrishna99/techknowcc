/* ============================================
   TECHKNOW — 3D interactive hero
   As the visitor scrolls, the concrete skeleton of the Elevation 001
   building rises from its blueprint outline, then dissolves into the
   finished render. Drag to rotate.
   ============================================ */
import * as THREE from 'three';

const stage = document.getElementById('hero3d-stage');
const canvas = document.getElementById('hero3d-canvas');
const track = document.getElementById('hero3d-track');
const stageLabel = document.getElementById('hero3d-stage-label');
const stageBar = document.getElementById('hero3d-stage-bar');

function webglAvailable() {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) {
        return false;
    }
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Palette shared with the site (see :root in index.css)
const GOLD = '#E3B26B';
const DUSK_TOP = '#151a2e';

function skyTexture() {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 512;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, DUSK_TOP);
    grad.addColorStop(0.45, '#3c4570');
    grad.addColorStop(0.72, '#7f7fa3');
    grad.addColorStop(0.86, '#c9a690');
    grad.addColorStop(1, '#1c1e2a');
    g.fillStyle = grad;
    g.fillRect(0, 0, 16, 512);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function init() {
    document.body.classList.add('has-3d');

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Dimensions in metres, scaled off the elevation render. Front faces +z.
    const HW = 6, D = 14, FRONT = 7;
    const G_LEFT = -4.6, G_RIGHT = 5.6;   // ground floor is narrower; upper floors cantilever on the left
    const PLINTH = 1.75;
    const FLOORS = [
        { base: PLINTH, top: 5.45, x0: G_LEFT, x1: G_RIGHT },
        { base: 5.95, top: 9.25, x0: -HW, x1: HW },
        { base: 9.6, top: 12.85, x0: -HW, x1: HW },
        { base: 13.35, top: 15.3, x0: -HW, x1: HW, parapet: true }
    ];

    // ---------- Renderer, scene, camera ----------
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = skyTexture();
    scene.fog = new THREE.Fog('#3a3d55', 80, 170);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);

    scene.add(new THREE.HemisphereLight('#b3bde3', '#2a2622', 1.2));
    const sun = new THREE.DirectionalLight('#ffd2a8', 1.3);
    sun.position.set(20, 28, 30);
    sun.castShadow = !isMobile;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -8 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    const rim = new THREE.DirectionalLight('#8aa2ff', 0.5);
    rim.position.set(-25, 15, -20);
    scene.add(rim);

    // ---------- Materials ----------
    const concrete = new THREE.MeshStandardMaterial({ color: '#b9b6b0', roughness: 0.9 });
    const freshConcrete = new THREE.MeshStandardMaterial({ color: '#9c9a96', roughness: 0.95 });
    const steelBar = new THREE.MeshStandardMaterial({ color: '#6b4a36', roughness: 0.6, metalness: 0.5 });
    const ground = new THREE.MeshStandardMaterial({ color: '#23252d', roughness: 1 });
    const craneMat = new THREE.MeshStandardMaterial({ color: '#e8a93a', roughness: 0.6, metalness: 0.3 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: '#2a2a2c', roughness: 0.4, metalness: 0.8 });
    const blueprint = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.7 });

    function box(w, h, d, m, x, y, z, parent) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
        mesh.position.set(x, y, z);
        mesh.castShadow = !isMobile;
        mesh.receiveShadow = !isMobile;
        if (parent) parent.add(mesh);
        return mesh;
    }

    // ---------- Site ----------
    const groundMesh = new THREE.Mesh(new THREE.CircleGeometry(150, 64), ground);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
    const grid = new THREE.GridHelper(150, 75, GOLD, '#3c4058');
    grid.material.transparent = true;
    grid.material.opacity = 0.12;
    grid.position.y = 0.01;
    scene.add(grid);

    const building = new THREE.Group();
    scene.add(building);

    // ---------- Foundation: podium, forecourt slab, steps ----------
    const foundation = new THREE.Group();
    box(G_RIGHT - G_LEFT, PLINTH, D, freshConcrete, (G_LEFT + G_RIGHT) / 2, PLINTH / 2, 0, foundation);
    box(18, 0.1, 7, freshConcrete, 0, 0.05, FRONT + 3.8, foundation);
    const stepN = 7, rise = PLINTH / stepN, tread = 0.34;
    for (let s = 0; s < stepN; s++) {
        const h = rise * (s + 1);
        box(5.35, h, tread, concrete, -1.58, h / 2, FRONT + 1.4 + (stepN - 1 - s) * tread, foundation);
    }
    building.add(foundation);

    // ---------- Skeleton: one group per floor with columns, beams and slab ----------
    const levels = [];
    FLOORS.forEach(f => {
        const g = new THREE.Group();
        const h = f.top - f.base;
        const colXs = [];
        const bays = Math.round((f.x1 - f.x0) / 3.2);
        for (let i = 0; i <= bays; i++) colXs.push(f.x0 + 0.25 + i * ((f.x1 - f.x0 - 0.5) / bays));
        const colZs = [-FRONT + 0.25, -2.4, 2.4, FRONT - 0.25];
        if (!f.parapet) {
            colXs.forEach(x => colZs.forEach(z => box(0.45, h, 0.45, concrete, x, f.base + h / 2, z, g)));
            // Perimeter and internal beams under the next slab
            colZs.forEach(z => box(f.x1 - f.x0, 0.5, 0.35, concrete, (f.x0 + f.x1) / 2, f.top - 0.25, z, g));
            colXs.forEach(x => box(0.35, 0.5, D - 0.5, concrete, x, f.top - 0.25, 0, g));
            // Floor slab above, overhanging the front like the walnut bands do
            box(f.x1 - f.x0 + 0.8, 0.3, D + 0.6, freshConcrete, (f.x0 + f.x1) / 2 - 0.1, f.top + 0.15, 0.3, g);
        } else {
            // Roof: parapet upstands and starter bars poking up from the columns
            box(f.x1 - f.x0, h, 0.25, freshConcrete, 0, f.base + h / 2, FRONT - 0.15, g);
            box(f.x1 - f.x0, h, 0.25, freshConcrete, 0, f.base + h / 2, -FRONT + 0.15, g);
            box(0.25, h, D, freshConcrete, f.x0 + 0.12, f.base + h / 2, 0, g);
            box(0.25, h, D, freshConcrete, f.x1 - 0.12, f.base + h / 2, 0, g);
            colXs.forEach(x => [-2.4, 2.4].forEach(z => {
                [-0.12, 0.12].forEach(dx => box(0.04, 1.4, 0.04, steelBar, x + dx, f.base + 0.7, z, g));
            }));
        }
        g.userData = { base: f.base };
        building.add(g);
        levels.push(g);
    });

    const buildingHeight = FLOORS[FLOORS.length - 1].top + 0.5;

    // Blueprint outline of the finished skeleton, visible before it is built
    const outline = new THREE.Group();
    building.updateMatrixWorld(true);
    building.traverse(o => {
        if (!o.isMesh || o.material === steelBar) return;
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry), blueprint);
        e.applyMatrix4(o.matrixWorld);
        outline.add(e);
    });
    scene.add(outline);
    levels.forEach(l => { l.visible = false; });

    // ---------- Tower crane ----------
    const crane = new THREE.Group();
    const craneH = buildingHeight + 3;
    crane.add(box(0.8, craneH, 0.8, craneMat, 0, craneH / 2, 0));
    const jibPivot = new THREE.Group();
    jibPivot.position.y = craneH;
    jibPivot.add(box(20, 0.6, 0.6, craneMat, 5.5, 0.3, 0));
    jibPivot.add(box(2, 1.4, 1.4, concrete, -4, -0.3, 0));
    jibPivot.add(box(1.3, 1.3, 1.3, darkMetal, 0, 0.9, 0));
    const cable = box(0.05, 6, 0.05, darkMetal, 12, -3, 0, jibPivot);
    const hook = box(0.7, 0.45, 0.7, darkMetal, 12, -6.2, 0, jibPivot);
    crane.add(jibPivot);
    crane.position.set(-HW - 4, 0, -FRONT - 3);
    scene.add(crane);

    // ---------- Stages shown next to the progress bar ----------
    const STAGES = [
        { at: 0.0, label: 'Blueprint' },
        { at: 0.06, label: 'Foundation' },
        { at: 0.18, label: 'Structure' },
        { at: 0.72, label: 'Handed over' }
    ];

    // ---------- Interaction: drag to rotate, pointer parallax ----------
    let dragYaw = 0, dragVel = 0, dragging = false, lastX = 0;
    let pointerX = 0, pointerY = 0;

    canvas.addEventListener('pointerdown', e => {
        dragging = true;
        lastX = e.clientX;
        canvas.setPointerCapture(e.pointerId);
        stage.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        dragVel = dx * 0.006;
        dragYaw += dragVel;
    });
    const endDrag = () => { dragging = false; stage.classList.remove('is-dragging'); };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    window.addEventListener('pointermove', e => {
        pointerX = (e.clientX / window.innerWidth) * 2 - 1;
        pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    // ---------- Scroll progress ----------
    function scrollProgress() {
        const rect = track.getBoundingClientRect();
        const total = track.offsetHeight - window.innerHeight;
        if (total <= 0) return 1;
        return THREE.MathUtils.clamp(-rect.top / total, 0, 1);
    }

    // ---------- Resize ----------
    function resize() {
        const w = stage.clientWidth, h = stage.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // Push the building to the right of the headline on wide screens
        camera.filmOffset = w > 900 ? -8 : 0;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    // ---------- Animate ----------
    const ease = t => 1 - Math.pow(1 - t, 3);
    const clamp01 = v => THREE.MathUtils.clamp(v, 0, 1);
    let smoothP = reduceMotion ? 1 : 0;
    let visible = true;
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(stage);

    const clock = new THREE.Clock();
    const target = new THREE.Vector3();
    const N = levels.length;

    function renderFrame() {
        requestAnimationFrame(renderFrame);
        if (!visible) return;
        const t = clock.getElapsedTime();
        const p = reduceMotion ? 1 : scrollProgress();
        smoothP += (p - smoothP) * 0.08;
        const sp = smoothP;

        foundation.scale.y = Math.max(0.001, ease(clamp01(sp / 0.08)));

        // Each floor's columns, beams and slab rise between 8% and 60% of the scroll
        levels.forEach((l, i) => {
            const s = 0.08 + (i / N) * 0.52;
            const local = clamp01((sp - s) / (0.52 / N * 1.3));
            l.visible = local > 0;
            l.scale.set(1, Math.max(0.001, ease(local)), 1);
            l.position.y = (1 - ease(local)) * l.userData.base;
        });
        blueprint.opacity = 0.7 * (1 - clamp01((sp - 0.4) / 0.3)) + 0.05;

        // Crane works while the skeleton goes up, then lowers out of view
        jibPivot.rotation.y = Math.sin(t * 0.35) * 0.6 + sp * 2.2;
        hook.position.y = -6.2 + Math.sin(t * 0.9) * 1.2;
        cable.scale.y = 1 - Math.sin(t * 0.9) * 0.2;
        crane.position.y = -clamp01((sp - 0.6) / 0.1) * (craneH + 2);

        // Camera orbits round to the front, then settles to street eye level to match the render
        if (!dragging) {
            dragVel *= 0.92;
            dragYaw += dragVel;
        }
        const yaw = -0.75 + ease(clamp01(sp / 0.7)) * 0.78 + dragYaw + (reduceMotion ? 0 : pointerX * 0.06 + Math.sin(t * 0.15) * 0.025);
        const radius = isMobile ? 70 : 58 - sp * 12;
        const height = 4 + 6 * clamp01(sp / 0.55) - 7.5 * clamp01((sp - 0.55) / 0.2) - pointerY * 1.5;
        camera.position.set(Math.sin(yaw) * radius, height, Math.cos(yaw) * radius + FRONT * 0.3);
        target.set(0, isMobile ? buildingHeight * 0.95 : buildingHeight * (0.47 + sp * 0.08), 0);
        camera.lookAt(target);

        let current = STAGES[0];
        STAGES.forEach(s => { if (sp >= s.at) current = s; });
        if (stageLabel && stageLabel.textContent !== current.label) stageLabel.textContent = current.label;
        document.body.classList.toggle('in-hero3d', track.getBoundingClientRect().bottom > 90);
        if (stageBar) stageBar.style.transform = 'scaleX(' + sp.toFixed(3) + ')';
        // The finished render fades in over the skeleton
        stage.style.setProperty('--hero3d-photo', clamp01((sp - 0.66) / 0.14).toFixed(3));
        // Headline fades while the skeleton goes up and returns with the render.
        // On phones the text sits over the building, so it stays faded.
        const fade = clamp01((sp - 0.05) / 0.25) * (isMobile ? 1 : 1 - clamp01((sp - 0.7) / 0.1));
        document.body.style.setProperty('--hero3d-fade', (fade * (isMobile ? 0.95 : 0.8)).toFixed(3));

        renderer.render(scene, camera);
    }
    renderFrame();
}

if (stage && canvas && track && webglAvailable()) {
    init();
}
