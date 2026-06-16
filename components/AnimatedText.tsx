"use client";

import { motion, useReducedMotion } from "framer-motion";

type AnimationVariant = "word" | "letter" | "slide-up" | "fade";

interface AnimatedTextProps {
  text: string;
  variant?: AnimationVariant;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export function AnimatedText({
  text,
  variant = "word",
  className = "",
  delay = 0,
  duration = 0.5,
  once = true,
}: AnimatedTextProps) {
  const prefersReducedMotion = useReducedMotion();

  // Common viewport options
  const viewport = { once, margin: "-10%" };
  const smoothEase = [0.25, 0.46, 0.45, 0.94] as const; // Luxury smooth easing

  if (variant === "slide-up") {
    return (
      <motion.div
        className={`overflow-hidden ${className}`}
        initial={prefersReducedMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
        whileInView={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
        viewport={viewport}
        transition={{ duration: prefersReducedMotion ? 0.2 : duration + 0.3, delay, ease: smoothEase }}
      >
        {text}
      </motion.div>
    );
  }

  if (variant === "fade") {
    return (
      <motion.div
        className={className}
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: prefersReducedMotion ? 0.2 : duration + 0.2, delay, ease: smoothEase }}
      >
        {text}
      </motion.div>
    );
  }

  if (variant === "word") {
    const words = text.split(" ");
    
    const container = {
      hidden: { opacity: 0 },
      visible: () => ({
        opacity: 1,
        transition: { staggerChildren: prefersReducedMotion ? 0 : duration / 6, delayChildren: delay },
      }),
    };

    const child = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: prefersReducedMotion ? 0.15 : duration, ease: smoothEase },
      },
    };

    return (
      <motion.div
        className={`flex flex-wrap ${className}`}
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
      >
        {words.map((word, index) => (
          <motion.span
            variants={child}
            key={index}
            style={{ marginRight: "0.25em" }}
            className="inline-block"
          >
            {word}
          </motion.span>
        ))}
      </motion.div>
    );
  }

  if (variant === "letter") {
    const letters = Array.from(text);

    const container = {
      hidden: { opacity: 0 },
      visible: () => ({
        opacity: 1,
        transition: { staggerChildren: prefersReducedMotion ? 0 : duration / 20, delayChildren: delay },
      }),
    };

    const child = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: prefersReducedMotion ? 0.12 : duration, ease: smoothEase },
      },
    };

    return (
      <motion.span
        className={`inline-block ${className}`}
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
      >
        {letters.map((letter, index) => (
          <motion.span
            variants={child}
            key={index}
            className="inline-block"
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
        ))}
      </motion.span>
    );
  }

  return <>{text}</>;
}
