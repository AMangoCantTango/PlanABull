import { useEffect, useRef } from "react";
// Contour lines from a twisted torus, projected and depth-sorted like an engraved print.
export function PlanArt() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    function draw() {
      const w = canvas.clientWidth,
        h = canvas.clientHeight,
        d = Math.min(devicePixelRatio, 2);
      canvas.width = w * d;
      canvas.height = h * d;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(d, d);
      const scale = Math.min(w * 0.32, h * 0.69);
      const rings = [];
      for (let i = 0; i < 108; i++) {
        const a = (i * Math.PI) / 54;
        const points = [];
        for (let j = 0; j <= 72; j++) {
          const b = (j * Math.PI) / 36,
            twist = b + 2 * a;
          const radial =
            1.03 +
            0.37 * Math.cos(b) * Math.cos(a) +
            0.59 * Math.sin(b) * Math.sin(a);
          const x = radial * Math.cos(a),
            y = radial * Math.sin(a),
            z = 0.41 * Math.sin(twist) + 0.29 * Math.sin(2 * a);
          points.push([
            w * 0.59 + scale * (x * 0.92 - y * 0.34),
            h * 0.51 + scale * (x * 0.29 + y * 0.54 - z * 0.89),
          ]);
        }
        rings.push({ points, depth: Math.sin(a) });
      }
      rings.sort((a, b) => a.depth - b.depth);
      for (const { points, depth } of rings) {
        ctx.beginPath();
        points.forEach(([x, y], i) =>
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
        );
        ctx.closePath();
        ctx.fillStyle = "#08261c";
        ctx.fill();
        ctx.strokeStyle = "hsl(149 72% " + (48 + depth * 20) + "%)";
        ctx.lineWidth = 1.15;
        ctx.stroke();
      }
    }
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, []);
  return <canvas className="plan-art" aria-hidden="true" ref={ref} />;
}
