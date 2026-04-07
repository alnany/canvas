'use client';
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const GRID = 200;
const PX   = 5;
const COOLDOWN_SEC = 10;
const BASE_EARN = 5;
const HOLD_REWARD_RATE = 0.5 / 3600;

const PALETTE = [
  "#ef4444","#f97316","#f59e0b","#84cc16",
  "#22c55e","#06b6d4","#3b82f6","#6366f1",
  "#8b5cf6","#ec4899","#f43f5e","#ffffff",
  "#e2e8f0","#94a3b8","#475569","#1e293b",
];

const TOP_UP_PACKS = [
  { amount: 100,  label: "100 $C",   sol: "0.01 SOL", popular: false },
  { amount: 500,  label: "500 $C",   sol: "0.05 SOL", popular: true  },
  { amount: 2000, label: "2,000 $C", sol: "0.18 SOL", popular: false },
] as const;

// Art zone bounds (protect from bot overwrite)
const ART_X1 = 77, ART_X2 = 123, ART_Y1 = 91, ART_Y2 = 113;

type StrikeTier = "none"|"common"|"rare"|"legendary";
interface PxData { color: string; owner: string; }

function rollStrike(): StrikeTier {
  const r = Math.random();
  if (r < 0.001) return "legendary";
  if (r < 0.01)  return "rare";
  if (r < 0.05)  return "common";
  return "none";
}
function strikeBonus(t: StrikeTier) { return t==="legendary"?200:t==="rare"?25:t==="common"?5:1; }
function strikeStyle(t: StrikeTier): {bg:string;border:string;text:string;shadow:string} {
  if (t==="legendary") return {bg:"#1c0f00",border:"#f59e0b",text:"#fbbf24",shadow:"rgba(245,158,11,0.8)"};
  if (t==="rare")      return {bg:"#0c1a2e",border:"#22d3ee",text:"#67e8f9",shadow:"rgba(34,211,238,0.6)"};
  return                      {bg:"#12121a",border:"#64748b",text:"#94a3b8",shadow:"rgba(100,116,139,0.4)"};
}

const BOTS = ["0x7a3…b9f","0xaf1…c32","0x99d…441","0xb82…71a","0x55e…f90","0xcc4…d18"];
const rndOwner = () => BOTS[Math.floor(Math.random()*BOTS.length)];
const WALLET = "YOU (Demo_7f4…a9c)";

