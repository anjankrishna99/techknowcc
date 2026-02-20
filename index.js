/* ============================================
   TECHKNOW CONSTRUCTIONS — Interactive JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ---------- DOM References ----------
    const header = document.getElementById('main-header');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const navItems = document.querySelectorAll('.nav-link');
    const enquiryModal = document.getElementById('enquiry-modal');
    const btnEnquiryHeader = document.getElementById('btn-enquiry-header');
    const modalClose = document.getElementById('modal-close');
    const toast = document.getElementById('toast');
    const heroParticles = document.getElementById('hero-particles');
    const revealElements = document.querySelectorAll('.reveal');

    // ---------- Sticky Header ----------
    let lastScroll = 0;

    function handleScroll() {
        const scrollY = window.scrollY;

        if (scrollY > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Update active nav link based on scroll position
        const sections = document.querySelectorAll('section[id]');
        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (scrollY >= sectionTop) {
                currentSection = section.getAttribute('id');
            }
        });

        navItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });

        lastScroll = scrollY;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // ---------- Mobile Menu ----------
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close mobile menu on link click
    navItems.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // ---------- Enquiry Modal ----------
    function openModal() {
        enquiryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        enquiryModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    btnEnquiryHeader.addEventListener('click', openModal);
    modalClose.addEventListener('click', closeModal);

    enquiryModal.addEventListener('click', (e) => {
        if (e.target === enquiryModal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // ---------- Toast Notification ----------
    function showToast() {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // ---------- Form Submissions ----------
    const forms = document.querySelectorAll('#enquiry-form-inline, #enquiry-form-modal');

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            // Close modal if it was the modal form
            if (form.id === 'enquiry-form-modal') {
                closeModal();
            }

            // Let the form submit naturally to FormSubmit.co (no preventDefault)
        });
    });

    // ---------- Scroll Reveal (Intersection Observer) ----------
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const delay = el.dataset.delay || 0;

                setTimeout(() => {
                    el.classList.add('visible');
                }, parseInt(delay));

                revealObserver.unobserve(el);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // ---------- Counter Animation ----------
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsContainer = document.querySelector('.hero-stats');
    if (statsContainer) {
        counterObserver.observe(statsContainer);
    }

    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number');

        counters.forEach(counter => {
            const target = parseInt(counter.dataset.target);
            const duration = 2000;
            const startTime = performance.now();

            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(eased * target);

                counter.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                }
            }

            requestAnimationFrame(updateCounter);
        });
    }

    // ---------- Hero Particles ----------
    function createParticles() {
        if (!heroParticles) return;

        const count = window.innerWidth < 768 ? 12 : 25;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');

            const size = Math.random() * 4 + 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${Math.random() * 8 + 6}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;

            heroParticles.appendChild(particle);
        }
    }

    createParticles();

    // ---------- Smooth Scroll for anchor links ----------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ---------- Parallax on hero (subtle) ----------
    let ticking = false;

    function handleParallax() {
        const scrollY = window.scrollY;
        const heroContent = document.querySelector('.hero-content');

        if (heroContent && scrollY < window.innerHeight) {
            const parallaxAmount = scrollY * 0.3;
            const opacity = 1 - (scrollY / (window.innerHeight * 0.8));
            heroContent.style.transform = `translateY(${parallaxAmount}px)`;
            heroContent.style.opacity = Math.max(opacity, 0);
        }

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(handleParallax);
            ticking = true;
        }
    }, { passive: true });

    // ---------- Card tilt effect on hover ----------
    const cards = document.querySelectorAll('.service-card, .portfolio-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / centerY * -3;
            const rotateY = (x - centerX) / centerX * 3;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
    // ---------- Testimonials Carousel ----------
    const track = document.getElementById('testimonials-track');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (track && prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            const card = track.querySelector('.testimonial-card');
            if (card) {
                const cardWidth = card.offsetWidth;
                const gap = 24;
                track.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
            }
        });

        nextBtn.addEventListener('click', () => {
            const card = track.querySelector('.testimonial-card');
            if (card) {
                const cardWidth = card.offsetWidth;
                const gap = 24;
                track.scrollBy({ left: (cardWidth + gap), behavior: 'smooth' });
            }
        });
    }

    // ---------- Services Carousel ----------
    const servicesTrack = document.getElementById('services-track');
    const servicesPrevBtn = document.getElementById('services-prev-btn');
    const servicesNextBtn = document.getElementById('services-next-btn');

    if (servicesTrack && servicesPrevBtn && servicesNextBtn) {
        servicesPrevBtn.addEventListener('click', () => {
            const card = servicesTrack.querySelector('.service-card');
            if (card) {
                const cardWidth = card.offsetWidth;
                const gap = 24;
                servicesTrack.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
            }
        });

        servicesNextBtn.addEventListener('click', () => {
            const card = servicesTrack.querySelector('.service-card');
            if (card) {
                const cardWidth = card.offsetWidth;
                const gap = 24;
                servicesTrack.scrollBy({ left: (cardWidth + gap), behavior: 'smooth' });
            }
        });
    }

});
