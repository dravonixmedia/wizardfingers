/**
 * MOTION / INTELLIGENCE / DIGITAL selector (ARIA tabs pattern).
 * Click, tap and keyboard (arrows, Home, End) supported. Only the atmosphere,
 * description and featured preview change — identity and page state stay put.
 */
export type DimensionAnimator = (ctx: {
  from: string;
  to: string;
  hero: HTMLElement;
  fromPanel: HTMLElement;
  toPanel: HTMLElement;
  fromAtmo: HTMLElement | null;
  toAtmo: HTMLElement | null;
}) => void;

export function initDimensions() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  const tabs = Array.from(hero.querySelectorAll<HTMLButtonElement>('[data-dim-tab]'));
  if (!tabs.length) return;

  let current = tabs.find((t) => t.getAttribute('aria-selected') === 'true')?.dataset.dimTab ?? tabs[0].dataset.dimTab!;
  let animator: DimensionAnimator | undefined;

  const panel = (id: string) => hero.querySelector<HTMLElement>(`[data-dim-panel="${id}"]`)!;
  const atmo = (id: string) => hero.querySelector<HTMLElement>(`[data-atmo="${id}"]`);

  const select = (id: string, focus = false) => {
    const tab = tabs.find((t) => t.dataset.dimTab === id);
    if (!tab) return;
    if (focus) tab.focus();
    if (id === current) return;
    const from = current;
    current = id;

    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    hero.dataset.dimension = id;

    const fromPanel = panel(from);
    const toPanel = panel(id);
    const fromAtmo = atmo(from);
    const toAtmo = atmo(id);

    if (animator) {
      animator({ from, to: id, hero, fromPanel, toPanel, fromAtmo, toAtmo });
    } else {
      fromPanel.hidden = true;
      toPanel.hidden = false;
      fromAtmo?.classList.remove('is-active');
      toAtmo?.classList.add('is-active');
    }
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab.dataset.dimTab!));
    tab.addEventListener('keydown', (e) => {
      let next: number | undefined;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      e.preventDefault();
      select(tabs[next].dataset.dimTab!, true);
    });
  });

  // "All Motion work" links pre-filter the Work section.
  hero.querySelectorAll<HTMLAnchorElement>('[data-filter-link]').forEach((a) =>
    a.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('wf:filter', { detail: a.dataset.filterLink }));
    }),
  );

  return {
    setAnimator: (fn: DimensionAnimator) => {
      animator = fn;
    },
  };
}