// ── Meaningful pixel art seed ──────────────────────────────────────────────
function seedMeaningfulCanvas(g: (PxData|null)[]) {
  const set = (x: number, y: number, color: string, owner = rndOwner()) => {
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return;
    g[y * GRID + x] = { color, owner };
  };
  const fillRect = (x: number, y: number, w: number, h: number, colors: string[], owner?: string) => {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        set(x+dx, y+dy, colors[Math.floor(Math.random()*colors.length)], owner);
  };
  const drawCircle = (cx: number, cy: number, r: number, color: string, owner?: string) => {
    for (let y = cy-r; y <= cy+r; y++)
      for (let x = cx-r; x <= cx+r; x++)
        if ((x-cx)**2+(y-cy)**2 <= r*r) set(x, y, color, owner);
  };
  const bitmap = (x0: number, y0: number, rows: string[], color: string | string[], owner?: string) => {
    rows.forEach((row, dy) =>
      row.split("").forEach((px, dx) => {
        if (px==="1") {
          const c = Array.isArray(color) ? color[Math.floor(Math.random()*color.length)] : color;
          set(x0+dx, y0+dy, c, owner);
        }
      })
    );
  };

  // Faction territories
  const PURPLE = ["#8b5cf6","#7c3aed","#a855f7","#6d28d9","#9333ea"];
  const BLUE   = ["#3b82f6","#06b6d4","#0ea5e9","#2563eb","#38bdf8"];
  const RED    = ["#ef4444","#f97316","#f43f5e","#dc2626","#fb923c"];
  const GREEN  = ["#22c55e","#84cc16","#16a34a","#65a30d","#4ade80"];

  for (let y=0; y<GRID; y++) {
    for (let x=0; x<GRID; x++) {
      if (Math.random() > 0.72) continue;
      const q = (x < GRID/2 ? 0:1) + (y < GRID/2 ? 0:2);
      const pal = [PURPLE,BLUE,RED,GREEN][q];
      set(x, y, pal[Math.floor(Math.random()*pal.length)]);
    }
  }

  // Battle strip (horizontal center band)
  const allC = [...PURPLE,...BLUE,...RED,...GREEN];
  for (let y=GRID/2-8; y<GRID/2+8; y++)
    for (let x=0; x<GRID; x++)
      if (Math.random()<0.6) set(x, y, allC[Math.floor(Math.random()*allC.length)]);

  // ── CANVAS text (center) ──
  const FONT: Record<string,string[]> = {
    C: ["01110","10001","10000","10000","10000","10001","01110"],
    A: ["00100","01010","10001","11111","10001","10001","10001"],
    N: ["10001","11001","10101","10011","10001","10001","10001"],
    V: ["10001","10001","10001","01010","01010","01010","00100"],
    S: ["01110","10001","10000","01110","00001","10001","01110"],
  };
  const TEXT = "CANVAS";
  const CW=5, CH=7, GAP=2;
  const totalW = TEXT.length*(CW+GAP)-GAP; // 40
  const tx = Math.floor((GRID-totalW)/2);   // 80
  const ty = Math.floor(GRID/2)-CH-2;       // 89

  // Dark backdrop
  for (let dy=-2; dy<CH+4; dy++)
    for (let dx=-3; dx<totalW+4; dx++)
      set(tx+dx, ty+dy, "#0a0a18", "ART");

  TEXT.split("").forEach((char,i) => {
    const b = FONT[char];
    if (b) bitmap(tx+i*(CW+GAP), ty, b, "#ffffff", "CANVAS_ART");
  });

  // WAGMI subtitle
  const MFONT: Record<string,string[]> = {
    W: ["10001","10001","10101","10101","01110"],
    A: ["01110","10001","11111","10001","10001"],
    G: ["01110","10000","10111","10001","01110"],
    M: ["10001","11011","10101","10001","10001"],
    I: ["01110","00100","00100","00100","01110"],
  };
  const WAGMI="WAGMI"; const mw=5,mh=5,mgap=1;
  const mTotalW = WAGMI.length*(mw+mgap)-mgap;
  const mx = Math.floor((GRID-mTotalW)/2);
  const my = ty+CH+2;
  WAGMI.split("").forEach((char,i) => {
    const b = MFONT[char];
    if (b) bitmap(mx+i*(mw+mgap), my, b, "#fbbf24", "CANVAS_ART");
  });

  // ── Solana 3-bar logo (top-left) ──
  const solColors = ["#9945ff","#8b44ee","#7843dd","#6242cc","#4b41bb","#3440aa","#1e3f99","#1a5599","#14a095","#14b595","#14c595","#14e095","#14f195"];
  for (let row=0; row<3; row++) {
    const barY = 10+row*5;
    for (let col=0; col<13; col++) {
      for (let p=0; p<3; p++) set(8+col+row, barY+p, solColors[col], "SOLANA_BOT");
    }
  }

  // ── Japanese flag (top-right) ──
  fillRect(GRID-29, 7, 25, 17, ["#ffffff"], "JP_BOT");
  drawCircle(GRID-17, 15, 5, "#ef4444", "JP_BOT");

  // ── Bitcoin B (bottom-left) ──
  bitmap(8, GRID-22, [
    "01110","10001","10001","01110","10001","10001","01110",
  ], "#f97316", "BTC_BOT");
  set(11, GRID-24, "#f97316", "BTC_BOT");
  set(11, GRID-14, "#f97316", "BTC_BOT");

  // ── Ethereum diamond (bottom-right) ──
  const ex=GRID-16, ey=GRID-22;
  [[2,2],[1,4],[0,6],[1,4],[2,2],[1,4],[2,2]].forEach(([xo,w],row) => {
    for (let col=0; col<w; col++)
      set(ex+xo+col, ey+row, row<3?"#818cf8":"#c4b5fd", "ETH_BOT");
  });

  // ── Moon (top-center) ──
  bitmap(GRID/2-3, 6, [
    "001100","011110","011100","011100","011110","001100",
  ], "#fbbf24", "MOON_BOT");

  // ── Red heart (left-center quadrant) ──
  bitmap(GRID/4-5, GRID/2-4, [
    "0110110","1111111","1111111","0111110","0011100","0001000",
  ], "#f43f5e", "LOVE_BOT");

  // ── Pepe (right-center quadrant) ──
  bitmap(Math.floor(GRID*3/4)-5, GRID/2-4, [
    "00111100","01111110","11011011","11111111","11111111","01111110","01011010","11000011",
  ], "#22c55e", "PEPE_BOT");
}

