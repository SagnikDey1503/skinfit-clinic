"use client";

import { motion } from "framer-motion";

export default function WellnessPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex min-h-[70vh] items-center justify-center"
    >
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl font-bold tracking-tight text-teal-400 drop-shadow-[0_0_20px_rgba(45,212,191,0.3)] md:text-4xl"
        >
          Coming Soon
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-3 text-sm text-zinc-500"
        >
          Holistic health tracking is currently in development.
        </motion.p>
      </div>
    </motion.div>
  );
}
