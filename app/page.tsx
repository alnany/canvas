'use client';
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Lang, getLang, t } from './i18n/translations';
import LangSwitcher from './components/LangSwitcher';

const PALETTE = [
  "#ef4444","#f97316","#f59e0b","#22c55e",
  "#06b6d4","#3b82f6","#8b5cf6","#ec4899",
  "#f1f5f9","#64748b","#1e293b","#ffffff",
];

function MiniCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const SIZE = 32, PX = 8;
    const grid = Array.from({ length: SIZE * SIZE }, () =>
      Math.random() > 0.55 ? PALETTE[Math.floor(Math.random() * PALETTE.length)] : "#1a1a2e"
    );
    const draw = () => {
      grid.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect((i % SIZE) * PX, Math.floor(i / SIZE) * PX, PX, PX);
      });
    };
    draw();
    const iv = setInterval(() => {
      const idx = Math.floor(Math.random() * SIZE * SIZE);
      grid[idx] = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      ctx.fillStyle = grid[idx];
      ctx.fillRect((idx % SIZE) * 8, Math.floor(idx / SIZE) * 8, 8, 8);
    }, 80);
    return () => clearInterval(iv);
  }, []);
  return (
    <canvas ref={canvasRef} width={256} height={256}
      style={{ imageRendering:"pixelated", border:"1px solid #2d1b69", borderRadius:8 }} />
  );
}