export default function Play() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const gridRef     = useRef<(PxData|null)[]>(Array(GRID*GRID).fill(null));
  const ownedRef    = useRef(0);

  const [color,      setColor]      = useState(PALETTE[6]);
  const [balance,    setBalance]    = useState(0);
  const [cooldown,   setCooldown]   = useState(0);
  const [shield,     setShield]     = useState(false);
  const [shieldT,    setShieldT]    = useState(0);
  const [owned,      setOwned]      = useState(0);
  const [placed,     setPlaced]     = useState(0);
  const [strike,     setStrike]     = useState<{tier:StrikeTier;earn:number}|null>(null);
  const [hovered,    setHovered]    = useState<{x:number;y:number;d:PxData|null}|null>(null);
  const [log,        setLog]        = useState<string[]>(["[CANVAS] Click any pixel to place."]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [topUpOpen,  setTopUpOpen]  = useState(false);
  const [topUpFlash, setTopUpFlash] = useState(false);

  const draw = useCallback(() => {
    const c = canvasRef.current; if(!c) return;
    const ctx = c.getContext("2d")!;
    for (let i=0; i<GRID*GRID; i++) {
      const x=(i%GRID)*PX, y=Math.floor(i/GRID)*PX;
      const px = gridRef.current[i];
      ctx.fillStyle = px ? px.color : "#0f0f1e";
      ctx.fillRect(x,y,PX,PX);
      if (!px) {
        ctx.strokeStyle="#1a1a30"; ctx.lineWidth=0.5;
        ctx.strokeRect(x+.5,y+.5,PX-1,PX-1);
      }
      if (px?.owner===WALLET) {
        ctx.strokeStyle="rgba(168,85,247,0.6)"; ctx.lineWidth=1;
        ctx.strokeRect(x+.5,y+.5,PX-1,PX-1);
      }
    }
  },[]);

  useEffect(() => {
    seedMeaningfulCanvas(gridRef.current);
    draw();
  },[draw]);

  useEffect(() => {
    const t = setInterval(() => {
      setCooldown(c => Math.max(0,c-1));
      setShieldT(s => { if(s<=1){setShield(false);return 0;} return s-1; });
      setBalance(b => b + ownedRef.current * HOLD_REWARD_RATE);
    }, 1000);
    return () => clearInterval(t);
  },[]);

  // Bot activity (skip protected art zone)
  useEffect(() => {
    const t = setInterval(() => {
      for (let i=0; i<3; i++) {
        const g = gridRef.current;
        const idx = Math.floor(Math.random()*GRID*GRID);
        const x = idx%GRID, y = Math.floor(idx/GRID);
        if (x>=ART_X1 && x<=ART_X2 && y>=ART_Y1 && y<=ART_Y2) continue;
        const cell = g[idx];
        if (cell?.owner===WALLET) continue;
        const newOwner = rndOwner();
        const newColor = PALETTE[Math.floor(Math.random()*PALETTE.length)];
        g[idx] = {color:newColor,owner:newOwner};
        const c = canvasRef.current; if(!c) continue;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = newColor;
        ctx.fillRect(x*PX, y*PX, PX, PX);
      }
    }, 300);
    return () => clearInterval(t);
  },[]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (cooldown>0) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const gx = Math.floor((e.clientX-rect.left)/PX);
    const gy = Math.floor((e.clientY-rect.top)/PX);
    if (gx<0||gy<0||gx>=GRID||gy>=GRID) return;
    const idx = gy*GRID+gx;
    const g = gridRef.current;
    const wasOwn = g[idx]?.owner===WALLET;
    g[idx] = {color, owner:WALLET};
    const c = canvasRef.current; if(!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle=color; ctx.fillRect(gx*PX,gy*PX,PX,PX);
    ctx.strokeStyle="rgba(168,85,247,0.6)"; ctx.lineWidth=1;
    ctx.strokeRect(gx*PX+.5,gy*PX+.5,PX-1,PX-1);
    if (!wasOwn) setOwned(o => { ownedRef.current=o+1; return o+1; });
    setPlaced(p => p+1);
    setCooldown(COOLDOWN_SEC);
    const tier = rollStrike();
    const earn = BASE_EARN*strikeBonus(tier);
    setBalance(b => b+earn);
    if (tier!=="none") {
      setStrike({tier,earn});
      setTimeout(()=>setStrike(null),3000);
    }
    setLog(l => [tier!=="none"
      ? `[STRIKE] ${tier.toUpperCase()}! +${earn} $CANVAS @ (${gx},${gy})`
      : `[PLACE] (${gx},${gy}) → +${BASE_EARN} $CANVAS`,
      ...l.slice(0,11)]);
  },[cooldown,color]);

  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const gx=Math.floor((e.clientX-rect.left)/PX);
    const gy=Math.floor((e.clientY-rect.top)/PX);
    if (gx<0||gy<0||gx>=GRID||gy>=GRID) { setHovered(null); return; }
    setHovered({x:gx,y:gy,d:gridRef.current[gy*GRID+gx]});
  },[]);

  const handleTopUp = (amount: number, label: string, sol: string) => {
    setBalance(b => b+amount);
    setTopUpOpen(false);
    setTopUpFlash(true);
    setTimeout(()=>setTopUpFlash(false), 1200);
    setLog(l => [`[TOP UP] +${amount.toLocaleString()} $CANVAS (${sol} · demo)`, ...l.slice(0,11)]);
  };

  const shieldCost = 3*owned;
  const canShield = balance>=shieldCost && owned>0 && !shield;
  const lowBalance = balance < 30 && placed > 0;

  const activateShield = () => {
    if (!canShield) return;
    setBalance(b => b-shieldCost);
    setShield(true); setShieldT(30);
    setLog(l=>[`[SHIELD] Active 30s · Cost: ${shieldCost.toFixed(0)} $CANVAS`,...l.slice(0,11)]);
  };

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(()=>{ setConnecting(false); setWalletConnected(true);
      setLog(l=>["[WALLET] Demo_7f4…a9c connected · 0 SOL",...l.slice(0,11)]); }, 1200);
  };

  const isHoldr = owned*12 >= 10000;
  const holdrProgress = Math.min(100,(owned*12/10000)*100);

  return (
    <div style={{background:"#070710",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Share Tech Mono','Courier New',monospace",overflow:"hidden"}}>
      {/* Top bar */}
      <div style={{borderBottom:"1px solid #1e1e3f",padding:"9px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(7,7,16,0.95)",backdropFilter:"blur(8px)"}}>
        <Link href="/" style={{color:"#a855f7",fontFamily:"'Press Start 2P',monospace",fontSize:11,textDecoration:"none",letterSpacing:2}}>← CANVAS</Link>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:10,color:"#334155",background:"#0f0f1a",padding:"4px 12px",borderRadius:4,border:"1px solid #1e1e3f"}}>
            1000×1000 demo · 10s cooldown (real: 5 min) · no wallet needed
          </div>
          {walletConnected ? (
            <div style={{fontSize:10,display:"flex",alignItems:"center",gap:6,background:"#0f1a0f",border:"1px solid #166534",borderRadius:6,padding:"5px 12px"}}>
              <div style={{width:6,height:6,background:"#22c55e",borderRadius:"50%"}}/>
              <span style={{color:"#22c55e"}}>Demo_7f4…a9c</span>
            </div>
          ) : (
            <button onClick={handleConnect} disabled={connecting} style={{fontSize:10,padding:"6px 14px",borderRadius:6,fontFamily:"inherit",cursor:"pointer",background:connecting?"#1a1a2e":"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none"}}>
              {connecting?"Connecting…":"🔗 Connect Wallet"}
            </button>
          )}
        </div>
      </div>

      <div style={{display:"flex",height:"calc(100vh - 46px)"}}>
        {/* LEFT PANEL */}
        <div style={{width:196,borderRight:"1px solid #1e1e3f",padding:12,display:"flex",flexDirection:"column",gap:10,flexShrink:0,overflowY:"auto",background:"#070710"}}>

          {/* Balance + Top Up */}
          <div style={{
            background:"#0d0d1a",
            border:`1px solid ${topUpFlash?"#a855f7":lowBalance?"#4c1d95":"#2d1b69"}`,
            borderRadius:8,padding:12,
            boxShadow:topUpFlash?"0 0 16px rgba(168,85,247,0.5)":lowBalance?"0 0 8px rgba(124,58,237,0.25)":"none",
            transition:"border-color 0.4s,box-shadow 0.4s",
          }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontSize:9,color:"#64748b",letterSpacing:1}}>$CANVAS BALANCE</div>
              {lowBalance && !topUpOpen && (
                <div style={{fontSize:8,color:"#a855f7",letterSpacing:1,animation:"pulse 1.5s infinite"}}>
                  LOW
                  <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
                </div>
              )}
            </div>
            <div style={{fontSize:26,fontWeight:"bold",color:topUpFlash?"#c4b5fd":"#a855f7",lineHeight:1,transition:"color 0.4s"}}>
              {Math.floor(balance).toLocaleString()}
            </div>
            {owned>0 && (
              <div style={{fontSize:9,color:"#6d28d9",marginTop:3}}>
                +{(owned*HOLD_REWARD_RATE*60).toFixed(3)}/min hold
              </div>
            )}

            {/* Top Up toggle */}
            <button onClick={()=>setTopUpOpen(o=>!o)} style={{
              marginTop:8,width:"100%",padding:"6px 0",borderRadius:6,
              fontSize:9,fontWeight:"bold",fontFamily:"inherit",letterSpacing:1,
              background:topUpOpen?"#1a1a2e":"linear-gradient(135deg,#4c1d95,#7c3aed)",
              color:topUpOpen?"#475569":"#e9d5ff",border:`1px solid ${topUpOpen?"#1e1e3f":"#7c3aed"}`,
              cursor:"pointer",
            }}>
              {topUpOpen ? "▲ CLOSE" : "＋ TOP UP"}
            </button>

            {topUpOpen && (
              <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>
                {TOP_UP_PACKS.map(pack => (
                  <button key={pack.amount} onClick={()=>handleTopUp(pack.amount,pack.label,pack.sol)}
                    style={{
                      position:"relative",display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"7px 9px",borderRadius:6,fontFamily:"inherit",cursor:"pointer",fontSize:9,
                      background:pack.popular?"#150a2a":"#0f0f1a",
                      border:pack.popular?"1px solid #7c3aed":"1px solid #1e1e3f",
                      color:"#e2e8f0",
                    }}>
                    {pack.popular && (
                      <span style={{position:"absolute",top:-7,right:6,fontSize:7,background:"#7c3aed",color:"#fff",padding:"1px 5px",borderRadius:3,letterSpacing:1}}>
                        BEST
                      </span>
                    )}
                    <span style={{color:"#a855f7",fontWeight:"bold"}}>{pack.label}</span>
                    <span style={{color:"#475569"}}>{pack.sol}</span>
                  </button>
                ))}
                <div style={{fontSize:8,color:"#1e3052",textAlign:"center",marginTop:2}}>
                  demo only · simulated purchase
                </div>
              </div>
            )}
          </div>

          {/* Cooldown */}
          <div style={{background:"#0d0d1a",border:`1px solid ${cooldown>0?"#7c3aed":"#166534"}`,borderRadius:8,padding:12}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:6,letterSpacing:1}}>COOLDOWN</div>
            {cooldown>0 ? (
              <>
                <div style={{fontSize:22,fontWeight:"bold",color:"#f59e0b"}}>{cooldown}s</div>
                <div style={{marginTop:6,height:3,background:"#1e1e2e",borderRadius:2}}>
                  <div style={{height:"100%",background:"#7c3aed",width:`${(cooldown/COOLDOWN_SEC)*100}%`,transition:"width 1s linear",borderRadius:2}}/>
                </div>
              </>
            ) : (
              <div style={{fontSize:13,fontWeight:"bold",color:"#22c55e"}}>✓ READY</div>
            )}
          </div>

          {/* Stats */}
          <div style={{background:"#0d0d1a",border:"1px solid #1e1e3f",borderRadius:8,padding:12,fontSize:11}}>
            <div style={{color:"#64748b",marginBottom:8,fontSize:9,letterSpacing:1}}>YOUR STATS</div>
            {([["Pixels owned",owned],["Total placed",placed]] as [string,number][]).map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:"#475569"}}>{k}</span>
                <span style={{color:"#22d3ee"}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:9,color:"#475569"}}>Holdr status</span>
                <span style={{fontSize:9,color:isHoldr?"#a855f7":"#334155"}}>{isHoldr?"✓ HOLDR":`${Math.floor(holdrProgress)}%`}</span>
              </div>
              <div style={{height:3,background:"#1e1e2e",borderRadius:2}}>
                <div style={{height:"100%",background:isHoldr?"#a855f7":"#4c1d95",width:`${holdrProgress}%`,borderRadius:2,transition:"width 0.3s"}}/>
              </div>
              {!isHoldr && <div style={{fontSize:8,color:"#334155",marginTop:3}}>need {(10000-Math.floor(owned*12)).toLocaleString()} more $C</div>}
            </div>
          </div>

          {/* Shield */}
          <div style={{background:"#0d0d1a",border:`1px solid ${shield?"#f59e0b":"#1e1e3f"}`,borderRadius:8,padding:12}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:8,letterSpacing:1}}>PIXEL SHIELD</div>
            {shield ? (
              <div>
                <div style={{color:"#f59e0b",fontSize:13,fontWeight:"bold"}}>🛡️ ACTIVE</div>
                <div style={{fontSize:9,color:"#92400e",marginTop:2}}>{shieldT}s remaining</div>
                <div style={{marginTop:6,height:3,background:"#1e1e2e",borderRadius:2}}>
                  <div style={{height:"100%",background:"#f59e0b",width:`${(shieldT/30)*100}%`,transition:"width 1s linear",borderRadius:2}}/>
                </div>
              </div>
            ) : (
              <>
                <div style={{fontSize:10,color:"#475569",marginBottom:8,lineHeight:1.6}}>
                  Cost: <span style={{color:"#a855f7"}}>{shieldCost} $CANVAS</span><br/>
                  <span style={{fontSize:8,color:"#334155"}}>3 × {owned} pixels · 8h real / 30s demo</span>
                </div>
                <button onClick={activateShield} disabled={!canShield} style={{
                  width:"100%",padding:"7px 0",borderRadius:6,fontSize:9,fontWeight:"bold",fontFamily:"inherit",
                  background:canShield?"linear-gradient(135deg,#7c3aed,#a855f7)":"#12121a",
                  color:canShield?"#fff":"#334155",border:"none",cursor:canShield?"pointer":"default",
                }}>
                  {owned===0?"Place pixels first":balance<shieldCost?`Need ${(shieldCost-balance).toFixed(0)} more`:"Activate Shield"}
                </button>
              </>
            )}
          </div>

          {/* Withdraw info */}
          <div style={{background:"#0a0a12",border:"1px solid #1a1a30",borderRadius:8,padding:10,fontSize:9,color:"#334155",lineHeight:1.8}}>
            <div style={{color:"#475569",marginBottom:2,letterSpacing:1,fontSize:8}}>WITHDRAW</div>
            Withdraw anytime to wallet.<br/>
            10% tax → <span style={{color:"#6d28d9"}}>Holdr pool</span><br/>
            Holdrs earn passively from<br/>all ecosystem withdrawals.
          </div>
        </div>

        {/* CANVAS CENTER */}
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"auto",background:"radial-gradient(ellipse at center,#0d0d20,#070710)"}}>
          {/* Strike popup */}
          {strike && (()=>{
            const sc=strikeStyle(strike.tier);
            return (
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-60%)",zIndex:20,textAlign:"center",pointerEvents:"none"}}>
                <style>{`@keyframes strikeIn{0%{opacity:0;transform:translate(-50%,-80%) scale(0.5)}20%{opacity:1;transform:translate(-50%,-55%) scale(1.1)}80%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-40%) scale(0.9)}}`}</style>
                <div style={{padding:"18px 36px",borderRadius:14,background:sc.bg,border:`2px solid ${sc.border}`,boxShadow:`0 0 ${strike.tier==="legendary"?"80px":strike.tier==="rare"?"50px":"30px"} ${sc.shadow}`,fontFamily:"'Press Start 2P',monospace",animation:"strikeIn 3s ease-out forwards"}}>
                  <div style={{fontSize:9,color:sc.text,marginBottom:6,letterSpacing:2}}>{strike.tier.toUpperCase()} STRIKE</div>
                  <div style={{fontSize:28,color:"#ffffff",fontWeight:"bold"}}>+{strike.earn}</div>
                  <div style={{fontSize:8,color:sc.text,marginTop:4}}>{strikeBonus(strike.tier)}× base · $CANVAS</div>
                </div>
              </div>
            );
          })()}

          <div style={{position:"relative",padding:16}}>
            {shield && (
              <div style={{position:"absolute",inset:-4,borderRadius:8,border:"2px solid #f59e0b",boxShadow:"0 0 60px rgba(245,158,11,0.5),inset 0 0 40px rgba(245,158,11,0.04)",pointerEvents:"none",zIndex:2}}/>
            )}
            <canvas
              ref={canvasRef}
              width={GRID*PX}
              height={GRID*PX}
              onClick={handleClick}
              onMouseMove={handleMove}
              onMouseLeave={()=>setHovered(null)}
              style={{cursor:cooldown>0?"not-allowed":"crosshair",display:"block",border:"1px solid #1e1e3f",borderRadius:4,boxShadow:"0 0 60px rgba(88,28,235,0.15)"}}
            />
            {hovered && (
              <div style={{position:"absolute",left:Math.min(hovered.x*PX+14,GRID*PX-170),top:Math.max(hovered.y*PX-38,0),background:"#0d0d1a",border:"1px solid #2d1b69",borderRadius:6,padding:"5px 10px",fontSize:9,whiteSpace:"nowrap",pointerEvents:"none",zIndex:5}}>
                ({hovered.x},{hovered.y}) · {hovered.d?(hovered.d.owner===WALLET?"YOUR PIXEL":hovered.d.owner):"empty — click to claim"}
                {hovered.d && <span style={{marginLeft:6,display:"inline-block",width:8,height:8,background:hovered.d.color,borderRadius:2,verticalAlign:"middle"}}/>}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{width:196,borderLeft:"1px solid #1e1e3f",padding:12,display:"flex",flexDirection:"column",gap:10,flexShrink:0,background:"#070710"}}>
          {/* Color picker */}
          <div>
            <div style={{fontSize:9,color:"#64748b",marginBottom:8,letterSpacing:1}}>COLOR</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
              {PALETTE.map(c=>(
                <button key={c} onClick={()=>setColor(c)} style={{aspectRatio:"1",borderRadius:4,background:c,border:"none",cursor:"pointer",outline:color===c?"2px solid #ffffff":"2px solid transparent",outlineOffset:2,transition:"outline 0.1s"}}/>
              ))}
            </div>
            <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6,fontSize:9}}>
              <div style={{width:14,height:14,borderRadius:3,background:color,flexShrink:0,border:"1px solid #2d1b69"}}/>
              <span style={{color:"#475569"}}>{color}</span>
            </div>
          </div>

          {/* Strike tiers */}
          <div style={{background:"#0d0d1a",border:"1px solid #0e2a36",borderRadius:8,padding:10}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:8,letterSpacing:1}}>STRIKE ODDS</div>
            {[
              {tier:"Common",chance:"5%",mult:"5×",color:"#64748b"},
              {tier:"Rare",chance:"1%",mult:"25×",color:"#22d3ee"},
              {tier:"Legendary",chance:"0.1%",mult:"200×",color:"#f59e0b"},
            ].map(s=>(
              <div key={s.tier} style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:9}}>
                <span style={{color:s.color}}>{s.tier}</span>
                <span style={{color:"#334155"}}>{s.chance}</span>
                <span style={{color:s.color,fontWeight:"bold"}}>{s.mult}</span>
              </div>
            ))}
            <div style={{marginTop:6,fontSize:8,color:"#1e3a4f",lineHeight:1.6}}>Pyth Entropy RNG · on-chain verifiable</div>
          </div>

          {/* Leaderboard */}
          <div style={{background:"#0d0d1a",border:"1px solid #1e1e3f",borderRadius:8,padding:10,flex:1}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:10,letterSpacing:1}}>TOP PLAYERS</div>
            {[
              {addr:"0xaf1…c32",px:842,earn:18204,isYou:false},
              {addr:"0x7a3…b9f",px:634,earn:12849,isYou:false},
              {addr:WALLET,px:owned,earn:Math.floor(balance),isYou:true},
              {addr:"0x99d…441",px:201,earn:4180,isYou:false},
              {addr:"0xb82…71a",px:98,earn:1862,isYou:false},
            ].sort((a,b)=>b.px-a.px).slice(0,5).map((p,i)=>(
              <div key={p.addr} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:9,fontSize:9}}>
                <span style={{color:i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#b45309":"#1e293b",width:10,flexShrink:0,fontWeight:"bold",fontSize:8,marginTop:1}}>{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:p.isYou?"#a855f7":"#475569",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:p.isYou?"bold":"normal"}}>
                    {p.isYou?"▶ YOU":p.addr}
                  </div>
                  <div style={{color:"#1e293b",fontSize:8,marginTop:1}}>{p.px} px · {p.earn.toLocaleString()} $C</div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity log */}
          <div style={{background:"#060612",border:"1px solid #1a1a30",borderRadius:8,padding:10}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:6,letterSpacing:1}}>ACTIVITY</div>
            {log.slice(0,8).map((l,i)=>(
              <div key={i} style={{fontSize:8,marginBottom:3,lineHeight:1.5,color:l.includes("STRIKE")?"#f59e0b":l.includes("SHIELD")?"#22d3ee":l.includes("WALLET")?"#22c55e":l.includes("TOP UP")?"#a855f7":"#1e3052"}}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
