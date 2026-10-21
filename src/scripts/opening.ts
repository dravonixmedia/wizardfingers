/**
 * Three-stage opening driven by native document scrolling.
 *
 * The section is taller than the viewport and its frame is `position: sticky`
 * (CSS), so the browser does the pinning. This script only reads the scroll
 * position and toggles stage classes — it never intercepts wheel/touch input,
 * locks scrolling or runs timers. Scrolling backwards reverses the sequence.
 */
export function initOpening() {
  const root = document.documentElement;
  const section = document.querySelector<HTMLElement>('[data-opening]');
  if (!section || !root.classList.contains('opening-pinned')) return;

  const stages = Array.from(section.querySelectorAll<HTMLElement>('[data-stage]'));
  const n = stages.length;
  const nav = section.querySelector<HTMLElement>('[data-stage-nav]');
  const prev = section.querySelector<HTMLButtonElement>('[data-stage-prev]');
  const next = section.querySelector<HTMLButtonElement>('[data-stage-next]');
  const current = section.querySelector<HTMLElement>('[data-stage-current]');
  const progress = section.querySelector<HTMLElement>('[data-stage-progress]');
  if (!n) return;

  let active = -1;
  let frame = 0;

  /** Scroll distance over which the frame stays pinned. */
  const travel = () => Math.max(1, section.offsetHeight - window.innerHeight);
  const sectionTop = () => section.getBoundingClientRect().top + window.scrollY;

  const setStage = (index: number) => {
    if (index === active) return;
    active = index;
    stages.forEach((stage, i) => {
      stage.classList.toggle('is-active', i === index);
      stage.classList.toggle('is-before', i < index);
      stage.classList.toggle('is-after', i > index);
    });
    if (current) current.textContent = String(index + 1).padStart(2, '0');
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === n - 1;
    section.dataset.activeStage = String(index);
    // Background videos only play for the visible stage.
    document.dispatchEvent(new CustomEvent('wf:bg-refresh'));
  };

  const update = () => {
    frame = 0;
    const p = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / travel()));
    setStage(Math.min(n - 1, Math.floor(p * n)));
    progress?.style.setProperty('--p', p.toFixed(4));
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  /** Scroll to the middle of a stage's interval so controls and scroll position stay in sync. */
  const goTo = (index: number) => {
    const i = Math.min(n - 1, Math.max(0, index));
    const top = sectionTop() + ((i + 0.5) / n) * travel();
    window.scrollTo({ top: Math.round(top), behavior: 'smooth' });
  };

  prev?.addEventListener('click', () => goTo(active - 1));
  next?.addEventListener('click', () => goTo(active + 1));

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  if (nav) nav.hidden = false;
  update();
  window.__wfOpeningReady = true;
}

declare global {
  interface Window {
    __wfOpeningReady?: boolean;
  }
}
