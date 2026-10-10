/* ============================================
   TECHKNOW — 3D walk-through for the portfolio pages
   The projects on the page hang as framed photos in a dusk gallery.
   Scrolling walks the camera past them one by one; the focused project's
   details sit beside it. Clicking the focused photo opens its gallery.
   The grid of cards stays below as the overview, and is all that shows
   when WebGL is missing or reduced motion is on.
   ============================================ */
import * as THREE from 'three';

const GOLD = '#E3B26B';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches;

function webglAvailable() {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) {
        return false;
    }
}

function seeded(seed) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

const smooth = x => x * x * (3 - 2 * x);
const clamp01 = x => Math.min(1, Math.max(0, x));
const pad = n => String(n).padStart(2, '0');

function buildDom(section, items) {
    const titleHtml = section.querySelector('.section-title')?.innerHTML || 'Our <span class="text-gradient">Projects</span>';
    const seg = isMobile ? 55 : 70;
    const track = document.createElement('section');
    track.className = 'g3d-track';
    track.style.height = `calc(100vh + ${Math.max(0, items.length - 1) * seg + 40}vh)`;
    track.innerHTML = `
        <div class="g3d-stage">
            <canvas class="g3d-canvas" aria-hidden="true"></canvas>
            <div class="g3d-head">
                <p class="g3d-eyebrow">Portfolio</p>
                <h1 class="g3d-title">${titleHtml}</h1>
            </div>
            <div class="g3d-info" aria-live="polite">
                <div class="g3d-meta"><span class="g3d-count"></span><span class="g3d-year"></span></div>
                <h2 class="g3d-name"></h2>
                <p class="g3d-loc"></p>
                <button type="button" class="btn btn-primary g3d-open">View Gallery</button>
            </div>
            <div class="g3d-nav">
                <button type="button" class="g3d-prev" aria-label="Previous project">&#10094;</button>
                <button type="button" class="g3d-next" aria-label="Next project">&#10095;</button>
            </div>
            <div class="g3d-hint">Scroll to walk through the projects</div>
            <div class="g3d-progress"><span></span></div>
        </div>`;
    section.parentNode.insertBefore(track, section);
    const desc = section.querySelector('.section-desc');
    if (desc) desc.textContent = 'Every project at a glance.';
    return track;
}

