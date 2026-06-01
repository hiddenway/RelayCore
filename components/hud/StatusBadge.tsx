"use client";

interface StatusBadgeProps {
  active: boolean;
  label?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ active, label, size = "md" }: StatusBadgeProps) {
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 ${textSize} font-semibold tracking-wider uppercase`}>
      <span className="relative flex items-center justify-center">
        <span
          className={`${dotSize} rounded-full`}
          style={{
            background: active ? "#10b981" : "#6b7280",
            boxShadow: active ? "0 0 6px #10b981, 0 0 12px rgba(16,185,129,0.4)" : "none",
          }}
        />
        {active && (
          <span
            className={`absolute ${dotSize} rounded-full status-dot`}
            style={{ background: "rgba(16,185,129,0.4)" }}
          />
        )}
      </span>
      {label && (
        <span style={{ color: active ? "#6ee7b7" : "#9ca3af" }}>
          {label}
        </span>
      )}
    </span>
  );
}
