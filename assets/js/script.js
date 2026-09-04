// ============================
// Header scroll effect
// ============================
const header = document.getElementById('header');

const onScroll = () => {
    if (window.scrollY > 30) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ============================
// Mobile nav toggle
// ============================
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    nav.classList.toggle('open');
    document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
});

// Close menu when a nav link is clicked
document.querySelectorAll('.nav-list a').forEach((link) => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        nav.classList.remove('open');
        document.body.style.overflow = '';
    });
});

// ============================
// Fade-in on scroll
// (gentle, wave-like rhythm)
// ============================
const fadeTargets = document.querySelectorAll('.fade-in, .fade-in-up');

const io = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.14,
        rootMargin: '0px 0px -60px 0px',
    }
);

fadeTargets.forEach((el) => io.observe(el));

// Hero items animate on load
window.addEventListener('load', () => {
    document.querySelectorAll('.hero .fade-in').forEach((el) => {
        el.classList.add('is-visible');
    });
});

// ============================
// Smooth scroll (offset for fixed header)
// ============================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId.length <= 1) return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        const headerHeight = header.offsetHeight;
        const targetPosition =
            target.getBoundingClientRect().top + window.pageYOffset - headerHeight + 1;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
        });
    });
});

// ============================
// Scroll spy (highlight the nav link of the section in view)
// ============================
const spyLinks = Array.from(document.querySelectorAll('.nav-list a[href^="#"]'));

if (spyLinks.length) {
    const spySections = spyLinks
        .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
        .filter(Boolean);

    const inView = new Set();
    let spyLock = false; // held while a click-triggered smooth scroll is running
    let spyLockTimer = null;

    const setActiveLink = (id) => {
        spyLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    const updateFromView = () => {
        if (spyLock) return;
        // Topmost section (document order) currently crossing the detection band
        const active = spySections.find((section) => inView.has(section.id));
        setActiveLink(active ? active.id : null);
    };

    const spyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    inView.add(entry.target.id);
                } else {
                    inView.delete(entry.target.id);
                }
            });
            updateFromView();
        },
        {
            // Thin band across the upper-middle of the viewport, so the
            // highlight switches as a section's top passes ~40% down the screen.
            rootMargin: '-40% 0px -55% 0px',
            threshold: 0,
        }
    );

    spySections.forEach((section) => spyObserver.observe(section));

    // The last section can be too short to reach the band, so light up its
    // link once the page is scrolled all the way to the bottom.
    let bottomTicking = false;
    const checkBottom = () => {
        if (spyLock || !spySections.length) return;
        const atBottom =
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 2;
        if (atBottom) {
            setActiveLink(spySections[spySections.length - 1].id);
        }
    };
    window.addEventListener(
        'scroll',
        () => {
            if (!bottomTicking) {
                window.requestAnimationFrame(() => {
                    checkBottom();
                    bottomTicking = false;
                });
                bottomTicking = true;
            }
        },
        { passive: true }
    );

    // On nav click, highlight the target right away and keep it fixed until
    // the smooth scroll settles, so passed-over sections don't flash active.
    const releaseSpyLock = () => {
        spyLock = false;
        if (spyLockTimer) {
            clearTimeout(spyLockTimer);
            spyLockTimer = null;
        }
        updateFromView();
    };

    spyLinks.forEach((link) => {
        link.addEventListener('click', () => {
            const id = link.getAttribute('href').slice(1);
            if (!document.getElementById(id)) return;
            setActiveLink(id);
            spyLock = true;
            if (spyLockTimer) clearTimeout(spyLockTimer);
            spyLockTimer = setTimeout(releaseSpyLock, 700);
            window.addEventListener('scrollend', releaseSpyLock, { once: true });
        });
    });
}

// ============================
// Skill bars: fill each bar to its data-level when scrolled into view
// ============================
const skillBlocks = document.querySelectorAll('.skill-block');

if (skillBlocks.length) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fillSkillBars = (block) => {
        block.querySelectorAll('.skill-row').forEach((row, i) => {
            const fill = row.querySelector('.skill-row-bar-fill');
            if (!fill) return;

            const level = Math.min(100, Math.max(0, parseFloat(row.dataset.level) || 0));

            if (reduceMotion) {
                fill.style.width = `${level}%`;
                return;
            }

            // Stagger each row within the block, then let the CSS width
            // transition play from 0 on the next frame.
            fill.style.transitionDelay = `${i * 0.1}s`;
            requestAnimationFrame(() => {
                fill.style.width = `${level}%`;
            });
        });
    };

    const skillObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                fillSkillBars(entry.target);
                skillObserver.unobserve(entry.target);
            });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    skillBlocks.forEach((block) => skillObserver.observe(block));
}

// ============================
// Development Experience Accordion
// ============================
const expItems = document.querySelectorAll('.exp-item');

expItems.forEach((item) => {
    const summary = item.querySelector('.exp-summary');
    const body = item.querySelector('.exp-body');

    if (!summary || !body) return;

    summary.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        if (isOpen) {
            // Closing: set the current scrollHeight first so transition has a starting value
            body.style.maxHeight = body.scrollHeight + 'px';
            // Force reflow
            void body.offsetHeight;
            body.style.maxHeight = '0px';
            item.classList.remove('open');
            summary.setAttribute('aria-expanded', 'false');
        } else {
            body.style.maxHeight = body.scrollHeight + 'px';
            item.classList.add('open');
            summary.setAttribute('aria-expanded', 'true');

            // Clear inline maxHeight after transition so content can resize (e.g. on viewport change)
            body.addEventListener(
                'transitionend',
                function handler() {
                    if (item.classList.contains('open')) {
                        body.style.maxHeight = 'none';
                    }
                    body.removeEventListener('transitionend', handler);
                },
                { once: true }
            );
        }
    });
});

// Recalculate when window resizes (for items currently open)
window.addEventListener('resize', () => {
    document.querySelectorAll('.exp-item.open .exp-body').forEach((body) => {
        body.style.maxHeight = 'none';
    });
});

// ============================
// Subtle parallax on hero background
// ============================
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
    let ticking = false;
    window.addEventListener(
        'scroll',
        () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const y = window.scrollY;
                    if (y < window.innerHeight) {
                        heroBg.style.transform = `translateY(${y * 0.25}px) scale(1.05)`;
                    }
                    ticking = false;
                });
                ticking = true;
            }
        },
        { passive: true }
    );
}
