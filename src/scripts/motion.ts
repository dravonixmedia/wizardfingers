import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initEntrances } from './entrances';

gsap.registerPlugin(ScrollTrigger);

/**
 * Cinematic motion system. Only loaded when prefers-reduced-motion is not set.
 * Scrolling stays native: the opening's pinning is plain CSS `position: sticky`
 * (see opening.ts); GSAP only handles text entrances (entrances.ts), image reveals and parallax.
 */
export function initMotion() {
  const root = document.documentElement;
  const mm = gsap.matchMedia();

  initEntrances();
  cardMedia();

  mm.add('(min-width: 900px)', () => {
    parallax();
  });

  // Content is now controlled by GSAP; remove the CSS pre-hide hook.
  root.classList.remove('motion');
  root.classList.add('motion-ready');

  document.addEventListener('wf:layout', () => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

/* Project imagery ------------------------------------------------------------- */

function cardMedia() {
  // A cinematic "gate" opening.
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
