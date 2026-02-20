"use client";

import { motion } from "framer-motion";

export default function FlowWave() {
  return (
    <div className="absolute inset-0 flex items-center pointer-events-none hidden md:flex">
      <svg
        viewBox="0 0 900 80"
        fill="none"
        className="w-full h-20"
        preserveAspectRatio="none"
      >
        {/* Static wave path */}
        <path
          d="M0,40 C150,10 150,70 300,40 C450,10 450,70 600,40 C750,10 750,70 900,40"
          stroke="#00CED1"
          strokeWidth="2"
          strokeOpacity="0.15"
          fill="none"
        />
        {/* Animated flowing wave */}
        <motion.path
          d="M0,40 C150,10 150,70 300,40 C450,10 450,70 600,40 C750,10 750,70 900,40"
          stroke="#00CED1"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* Flowing dot */}
        <motion.circle
          r="5"
          fill="#00CED1"
          initial={{ offsetDistance: "0%" }}
          whileInView={{ offsetDistance: "100%" }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
          style={{
            offsetPath: `path("M0,40 C150,10 150,70 300,40 C450,10 450,70 600,40 C750,10 750,70 900,40")`,
          }}
        />
      </svg>
    </div>
  );
}
