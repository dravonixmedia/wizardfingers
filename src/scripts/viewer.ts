/**
 * Viewer for folder-published work: images enlarged, videos in a native player with controls.
 * Native <dialog> (Escape closes, the page behind is inert). Media is created on open and removed
 * on close, so nothing downloads until a visitor asks for it. Previous/Next (and ← →) step through
 * the items the current filter shows; focus returns to the card of the item last viewed.
 */
interface ViewerItem {
  kind: 'image' | 'video';
  title: string;
  label: string;
  w: number;
  h: number;
  src?: string;
  srcset?: string;
  sources?: { src: string; type: string }[];
  poster?: string;
}

export function initViewer() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-viewer]');
  if (!dialog) return;
  const stage = dialog.querySelector<HTMLElement>('[data-viewer-stage]')!;
  const title = dialog.querySelector<HTMLElement>('[data-viewer-title]')!;
  const kind = dialog.querySelector<HTMLElement>('[data-viewer-kind]')!;
  const count = dialog.querySelector<HTMLElement>('[data-viewer-count]')!;
  const nav = dialog.querySelector<HTMLElement>('[data-viewer-nav]')!;
  const prev = dialog.querySelector<HTMLButtonElement>('[data-viewer-prev]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-viewer-next]')!;

  let list: HTMLAnchorElement[] = [];
  let index = 0;

  const visibleLinks = () =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-viewer-open]')).filter((a) => !a.closest('[hidden]'));

  const show = (i: number) => {
    index = (i + list.length) % list.length;
    const link = list[index];
    const item = JSON.parse(link.dataset.viewerOpen!) as ViewerItem;
    title.textContent = item.title;
    kind.textContent = item.label;
    count.textContent = list.length > 1 ? `${String(index + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}` : '';

    if (item.kind === 'image') {
      const img = document.createElement('img');
      img.src = item.src!;
      img.srcset = item.srcset!;
      img.sizes = '100vw';
      img.width = item.w;
      img.height = item.h;
      img.alt = item.title;
      img.decoding = 'async';
      stage.replaceChildren(img);
    } else {
      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.width = item.w;
      video.height = item.h;
      // Starts muted (the visitor turns sound on from the controls).
      video.muted = true;
      if (item.poster) video.poster = item.poster;
      video.setAttribute('aria-label', item.title);
      for (const s of item.sources ?? []) {
        const source = document.createElement('source');
        source.src = s.src;
        source.type = s.type;
        video.append(source);
      }
      stage.replaceChildren(video);
      video.play().catch(() => {});
    }
  };

  const open = (link: HTMLAnchorElement) => {
    list = visibleLinks();
    nav.hidden = list.length < 2;
    show(Math.max(0, list.indexOf(link)));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.querySelector<HTMLElement>('[data-viewer-close]')!.focus();
  };

  document.addEventListener('click', (e) => {
    const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[data-viewer-open]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(link);
  });

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', (e) => {
    // Arrow keys seek inside the video player; elsewhere they step between items.
    if (list.length < 2 || (e.target as Element).closest('video')) return;
    if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });
  dialog.querySelector('[data-viewer-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target === stage) dialog.close(); // backdrop
  });
  dialog.addEventListener('close', () => {
    stage.replaceChildren(); // stops playback and any download
    document.body.style.overflow = '';
    const card = list[index];
    if (!card) return;
    card.focus({ preventScroll: true });
    // After Previous/Next the last viewed card may be elsewhere in the grid: bring it into view.
    const r = card.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) card.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
}
