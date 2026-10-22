import { gsap } from 'gsap';

/**
 * Text entrances: one restrained treatment for the whole site (loaded with motion.ts, so never
 * with reduced motion or without JavaScript; CSS only pre-hides while `html.motion` is set).
 *
 * - Soft fade with a 16px rise, 0.7s, eased out; items follow each other by ~100ms in reading
 *   order: label → heading (line by line) → copy → actions.
 * - A group (`[data-reveal]`) animates its direct children. Headings animate by line; other
 *   children as whole blocks; a list marked `[data-reveal-each]` item by item.
 * - Groups play once, when their top is in view and, inside a curtain chapter, once the incoming
 *   panel is at least half way up. Groups that become ready together play as one sequence.
 * - Keyboard focus inside a waiting group shows it at once. Text stays real text throughout:
 *   headings are split into line wrappers only while animating, then restored.
 */

const RISE = 16;
const DURATION = 0.7;
const STEP = 0.1; // between items
const LINE_STEP = 0.09; // between heading lines
const EASE = 'power3.out';

const HEADING = /^H[1-6]$/;

interface Split {
  lines: HTMLElement[];
  restore: () => void;
}

/** Wraps each rendered line of a plain-text element in a block span. Null if it has markup. */
function splitLines(el: HTMLElement): Split | null {
  if ([...el.children].some((c) => c.tagName !== 'BR')) return null;
  const html = el.innerHTML;
  const text = el.textContent ?? '';
  const words = text.split(/(\s+)/).filter((w) => w.length);
  el.textContent = '';
  const spans = words.map((w) => {
    const s = document.createElement('span');
    s.textContent = w;
    el.append(s);
    return s;
  });
  // Group words by their rendered line.
  const rows: HTMLElement[][] = [];
  let top = NaN;
  for (const s of spans) {
    if (!s.textContent!.trim()) {
      rows.at(-1)?.push(s);
      continue;
    }
    if (s.offsetTop !== top) {
      rows.push([]);
      top = s.offsetTop;
    }
    rows.at(-1)!.push(s);
  }
  el.textContent = '';
  const lines = rows.map((row) => {
    const line = document.createElement('span');
    line.className = 'enter-line';
    line.textContent = row.map((s) => s.textContent).join('').trimEnd();
    el.append(line);
    return line;
  });
  return { lines, restore: () => (el.innerHTML = html) };
}

/** Wraps an element's content in one block span, so a CSS-transitioned element is left alone. */
function wrapBlock(el: HTMLElement): Split {
  const html = el.innerHTML;
  const inner = document.createElement('span');
  inner.className = 'enter-line';
  inner.append(...el.childNodes);
  el.append(inner);
  return { lines: [inner], restore: () => (el.innerHTML = html) };
}

interface Step {
  /** What is hidden before the entrance (the item itself). */
  item: HTMLElement;
  /** Heading → its lines are animated instead of the item. */
  lines: boolean;
}

function stepsOf(group: HTMLElement): Step[] {
  const children = [...group.children].filter((c): c is HTMLElement => c instanceof HTMLElement && !c.hidden && !c.matches('.sr-only'));
  const kids = children.length ? children : [group];
  return kids.flatMap((el) => {
    if (el.hasAttribute('data-reveal-each')) return [...el.children].map((li) => ({ item: li as HTMLElement, lines: false }));
    return [{ item: el, lines: HEADING.test(el.tagName) }];
  });
}

/** Adds a group's items to a timeline from `at`; returns the time after its last item starts. */
function addGroup(tl: gsap.core.Timeline, steps: Step[], at: number, restores: (() => void)[]): number {
  let t = at;
  for (const { item, lines } of steps) {
    const split = lines ? splitLines(item) : null;
    if (split) {
      restores.push(split.restore);
      tl.set(item, { opacity: 1, y: 0 }, t);
      tl.fromTo(split.lines, { opacity: 0, y: RISE }, { opacity: 1, y: 0, duration: DURATION, ease: EASE, stagger: LINE_STEP }, t);
      t += LINE_STEP * (split.lines.length - 1) + STEP;
    } else {
      tl.fromTo(item, { opacity: 0, y: RISE }, { opacity: 1, y: 0, duration: DURATION, ease: EASE }, t);
      t += STEP;
    }
  }
  return t;
}

/* Opening ---------------------------------------------------------------------------------- */

/**
 * Hero: PRANAV → role → active headline → supporting line → controls. Animates inner wrappers
 * only, so the stage classes' own CSS transitions (stage changes while scrolling) never fight it.
 */
