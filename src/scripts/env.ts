export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** True for mouse/trackpad devices; pointer effects and hover previews are disabled on touch. */
export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
