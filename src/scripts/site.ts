import { initMenu } from './menu';
import { initNavState } from './nav';
import { initDimensions } from './dimensions';
import { initWork } from './work';
import { initMedia } from './media';
import { initShowreel } from './showreel';
import { prefersReducedMotion } from './env';

declare global {
  interface Window {
    __wfMotionReady?: boolean;
  }
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function boot() {
  initMenu();
  initNavState();
  initWork();
  initMedia();
  initShowreel();
  const dims = initDimensions();

  document.querySelectorAll<HTMLElement>('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  if (!prefersReducedMotion()) {
    // GSAP is loaded only when motion is allowed.
    import('./motion')
      .then(({ initMotion }) => {
        initMotion({ onDimension: dims?.setAnimator });
        window.__wfMotionReady = true;
      })
      .catch(() => document.documentElement.classList.remove('motion'));
  } else {
    document.documentElement.classList.remove('motion');
  }

  // If the user switches reduced motion on while the page is open, reveal everything.
  reducedMotion.addEventListener('change', (e) => {
    if (e.matches) window.location.reload();
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
