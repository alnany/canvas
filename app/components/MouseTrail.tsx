'use client';
import { useEffect, useRef } from 'react';

const BRIGHT = [
  "#ef4444","#f97316","#f59e0b","#22c55e",
  "#06b6d4","#3b82f6","#8b5cf6","#ec4899",
];

interface Spark { x:number; y:number; vx:number; vy:number; color:string; life:number; size:number; }

export function MouseTrail() {
  const ref = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const onMove = (e: MouseEvent) => {
      const n = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        sparks.current.push({
          x: e.clientX + (Math.random() - 0.5) * 8,
          y: e.clientY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 4 - 1,
          color: BRIGHT[Math.floor(Math.random() * BRIGHT.length)],
          life: 1,
          size: 4 + Math.floor(Math.random() * 8),
        });
      }
    };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      sparks.current = sparks.current.filter(s => s.life > 0);
      for (const s of sparks.current) {
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 12;
        ctx.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
        s.x += s.vx; s.y += s.vy;
        s.vy += 0.18;
        s.vx *= 0.98;
        s.life -= 0.035;
        s.size = Math.max(1, s.size - 0.08);
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", zIndex:9999, pointerEvents:"none" }} />;
}
