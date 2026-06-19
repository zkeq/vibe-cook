export function DotBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundImage: "radial-gradient(circle, #e2e2e2 1.2px, transparent 1.2px)",
        backgroundSize: "22px 22px",
      }}
    />
  );
}
