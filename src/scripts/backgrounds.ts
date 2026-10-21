import { prefersReducedMotion } from './env';

/**
 * Background videos (opening stages and media-led sections).
 * - Sources are attached only when a video is about to be shown (preload="none").
 * - Plays only while visible, and in the opening only for the active stage.
 * - Phones play only when a mobile source is configured; otherwise the poster stays.
 * - Reduced motion and Save-Data keep the poster. Autoplay rejection keeps the poster.
 * - One visible pause/play preference applies to every background video.
 */
const STORAGE_KEY = 'wf-bg-paused';

function readPaused() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writePaused(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* storage unavailable: preference lasts for this page only */
  }
}

export function initBackgrounds() {
  const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video[data-bg-video]'));
  const toggles = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-bg-toggle]'));
  if (!videos.length) {
    toggles.forEach((t) => (t.hidden = true));
    return;
  }

  const mobile = window.matchMedia('(max-width: 720px)');
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  let paused = readPaused();
  const visible = new Set<HTMLVideoElement>();
  const failed = new WeakSet<HTMLVideoElement>();

  const sourceFor = (v: HTMLVideoElement) => (mobile.matches ? v.dataset.srcMobile : v.dataset.src);

  /** False when the video sits inside an opening stage that isn't the active one. */
  const stageActive = (v: HTMLVideoElement) => {
    const stage = v.closest<HTMLElement>('[data-stage]');
    return !stage || stage.classList.contains('is-active') || !document.documentElement.classList.contains('opening-pinned');
  };

  const allowed = (v: HTMLVideoElement) =>
    !paused && !saveData && !prefersReducedMotion() && !failed.has(v) && Boolean(sourceFor(v));

  const ensureSource = (v: HTMLVideoElement) => {
    const src = sourceFor(v);
    if (!src || v.dataset.loadedSrc === src) return;
    v.src = src;
    v.dataset.loadedSrc = src;
  };

  const sync = (v: HTMLVideoElement) => {
    if (visible.has(v) && stageActive(v) && allowed(v)) {
      ensureSource(v);
      const p = v.play();
      p?.catch(() => {
        // Autoplay rejected or source failed: keep the poster.
        failed.add(v);
        v.classList.remove('is-playing');
        renderToggles();
      });
    } else if (!v.paused) {
      v.pause();
    }
  };

  const syncAll = () => videos.forEach(sync);

  videos.forEach((v) => {
    v.addEventListener('playing', () => v.classList.add('is-playing'));
    v.addEventListener('error', () => {
      failed.add(v);
      v.classList.remove('is-playing');
      renderToggles();
    });
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) visible.add(v);
          else visible.delete(v);
          sync(v);
        });
      },
      { rootMargin: '10% 0px' },
    );
    videos.forEach((v) => io.observe(v));
  }

  const renderToggles = () => {
    // Controls only matter when a background video can actually play here.
    const canPlay = !saveData && !prefersReducedMotion();
    toggles.forEach((t) => {
      const scope = t.closest('section') ?? document;
      const own = Array.from(scope.querySelectorAll<HTMLVideoElement>('video[data-bg-video]'));
      t.hidden = !canPlay || !own.some((v) => sourceFor(v) && !failed.has(v));
      const label = t.querySelector('[data-bg-toggle-label]');
      if (label) label.textContent = paused ? 'Play' : 'Pause';
    });
  };

  toggles.forEach((t) =>
    t.addEventListener('click', () => {
      paused = !paused;
      writePaused(paused);
      renderToggles();
      syncAll();
    }),
  );

  renderToggles();

  document.addEventListener('wf:bg-refresh', syncAll);
  mobile.addEventListener('change', () => {
    renderToggles();
    syncAll();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach((v) => v.pause());
    else syncAll();
  });
}
