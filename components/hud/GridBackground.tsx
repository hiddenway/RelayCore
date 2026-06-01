"use client";

export function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-70" />

      {/* Radial glow center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(14,165,233,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Corner gradient accents */}
      <div
        className="absolute top-0 left-0 w-96 h-96"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(14,165,233,0.06) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-96 h-96"
        style={{
          background:
            "radial-gradient(circle at 100% 100%, rgba(6,182,212,0.05) 0%, transparent 60%)",
        }}
      />

      {/* Horizontal accent lines */}
      <div
        className="absolute left-0 right-0"
        style={{ top: "20%", height: "1px", background: "linear-gradient(90deg, transparent 0%, rgba(14,165,233,0.08) 30%, rgba(14,165,233,0.15) 50%, rgba(14,165,233,0.08) 70%, transparent 100%)" }}
      />
      <div
        className="absolute left-0 right-0"
        style={{ top: "80%", height: "1px", background: "linear-gradient(90deg, transparent 0%, rgba(14,165,233,0.05) 30%, rgba(14,165,233,0.1) 50%, rgba(14,165,233,0.05) 70%, transparent 100%)" }}
      />
    </div>
  );
}