export default function Home() {
  const [count, setCount] = useState(1247903);
  const [lang, setLang_] = useState<Lang>('en');

  useEffect(() => {
    setLang_(getLang());
  }, []);

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
    <div style={{ background:"#0a0a0f", color:"#e2e8f0", fontFamily:"'Share Tech Mono','Courier New',monospace", minHeight:"100vh" }}>
      {/* NAV */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 32px", borderBottom:"1px solid #1e1e3f" }}>
        <span style={{ color:"#a855f7", fontFamily:"'Press Start 2P',monospace", fontSize:13, letterSpacing:2 }}>CANVAS</span>
        <div style={{ display:"flex", gap:16, alignItems:"center", fontSize:13 }}>
          <a href="#mechanics" style={{ color:"#94a3b8", textDecoration:"none" }}>{T('nav_mechanics')}</a>
          <a href="#tokenomics" style={{ color:"#94a3b8", textDecoration:"none" }}>{T('nav_tokenomics')}</a>
          <LangSwitcher lang={lang} onChange={setLang_} />
          <Link href="/play" style={{ padding:"8px 20px", background:"#7c3aed", color:"#fff", borderRadius:6, textDecoration:"none", fontWeight:"bold", fontSize:13 }}>
            {T('nav_play_demo')}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ display:"flex", alignItems:"center", justifyContent:"space-between", maxWidth:1100, margin:"0 auto", padding:"80px 32px", gap:48 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:"#22d3ee", marginBottom:12, letterSpacing:3, textTransform:"uppercase" }}>
            {T('hero_tag')}
          </div>
          <h1 style={{ fontFamily:"'Press Start 2P',monospace", fontSize:"clamp(32px,5vw,60px)", color:"#a855f7", margin:"0 0 16px", lineHeight:1.3 }}>
            CANVAS
          </h1>
          <p style={{ fontSize:18, color:"#cbd5e1", marginBottom:8, maxWidth:480, lineHeight:1.6 }}>
            <span style={{ color:"#a855f7" }}>{T('hero_sub1')}</span><br />
            {T('hero_sub2')}
          </p>
          <p style={{ fontSize:13, color:"#475569", marginBottom:32, maxWidth:420, lineHeight:1.7 }}>
            {T('hero_desc')}
          </p>
          <div style={{ display:"flex", gap:12 }}>
            <Link href="/play" style={{
              padding:"14px 28px", background:"linear-gradient(135deg,#7c3aed,#a855f7)",
              color:"#fff", borderRadius:8, textDecoration:"none", fontWeight:"bold", fontSize:14,
              boxShadow:"0 0 24px rgba(168,85,247,0.45)"
            }}>{T('hero_cta_play')}</Link>
            <a href="#mechanics" style={{
              padding:"14px 28px", border:"1px solid #4c1d95",
              color:"#a855f7", borderRadius:8, textDecoration:"none", fontSize:14
            }}>{T('hero_cta_how')}</a>
          </div>
          <div style={{ marginTop:24, fontSize:12, color:"#475569", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:8, height:8, background:"#22c55e", borderRadius:"50%", display:"inline-block", animation:"pulse 2s infinite" }} />
            <span style={{ color:"#22c55e" }}>{count.toLocaleString()}</span> {T('hero_pixels_placed')}
          </div>
        </div>
        <div style={{ flexShrink:0, position:"relative" }}>
          <div style={{ position:"absolute", inset:-32, background:"radial-gradient(circle,rgba(124,58,237,0.2),transparent 70%)", borderRadius:"50%" }} />
          <MiniCanvas />
        </div>
      </section>

      {/* CORE LOOP */}
      <section id="mechanics" style={{ maxWidth:1100, margin:"0 auto", padding:"60px 32px" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:11, color:"#a855f7", letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>{T('section_core_loop')}</div>
          <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize:18 }}>{T('section_how')}</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
          {STEPS.map((s,i) => (
            <div key={i} style={{ padding:24, background:"#12121a", border:"1px solid #1e1e3f", borderRadius:12 }}>
              <div style={{ fontSize:28, marginBottom:12 }}>{s.emoji}</div>
              <div style={{ color:"#c084fc", fontWeight:"bold", marginBottom:8, fontSize:13 }}>{i+1}. {s.label}</div>
              <p style={{ color:"#64748b", fontSize:12, lineHeight:1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STRIKES */}
      <section style={{ maxWidth:1100, margin:"0 auto", padding:"0 32px 60px" }}>
        <div style={{ background:"#0d1117", border:"1px solid #0e3a4f", borderRadius:16, padding:32 }}>
          <div style={{ fontSize:11, color:"#22d3ee", letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>{T('section_strikes')}</div>
          <p style={{ color:"#94a3b8", marginBottom:24, fontSize:13 }}>{T('strikes_desc')}</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {[
              { tierKey:"strike_common"    as const, chance:"5%",   mult:"5×",   color:"#64748b", glow:"rgba(100,116,139,0.3)" },
              { tierKey:"strike_rare"      as const, chance:"1%",   mult:"25×",  color:"#22d3ee", glow:"rgba(34,211,238,0.3)"  },
              { tierKey:"strike_legendary" as const, chance:"0.1%", mult:"200×", color:"#f59e0b", glow:"rgba(245,158,11,0.5)"  },
            ].map(tier => (
              <div key={tier.tierKey} style={{ padding:20, borderRadius:12, textAlign:"center",
                border:`1px solid ${tier.color}50`, boxShadow:`0 0 16px ${tier.glow}` }}>
                <div style={{ fontSize:11, color:tier.color, marginBottom:4 }}>{T(tier.tierKey)}</div>
                <div style={{ fontSize:32, fontWeight:"bold", color:tier.color }}>{tier.mult}</div>
                <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>{tier.chance} {T('strike_chance')}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:11, color:"#475569", marginTop:16 }}>{T('strikes_ev')}</p>
        </div>
      </section>

      {/* TOKENOMICS */}
      <section id="tokenomics" style={{ maxWidth:1100, margin:"0 auto", padding:"0 32px 60px" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:11, color:"#a855f7", letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>{T('section_tokenomics')}</div>
          <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize:18 }}>{T('tok_title')}</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:16 }}>
          {TOKENOMICS.map(tok => (
            <div key={tok.label} style={{ padding:24, background:"#12121a", border:`1px solid ${tok.color}30`, borderRadius:12 }}>
              <div style={{ fontSize:36, fontWeight:"bold", color:tok.color, marginBottom:4 }}>{tok.pct}%</div>
              <div style={{ fontWeight:"bold", fontSize:13, color:tok.color, marginBottom:6 }}>{tok.label}</div>
              <p style={{ fontSize:12, color:"#64748b" }}>{tok.sub}</p>
            </div>
          ))}
        </div>
        <div style={{ width:"100%", height:12, borderRadius:8, overflow:"hidden", display:"flex" }}>
          {TOKENOMICS.map(tok => <div key={tok.label} style={{ width:`${tok.pct}%`, background:tok.color, height:"100%" }} />)}
        </div>
        <div style={{ marginTop:12, fontSize:11, color:"#475569", textAlign:"center" }}>
          {T('tok_footer')}
        </div>
      </section>

      {/* HOLDR */}
      <section style={{ maxWidth:1100, margin:"0 auto", padding:"0 32px 60px" }}>
        <div style={{ background:"linear-gradient(135deg,#1a0533,#0f172a)", border:"1px solid #4c1d95", borderRadius:16, padding:32, display:"flex", gap:24, alignItems:"flex-start" }}>
          <div style={{ fontSize:40 }}>💎</div>
          <div>
            <h3 style={{ color:"#c084fc", fontWeight:"bold", fontSize:18, marginBottom:8 }}>{T('holdr_title')}</h3>
            <p style={{ color:"#cbd5e1", fontSize:13, lineHeight:1.7, marginBottom:16, maxWidth:600 }}>
              {T('holdr_desc')}
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {([
                ['holdr_r1_label','holdr_r1_val'],
                ['holdr_r2_label','holdr_r2_val'],
                ['holdr_r3_label','holdr_r3_val'],
              ] as [Parameters<typeof t>[1], Parameters<typeof t>[1]][]).map(([lk,vk]) => (
                <div key={lk} style={{ padding:"10px 14px", background:"rgba(124,58,237,0.1)", borderRadius:8 }}>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>{T(lk)}</div>
                  <div style={{ fontSize:12, color:"#c084fc", fontWeight:"bold" }}>{T(vk)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign:"center", padding:"60px 32px 80px" }}>
        <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize:"clamp(18px,3vw,28px)", marginBottom:16 }}>
          {T('cta_title')}
        </div>
        <p style={{ color:"#475569", fontSize:13, marginBottom:28 }}>{T('cta_desc')}</p>
        <Link href="/play" style={{
          display:"inline-block", padding:"16px 48px", fontFamily:"'Press Start 2P',monospace", fontSize:12,
          background:"linear-gradient(135deg,#7c3aed,#a855f7)", color:"#fff", borderRadius:10,
          textDecoration:"none", boxShadow:"0 0 48px rgba(168,85,247,0.55)"
        }}>{T('cta_btn')}</Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid #1e1e3f", padding:"24px 32px", textAlign:"center", fontSize:11, color:"#475569" }}>
        <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:10 }}>CANVAS</span>
        {" · "}{T('footer_built')}
      </footer>
    </div>
  );
}
