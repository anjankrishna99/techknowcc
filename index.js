/* ============================================
   TECHKNOW CONSTRUCTIONS — Immersive Interactive JS
   ============================================ */

window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => {
                preloader.remove();
                // trigger entrance animations if needed, though they are intersection observer based
            }, 500);
        }, 300); // Small enforced delay so the spinner is visible briefly
    }
});

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
    const scrollProgress = document.getElementById('scroll-progress');
    const cursorGlow = document.getElementById('cursor-glow');

    // Collect all revealable elements (standard + directional)
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    // ---------- Scroll Progress Bar ----------
    function updateScrollProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        if (scrollProgress) {
            scrollProgress.style.width = scrollPercent + '%';
        }
    }

    // ---------- Sticky Header + Active Nav ----------
    let lastScroll = 0;

    function handleScroll() {
        const scrollY = window.scrollY;

        if (scrollY > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Hide scroll indicator after scrolling
        if (scrollY > 200) {
            document.body.classList.add('scrolled-past');
        } else {
            document.body.classList.remove('scrolled-past');
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

        // Update scroll progress
        updateScrollProgress();

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
            if (form.id === 'enquiry-form-modal') {
                closeModal();
            }
            // Let the form submit naturally to FormSubmit.co
        });
    });

    // ---------- Enhanced Scroll Reveal (Intersection Observer) ----------
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
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
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

    const statsContainer = document.querySelector('.hero-stats-new');
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

        const count = window.innerWidth < 768 ? 15 : 30;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');

            const size = Math.random() * 5 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${Math.random() * 10 + 6}s`;
            particle.style.animationDelay = `${Math.random() * 6}s`;

            heroParticles.appendChild(particle);
        }
    }

    createParticles();

    // ---------- Smooth Scroll for anchor links ----------
    // Reference to hero section
    const heroSection = document.getElementById('home');

    function scrollToSection(target, queryString = null) {
        if (!target) return;

        const isDynamic = target.classList.contains('hidden-section');

        if (isDynamic) {
            // 1. Hide the hero section so it doesn't appear above
            if (heroSection) {
                heroSection.classList.add('hero-hidden');
            }

            // 2. Instantly close other hidden sections (no transition)
            document.querySelectorAll('.hidden-section').forEach(sec => {
                if (sec !== target) {
                    sec.style.transition = 'none';
                    sec.classList.remove('section-visible');
                    void sec.offsetHeight;
                    sec.style.transition = '';
                }
            });

            // 3. Reveal target section
            target.classList.add('section-visible');
            void target.offsetHeight;

            // 4. Instantly scroll to top so section starts at the top
            window.scrollTo({ top: 0, behavior: 'instant' });

        } else {
            // Non-dynamic section — smooth scroll to it
            const headerElement = document.querySelector('header');
            const headerHeight = headerElement ? headerElement.offsetHeight : 80;
            const targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            window.scrollTo({
                top: targetPos,
                behavior: 'smooth'
            });
        }

        // Handle specific gallery filtering
        if (queryString) {
            const params = new URLSearchParams(queryString);
            const cat = params.get('cat');
            if (cat) {
                const filterBtn = document.querySelector(`.filter-btn[data-filter="${cat}"]`);
                if (filterBtn) {
                    setTimeout(() => filterBtn.click(), 300);
                }
            }
        }
    }

    function showHome() {
        // Hide all dynamic sections instantly
        document.querySelectorAll('.hidden-section').forEach(sec => {
            sec.style.transition = 'none';
            sec.classList.remove('section-visible');
            void sec.offsetHeight;
            sec.style.transition = '';
        });
        // Show the hero section again
        if (heroSection) {
            heroSection.classList.remove('hero-hidden');
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');

            // Handle Home link
            if (href === '#' || href === '#home') {
                e.preventDefault();
                showHome();
                navItems.forEach(link => link.classList.remove('active'));
                anchor.classList.add('active');
                // Close mobile menu
                hamburger.classList.remove('active');
                navLinks.classList.remove('open');
                document.body.style.overflow = '';
                return;
            }

            e.preventDefault();
            const [sectionId, queryString] = href.split('?');
            const target = document.querySelector(sectionId);

            if (target) {
                scrollToSection(target, queryString);
                navItems.forEach(link => link.classList.remove('active'));
                anchor.classList.add('active');
            }
        });
    });

    // Handle initial hash on load
    if (window.location.hash) {
        const hash = window.location.hash;
        const [sectionId, queryString] = hash.split('?');
        const target = document.querySelector(sectionId);
        if (target) {
            setTimeout(() => {
                scrollToSection(target, queryString);
            }, 600); // Wait for hero animations
        }
    }

    // ---------- Parallax on hero (subtle) ----------
    let ticking = false;

    function handleParallax() {
        const scrollY = window.scrollY;
        const heroContent = document.querySelector('.hero-content');
        const heroBg = document.querySelector('.hero-gradient');

        if (heroContent && scrollY < window.innerHeight) {
            const parallaxAmount = scrollY * 0.3;
            const opacity = 1 - (scrollY / (window.innerHeight * 0.8));
            heroContent.style.transform = `translateY(${parallaxAmount}px)`;
            heroContent.style.opacity = Math.max(opacity, 0);
        }

        // Subtle parallax on hero gradient
        if (heroBg && scrollY < window.innerHeight) {
            heroBg.style.transform = `translateY(${scrollY * 0.15}px)`;
        }

        // Parallax particles
        if (heroParticles && scrollY < window.innerHeight) {
            heroParticles.style.transform = `translateY(${scrollY * 0.4}px)`;
        }

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(handleParallax);
            ticking = true;
        }
    }, { passive: true });

    // ---------- Card Tilt + Shine Effect ----------
    const interactiveCards = document.querySelectorAll('.service-card, .portfolio-card');

    interactiveCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / centerY * -4;
            const rotateY = (x - centerX) / centerX * 4;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;

            // Update CSS custom properties for shine effect
            const percentX = (x / rect.width) * 100;
            const percentY = (y / rect.height) * 100;
            card.style.setProperty('--mouse-x', percentX + '%');
            card.style.setProperty('--mouse-y', percentY + '%');
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.setProperty('--mouse-x', '50%');
            card.style.setProperty('--mouse-y', '50%');
        });
    });

    // ---------- Cursor Glow (Desktop Only) ----------
    if (cursorGlow && !('ontouchstart' in window)) {
        let glowX = 0, glowY = 0;
        let currentX = 0, currentY = 0;

        document.addEventListener('mousemove', (e) => {
            glowX = e.clientX;
            glowY = e.clientY;
            cursorGlow.classList.add('active');
        });

        document.addEventListener('mouseleave', () => {
            cursorGlow.classList.remove('active');
        });

        function animateGlow() {
            // Smooth follow with lerp
            currentX += (glowX - currentX) * 0.08;
            currentY += (glowY - currentY) * 0.08;
            cursorGlow.style.left = currentX + 'px';
            cursorGlow.style.top = currentY + 'px';
            requestAnimationFrame(animateGlow);
        }

        animateGlow();
    }

    // ---------- Magnetic Buttons ----------
    const magneticBtns = document.querySelectorAll('[data-magnetic]');

    if (!('ontouchstart' in window)) {
        magneticBtns.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });

            // Ripple on click
            btn.addEventListener('click', (e) => {
                const ripple = document.createElement('span');
                ripple.classList.add('btn-ripple');
                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                btn.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    // ---------- Typewriter Effect on Hero Tag ----------
    const heroTag = document.querySelector('.hero-tag');
    if (heroTag) {
        const fullText = heroTag.textContent;
        heroTag.textContent = '';

        // Add cursor element
        const cursor = document.createElement('span');
        cursor.classList.add('typewriter-cursor');
        heroTag.appendChild(cursor);

        let charIndex = 0;
        const typeDelay = 45;

        function typeWriter() {
            if (charIndex < fullText.length) {
                heroTag.insertBefore(
                    document.createTextNode(fullText.charAt(charIndex)),
                    cursor
                );
                charIndex++;
                setTimeout(typeWriter, typeDelay);
            } else {
                // Remove cursor after a pause
                setTimeout(() => {
                    cursor.style.animation = 'none';
                    cursor.style.opacity = '0';
                    cursor.style.transition = 'opacity 0.5s';
                }, 2500);
            }
        }

        // Start typewriter after hero reveal animation
        setTimeout(typeWriter, 600);
    }

    // ---------- Text Scramble on Hero Title ----------
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const textNodes = [];
        const walker = document.createTreeWalker(heroTitle, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim().length > 0) {
                textNodes.push({ node, original: node.textContent });
            }
        }

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let scrambleFrame = 0;
        const totalFrames = 20;

        function scrambleText() {
            textNodes.forEach(({ node, original }) => {
                const progress = scrambleFrame / totalFrames;
                const revealed = Math.floor(progress * original.length);

                let result = '';
                for (let i = 0; i < original.length; i++) {
                    if (original[i] === ' ' || original[i] === '\n') {
                        result += original[i];
                    } else if (i < revealed) {
                        result += original[i];
                    } else {
                        result += chars[Math.floor(Math.random() * chars.length)];
                    }
                }
                node.textContent = result;
            });

            scrambleFrame++;

            if (scrambleFrame <= totalFrames) {
                setTimeout(scrambleText, 40);
            } else {
                // Ensure original text is restored
                textNodes.forEach(({ node, original }) => {
                    node.textContent = original;
                });
            }
        }

        // Start scramble after hero reveal delay
        setTimeout(scrambleText, 800);
    }

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

    // ---------- Intersection Observer for Value Cards (Stagger Children) ----------
    const valueCards = document.querySelectorAll('.value-card');
    const valueObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                valueObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    valueCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        valueObserver.observe(card);
    });

    // ---------- Portfolio Cards Stagger ----------
    const portfolioCards = document.querySelectorAll('.portfolio-card');
    const portfolioObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, parseInt(delay));
                portfolioObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    portfolioCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        portfolioObserver.observe(card);
    });

    // ---------- Smooth Number Ticker for Stats ----------
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(el => {
        el.style.fontVariantNumeric = 'tabular-nums';
    });

    // ---------- Section Headers Parallax Depth ----------
    const sectionHeaders = document.querySelectorAll('.section-header');
    if (!('ontouchstart' in window)) {
        window.addEventListener('scroll', () => {
            sectionHeaders.forEach(header => {
                const rect = header.getBoundingClientRect();
                const viewportCenter = window.innerHeight / 2;
                const offset = (rect.top - viewportCenter) * 0.03;
                header.style.transform = `translateY(${offset}px)`;
            });
        }, { passive: true });
    }

    // ---------- Gallery Filtering ----------
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            galleryItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // Handle initial category from URL query (if any and no hash)
    if (!window.location.hash) {
        const urlParams = new URLSearchParams(window.location.search);
        const initialCat = urlParams.get('cat');
        if (initialCat) {
            const gallerySection = document.getElementById('gallery');
            if (gallerySection) {
                setTimeout(() => {
                    scrollToSection(gallerySection, `cat=${initialCat}`);
                }, 600);
            }
        }
    }

    // ---------- Mobile Dropdown Toggle ----------
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdown = document.querySelector('.dropdown');

    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', (e) => {
            if (window.innerWidth < 992) {
                e.preventDefault();
                dropdown.classList.toggle('active');
            }
        });
    }

    // ---------- Intersection Observer for Gallery Items ----------
    const galleryObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, (index % 3) * 100);
                galleryObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    galleryItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'all 0.6s var(--ease-out)';
        galleryObserver.observe(item);
    });

    // ---------- Lightbox Navigation Variables ----------
    let lightboxIndex = 0;
    let lightboxImages = [];
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxImgOverlay = document.getElementById('lightbox-img-overlay');
    const lightboxImgContainer = document.getElementById('lightbox-img-container');
    const dispFilter = document.getElementById('disp-filter');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxPrev = document.getElementById('lightbox-prev');
    let isTransitioning = false;

    // Make openLightbox globally accessible
    window.openLightbox = function (images, caption) {
        if (!images || images.length === 0) return;
        lightboxImages = images;
        lightboxIndex = 0;
        lightboxCaption.textContent = caption;

        // Initial setup
        lightboxImg.src = lightboxImages[lightboxIndex];
        lightboxImg.style.opacity = '1';
        lightboxImgOverlay.style.opacity = '0';
        dispFilter.setAttribute('scale', '0');
        lightboxImgContainer.style.filter = 'none';

        // Show next/prev buttons only if there are multiple images
        if (lightboxImages.length > 1) {
            lightboxNext.style.display = 'flex';
            lightboxPrev.style.display = 'flex';
        } else {
            lightboxNext.style.display = 'none';
            lightboxPrev.style.display = 'none';
        }

        lightboxModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    function updateLightboxImage(direction = 'next') {
        if (isTransitioning) return;
        isTransitioning = true;

        const currentSrc = lightboxImages[(lightboxIndex - (direction === 'next' ? 1 : -1) + lightboxImages.length) % lightboxImages.length];
        const nextSrc = lightboxImages[lightboxIndex];

        // Prepare overlay image to be the NEXT image
        lightboxImgOverlay.src = nextSrc;

        // Enable filter
        lightboxImgContainer.style.filter = 'url(#liquid-filter)';

        // Animation variables
        let startTime = null;
        const duration = 800; // 800ms transition

        function animateFilter(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / duration;

            if (progress < 1) {
                // Ease in-out bell curve for the displacement scale (0 -> max -> 0)
                const scale = Math.sin(progress * Math.PI) * 40; // max displacement 40
                dispFilter.setAttribute('scale', scale.toString());

                // Crossfade around the middle
                if (progress > 0.3) {
                    lightboxImgOverlay.style.opacity = '1';
                    lightboxImg.style.opacity = '0';
                }

                requestAnimationFrame(animateFilter);
            } else {
                // Finish transition
                dispFilter.setAttribute('scale', '0');
                lightboxImgContainer.style.filter = 'none';

                // Swap current image array to the new base
                lightboxImg.src = nextSrc;
                lightboxImg.style.opacity = '1';
                lightboxImgOverlay.style.opacity = '0';

                isTransitioning = false;
            }
        }

        requestAnimationFrame(animateFilter);
    }

    function closeLightbox() {
        lightboxModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Close logic
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxModal.addEventListener('click', (e) => {
        // Close if clicking outside the image or navigation
        if (e.target === lightboxModal || e.target.classList.contains('lightbox-content') || e.target.classList.contains('lightbox-img-wrapper')) {
            closeLightbox();
        }
    });

    // Nav logic
    lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isTransitioning) return;
        lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
        updateLightboxImage('next');
    });

    lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isTransitioning) return;
        lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
        updateLightboxImage('prev');
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightboxModal.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight' && lightboxImages.length > 1 && !isTransitioning) {
                lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
                updateLightboxImage('next');
            }
            if (e.key === 'ArrowLeft' && lightboxImages.length > 1 && !isTransitioning) {
                lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
                updateLightboxImage('prev');
            }
        }
    });

    // ---------- Page Transitions ----------
    const transitionLinks = document.querySelectorAll('a');
    transitionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('href');

            // Allow default behavior for hash links, empty links, or target="_blank"
            if (!target || target.startsWith('#') || target.startsWith('tel:') || target.startsWith('mailto:') || link.getAttribute('target') === '_blank') {
                return;
            }

            // Animate exit and then navigate
            e.preventDefault();
            document.body.classList.add('page-exit');

            setTimeout(() => {
                window.location.href = target;
            }, 400); // Duration matching CSS transition
        });
    });

});
