import { bindFilmFacades } from './media';

/** Showreel dialog: native <dialog> (Escape closes, background inert), player loaded on open and removed on close. */
export function initShowreel() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-showreel]');
  const openers = document.querySelectorAll<HTMLButtonElement>('[data-showreel-open]');
  if (!dialog || !openers.length) return;

  const slot = dialog.querySelector<HTMLElement>('[data-showreel-slot]')!;
  const template = dialog.querySelector<HTMLTemplateElement>('[data-showreel-template]')!;
  let opener: HTMLElement | null = null;

  openers.forEach((btn) =>
    btn.addEventListener('click', () => {
      opener = btn;
      slot.replaceChildren(template.content.cloneNode(true));
      bindFilmFacades();
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      // Start embeds straight away — the user explicitly asked to watch.
      const facade = slot.querySelector<HTMLButtonElement>('[data-film-embed]');
      if (facade) facade.click();
      else slot.querySelector<HTMLVideoElement>('video')?.focus();
    }),
  );

  dialog.querySelector('[data-showreel-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close(); // backdrop click
  });
  dialog.addEventListener('close', () => {
    slot.replaceChildren(); // stops playback
    document.body.style.overflow = '';
    opener?.focus();
  });
}
