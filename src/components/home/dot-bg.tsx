export function DotBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundImage: "radial-gradient(circle, #e2e2e2 1.32px, transparent 1.32px)",
        backgroundSize: "24.2px 24.2px",
      }}
    />
  );
}
