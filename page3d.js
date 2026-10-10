/* ============================================
   TECHKNOW — 3D backdrops for the inner pages
   One fixed WebGL canvas sits behind the content and shows a scene for
   whichever page is open: Why Choose Us, Services, Portfolio,
   Testimonials or Contact. Scenes follow scroll and the pointer, and
   cards tilt in 3D under the pointer.
   ============================================ */
import * as THREE from 'three';

const GOLD = '#E3B26B';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function webglAvailable() {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) {
        return false;
    }
}

// ---------- 3D tilt on cards ----------
function initTilt() {
    if (!finePointer || reduceMotion) return;
    const selector = '.value-card, .service-card, .project-card, .testimonial-card, .contact-card, .enquiry-form';
    document.addEventListener('pointermove', e => {
        const card = e.target.closest && e.target.closest(selector);
        document.querySelectorAll('.tilt-active').forEach(c => {
            if (c !== card) {
                c.classList.remove('tilt-active');
                c.style.removeProperty('--tilt-x');
                c.style.removeProperty('--tilt-y');
            }
        });
        if (!card) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        // Big panels such as the form tilt less than small cards
        const max = r.width > 500 ? 3 : 8;
        card.classList.add('tilt-active');
        card.style.setProperty('--tilt-x', (-py * max).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', (px * max).toFixed(2) + 'deg');
        card.style.setProperty('--glare-x', ((px + 0.5) * 100).toFixed(1) + '%');
        card.style.setProperty('--glare-y', ((py + 0.5) * 100).toFixed(1) + '%');
    }, { passive: true });
}

// ---------- Scene helpers ----------
function lineMat(opacity) {
    return new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity, depthWrite: false });
}

function faceMat(opacity) {
    return new THREE.MeshBasicMaterial({ color: '#1B2036', transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
}

// A box drawn as gold edges over a faint navy face, sitting on y = 0
function wireBox(w, h, d, lm, fm) {
    const g = new THREE.Group();
    const geo = new THREE.BoxGeometry(w, h, d);
    geo.translate(0, h / 2, 0);
    if (fm) g.add(new THREE.Mesh(geo, fm));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), lm));
    return g;
}

function wireGeo(geo, lm, fm) {
    const g = new THREE.Group();
    if (fm) g.add(new THREE.Mesh(geo, fm));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), lm));
    return g;
}

// Pitched roof as a triangular prism
function gable(w, h, d) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(0, h);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    geo.translate(0, 0, -d / 2);
    return geo;
}

// Deterministic pseudo-random so the skyline is the same on every visit
function seeded(seed) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

// ---------- Scenes ----------
// Each scene returns { group, mats, camera: {pos, look}, update(t, progress, local) }

// Why Choose Us: a blueprint tower assembling floor by floor
function aboutScene() {
    const group = new THREE.Group();
    const lm = lineMat(0.55), fm = faceMat(0.25), lmSoft = lineMat(0.25);
    const floors = [];
    const FL = 6, H = 1.6;
    for (let i = 0; i < FL; i++) {
        const f = new THREE.Group();
        f.add(wireBox(8, 0.18, 6, lm, fm));
        [-3.7, 0, 3.7].forEach(x => [-2.7, 2.7].forEach(z => {
            const c = wireBox(0.22, H - 0.18, 0.22, lm, null);
            c.position.set(x, 0.18, z);
            f.add(c);
        }));
        f.position.y = i * H;
        group.add(f);
        floors.push(f);
    }
    const roof = wireBox(8, 0.18, 6, lm, fm);
    roof.position.y = FL * H;
    group.add(roof);
    const grid = new THREE.GridHelper(40, 40, GOLD, GOLD);
    grid.material = lmSoft;
    group.add(grid);
    return {
        group, mats: [lm, fm, lmSoft],
        camera: { pos: new THREE.Vector3(22, 10, 30), look: new THREE.Vector3(0, 1.5, 0) },
        side: -1,
        update(t, p, local) {
            // Floors drop into place as the page opens, then the whole frame turns slowly
            floors.forEach((f, i) => {
                const k = THREE.MathUtils.clamp(local * 3 - i * 0.35, 0, 1);
                const e = 1 - Math.pow(1 - k, 3);
                f.position.y = i * H + (1 - e) * 6;
                f.visible = k > 0;
            });
            roof.visible = local > 0.9;
            group.rotation.y = t * 0.08 + p * 1.2;
        }
    };
}

