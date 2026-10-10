/* ============================================
   TECHKNOW — 3D interactive hero
   The Elevation 001 commercial building, modelled from its SketchUp
   render, assembles level by level as the visitor scrolls, starting
   from a blueprint outline and ending with its dusk lighting on.
   Drag to rotate.
   ============================================ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

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


// ============================================================
// Procedural textures. Each is drawn at a real-world scale
// (pixels per metre) so joints and grain sit where the render has them.
// ============================================================
let PPM = 90;
let seed = 7;
function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

function makeCanvas(wm, hm) {
    const c = document.createElement('canvas');
    c.width = Math.min(2048, Math.max(16, Math.round(wm * PPM)));
    c.height = Math.min(2048, Math.max(16, Math.round(hm * PPM)));
    return c;
}

function toTexture(c, color) {
    const t = new THREE.CanvasTexture(c);
    if (color !== false) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
}

function grain(g, w, h, amount) {
    const img = g.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        const n = (rand() - 0.5) * amount;
        d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
}

// Stone cladding. panels: array of [x, y, w, h] in metres from the top-left.
function stoneTex(wm, hm, panels, base) {
    const c = makeCanvas(wm, hm), g = c.getContext('2d');
    const sx = c.width / wm, sy = c.height / hm;
    g.fillStyle = base;
    g.fillRect(0, 0, c.width, c.height);
    panels.forEach(([x, y, w, h]) => {
        const v = (rand() - 0.5) * 0.08;
        g.fillStyle = v > 0 ? 'rgba(255,255,255,' + v + ')' : 'rgba(0,0,0,' + (-v) + ')';
        g.fillRect(x * sx, y * sy, w * sx, h * sy);
        // Soft mottling inside each slab
        for (let k = 0; k < 6; k++) {
            const r = (0.3 + rand() * 0.6) * sx;
            const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
            grd.addColorStop(0, 'rgba(255,255,255,0.05)');
            grd.addColorStop(1, 'rgba(255,255,255,0)');
            g.save();
            g.translate((x + rand() * w) * sx, (y + rand() * h) * sy);
            g.fillStyle = grd;
            g.fillRect(-r, -r, r * 2, r * 2);
            g.restore();
        }
    });
    grain(g, c.width, c.height, 14);
    g.lineWidth = Math.max(1.5, 0.012 * sx);
    panels.forEach(([x, y, w, h]) => {
        g.strokeStyle = 'rgba(70, 52, 38, 0.75)';
        g.strokeRect(x * sx, y * sy, w * sx, h * sy);
        g.strokeStyle = 'rgba(255, 245, 230, 0.25)';
        g.beginPath();
        g.moveTo(x * sx + 2, (y + h) * sy - 2);
        g.lineTo((x + w) * sx - 2, (y + h) * sy - 2);
        g.stroke();
    });
    return toTexture(c);
}

function columnsOfPanels(wm, hm, colWidths, jointsFor) {
    const panels = [];
    let x = 0;
    colWidths.forEach((cw, i) => {
        const joints = [0, ...jointsFor(i), 1];
        for (let j = 0; j < joints.length - 1; j++) {
            panels.push([x, joints[j] * hm, cw, (joints[j + 1] - joints[j]) * hm]);
        }
        x += cw;
    });
    return panels;
}

// Walnut planks running horizontally
function woodTex(wm, hm, base, plank) {
    const c = makeCanvas(wm, hm), g = c.getContext('2d');
    g.fillStyle = base;
    g.fillRect(0, 0, c.width, c.height);
    const sy = c.height / hm;
    const ph = plank * sy;
    for (let y = 0; y < c.height; y += ph) {
        g.fillStyle = 'rgba(0,0,0,' + (rand() * 0.12).toFixed(3) + ')';
        g.fillRect(0, y, c.width, ph);
        for (let k = 0; k < 8; k++) {
            g.strokeStyle = 'rgba(' + (rand() > 0.5 ? '255,220,180' : '20,10,5') + ',' + (0.05 + rand() * 0.08).toFixed(3) + ')';
            g.lineWidth = 1;
            g.beginPath();
            const yy = y + rand() * ph;
            g.moveTo(0, yy);
            for (let x = 0; x < c.width; x += 40) g.lineTo(x, yy + Math.sin(x * 0.01 + k) * 2);
            g.stroke();
        }
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(0, y, c.width, 1);
    }
    grain(g, c.width, c.height, 10);
    return toTexture(c);
}

// Vertical-grain wood for the fins
function finWoodTex() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#5e3c24';
    g.fillRect(0, 0, 64, 512);
    for (let k = 0; k < 14; k++) {
        g.strokeStyle = 'rgba(40,20,8,' + (0.1 + rand() * 0.15).toFixed(3) + ')';
        g.beginPath();
        const x = rand() * 64;
        g.moveTo(x, 0);
        for (let y = 0; y < 512; y += 16) g.lineTo(x + Math.sin(y * 0.02 + k) * 3, y);
        g.stroke();
    }
    grain(g, 64, 512, 12);
    return toTexture(c);
}

function veins(g, w, h, color, count, alpha) {
    g.strokeStyle = color;
    for (let i = 0; i < count; i++) {
        g.globalAlpha = alpha * (0.4 + rand() * 0.6);
        g.lineWidth = 0.6 + rand() * 1.6;
        g.beginPath();
        let x = rand() * w, y = rand() * h * 0.2;
        g.moveTo(x, y);
        const dir = rand() > 0.5 ? 1 : -1;
        while (y < h && x > -50 && x < w + 50) {
            x += (rand() - 0.3) * 18 * dir;
            y += 8 + rand() * 14;
            g.lineTo(x, y);
        }
        g.stroke();
    }
    g.globalAlpha = 1;
}

// First-floor feature bay: black and white marble blocks with four angled,
// LED-framed recessed panels. Returns colour and emissive maps.
function marbleBayTex(wm, hm) {
    const c = makeCanvas(wm, hm), g = c.getContext('2d');
    const e = makeCanvas(wm, hm), ge = e.getContext('2d');
    const sx = c.width / wm, sy = c.height / hm;
    const W = c.width, H = c.height;
    // Statuario background
    g.fillStyle = '#e9e7e3';
    g.fillRect(0, 0, W, H);
    veins(g, W, H, '#8d8d8d', 22, 0.35);
    // Nero Marquina blocks, alternating top and bottom like the render
    const blocks = [[0, 0, 0.62, 0.6], [0.62, 0.42, 0.72, 0.58], [1.34, 0, 0.7, 0.55], [2.04, 0.4, 0.7, 0.6], [2.74, 0, 0.71, 0.5]];
    blocks.forEach(([x, y, w, h]) => {
        g.save();
        g.beginPath();
        g.rect(x * sx, y * H, w * sx, h * H);
        g.clip();
        g.fillStyle = '#121214';
        g.fillRect(x * sx, y * H, w * sx, h * H);
        veins(g, W, H, '#e8e8e8', 10, 0.45);
        g.restore();
    });
    grain(g, W, H, 8);
    ge.fillStyle = '#000';
    ge.fillRect(0, 0, W, H);
    // Recessed parallelogram panels with gold LED edges, taller to the right
    const panels = [[0.32, 0.38, 1.25], [1.08, 0.24, 1.9], [1.86, 0.12, 2.5], [2.72, 0.05, 3.05]];
    panels.forEach(([x, top, h]) => {
        const w = 0.42, skew = 0.16;
        const pts = [[x + skew, top], [x + skew + w, top], [x + w, top + h], [x, top + h]].map(([a, b]) => [a * sx, b * sy]);
        const path = (ctx) => { ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); };
        path(g);
        g.fillStyle = '#9b918b';
        g.fill();
        g.lineWidth = 0.035 * sx;
        g.strokeStyle = '#ffd38a';
        g.stroke();
        path(ge);
        ge.lineWidth = 0.04 * sx;
        ge.strokeStyle = '#ffc56e';
        ge.stroke();
    });
    return { map: toTexture(c), emissiveMap: toTexture(e) };
}

// Ceiling with recessed downlights; emissive map lights only the downlights
function ceilingTex(wm, hm) {
    const c = makeCanvas(wm, hm), g = c.getContext('2d');
    const e = makeCanvas(wm, hm), ge = e.getContext('2d');
    g.fillStyle = '#f2ece2';
    g.fillRect(0, 0, c.width, c.height);
    ge.fillStyle = '#2a2420';
    ge.fillRect(0, 0, e.width, e.height);
    const sx = c.width / wm;
    for (let x = 0.9; x < wm; x += 1.6) {
        for (let y = 0.8; y < hm; y += 1.6) {
            [g, ge].forEach((ctx, i) => {
                const grd = ctx.createRadialGradient(x * sx, y * sx, 0, x * sx, y * sx, 0.5 * sx);
                grd.addColorStop(0, i ? '#fff4dd' : '#ffffff');
                grd.addColorStop(0.15, i ? '#ffe2b0' : '#f6efe4');
                grd.addColorStop(1, i ? 'rgba(42,36,32,0)' : 'rgba(242,236,226,0)');
                ctx.fillStyle = grd;
                ctx.fillRect(x * sx - 0.5 * sx, y * sx - 0.5 * sx, sx, sx);
            });
        }
    }
    return { map: toTexture(c), emissiveMap: toTexture(e) };
}

// Warm wall glow, brighter near the ceiling, as cast by downlights
function wallGlowTex() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#3a3027';
    g.fillRect(0, 0, 256, 256);
    for (let x = 32; x < 256; x += 64) {
        const grd = g.createRadialGradient(x, 0, 0, x, 30, 150);
        grd.addColorStop(0, 'rgba(255,236,205,1)');
        grd.addColorStop(1, 'rgba(255,236,205,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, 256, 256);
    }
    const t = toTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    return t;
}

// Light scallops thrown down the parapet by its downlights
function scallopTex(wm, hm, count) {
    const c = makeCanvas(wm, hm), g = c.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, c.width, c.height);
    const sx = c.width / wm;
    for (let i = 0; i < count; i++) {
        const x = (i + 0.5) * wm / count * sx;
        g.save();
        g.translate(x, 0);
        g.scale(1, 2.2);
        const grd = g.createRadialGradient(0, 0, 0, 0, 0, 0.75 * sx);
        grd.addColorStop(0, 'rgba(255,214,150,0.95)');
        grd.addColorStop(0.5, 'rgba(255,200,130,0.35)');
        grd.addColorStop(1, 'rgba(255,200,130,0)');
        g.fillStyle = grd;
        g.fillRect(-0.8 * sx, 0, 1.6 * sx, 0.8 * sx);
        g.restore();
    }
    return toTexture(c);
}

function tileTex() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#d8d4cc';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#3d3d40';
    for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
        g.save();
        g.translate(q * 64 + 32, r * 64 + 32);
        g.rotate(Math.PI / 4);
        g.fillRect(-13, -13, 26, 26);
        g.restore();
        g.fillRect(q * 64 + 30, r * 64, 4, 4);
    }
    grain(g, 256, 256, 10);
    const t = toTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}

function skyTex() {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 512;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#2a3150');
    grad.addColorStop(0.42, '#55628e');
    grad.addColorStop(0.68, '#9aa0c2');
    grad.addColorStop(0.84, '#d7bfb4');
    grad.addColorStop(1, '#2b2c31');
    g.fillStyle = grad;
    g.fillRect(0, 0, 16, 512);
    return toTexture(c);
}

function signTex() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#e9dfd2';
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#6b5340';
    g.font = 'italic 600 72px "Playfair Display", Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('F R', 128, 68);
    return toTexture(c);
}

// ============================================================
function init() {
    document.body.classList.add('has-3d');

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) PPM = 55;

    // Dimensions in metres, scaled off the elevation render. Front faces +z.
    const W = 12, HW = 6, D = 14, FRONT = 7;
    const SPLIT = 2.54;          // glazed bays end, solid right-hand bay begins
    const G_LEFT = -4.6;         // ground floor is narrower; upper floors cantilever on the left
    const G_RIGHT = 5.6;
    const PLINTH = 1.75;         // shop floor level above the forecourt
    const LV = {
        g: { base: PLINTH, top: 5.45 },
        f1: { base: 5.95, top: 9.25 },
        f2: { base: 9.6, top: 12.85 },
        p: { base: 13.35, top: 15.3 }
    };

    // ---------- Renderer, scene, camera ----------
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = skyTex();
    scene.fog = new THREE.Fog('#4a4d63', 80, 170);

    // Soft studio reflections for glass, marble and metal
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);

    // ---------- Post-processing: bloom on lights (desktop) ----------
    let composer = null;
    if (!isMobile) {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.35, 0.96));
        composer.addPass(new OutputPass());
    }

    // ---------- Lights: dusk ----------
    const hemi = new THREE.HemisphereLight('#aeb8de', '#2c2622', 1.1);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight('#ffd2a8', 1.0);
    sun.position.set(20, 28, 30);
    sun.castShadow = !isMobile;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -8 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    // Warm fill from the street, like the uplighting in the render
    const fill = new THREE.DirectionalLight('#ffd9b8', 0.3);
    fill.position.set(-4, 3, 40);
    scene.add(fill);
    const rim = new THREE.DirectionalLight('#8aa2ff', 0.45);
    rim.position.set(-25, 15, -20);
    scene.add(rim);
    // Warm light spilling out of the shop and onto the steps once the lights are on
    const shopLight = new THREE.PointLight('#ffcf94', 0, 22, 1.5);
    shopLight.position.set(-0.8, 4.2, FRONT + 1.2);
    scene.add(shopLight);
    const planterLight = new THREE.PointLight('#ffd58a', 0, 6, 2);
    planterLight.position.set(3.6, 0.6, FRONT + 3.2);
    scene.add(planterLight);

    // ---------- Materials ----------
    const ACCENT = new THREE.Color('#00A8E8');
    const lit = [];   // [material, full emissive intensity] pairs that switch on at handover
    const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8, metalness: 0, envMapIntensity: 0.25 }, o));
    function glowing(m, full) {
        m.emissiveIntensity = 0;
        lit.push([m, full]);
        return m;
    }
    const STONE = '#c9b29c';
    const stonePlain = std({ color: STONE, roughness: 0.85 });
    const cornice = std({ color: '#f3eee6', roughness: 0.55 });
    const concrete = std({ color: '#9a9ea4', roughness: 0.9 });
    const darkMetal = std({ color: '#2a2a2c', roughness: 0.35, metalness: 0.8 });
    const steel = std({ color: '#cfd2d6', roughness: 0.25, metalness: 0.9 });
    const plinthMat = std({ color: '#b7ada0', roughness: 0.85 });
    const stepMat = std({ color: '#cfc6b8', roughness: 0.6 });
    const asphalt = std({ color: '#2a2c31', roughness: 0.95 });
    const leaf = std({ color: '#3d6a33', roughness: 0.9 });
    const darkLeaf = std({ color: '#26401f', roughness: 0.9 });
    const trunk = std({ color: '#4a3526', roughness: 0.9 });
    const blackMarble = std({ color: '#151517', roughness: 0.2, metalness: 0.05 });
    const walnutTop = std({ map: woodTex(W + 1, 0.6, '#3b2618', 0.1), roughness: 0.5 });
    const walnutThin = std({ map: woodTex(W + 1, 0.4, '#3b2618', 0.1), roughness: 0.5 });
    const walnutSoffit = std({ map: woodTex(W + 1, 2, '#4a2f1e', 0.18), roughness: 0.5 });
    const finWood = std({ map: finWoodTex(), roughness: 0.5 });
    const shelfWood = std({ color: '#6b4a32', roughness: 0.55 });
    const glass = new THREE.MeshPhysicalMaterial({
        color: '#ffffff', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.16,
        envMapIntensity: 0.9, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false
    });
    const railGlass = glass.clone();
    railGlass.opacity = 0.22;
    const led = glowing(std({ color: '#4a3a28', emissive: '#ffbf66' }), 3.2);
    const bulb = glowing(std({ color: '#5a5048', emissive: '#fff1d8' }), 4);
    const wallGlow = glowing(std({ color: '#efe5d6', emissive: '#ffffff', emissiveMap: wallGlowTex(), roughness: 0.9 }), 0.4);
    const interiorWall = glowing(std({ color: '#efe6d8', emissive: '#ffe9cc', roughness: 0.9 }), 0.28);
    const interiorFloor = glowing(std({ color: '#e7ddcf', emissive: '#ffe2bd', roughness: 0.25, metalness: 0.05 }), 0.18);
    const finBacklight = glowing(std({ color: '#d9c3a6', emissive: '#ffcf8f', roughness: 0.9 }), 0.55);
    const sign = glowing(std({ map: signTex(), emissive: '#ffffff', emissiveMap: signTex() }), 0.7);
    const blueprint = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.6 });
    const craneMat = std({ color: '#f2b705', roughness: 0.6, metalness: 0.3 });

    // Front faces get the textured material; the other five faces a plain one
    function box(w, h, d, m, x, y, z, parent, front) {
        const mats = front ? [m, m, m, m, front, m] : m;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
        mesh.position.set(x, y, z);
        const shade = !isMobile && m !== glass && m !== railGlass;
        mesh.castShadow = shade;
        mesh.receiveShadow = shade;
        if (parent) parent.add(mesh);
        return mesh;
    }
    function plane(w, h, m, x, y, z, parent, rx, ry) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
        mesh.position.set(x, y, z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        mesh.receiveShadow = !isMobile;
        if (parent) parent.add(mesh);
        return mesh;
    }

    // ---------- Site ----------
    const ground = new THREE.Mesh(new THREE.CircleGeometry(150, 64), asphalt);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const grid = new THREE.GridHelper(150, 75, ACCENT, '#3c4352');
    grid.material.transparent = true;
    grid.material.opacity = 0.1;
    grid.position.y = 0.01;
    scene.add(grid);
    for (let x = -50; x < 50; x += 6) box(3, 0.02, 0.15, cornice, x, 0.02, FRONT + 12, scene);
    // Pavement kerb
    box(80, 0.18, 2.2, plinthMat, 0, 0.09, FRONT + 8.4, scene);

    const building = new THREE.Group();
    scene.add(building);

    // ---------- Stage 1: foundation ----------
    const foundation = new THREE.Group();
    // Raised podium the shop sits on
    box(G_RIGHT - G_LEFT, PLINTH, D, plinthMat, (G_LEFT + G_RIGHT) / 2, PLINTH / 2, 0, foundation);
    // Shop landing in front of the glass
    box(6.9, 0.12, 1.4, stepMat, -0.95, PLINTH - 0.06, FRONT + 0.7, foundation);
    // Forecourt with the patterned tiles
    const tileMat = std({ map: tileTex(), roughness: 0.6 });
    tileMat.map.repeat.set(9, 4);
    box(W + 6, 0.1, 7, plinthMat, 0, 0.05, FRONT + 3.8, foundation, tileMat);
    // Seven steps up to the shop, spanning the left of the frontage
    const stepN = 7, rise = PLINTH / stepN, tread = 0.34;
    for (let s = 0; s < stepN; s++) {
        const h = rise * (s + 1);
        box(5.35, h, tread, stepMat, -1.58, h / 2, FRONT + 1.4 + (stepN - 1 - s) * tread, foundation);
    }
    // Glass balustrade on the right of the landing
    box(1.5, 0.95, 0.03, railGlass, 1.85, PLINTH + 0.47, FRONT + 1.35, foundation);
    box(1.5, 0.04, 0.05, steel, 1.85, PLINTH + 0.96, FRONT + 1.35, foundation);
    box(0.03, 0.95, 1.3, railGlass, 2.6, PLINTH + 0.47, FRONT + 0.7, foundation);
    // Planter with lit shrubs
    box(4.6, 0.75, 1.3, plinthMat, 3.55, 0.38, FRONT + 3.25, foundation);
    for (let i = 0; i < 12; i++) {
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32 + rand() * 0.12, 1), i % 3 ? leaf : darkLeaf);
        b.position.set(1.5 + i * 0.37, 0.95 + rand() * 0.12, FRONT + 3.1 + (rand() - 0.5) * 0.5);
        b.scale.y = 0.8;
        foundation.add(b);
    }
    // Bollard lights
    [1.25, 5.85].forEach(x => {
        box(0.14, 0.9, 0.14, darkMetal, x, 0.45, FRONT + 4.1, foundation);
        box(0.1, 0.12, 0.1, bulb, x, 0.82, FRONT + 4.17, foundation);
    });
    // Basement ramps down both sides, with retaining walls
    [[-HW - 2.2, -1], [G_RIGHT + 2.6, 1]].forEach(([x, side]) => {
        box(0.35, 1.2, D + 2, plinthMat, x + side * 1.9, 0.6, 0, foundation);
        box(0.05, 0.05, D + 2, steel, x + side * 1.9, 1.22, 0, foundation);
    });
    building.add(foundation);

    // ---------- Levels ----------
    const levels = [];
    function level(baseY, topY) {
        const g = new THREE.Group();
        const structure = new THREE.Group();
        const facade = new THREE.Group();
        g.add(structure, facade);
        g.userData = { structure, facade, baseY, h: topY - baseY };
        building.add(g);
        levels.push(g);
        return g.userData;
    }

    // Slab, side and back walls, and the lit room behind the glass
    function shell(L, x0, x1, room) {
        const { structure, facade } = L;
        const y = L.baseY + L.h / 2;
        const sideMat = std({ map: stoneTex(D, L.h, columnsOfPanels(D, L.h, [1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.2], i => i % 2 ? [0.45] : [0.3, 0.75]), STONE), roughness: 0.85 });
        box(0.3, L.h, D, stonePlain, x0 + 0.15, y, 0, structure, null).material = [stonePlain, sideMat, stonePlain, stonePlain, stonePlain, stonePlain];
        box(0.3, L.h, D, stonePlain, x1 - 0.15, y, 0, structure, null).material = [sideMat, stonePlain, stonePlain, stonePlain, stonePlain, stonePlain];
        box(x1 - x0, L.h, 0.3, stonePlain, (x0 + x1) / 2, y, -FRONT + 0.15, structure);
        box(x1 - x0, 0.3, D, concrete, (x0 + x1) / 2, L.baseY + 0.15, 0, structure);
        if (room) {
            const [rx0, rx1, depth] = room;
            const rw = rx1 - rx0, cx = (rx0 + rx1) / 2;
            const ceil = ceilingTex(rw, depth);
            const ceilMat = glowing(std({ map: ceil.map, emissive: '#ffffff', emissiveMap: ceil.emissiveMap, roughness: 0.9 }), 0.6);
            plane(rw, depth, ceilMat, cx, L.baseY + L.h - 0.35, FRONT - depth / 2, facade, Math.PI / 2);
            plane(rw, depth, interiorFloor, cx, L.baseY + 0.31, FRONT - depth / 2, facade, -Math.PI / 2);
            plane(rw, L.h - 0.6, wallGlow, cx, L.baseY + 0.3 + (L.h - 0.6) / 2, FRONT - depth, facade);
            plane(depth, L.h - 0.6, interiorWall, rx0 + 0.02, L.baseY + 0.3 + (L.h - 0.6) / 2, FRONT - depth / 2, facade, 0, Math.PI / 2);
            plane(depth, L.h - 0.6, interiorWall, rx1 - 0.02, L.baseY + 0.3 + (L.h - 0.6) / 2, FRONT - depth / 2, facade, 0, -Math.PI / 2);
        }
    }

    // Frameless glazing with pairs of door handles on each pane
    function glazing(L, x0, x1, z, panes) {
        const y = L.baseY + 0.3 + (L.h - 0.6) / 2, gh = L.h - 0.6;
        box(x1 - x0, gh, 0.03, glass, (x0 + x1) / 2, y, z, L.facade);
        const pw = (x1 - x0) / panes;
        for (let i = 1; i < panes; i++) box(0.015, gh, 0.05, steel, x0 + i * pw, y, z + 0.01, L.facade);
        for (let i = 0; i < panes; i++) {
            const hx = x0 + (i + 0.5) * pw;
            [-0.07, 0.07].forEach(dx => box(0.025, 0.09, 0.04, steel, hx + dx, y + 0.05, z + 0.04, L.facade));
        }
        // Thin head and sill channels
        box(x1 - x0, 0.06, 0.1, darkMetal, (x0 + x1) / 2, L.baseY + 0.33, z, L.facade);
        box(x1 - x0, 0.06, 0.1, darkMetal, (x0 + x1) / 2, L.baseY + L.h - 0.3, z, L.facade);
    }

    // Walnut floor band projecting past the facade, with a cove light strip beneath its front edge
    function band(parent, y, thick, out, mat) {
        box(W + 0.85, thick, 1.0 + out, mat, -0.1, y, FRONT + out / 2 - 0.3, parent);
        box(W + 0.6, 0.03, 0.05, led, -0.1, y - thick / 2 - 0.02, FRONT + out - 0.45, parent);
    }

    // ----- Ground floor: shop -----
    const G = level(LV.g.base, LV.g.top);
    shell(G, G_LEFT, G_RIGHT, [G_LEFT + 0.65, 2.2, 7]);
    glazing(G, G_LEFT + 0.65, 2.2, FRONT - 0.45, 4);
    // Left stone pilaster
    const pilasterMat = std({ map: stoneTex(0.65, G.h + PLINTH, columnsOfPanels(0.65, G.h + PLINTH, [0.65], () => [0.25, 0.5, 0.75]), STONE) });
    box(0.65, G.h + PLINTH, 0.9, stonePlain, G_LEFT + 0.32, (G.h + PLINTH) / 2, FRONT - 0.2, G.facade, pilasterMat);
    // Walnut header over the shopfront
    box(2.2 - G_LEFT - 0.65, 0.55, 0.5, walnutThin, (G_LEFT + 0.65 + 2.2) / 2, G.baseY + G.h - 0.27, FRONT - 0.3, G.facade);
    // Black marble column, then the stone block that runs down to the forecourt
    box(0.5, G.h + PLINTH, 0.7, blackMarble, 2.48, (G.h + PLINTH) / 2, FRONT - 0.3, G.facade);
    const rbH = G.h + PLINTH;
    const rbMat = std({ map: stoneTex(G_RIGHT - 2.73, rbH, columnsOfPanels(G_RIGHT - 2.73, rbH, [1.0, G_RIGHT - 3.73], i => i ? [0.18, 0.4, 0.62, 0.82] : [0.3, 0.52, 0.74]), STONE) });
    box(G_RIGHT - 2.73, rbH, 1.1, stonePlain, (2.73 + G_RIGHT) / 2, rbH / 2, FRONT - 0.5, G.facade, rbMat);
    // Shop fit-out: wall shelving, counters, sign and plants
    for (let i = 0; i < 2; i++) {
        const sx = G_LEFT + 1.1 + i * 0.85;
        box(0.75, 2.3 - i * 0.3, 0.45, shelfWood, sx, G.baseY + 0.3 + (2.3 - i * 0.3) / 2, FRONT - 2.4 - i * 1.4, G.facade);
        for (let k = 0; k < 4; k++) box(0.6, 0.03, 0.4, bulb, sx, G.baseY + 0.7 + k * 0.5, FRONT - 2.2 - i * 1.4, G.facade);
    }
    box(1.8, 1.0, 0.7, shelfWood, -1.2, G.baseY + 0.8, FRONT - 3.2, G.facade);
    box(1.9, 0.05, 0.8, cornice, -1.2, G.baseY + 1.32, FRONT - 3.2, G.facade);
    box(1.2, 1.0, 0.6, cornice, 1.2, G.baseY + 0.8, FRONT - 2.4, G.facade);
    box(1.6, 0.7, 0.05, sign, -0.6, G.baseY + 2.85, FRONT - 6.9, G.facade);
    [[G_LEFT + 1.0, FRONT - 1.0], [1.5, FRONT - 1.2]].forEach(([x, z]) => {
        box(0.35, 0.45, 0.35, cornice, x, G.baseY + 0.52, z, G.facade);
        const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), leaf);
        p.position.set(x, G.baseY + 1.15, z);
        p.scale.y = 1.3;
        G.facade.add(p);
    });

    // ----- Sloped walnut canopy between ground and first floor -----
    const canopy = new THREE.Group();
    box(W + 0.85, 0.32, 2.2, walnutThin, -0.1, LV.g.top + 0.34, FRONT + 0.4, canopy);
    const soffit = box(W + 0.85, 0.06, 1.25, walnutSoffit, -0.1, LV.g.top + 0.1, FRONT + 0.95, canopy);
    soffit.rotation.x = -0.32;
    G.facade.add(canopy);

    // ----- First floor: glass box and marble feature bay -----
    const F1 = level(LV.f1.base, LV.f1.top);
    shell(F1, -HW, HW, [-HW + 0.45, SPLIT, 6]);
    glazing(F1, -HW + 0.45, SPLIT, FRONT - 0.05, 7);
    // Thin white marble return on the left edge
    const whiteMarble = std({ color: '#ecebe8', roughness: 0.25 });
    box(0.45, F1.h, 0.6, whiteMarble, -HW + 0.22, F1.baseY + F1.h / 2, FRONT - 0.2, F1.facade);
    const bay = marbleBayTex(HW - SPLIT, F1.h);
    const bayMat = glowing(std({ map: bay.map, emissive: '#ffffff', emissiveMap: bay.emissiveMap, roughness: 0.22, metalness: 0.05 }), 2.6);
    box(HW - SPLIT, F1.h, 0.6, blackMarble, (SPLIT + HW) / 2, F1.baseY + F1.h / 2, FRONT - 0.2, F1.facade, bayMat);
    band(F1.facade, LV.f1.top + 0.17, 0.34, 0.9, walnutThin);

    // ----- Second floor: backlit timber fins, glass, stone -----
    const F2 = level(LV.f2.base, LV.f2.top);
    shell(F2, -HW, HW, [-HW + 0.3, SPLIT, 6]);
    const FIN_END = -1.15;
    glazing(F2, FIN_END, SPLIT, FRONT - 0.3, 3);
    // Behind the fins: a warm lit wall
    box(FIN_END + HW - 0.3, F2.h - 0.4, 0.1, finBacklight, (FIN_END - HW + 0.3) / 2, F2.baseY + F2.h / 2, FRONT - 0.6, F2.facade);
    const finCount = 13;
    for (let i = 0; i < finCount; i++) {
        const x = -HW + 0.4 + i * ((FIN_END - 0.1) - (-HW + 0.4)) / (finCount - 1);
        box(0.11, F2.h - 0.1, 0.42, finWood, x, F2.baseY + F2.h / 2, FRONT - 0.05, F2.facade);
    }
    const s2W = HW - SPLIT;
    const s2Mat = std({ map: stoneTex(s2W, F2.h, columnsOfPanels(s2W, F2.h, [1.0, 1.25, s2W - 2.25], i => [[0.32, 0.62, 0.88], [0.2, 0.5, 0.78], [0.3, 0.6, 0.86]][i]), STONE) });
    box(s2W, F2.h, 0.7, stonePlain, (SPLIT + HW) / 2, F2.baseY + F2.h / 2, FRONT - 0.25, F2.facade, s2Mat);
    band(F2.facade, LV.f2.top + 0.25, 0.5, 1.0, walnutTop);

    // ----- Parapet: stone panels, downlights, stepped white cornice -----
    const P = level(LV.p.base, LV.p.top);
    box(W, 0.3, D, concrete, 0, P.baseY + 0.15, 0, P.structure);
    box(0.3, P.h, D, stonePlain, -HW + 0.15, P.baseY + P.h / 2, 0, P.structure);
    box(0.3, P.h, D, stonePlain, HW - 0.15, P.baseY + P.h / 2, 0, P.structure);
    box(W, P.h, 0.3, stonePlain, 0, P.baseY + P.h / 2, -FRONT + 0.15, P.structure);
    const pW = W - 0.4;
    const pCols = Array(8).fill(pW / 8);
    const parapetMat = std({
        map: stoneTex(pW, P.h, columnsOfPanels(pW, P.h, pCols, i => i % 2 ? [0.12, 0.84] : [0.5]), STONE),
        emissive: '#ffffff', emissiveMap: scallopTex(pW, P.h, 8), roughness: 0.85
    });
    glowing(parapetMat, 1.1);
    box(pW, P.h, 0.5, stonePlain, 0, P.baseY + P.h / 2, FRONT - 0.25, P.facade, parapetMat);
    // Stepped cornice
    [[0.16, 0.5, 0], [0.12, 0.38, 0.16], [0.12, 0.3, 0.28], [0.12, 0.22, 0.4], [0.1, 0.14, 0.52]].forEach(([h, out, y0]) => {
        box(W + out * 2, h, D + out * 2, cornice, 0, P.baseY + P.h + y0 + h / 2, 0, P.facade);
    });
    for (let i = 0; i < 8; i++) {
        box(0.12, 0.03, 0.12, bulb, -pW / 2 + (i + 0.5) * pW / 8, P.baseY + P.h - 0.01, FRONT + 0.12, P.facade);
    }

    const buildingHeight = LV.p.top + 0.7;

    // ---------- Trees and cars for scale ----------
    function tree(x, z, s) {
        const t = new THREE.Group();
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 3.2 * s, 8), trunk);
        tr.position.y = 1.6 * s;
        tr.castShadow = !isMobile;
        t.add(tr);
        for (let k = 0; k < 9; k++) {
            const r = (0.9 + rand() * 0.7) * s;
            const s1 = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), k % 2 ? leaf : darkLeaf);
            s1.position.set((rand() - 0.5) * 2.2 * s, (3.4 + rand() * 2.2) * s, (rand() - 0.5) * 2.2 * s);
            s1.castShadow = !isMobile;
            t.add(s1);
        }
        t.position.set(x, 0, z);
        scene.add(t);
    }
    tree(-HW - 5.5, FRONT + 5.5, 1.2);
    tree(HW + 6, FRONT + 5.5, 1.3);
    tree(-HW - 6.5, -4, 1.1);

    function car(x, z, color) {
        const c = new THREE.Group();
        const body = std({ color, roughness: 0.25, metalness: 0.6 });
        box(1.8, 0.6, 4.3, body, 0, 0.55, 0, c);
        box(1.6, 0.5, 2.2, body, 0, 1.08, -0.2, c);
        box(1.62, 0.42, 2.0, std({ color: '#1a1d22', roughness: 0.1, metalness: 0.5 }), 0, 1.08, -0.2, c);
        [[-0.85, 1.4], [0.85, 1.4], [-0.85, -1.4], [0.85, -1.4]].forEach(([wx, wz]) => {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 16), darkMetal);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(wx, 0.34, wz);
            c.add(wheel);
        });
        box(0.4, 0.08, 0.05, glowing(std({ color: '#5a1010', emissive: '#ff2a2a' }), 1.5), -0.6, 0.7, 2.16, c);
        box(0.4, 0.08, 0.05, glowing(std({ color: '#5a1010', emissive: '#ff2a2a' }), 1.5), 0.6, 0.7, 2.16, c);
        c.position.set(x, 0.1, z);
        c.rotation.y = Math.PI;
        foundation.add(c);
    }
    car(-5.8, FRONT + 5.2, '#a5141c');
    car(-2.9, FRONT + 5.0, '#8d9096');
    car(-0.2, FRONT + 5.0, '#a7aaae');

    // ---------- Blueprint outline of the finished building ----------
    const outline = new THREE.Group();
    building.updateMatrixWorld(true);
    const skip = new Set([glass, railGlass, led, bulb, leaf, darkLeaf, trunk]);
    building.traverse(o => {
        if (!o.isMesh) return;
        const m = Array.isArray(o.material) ? o.material[0] : o.material;
        if (skip.has(m) || o.geometry.type !== 'BoxGeometry' || o.parent.parent === foundation) return;
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
        { at: 0.2, label: 'Structure' },
        { at: 0.55, label: 'Facade' },
        { at: 0.78, label: 'Lights on' },
        { at: 0.9, label: 'Handed over' }
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
        if (composer) composer.setSize(w, h);
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
        const lightsOn = clamp01((sp - 0.76) / 0.12);
        lit.forEach(([m, full]) => { m.emissiveIntensity = full * lightsOn; });
        shopLight.intensity = lightsOn * 28;
        planterLight.intensity = lightsOn * 8;
        hemi.intensity = 1.1 - lightsOn * 0.35;
        sun.intensity = 1.0 - lightsOn * 0.4;
        blueprint.opacity = 0.6 * (1 - clamp01((sp - 0.45) / 0.4)) + 0.03;

        // Crane works while the building goes up, then lowers out of view
        jibPivot.rotation.y = Math.sin(t * 0.35) * 0.6 + sp * 2.2;
        hook.position.y = -6.2 + Math.sin(t * 0.9) * 1.2;
        cable.scale.y = 1 - Math.sin(t * 0.9) * 0.2;
        crane.position.y = -clamp01((sp - 0.74) / 0.1) * (craneH + 2);

        // Camera orbits round to the front view of the render as the building completes
        if (!dragging) {
            dragVel *= 0.92;
            dragYaw += dragVel;
        }
        const yaw = -0.75 + ease(sp) * 0.78 + dragYaw + (reduceMotion ? 0 : pointerX * 0.06 + Math.sin(t * 0.15) * 0.025);
        const radius = isMobile ? 70 : 58 - sp * 12;
        // Rises while building, then settles to street eye level to match the render's viewpoint
        const height = 4 + 6 * clamp01(sp / 0.8) - 7.5 * clamp01((sp - 0.8) / 0.2) - pointerY * 1.5;
        camera.position.set(Math.sin(yaw) * radius, height, Math.cos(yaw) * radius + FRONT * 0.3);
        target.set(0, isMobile ? buildingHeight * 0.95 : buildingHeight * (0.47 + sp * 0.08), 0);
        camera.lookAt(target);

        let current = STAGES[0];
        STAGES.forEach(s => { if (sp >= s.at) current = s; });
        if (stageLabel && stageLabel.textContent !== current.label) stageLabel.textContent = current.label;
        document.body.classList.toggle('in-hero3d', track.getBoundingClientRect().bottom > 90);
        if (stageBar) stageBar.style.transform = 'scaleX(' + sp.toFixed(3) + ')';
        // Headline fades while the building goes up and returns at handover.
        // On phones the text sits over the building, so it stays faded once the building is up.
        const fade = clamp01((sp - 0.05) / 0.25) * (isMobile ? 1 : 1 - clamp01((sp - 0.9) / 0.08));
        stage.style.setProperty('--hero3d-photo', clamp01((sp - 0.88) / 0.1).toFixed(3));
        document.body.style.setProperty('--hero3d-fade', (fade * (isMobile ? 0.95 : 0.8)).toFixed(3));

        if (composer) composer.render();
        else renderer.render(scene, camera);
    }
    renderFrame();
}

if (stage && canvas && track && webglAvailable()) {
    init();
}
