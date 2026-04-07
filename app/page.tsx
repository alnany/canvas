'use client';
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Lang, getLang, t } from './i18n/translations';
import LangSwitcher from './components/LangSwitcher';
import { CanvasLogo } from './components/CanvasLogo';

const PALETTE = [
  "#ef4444","#f97316","#f59e0b","#22c55e",
  "#06b6d4","#3b82f6","#8b5cf6","#ec4899",
  "#f1f5f9","#64748b","#1e293b","#ffffff",
];
const BRIGHT = PALETTE.slice(0, 8);

// ── Full-page background: matrix falling neon pixels ─────────────────────────
function BgCanvas() {
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
      speeds = Array.from({ length: c }, () => 0.08 + Math.random() * 0.22);
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
        // fading trail pixel one step above
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
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", zIndex:0, opacity:0.15, pointerEvents:"none" }} />;
}

// ── Mouse trailing pixel sparks ───────────────────────────────────────────────
interface Spark { x:number; y:number; vx:number; vy:number; color:string; life:number; size:number; }

function MouseTrail() {
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

// ── Enhanced MiniCanvas ───────────────────────────────────────────────────────
interface Ring { cx:number; cy:number; r:number; maxR:number; color:string; life:number; }

function MiniCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const SIZE = 42, PX = 10;
    cv.width = SIZE * PX; cv.height = SIZE * PX;

    const grid = Array.from({ length: SIZE * SIZE }, () =>
      Math.random() > 0.42 ? PALETTE[Math.floor(Math.random() * PALETTE.length)] : "#12122a"
    );
    const rings: Ring[] = [];

    const addRing = (idx: number, color: string) => {
      rings.push({ cx:(idx % SIZE + 0.5)*PX, cy:(Math.floor(idx/SIZE)+0.5)*PX, r:0, maxR:(3+Math.random()*5)*PX, color, life:1 });
    };

    const triggerWave = () => {
      const wc = BRIGHT[Math.floor(Math.random() * BRIGHT.length)];
      const isRow = Math.random() > 0.5;
      const line = Math.floor(Math.random() * SIZE);
      for (let i = 0; i < SIZE; i++) {
        setTimeout(() => {
          const idx = isRow ? line * SIZE + i : i * SIZE + line;
          grid[idx] = wc;
        }, i * 18);
      }
    };

    // explosion: flood-fill style burst from a point
    const triggerExplosion = () => {
      const cx = Math.floor(Math.random() * SIZE);
      const cy = Math.floor(Math.random() * SIZE);
      const color = BRIGHT[Math.floor(Math.random() * BRIGHT.length)];
      const radius = 4 + Math.floor(Math.random() * 6);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx*dx + dy*dy <= radius*radius) {
            const nx = cx+dx, ny = cy+dy;
            if (nx>=0 && nx<SIZE && ny>=0 && ny<SIZE) {
              setTimeout(() => {
                grid[ny*SIZE+nx] = color;
              }, Math.sqrt(dx*dx+dy*dy) * 25);
            }
          }
        }
      }
      addRing(cy*SIZE+cx, color);
    };

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < SIZE*SIZE; i++) {
        const color = grid[i];
        const x = (i%SIZE)*PX, y = Math.floor(i/SIZE)*PX;
        if (color === "#12122a" || color === "#1e293b" || color === "#1a1a2e") {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, PX, PX);
        } else {
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.fillRect(x, y, PX-1, PX-1);
          ctx.shadowBlur = 0;
        }
      }
      // draw rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const b = rings[i];
        ctx.globalAlpha = b.life * 0.9;
        ctx.strokeStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.cx, b.cy, b.r, 0, Math.PI*2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        b.r += (b.maxR - b.r) * 0.08 + 1.2;
        b.life -= 0.022;
        if (b.life <= 0) rings.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();

    // fast random pixel churn
    const iv = setInterval(() => {
      const n = 4 + Math.floor(Math.random() * 6);
      for (let k = 0; k < n; k++) {
        const idx = Math.floor(Math.random() * SIZE*SIZE);
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        grid[idx] = color;
        if (Math.random() < 0.25) addRing(idx, color);
      }
    }, 55);

    const waveIv  = setInterval(() => { if (Math.random() < 0.7) triggerWave(); },      900);
    const bombIv  = setInterval(() => { triggerExplosion(); },                          2200);

    return () => { cancelAnimationFrame(raf); clearInterval(iv); clearInterval(waveIv); clearInterval(bombIv); };
  }, []);
  return (
    <canvas ref={ref} style={{
      imageRendering:"pixelated",
      border:"2px solid #6d28d9",
      borderRadius:10,
      boxShadow:"0 0 40px rgba(168,85,247,0.55), 0 0 80px rgba(124,58,237,0.3), 0 0 120px rgba(99,102,241,0.15)",
    }} />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [count, setCount] = useState(1247903);
  const [lang, setLang_] = useState<Lang>('en');

  useEffect(() => { setLang_(getLang()); }, []);
  useEffect(() => {
    const t_ = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3 + 1)), 400);
    return () => clearInterval(t_);
  }, []);

  const T = (key: Parameters<typeof t>[1], vars?: Parameters<typeof t>[2]) => t(lang, key, vars);

  const STEPS = [
    { emoji:"🎨", label: T('step1_label'), desc: T('step1_desc') },
    { emoji:"💰", label: T('step2_label'), desc: T('step2_desc') },
    { emoji:"🛡️", label: T('step3_label'), desc: T('step3_desc') },
    { emoji:"🔗", label: T('step4_label'), desc: T('step4_desc') },
  ];

  const TOKENOMICS = [
    { label: T('tok_gameplay'), pct:75, color:"#a855f7", sub: T('tok_gameplay_sub') },
    { label: T('tok_lp'),       pct:15, color:"#22d3ee", sub: T('tok_lp_sub') },
    { label: T('tok_dao'),      pct:10, color:"#f59e0b", sub: T('tok_dao_sub') },
  ];

  return (
    <div style={{ background:"#0a0a0f", color:"#e2e8f0", fontFamily:"'Share Tech Mono','Courier New',monospace", minHeight:"100vh", position:"relative" }}>
      <BgCanvas />
      <MouseTrail />

      {/* all content sits above bg canvas */}
      <div style={{ position:"relative", zIndex:1 }}>
        {/* NAV */}
        <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 32px", borderBottom:"1px solid #1e1e3f", backdropFilter:"blur(4px)", background:"rgba(10,10,15,0.6)" }}>
          <CanvasLogo size="sm" />
          <div style={{ display:"flex", gap:16, alignItems:"center", fontSize:16 }}>
            <a href="#mechanics" style={{ color:"#94a3b8", textDecoration:"none" }}>{T('nav_mechanics')}</a>
            <a href="#tokenomics" style={{ color:"#94a3b8", textDecoration:"none" }}>{T('nav_tokenomics')}</a>
            <LangSwitcher lang={lang} onChange={setLang_} />
            <Link href="/play" style={{ padding:"8px 20px", background:"#7c3aed", color:"#fff", borderRadius:6, textDecoration:"none", fontWeight:"bold", fontSize:16 }}>
              {T('nav_play_demo')}
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ display:"flex", alignItems:"center", justifyContent:"space-between", maxWidth:1100, margin:"0 auto", padding:"80px 32px", gap:48 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:17, color:"#22d3ee", marginBottom:12, letterSpacing:3, textTransform:"uppercase" }}>
              {T('hero_tag')}
            </div>
            <div style={{ marginBottom: 20 }}>
              <CanvasLogo size="lg" />
            </div>
            <p style={{ fontSize:22, color:"#cbd5e1", marginBottom:8, maxWidth:480, lineHeight:1.6 }}>
              <span style={{ color:"#a855f7" }}>{T('hero_sub1')}</span><br />
              {T('hero_sub2')}
            </p>
            <p style={{ fontSize:16, color:"#475569", marginBottom:32, maxWidth:420, lineHeight:1.7 }}>
              {T('hero_desc')}
            </p>
            <div style={{ display:"flex", gap:12 }}>
              <Link href="/play" style={{
                padding:"14px 28px", background:"linear-gradient(135deg,#7c3aed,#a855f7)",
                color:"#fff", borderRadius:8, textDecoration:"none", fontWeight:"bold", fontSize:17,
                boxShadow:"0 0 24px rgba(168,85,247,0.45)"
              }}>{T('hero_cta_play')}</Link>
              <a href="#mechanics" style={{
                padding:"14px 28px", border:"1px solid #4c1d95",
                color:"#a855f7", borderRadius:8, textDecoration:"none", fontSize:14
              }}>{T('hero_cta_how')}</a>
            </div>
            <div style={{ marginTop:24, fontSize:15, color:"#475569", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:8, height:8, background:"#22c55e", borderRadius:"50%", display:"inline-block", animation:"pulse 2s infinite" }} />
              <span style={{ color:"#22c55e" }}>{count.toLocaleString()}</span> {T('hero_pixels_placed')}
            </div>
          </div>
          <div style={{ flexShrink:0, position:"relative" }}>
            <div style={{ position:"absolute", inset:-48, background:"radial-gradient(circle,rgba(124,58,237,0.25),transparent 70%)", borderRadius:"50%", animation:"pulse 3s infinite" }} />
            <MiniCanvas />
          </div>
        </section>

        {/* CORE LOOP */}
        <section id="mechanics" style={{ maxWidth:1100, margin:"0 auto", padding:"60px 32px" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div style={{ fontSize:17, color:"#a855f7", letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>{T('section_core_loop')}</div>
            <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize:22 }}>{T('section_how')}</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
            {STEPS.map((s,i) => (
              <div key={i} style={{ padding:24, background:"rgba(18,18,26,0.85)", border:"1px solid #1e1e3f", borderRadius:12, backdropFilter:"blur(4px)" }}>
                <div style={{ fontSize:28, marginBottom:12 }}>{s.emoji}</div>
                <div style={{ color:"#c084fc", fontWeight:"bold", marginBottom:8, fontSize:16 }}>{i+1}. {s.label}</div>
                <p style={{ color:"#64748b", fontSize:15, lineHeight:1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* STRIKES */}
        <section style={{ maxWidth:1100, margin:"0 auto", padding:"0 32px 60px" }}>
          <div style={{ background:"rgba(13,17,23,0.85)", border:"1px solid #0e3a4f", borderRadius:16, padding:32, backdropFilter:"blur(4px)" }}>
            <div style={{ fontSize:17, color:"#22d3ee", letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>{T('section_strikes')}</div>
            <p style={{ color:"#94a3b8", marginBottom:24, fontSize:16 }}>{T('strikes_desc')}</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
              {([
                { tierKey:"strike_common"    as const, chance:"5%",   mult:"5×",   color:"#64748b", glow:"rgba(100,116,139,0.3)" },
                { tierKey:"strike_rare"      as const, chance:"1%",   mult:"25×",  color:"#22d3ee", glow:"rgba(34,211,238,0.3)"  },
                { tierKey:"strike_legendary" as const, chance:"0.1%", mult:"200×", color:"#f59e0b", glow:"rgba(245,158,11,0.35)" },
              ]).map(tier => (
                <div key={tier.tierKey} style={{ padding:20, borderRadius:12, background:`${tier.glow}`,
                  border:`1px solid ${tier.color}50`, boxShadow:`0 0 16px ${tier.glow}` }}>
                  <div style={{ fontSize:17, color:tier.color, marginBottom:4 }}>{T(tier.tierKey)}</div>
                  <div style={{ fontSize:40, fontWeight:"bold", color:tier.color }}>{tier.mult}</div>
                  <div style={{ fontSize:17, color:"#475569", marginTop:4 }}>{tier.chance} {T('strike_chance')}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize:17, color:"#475569", marginTop:16 }}>{T('strikes_ev')}</p>
          </div>
        </section>

        {/* TOKENOMICS */}
        <section id="tokenomics" style={{ maxWidth:1100, margin:"0 auto", padding:"0 32px 60px" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div style={{ fontSize:17, color:"#a855f7", letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>{T('section_tokenomics')}</div>
            <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize:22 }}>{T('tok_title')}</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:16 }}>
            {TOKENOMICS.map(tok => (
              <div key={tok.label} style={{ padding:24, background:"rgba(18,18,26,0.85)", border:`1px solid ${tok.color}30`, borderRadius:12, backdropFilter:"blur(4px)" }}>
                <div style={{ fontSize:40, fontWeight:"bold", color:tok.color, marginBottom:4 }}>{tok.pct}%</div>
                <div style={{ fontWeight:"bold", fontSize:16, color:tok.color, marginBottom:6 }}>{tok.label}</div>
                <p style={{ fontSize:15, color:"#64748b" }}>{tok.sub}</p>
              </div>
            ))}
          </div>
          <div style={{ width:"100%", height:12, borderRadius:8, overflow:"hidden", display:"flex" }}>
            {TOKENOMICS.map(tok => <div key={tok.label} style={{ width:`${tok.pct}%`, background:tok.color, height:"100%" }} />)}
          </div>
          <div style={{ marginTop:12, fontSize:17, color:"#475569", textAlign:"center" }}>
            {T('tok_footer')}
          </div>
        </section>

        {/* HOLDR */}
        <section style={{ maxWidth:1100, margin:"0 auto", padding:"0 32px 60px" }}>
          <div style={{ background:"linear-gradient(135deg,rgba(26,5,51,0.9),rgba(15,23,42,0.9))", border:"1px solid #4c1d95", borderRadius:16, padding:32, display:"flex", gap:24, alignItems:"flex-start", backdropFilter:"blur(4px)" }}>
            <div style={{ fontSize:40 }}>💎</div>
            <div>
              <h3 style={{ color:"#c084fc", fontWeight:"bold", fontSize:22, marginBottom:8 }}>{T('holdr_title')}</h3>
              <p style={{ color:"#cbd5e1", fontSize:16, lineHeight:1.7, marginBottom:16, maxWidth:600 }}>
                {T('holdr_desc')}
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {([
                  ['holdr_r1_label','holdr_r1_val'],
                  ['holdr_r2_label','holdr_r2_val'],
                  ['holdr_r3_label','holdr_r3_val'],
                ] as [Parameters<typeof t>[1], Parameters<typeof t>[1]][]).map(([lk,vk]) => (
                  <div key={lk} style={{ padding:"10px 14px", background:"rgba(124,58,237,0.1)", borderRadius:8 }}>
                    <div style={{ fontSize:17, color:"#64748b", marginBottom:4 }}>{T(lk)}</div>
                    <div style={{ fontSize:15, color:"#c084fc", fontWeight:"bold" }}>{T(vk)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign:"center", padding:"60px 32px 80px" }}>
          <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize:"clamp(22px,3.5vw,34px)", marginBottom:16 }}>
            {T('cta_title')}
          </div>
          <p style={{ color:"#475569", fontSize:16, marginBottom:28 }}>{T('cta_desc')}</p>
          <Link href="/play" style={{
            display:"inline-block", padding:"16px 48px", fontFamily:"'Press Start 2P',monospace", fontSize:15,
            background:"linear-gradient(135deg,#7c3aed,#a855f7)", color:"#fff", borderRadius:10,
            textDecoration:"none", boxShadow:"0 0 48px rgba(168,85,247,0.55)"
          }}>{T('cta_btn')}</Link>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop:"1px solid #1e1e3f", padding:"24px 32px", textAlign:"center", fontSize:17, color:"#475569" }}>
          <CanvasLogo size="sm" />
          {" · "}{T('footer_built')}
        </footer>
      </div>
    </div>
  );
}
