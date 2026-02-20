"use client";

import { useEffect, useRef, useCallback } from "react";
import { useInView, useMotionValue, useSpring, motion } from "framer-motion";

interface CountUpProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  delay?: number;
  repeatInterval?: number;
}

export default function CountUp({
  target,
  suffix = "",
  prefix = "",
  duration = 2,
  delay = 0,
  repeatInterval = 0,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const animate = useCallback(() => {
    // Jump to 0 instantly (no spring animation down)
    motionValue.jump(0);
    if (ref.current) {
      ref.current.textContent = `${prefix}0${suffix}`;
    }
    // Then animate up after delay
    setTimeout(() => {
      motionValue.set(target);
    }, delay * 1000);
  }, [motionValue, target, delay, prefix, suffix]);

  useEffect(() => {
    if (isInView) {
      animate();
      if (repeatInterval > 0) {
        intervalRef.current = setInterval(animate, repeatInterval * 1000);
      }
    } else {
      motionValue.jump(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isInView, animate, repeatInterval, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.round(latest)}${suffix}`;
      }
    });
    return unsubscribe;
  }, [spring, suffix, prefix]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {prefix}0{suffix}
    </motion.span>
  );
}
