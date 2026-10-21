import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const EASE = 'expo.out';

/**
 * Cinematic motion system. Only loaded when prefers-reduced-motion is not set.
 * Scrolling stays native: the opening's pinning is plain CSS `position: sticky`
 * (see opening.ts); GSAP only handles entrances, reveals and parallax.
 */
export function initMotion() {
  const root = document.documentElement;
  const mm = gsap.matchMedia();

  openingEntrance();
  reveals();

  mm.add('(min-width: 900px)', () => {
    parallax();
  });

  // Content is now controlled by GSAP; remove the CSS pre-hide hook.
  root.classList.remove('motion');
  root.classList.add('motion-ready');

  document.addEventListener('wf:layout', () => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

/* Opening ------------------------------------------------------------------- */

function openingEntrance() {
  const items = gsap.utils.toArray<HTMLElement>('[data-hero-in]');
  const firstText = document.querySelector<HTMLElement>('.stage.is-active .stage__text');
  const tl = gsap.timeline({ defaults: { ease: EASE, duration: 1.2 } });

  // Background media is deliberately never animated here. This module loads after first
  // paint, so any transform on the poster/video would snap from its painted state and
  // visibly jerk the hero (and fight the poster → video handover).
  if (firstText) tl.fromTo(firstText, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 1.3, clearProps: 'all' }, 0.15);
  tl.fromTo(items, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.1, clearProps: 'transform' }, 0.05);
}

/* Scroll reveals --------------------------------------------------------------- */

function reveals() {
  const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  // Opacity only — never `visibility: hidden` (autoAlpha), which would remove links and
  // buttons inside not-yet-revealed content from the keyboard Tab order.
  gsap.set(items, { opacity: 0, y: 36 });
  const revealed = new WeakSet<Element>();
  const show = (els: Element[], vars: gsap.TweenVars = {}) => {
    const fresh = els.filter((el) => !revealed.has(el));
    fresh.forEach((el) => revealed.add(el));
    if (fresh.length) gsap.to(fresh, { opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.08, clearProps: 'opacity,transform', ...vars });
  };
  ScrollTrigger.batch(items, { start: 'top 90%', once: true, onEnter: (batch) => show(batch) });

  // Keyboard users may reach content before it scrolls into the reveal zone: show it at
  // once so the focus ring is never on transparent content.
  document.addEventListener('focusin', (e) => {
    const host = (e.target as Element | null)?.closest?.('[data-reveal]');
    if (host) show([host], { duration: 0.25, stagger: 0 });
  });

  // Project imagery: a cinematic "gate" opening.
  gsap.utils.toArray<HTMLElement>('[data-card-media]').forEach((media) => {
    gsap.fromTo(
      media,
      { clipPath: 'inset(12% 5% 12% 5%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.4,
        ease: 'expo.inOut',
        clearProps: 'clipPath',
        scrollTrigger: { trigger: media, start: 'top 88%', once: true },
      },
    );
  });
}

/* Parallax (desktop only) ------------------------------------------------------- */

function parallax() {
  // Section backgrounds drift slightly slower than the page.
  gsap.utils.toArray<HTMLElement>('[data-parallax-bg]').forEach((bg) => {
    gsap.fromTo(
      bg,
      { yPercent: -5, scale: 1.12 },
      {
        yPercent: 5,
        scale: 1.12,
        ease: 'none',
        scrollTrigger: { trigger: bg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  // Subtle depth inside project covers.
  gsap.utils.toArray<HTMLElement>('[data-card-media] img').forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -4, scale: 1.1 },
      { yPercent: 4, scale: 1.1, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });
}