function openingEntrance() {
  const opening = document.querySelector<HTMLElement>('[data-opening]');
  const identity = opening?.querySelector<HTMLElement>('.opening__identity');
  const stage = opening?.querySelector<HTMLElement>('.stage.is-active');
  if (!opening || !identity || !stage) return;
  const headline = stage.querySelector<HTMLElement>('.stage__headline');
  const supporting = stage.querySelector<HTMLElement>('.stage__supporting');
  const bar = opening.querySelector<HTMLElement>('.opening__bar');
  const parts = [...identity.children] as HTMLElement[];

  const restores: (() => void)[] = [];
  const head = headline ? (splitLines(headline) ?? wrapBlock(headline)) : null;
  const sup = supporting ? wrapBlock(supporting) : null;
  [head, sup].forEach((s) => s && restores.push(s.restore));

  // Reveal the containers (pre-hidden by CSS) and hide only what animates.
  gsap.set([identity, ...opening.querySelectorAll('.stage__text')], { opacity: 1 });
  gsap.set([...parts, ...(head?.lines ?? []), ...(sup?.lines ?? [])], { opacity: 0, y: RISE });
  if (bar) gsap.set(bar, { opacity: 0 });

  const tl = gsap.timeline({
    delay: 0.15,
    onComplete: () => {
      restores.forEach((r) => r());
      gsap.set([...parts, identity, bar].filter(Boolean), { clearProps: 'opacity,transform' });
    },
  });
  let t = 0;
  for (const p of parts) {
    tl.to(p, { opacity: 1, y: 0, duration: DURATION, ease: EASE }, t);
    t += STEP;
  }
  if (head) {
    tl.to(head.lines, { opacity: 1, y: 0, duration: DURATION, ease: EASE, stagger: LINE_STEP }, t);
    t += LINE_STEP * (head.lines.length - 1) + STEP;
  }
  if (sup) {
    tl.to(sup.lines, { opacity: 1, y: 0, duration: DURATION, ease: EASE }, t);
    t += STEP;
  }
  if (bar) tl.to(bar, { opacity: 1, duration: DURATION, ease: EASE }, t);

  // Focus on a control (e.g. Tab straight away) completes the entrance.
  opening.addEventListener('focusin', () => tl.progress(1), { once: true });
}

/** Other pages' hero items (`[data-hero-in]` outside the opening): whole blocks in order. */
function heroItems() {
  const items = gsap.utils.toArray<HTMLElement>('[data-hero-in]').filter((el) => !el.closest('[data-opening]'));
  if (!items.length) return;
  gsap.fromTo(items, { opacity: 0, y: RISE }, { opacity: 1, y: 0, duration: DURATION, ease: EASE, stagger: STEP, delay: 0.1, clearProps: 'opacity,transform' });
}

/* Scroll groups ---------------------------------------------------------------------------- */

function scrollGroups() {
  const pending = new Map<HTMLElement, Step[]>();
  for (const group of gsap.utils.toArray<HTMLElement>('[data-reveal]')) {
    const steps = stepsOf(group);
    pending.set(group, steps);
    gsap.set(group, { opacity: 1 }); // pre-hidden by CSS until now
    gsap.set(steps.map((s) => s.item), { opacity: 0, y: RISE });
  }
  if (!pending.size) return;

  const ready = (group: HTMLElement, vh: number) => {
    const r = group.getBoundingClientRect();
    if (r.height === 0 && r.width === 0) return false; // hidden (e.g. filtered out)
    if (!(r.top < vh * 0.88 && r.bottom > 0)) return false;
    // In a curtain chapter, wait until the incoming panel is at least half way up.
    const panel = group.closest('.curtain__panel');
    return !panel || panel.getBoundingClientRect().top < vh * 0.5;
  };

  const play = (groups: HTMLElement[], quick = false) => {
    const restores: (() => void)[] = [];
    const tl = gsap.timeline({
      onComplete: () => {
        restores.forEach((r) => r());
        gsap.set(groups.flatMap((g) => stepsOf(g).map((s) => s.item)), { clearProps: 'opacity,transform' });
      },
    });
    let t = 0;
    for (const g of groups) {
      t = addGroup(tl, pending.get(g)!, t, restores);
      pending.delete(g);
    }
    if (quick) tl.progress(1);
  };

  let frame = 0;
  const check = () => {
    frame = 0;
    const vh = window.innerHeight;
    // Document order, so groups that become ready together play label-first, top to bottom.
    const now = [...pending.keys()].filter((g) => ready(g, vh));
    if (now.length) play(now);
    if (!pending.size) detach();
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(check);
  };
  const onFocus = (e: FocusEvent) => {
    const group = [...pending.keys()].find((g) => g.contains(e.target as Node));
    if (group) play([group], true); // never leave a focused control transparent
  };
  const detach = () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('wf:layout', schedule);
    document.removeEventListener('focusin', onFocus);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('wf:layout', schedule);
  document.addEventListener('focusin', onFocus);
  // After deep-link scrolling (chapters.ts re-targets /#section on load) has settled.
  window.addEventListener('load', () => requestAnimationFrame(schedule), { once: true });
  schedule();
}

export function initEntrances() {
  openingEntrance();
  heroItems();
  scrollGroups();
}
