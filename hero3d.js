/* ============================================
   TECHKNOW — 3D interactive hero
   A building that assembles floor by floor as the visitor scrolls,
   starting from a blueprint outline. Drag to rotate.
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

if (stage && canvas && track && webglAvailable()) {
    init();
}

function init() {
    document.body.classList.add('has-3d');

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const FLOORS = isMobile ? 7 : 10;
    const FLOOR_H = 3.2;
    const W = 14, D = 9;

    // ---------- Renderer, scene, camera ----------
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const skyTop = new THREE.Color('#0d1014');
    scene.background = skyTop;
    scene.fog = new THREE.Fog('#0d1014', 60, 140);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);

    // ---------- Lights ----------
    scene.add(new THREE.HemisphereLight('#cfe8ff', '#1a1c20', 0.55));
    const sun = new THREE.DirectionalLight('#fff3e0', 1.6);
    sun.position.set(25, 45, 20);
    sun.castShadow = !isMobile;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 45;
    sun.shadow.camera.bottom = -10;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const rim = new THREE.DirectionalLight('#00A8E8', 0.6);
    rim.position.set(-30, 20, -25);
    scene.add(rim);

    // ---------- Materials ----------
    const ACCENT = new THREE.Color('#00A8E8');
    const concrete = new THREE.MeshStandardMaterial({ color: '#d9dcdf', roughness: 0.85, metalness: 0.05 });
    const darkConcrete = new THREE.MeshStandardMaterial({ color: '#8d9297', roughness: 0.9 });
    const steel = new THREE.MeshStandardMaterial({ color: '#3a3f45', roughness: 0.4, metalness: 0.7 });
    const glass = new THREE.MeshPhysicalMaterial({
        color: '#9fd8f0', roughness: 0.08, metalness: 0.1, transmission: 0, transparent: true, opacity: 0.38,
        envMapIntensity: 1, clearcoat: 1
    });
    const windowLight = new THREE.MeshBasicMaterial({ color: '#ffcf8a', transparent: true, opacity: 0, side: THREE.DoubleSide });
    const blueprint = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.55 });
    const craneMat = new THREE.MeshStandardMaterial({ color: '#f2b705', roughness: 0.6, metalness: 0.3 });

    // ---------- Ground ----------
    const ground = new THREE.Mesh(
        new THREE.CircleGeometry(120, 64),
        new THREE.MeshStandardMaterial({ color: '#15181c', roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(120, 60, ACCENT, '#2a3038');
    grid.material.transparent = true;
    grid.material.opacity = 0.18;
    grid.position.y = 0.01;
    scene.add(grid);

    // ---------- Building ----------
    const building = new THREE.Group();
    scene.add(building);

    function box(w, h, d, mat, x, y, z) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        m.castShadow = !isMobile;
        m.receiveShadow = !isMobile;
        return m;
    }

    // Foundation / podium
    const foundation = new THREE.Group();
    foundation.add(box(W + 4, 0.8, D + 4, darkConcrete, 0, 0.4, 0));
    foundation.add(box(W + 1, 0.4, D + 1, concrete, 0, 1.0, 0));
    building.add(foundation);

    // Floors: each one is its own group so it can animate in independently
    const floors = [];
    const colsX = [-W / 2 + 0.3, -W / 6, W / 6, W / 2 - 0.3];
    const colsZ = [-D / 2 + 0.3, 0, D / 2 - 0.3];

    for (let i = 0; i < FLOORS; i++) {
        const g = new THREE.Group();
        const baseY = 1.2 + i * FLOOR_H;
        const isTop = i === FLOORS - 1;
        // Slight setback on the upper floors for a stepped silhouette
        const setback = i >= FLOORS - 3 ? 1.2 : 0;
        const fw = W - setback * 2, fd = D - setback;

        // Columns
        const structure = new THREE.Group();
        colsX.forEach(x => colsZ.forEach(z => {
            if (Math.abs(x) > fw / 2 || Math.abs(z) > fd / 2 + 0.01) return;
            structure.add(box(0.45, FLOOR_H - 0.3, 0.45, concrete, x, baseY + (FLOOR_H - 0.3) / 2, z));
        }));
        // Slab
        structure.add(box(fw + 0.6, 0.3, fd + 0.6, concrete, 0, baseY + FLOOR_H - 0.15, 0));
        // Balconies on alternate floors
        if (i % 2 === 1 && !isTop) {
            structure.add(box(fw * 0.55, 0.22, 1.6, concrete, fw * 0.15, baseY + FLOOR_H - 0.15, fd / 2 + 1.1));
            structure.add(box(fw * 0.55, 0.9, 0.06, glass, fw * 0.15, baseY + FLOOR_H + 0.3, fd / 2 + 1.85));
        }
        g.add(structure);

        // Facade: glass curtain wall with mullions
        const facade = new THREE.Group();
        const gh = FLOOR_H - 0.3;
        const gy = baseY + gh / 2;
        facade.add(box(fw - 0.2, gh, 0.08, glass, 0, gy, fd / 2 - 0.1));
        facade.add(box(fw - 0.2, gh, 0.08, glass, 0, gy, -fd / 2 + 0.1));
        facade.add(box(0.08, gh, fd - 0.2, glass, fw / 2 - 0.1, gy, 0));
        facade.add(box(0.08, gh, fd - 0.2, glass, -fw / 2 + 0.1, gy, 0));
        for (let m = -fw / 2 + 1.4; m < fw / 2; m += 1.4) {
            facade.add(box(0.07, gh, 0.12, steel, m, gy, fd / 2 - 0.05));
            facade.add(box(0.07, gh, 0.12, steel, m, gy, -fd / 2 + 0.05));
        }
        // Warm interior lights, a few windows per side
        for (let k = 0; k < 4; k++) {
            if ((i * 7 + k * 3) % 5 < 2) continue;
            const lx = -fw / 2 + 1.4 * (2 + k * 2) + 0.7;
            if (lx > fw / 2 - 0.7) continue;
            const l = new THREE.Mesh(new THREE.PlaneGeometry(1.25, gh * 0.75), windowLight);
            l.position.set(lx, gy, fd / 2 - 0.25);
            facade.add(l);
            const l2 = l.clone();
            l2.position.set(fw / 2 - 0.25, gy, lx * (fd / fw));
            l2.rotation.y = Math.PI / 2;
            facade.add(l2);
        }
        facade.visible = false;
        g.add(facade);

        // Rooftop details
        if (isTop) {
            structure.add(box(3.5, 1.6, 2.6, darkConcrete, -fw / 4, baseY + FLOOR_H + 0.8, -fd / 6));
            structure.add(box(fw + 0.6, 1.0, 0.1, glass, 0, baseY + FLOOR_H + 0.5, fd / 2 + 0.25));
            const panelGroup = new THREE.Group();
            for (let p = 0; p < 3; p++) {
                const panel = box(1.6, 0.06, 2.4, steel, fw / 6 + p * 1.9, baseY + FLOOR_H + 0.5, -fd / 6);
                panel.rotation.x = -0.35;
                panelGroup.add(panel);
            }
            structure.add(panelGroup);
        }

        g.userData = { structure, facade, baseY };
        floors.push(g);
        building.add(g);
    }

    const buildingHeight = 1.2 + FLOORS * FLOOR_H;

    // Blueprint outline of the finished building, shown before it is built
    const outline = new THREE.Group();
    building.updateMatrixWorld(true);
    building.traverse(o => {
        if (!o.isMesh || o.material === glass || o.material === windowLight) return;
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry), blueprint);
        e.applyMatrix4(o.matrixWorld);
        outline.add(e);
    });
    scene.add(outline);

    // Floors start hidden; foundation is the first stage
    floors.forEach(f => { f.visible = false; });

    // ---------- Tower crane ----------
    const crane = new THREE.Group();
    const craneH = buildingHeight + 3;
    const mast = box(0.9, craneH, 0.9, craneMat, 0, craneH / 2, 0);
    crane.add(mast);
    const jibPivot = new THREE.Group();
    jibPivot.position.y = craneH;
    jibPivot.add(box(22, 0.7, 0.7, craneMat, 6, 0.35, 0));
    jibPivot.add(box(2.2, 1.6, 1.6, darkConcrete, -4.2, -0.4, 0));
    jibPivot.add(box(1.4, 1.4, 1.4, steel, 0, 1.0, 0));
    const cable = box(0.05, 6, 0.05, steel, 13, -3, 0);
    jibPivot.add(cable);
    const hook = box(0.8, 0.5, 0.8, steel, 13, -6.2, 0);
    jibPivot.add(hook);
    crane.add(jibPivot);
    crane.position.set(-W / 2 - 4, 0, -D / 2 - 5);
    scene.add(crane);

    // ---------- Stages shown next to the progress bar ----------
    const STAGES = [
        { at: 0.0, label: 'Blueprint' },
        { at: 0.08, label: 'Foundation' },
        { at: 0.2, label: 'Structure' },
        { at: 0.6, label: 'Facade' },
        { at: 0.9, label: 'Handover' }
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
    let smoothP = reduceMotion ? 1 : 0;
    let visible = true;
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(stage);

    const clock = new THREE.Clock();
    const target = new THREE.Vector3();

    function frame() {
        requestAnimationFrame(frame);
        if (!visible) return;
        const t = clock.getElapsedTime();
        const p = reduceMotion ? 1 : scrollProgress();
        smoothP += (p - smoothP) * 0.08;
        const sp = smoothP;

        // Foundation
        const fp = THREE.MathUtils.clamp(sp / 0.08, 0, 1);
        foundation.scale.y = Math.max(0.001, ease(fp));

        // Floors rise one after another between 8% and 60% of the scroll
        const structStart = 0.08, structEnd = 0.6;
        floors.forEach((f, i) => {
            const s = structStart + (i / FLOORS) * (structEnd - structStart);
            const local = THREE.MathUtils.clamp((sp - s) / ((structEnd - structStart) / FLOORS * 1.6), 0, 1);
            f.visible = local > 0;
            f.userData.structure.position.y = (1 - ease(local)) * 6;
            const sc = 0.85 + 0.15 * ease(local);
            f.userData.structure.scale.set(sc, 1, sc);
            // Glass goes on from 55% to 90%
            const gs = 0.55 + (i / FLOORS) * 0.3;
            const gl = THREE.MathUtils.clamp((sp - gs) / 0.08, 0, 1);
            f.userData.facade.visible = gl > 0;
            f.userData.facade.scale.set(1, Math.max(0.001, ease(gl)), 1);
            f.userData.facade.position.y = (1 - ease(gl)) * f.userData.baseY;
        });

        glass.opacity = 0.38;
        windowLight.opacity = THREE.MathUtils.clamp((sp - 0.85) / 0.12, 0, 1) * 0.9;
        blueprint.opacity = 0.55 * (1 - THREE.MathUtils.clamp((sp - 0.5) / 0.4, 0, 1)) + 0.04;

        // Crane works while the structure goes up, then swings away
        jibPivot.rotation.y = Math.sin(t * 0.35) * 0.6 + sp * 2.2;
        hook.position.y = -6.2 + Math.sin(t * 0.9) * 1.2;
        cable.scale.y = 1 + Math.sin(t * 0.9) * -0.2;
        crane.position.y = -Math.max(0, (sp - 0.9) / 0.1) * (craneH + 2);

        // Camera orbits and rises with scroll; drag and pointer add to it
        if (!dragging) {
            dragVel *= 0.92;
            dragYaw += dragVel;
        }
        const yaw = -0.6 + sp * 1.5 + dragYaw + (reduceMotion ? 0 : pointerX * 0.08) + (reduceMotion ? 0 : Math.sin(t * 0.15) * 0.04);
        const radius = isMobile ? 92 : 78 - sp * 8;
        const height = 12 + sp * 22 - pointerY * 2;
        camera.position.set(Math.sin(yaw) * radius, height, Math.cos(yaw) * radius);
        target.set(0, isMobile ? buildingHeight * 0.78 : buildingHeight * 0.5, 0);
        camera.lookAt(target);

        // Stage label
        let current = STAGES[0];
        STAGES.forEach(s => { if (sp >= s.at) current = s; });
        if (stageLabel && stageLabel.textContent !== current.label) stageLabel.textContent = current.label;
        document.body.classList.toggle('in-hero3d', track.getBoundingClientRect().bottom > 90);
        if (stageBar) stageBar.style.transform = 'scaleX(' + sp.toFixed(3) + ')';
        // Headline fades while the building goes up and returns at handover
        const fade = THREE.MathUtils.clamp((sp - 0.05) / 0.25, 0, 1) * (1 - THREE.MathUtils.clamp((sp - 0.88) / 0.1, 0, 1));
        document.body.style.setProperty('--hero3d-fade', (fade * 0.8).toFixed(3));

        renderer.render(scene, camera);
    }
    frame();
}
