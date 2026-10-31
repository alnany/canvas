"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHUNK, PLOT, REVEAL_R, TEX, LIB_KEYS,
  biomeAt, findSpawn, isLand, key, plotOf, regionName, renderChunk,
} from "./engine";

// ── Types ────────────────────────────────────────────────────────────────────
type Obj = { id: string; x: number; y: number; prompt: string; src: string; owner: string; likes: number; visits: number; liked?: boolean; t: number };
type Plot = { px: number; py: number; owner: string; name: string; last: number };
type Mode = "explore" | "claim" | "create";
type Save = { v: 1; revealed: string[]; plots: Plot[]; objs: Obj[]; credits: number; gens: number; gensDay: number; player: { x: number; y: number }; onboarded: boolean; name: string };

const ME = "you";
const DAY = 86400000;
const FREE_GENS = 5;
const GEN_COST = 10;
const PLOT_COST = 25;
const RECLAIM_COST = 10;
const STORE = "canvas-world-v1";

const DAILY = [
  "Build something you'd find at the edge of the world",
  "A place where travelers rest",
  "Something a dragon would guard",
  "A landmark you can see from far away",
  "A tiny home for a big character",
  "Something that glows at night",
  "A shrine to your favorite food",
];
const IDEAS = ["a lighthouse on the cliffs", "a sleepy red dragon", "a wizard tower with a crystal", "a cherry blossom tree", "a tiny market stall", "a moss-covered robot"];

const NPCS = [
  { name: "Mochi", off: [2, 0] }, { name: "Ren", off: [-2, 1] }, { name: "Aiko", off: [1, -3] },
  { name: "Kenji", off: [4, 2] }, { name: "Yuna", off: [-3, -2] }, { name: "Taro", off: [0, 4] },
  { name: "Hana", off: [-5, 3] }, { name: "Sora", off: [6, -1] },
];

