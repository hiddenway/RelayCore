"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HudCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  corners?: boolean;
  animate?: boolean;
  label?: string;
}

export function HudCard({ children, className, glow, corners, animate = true, label }: HudCardProps) {
  const Wrapper = animate ? motion.div : "div";
  const props = animate
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <Wrapper
      {...(props as object)}
      className={cn(
        "glass-card rounded-lg p-4 relative",
        glow && "glow-border",
        corners && "hud-corner",
        className
      )}
    >
      {label && (
        <div
          className="absolute -top-px left-4 px-2 text-[10px] font-bold tracking-widest uppercase"
          style={{
            background: "#020817",
            color: "rgba(56,189,248,0.7)",
            borderLeft: "1px solid rgba(56,189,248,0.2)",
            borderRight: "1px solid rgba(56,189,248,0.2)",
          }}
        >
          {label}
        </div>
      )}
      {children}
    </Wrapper>
  );
}
