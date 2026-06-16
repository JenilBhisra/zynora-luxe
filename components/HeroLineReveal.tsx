"use client";

import { motion, useReducedMotion } from "framer-motion";

type HeroLineRevealProps = {
    lines: string[];
    className?: string;
};

export function HeroLineReveal({ lines, className = "" }: HeroLineRevealProps) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.div
            className={className}
            initial={prefersReducedMotion ? { opacity: 1 } : "hidden"}
            whileInView={prefersReducedMotion ? { opacity: 1 } : "visible"}
            viewport={{ once: true, amount: 0.55 }}
            variants={
                prefersReducedMotion
                    ? undefined
                    : {
                          hidden: { opacity: 1 },
                          visible: {
                              opacity: 1,
                              transition: {
                                  staggerChildren: 0.2,
                              },
                          },
                      }
            }
        >
            {lines.map((line, lineIndex) => {
                const words = line.split(" ");

                return (
                    <motion.div
                        key={`${line}-${lineIndex}`}
                        className="block overflow-hidden"
                        variants={
                            prefersReducedMotion
                                ? undefined
                                : {
                                      hidden: { opacity: 0, y: 18 },
                                      visible: {
                                          opacity: 1,
                                          y: 0,
                                          transition: {
                                              duration: 0.72,
                                              ease: [0.22, 1, 0.36, 1],
                                              staggerChildren: 0.045,
                                          },
                                      },
                                  }
                        }
                    >
                        {words.map((word, index) => (
                            <motion.span
                                key={`${word}-${index}`}
                                className="inline-block mr-[0.38em]"
                                variants={
                                    prefersReducedMotion
                                        ? undefined
                                        : {
                                              hidden: { opacity: 0, y: 12 },
                                              visible: {
                                                  opacity: 1,
                                                  y: 0,
                                                  transition: {
                                                      duration: 0.5,
                                                      ease: [0.22, 1, 0.36, 1],
                                                  },
                                              },
                                          }
                                }
                            >
                                {word}
                            </motion.span>
                        ))}
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
