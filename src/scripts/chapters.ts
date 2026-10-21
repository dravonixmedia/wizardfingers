import { prefersReducedMotion } from './env';

/**
 * Continuous media chapters: Motion → Intelligence → Digital → About.
 *
 * Progressive enhancement (JS on, motion allowed): the sections' own background layers move
 * into one sticky full-screen frame behind them, so the media frame stays put while the text
 * scrolls over it. Each background crossfades in as its section's top edge passes from 75% to
 * 25% of the viewport, and each section's copy rises in on entry and fades out on exit.
 * Native scrolling drives everything: no wheel/touch interception, no timers. Scrolling back
 * reverses it exactly, because every state is a function of scroll position.
 *
 * About joins only from 1024px, where its portrait sits beside the biography; below that its
 * stacked portrait layout is kept and it simply follows the chapters. Without JS or with
 * reduced motion, every section keeps its own background (the static layout).
 */
const ORDER = ['motion', 'intelligence', 'digital', 'about'];
const WIDE = '(min-width: 1024px)';

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => v * v * (3 - 2 * v);
/** Peak darkness of the charcoal veil halfway through a crossfade. */
const VEIL = 0.45;

export function initChapters() {
  if (prefersReducedMotion()) return;
  const wide = window.matchMedia(WIDE);
  let teardown: (() => void) | undefined;
  const build = () => {
    teardown?.();
    teardown = setup(wide.matches);
    document.dispatchEvent(new CustomEvent('wf:layout'));
    document.dispatchEvent(new CustomEvent('wf:bg-refresh'));
  };
  build();
  wide.addEventListener('change', build);
}

function setup(includeAbout: boolean): (() => void) | undefined {
  // Consecutive sections only (e.g. published Experiments between Digital and About end the run).
  const sections: HTMLElement[] = [];
  let el = document.getElementById(ORDER[0]);
  for (const id of ORDER) {
    if (id === 'about' && !includeAbout) break;
    if (!el || el.id !== id || !el.querySelector(':scope > [data-bg]')) break;
    sections.push(el);
    el = el.nextElementSibling as HTMLElement | null;
  }
  if (sections.length < 2) return undefined;

  const wrap = document.createElement('div');
  wrap.className = 'chapters';
  // The sticky frame lives in a track exactly as tall as the chapters, so it releases with the
  // last chapter instead of lingering behind the next section.
  const track = document.createElement('div');
  track.className = 'chapters__track';
  track.setAttribute('aria-hidden', 'true');
  const stage = document.createElement('div');
  stage.className = 'chapters__stage';
  // Darkens the brief overlap between two backgrounds so it never reads as a muddy double image.
  const veil = document.createElement('div');
  veil.className = 'chapters__veil';
  track.append(stage);
  sections[0].before(wrap);
  wrap.append(track, ...sections);

  const layers = sections.map((s) => {
    const bg = s.querySelector<HTMLElement>(':scope > [data-bg]')!;
    // The frame is stable: no scroll parallax inside it.
    bg.removeAttribute('data-parallax-bg');
    const layer = document.createElement('div');
    layer.className = 'chapters__layer';
    layer.dataset.chapterLayer = '';
    layer.dataset.bgFor = s.id; // lets the section's Pause/Play control find its video
    layer.append(bg);
    stage.append(layer);
    s.classList.add('is-chapter');
    return layer;
  });
  stage.append(veil);

  // The copy is driven here instead of by the one-shot reveal.
  const copies = sections
    .map((s) => s.querySelector<HTMLElement>('[data-reveal]'))
    .filter((c): c is HTMLElement => Boolean(c));
  copies.forEach((c) => {
    c.removeAttribute('data-reveal');
    c.dataset.chapterCopy = '';
  });

  let active = '';
  let frame = 0;

  const update = () => {
    frame = 0;
    const vh = window.innerHeight;

    // Later layers sit on top: each fades in over the previous one, so there is never an
    // empty frame between two backgrounds. The boundary travels from 75% to 25% of the
    // viewport; the new background eases in over the middle of that, under a veil that peaks
    // halfway and clears again.
    let dim = 0;
    const opacity = sections.map((s, k) => {
      if (k === 0) return 1;
      const t = clamp((vh * 0.75 - s.getBoundingClientRect().top) / (vh * 0.5));
      dim = Math.max(dim, VEIL * Math.sin(Math.PI * t));
      return smooth(clamp((t - 0.25) / 0.5));
    });
    veil.style.opacity = dim < 0.005 ? '0' : dim.toFixed(3);
    let covered = false;
    const visible: string[] = [];
    for (let k = layers.length - 1; k >= 0; k--) {
      const on = opacity[k] > 0 && !covered;
      layers[k].style.opacity = opacity[k] === 1 ? '' : opacity[k].toFixed(3);
      layers[k].classList.toggle('is-active', on);
      if (on) visible.push(sections[k].id);
      if (opacity[k] >= 1) covered = true;
    }
    const key = visible.join();
    if (key !== active) {
      active = key;
      document.dispatchEvent(new CustomEvent('wf:bg-refresh')); // play/pause videos to match
    }

    // Copy: rises in from below, fades out towards the top. Focused content is always shown.
    for (const c of copies) {
      if (c.matches(':focus-within')) {
        c.style.opacity = '';
        c.style.transform = '';
        continue;
      }
      const r = c.getBoundingClientRect();
      const enter = clamp((vh * 0.92 - r.top) / (vh * 0.28));
      const exit = clamp((r.bottom - vh * 0.08) / (vh * 0.28));
      const v = Math.min(enter, exit);
      const dy = enter <= exit ? (1 - enter) * 48 : -(1 - exit) * 32;
      c.style.opacity = v >= 1 ? '' : v.toFixed(3);
      c.style.transform = v >= 1 ? '' : `translate3d(0, ${dy.toFixed(1)}px, 0)`;
    }
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  wrap.addEventListener('focusin', schedule);
  wrap.addEventListener('focusout', schedule);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    sections.forEach((s, k) => {
      s.prepend(layers[k].firstElementChild!);
      s.classList.remove('is-chapter');
    });
    copies.forEach((c) => {
      c.style.opacity = '';
      c.style.transform = '';
    });
    wrap.replaceWith(...sections);
  };
}
