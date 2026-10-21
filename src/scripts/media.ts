import { finePointer, prefersReducedMotion } from './env';

/**
 * Video previews and film players.
 * - Desktop: muted previews play on hover/focus; sources load on first use only.
 * - Touch: explicit "Play preview" button.
 * - Everything pauses when offscreen. Failures fall back to the still image.
 */
export function initMedia() {
  initPreviews();
  initFilmFacades();
}

function loadSource(video: HTMLVideoElement) {
  if (video.dataset.loaded) return;
  const src = video.dataset.src;
  if (!src) return;
  const source = document.createElement('source');
  source.src = src;
  source.type = video.dataset.type || 'video/mp4';
  video.append(source);
  video.dataset.loaded = '1';
  video.load();
}

function play(video: HTMLVideoElement, onPlaying: () => void, onFail: () => void) {
  loadSource(video);
  const p = video.play();
  if (p && typeof p.then === 'function') p.then(onPlaying).catch(onFail);
  else onPlaying();
}

function initPreviews() {
  const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video[data-preview]'));
  if (!videos.length) return;

  const offscreen = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (!e.isIntersecting) {
            v.pause();
            v.closest('[data-card]')?.classList.remove('is-playing');
            const t = v.closest('[data-card]')?.querySelector('[data-preview-toggle]');
            t?.setAttribute('aria-pressed', 'false');
          } else if (v.hasAttribute('data-autoplay-visible') && finePointer() && !prefersReducedMotion()) {
            play(v, () => v.classList.add('is-ready'), () => v.remove());
          }
        });
      }, { threshold: 0.1 })
    : undefined;

  videos.forEach((video) => {
    offscreen?.observe(video);
    video.addEventListener('error', () => video.closest('[data-card]')?.classList.remove('is-playing'), true);

    const card = video.closest<HTMLElement>('[data-card]');
    if (!card) return;
    const link = card.querySelector<HTMLElement>('a');
    const toggle = card.querySelector<HTMLButtonElement>('[data-preview-toggle]');
    const start = () => play(video, () => card.classList.add('is-playing'), () => card.classList.remove('is-playing'));
    const stop = () => {
      video.pause();
      card.classList.remove('is-playing');
    };

    if (finePointer() && !prefersReducedMotion()) {
      link?.addEventListener('pointerenter', start);
      link?.addEventListener('pointerleave', stop);
      link?.addEventListener('focus', start);
      link?.addEventListener('blur', stop);
    }

    toggle?.addEventListener('click', () => {
      const on = toggle.getAttribute('aria-pressed') !== 'true';
      toggle.setAttribute('aria-pressed', String(on));
      toggle.firstElementChild!.textContent = on ? '❚❚' : '▶';
      if (on) start();
      else stop();
    });
  });
}

function initFilmFacades() {
  document.querySelectorAll<HTMLButtonElement>('[data-film-embed]').forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const src = btn.dataset.filmEmbed;
      if (!src) return;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = btn.dataset.filmTitle || 'Film player';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      btn.replaceWith(iframe);
      iframe.focus();
    });
  });
}

/** Re-bind facades inside dynamically inserted content (showreel dialog). */
export function bindFilmFacades() {
  initFilmFacades();
}
