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
    const G_LEFT = -4.6;                  // the podium is narrower; the slabs above cantilever on the left
    const PLINTH = 1.75;
    const SLAB = 0.3, BEAM = 0.5;
    // Top-of-slab levels: podium, then the first, second and roof slabs
    const LEVELS = [PLINTH, 5.6, 9.4, 13.2];
    const PARAPET = 1.1;
    // One column grid for every floor, so columns stack straight up
    const COL_XS = [-4.35, -1.0, 2.35, 5.7];
    const COL_ZS = [-FRONT + 0.3, -2.4, 2.4, FRONT - 0.3];

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
    box(HW - G_LEFT, PLINTH, D, freshConcrete, (G_LEFT + HW) / 2, PLINTH / 2, 0, foundation);
    box(18, 0.1, 7, freshConcrete, 0, 0.05, FRONT + 3.5, foundation);
    const stepN = 7, rise = PLINTH / stepN, tread = 0.34;
    for (let s = 0; s < stepN; s++) {
        const h = rise * (s + 1);
        box(5.35, h, tread, concrete, -1.58, h / 2, FRONT + tread / 2 + (stepN - 1 - s) * tread, foundation);
    }
    building.add(foundation);

    // ---------- Skeleton: per storey, columns rise, then beams and slab go on ----------
    // Each part is built with its origin at the storey's floor so it can grow upward.
    const xMin = COL_XS[0], xMax = COL_XS[COL_XS.length - 1];
    const levels = [];
    for (let i = 0; i < LEVELS.length; i++) {
        const base = LEVELS[i];
        const g = new THREE.Group();
        g.position.y = base;
        const cols = new THREE.Group();
        const deck = new THREE.Group();
        g.add(cols, deck);
        if (i < LEVELS.length - 1) {
            const h = LEVELS[i + 1] - base - SLAB;     // column height up to the slab soffit
            COL_XS.forEach(x => COL_ZS.forEach(z => box(0.45, h, 0.45, concrete, x, h / 2, z, cols)));
            // Beams sit under the slab, joining the column heads
            COL_ZS.forEach(z => box(xMax - xMin + 0.45, BEAM, 0.35, concrete, (xMin + xMax) / 2, h - BEAM / 2, z, deck));
            COL_XS.forEach(x => box(0.35, BEAM, D - 0.6 + 0.45, concrete, x, h - BEAM / 2, 0, deck));
            // Slab, cantilevered on the left and lipped over the front like the walnut bands
            box(2 * HW, SLAB, D + 0.6, freshConcrete, 0, h + SLAB / 2, 0.3, deck);
        } else {
            // Roof: low parapet round the edge and starter bars poking up from the columns
            const t = 0.2;
            box(2 * HW, PARAPET, t, freshConcrete, 0, PARAPET / 2, FRONT + 0.6 - t / 2, cols);
            box(2 * HW, PARAPET, t, freshConcrete, 0, PARAPET / 2, -FRONT + t / 2, cols);
            box(t, PARAPET, D + 0.6, freshConcrete, -HW + t / 2, PARAPET / 2, 0.3, cols);
            box(t, PARAPET, D + 0.6, freshConcrete, HW - t / 2, PARAPET / 2, 0.3, cols);
            COL_XS.forEach(x => [-2.4, 2.4].forEach(z => {
                [-0.12, 0.12].forEach(dx => box(0.04, 0.9, 0.04, steelBar, x + dx, 0.45, z, deck));
            }));
        }
        g.userData = { cols, deck };
        building.add(g);
        levels.push(g);
    }

    const buildingHeight = LEVELS[LEVELS.length - 1] + PARAPET;

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
    foundation.visible = false;

    // ---------- Tower crane ----------
    const crane = new THREE.Group();
    const craneH = buildingHeight + 3;
    crane.add(box(0.8, craneH, 0.8, craneMat, 0, craneH / 2, 0));
    const jibPivot = new THREE.Group();
    jibPivot.position.y = craneH;
    jibPivot.add(box(20, 0.6, 0.6, craneMat, 5.5, 0.3, 0));
    const counterweight = new THREE.MeshStandardMaterial({ color: '#8d8a85', roughness: 0.9 });
    jibPivot.add(box(2, 1.4, 1.4, counterweight, -4, -0.3, 0));
    jibPivot.add(box(1.3, 1.3, 1.3, darkMetal, 0, 0.9, 0));
    const cable = box(0.05, 1, 0.05, darkMetal, 12, -0.5, 0, jibPivot);
    cable.geometry.translate(0, -0.5, 0);   // pivot at the jib so the cable pays out downward
    cable.position.y = 0;
    const hook = box(0.7, 0.45, 0.7, darkMetal, 12, -6.2, 0, jibPivot);
    crane.add(jibPivot);
    crane.position.set(-HW - 4, 0, -FRONT - 3);
    const craneMats = [craneMat, counterweight, darkMetal];
    craneMats.forEach(m => { m.transparent = true; });
    scene.add(crane);

    // ---------- Stages shown next to the progress bar ----------
    // The build runs from B0 to B1 of the scroll: foundation first, then one window per storey
    const B0 = 0.02, FOUND_END = 0.1, B1 = 0.6;
    const N = levels.length;
    const WIN = (B1 - FOUND_END) / N;
    const STAGES = [
        { at: 0.0, label: 'Blueprint' },
        { at: B0, label: 'Foundation' },
        { at: FOUND_END, label: 'Ground floor' },
        { at: FOUND_END + WIN, label: 'First floor' },
        { at: FOUND_END + 2 * WIN, label: 'Second floor' },
        { at: FOUND_END + 3 * WIN, label: 'Roof' },
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
        camera.filmOffset = w > 768 ? -8 : 0;
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

    function renderFrame() {
        requestAnimationFrame(renderFrame);
        if (!visible) return;
        const t = clock.getElapsedTime();
        const p = reduceMotion ? 1 : scrollProgress();
        smoothP += (p - smoothP) * 0.08;
        const sp = smoothP;

        const fp = clamp01((sp - B0) / (FOUND_END - B0));
        foundation.visible = fp > 0;
        foundation.scale.y = Math.max(0.001, ease(fp));

        // Storeys go up one after another: columns grow from the slab below, then the
        // beams and slab are lowered onto the column heads
        levels.forEach((l, i) => {
            const local = clamp01((sp - FOUND_END - i * WIN) / WIN);
            const { cols, deck } = l.userData;
            const c = ease(clamp01(local / 0.6));
            const d = ease(clamp01((local - 0.55) / 0.45));
            l.visible = local > 0;
            cols.scale.y = Math.max(0.001, c);
            deck.visible = d > 0;
            deck.position.y = (1 - d) * 2.5;
        });
        blueprint.opacity = 0.7 * (1 - clamp01((sp - 0.4) / 0.3)) + 0.05;

        // Crane works while the skeleton goes up, then lowers out of view
        jibPivot.rotation.y = Math.sin(t * 0.35) * 0.6 + sp * 2.2;
        hook.position.y = -6.2 + Math.sin(t * 0.9) * 1.2;
        cable.scale.y = -hook.position.y - 0.2;
        // Once topped out the crane fades away rather than sinking through the ground
        const craneFade = 1 - clamp01((sp - B1) / 0.08);
        craneMats.forEach(m => { m.opacity = craneFade; m.depthWrite = craneFade > 0.99; });
        crane.visible = craneFade > 0;

        // Camera orbits round to the front, then settles to street eye level to match the render
        if (!dragging) {
            dragVel *= 0.92;
            dragYaw += dragVel;
        }
        const yaw = -0.75 + ease(clamp01(sp / 0.7)) * 0.78 + dragYaw + (reduceMotion ? 0 : pointerX * 0.06 + Math.sin(t * 0.15) * 0.025);
        // On desktop the camera closes in at the end so the skeleton lines up with the render
        const radius = isMobile ? 70 : 58 - Math.min(sp, 0.55) * 12 - 13 * ease(clamp01((sp - 0.55) / 0.17));
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
        stage.style.setProperty('--hero3d-photo', clamp01((sp - 0.66) / 0.1).toFixed(3));
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