// Services: a turning ring of building types, one per service
function servicesScene() {
    const group = new THREE.Group();
    const lm = lineMat(0.6), fm = faceMat(0.3);
    const ring = new THREE.Group();
    const models = [];

    const house = new THREE.Group();
    house.add(wireBox(3, 2, 2.6, lm, fm));
    const hr = wireGeo(gable(3.4, 1.4, 2.8), lm, fm); hr.position.y = 2; house.add(hr);
    models.push(house);

    const factory = new THREE.Group();
    factory.add(wireBox(4, 1.8, 2.6, lm, fm));
    for (let i = 0; i < 3; i++) {
        const s = new THREE.Shape();
        s.moveTo(0, 0); s.lineTo(1.33, 0); s.lineTo(1.33, 0.9); s.closePath();
        const geo = new THREE.ExtrudeGeometry(s, { depth: 2.6, bevelEnabled: false });
        geo.translate(-2 + i * 1.33, 1.8, -1.3);
        factory.add(wireGeo(geo, lm, fm));
    }
    const chimney = wireBox(0.35, 2, 0.35, lm, fm); chimney.position.set(1.5, 1.8, 0.8); factory.add(chimney);
    models.push(factory);

    const tower = new THREE.Group();
    [0, 1, 2, 3, 4].forEach(i => { const b = wireBox(2.2 - i * 0.18, 1, 2.2 - i * 0.18, lm, fm); b.position.y = i; tower.add(b); });
    models.push(tower);

    const temple = new THREE.Group();
    temple.add(wireBox(3, 1.6, 3, lm, fm));
    const dome = wireGeo(new THREE.SphereGeometry(1.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), lm, fm);
    dome.position.y = 1.6; temple.add(dome);
    const spire = wireGeo(new THREE.ConeGeometry(0.2, 1, 6), lm, fm); spire.position.y = 3.3; temple.add(spire);
    models.push(temple);

    const farm = new THREE.Group();
    farm.add(wireBox(4, 1.4, 2.2, lm, fm));
    const fr = wireGeo(gable(4.6, 1, 2.6), lm, fm); fr.position.y = 1.4; farm.add(fr);
    const silo = wireGeo(new THREE.CylinderGeometry(0.6, 0.6, 3, 10, 1), lm, fm); silo.position.set(2.8, 1.5, 0); farm.add(silo);
    models.push(farm);

    const R = 8;
    models.forEach((m, i) => {
        const a = (i / models.length) * Math.PI * 2;
        m.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
        m.rotation.y = a;
        ring.add(m);
    });
    group.add(ring);
    const base = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(R + 2.5, R + 2.5, 0.01, 60, 1)), lineMat(0.25));
    group.add(base);
    return {
        group, mats: [lm, fm, base.material],
        camera: { pos: new THREE.Vector3(0, 7, 22), look: new THREE.Vector3(0, 1.5, 0) },
        side: 0,
        update(t, p) {
            ring.rotation.y = t * 0.12 + p * Math.PI;
            models.forEach((m, i) => { m.position.y = Math.sin(t * 0.8 + i) * 0.25; });
        }
    };
}

// Portfolio: a skyline of projects rising out of the grid
function portfolioScene() {
    const group = new THREE.Group();
    const lm = lineMat(0.45), fm = faceMat(0.35), lmSoft = lineMat(0.2);
    const rand = seeded(7);
    const blocks = [];
    const N = isMobile ? 7 : 11, S = 3.2;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        if (rand() < 0.22) continue;
        const x = (i - (N - 1) / 2) * S, z = (j - (N - 1) / 2) * S;
        const d = Math.hypot(x, z);
        const h = 1 + rand() * 7 * Math.max(0.25, 1 - d / 24);
        const b = wireBox(2.2, h, 2.2, lm, fm);
        b.position.set(x, 0, z);
        b.userData = { h, delay: d / 24 + rand() * 0.15 };
        group.add(b);
        blocks.push(b);
    }
    const grid = new THREE.GridHelper(N * S + 6, N * 2, GOLD, GOLD);
    grid.material = lmSoft;
    group.add(grid);
    return {
        group, mats: [lm, fm, lmSoft],
        camera: { pos: new THREE.Vector3(22, 18, 26), look: new THREE.Vector3(0, 0, 0) },
        side: 0,
        update(t, p, local) {
            blocks.forEach(b => {
                const k = THREE.MathUtils.clamp(local * 2.2 - b.userData.delay, 0, 1);
                b.scale.y = Math.max(0.001, 1 - Math.pow(1 - k, 3));
                b.visible = k > 0;
            });
            group.rotation.y = t * 0.03 + p * 0.9;
        }
    };
}

