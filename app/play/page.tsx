'use client';
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const GRID = 80;
const PX   = 8;
const COOLDOWN_SEC = 10; // 10s demo, 5 min real
const BASE_EARN = 5;
const HOLD_REWARD_RATE = 0.5 / 3600; // 0.5 $CANVAS per pixel per hour → per second

const PALETTE = [
  "#ef4444","#f97316","#f59e0b","#84cc16",
  "#22c55e","#06b6d4","#3b82f6","#6366f1",
  "#8b5cf6","#ec4899","#f43f5e","#ffffff",
  "#e2e8f0","#94a3b8","#475569","#1e293b",
];

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

export default function Play() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const gridRef     = useRef<(PxData|null)[]>(Array(GRID*GRID).fill(null));
  const ownedRef    = useRef(0);

  const [color,     setColor]     = useState(PALETTE[6]);
  const [balance,   setBalance]   = useState(0);
  const [cooldown,  setCooldown]  = useState(0);
  const [shield,    setShield]    = useState(false);
  const [shieldT,   setShieldT]   = useState(0);
  const [owned,     setOwned]     = useState(0);
  const [placed,    setPlaced]    = useState(0);
  const [strike,    setStrike]    = useState<{tier:StrikeTier;earn:number}|null>(null);
  const [hovered,   setHovered]   = useState<{x:number;y:number;d:PxData|null}|null>(null);
  const [log,       setLog]       = useState<string[]>(["[CANVAS] Click any pixel to place."]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const draw = useCallback(() => {
    const c = canvasRef.current; if(!c) return;
    const ctx = c.getContext("2d")!;
    for (let i=0; i<GRID*GRID; i++) {
      const x=(i%GRID)*PX, y=Math.floor(i/GRID)*PX;
      const px = gridRef.current[i];
      ctx.fillStyle = px ? px.color : "#0f0f1e";
      ctx.fillRect(x,y,PX,PX);
      if (!px) {
        ctx.strokeStyle="#1a1a30";
        ctx.lineWidth=0.5;
        ctx.strokeRect(x+.5,y+.5,PX-1,PX-1);
      }
      // Highlight owned pixels
      if (px?.owner === WALLET) {
        ctx.strokeStyle="rgba(168,85,247,0.6)";
        ctx.lineWidth=1;
        ctx.strokeRect(x+.5,y+.5,PX-1,PX-1);
      }
    }
  },[]);

  // Seed canvas with pre-existing bot pixels
  useEffect(() => {
    const g = gridRef.current;
    for (let i=0; i<GRID*GRID; i++) {
      if (Math.random()<0.35)
        g[i]={ color:PALETTE[Math.floor(Math.random()*PALETTE.length)], owner:rndOwner() };
    }
    draw();
  },[draw]);

  // Timer: cooldown + shield + hold rewards
  useEffect(() => {
    const t = setInterval(() => {
      setCooldown(c => Math.max(0,c-1));
      setShieldT(s => {
        if (s <= 1) { setShield(false); return 0; }
        return s-1;
      });
      // Hold rewards: 0.5/hr per pixel owned
      setBalance(b => b + ownedRef.current * HOLD_REWARD_RATE);
    }, 1000);
    return () => clearInterval(t);
  },[]);

  // Bot activity
  useEffect(() => {
    const t = setInterval(() => {
      const g = gridRef.current;
      const idx = Math.floor(Math.random()*GRID*GRID);
      const cell = g[idx];
      if (cell?.owner === WALLET) return; // don't overwrite player's pixels (unless unshielded in real game)
      const newOwner = rndOwner();
      const newColor = PALETTE[Math.floor(Math.random()*PALETTE.length)];
      g[idx] = { color:newColor, owner:newOwner };
      const c = canvasRef.current; if(!c) return;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = newColor;
      ctx.fillRect((idx%GRID)*PX, Math.floor(idx/GRID)*PX, PX, PX);
    }, 300);
    return () => clearInterval(t);
  },[]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (cooldown > 0) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const gx = Math.floor((e.clientX-rect.left)/PX);
    const gy = Math.floor((e.clientY-rect.top)/PX);
    if (gx<0||gy<0||gx>=GRID||gy>=GRID) return;
    const idx = gy*GRID+gx;
    const g = gridRef.current;
    const prev = g[idx];
    const wasOwn = prev?.owner===WALLET;
    g[idx] = {color, owner:WALLET};

    const c = canvasRef.current; if(!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(gx*PX, gy*PX, PX, PX);
    ctx.strokeStyle="rgba(168,85,247,0.6)";
    ctx.lineWidth=1;
    ctx.strokeRect(gx*PX+.5, gy*PX+.5, PX-1, PX-1);

    if (!wasOwn) {
      setOwned(o => { ownedRef.current = o+1; return o+1; });
    }
    setPlaced(p => p+1);
    setCooldown(COOLDOWN_SEC);

    const tier = rollStrike();
    const earn = BASE_EARN * strikeBonus(tier);
    setBalance(b => b+earn);
    if (tier !== "none") {
      setStrike({tier, earn});
      setTimeout(() => setStrike(null), 3000);
    }
    const msg = tier !== "none"
      ? `[STRIKE] ${tier.toUpperCase()}! +${earn} $CANVAS @ (${gx},${gy})`
      : `[PLACE] (${gx},${gy}) → +${BASE_EARN} $CANVAS`;
    setLog(l => [msg, ...l.slice(0,11)]);
  },[cooldown, color]);

  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const gx = Math.floor((e.clientX-rect.left)/PX);
    const gy = Math.floor((e.clientY-rect.top)/PX);
    if (gx<0||gy<0||gx>=GRID||gy>=GRID) { setHovered(null); return; }
    setHovered({x:gx, y:gy, d:gridRef.current[gy*GRID+gx]});
  },[]);

  const shieldCost = 3*owned;
  const canShield = balance>=shieldCost && owned>0 && !shield;

  const activateShield = () => {
    if (!canShield) return;
    setBalance(b => b-shieldCost);
    setShield(true);
    setShieldT(30);
    setLog(l => [`[SHIELD] Active 30s · Cost: ${shieldCost.toFixed(0)} $CANVAS`, ...l.slice(0,11)]);
  };

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setWalletConnected(true);
      setLog(l => ["[WALLET] Demo_7f4…a9c connected · 0 SOL", ...l.slice(0,11)]);
    }, 1200);
  };

  const isHoldr = owned * 12 >= 10000;
  const holdrProgress = Math.min(100, (owned * 12 / 10000) * 100);

  return (
    <div style={{background:"#070710",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Share Tech Mono','Courier New',monospace",overflow:"hidden"}}>
      {/* Top bar */}
      <div style={{borderBottom:"1px solid #1e1e3f",padding:"9px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(7,7,16,0.95)",backdropFilter:"blur(8px)"}}>
        <Link href="/" style={{color:"#a855f7",fontFamily:"'Press Start 2P',monospace",fontSize:11,textDecoration:"none",letterSpacing:2}}>← CANVAS</Link>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:10,color:"#334155",background:"#0f0f1a",padding:"4px 12px",borderRadius:4,border:"1px solid #1e1e3f"}}>
            80×80 demo · 10s cooldown (real: 5 min) · no wallet needed
          </div>
          {walletConnected ? (
            <div style={{fontSize:10,display:"flex",alignItems:"center",gap:6,background:"#0f1a0f",border:"1px solid #166534",borderRadius:6,padding:"5px 12px"}}>
              <div style={{width:6,height:6,background:"#22c55e",borderRadius:"50%"}} />
              <span style={{color:"#22c55e"}}>Demo_7f4…a9c</span>
            </div>
          ) : (
            <button onClick={handleConnect} disabled={connecting} style={{
              fontSize:10,padding:"6px 14px",borderRadius:6,fontFamily:"inherit",cursor:"pointer",
              background:connecting?"#1a1a2e":"linear-gradient(135deg,#7c3aed,#a855f7)",
              color:"#fff",border:"none",
            }}>
              {connecting ? "Connecting…" : "🔗 Connect Wallet"}
            </button>
          )}
        </div>
      </div>

      <div style={{display:"flex",height:"calc(100vh - 46px)"}}>
        {/* LEFT PANEL */}
        <div style={{width:188,borderRight:"1px solid #1e1e3f",padding:12,display:"flex",flexDirection:"column",gap:10,flexShrink:0,overflowY:"auto",background:"#070710"}}>
          {/* Balance */}
          <div style={{background:"#0d0d1a",border:"1px solid #2d1b69",borderRadius:8,padding:12}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:4,letterSpacing:1}}>$CANVAS BALANCE</div>
            <div style={{fontSize:26,fontWeight:"bold",color:"#a855f7",lineHeight:1}}>{Math.floor(balance).toLocaleString()}</div>
            {owned > 0 && (
              <div style={{fontSize:9,color:"#6d28d9",marginTop:3}}>
                +{(owned*HOLD_REWARD_RATE*60).toFixed(3)}/min hold
              </div>
            )}
          </div>

          {/* Cooldown */}
          <div style={{background:"#0d0d1a",border:`1px solid ${cooldown>0?"#7c3aed":"#166534"}`,borderRadius:8,padding:12}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:6,letterSpacing:1}}>COOLDOWN</div>
            {cooldown > 0 ? (
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
            {([
              ["Pixels owned", owned],
              ["Total placed", placed],
            ] as [string,number][]).map(([k,v]) => (
              <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:"#475569"}}>{k}</span>
                <span style={{color:"#22d3ee"}}>{v}</span>
              </div>
            ))}
            {/* Holdr progress */}
            <div style={{marginTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:9,color:"#475569"}}>Holdr status</span>
                <span style={{fontSize:9,color:isHoldr?"#a855f7":"#334155"}}>{isHoldr?"✓ HOLDR":`${Math.floor(holdrProgress)}%`}</span>
              </div>
              <div style={{height:3,background:"#1e1e2e",borderRadius:2}}>
                <div style={{height:"100%",background:isHoldr?"#a855f7":"#4c1d95",width:`${holdrProgress}%`,borderRadius:2,transition:"width 0.3s"}}/>
              </div>
              {!isHoldr && (
                <div style={{fontSize:8,color:"#334155",marginTop:3}}>need {(10000-Math.floor(owned*12)).toLocaleString()} more $C</div>
              )}
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
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",background:"radial-gradient(ellipse at center,#0d0d20,#070710)"}}>

          {/* Strike popup */}
          {strike && (() => {
            const sc = strikeStyle(strike.tier);
            return (
              <div style={{
                position:"absolute",top:"50%",left:"50%",
                transform:"translate(-50%,-60%)",
                zIndex:20,textAlign:"center",pointerEvents:"none",
              }}>
                <style>{`
                  @keyframes strikeIn {
                    0%   { opacity:0; transform:translate(-50%,-80%) scale(0.5); }
                    20%  { opacity:1; transform:translate(-50%,-55%) scale(1.1); }
                    80%  { opacity:1; transform:translate(-50%,-50%) scale(1); }
                    100% { opacity:0; transform:translate(-50%,-40%) scale(0.9); }
                  }
                `}</style>
                <div style={{
                  padding:"18px 36px",borderRadius:14,
                  background:sc.bg,border:`2px solid ${sc.border}`,
                  boxShadow:`0 0 ${strike.tier==="legendary"?"80px":strike.tier==="rare"?"50px":"30px"} ${sc.shadow}`,
                  fontFamily:"'Press Start 2P',monospace",
                  animation:"strikeIn 3s ease-out forwards",
                }}>
                  <div style={{fontSize:9,color:sc.text,marginBottom:6,letterSpacing:2}}>
                    {strike.tier.toUpperCase()} STRIKE
                  </div>
                  <div style={{fontSize:28,color:"#ffffff",fontWeight:"bold"}}>+{strike.earn}</div>
                  <div style={{fontSize:8,color:sc.text,marginTop:4}}>{strikeBonus(strike.tier)}× base · $CANVAS</div>
                </div>
              </div>
            );
          })()}

          <div style={{position:"relative"}}>
            {/* Shield glow */}
            {shield && (
              <div style={{
                position:"absolute",inset:-12,borderRadius:8,
                border:"2px solid #f59e0b",
                boxShadow:"0 0 60px rgba(245,158,11,0.5),inset 0 0 40px rgba(245,158,11,0.04)",
                pointerEvents:"none",zIndex:2,
              }}/>
            )}

            <canvas
              ref={canvasRef}
              width={GRID*PX}
              height={GRID*PX}
              onClick={handleClick}
              onMouseMove={handleMove}
              onMouseLeave={() => setHovered(null)}
              style={{
                cursor: cooldown>0 ? "not-allowed" : "crosshair",
                display:"block",
                border:"1px solid #1e1e3f",
                borderRadius:4,
                boxShadow:"0 0 60px rgba(88,28,235,0.15)",
              }}
            />

            {/* Pixel tooltip */}
            {hovered && (
              <div style={{
                position:"absolute",
                left: Math.min(hovered.x*PX+14, GRID*PX-170),
                top:  Math.max(hovered.y*PX-38, 0),
                background:"#0d0d1a",border:"1px solid #2d1b69",
                borderRadius:6,padding:"5px 10px",
                fontSize:9,whiteSpace:"nowrap",pointerEvents:"none",zIndex:5,
              }}>
                ({hovered.x},{hovered.y}) ·{" "}
                {hovered.d
                  ? `${hovered.d.owner===WALLET?"YOUR PIXEL":hovered.d.owner}`
                  : "empty — click to claim"}
                {hovered.d && (
                  <span style={{
                    marginLeft:6,display:"inline-block",width:8,height:8,
                    background:hovered.d.color,borderRadius:2,verticalAlign:"middle",
                  }}/>
                )}
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
              {PALETTE.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  aspectRatio:"1",borderRadius:4,background:c,border:"none",cursor:"pointer",
                  outline:color===c?"2px solid #ffffff":"2px solid transparent",
                  outlineOffset:2,transition:"outline 0.1s",
                }}/>
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
              {tier:"Common",  chance:"5%",   mult:"5×",   color:"#64748b"},
              {tier:"Rare",    chance:"1%",   mult:"25×",  color:"#22d3ee"},
              {tier:"Legendary",chance:"0.1%",mult:"200×", color:"#f59e0b"},
            ].map(s => (
              <div key={s.tier} style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:9}}>
                <span style={{color:s.color}}>{s.tier}</span>
                <span style={{color:"#334155"}}>{s.chance}</span>
                <span style={{color:s.color,fontWeight:"bold"}}>{s.mult}</span>
              </div>
            ))}
            <div style={{marginTop:6,fontSize:8,color:"#1e3a4f",lineHeight:1.6}}>
              Pyth Entropy RNG · on-chain verifiable
            </div>
          </div>

          {/* Leaderboard */}
          <div style={{background:"#0d0d1a",border:"1px solid #1e1e3f",borderRadius:8,padding:10,flex:1}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:10,letterSpacing:1}}>TOP PLAYERS</div>
            {[
              {addr:"0xaf1…c32", px:842, earn:18204, isYou:false},
              {addr:"0x7a3…b9f", px:634, earn:12849, isYou:false},
              {addr:WALLET,      px:owned, earn:Math.floor(balance), isYou:true},
              {addr:"0x99d…441", px:201, earn:4180,  isYou:false},
              {addr:"0xb82…71a", px:98,  earn:1862,  isYou:false},
            ]
            .sort((a,b)=>b.px-a.px)
            .slice(0,5)
            .map((p,i) => (
              <div key={p.addr} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:9,fontSize:9}}>
                <span style={{
                  color:i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#b45309":"#1e293b",
                  width:10,flexShrink:0,fontWeight:"bold",fontSize:8,marginTop:1,
                }}>{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{
                    color:p.isYou?"#a855f7":"#475569",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    fontWeight:p.isYou?"bold":"normal",
                  }}>
                    {p.isYou ? "▶ YOU" : p.addr}
                  </div>
                  <div style={{color:"#1e293b",fontSize:8,marginTop:1}}>
                    {p.px} px · {p.earn.toLocaleString()} $C
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity log */}
          <div style={{background:"#060612",border:"1px solid #1a1a30",borderRadius:8,padding:10}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:6,letterSpacing:1}}>ACTIVITY</div>
            {log.slice(0,8).map((l,i) => (
              <div key={i} style={{
                fontSize:8,marginBottom:3,lineHeight:1.5,
                color:l.includes("STRIKE")?"#f59e0b":l.includes("SHIELD")?"#22d3ee":l.includes("WALLET")?"#22c55e":"#1e3052",
              }}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
