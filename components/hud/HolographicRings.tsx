"use client";

import { motion } from "framer-motion";

interface HolographicRingsProps {
  size?: number;
  className?: string;
}

export function HolographicRings({ size = 200, className = "" }: HolographicRingsProps) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer ring */}
      <motion.div
        className="absolute rounded-full border"
        style={{
          width: size * 0.95,
          height: size * 0.95,
          border: "1px solid rgba(56,189,248,0.25)",
          boxShadow: "0 0 20px rgba(56,189,248,0.1)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute w-2 h-2 rounded-full"
          style={{
            top: "2px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(56,189,248,0.8)",
            boxShadow: "0 0 8px rgba(56,189,248,0.9)",
          }}
        />
      </motion.div>

      {/* Middle ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.72,
          height: size * 0.72,
          border: "1px solid rgba(6,182,212,0.35)",
          boxShadow: "0 0 15px rgba(6,182,212,0.1)",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            bottom: "2px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(6,182,212,0.9)",
            boxShadow: "0 0 6px rgba(6,182,212,0.9)",
          }}
        />
        <div
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            top: "2px",
            right: "10%",
            background: "rgba(6,182,212,0.6)",
            boxShadow: "0 0 4px rgba(6,182,212,0.6)",
          }}
        />
      </motion.div>

      {/* Inner ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          border: "1px dashed rgba(56,189,248,0.2)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Core */}
      <div
        className="relative rounded-full flex items-center justify-center z-10"
        style={{
          width: size * 0.32,
          height: size * 0.32,
          background: "radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(2,8,23,0.9) 70%)",
          border: "1px solid rgba(56,189,248,0.4)",
          boxShadow: "0 0 20px rgba(56,189,248,0.2), inset 0 0 20px rgba(56,189,248,0.05)",
        }}
      >
        <motion.div
          style={{
            width: size * 0.12,
            height: size * 0.12,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,189,248,0.9) 0%, rgba(56,189,248,0.3) 60%, transparent 100%)",
            boxShadow: "0 0 15px rgba(56,189,248,0.7)",
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
