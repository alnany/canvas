'use client';
import { useEffect, useRef } from 'react';

const BRIGHT = [
  "#ef4444","#f97316","#f59e0b","#22c55e",
  "#06b6d4","#3b82f6","#8b5cf6","#ec4899",
];

interface BgCanvasProps {
  opacity?: number;
  /** Speed multiplier: 1 = default, <1 = slower */
  speedScale?: number;
}

export function BgCanvas({ opacity = 0.15, speedScale = 1 }: BgCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const PX = 16;
    let W = 0, H = 0;
    const resize = () => {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cols = () => Math.ceil(W / PX);
    let drops: number[] = [];
    let speeds: number[] = [];
    let colors: string[] = [];
    const init = () => {
      const c = cols();
      drops  = Array.from({ length: c }, () => -Math.random() * 60);
      speeds = Array.from({ length: c }, () => (0.08 + Math.random() * 0.22) * speedScale);
      colors = Array.from({ length: c }, () => BRIGHT[Math.floor(Math.random() * BRIGHT.length)]);
    };
    init();

    let raf: number;
    const draw = () => {
      ctx.fillStyle = "rgba(10,10,15,0.18)";
      ctx.fillRect(0, 0, W, H);
      const c = cols();
      if (drops.length !== c) init();
      for (let i = 0; i < c; i++) {
        const x = i * PX, y = drops[i] * PX;
        ctx.fillStyle = colors[i];
        ctx.shadowColor = colors[i];
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, PX - 2, PX - 2);
        ctx.globalAlpha = 0.35;
        ctx.fillRect(x, y - PX, PX - 2, PX - 2);
        ctx.globalAlpha = 0.15;
        ctx.fillRect(x, y - PX * 2, PX - 2, PX - 2);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        if (Math.random() < 0.004) colors[i] = BRIGHT[Math.floor(Math.random() * BRIGHT.length)];
        drops[i] += speeds[i];
        if (drops[i] * PX > H + PX * 3) {
          drops[i] = -Math.random() * 20;
          colors[i] = BRIGHT[Math.floor(Math.random() * BRIGHT.length)];
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [speedScale]);

  return <canvas ref={ref} style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", zIndex:0, opacity, pointerEvents:"none" }} />;
}
