"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface StaggerGridProps {
  children: React.ReactNode;
  className?: string;
  /** Additional delay before stagger starts (seconds) */
  delay?: number;
}

/**
 * A grid wrapper that staggers its children's entrance animation.
 * Drop-in replacement for `<div className="grid ...">`.
 *
 * Children should be wrapped in `motion.div` with `variants={staggerItem}`
 * OR the grid auto-wraps each child.
 */
export function StaggerGrid({ children, className = "", delay }: StaggerGridProps) {
  const variants = delay
    ? {
        initial: {},
        animate: {
          transition: {
            staggerChildren: 0.06,
            delayChildren: delay,
          },
        },
      }
    : staggerContainer;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Wrap individual grid items for stagger effect.
 * Use inside StaggerGrid.
 */
export function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}
