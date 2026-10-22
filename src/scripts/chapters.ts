import { prefersReducedMotion } from './env';

/**
 * Curtain chapters: Motion → Intelligence → Digital, then Selected Work scrolls in normally.
 *
 * Progressive enhancement (JS on, motion allowed). Each section stays whole — background,
 * overlay, text and controls — and becomes an opaque sticky panel inside its own scroll track.
 * While a chapter holds, the next panel rises from the bottom and covers it like a curtain; the
 * covered panel stays pinned underneath, so it never moves while it is being covered.
 *
 * Native scrolling drives everything: CSS sticky positioning plus this script setting track
 * heights and a subtle background parallax from the scroll position. No wheel/touch
 * interception, snapping or timers, so scrolling back reverses it exactly.
 *
 * Per chapter: a rise (one viewport of scroll) and a reading hold (HOLD viewports). Panels
 * taller than the viewport scroll through all their content first, then pin by their bottom
 * edge, so long content stays fully readable. Without JS or with reduced motion the sections
 * are ordinary stacked sections.
 */
const ORDER = ['motion', 'intelligence', 'digital'];
/** Reading hold after a chapter has fully risen, in viewport heights (rise + hold = 2.1 vh). */
const HOLD = 1.1;
/** Background parallax travel, as a fraction of the background's height (each way). */
const PARALLAX = 0.018;
/** Background scale that keeps every edge covered across the parallax travel. */
const PARALLAX_SCALE = 1 + PARALLAX * 2 + 0.004;

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

interface Chapter {
  section: HTMLElement;
  track: HTMLElement;
  bg: HTMLElement | null;
  /** Scroll positions where the panel enters at the bottom and where it is gone (covered or left). */
  enter: number;
  leave: number;
}

export function initChapters() {
  if (prefersReducedMotion()) return;

  // Consecutive sections only (a section between them, e.g. published Experiments, ends the run).
  const sections: HTMLElement[] = [];
  let el = document.getElementById(ORDER[0]);
  for (const id of ORDER) {
    if (!el || el.id !== id) break;
    sections.push(el);
    el = el.nextElementSibling as HTMLElement | null;
  }
  if (sections.length < 2) return;

  const root = document.createElement('div');
  root.className = 'curtains';
  sections[0].before(root);

  const chapters: Chapter[] = sections.map((section) => {
    const track = document.createElement('div');
    track.className = 'curtain';
    track.dataset.curtain = section.id;
    root.append(track);
    track.append(section);
    section.classList.add('curtain__panel');
    // The chapter has its own background parallax (below), not the GSAP one. Its text entrance
    // (entrances.ts) waits until the panel is half way up.
    const bg = section.querySelector<HTMLElement>(':scope > [data-bg]');
    bg?.removeAttribute('data-parallax-bg');
    return { section, track, bg, enter: 0, leave: 0 };
  });

  let vh = window.innerHeight;
  let covered = '';
  let frame = 0;

  /** Track heights and sticky offsets; depends only on panel and viewport heights. */
  const layout = () => {
    vh = window.innerHeight;
    chapters.forEach(({ section, track }, k) => {
      const panel = section.offsetHeight;
      const top = Math.min(0, vh - panel); // taller panels pin by their bottom edge
      const last = k === chapters.length - 1;
      // Non-last tracks overlap the next by one viewport, so the next panel rises while this one
      // is still pinned; this one stays pinned until it is completely covered.
      const height = HOLD * vh + (last ? vh : 2 * vh) - top;
      section.style.top = `${top}px`;
      track.style.height = `${Math.round(height)}px`;
      track.style.marginBottom = last ? '' : `${-vh}px`;
    });
    chapters.forEach((c, k) => {
      const docTop = c.track.getBoundingClientRect().top + window.scrollY;
      const next = chapters[k + 1];
      c.enter = docTop - vh;
      c.leave = next ? next.track.getBoundingClientRect().top + window.scrollY : docTop + c.track.offsetHeight;
    });
  };

  const update = () => {
    frame = 0;
    const next: string[] = [];
    const y = window.scrollY;
    chapters.forEach(({ section, bg, enter, leave }, k) => {
      // Covered once the next panel has fully risen: its video is no longer visible.
      const above = chapters[k + 1]?.section.getBoundingClientRect();
      const isCovered = Boolean(above && above.top <= 0.5 && above.bottom >= vh - 0.5);
      section.toggleAttribute('data-chapter-covered', isCovered);
      if (isCovered) next.push(section.id);
      // Parallax over the panel's whole time on screen: the background drifts up slightly
      // from entering at the bottom until it is covered (or, for the last, has left).
      if (bg) {
        const p = clamp((y - enter) / Math.max(1, leave - enter));
        const shift = (0.5 - p) * 2 * PARALLAX * 100;
        bg.style.transform = `translate3d(0, ${shift.toFixed(3)}%, 0) scale(${PARALLAX_SCALE})`;
      }
    });
    const key = next.join();
    if (key !== covered) {
      covered = key;
      document.dispatchEvent(new CustomEvent('wf:bg-refresh')); // pause covered videos
    }
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const relayout = () => {
    layout();
    schedule();
  };

  layout();
  update();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', relayout);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(relayout);
    chapters.forEach(({ section }) => ro.observe(section));
  }

  /** Scroll position at which a chapter has fully risen and starts its hold. */
  const holdStart = (c: Chapter) => c.track.getBoundingClientRect().top + window.scrollY - Math.min(0, vh - c.section.offsetHeight);

  // In-page links to a chapter land at the start of its hold (anchors on sticky panels would
  // otherwise resolve against their pinned position).
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
    const c = a && chapters.find((ch) => ch.section.id === a.hash.slice(1));
    if (!c) return;
    e.preventDefault();
    window.scrollTo({ top: holdStart(c), behavior: 'smooth' });
    history.pushState(null, '', `#${c.section.id}`);
  });

  // Keyboard focus inside a panel that is covered (or not yet risen) brings that chapter up.
  root.addEventListener('focusin', (e) => {
    const c = chapters.find((ch) => ch.section.contains(e.target as Node));
    if (!c) return;
    const r = (e.target as HTMLElement).getBoundingClientRect();
    const k = chapters.indexOf(c);
    const above = chapters[k + 1]?.section.getBoundingClientRect();
    const hidden = (above && above.top < r.bottom) || r.top < 0 || r.bottom > vh;
    if (hidden) window.scrollTo({ top: holdStart(c), behavior: 'instant' });
  });

  // A deep link (e.g. /#digital) resolves after the tracks exist, and again after the browser's
  // own hash scroll on load (which targets the pinned panel).
  const toHash = () => {
    const target = chapters.find((ch) => `#${ch.section.id}` === window.location.hash);
    if (target) window.scrollTo({ top: holdStart(target), behavior: 'instant' });
  };
  toHash();
  if (document.readyState !== 'complete') window.addEventListener('load', () => requestAnimationFrame(toHash), { once: true });

  document.dispatchEvent(new CustomEvent('wf:layout'));
}
