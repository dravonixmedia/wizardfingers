/** Header scrim on scroll and current-section highlighting in the primary nav. */
export function initNavState() {
  const root = document.documentElement;
  const onScroll = () => root.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));
  const targets = links
    .map((a) => {
      const id = a.hash.slice(1);
      const el = id && a.pathname === window.location.pathname ? document.getElementById(id) : null;
      return el ? { a, el } : null;
    })
    .filter(Boolean) as { a: HTMLAnchorElement; el: HTMLElement }[];
  if (!targets.length || !('IntersectionObserver' in window)) return;

  const visible = new Map<Element, boolean>();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => visible.set(e.target, e.isIntersecting));
      const current = targets.find((t) => visible.get(t.el));
      targets.forEach((t) => {
        if (t === current) t.a.setAttribute('aria-current', 'true');
        else t.a.removeAttribute('aria-current');
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  targets.forEach((t) => io.observe(t.el));
}
