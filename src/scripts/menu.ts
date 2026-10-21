/** Accessible mobile menu: focus trap, Escape to close, focus restoration, inert background. */
export function initMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  if (!toggle || !menu) return;

  const background = () =>
    [document.querySelector('main'), document.querySelector('footer')].filter(Boolean) as HTMLElement[];
  // DOM order: the toggle (in the header) precedes the menu panel.
  const focusables = () => [toggle, ...Array.from(menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))];

  let open = false;

  const setOpen = (next: boolean, restoreFocus = true) => {
    if (next === open) return;
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.menu-toggle__text')!.textContent = open ? 'Close' : 'Menu';
    menu.hidden = !open;
    document.documentElement.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    background().forEach((el) => (el.inert = open));
    if (open) {
      menu.querySelector<HTMLElement>('a[href]')?.focus();
    } else if (restoreFocus) {
      toggle.focus();
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));

  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Tab') {
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  menu.querySelectorAll('[data-menu-link]').forEach((a) =>
    a.addEventListener('click', () => setOpen(false, false)),
  );

  // Close if the viewport grows past the mobile breakpoint.
  window.matchMedia('(min-width: 1081px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false, false);
  });
}
