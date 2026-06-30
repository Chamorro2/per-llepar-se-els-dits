(function () {
  "use strict";

  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  function initLang() {
    const html = document.documentElement;
    const btns = $$("[data-lang-btn]");
    if (!btns.length) return;

    function applyLang(lang) {
      // Reescribe el texto visible de cada elemento con data-ca/data-es.
      // El contenido del HTML original (català) es el fallback si JS no llega a correr,
      // así que nunca dependemos de CSS para ocultar nada.
      $$("[data-ca]").forEach(el => {
        const text = lang === "es" ? el.dataset.es : el.dataset.ca;
        if (text != null) el.textContent = text;
      });
      html.setAttribute("data-lang", lang);
      html.setAttribute("lang", lang);
      html.classList.remove("lang-ca", "lang-es");
      html.classList.add("lang-" + lang);
      btns.forEach(b => b.classList.toggle("is-active", b.dataset.langBtn === lang));
    }

    btns.forEach(btn => {
      btn.addEventListener("click", () => applyLang(btn.dataset.langBtn));
    });
  }

  function initNav() {
    const nav = $("[data-nav]");
    if (!nav) return;
    const toggle = () => { if (scrollY > 80) nav.classList.add("is-scrolled"); else nav.classList.remove("is-scrolled"); };
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });

    const hamburger = $("[data-hamburger]");
    const links = $("[data-nav-links]");
    if (hamburger && links) {
      hamburger.addEventListener("click", () => {
        const isOpen = links.classList.toggle("is-open");
        hamburger.setAttribute("aria-expanded", isOpen);
      });
      links.querySelectorAll("a").forEach(a => {
        a.addEventListener("click", () => {
          links.classList.remove("is-open");
          hamburger.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  function initReveals() {
    if (reduced) return; // respeta reduced-motion: el contenido ya es visible por defecto
    const els = $$("[data-reveal]");
    if (!els.length || !window.IntersectionObserver) return;

    // Arma la animación SOLO ahora que sabemos que el observer va a vigilar los elementos.
    els.forEach(el => el.classList.add("reveal-armed"));

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -2% 0px" });
    els.forEach(el => io.observe(el));

    // Red de seguridad corta: si algo no se revela en 1.5s (p.ej. ya estaba en pantalla
    // pero el observer tardó), lo forzamos para que nunca quede oculto.
    setTimeout(() => {
      $$("[data-reveal]:not(.is-revealed)").forEach(el => el.classList.add("is-revealed"));
    }, 1500);
  }

  function initCountUp() {
    if (reduced) return;
    $$("[data-count-to]").forEach(el => {
      const target = parseFloat(el.dataset.countTo);
      if (isNaN(target)) return;
      const decimals = (el.dataset.countTo.split(".")[1] || "").length;
      const obj = { v: 0 };
      let triggered = false;
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting && !triggered) {
            triggered = true;
            if (window.gsap) {
              gsap.to(obj, {
                v: target, duration: 1.4, ease: "power2.out",
                onUpdate: () => { el.textContent = obj.v.toFixed(decimals); }
              });
            } else {
              el.textContent = target.toFixed(decimals);
            }
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.5 });
      io.observe(el);
    });
  }

  function initHeroParallax() {
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    const heroBg = $(".hero-bg-img");
    const heroContent = $(".hero-content");
    try { gsap.registerPlugin(ScrollTrigger); } catch (_) { return; }
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 25, scale: 1.1, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
    if (heroContent) {
      gsap.to(heroContent, {
        yPercent: -40, opacity: 0.3, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
  }

  function boot() {
    safe(initLang, "initLang");
    safe(initNav, "initNav");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");
    safe(initHeroParallax, "initHeroParallax");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
