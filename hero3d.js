/* ============================================
   TECHKNOW — 3D interactive hero
   The Elevation 001 commercial building, modelled from its SketchUp
   render, assembles level by level as the visitor scrolls, starting
   from a blueprint outline and ending with its dusk lighting on.
   Drag to rotate.
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

// ---------- Canvas textures ----------
function canvasTexture(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
}

// Large-format stone cladding: a grid of slightly varied panels with dark joints
function stoneTexture(cols, rows, base) {
    return canvasTexture(512, 512, (g, w, h) => {
        g.fillStyle = base;
        g.fillRect(0, 0, w, h);
        const cw = w / cols, rh = h / rows;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const v = (Math.sin(r * 12.9 + c * 78.2) * 43758.5) % 1;
                g.fillStyle = 'rgba(' + (v > 0 ? '255,255,255' : '0,0,0') + ',' + (Math.abs(v) * 0.06).toFixed(3) + ')';
                g.fillRect(c * cw, r * rh, cw, rh);
            }
        }
        g.strokeStyle = 'rgba(60, 45, 30, 0.55)';
        g.lineWidth = 3;
        for (let c = 0; c <= cols; c++) { g.beginPath(); g.moveTo(c * cw, 0); g.lineTo(c * cw, h); g.stroke(); }
        for (let r = 0; r <= rows; r++) { g.beginPath(); g.moveTo(0, r * rh); g.lineTo(w, r * rh); g.stroke(); }
    });
}

function marbleTexture(base, vein) {
    return canvasTexture(512, 512, (g, w, h) => {
        g.fillStyle = base;
        g.fillRect(0, 0, w, h);
        g.strokeStyle = vein;
        for (let i = 0; i < 26; i++) {
            g.globalAlpha = 0.15 + (i % 5) * 0.08;
            g.lineWidth = 1 + (i % 3);
            g.beginPath();
            let x = (i * 97) % w, y = 0;
            g.moveTo(x, y);
            while (y < h) {
                x += Math.sin(y * 0.03 + i) * 14 + 6;
                y += 22;
                g.lineTo(x % w, y);
            }
            g.stroke();
        }
        g.globalAlpha = 1;
    });
}

function tileTexture() {
    const t = canvasTexture(256, 256, (g, w, h) => {
        g.fillStyle = '#d9d6cf';
        g.fillRect(0, 0, w, h);
        g.fillStyle = '#4a4a4c';
        const s = w / 4;
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
            g.save();
            g.translate(c * s + s / 2, r * s + s / 2);
            g.rotate(Math.PI / 4);
            g.fillRect(-s * 0.22, -s * 0.22, s * 0.44, s * 0.44);
            g.restore();
        }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 3);
    return t;
}

function skyTexture() {
    return canvasTexture(16, 512, (g, w, h) => {
        const grad = g.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1d2236');
        grad.addColorStop(0.45, '#4a5276');
        grad.addColorStop(0.72, '#8f8aa6');
        grad.addColorStop(0.86, '#c7a99c');
        grad.addColorStop(1, '#2a2c33');
        g.fillStyle = grad;
        g.fillRect(0, 0, w, h);
    });
}

function init() {
    document.body.classList.add('has-3d');

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Building footprint (metres). Front faces +z, the road side.
    const W = 12, D = 14;
    const HW = W / 2, FRONT = D / 2;
    const SPLIT = 2.6; // x where the glazed bays end and the solid right-hand bay begins

    // ---------- Renderer, scene, camera ----------
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = skyTexture();
    scene.fog = new THREE.Fog('#3a3d50', 70, 160);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 400);

    // ---------- Lights: dusk ----------
    const hemi = new THREE.HemisphereLight('#b9c3e6', '#2a2522', 0.9);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight('#ffd7b0', 1.1);
    sun.position.set(18, 30, 28);
    sun.castShadow = !isMobile;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -10 });
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const rim = new THREE.DirectionalLight('#7f9cff', 0.5);
    rim.position.set(-25, 15, -20);
    scene.add(rim);
    // Warm light spilling out of the shop once the lights are on
    const shopLight = new THREE.PointLight('#ffcf94', 0, 28, 1.6);
    shopLight.position.set(-1.5, 3.5, FRONT + 3);
    scene.add(shopLight);

    // ---------- Materials ----------
    const ACCENT = new THREE.Color('#00A8E8');
    const mat = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8, metalness: 0.02 }, o));
    const stoneFlat = mat({ color: '#d6c2a6' });
    const stoneSide = mat({ map: stoneTexture(4, 6, '#d6c2a6') });
    const stoneRightBay = mat({ map: stoneTexture(2, 4, '#d9c6ab') });
    const stoneParapet = mat({ map: stoneTexture(8, 2, '#d3bea1') });
    const cornice = mat({ color: '#f1ece3', roughness: 0.6 });
    const walnut = mat({ color: '#4b3020', roughness: 0.55 });
    const finWood = mat({ color: '#7a4f2e', roughness: 0.5 });
    const blackMarble = mat({ map: marbleTexture('#141416', '#d8d8d8'), roughness: 0.25, metalness: 0.1 });
    const whiteMarble = mat({ map: marbleTexture('#ecebe8', '#9a9a9a'), roughness: 0.3 });
    const concrete = mat({ color: '#8f9399', roughness: 0.9 });
    const plinth = mat({ color: '#b9b2a6', roughness: 0.85 });
    const steps = mat({ color: '#c9c2b6', roughness: 0.7 });
    const asphalt = mat({ color: '#26282d', roughness: 1 });
    const tiles = mat({ map: tileTexture(), roughness: 0.7 });
    const frameMat = mat({ color: '#2b2b2d', roughness: 0.4, metalness: 0.6 });
    const leaf = mat({ color: '#2f5a2c', roughness: 0.9 });
    const trunk = mat({ color: '#4a3526', roughness: 0.9 });
    const glass = new THREE.MeshPhysicalMaterial({ color: '#cfe3ea', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.32, clearcoat: 1 });
    // Glows fade in at handover
    const interior = new THREE.MeshBasicMaterial({ color: '#fbe9cf', transparent: true, opacity: 0 });
    const led = new THREE.MeshBasicMaterial({ color: '#ffc574', transparent: true, opacity: 0, side: THREE.DoubleSide });
    const blueprint = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.6 });
    const craneMat = mat({ color: '#f2b705', roughness: 0.6, metalness: 0.3 });
    const glowMats = [interior, led];

    function box(w, h, d, m, x, y, z, parent) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
        mesh.position.set(x, y, z);
        mesh.castShadow = !isMobile && !glowMats.includes(m) && m !== glass;
        mesh.receiveShadow = !isMobile;
        if (parent) parent.add(mesh);
        return mesh;
    }
    function plane(w, h, m, x, y, z, parent, rotY) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
        mesh.position.set(x, y, z);
        if (rotY) mesh.rotation.y = rotY;
        if (parent) parent.add(mesh);
        return mesh;
    }

    // ---------- Site: road, forecourt, ramps ----------
    const ground = new THREE.Mesh(new THREE.CircleGeometry(140, 64), asphalt);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(140, 70, ACCENT, '#3a4150');
    grid.material.transparent = true;
    grid.material.opacity = 0.12;
    grid.position.y = 0.01;
    scene.add(grid);

    // Road markings
    for (let x = -40; x < 40; x += 6) box(3, 0.02, 0.18, cornice, x, 0.02, FRONT + 11.5, scene);

    const building = new THREE.Group();
    scene.add(building);

    // ---------- Stage 1: foundation (plinth, forecourt, steps, planter) ----------
    const foundation = new THREE.Group();
    box(W + 0.4, 1.4, D, plinth, 0, 0.7, 0, foundation);
    box(W + 6, 0.08, 7, tiles, 0, 0.04, FRONT + 3.5, foundation);
    // Steps up to the shop, between the parking bays and the planter
    const stepCount = 7;
    for (let s = 0; s < stepCount; s++) {
        const h = (1.4 / stepCount) * (s + 1);
        box(6.2, h, 0.38, steps, -1.6, h / 2, FRONT + 2.6 - s * 0.38, foundation);
    }
    // Planter with shrubs and bollards
    box(4.2, 0.7, 1.2, plinth, 3.8, 0.35, FRONT + 2.4, foundation);
    for (let i = 0; i < 6; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), leaf);
        b.position.set(2.1 + i * 0.68, 0.95, FRONT + 2.4 + (i % 2 ? 0.15 : -0.15));
        b.scale.y = 0.75;
        foundation.add(b);
    }
    [-6.5, 1.3, 6.4].forEach(x => {
        box(0.16, 0.9, 0.16, frameMat, x, 0.45, FRONT + 5.8, foundation);
        box(0.12, 0.12, 0.12, led, x, 0.85, FRONT + 5.8, foundation);
    });
    // Side retaining walls along the ramps
    box(0.4, 1.6, D + 4, plinth, -HW - 3, 0.8, 1, foundation);
    box(0.4, 1.6, D + 4, plinth, HW + 3, 0.8, 1, foundation);
    building.add(foundation);

    // ---------- Levels ----------
    // Each level has a structure group (slab, walls) and a facade group (glass, cladding, fins, lights)
    const levels = [];
    function level(baseY, h) {
        const g = new THREE.Group();
        const structure = new THREE.Group();
        const facade = new THREE.Group();
        g.add(structure, facade);
        g.userData = { structure, facade, baseY, h };
        building.add(g);
        levels.push(g);
        return g.userData;
    }

    // Side and back walls plus the floor slab, shared by every level
    function shell(L, opts) {
        const { structure } = L;
        const y = L.baseY + L.h / 2;
        box(0.3, L.h, D - 0.6, stoneSide, -HW + 0.15, y, -0.3, structure);
        box(0.3, L.h, D - 0.6, stoneSide, HW - 0.15, y, -0.3, structure);
        box(W, L.h, 0.3, stoneSide, 0, y, -FRONT + 0.15, structure);
        box(W, 0.3, D, concrete, 0, L.baseY + 0.15, 0, structure);
        // Columns at the glazed front corners
        box(0.4, L.h, 0.4, concrete, -HW + 0.2, y, FRONT - 0.4, structure);
        box(0.4, L.h, 0.4, concrete, SPLIT, y, FRONT - 0.4, structure);
        if (opts && opts.interior) {
            // Lit back wall seen through the glass
            plane(SPLIT + HW - 0.4, L.h - 0.6, interior, (SPLIT - HW) / 2, y, FRONT - 3.5, L.facade);
        }
    }

    // Projecting dark walnut band between floors
    function band(L, y, depthOut, thick) {
        box(W + 0.5, thick, 0.9 + depthOut, walnut, -0.1, y, FRONT + depthOut / 2 - 0.2, L.facade);
        // Cove light strip on the underside
        box(W + 0.3, 0.04, 0.08, led, -0.1, y - thick / 2 - 0.03, FRONT + depthOut - 0.3, L.facade);
    }

    function glazing(L, x0, x1, z, mullionStep) {
        const y = L.baseY + L.h / 2;
        const gw = x1 - x0;
        box(gw, L.h - 0.5, 0.06, glass, (x0 + x1) / 2, y, z, L.facade);
        for (let x = x0; x <= x1 + 0.01; x += mullionStep) {
            box(0.05, L.h - 0.5, 0.08, frameMat, x, y, z + 0.02, L.facade);
        }
        // Small door-handle pairs the render shows on each pane
        for (let x = x0 + mullionStep / 2; x < x1; x += mullionStep) {
            box(0.18, 0.04, 0.04, frameMat, x, y + 0.6, z + 0.06, L.facade);
        }
    }

    // Ground floor: shopfront on the left, solid stone bay on the right, canopy above
    const G = level(1.4, 4.0);
    shell(G, { interior: true });
    glazing(G, -HW + 0.4, SPLIT - 0.2, FRONT - 0.6, 1.6);
    box(HW - SPLIT, G.h, 1.0, stoneRightBay, (SPLIT + HW) / 2, G.baseY + G.h / 2, FRONT - 0.5, G.facade);
    box(0.35, G.h, 0.6, stoneFlat, -HW + 0.17, G.baseY + G.h / 2, FRONT - 0.3, G.facade);
    // Sign above the door
    box(1.6, 0.6, 0.05, cornice, -1.6, G.baseY + G.h - 0.9, FRONT - 0.5, G.facade);
    // Shop fittings: shelving and a counter
    box(0.5, 2.2, 3.5, walnut, -HW + 0.8, G.baseY + 1.1, FRONT - 3, G.facade);
    box(2.2, 1.0, 0.8, cornice, -1.2, G.baseY + 0.5, FRONT - 2.8, G.facade);
    band(G, G.baseY + G.h - 0.1, 1.4, 0.5);

    // First floor: glass box on the left, black and white marble bay with angled light frames on the right
    const F1 = level(5.4, 3.8);
    shell(F1, { interior: true });
    glazing(F1, -HW + 0.3, SPLIT, FRONT - 0.1, 1.1);
    box(HW - SPLIT, F1.h, 0.5, blackMarble, (SPLIT + HW) / 2, F1.baseY + F1.h / 2, FRONT - 0.15, F1.facade);
    box(0.9, F1.h, 0.52, whiteMarble, SPLIT + 0.45, F1.baseY + F1.h / 2, FRONT - 0.14, F1.facade);
    [0, 1, 2, 3].forEach(i => {
        const fr = new THREE.Group();
        const fh = 1.9 + i * 0.35, fw = 0.55;
        box(fw, fh, 0.06, whiteMarble, 0, 0, 0, fr);
        box(fw + 0.08, 0.05, 0.08, led, 0, fh / 2, 0.02, fr);
        box(fw + 0.08, 0.05, 0.08, led, 0, -fh / 2, 0.02, fr);
        box(0.05, fh, 0.08, led, fw / 2, 0, 0.02, fr);
        box(0.05, fh, 0.08, led, -fw / 2, 0, 0.02, fr);
        fr.position.set(SPLIT + 0.55 + i * 0.75, F1.baseY + F1.h / 2 + (i - 1.5) * 0.15, FRONT + 0.12);
        fr.rotation.z = -0.12;
        F1.facade.add(fr);
    });
    band(F1, F1.baseY + F1.h - 0.05, 1.0, 0.35);

    // Second floor: backlit wooden fins on the left, glass in the middle, stone on the right
    const F2 = level(9.2, 3.8);
    shell(F2, { interior: true });
    glazing(F2, -HW + 0.3, SPLIT, FRONT - 0.3, 1.1);
    const finEnd = -0.6;
    for (let x = -HW + 0.4; x < finEnd; x += 0.42) {
        box(0.12, F2.h - 0.3, 0.32, finWood, x, F2.baseY + F2.h / 2, FRONT + 0.05, F2.facade);
        box(0.04, F2.h - 0.5, 0.04, led, x + 0.1, F2.baseY + F2.h / 2, FRONT - 0.12, F2.facade);
    }
    box(HW - SPLIT, F2.h, 0.6, stoneRightBay, (SPLIT + HW) / 2, F2.baseY + F2.h / 2, FRONT - 0.2, F2.facade);
    band(F2, F2.baseY + F2.h - 0.1, 0.9, 0.55);

    // Parapet: stone panels with downlights, white cornice cap
    const P = level(13.0, 2.4);
    box(W, 0.3, D, concrete, 0, P.baseY + 0.15, 0, P.structure);
    box(0.3, P.h, D - 0.6, stoneSide, -HW + 0.15, P.baseY + P.h / 2, -0.3, P.structure);
    box(0.3, P.h, D - 0.6, stoneSide, HW - 0.15, P.baseY + P.h / 2, -0.3, P.structure);
    box(W, P.h, 0.3, stoneSide, 0, P.baseY + P.h / 2, -FRONT + 0.15, P.structure);
    box(W - 0.6, P.h, 0.4, stoneParapet, 0, P.baseY + P.h / 2, FRONT - 0.2, P.facade);
    box(W + 0.4, 0.25, D + 0.4, cornice, 0, P.baseY + P.h + 0.12, 0, P.facade);
    box(W + 0.2, 0.15, D + 0.2, cornice, 0, P.baseY + P.h + 0.32, 0, P.facade);
    for (let i = 0; i < 8; i++) {
        const x = -HW + 0.75 + i * (W - 1.5) / 7;
        // Downlight and the wash of light it throws on the stone below
        box(0.14, 0.06, 0.14, led, x, P.baseY + P.h - 0.05, FRONT + 0.05, P.facade);
        const wash = plane(0.9, 1.6, led, x, P.baseY + P.h - 0.85, FRONT + 0.02, P.facade);
        wash.material = led.clone();
        wash.userData.wash = true;
    }

    const buildingHeight = P.baseY + P.h + 0.4;

    // ---------- Trees either side ----------
    function tree(x, z, s) {
        const t = new THREE.Group();
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.2 * s, 3 * s, 8), trunk);
        tr.position.y = 1.5 * s;
        t.add(tr);
        [[0, 4.2, 0, 1.8], [0.8, 3.6, 0.3, 1.3], [-0.7, 3.8, -0.2, 1.4], [0.1, 5.1, 0.1, 1.2]].forEach(([a, b, c, r]) => {
            const s1 = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), leaf);
            s1.position.set(a * s, b * s, c * s);
            s1.castShadow = !isMobile;
            t.add(s1);
        });
        t.position.set(x, 0, z);
        scene.add(t);
    }
    tree(-HW - 5, FRONT - 1, 1.3);
    tree(HW + 5.5, FRONT, 1.4);
    tree(-HW - 6, -4, 1.1);

    // ---------- Blueprint outline of the finished building ----------
    const outline = new THREE.Group();
    building.updateMatrixWorld(true);
    building.traverse(o => {
        if (!o.isMesh || o.material === glass || glowMats.includes(o.material) || o.userData.wash) return;
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry), blueprint);
        e.applyMatrix4(o.matrixWorld);
        outline.add(e);
    });
    scene.add(outline);
    levels.forEach(l => { l.visible = false; });

    // Washes need their own material so they can be faded; collect them
    const washMats = [];
    building.traverse(o => { if (o.userData.wash) washMats.push(o.material); });

    // ---------- Tower crane ----------
    const crane = new THREE.Group();
    const craneH = buildingHeight + 3;
    crane.add(box(0.8, craneH, 0.8, craneMat, 0, craneH / 2, 0));
    const jibPivot = new THREE.Group();
    jibPivot.position.y = craneH;
    jibPivot.add(box(20, 0.6, 0.6, craneMat, 5.5, 0.3, 0));
    jibPivot.add(box(2, 1.4, 1.4, concrete, -4, -0.3, 0));
    jibPivot.add(box(1.3, 1.3, 1.3, frameMat, 0, 0.9, 0));
    const cable = box(0.05, 6, 0.05, frameMat, 12, -3, 0, jibPivot);
    const hook = box(0.7, 0.45, 0.7, frameMat, 12, -6.2, 0, jibPivot);
    crane.add(jibPivot);
    crane.position.set(-HW - 4, 0, -FRONT - 3);
    scene.add(crane);

    // ---------- Stages shown next to the progress bar ----------
    const STAGES = [
        { at: 0.0, label: 'Blueprint' },
        { at: 0.06, label: 'Foundation' },
        { at: 0.2, label: 'Structure' },
        { at: 0.55, label: 'Facade' },
        { at: 0.86, label: 'Lights on' }
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

        // Foundation
        foundation.scale.y = Math.max(0.001, ease(clamp01(sp / 0.08)));

        // Structure of each level rises between 8% and 55%; facade goes on from 50% to 85%
        levels.forEach((l, i) => {
            const s = 0.08 + (i / N) * 0.47;
            const local = clamp01((sp - s) / (0.47 / N * 1.4));
            const d = l.userData;
            l.visible = local > 0;
            d.structure.position.y = (1 - ease(local)) * 5;
            const sc = 0.88 + 0.12 * ease(local);
            d.structure.scale.set(sc, 1, sc);
            const fs = 0.5 + (i / N) * 0.3;
            const fl = clamp01((sp - fs) / 0.08);
            d.facade.visible = fl > 0;
            d.facade.scale.set(1, Math.max(0.001, ease(fl)), 1);
            d.facade.position.y = (1 - ease(fl)) * d.baseY;
        });

        // Lights come on at handover
        const lightsOn = clamp01((sp - 0.84) / 0.12);
        interior.opacity = lightsOn * 0.85;
        led.opacity = lightsOn;
        washMats.forEach(m => { m.opacity = lightsOn * 0.35; });
        shopLight.intensity = lightsOn * 60;
        hemi.intensity = 0.9 - lightsOn * 0.25;
        blueprint.opacity = 0.6 * (1 - clamp01((sp - 0.45) / 0.4)) + 0.03;

        // Crane works while the building goes up, then lowers out of view
        jibPivot.rotation.y = Math.sin(t * 0.35) * 0.6 + sp * 2.2;
        hook.position.y = -6.2 + Math.sin(t * 0.9) * 1.2;
        cable.scale.y = 1 - Math.sin(t * 0.9) * 0.2;
        crane.position.y = -clamp01((sp - 0.84) / 0.1) * (craneH + 2);

        // Camera orbits in front of the building and rises with scroll; drag and pointer add to it
        if (!dragging) {
            dragVel *= 0.92;
            dragYaw += dragVel;
        }
        const yaw = -0.75 + sp * 0.85 + dragYaw + (reduceMotion ? 0 : pointerX * 0.08 + Math.sin(t * 0.15) * 0.03);
        const radius = isMobile ? 74 : 58 - sp * 5;
        const height = 4 + sp * 8 - pointerY * 1.5;
        camera.position.set(Math.sin(yaw) * radius, height, Math.cos(yaw) * radius + FRONT * 0.3);
        target.set(0, isMobile ? buildingHeight * 0.95 : buildingHeight * 0.46, 0);
        camera.lookAt(target);

        // Stage label and progress
        let current = STAGES[0];
        STAGES.forEach(s => { if (sp >= s.at) current = s; });
        if (stageLabel && stageLabel.textContent !== current.label) stageLabel.textContent = current.label;
        document.body.classList.toggle('in-hero3d', track.getBoundingClientRect().bottom > 90);
        if (stageBar) stageBar.style.transform = 'scaleX(' + sp.toFixed(3) + ')';
        // Headline fades while the building goes up and returns at handover
        // On phones the text sits over the building, so it stays faded once the building is up
        const fade = clamp01((sp - 0.05) / 0.25) * (isMobile ? 1 : 1 - clamp01((sp - 0.88) / 0.1));
        document.body.style.setProperty('--hero3d-fade', (fade * (isMobile ? 0.95 : 0.8)).toFixed(3));

        renderer.render(scene, camera);
    }
    renderFrame();
}
