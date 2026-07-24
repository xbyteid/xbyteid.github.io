/* Shared site behaviour: theme, mobile nav, reveal-on-scroll, anchor scrolling,
   scroll-to-top and the Formspree contact form. Every block is a no-op on pages
   that don't contain the matching markup. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function readStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (err) {
      console.warn('theme: localStorage unavailable, falling back to default', err);
      return null;
    }
  }

  function storeTheme(value) {
    try {
      localStorage.setItem('theme', value);
    } catch (err) {
      console.warn('theme: unable to persist preference', err);
    }
  }

  /* ── Theme ── */
  var themeBtn = document.getElementById('themeToggle');
  var savedTheme = readStoredTheme();
  if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  syncThemeLabel();

  function syncThemeLabel() {
    // Buttons without an inline icon (blog index) use an emoji label.
    if (!themeBtn || themeBtn.querySelector('svg')) return;
    themeBtn.textContent =
      document.documentElement.getAttribute('data-theme') === 'light' ? '☀️' : '🌙';
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', 'light');
      storeTheme(isLight ? 'dark' : 'light');
      syncThemeLabel();
    });
  }

  /* ── Mobile nav ── */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  function closeNav() {
    if (!navLinks) return;
    navLinks.classList.remove('open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ── Reveal on scroll ── */
  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if (reduceMotion || typeof IntersectionObserver !== 'function') {
      revealables.forEach(function (el) { el.classList.add('visible'); });
    } else {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -32px 0px' });
      revealables.forEach(function (el) { observer.observe(el); });
    }
  }

  /* ── In-page anchors, offset by the fixed nav ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = anchor.getAttribute('href');
      if (href === '#') return;
      var target;
      try {
        target = document.querySelector(href);
      } catch (err) {
        console.warn('smooth scroll: invalid target selector ' + href, err);
        return;
      }
      if (!target) {
        console.warn('smooth scroll: no element matches ' + href);
        return;
      }
      e.preventDefault();
      var navHeight =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 56;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.pageYOffset - navHeight - 24,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
      closeNav();
    });
  });

  /* ── Scroll to top ── */
  var scrollTopBtn = document.querySelector('.scroll-top');
  if (scrollTopBtn) {
    window.addEventListener('scroll', function () {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ── Contact form (Formspree) ── */
  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var submitBtn = document.getElementById('formBtn');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (submitBtn) submitBtn.disabled = true;
      if (status) { status.hidden = false; status.textContent = 'sending...'; status.className = 'form-status'; }
      try {
        var res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('contact form: ' + res.status + ' ' + (res.statusText || ''));
        if (status) { status.textContent = "sent. i'll get back to you."; status.className = 'form-status success'; }
        form.reset();
      } catch (err) {
        console.error('contact form submission failed', err);
        if (status) { status.textContent = 'error — try telegram @xbyteid'; status.className = 'form-status error'; }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        setTimeout(function () { if (status) status.hidden = true; }, 6000);
      }
    });
  }

  /* ── Page fade-in (opt-in via <body data-page-fade>) ── */
  if (document.body && document.body.dataset.pageFade !== undefined) {
    document.body.classList.add('page-fade');
  }
})();
