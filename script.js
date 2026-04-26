/* ================================================================
   MAMUT LOGISTICS — interactions
   ================================================================ */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;


  // -----------------------------------------------------------------
  // 1. LENIS smooth scroll
  // -----------------------------------------------------------------
  let lenis = null;

  if (typeof Lenis !== 'undefined' && !prefersReduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // -----------------------------------------------------------------
  // 2. NAV solid on scroll + scroll progress bar
  // -----------------------------------------------------------------
  const nav = document.getElementById('nav');
  const progressBar = document.getElementById('progressBar');

  const onScroll = () => {
    const y = window.scrollY || window.pageYOffset;
    if (y > 60) nav.classList.add('nav--solid');
    else nav.classList.remove('nav--solid');

    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (y / max) * 100 : 0;
      progressBar.style.width = pct + '%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // -----------------------------------------------------------------
  // 3. Mobile menu
  // -----------------------------------------------------------------
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  const closeMenu = () => {
    navMenu.classList.remove('nav__menu--open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();
  };
  const openMenu = () => {
    navMenu.classList.add('nav__menu--open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    if (lenis) lenis.stop();
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.contains('nav__menu--open');
    if (isOpen) closeMenu(); else openMenu();
  });
  navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // -----------------------------------------------------------------
  // 4. Smooth-scroll anchors
  // -----------------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -64, duration: 1.4 });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
      }
    });
  });

  // -----------------------------------------------------------------
  // 5. Form submit + select label-state
  // -----------------------------------------------------------------
  const form = document.getElementById('quoteForm');
  if (form) {
    // Track selects so labels float when a real option is picked
    form.querySelectorAll('select').forEach(s => {
      const update = () => s.classList.toggle('has-value', !!s.value);
      s.addEventListener('change', update);
      update();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.classList.add('form--sent');
      const submitLabel = form.querySelector('.form__submit .btn__label');
      if (submitLabel) submitLabel.textContent = 'Enviado';
      setTimeout(() => {
        form.reset();
        form.querySelectorAll('select').forEach(s => { s.selectedIndex = 0; s.classList.remove('has-value'); });
      }, 200);
      setTimeout(() => {
        form.classList.remove('form--sent');
        if (submitLabel) submitLabel.textContent = 'Enviar solicitud';
      }, 6000);
    });
  }

  // -----------------------------------------------------------------
  // 6. CURSOR-FOLLOW SPOTLIGHT (desktop only)
  //    Section-wide glow on dark sections + 3D tilt on service cards
  // -----------------------------------------------------------------
  if (!isTouch && !prefersReduced) {
    // Section-wide glow that follows the cursor across each dark section
    document.querySelectorAll('.section--dark').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        el.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });

    // Service cards: spotlight + 3D tilt + lift via GSAP
    if (typeof gsap !== 'undefined') {
      document.querySelectorAll('.card').forEach(el => {
        const tilt = 6;
        el.addEventListener('pointerenter', () => {
          gsap.to(el, { y: -8, duration: 0.45, ease: 'power3.out' });
        });
        el.addEventListener('pointermove', (e) => {
          const rect = el.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
          el.style.setProperty('--my', `${e.clientY - rect.top}px`);
          gsap.to(el, {
            rotateX: (0.5 - py) * tilt,
            rotateY: (px - 0.5) * tilt,
            duration: 0.45,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        });
        el.addEventListener('pointerleave', () => {
          gsap.to(el, {
            y: 0, rotateX: 0, rotateY: 0,
            duration: 0.7, ease: 'power3.out', overwrite: 'auto',
          });
        });
      });
    }
  }

  // -----------------------------------------------------------------
  // 7. GSAP ANIMATIONS
  // -----------------------------------------------------------------
  if (typeof gsap === 'undefined' || prefersReduced) {
    // Reveal everything for accessibility / fallback
    document.querySelectorAll('.js-fade, .js-card, .js-stat, .js-chip, .js-feature, .js-quote').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    document.querySelectorAll('.line__inner').forEach(el => { el.style.transform = 'translateY(0)'; });
    const fleetMedia = document.querySelector('.fleet__media');
    if (fleetMedia) { fleetMedia.style.opacity = '1'; fleetMedia.style.transform = 'none'; }
    document.querySelectorAll('.js-count').forEach(el => {
      el.textContent = (parseFloat(el.dataset.target) || 0).toLocaleString('en-US');
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (lenis) lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.lagSmoothing(0);

  // Run hero intro immediately
  runHeroIntro();

  // -----------------------------------------------------------------
  // Hero intro timeline
  // -----------------------------------------------------------------
  function runHeroIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('.hero__video',
      { scale: 1.12, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.6, ease: 'power3.out' }, 0)
      .to('.hero__title .line__inner', {
        y: '0%', duration: 1.1, stagger: 0.12, ease: 'expo.out'
      }, 0.15)
      .fromTo('.hero__top .tag',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0.3)
      .fromTo('.hero__sub',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85 }, 0.65)
      .fromTo('.hero__actions',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85 }, 0.75)
      .fromTo('.hero__marquee',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9 }, 0.85);
  }

  // Hero parallax on scroll
  gsap.to('.hero__video', {
    yPercent: 10,
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // Section headlines: line-mask reveal (auto-split on <br>)
  document.querySelectorAll('.js-split-h').forEach(h => {
    const html = h.innerHTML;
    const parts = html.split(/<br\s*\/?>/i);
    h.innerHTML = parts
      .map(p => `<span class="line"><span class="line__inner">${p.trim()}</span></span>`)
      .join('');
    const lines = h.querySelectorAll('.line__inner');
    gsap.set(lines, { yPercent: 110 });
    gsap.to(lines, {
      yPercent: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: h, start: 'top 88%', once: true }
    });
  });

  // Generic fade-up
  ScrollTrigger.batch('.js-fade', {
    start: 'top 88%',
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out', overwrite: 'auto' }),
    once: true,
  });

  // Cards
  ScrollTrigger.batch('.js-card', {
    start: 'top 88%',
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'expo.out', overwrite: 'auto' }),
    once: true,
  });

  // Chips
  ScrollTrigger.batch('.js-chip', {
    start: 'top 92%',
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.65, stagger: 0.04, ease: 'expo.out', overwrite: 'auto' }),
    once: true,
  });

  // Features
  ScrollTrigger.batch('.js-feature', {
    start: 'top 88%',
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'expo.out', overwrite: 'auto' }),
    once: true,
  });

  // Testimonials
  ScrollTrigger.batch('.js-quote', {
    start: 'top 88%',
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.14, ease: 'expo.out', overwrite: 'auto' }),
    once: true,
  });

  // Stats — fade + count up
  ScrollTrigger.batch('.js-stat', {
    start: 'top 88%',
    onEnter: (stats) => {
      gsap.to(stats, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'expo.out', overwrite: 'auto' });
      stats.forEach(stat => {
        const counter = stat.querySelector('.js-count');
        if (!counter) return;
        const target = parseFloat(counter.dataset.target) || 0;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.8,
          ease: 'power3.out',
          onUpdate: () => { counter.textContent = Math.round(obj.val).toLocaleString('en-US'); }
        });
      });
    },
    once: true,
  });

  // Fleet image — clip-path reveal + parallax
  const fleetMedia = document.querySelector('.fleet__media');
  if (fleetMedia) {
    gsap.fromTo(fleetMedia,
      { opacity: 0, scale: 0.9, clipPath: 'inset(20% 20% 20% 20% round 24px)' },
      {
        opacity: 1, scale: 1,
        clipPath: 'inset(0% 0% 0% 0% round 24px)',
        duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: fleetMedia, start: 'top 85%', once: true }
      }
    );
    gsap.to(fleetMedia.querySelector('.fleet__img'), {
      yPercent: -6,
      ease: 'none',
      scrollTrigger: { trigger: fleetMedia, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  // Footer giant wordmark
  const bigmark = document.querySelector('.js-bigmark');
  if (bigmark) {
    gsap.to(bigmark, {
      yPercent: -20,
      ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true }
    });
  }

  // Active nav link highlight — mark a nav link active while its section is in view
  const navLinks = document.querySelectorAll('.nav__menu .nav__link');
  navLinks.forEach(link => {
    const id = link.getAttribute('href');
    const section = id && id.startsWith('#') ? document.querySelector(id) : null;
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 40%',
      end: 'bottom 40%',
      onEnter: () => setActive(link),
      onEnterBack: () => setActive(link),
    });
  });
  function setActive(link) {
    navLinks.forEach(l => l.classList.toggle('is-active', l === link));
  }

  // Refresh after fonts/images load
  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