function rand(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

function seedWorld(spawn: { x: number; y: number }): Save {
  const sp = plotOf(spawn.x, spawn.y);
  const r = rand(42);
  const plots: Plot[] = [];
  const objs: Obj[] = [];
  NPCS.forEach((n, i) => {
    const px = sp.px + n.off[0], py = sp.py + n.off[1];
    const cx = px * PLOT + 4, cy = py * PLOT + 4;
    if (!isLand(biomeAt(cx + 0.5, cy + 0.5))) return;
    const abandoned = i === 3;
    plots.push({ px, py, owner: n.name, name: `${n.name}'s ${abandoned ? "Ruins" : "Village"}`, last: Date.now() - (abandoned ? 40 : r() * 5) * DAY });
    const count = 2 + Math.floor(r() * 2);
    for (let k = 0; k < count; k++) {
      const sx = px * PLOT + 1 + Math.floor(r() * 6), sy = py * PLOT + 2 + Math.floor(r() * 5);
      if (!isLand(biomeAt(sx + 0.5, sy + 0.5)) || objs.some(o => o.x === sx && o.y === sy)) continue;
      const lib = LIB_KEYS[Math.floor(r() * LIB_KEYS.length)];
      objs.push({ id: `npc${i}-${k}`, x: sx, y: sy, prompt: `a ${lib} for my village`, src: `/world/sprites/${lib}.png`, owner: n.name, likes: Math.floor(r() * 60), visits: Math.floor(r() * 400), t: Date.now() - r() * 9 * DAY });
    }
  });
  return { v: 1, revealed: [], plots, objs, credits: 60, gens: FREE_GENS, gensDay: Math.floor(Date.now() / DAY), player: spawn, onboarded: false, name: "Traveler" };
}

function score(o: Obj) { return o.likes * 3 + o.visits; }

// pixel-art avatar, 8x10
const AVATAR = [
  "..RRRR..", ".RRRRRR.", "..SSSS..", "..SKSK..", "..SSSS..", ".BBBBBB.", "SBBBBBBS", ".BBBBBB.", "..B..B..", "..D..D..",
];
const AV_COL: Record<string, string> = { R: "#d9453b", S: "#f3c9a0", K: "#222", B: "#2f4fb3", D: "#4a2d1a" };

// ── Component ────────────────────────────────────────────────────────────────
export default function World() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const S = useRef<Save | null>(null);
  const revealed = useRef<Set<string>>(new Set());
  const chunks = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const imgs = useRef<Map<string, HTMLImageElement>>(new Map());
  const cam = useRef({ x: 0, y: 0, z: 34, follow: true });
  const pos = useRef({ x: 0, y: 0 });              // avatar, float tiles
  const target = useRef<{ x: number; y: number } | null>(null);
  const keys = useRef<Set<string>>(new Set());
  const hover = useRef<{ x: number; y: number } | null>(null);
  const modeRef = useRef<Mode>("explore");

  const [, force] = useState(0);
  const rerender = useCallback(() => force(n => n + 1), []);
  const [mode, setModeState] = useState<Mode>("explore");
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [compose, setCompose] = useState<{ x: number; y: number } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [gen, setGen] = useState<{ loading: boolean; src?: string; mode?: string; error?: string }>({ loading: false });
  const [selected, setSelected] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(true);
  const [onboardStep, setOnboardStep] = useState(-1);
  const [region, setRegion] = useState("");

  const setMode = (m: Mode) => { modeRef.current = m; setModeState(m); };
  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-3), { id, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  const persist = useCallback(() => {
    const s = S.current; if (!s) return;
    s.revealed = Array.from(revealed.current);
    s.player = { x: Math.round(pos.current.x), y: Math.round(pos.current.y) };
    try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* quota */ }
  }, []);

  const reveal = useCallback((cx: number, cy: number) => {
    const R = REVEAL_R; let added = 0;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      if (x * x + y * y > R * R) continue;
      const k = key(Math.floor(cx) + x, Math.floor(cy) + y);
      if (!revealed.current.has(k)) { revealed.current.add(k); added++; }
    }
    return added;
  }, []);

  const loadImg = (src: string) => {
    let im = imgs.current.get(src);
    if (!im) { im = new Image(); im.src = src; imgs.current.set(src, im); }
    return im;
  };

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let s: Save | null = null;
    try { const raw = localStorage.getItem(STORE); if (raw) s = JSON.parse(raw) as Save; } catch { s = null; }
    if (!s || s.v !== 1) s = seedWorld(findSpawn());
    const today = Math.floor(Date.now() / DAY);
    if (s.gensDay !== today) { s.gens = FREE_GENS; s.gensDay = today; }
    S.current = s;
    revealed.current = new Set(s.revealed);
    pos.current = { x: s.player.x + 0.5, y: s.player.y + 0.5 };
    cam.current.x = pos.current.x; cam.current.y = pos.current.y;
    reveal(pos.current.x, pos.current.y);

    const q = new URLSearchParams(window.location.search);
    const qx = Number(q.get("x")), qy = Number(q.get("y"));
    if (q.has("x") && Number.isFinite(qx) && Number.isFinite(qy)) {
      reveal(qx, qy); cam.current = { ...cam.current, x: qx + 0.5, y: qy + 0.5, follow: false };
      toast(`Arrived at ${qx}, ${qy} from a shared link`);
    }
    if (innerWidth < 760) setShowBoard(false);
    if (!s.onboarded) setOnboardStep(0);
    persist(); rerender();
  }, [persist, reveal, rerender, toast]);

  // ── Render loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    let raf = 0, last = performance.now(), lastTile = "", saveT = 0;
    const resize = () => { const d = window.devicePixelRatio || 1; c.width = innerWidth * d; c.height = innerHeight * d; };
    resize(); addEventListener("resize", resize);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const s = S.current;
      if (s) {
        // movement
        const k = keys.current; let vx = 0, vy = 0;
        if (k.has("w") || k.has("arrowup")) vy -= 1; if (k.has("s") || k.has("arrowdown")) vy += 1;
        if (k.has("a") || k.has("arrowleft")) vx -= 1; if (k.has("d") || k.has("arrowright")) vx += 1;
        if (vx || vy) { target.current = null; cam.current.follow = true; }
        else if (target.current) {
          const dx = target.current.x - pos.current.x, dy = target.current.y - pos.current.y, d = Math.hypot(dx, dy);
          if (d < 0.1) target.current = null; else { vx = dx / d; vy = dy / d; }
        }
        if (vx || vy) {
          const n = Math.hypot(vx, vy) || 1;
          const onLand = isLand(biomeAt(pos.current.x, pos.current.y));
          const sp = (onLand ? 7 : 3.5) * dt;
          pos.current.x += vx / n * sp; pos.current.y += vy / n * sp;
          const t = key(Math.floor(pos.current.x), Math.floor(pos.current.y));
          if (t !== lastTile) {
            lastTile = t; reveal(pos.current.x, pos.current.y);
            setRegion(regionName(pos.current.x, pos.current.y));
            // discover NPC plots
            const p = plotOf(pos.current.x, pos.current.y);
            const found = s.plots.find(pl => pl.px === p.px && pl.py === p.py && pl.owner !== ME);
            if (found && !(found as Plot & { seen?: boolean }).seen) { (found as Plot & { seen?: boolean }).seen = true; toast(`Discovered ${found.name}`); }
          }
          saveT += dt; if (saveT > 2) { saveT = 0; persist(); }
        }
        if (cam.current.follow) {
          cam.current.x += (pos.current.x - cam.current.x) * Math.min(1, dt * 6);
          cam.current.y += (pos.current.y - cam.current.y) * Math.min(1, dt * 6);
        }
        draw(ctx, c, s, now);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw(ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, s: Save, now: number) {
    const d = window.devicePixelRatio || 1;
    const W = c.width / d, H = c.height / d, z = cam.current.z;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0b0a1a"; ctx.fillRect(0, 0, W, H);
    const ox = W / 2 - cam.current.x * z, oy = H / 2 - cam.current.y * z;
    const tx0 = Math.floor(-ox / z) - 1, ty0 = Math.floor(-oy / z) - 1;
    const tx1 = Math.ceil((W - ox) / z) + 1, ty1 = Math.ceil((H - oy) / z) + 1;

    // terrain chunks
    for (let cy = Math.floor(ty0 / CHUNK); cy <= Math.floor(ty1 / CHUNK); cy++)
      for (let cx = Math.floor(tx0 / CHUNK); cx <= Math.floor(tx1 / CHUNK); cx++) {
        const k = key(cx, cy); let ch = chunks.current.get(k);
        if (!ch) { ch = renderChunk(cx, cy); chunks.current.set(k, ch); if (chunks.current.size > 400) chunks.current.delete(chunks.current.keys().next().value as string); }
        ctx.drawImage(ch, Math.floor(ox + cx * CHUNK * z), Math.floor(oy + cy * CHUNK * z), Math.ceil(CHUNK * z) + 1, Math.ceil(CHUNK * z) + 1);
      }

    // plots
    const nowMs = Date.now();
    ctx.font = `${Math.max(7, Math.min(11, z / 4))}px "Press Start 2P", monospace`;
    for (const p of s.plots) {
      const x = ox + p.px * PLOT * z, y = oy + p.py * PLOT * z, w = PLOT * z;
      if (x > W || y > H || x + w < 0 || y + w < 0) continue;
      if (!revealed.current.has(key(p.px * PLOT + 4, p.py * PLOT + 4))) continue;
      const abandoned = p.owner !== ME && nowMs - p.last > 30 * DAY;
      if (abandoned) {
        ctx.fillStyle = "rgba(40,90,30,0.35)"; ctx.fillRect(x, y, w, w);
        ctx.strokeStyle = "rgba(120,80,40,0.9)"; ctx.setLineDash([4, 4]);
      } else if (p.owner === ME) { ctx.strokeStyle = "#ffd447"; ctx.setLineDash([6, 3]); ctx.fillStyle = "rgba(255,212,71,0.08)"; ctx.fillRect(x, y, w, w); }
      else { ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.setLineDash([2, 4]); }
      ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, w - 2); ctx.setLineDash([]);
      if (z >= 20) {
        const label = abandoned ? `${p.name} · overgrown` : p.name;
        const tw = ctx.measureText(label).width + 10;
        ctx.fillStyle = "rgba(14,20,64,0.85)"; ctx.fillRect(x + 4, y - 16, tw, 15);
        ctx.fillStyle = abandoned ? "#c9a46a" : p.owner === ME ? "#ffd447" : "#fff"; ctx.fillText(label, x + 9, y - 5);
      }
    }

    // claim hover
    const hv = hover.current;
    if (hv && modeRef.current === "claim") {
      const p = plotOf(hv.x, hv.y); const chk = canClaim(p.px, p.py);
      ctx.fillStyle = chk.ok ? "rgba(90,230,120,0.28)" : "rgba(240,80,80,0.25)";
      ctx.fillRect(ox + p.px * PLOT * z, oy + p.py * PLOT * z, PLOT * z, PLOT * z);
    }
    if (hv && modeRef.current === "create") {
      const own = ownerAt(hv.x, hv.y) === ME;
      ctx.strokeStyle = own ? "#7dffb0" : "#ff6b6b"; ctx.lineWidth = 2;
      ctx.strokeRect(ox + hv.x * z, oy + hv.y * z, z, z);
    }

    // objects (y-sorted) + avatar
    const top = [...s.objs].sort((a, b) => score(b) - score(a)).slice(0, 3).map(o => o.id);
    const items: { y: number; fn: () => void }[] = [];
    for (const o of s.objs) {
      if (o.x < tx0 - 3 || o.x > tx1 + 3 || o.y < ty0 - 3 || o.y > ty1 + 3) continue;
      if (!revealed.current.has(key(o.x, o.y))) continue;
      items.push({ y: o.y + 1, fn: () => {
        const im = loadImg(o.src); const sz = z * 2.3;
        const x = ox + (o.x + 0.5) * z - sz / 2, y = oy + (o.y + 1) * z - sz + z * 0.15;
        ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.ellipse(ox + (o.x + 0.5) * z, oy + (o.y + 0.95) * z, z * 0.75, z * 0.22, 0, 0, Math.PI * 2); ctx.fill();
        if (im.complete && im.naturalWidth) ctx.drawImage(im, x, y, sz, sz);
        if (selected === o.id) { ctx.strokeStyle = "#ffd447"; ctx.lineWidth = 2; ctx.strokeRect(x, y, sz, sz); }
        if (top.includes(o.id) && z >= 18) {
          const bob = Math.sin(now / 400 + o.x) * 2;
          drawStar(ctx, ox + (o.x + 0.5) * z, y + bob, Math.max(5, z / 6));
        }
      } });
    }
    items.push({ y: pos.current.y + 0.5, fn: () => {
      const px = Math.max(2, z / 12), ax = ox + pos.current.x * z - 4 * px, ay = oy + pos.current.y * z - 9 * px;
      const bob = (target.current || keys.current.size) ? Math.round(Math.sin(now / 90)) * px * 0.5 : 0;
      AVATAR.forEach((row, ry) => [...row].forEach((ch, rx) => { if (ch !== ".") { ctx.fillStyle = AV_COL[ch]; ctx.fillRect(ax + rx * px, ay + ry * px + bob, px + 0.5, px + 0.5); } }));
    } });
    items.sort((a, b) => a.y - b.y).forEach(i => i.fn());

    // fog of war
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      if (revealed.current.has(key(x, y))) continue;
      const edge = revealed.current.has(key(x + 1, y)) || revealed.current.has(key(x - 1, y)) || revealed.current.has(key(x, y + 1)) || revealed.current.has(key(x, y - 1));
      ctx.fillStyle = edge ? "rgba(11,10,26,0.72)" : "#0b0a1a";
      ctx.fillRect(Math.floor(ox + x * z), Math.floor(oy + y * z), Math.ceil(z) + 1, Math.ceil(z) + 1);
      if (!edge && ((x * 7 + y * 13) % 53 === 0) && z > 14) { ctx.fillStyle = "rgba(180,170,255,0.25)"; ctx.fillRect(ox + x * z + z / 2, oy + y * z + z / 2, 2, 2); }
    }
    if (target.current) {
      ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 2;
      const r = z * 0.3 + Math.sin(now / 150) * 2;
      ctx.beginPath(); ctx.arc(ox + target.current.x * z, oy + target.current.y * z, r, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
    ctx.fillStyle = "#ffd447"; ctx.strokeStyle = "#8a5a00"; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  // ── Rules ──────────────────────────────────────────────────────────────────
  function ownerAt(x: number, y: number) {
    const p = plotOf(x, y); return S.current?.plots.find(pl => pl.px === p.px && pl.py === p.py)?.owner;
  }
  function canClaim(px: number, py: number): { ok: boolean; why?: string; cost: number; reclaim?: boolean } {
    const s = S.current!; const ex = s.plots.find(p => p.px === px && p.py === py);
    const mine = s.plots.filter(p => p.owner === ME).length;
    let land = 0, rev = 0;
    for (let y = 0; y < PLOT; y++) for (let x = 0; x < PLOT; x++) {
      const tx = px * PLOT + x, ty = py * PLOT + y;
      if (isLand(biomeAt(tx + 0.5, ty + 0.5))) land++; if (revealed.current.has(key(tx, ty))) rev++;
    }
    if (rev < PLOT * PLOT * 0.6) return { ok: false, why: "Explore this land first", cost: 0 };
    if (ex) {
      if (ex.owner === ME) return { ok: false, why: "Already yours", cost: 0 };
      if (Date.now() - ex.last > 30 * DAY) return { ok: true, cost: RECLAIM_COST, reclaim: true };
      return { ok: false, why: `Owned by ${ex.owner}`, cost: 0 };
    }
    if (land < PLOT * PLOT * 0.5) return { ok: false, why: "Mostly water — find solid ground", cost: 0 };
    return { ok: true, cost: mine === 0 ? 0 : PLOT_COST };
  }

  function claim(px: number, py: number) {
    const s = S.current!; const chk = canClaim(px, py);
    if (!chk.ok) { toast(chk.why || "Can't claim"); return; }
    if (s.credits < chk.cost) { toast(`Need ${chk.cost} credits`); return; }
    s.credits -= chk.cost;
    const mine = s.plots.filter(p => p.owner === ME).length;
    const name = `${s.name}'s ${["Homestead", "Outpost", "Garden", "Haven", "Hold"][mine % 5]}`;
    s.plots = s.plots.filter(p => !(p.px === px && p.py === py));
    if (chk.reclaim) s.objs = s.objs.filter(o => !(plotOf(o.x, o.y).px === px && plotOf(o.x, o.y).py === py));
    s.plots.push({ px, py, owner: ME, name, last: Date.now() });
    toast(chk.cost === 0 ? "Your first plot is free. Now create something on it!" : `Claimed ${name} (−${chk.cost})`);
    if (mine === 0) setMode("create");
    persist(); rerender();
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  const ptrs = useRef<Map<number, { x: number; y: number }>>(new Map());
  const drag = useRef<{ sx: number; sy: number; cx: number; cy: number; moved: boolean; pinch?: number; z0?: number } | null>(null);

  const toTile = (cx: number, cy: number) => {
    const z = cam.current.z;
    return { fx: (cx - innerWidth / 2) / z + cam.current.x, fy: (cy - innerHeight / 2) / z + cam.current.y };
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      drag.current = { sx: 0, sy: 0, cx: cam.current.x, cy: cam.current.y, moved: true, pinch: Math.hypot(a.x - b.x, a.y - b.y), z0: cam.current.z };
    } else drag.current = { sx: e.clientX, sy: e.clientY, cx: cam.current.x, cy: cam.current.y, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const { fx, fy } = toTile(e.clientX, e.clientY);
    hover.current = { x: Math.floor(fx), y: Math.floor(fy) };
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const d = drag.current; if (!d) return;
    if (d.pinch && ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      cam.current.z = Math.max(14, Math.min(110, d.z0! * Math.hypot(a.x - b.x, a.y - b.y) / d.pinch));
      return;
    }
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (Math.hypot(dx, dy) > 6) d.moved = true;
    if (d.moved) { cam.current.follow = false; cam.current.x = d.cx - dx / cam.current.z; cam.current.y = d.cy - dy / cam.current.z; }
  };
  const onUp = (e: React.PointerEvent) => {
    ptrs.current.delete(e.pointerId);
    const d = drag.current; drag.current = null;
    if (!d || d.moved || ptrs.current.size) return;
    const { fx, fy } = toTile(e.clientX, e.clientY);
    const tx = Math.floor(fx), ty = Math.floor(fy);
    const s = S.current!;
    // click on object?
    const hit = [...s.objs].sort((a, b) => b.y - a.y).find(o => revealed.current.has(key(o.x, o.y)) && fx >= o.x - 0.65 && fx <= o.x + 1.65 && fy >= o.y - 1.2 && fy <= o.y + 1);
    if (hit && modeRef.current !== "create") {
      setSelected(hit.id);
      if (hit.owner !== ME) { hit.visits++; }
      rerender(); return;
    }
    setSelected(null);
    if (modeRef.current === "claim") { const p = plotOf(tx, ty); claim(p.px, p.py); return; }
    if (modeRef.current === "create") {
      if (!revealed.current.has(key(tx, ty))) return;
      if (ownerAt(tx, ty) !== ME) { toast("You can only create on your own land. Claim a plot first."); return; }
      if (s.objs.some(o => o.x === tx && o.y === ty)) { toast("Something already stands here"); return; }
      setCompose({ x: tx, y: ty }); setGen({ loading: false }); return;
    }
    target.current = { x: fx, y: fy }; cam.current.follow = true;
  };
  const onWheel = (e: React.WheelEvent) => {
    cam.current.z = Math.max(14, Math.min(110, cam.current.z * (e.deltaY > 0 ? 1 / 1.1 : 1.1)));
  };

  useEffect(() => {
    const dn = (e: KeyboardEvent) => { if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return; keys.current.add(e.key.toLowerCase()); };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    addEventListener("keydown", dn); addEventListener("keyup", up);
    return () => { removeEventListener("keydown", dn); removeEventListener("keyup", up); };
  }, []);

  // simulated world activity (prototype: stands in for real multiplayer traffic)
  useEffect(() => {
    const t = setInterval(() => {
      const s = S.current; if (!s || !s.objs.length) return;
      const o = s.objs[Math.floor(Math.random() * s.objs.length)];
      o.visits++;
      if (Math.random() < 0.25) o.likes++;
      if (o.owner === ME) { s.credits += 1; toast(`A traveler visited your “${o.prompt.slice(0, 24)}” (+1 credit)`); persist(); }
      rerender();
    }, 6000);
    return () => clearInterval(t);
  }, [persist, rerender, toast]);

  // ── Generation ─────────────────────────────────────────────────────────────
  async function generate() {
    const s = S.current!;
    if (s.gens <= 0 && s.credits < GEN_COST) { toast("Out of free creations and credits"); return; }
    setGen({ loading: true });
    try {
      const r = await fetch("/api/world/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const j = (await r.json()) as { src?: string; mode?: string; error?: string };
      if (!r.ok || !j.src) { setGen({ loading: false, error: j.error || "Generation failed" }); return; }
      let src = j.src;
      if (src.startsWith("data:")) src = await downscale(src, 192);
      if (s.gens > 0) s.gens--; else s.credits -= GEN_COST;
      setGen({ loading: false, src, mode: j.mode }); persist(); rerender();
    } catch { setGen({ loading: false, error: "Network error" }); }
  }
  function place() {
    const s = S.current!; if (!compose || !gen.src) return;
    const o: Obj = { id: `me-${Date.now()}`, x: compose.x, y: compose.y, prompt, src: gen.src, owner: ME, likes: 0, visits: 0, t: Date.now() };
    s.objs.push(o);
    const p = plotOf(compose.x, compose.y); const pl = s.plots.find(x => x.px === p.px && x.py === p.py); if (pl) pl.last = Date.now();
    setCompose(null); setPrompt(""); setGen({ loading: false }); setSelected(o.id);
    toast("Placed! Share it so friends can find it."); persist(); rerender();
  }

  function like(o: Obj) {
    if (o.owner === ME) return;
    o.liked = !o.liked; o.likes += o.liked ? 1 : -1; persist(); rerender();
  }

  async function shareCard(o: Obj) {
    const W = 1080, H = 1920; const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d")!; ctx.imageSmoothingEnabled = false;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1b2670"); g.addColorStop(1, "#0b0a1a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // world window
    const view = 12, cell = 900 / view, x0 = o.x + 0.5 - view / 2, y0 = o.y - view / 2 + 0.5, wx = 90, wy = 330;
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, 900, 900); ctx.clip();
    for (let cy = Math.floor(y0 / CHUNK); cy <= Math.floor((y0 + view) / CHUNK); cy++)
      for (let cx = Math.floor(x0 / CHUNK); cx <= Math.floor((x0 + view) / CHUNK); cx++) {
        let ch = chunks.current.get(key(cx, cy)); if (!ch) { ch = renderChunk(cx, cy); chunks.current.set(key(cx, cy), ch); }
        ctx.drawImage(ch, wx + (cx * CHUNK - x0) * cell, wy + (cy * CHUNK - y0) * cell, CHUNK * cell + 1, CHUNK * cell + 1);
      }
    const near = S.current!.objs.filter(n => Math.abs(n.x - o.x) < view && Math.abs(n.y - o.y) < view).sort((a, b) => a.y - b.y);
    for (const n of near) {
      const im = loadImg(n.src); if (!im.complete) await new Promise(r => { im.onload = r; im.onerror = r; });
      const sz = cell * (n.id === o.id ? 3.4 : 2.3);
      ctx.drawImage(im, wx + (n.x + 0.5 - x0) * cell - sz / 2, wy + (n.y + 1 - y0) * cell - sz, sz, sz);
    }
    ctx.restore();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 10; ctx.strokeRect(wx, wy, 900, 900);
    ctx.strokeStyle = "#0a0f30"; ctx.lineWidth = 4; ctx.strokeRect(wx + 9, wy + 9, 882, 882);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center";
    ctx.font = '64px "Press Start 2P", monospace'; ctx.fillText("CANVAS", W / 2, 150);
    ctx.font = '28px "Press Start 2P", monospace'; ctx.fillStyle = "#9fb4ff"; ctx.fillText("A WORLD BUILT BY PROMPTS", W / 2, 215);
    ctx.fillStyle = "#ffd447"; ctx.font = '30px "Press Start 2P", monospace';
    wrap(ctx, `“${o.prompt}”`, W / 2, 1340, 900, 48);
    ctx.fillStyle = "#fff"; ctx.font = '26px "Press Start 2P", monospace';
    ctx.fillText(`by ${o.owner === ME ? S.current!.name : o.owner} · ${regionName(o.x, o.y)}`, W / 2, 1560);
    ctx.fillStyle = "#9fb4ff"; ctx.fillText(`${o.likes} likes · ${o.visits} visits`, W / 2, 1620);
    ctx.fillStyle = "#fff"; ctx.font = '24px "Press Start 2P", monospace';
    ctx.fillText(`Visit it → canvas.world/@${o.x},${o.y}`, W / 2, 1780);
    const url = c.toDataURL("image/png");
    const a = document.createElement("a"); a.href = url; a.download = `canvas-${o.x}_${o.y}.png`; a.click();
    const link = `${location.origin}/world?x=${o.x}&y=${o.y}`;
    try { await navigator.clipboard.writeText(link); toast("Share card downloaded · link copied"); } catch { toast("Share card downloaded"); }
  }

  const s = S.current;
  const sel = s?.objs.find(o => o.id === selected) || null;
  const board = s ? [...s.objs].sort((a, b) => score(b) - score(a)).slice(0, 8) : [];
  const myPlots = s ? s.plots.filter(p => p.owner === ME).length : 0;
  const day = Math.floor(Date.now() / DAY);
  const daily = DAILY[day % DAILY.length];

  const goTo = (o: Obj) => { target.current = { x: o.x + 0.5, y: o.y + 1.6 }; cam.current.follow = true; setSelected(o.id); };

  return (
    <div className="cw-root">
      <style>{CSS}</style>
      <canvas ref={canvasRef} className="cw-canvas" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel} onContextMenu={e => e.preventDefault()} />

      {/* top-left: identity */}
      <div className="win cw-tl">
        <div className="cw-logo">CANVAS<span>WORLD</span></div>
        <div className="cw-sub">{region || (s ? regionName(pos.current.x, pos.current.y) : "")} · {Math.floor(pos.current.x)}, {Math.floor(pos.current.y)}</div>
      </div>

      {/* top-center: daily prompt */}
      <div className="win cw-daily"><b>TODAY&apos;S WORLD PROMPT</b><span>{daily}</span></div>

      {/* top-right: wallet */}
      <div className="win cw-tr">
        <div><i className="sym g">◆</i>{s?.credits ?? 0}<small>credits</small></div>
        <div><i className="sym b">✦</i>{s?.gens ?? 0}/{FREE_GENS}<small>free today</small></div>
        <div><i className="sym y">▣</i>{myPlots}<small>plots</small></div>
      </div>

      {/* landmarks */}
      {showBoard && (
        <div className="win cw-board">
          <div className="cw-h"><span><i className="sym">★</i> LANDMARKS</span> <button onClick={() => setShowBoard(false)}>×</button></div>
          {board.map((o, i) => {
            const known = revealed.current.has(key(o.x, o.y));
            return (
              <button key={o.id} className="cw-row" onClick={() => goTo(o)}>
                <span className="rk">{i + 1}</span>
                {known ? <img src={o.src} alt="" /> : <span className="unk">?</span>}
                <span className="nm">{known ? o.prompt : "Unexplored wonder"}<small>{o.owner === ME ? "you" : o.owner} · <i className="sym">★</i>{o.likes}</small></span>
              </button>
            );
          })}
          <div className="cw-note">Top 3 become permanent landmarks.</div>
        </div>
      )}
      {!showBoard && <button className="win cw-boardbtn" onClick={() => setShowBoard(true)}><i className="sym">★</i></button>}

      {/* dock */}
      <div className="win cw-dock">
        {(["explore", "claim", "create"] as Mode[]).map(m => (
          <button key={m} className={mode === m ? "on" : ""} onClick={() => { setMode(m); setSelected(null); }}>
            <span className="ic">{m === "explore" ? "➶" : m === "claim" ? "⚑" : "✎"}</span>{m.toUpperCase()}
          </button>
        ))}
        <span className="sep" />
        <button className="sm" onClick={() => (cam.current.z = Math.min(110, cam.current.z * 1.25))}>+</button>
        <button className="sm" onClick={() => (cam.current.z = Math.max(14, cam.current.z / 1.25))}>−</button>
        <button className="sm" onClick={() => (cam.current.follow = true)}>◎</button>
      </div>
      <div className="cw-hint">
        {mode === "explore" && "Tap to walk · WASD · drag to look around"}
        {mode === "claim" && (myPlots === 0 ? "Tap any explored land to claim your FREE first plot" : `Tap explored land to claim (${PLOT_COST} credits) · overgrown plots ${RECLAIM_COST}`)}
        {mode === "create" && "Tap a tile on your land, then describe what to build"}
      </div>

      {/* selected object */}
      {sel && !compose && (
        <div className="win cw-card">
          <img src={sel.src} alt="" />
          <div className="cw-cbody">
            <div className="q">“{sel.prompt}”</div>
            <div className="m">by {sel.owner === ME ? s?.name : sel.owner} · {regionName(sel.x, sel.y)}</div>
            <div className="m"><i className="sym">★</i> {sel.likes} · {sel.visits} visits</div>
            <div className="acts">
              {sel.owner !== ME && <button onClick={() => like(sel)}>{sel.liked ? "LIKED" : "LIKE"}</button>}
              <button onClick={() => shareCard(sel)}>SHARE</button>
              <button onClick={() => setSelected(null)}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* compose */}
      {compose && (
        <div className="cw-modal" onClick={() => !gen.loading && setCompose(null)}>
          <div className="win cw-compose" onClick={e => e.stopPropagation()}>
            <div className="cw-h">WHAT WILL YOU BUILD?</div>
            <textarea autoFocus maxLength={200} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. a lighthouse on the cliffs, glowing at night" />
            <div className="chips">
              <button onClick={() => setPrompt(daily.toLowerCase())}>Today: {daily}</button>
              {IDEAS.map(i => <button key={i} onClick={() => setPrompt(i)}>{i}</button>)}
            </div>
            <div className="preview">
              {gen.loading && <div className="spin">Summoning<span>...</span></div>}
              {!gen.loading && gen.src && <img src={gen.src} alt="" />}
              {!gen.loading && !gen.src && <div className="ph">{gen.error || "Every creation is rendered in the world's 16-bit style."}</div>}
            </div>
            {gen.mode === "library" && <div className="cw-note">Prototype: matched from the style library. Add an image API key for live AI generation.</div>}
            <div className="acts">
              <button disabled={gen.loading || prompt.trim().length < 3} onClick={generate}>
                {gen.src ? "REROLL" : "CREATE"} <small>{(s?.gens ?? 0) > 0 ? "free" : `${GEN_COST} cr`}</small>
              </button>
              <button className="pri" disabled={!gen.src || gen.loading} onClick={place}>PLACE</button>
            </div>
          </div>
        </div>
      )}

      {/* onboarding */}
      {onboardStep >= 0 && (
        <div className="cw-modal">
          <div className="win cw-onb">
            {onboardStep === 0 && <><div className="cw-h">THE WORLD IS UNWRITTEN</div><p>Beyond the fog lies land nobody has seen. Walk to uncover it. Tap to move, or use WASD.</p></>}
            {onboardStep === 1 && <><div className="cw-h">CLAIM YOUR LAND</div><p>Your first plot is free. Pick a spot you love. Neglected land grows wild and can be reclaimed.</p></>}
            {onboardStep === 2 && <><div className="cw-h">BUILD WITH WORDS</div><p>No drawing needed. Describe anything, and it appears in the world&apos;s art style. The most-loved creations become landmarks.</p></>}
            <div className="acts">
              <button className="pri" onClick={() => {
                if (onboardStep < 2) setOnboardStep(onboardStep + 1);
                else { setOnboardStep(-1); if (S.current) { S.current.onboarded = true; persist(); } }
              }}>{onboardStep < 2 ? "NEXT ▸" : "BEGIN"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="cw-toasts">{toasts.map(t => <div key={t.id} className="win toast">{t.text}</div>)}</div>
    </div>
  );
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(" "); let line = ""; let yy = y;
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > max && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t;
  }
  ctx.fillText(line, x, yy);
}

function downscale(src: string, size: number): Promise<string> {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => { const c = document.createElement("canvas"); c.width = size; c.height = size; const x = c.getContext("2d")!; x.imageSmoothingEnabled = false; x.drawImage(im, 0, 0, size, size); res(c.toDataURL("image/png")); };
    im.onerror = () => res(src); im.src = src;
  });
}

void TEX;

const CSS = `
.sym{font-family:system-ui,"Segoe UI Symbol",sans-serif;font-style:normal}
.cw-root{position:fixed;inset:0;overflow:hidden;background:#0b0a1a;font-family:"Press Start 2P",monospace;color:#fff;user-select:none;-webkit-user-select:none}
.cw-canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:pointer;image-rendering:pixelated}
.win{box-sizing:border-box;background:linear-gradient(180deg,#2b3d9a 0%,#16206a 100%);border:3px solid #f4f4ff;border-radius:7px;box-shadow:inset 0 0 0 2px #0a0f30,0 6px 0 rgba(0,0,0,.35);}
.cw-tl{position:absolute;top:12px;left:12px;padding:10px 14px}
.cw-logo{font-size:15px;letter-spacing:2px;background:linear-gradient(90deg,#ff6b6b,#ffd447,#7dffb0,#6bc7ff,#c38bff);-webkit-background-clip:text;color:transparent}
.cw-logo span{font-size:8px;margin-left:8px;color:#9fb4ff;-webkit-text-fill-color:#9fb4ff}
.cw-sub{font-size:8px;color:#c9d3ff;margin-top:8px}
.cw-daily{position:absolute;top:12px;left:50%;transform:translateX(-50%);padding:9px 14px;display:flex;flex-direction:column;gap:6px;align-items:center;max-width:46vw;text-align:center}
.cw-daily b{font-size:7px;color:#ffd447;font-weight:normal}
.cw-daily span{font-size:9px;line-height:1.5}
.cw-tr{position:absolute;top:12px;right:12px;padding:10px 12px;display:flex;gap:14px;font-size:11px}
.cw-tr div{display:flex;flex-direction:column;align-items:center;gap:5px}
.cw-tr small{font-size:6px;color:#9fb4ff}
.cw-tr i{font-style:normal;margin-right:4px}.g{color:#7dffb0}.b{color:#6bc7ff}.y{color:#ffd447}
.cw-board{position:absolute;right:12px;top:84px;width:250px;padding:10px;max-height:calc(100vh - 200px);overflow:auto}
.cw-h{font-size:10px;color:#ffd447;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}
.cw-h button{background:none;border:0;color:#fff;font:inherit;cursor:pointer}
.cw-row{display:flex;gap:8px;align-items:center;width:100%;background:rgba(0,0,0,.18);border:0;border-radius:4px;padding:5px;margin-bottom:5px;color:#fff;cursor:pointer;text-align:left;font-family:inherit}
.cw-row:hover{background:rgba(255,255,255,.12)}
.cw-row img{width:30px;height:30px;image-rendering:pixelated}
.cw-row .unk{width:30px;height:30px;display:grid;place-items:center;background:#0b0a1a;border-radius:3px;color:#6b6b9a}
.rk{font-size:9px;color:#ffd447;width:14px}
.nm{font-size:7px;line-height:1.5;flex:1;overflow:hidden}
.nm small{display:block;color:#9fb4ff;font-size:6px}
.cw-note{font-size:6px;color:#9fb4ff;line-height:1.6;margin-top:6px}
.cw-boardbtn{position:absolute;right:12px;top:84px;width:40px;height:40px;color:#ffd447;font-size:14px;cursor:pointer}
.cw-dock{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:6px;padding:7px;align-items:center}
.cw-dock button{background:rgba(0,0,0,.2);border:2px solid transparent;color:#fff;font-family:inherit;font-size:9px;padding:10px 12px;border-radius:5px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px}
.cw-dock button .ic{font-size:16px;font-family:system-ui}
.cw-dock button.on{border-color:#ffd447;background:rgba(255,212,71,.15);color:#ffd447}
.cw-dock button.sm{padding:8px 11px;font-size:13px}
.cw-dock .sep{width:2px;height:34px;background:rgba(255,255,255,.25)}
.cw-hint{position:absolute;bottom:104px;left:50%;transform:translateX(-50%);font-size:8px;color:#fff;text-shadow:0 2px 0 #000;white-space:nowrap}
.cw-card{position:absolute;left:12px;bottom:18px;display:flex;gap:12px;padding:12px;width:340px}
.cw-card>img{width:96px;height:96px;image-rendering:pixelated;background:rgba(0,0,0,.25);border-radius:4px}
.cw-cbody{flex:1;display:flex;flex-direction:column;gap:7px}
.q{font-size:9px;line-height:1.6;color:#ffd447}.m{font-size:7px;color:#c9d3ff}
.acts{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
.acts button{background:#0e1550;border:2px solid #f4f4ff;color:#fff;font-family:inherit;font-size:8px;padding:8px 10px;border-radius:4px;cursor:pointer}
.acts button.pri{background:#ffd447;color:#1a1440;border-color:#fff}
.acts button:disabled{opacity:.4;cursor:default}
.acts small{font-size:6px;color:#7dffb0;margin-left:4px}
.cw-modal{position:absolute;inset:0;background:rgba(5,5,20,.55);display:grid;place-items:center}
.cw-compose{width:min(460px,92vw);padding:16px}
.cw-compose textarea{width:100%;height:64px;background:#0b0f3a;border:2px solid #6b7cff;border-radius:4px;color:#fff;font-family:inherit;font-size:10px;line-height:1.6;padding:8px;resize:none;outline:none;box-sizing:border-box}
.chips{display:flex;flex-wrap:wrap;gap:5px;margin:10px 0}
.chips button{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.35);color:#dfe5ff;font-family:inherit;font-size:6px;padding:6px 7px;border-radius:12px;cursor:pointer}
.preview{height:200px;background:repeating-conic-gradient(#1a2266 0% 25%,#141b55 0% 50%) 50%/20px 20px;border-radius:4px;display:grid;place-items:center}
.preview img{height:190px;image-rendering:pixelated}
.ph{font-size:8px;color:#9fb4ff;max-width:70%;text-align:center;line-height:1.7}
.spin{font-size:10px;color:#ffd447}.spin span{animation:bl 1s steps(3) infinite}
@keyframes bl{0%{opacity:.2}100%{opacity:1}}
.cw-onb{width:min(420px,90vw);padding:20px}
.cw-onb p{font-size:9px;line-height:1.9;color:#dfe5ff}
.cw-toasts{position:absolute;left:12px;top:90px;display:flex;flex-direction:column;gap:6px;max-width:300px}
.toast{font-size:8px;line-height:1.6;padding:8px 10px;animation:tin .25s ease-out}
@keyframes tin{from{transform:translateX(-20px);opacity:0}}
@media (max-width:760px){
 .cw-tl{top:8px;left:8px;padding:7px 9px;max-width:44vw}.cw-logo{font-size:10px}.cw-logo span{display:none}.cw-sub{font-size:6px;margin-top:6px}
 .cw-tr{top:8px;right:8px;gap:7px;font-size:9px;padding:7px 8px}.cw-tr small{font-size:5px}
 .cw-daily{top:62px;max-width:92vw;padding:7px 10px}.cw-daily span{font-size:7px}
 .cw-board{top:auto;bottom:150px;left:8px;right:8px;width:auto;max-height:45vh}.cw-boardbtn{top:auto;bottom:100px;right:8px;width:36px;height:36px}
 .cw-dock{bottom:10px;gap:4px;padding:5px}.cw-dock button{padding:7px 8px;font-size:7px}.cw-dock button.sm{padding:7px 8px}
 .cw-hint{bottom:84px;font-size:6px;white-space:normal;width:80vw;text-align:center}
 .cw-card{left:8px;right:8px;width:auto;bottom:100px}
 .cw-toasts{top:118px;left:8px;right:8px;max-width:none}
}
`;
