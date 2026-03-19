import type { Variants, Transition } from "framer-motion";

/* ── Duration constants ───────────────────────────────────────── */

export const DURATION = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
} as const;

export const EASE = [0.25, 0.46, 0.45, 0.94] as const;

/* ── Reusable variants ────────────────────────────────────────── */

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE },
  },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.normal, ease: EASE },
  },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE },
  },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.normal, ease: EASE },
  },
};

/* ── Hover / Tap presets ──────────────────────────────────────── */

export const hoverLift = {
  y: -2,
  transition: { duration: DURATION.fast },
};

export const tapScale = {
  scale: 0.98,
};

/* ── Spring configs ───────────────────────────────────────────── */

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 24,
};

export const numberSpring: Transition = {
  type: "spring",
  stiffness: 80,
  damping: 15,
};
