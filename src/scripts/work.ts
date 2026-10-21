/** Work filters: All / Motion / Intelligence / Digital. Re-flows the editorial layout for visible items. */
const LAYOUTS = ['wide', 'left', 'right', 'narrow', 'offset'];

export function initWork() {
  const root = document.querySelector<HTMLElement>('[data-work]');
  const buttons = Array.from(root?.querySelectorAll<HTMLButtonElement>('[data-filter]') ?? []);
  const cards = Array.from(root?.querySelectorAll<HTMLElement>('[data-card]') ?? []);
  const status = root?.querySelector<HTMLElement>('[data-filter-status]');
  if (!root || !buttons.length) return;

  const apply = (filter: string) => {
    const button = buttons.find((b) => b.dataset.filter === filter);
    if (!button || button.disabled) return;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));

    let n = 0;
    cards.forEach((card) => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.hidden = !show;
      if (show) {
        card.dataset.layout = LAYOUTS[n % LAYOUTS.length];
        card.classList.remove('is-filtered-in');
        void card.offsetWidth; // restart the CSS entrance
        card.classList.add('is-filtered-in');
        n++;
      }
    });
    if (status) status.textContent = `Showing ${n} ${n === 1 ? 'project' : 'projects'}${filter === 'all' ? '' : ` in ${button.textContent?.replace(/\d+.*$/, '').trim()}`}.`;
    document.dispatchEvent(new CustomEvent('wf:layout'));
  };

  buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter!)));
  // "All Motion work" links in the discipline sections pre-filter the grid.
  document.querySelectorAll<HTMLAnchorElement>('[data-filter-link]').forEach((a) =>
    a.addEventListener('click', () => apply(a.dataset.filterLink!)),
  );
}