// Testimonials: review cards drifting through space
function testimonialsScene() {
    const group = new THREE.Group();
    const lm = lineMat(0.5), fm = faceMat(0.45);
    const rand = seeded(11);
    const cards = [];
    const geo = new THREE.PlaneGeometry(3.2, 2);
    const dotMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.35, depthWrite: false });
    for (let i = 0; i < (isMobile ? 14 : 26); i++) {
        const c = wireGeo(geo, lm, fm);
        // Three gold lines stand in for the review text
        [0.35, 0, -0.35].forEach((y, k) => {
            const l = new THREE.Mesh(new THREE.PlaneGeometry(k === 2 ? 1.4 : 2.4, 0.08), dotMat);
            l.position.set(k === 2 ? -0.5 : 0, y, 0.01);
            c.add(l);
        });
        c.position.set((rand() - 0.5) * 34, (rand() - 0.5) * 18, -rand() * 30);
        c.rotation.set((rand() - 0.5) * 0.6, (rand() - 0.5) * 1.2, (rand() - 0.5) * 0.3);
        c.userData = { speed: 0.2 + rand() * 0.4, phase: rand() * 6 };
        group.add(c);
        cards.push(c);
    }
    return {
        group, mats: [lm, fm, dotMat],
        camera: { pos: new THREE.Vector3(0, 0, 16), look: new THREE.Vector3(0, 0, -8) },
        side: 0,
        update(t, p) {
            cards.forEach(c => {
                const u = c.userData;
                c.position.y += Math.sin(t * u.speed + u.phase) * 0.004;
                c.rotation.y += Math.sin(t * 0.3 + u.phase) * 0.0015;
            });
            group.position.z = p * 10;
        }
    };
}

// Contact: a pin dropped on the city, with pulses spreading from it
function contactScene() {
    const group = new THREE.Group();
    const lm = lineMat(0.35), fm = faceMat(0.3), lmSoft = lineMat(0.18);
    const rand = seeded(23);
    for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
        if (Math.abs(i) < 2 && Math.abs(j) < 2) continue;
        if (rand() < 0.35) continue;
        const h = 0.5 + rand() * 3 * Math.max(0.2, 1 - Math.hypot(i, j) / 9);
        const b = wireBox(1.6, h, 1.6, lm, fm);
        b.position.set(i * 2.4, 0, j * 2.4);
        group.add(b);
    }
    const grid = new THREE.GridHelper(34, 34, GOLD, GOLD);
    grid.material = lmSoft;
    group.add(grid);

    const pinMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.95 });
    const pin = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 16), pinMat);
    head.position.y = 3.2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.2, 24), pinMat);
    tip.rotation.x = Math.PI;
    tip.position.y = 1.9;
    pin.add(head, tip);
    group.add(pin);

    const pulses = [];
    for (let i = 0; i < 3; i++) {
        const m = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
        const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 48), m);
        r.rotation.x = -Math.PI / 2;
        r.position.y = 0.02;
        group.add(r);
        pulses.push(r);
    }
    return {
        group, mats: [lm, fm, lmSoft, pinMat],
        camera: { pos: new THREE.Vector3(0, 15, 20), look: new THREE.Vector3(0, 1, 0) },
        side: 1,
        update(t, p) {
            pin.position.y = Math.abs(Math.sin(t * 1.6)) * 0.6;
            pin.rotation.y = t * 0.6;
            pulses.forEach((r, i) => {
                const k = ((t * 0.45 + i / 3) % 1);
                r.scale.setScalar(1 + k * 7);
                r.userData.k = k;
            });
            group.rotation.y = Math.sin(t * 0.1) * 0.25 + p * 0.6;
        }
    };
}

// ---------- Which page is open ----------
const SECTION_SCENES = { about: 'about', 'services-section': 'services', portfolio: 'portfolio', testimonials: 'testimonials' };

