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

        // Update active nav link based on scroll position only if sections exist
        const sections = document.querySelectorAll('section[id]');
        if (sections.length > 0) {
            let currentSection = 'home'; // Default to home

            sections.forEach(section => {
                const sectionTop = section.offsetTop - 120;
                // Only update currentSection if the section has an actual height/offset mapped.
                // When page loads, some sections might initially have offsetTop 0 before layout completes.
                if (scrollY >= sectionTop && (section.offsetTop > 0 || section.getAttribute('id') === 'home')) {
                    currentSection = section.getAttribute('id');
                }
            });

            navItems.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSection}`) {
                    link.classList.add('active');
                }
            });
        }

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

    // ---------- Text Scramble on Hero Title Removed ----------

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
    const dropdown = document.querySelector('.nav-item-dropdown');

    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', (e) => {
            if (window.innerWidth < 992) {
                const href = dropdownToggle.getAttribute('href');
                // Only prevent default and toggle if it's mobile and has a dropdown
                if (href.includes('#portfolio') || window.innerWidth < 992) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
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
    const lightboxTrack = document.getElementById('lightbox-track');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxPrev = document.getElementById('lightbox-prev');

    window.openLightbox = function (images, caption) {
        if (!images || images.length === 0) return;
        lightboxImages = images;
        
        if (lightboxCaption) {
            lightboxCaption.textContent = caption;
        }

        if (lightboxTrack) {
            lightboxTrack.innerHTML = ''; 
            // Create 3 identical sets of images for a seamless infinite scroll runway
            const tripleImages = [...lightboxImages, ...lightboxImages, ...lightboxImages];
            
            tripleImages.forEach((src, idx) => {
                const img = document.createElement('img');
                img.src = src;
                img.alt = 'Gallery ' + (idx + 1);
                lightboxTrack.appendChild(img);
            });
            
            // Start the index right in the middle set
            lightboxIndex = lightboxImages.length;
            
            // Allow DOM to paint, then instantly scroll to middle set
            setTimeout(() => {
                updateLightboxTrack(false);
            }, 10);
        }

        if (lightboxImages.length > 1) {
            if(lightboxNext) lightboxNext.style.display = 'flex';
            if(lightboxPrev) lightboxPrev.style.display = 'flex';
        } else {
            if(lightboxNext) lightboxNext.style.display = 'none';
            if(lightboxPrev) lightboxPrev.style.display = 'none';
        }

        if(lightboxModal) {
            lightboxModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    function updateLightboxTrack(smooth = true) {
        if (!lightboxTrack) return;
        const width = lightboxTrack.clientWidth;
        lightboxTrack.scrollTo({
            left: lightboxIndex * width,
            behavior: smooth ? 'smooth' : 'instant'
        });
    }

    if(lightboxNext) lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        lightboxIndex++;
        updateLightboxTrack(true);
    });

    if(lightboxPrev) lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        lightboxIndex--;
        updateLightboxTrack(true);
    });

    function closeLightbox() {
        if(lightboxModal) lightboxModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if(lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    
    if(lightboxModal) lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal || e.target.classList.contains('lightbox-content') || e.target.classList.contains('lightbox-img-wrapper')) {
            closeLightbox();
        }
    });

    // Handle touchpad gestures (horizontal scroll update index)
    if(lightboxTrack) {
        let scrollTimeout;
        lightboxTrack.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            
            // After scrolling finishes, check if we need to instantly warp to keep the runway infinite
            scrollTimeout = setTimeout(() => {
                const width = lightboxTrack.clientWidth;
                lightboxIndex = Math.round(lightboxTrack.scrollLeft / width);
                
                const setLength = lightboxImages.length;
                if (!setLength) return;

                // If scrolled past the last item of the middle set into the 3rd set runway
                if (lightboxIndex >= setLength * 2 - 1) {
                    lightboxIndex -= setLength;
                    updateLightboxTrack(false); // Instant warp back
                }
                // If scrolled back past the first item of the middle set into the 1st set runway
                else if (lightboxIndex <= 0) {
                    lightboxIndex += setLength;
                    updateLightboxTrack(false); // Instant warp forward
                }

            }, 250); // Wait until scroll physics totally settle
        }, { passive: true });
        
        // vertical to horizontal map
        lightboxTrack.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                lightboxTrack.scrollBy({ left: e.deltaY, behavior: 'auto' });
            }
        }, { passive: false });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightboxModal && lightboxModal.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight' && lightboxImages.length > 1) {
                lightboxIndex++;
                updateLightboxTrack(true);
            }
            if (e.key === 'ArrowLeft' && lightboxImages.length > 1) {
                lightboxIndex--;
                updateLightboxTrack(true);
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


// Force scroll to top on page refresh
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}

window.addEventListener('DOMContentLoaded', function() {
    if (window.location.hash) {
        // Strip the hash from the URL so the browser doesn't scroll to it
        history.replaceState(null, null, window.location.pathname + window.location.search);
    }
    window.scrollTo({top: 0, left: 0, behavior: 'instant'});
});

window.addEventListener('load', function() {
    window.scrollTo({top: 0, left: 0, behavior: 'instant'});
});
