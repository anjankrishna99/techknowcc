/* ============================================
   TECHKNOW — Project Portfolio as a 3D ring
   The category cards stand on a slowly turning ring. Drag or swipe to
   spin it, use the arrows, or tap a card to bring it to the front; tapping
   the front card opens that category. Without JS the grid stays as is.
   ============================================ */
(function () {
    const grid = document.querySelector('#portfolio .project-cards-grid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.project-card')];
    const n = cards.length;
    if (n < 3) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STEP = (Math.PI * 2) / n;

    // ---------- Build the stage ----------
    const stage = document.createElement('div');
    stage.className = 'pring-stage';
    const ring = document.createElement('div');
    ring.className = 'pring';
    const floor = document.createElement('div');
    floor.className = 'pring-floor';
    stage.appendChild(floor);
    const slots = cards.map(card => {
        const slot = document.createElement('div');
        slot.className = 'pring-slot';
        slot.appendChild(card);
        ring.appendChild(slot);
        return slot;
    });
    stage.appendChild(ring);

    const controls = document.createElement('div');
    controls.className = 'pring-controls';
    controls.innerHTML = `
        <button type="button" class="pring-btn pring-prev" aria-label="Previous category">&#10094;</button>
        <div class="pring-dots">${cards.map((c, i) => `<button type="button" class="pring-dot" aria-label="${(c.querySelector('h3')?.textContent || 'Category ' + (i + 1)).trim()}"></button>`).join('')}</div>
        <button type="button" class="pring-btn pring-next" aria-label="Next category">&#10095;</button>`;
    const hint = document.createElement('p');
    hint.className = 'pring-hint';
    hint.textContent = 'Drag to spin · tap the front card to open';

    grid.classList.add('is-ring');
    grid.append(stage, controls, hint);
    const dots = [...controls.querySelectorAll('.pring-dot')];

    // ---------- State ----------
    let angle = 0;          // current ring rotation (radians)
    let target = null;      // snap target, or null while free-spinning
    let velocity = 0;
    let dragging = false, moved = 0, lastX = 0, lastT = 0;
    let idleUntil = 0;      // auto-spin pauses after interaction
    let hovering = false;
    let radius = 360, lift = 84;

    function measure() {
        const w = slots[0].offsetWidth || 320;
        // Leave a gap between neighbouring cards on the circle
        radius = Math.max(w * 1.35, (w / 2) / Math.tan(Math.PI / n) * 1.12);
        stage.style.setProperty('--pring-r', radius + 'px');
        stage.style.setProperty('--pring-h', (slots[0].offsetHeight || 210) + 'px');
        lift = window.innerWidth <= 768 ? 64 : 125;
    }

    const front = () => ((Math.round(-angle / STEP) % n) + n) % n;

    function snapTo(i) {
        // Shortest way round to card i
        const base = -i * STEP;
        const k = Math.round((angle - base) / (Math.PI * 2));
        target = base + k * Math.PI * 2;
        idleUntil = performance.now() + 5000;
    }

    function layout() {
        const f = front();
        slots.forEach((slot, i) => {
            const a = angle + i * STEP;
            const x = Math.sin(a) * radius;
            const z = Math.cos(a) * radius - radius;
            const depth = (Math.cos(a) + 1) / 2;      // 1 at the front, 0 at the back
            const y = -(1 - depth) * lift;           // cards further round sit higher, so the ring reads as a circle
            slot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${(-Math.sin(a) * 18).toFixed(2)}deg)`;
            slot.style.opacity = (0.28 + 0.72 * depth).toFixed(3);
            slot.style.filter = `brightness(${(0.45 + 0.55 * depth).toFixed(3)})`;
            slot.style.zIndex = String(Math.round(depth * 100));
            slot.classList.toggle('is-front', i === f);
        });
        dots.forEach((d, i) => d.classList.toggle('active', i === f));
    }

    // ---------- Input ----------
    stage.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        dragging = true; moved = 0; lastX = e.clientX; lastT = performance.now();
        velocity = 0; target = null;
    });
    window.addEventListener('pointermove', e => {
        if (!dragging) return;
        const now = performance.now();
        const dx = e.clientX - lastX;
        moved += Math.abs(dx);
        const da = dx / (radius * 1.6);
        angle += da;
        velocity = da / Math.max(1, now - lastT) * 16;
        lastX = e.clientX; lastT = now;
    });
    const release = () => {
        if (!dragging) return;
        dragging = false;
        idleUntil = performance.now() + 5000;
        // Let it coast, then settle on the nearest card
        const coast = angle + velocity * 18;
        target = -Math.round(-coast / STEP) * STEP;
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    stage.addEventListener('mouseenter', () => { hovering = true; });
    stage.addEventListener('mouseleave', () => { hovering = false; });

    // Clicks: a drag never opens a card; a side card turns to the front first
    stage.addEventListener('click', e => {
        const slot = e.target.closest('.pring-slot');
        if (!slot) return;
        if (moved > 6 || !slot.classList.contains('is-front')) {
            e.stopPropagation();
            e.preventDefault();
            if (moved <= 6) snapTo(slots.indexOf(slot));
        }
    }, true);

    controls.querySelector('.pring-prev').addEventListener('click', () => snapTo((front() - 1 + n) % n));
    controls.querySelector('.pring-next').addEventListener('click', () => snapTo((front() + 1) % n));
    dots.forEach((d, i) => d.addEventListener('click', () => snapTo(i)));
    stage.tabIndex = 0;
    stage.setAttribute('aria-label', 'Project categories. Use the arrow keys to turn.');
    stage.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); snapTo((front() + 1) % n); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); snapTo((front() - 1 + n) % n); }
        if (e.key === 'Enter') { slots[front()].querySelector('.project-card')?.click(); }
    });

    // ---------- Loop ----------
    let last = performance.now();
    function tick(now) {
        requestAnimationFrame(tick);
        const dt = Math.min(50, now - last); last = now;
        if (!grid.offsetParent || document.hidden) return;   // section closed or tab hidden
        if (!dragging) {
            if (target !== null) {
                angle += (target - angle) * Math.min(1, dt * 0.009);
                if (Math.abs(target - angle) < 0.0004) { angle = target; target = null; }
            } else if (!reduceMotion && !hovering && now > idleUntil) {
                angle -= dt * 0.00018;                       // slow auto spin
            }
        }
        layout();
    }

    window.addEventListener('resize', () => { measure(); layout(); });
    measure();
    layout();
    requestAnimationFrame(tick);

    // The section starts hidden, so measure again once it opens
    new ResizeObserver(() => { measure(); layout(); }).observe(grid);
})();