function currentPage() {
    const fixed = document.body.dataset.scene3d;
    if (fixed) {
        // The portfolio walk-through draws its own scene, so stay off while it's on screen
        const walk = document.querySelector('.g3d-track');
        if (walk && walk.getBoundingClientRect().bottom > window.innerHeight * 0.3) return null;
        return { name: fixed, el: document.querySelector('.portfolio-page, main, .section') || document.body };
    }
    const contact = document.getElementById('contact-wrapper');
    if (contact) {
        const r = contact.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.5 && r.bottom > 0) return { name: 'contact', el: contact };
    }
    const open = document.querySelector('.hidden-section.section-visible');
    if (open && SECTION_SCENES[open.id]) return { name: SECTION_SCENES[open.id], el: open };
    return null;
}

function init() {
    const canvas = document.createElement('canvas');
    canvas.className = 'page3d-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    document.body.classList.add('has-page3d');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.5));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#0F1220', 22, 70);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);

    const scenes = {
        about: aboutScene(),
        services: servicesScene(),
        portfolio: portfolioScene(),
        testimonials: testimonialsScene(),
        contact: contactScene()
    };
    Object.values(scenes).forEach(s => {
        s.group.visible = false;
        s.fade = 0;
        s.local = 0;
        s.base = s.mats.map(m => m.opacity);
        scene.add(s.group);
    });

    function resize() {
        const w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    let pointerX = 0, pointerY = 0;
    window.addEventListener('pointermove', e => {
        pointerX = (e.clientX / window.innerWidth) * 2 - 1;
        pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    const clock = new THREE.Clock();
    const camPos = new THREE.Vector3(14, 9, 18), camLook = new THREE.Vector3(0, 3, 0);
    const tmp = new THREE.Vector3();
    let activeName = null, lastPage = null, pageChangedAt = 0;

    function frame() {
        requestAnimationFrame(frame);
        if (document.hidden) return;
        const t = reduceMotion ? 20 : clock.getElapsedTime();
        const page = currentPage();
        const name = page ? page.name : null;
        if (name !== lastPage) { lastPage = name; pageChangedAt = t; }
        if (name) activeName = name;
        canvas.classList.toggle('is-on', !!name);
        if (name && canvas.dataset.scene !== name) canvas.dataset.scene = name;

        let progress = 0;
        if (page) {
            const r = page.el.getBoundingClientRect();
            const span = Math.max(1, r.height - window.innerHeight * 0.5);
            progress = THREE.MathUtils.clamp(-r.top / span, 0, 1);
        }

        let anyVisible = false;
        Object.entries(scenes).forEach(([key, s]) => {
            const on = key === name;
            s.fade += ((on ? 1 : 0) - s.fade) * (reduceMotion ? 1 : 0.06);
            if (on) s.local = reduceMotion ? 1 : Math.min(1, (t - pageChangedAt) / 2.2);
            s.group.visible = s.fade > 0.01;
            if (!s.group.visible) { if (!on) s.local = 0; return; }
            anyVisible = true;
            s.mats.forEach((m, i) => { m.opacity = s.base[i] * s.fade; });
            s.update(t, on ? progress : 0, s.local);
        });
        // Pulses fade as they spread
        const c = scenes.contact;
        if (c.group.visible) {
            c.group.children.forEach(o => {
                if (o.userData && o.userData.k !== undefined) o.material.opacity = (1 - o.userData.k) * 0.6 * c.fade;
            });
        }
        if (!anyVisible) return;

        const s = scenes[activeName];
        if (s) {
            // Scenes sit beside the copy on wide screens so text stays readable
            const shift = window.innerWidth > 900 ? s.side * 7 : 0;
            // Narrow screens pull the camera back so the scene fits the width
            const pull = camera.aspect < 0.8 ? 1.7 : 1;
            tmp.copy(s.camera.pos).sub(s.camera.look).multiplyScalar(pull).add(s.camera.look);
            tmp.x += pointerX * 2.5 - shift;
            tmp.y += -pointerY * 1.5;
            camPos.lerp(tmp, reduceMotion ? 1 : 0.05);
            tmp.copy(s.camera.look);
            tmp.x -= shift;
            camLook.lerp(tmp, reduceMotion ? 1 : 0.05);
        }
        camera.position.copy(camPos);
        camera.lookAt(camLook);
        renderer.render(scene, camera);
    }
    frame();
}

initTilt();
if (webglAvailable()) init();
