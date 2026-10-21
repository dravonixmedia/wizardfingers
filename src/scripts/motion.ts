import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { DimensionAnimator } from './dimensions';
import { finePointer } from './env';

gsap.registerPlugin(ScrollTrigger);

const EASE = 'expo.out';
const GLOW: Record<string, { x: string; y: string }> = {
  motion: { x: '78%', y: '30%' },
  intelligence: { x: '22%', y: '22%' },
  digital: { x: '60%', y: '88%' },
};

interface Options {
  onDimension?: (fn: DimensionAnimator) => void;
}

/**
 * Cinematic motion system. Only loaded when prefers-reduced-motion is not set.
 * Natural scrolling is preserved: no pinning, no scroll hijacking.
 */
export function initMotion({ onDimension }: Options) {
  const root = document.documentElement;
  const mm = gsap.matchMedia();

  heroEntrance();
  onDimension?.(dimensionAnimator);
  reveals();
  signature();

  mm.add('(min-width: 900px)', () => {
    parallax();
    const cleanupPointer = finePointer() ? pointerDepth() : undefined;
    return () => cleanupPointer?.();
  });

  // Content is now controlled by GSAP; remove the CSS pre-hide hook.
  root.classList.remove('motion');
  root.classList.add('motion-ready');

  document.addEventListener('wf:layout', () => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

/* Hero ---------------------------------------------------------------------- */

function heroEntrance() {
  const items = gsap.utils.toArray<HTMLElement>('[data-hero-in]');
  const name = document.querySelector<HTMLElement>('[data-hero-name]');
  const tl = gsap.timeline({ defaults: { ease: EASE, duration: 1.2 } });

  if (name) {
    tl.fromTo(
      name,
      { yPercent: 18, clipPath: 'inset(0 0 100% 0)' },
      { yPercent: 0, clipPath: 'inset(0 0 -10% 0)', duration: 1.4, clearProps: 'clipPath' },
      0,
    );
  }
  tl.fromTo(items, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.08, clearProps: 'transform' }, 0.15);

  const stage = document.querySelector('.hero__stage');
  if (stage) tl.fromTo(stage, { scale: 1.08, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 2.2, ease: 'power2.out' }, 0);
}

let dimensionTl: gsap.core.Timeline | undefined;

const dimensionAnimator: DimensionAnimator = ({ to, hero, fromPanel, toPanel, fromAtmo, toAtmo }) => {
  // Rapid switching: finish the previous transition instantly so state stays consistent.
  dimensionTl?.progress(1).kill();
  const tl = (dimensionTl = gsap.timeline({ defaults: { ease: 'power3.out' } }));

  // Atmosphere crossfade with a slow drift.
  if (fromAtmo) {
    tl.to(fromAtmo, { autoAlpha: 0, scale: 1.04, duration: 0.9, ease: 'power2.inOut', onComplete: () => fromAtmo.classList.remove('is-active') }, 0);
  }
  if (toAtmo) {
    toAtmo.classList.add('is-active');
    tl.fromTo(toAtmo, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0);
  }

  // Accent light travels.
  const glow = GLOW[to];
  if (glow) tl.to(hero, { '--glow-x': glow.x, '--glow-y': glow.y, duration: 1.2, ease: 'power2.inOut' }, 0);

  // Copy: outgoing lifts away, incoming settles in.
  fromPanel.classList.add('is-leaving');
  tl.to(fromPanel, {
    autoAlpha: 0,
    y: -10,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => {
      fromPanel.hidden = true;
      fromPanel.classList.remove('is-leaving');
      gsap.set(fromPanel, { clearProps: 'all' });
    },
  }, 0);
  toPanel.hidden = false;
  tl.fromTo(
    toPanel.children,
    { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06, clearProps: 'transform,opacity,visibility' },
    0.22,
  );
};

/** Restrained pointer-responsive depth inside the hero (fine pointers only). */
function pointerDepth() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  const layers = Array.from(hero.querySelectorAll<HTMLElement>('[data-depth]')).map((el) => ({
    depth: parseFloat(el.dataset.depth || '0'),
    x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' }),
    y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3.out' }),
  }));

  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const r = hero.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    layers.forEach((l) => {
      l.x(nx * 24 * l.depth);
      l.y(ny * 16 * l.depth);
    });
  };
  const reset = () => layers.forEach((l) => (l.x(0), l.y(0)));

  hero.addEventListener('pointermove', move);
  hero.addEventListener('pointerleave', reset);
  return () => {
    hero.removeEventListener('pointermove', move);
    hero.removeEventListener('pointerleave', reset);
    reset();
  };
}

/* Scroll reveals --------------------------------------------------------------- */

function reveals() {
  const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  gsap.set(items, { autoAlpha: 0, y: 40 });
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.08, clearProps: 'transform' }),
  });

  // Project imagery: a cinematic "gate" opening.
  gsap.utils.toArray<HTMLElement>('[data-card-media]').forEach((media) => {
    gsap.fromTo(
      media,
      { clipPath: 'inset(14% 6% 14% 6%)' },
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

function parallax() {
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax || '0.1');
    gsap.fromTo(
      el,
      { yPercent: -amount * 100 },
      { yPercent: amount * 100, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } },
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

/* Signature: cinematic frame → browser interface (scroll-linked, not pinned) ---- */

function signature() {
  const box = document.querySelector<HTMLElement>('[data-sig-box]');
  const section = document.querySelector<HTMLElement>('[data-sig]');
  const tc = document.querySelector<HTMLElement>('[data-sig-tc]');
  if (!box || !section) return;

  const state = { p: 0 };
  const render = () => {
    section.style.setProperty('--p', state.p.toFixed(4));
    if (tc) {
      const frames = Math.round(state.p * 24 * 6);
      const s = Math.floor(frames / 24);
      const f = frames % 24;
      tc.textContent = `${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
    }
  };

  gsap.to(state, {
    p: 1,
    ease: 'none',
    onUpdate: render,
    scrollTrigger: { trigger: box, start: 'top 80%', end: 'bottom 35%', scrub: 0.6 },
  });
  render();
}