function init() {
    const section = document.querySelector('.portfolio-page');
    const cards = [...document.querySelectorAll('.project-cards-grid .project-card')];
    if (!section || !cards.length) return;
    const items = cards.map(card => ({
        card,
        src: card.querySelector('img')?.getAttribute('src'),
        title: card.querySelector('h3')?.textContent.trim() || '',
        loc: card.querySelector('.project-location')?.textContent.trim() || '',
        year: card.querySelector('.project-year')?.textContent.trim() || ''
    }));
    const n = items.length;

    const track = buildDom(section, items);
    document.body.classList.add('has-g3d');
    if (n < 2) track.querySelector('.g3d-nav').hidden = true;
    const stage = track.querySelector('.g3d-stage');
    const canvas = track.querySelector('.g3d-canvas');
    const info = track.querySelector('.g3d-info');
    const ui = {
        count: track.querySelector('.g3d-count'),
        year: track.querySelector('.g3d-year'),
        name: track.querySelector('.g3d-name'),
        loc: track.querySelector('.g3d-loc'),
        bar: track.querySelector('.g3d-progress span'),
        hint: track.querySelector('.g3d-hint')
    };

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#0D1020', 9, 34);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);

    // ---------- Layout ----------
    const SP = 7;                                  // depth between projects
    const SIDE = isMobile ? 0.7 : 3.4;             // alternate left / right
    const FH = isMobile ? 2.4 : 3.1;               // frame height
    const FW = isMobile ? 2.9 : 4.4;               // frame width
    const CY = FH / 2 + 0.45;                      // frame centre height
    const DIST = isMobile ? 9.3 : 9.2;
    const pos = i => ({ x: (i % 2 ? 1 : -1) * SIDE * (n > 1 ? 1 : 0), z: -i * SP });

    // ---------- Floor: blueprint grid and a faint glow strip ----------
    const length = (n - 1) * SP + 40;
    const grid = new THREE.GridHelper(Math.max(80, length * 1.2), Math.round(Math.max(80, length * 1.2) / 1.5), GOLD, GOLD);
    grid.material.transparent = true;
    grid.material.opacity = 0.09;
    grid.material.depthWrite = false;
    grid.position.z = -(n - 1) * SP / 2;
    scene.add(grid);

    const path = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, length),
        new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.05, depthWrite: false })
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.005, -(n - 1) * SP / 2 + 10);
    scene.add(path);

    // ---------- Wireframe city at the edges for depth ----------
    const rnd = seeded(29);
    const cityMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.16 });
    const boxGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
    for (let z = 12; z > -(n - 1) * SP - 30; z -= 3.2) {
        for (const s of [-1, 1]) {
            if (rnd() < 0.25) continue;
            const w = 1.6 + rnd() * 2.6, h = 2 + rnd() * 9, d = 1.6 + rnd() * 2.4;
            const b = new THREE.LineSegments(boxGeo, cityMat);
            b.scale.set(w, h, d);
            b.position.set(s * (11 + rnd() * 9), h / 2, z + rnd() * 2);
            scene.add(b);
        }
    }

    // ---------- Floating dust ----------
    const dustCount = isMobile ? 160 : 320;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
        dustPos[i * 3] = (rnd() - 0.5) * 22;
        dustPos[i * 3 + 1] = rnd() * 8;
        dustPos[i * 3 + 2] = 10 - rnd() * (length + 10);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: '#F6CD86', size: 0.05, transparent: true, opacity: 0.55, depthWrite: false }));
    scene.add(dust);

    // ---------- Framed photos ----------
    const loader = new THREE.TextureLoader();
    const panelGeo = new THREE.BoxGeometry(FW + 0.2, FH + 0.2, 0.1);
    const edgeGeo = new THREE.EdgesGeometry(panelGeo);
    const photoGeo = new THREE.PlaneGeometry(FW, FH);
    const frames = items.map((item, i) => {
        const p = pos(i);
        const g = new THREE.Group();
        g.position.set(p.x, CY, p.z);
        g.userData.baseRy = n > 1 ? -Math.sign(p.x) * 0.38 : 0;

        const panel = new THREE.Mesh(panelGeo, new THREE.MeshBasicMaterial({ color: '#141a2e', transparent: true }));
        const edge = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.5 }));
        const photoMat = new THREE.MeshBasicMaterial({ color: '#2a3048', transparent: true });
        const photo = new THREE.Mesh(photoGeo, photoMat);
        photo.position.z = 0.06;
        photo.userData.index = i;

        // Soft reflection on the floor
        const reflMat = new THREE.MeshBasicMaterial({ color: '#2a3048', transparent: true, opacity: 0.1, depthWrite: false });
        const refl = new THREE.Mesh(photoGeo, reflMat);
        refl.scale.y = -1;
        refl.position.set(0, -2 * CY, 0.06);

        // Plinth line under the frame
        const plinth = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(FW + 0.6, 0.12, 0.7)),
            new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.35 })
        );
        plinth.position.y = -CY + 0.06;

        g.add(panel, edge, photo, refl, plinth);
        scene.add(g);

        const fadeMats = [panel.material, edge.material, photoMat, reflMat, plinth.material];
        const f = { g, photo, photoMat, reflMat, edge, fadeMats, base: fadeMats.map(m => m.opacity), loaded: false, item };
        f.load = () => {
            if (f.loaded || !item.src) return;
            f.loaded = true;
            loader.load(item.src, tex => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
                const img = tex.image;
                const ia = img.width / img.height, fa = FW / FH;
                // Crop the photo to fill the frame
                if (ia > fa) { tex.repeat.set(fa / ia, 1); tex.offset.set((1 - fa / ia) / 2, 0); }
                else { tex.repeat.set(1, ia / fa); tex.offset.set(0, (1 - ia / fa) / 2); }
                [photoMat, reflMat].forEach(m => { m.map = tex; m.color.set('#ffffff'); m.needsUpdate = true; });
            });
        };
        return f;
    });
    const photos = frames.map(f => f.photo);

    // ---------- Sizing ----------
    function resize() {
        const w = stage.clientWidth, h = stage.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    // ---------- Scroll position ----------
    function progress() {
        const r = track.getBoundingClientRect();
        const span = Math.max(1, track.offsetHeight - window.innerHeight);
        return clamp01(-r.top / span);
    }
    function goTo(i) {
        i = Math.max(0, Math.min(n - 1, i));
        const span = Math.max(1, track.offsetHeight - window.innerHeight);
        const top = track.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + (n > 1 ? i / (n - 1) : 0) * span, behavior: 'smooth' });
    }

    let focus = -1;
    function showInfo(i) {
        if (i === focus) return;
        const first = focus === -1;
        focus = i;
        const it = items[i];
        const apply = () => {
            ui.count.textContent = `${pad(i + 1)} / ${pad(n)}`;
            ui.year.textContent = it.year;
            ui.name.textContent = it.title;
            ui.loc.textContent = it.loc;
            info.classList.remove('is-swapping');
        };
        if (first) { apply(); return; }
        info.classList.add('is-swapping');
        clearTimeout(showInfo.t);
        showInfo.t = setTimeout(apply, 180);
    }

    track.querySelector('.g3d-open').addEventListener('click', () => items[focus]?.card.click());
    track.querySelector('.g3d-prev').addEventListener('click', () => goTo(focus - 1));
    track.querySelector('.g3d-next').addEventListener('click', () => goTo(focus + 1));
    window.addEventListener('keydown', e => {
        const r = track.getBoundingClientRect();
        if (r.top > 1 || r.bottom < window.innerHeight - 1) return;
        if (document.querySelector('.lightbox-overlay.active, .modal-overlay.active')) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(focus + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(focus - 1); }
    });

    // ---------- Pointer: parallax, hover and click ----------
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let px = 0, py = 0, downAt = null;
    function hit(e) {
        const r = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const h = ray.intersectObjects(photos).find(x => x.object.parent.visible);
        return h ? h.object.userData.index : -1;
    }
    stage.addEventListener('pointermove', e => {
        px = (e.clientX / window.innerWidth) * 2 - 1;
        py = (e.clientY / window.innerHeight) * 2 - 1;
        if (e.pointerType === 'mouse') canvas.style.cursor = hit(e) >= 0 ? 'pointer' : '';
    }, { passive: true });
    canvas.addEventListener('pointerdown', e => { downAt = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', e => {
        if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) return;
        downAt = null;
        const i = hit(e);
        if (i < 0) return;
        if (i === focus) items[i].card.click();
        else goTo(i);
    });

    // ---------- Render loop ----------
    const clock = new THREE.Clock();
    let f = progress() * (n - 1);
    let first = true;
    const camPos = new THREE.Vector3(), look = new THREE.Vector3(), target = new THREE.Vector3();

    function frame() {
        requestAnimationFrame(frame);
        if (document.hidden) return;
        const r = track.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const t = clock.getElapsedTime();
        const p = progress();
        const goal = p * (n - 1);
        f += (goal - f) * (reduceMotion ? 1 : 0.08);
        if (Math.abs(goal - f) < 0.0005) f = goal;

        const i0 = Math.floor(f), i1 = Math.min(n - 1, i0 + 1), k = smooth(f - i0);
        const x = pos(i0).x + (pos(i1).x - pos(i0).x) * k;
        const z = -f * SP;
        const lead = isMobile ? 0 : 1.6;           // keep the photo right of the details on wide screens

        target.set(x * 0.55 + px * 0.5, CY + 0.5 - py * 0.3, z + DIST);
        if (first) { camPos.copy(target); first = false; } else camPos.lerp(target, 0.12);
        camera.position.copy(camPos);
        look.set(x - lead, CY - (isMobile ? 0.6 : 0.15), z);
        camera.lookAt(look);

        const fi = Math.round(f);
        showInfo(fi);
        frames.forEach((fr, i) => {
            const d = Math.abs(i - f);
            if (d < 2.5) fr.load();
            const near = 1 - Math.min(1, d);
            const e = smooth(near);
            fr.g.rotation.y = fr.g.userData.baseRy * (1 - e) + Math.sin(t * 0.4 + i) * 0.015;
            fr.g.position.y = CY + Math.sin(t * 0.6 + i * 1.3) * 0.04;
            fr.g.scale.setScalar(0.9 + 0.1 * e);
            const lit = 0.38 + 0.62 * e;
            if (fr.photoMat.map) fr.photoMat.color.setScalar(lit);
            fr.base[1] = 0.25 + 0.75 * e;
            // Projects already walked past fade away so they don't block the view
            const gone = i < f ? clamp01((f - i - 0.12) / 0.4) : 0;
            fr.g.visible = gone < 0.99;
            fr.fadeMats.forEach((m, j) => { m.opacity = fr.base[j] * (1 - gone); });
            fr.g.position.x = pos(i).x + Math.sign(pos(i).x || 1) * gone * 1.5;
        });
        dust.rotation.y = Math.sin(t * 0.05) * 0.02;
        dust.position.y = Math.sin(t * 0.3) * 0.15;

        ui.bar.style.width = `${(n > 1 ? f / (n - 1) : 1) * 100}%`;
        ui.hint.style.opacity = p > 0.02 ? 0 : 1;
        renderer.render(scene, camera);
    }
    frames.slice(0, 3).forEach(fr => fr.load());
    frame();
}

if (!reduceMotion && webglAvailable()) init();
