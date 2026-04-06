'use client';
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const GRID = 1000;
const PX   = 1;
const COOLDOWN_SEC = 10;
const BASE_EARN = 5;
const HOLD_REWARD_RATE = 0.5 / 3600;

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

// ─── Pixel Art Seeding ────────────────────────────────────────────────────────

function px(g: (PxData|null)[], x: number, y: number, color: string, owner = "art") {
  if (x >= 0 && x < GRID && y >= 0 && y < GRID)
    g[y * GRID + x] = { color, owner };
}

function fillRect(g: (PxData|null)[], x: number, y: number, w: number, h: number, color: string) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      px(g, x + dx, y + dy, color);
}

function drawPattern(
  g: (PxData|null)[],
  ox: number, oy: number,
  rows: string[],
  palette: Record<string, string>
) {
  rows.forEach((row, dy) =>
    [...row].forEach((ch, dx) => {
      const c = palette[ch];
      if (c) px(g, ox + dx, oy + dy, c);
    })
  );
}

function seedCanvas(g: (PxData|null)[]) {
  // ── ZONE BACKGROUNDS ──────────────────────────────────────────────────────
  fillRect(g, 0,   0,   500, 320, "#0a0500");   // BTC zone — dark amber
  fillRect(g, 500, 0,   500, 320, "#04001a");   // ETH zone — deep navy
  fillRect(g, 0,   320, 270, 220, "#0a0800");   // DOGE zone — warm dark
  fillRect(g, 270, 320, 230, 220, "#120000");   // TRUMP/MAGA zone
  fillRect(g, 500, 320, 260, 220, "#04001a");   // SOL zone — indigo
  fillRect(g, 760, 320, 240, 220, "#010108");   // SPACE/ELON zone — near black
  fillRect(g, 0,   540, 270, 210, "#100000");   // CHINA zone — dark red
  fillRect(g, 270, 540, 230, 210, "#0d0900");   // CZ/BNB zone — dark gold
  fillRect(g, 500, 540, 260, 210, "#030010");   // KOREA zone
  fillRect(g, 760, 540, 240, 210, "#001200");   // PEPE zone — dark green
  fillRect(g, 0,   750, 1000,250, "#020202");   // MOON/HODL bottom

  // ── RAINBOW SEPARATORS ───────────────────────────────────────────────────
  const rc = ["#ef4444","#f97316","#f59e0b","#84cc16","#22c55e","#06b6d4","#8b5cf6","#ec4899"];
  for (let x = 0; x < 1000; x++) {
    const ci = Math.floor(x / 125) % 8;
    px(g, x, 318, rc[ci]); px(g, x, 319, rc[ci]); px(g, x, 320, rc[ci]);
    px(g, x, 538, rc[ci]); px(g, x, 539, rc[ci]); px(g, x, 540, rc[ci]);
    px(g, x, 748, rc[ci]); px(g, x, 749, rc[ci]); px(g, x, 750, rc[ci]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BTC ZONE (0,0 → 500,320)
  // ─────────────────────────────────────────────────────────────────────────
  // Large Bitcoin coin — circle with ₿
  for (let dy = -60; dy <= 60; dy++)
    for (let dx = -60; dx <= 60; dx++) {
      const r2 = dx*dx + dy*dy;
      if (r2 <= 3600 && r2 > 3025) px(g, 130+dx, 150+dy, "#c46a00");
      else if (r2 <= 3025) px(g, 130+dx, 150+dy, "#f7931a");
    }
  // ₿ symbol
  drawPattern(g, 98, 108, [
    "..BBBBBBBBB...",
    ".B.........BB.",
    "B...........BB",
    "B...........B.",
    "B...........B.",
    "B...BBBBBBB...",
    "B...BBBBBBBB..",
    "B...........BB",
    "B...........BB",
    "B...........B.",
    ".B.........BB.",
    "..BBBBBBBBB...",
  ], { B: "#7a3d00" });
  // vertical bar
  for (let y = 103; y <= 197; y++) { px(g, 109, y, "#7a3d00"); px(g, 110, y, "#7a3d00"); }

  // "BTC" label
  drawPattern(g, 60, 240, [
    "BBB.TTT.CCC.",
    "B.B.T...C...",
    "BBB.T...C...",
    "B...T...C...",
    "B...T...CCC.",
  ], { B: "#f7931a", T: "#f7931a", C: "#f7931a" });

  // "$1M" target
  drawPattern(g, 170, 240, [
    "SSS.1..MMM.",
    "S...1..MMM.",
    "SSS.1..M.M.",
    "..S.1..M.M.",
    "SSS.1..M.M.",
  ], { S: "#ffd700", "1": "#ffd700", M: "#ffd700" });

  // Scattered ₿ symbols in BTC zone
  for (const [sx, sy] of [[310,30],[380,60],[430,140],[350,200],[290,80],[450,250],[320,270]]) {
    drawPattern(g, sx, sy, [".B.",".B.","BBB",".B.",".B."], { B: "#f7931a" });
  }

  // "HODL" text top-right of BTC zone
  drawPattern(g, 280, 170, [
    "H.H.OOO.DDD.LLL.",
    "H.H.O.O.D.D.L...",
    "HHH.O.O.D.D.L...",
    "H.H.O.O.D.D.L...",
    "H.H.OOO.DDD.LLL.",
  ], { H: "#ff8c00", O: "#ff8c00", D: "#ff8c00", L: "#ff8c00" });

  // "SATS" small text
  drawPattern(g, 60, 280, [
    "SSS.AAA.TTT.SSS.",
    "S...A.A.T...S...",
    "SSS.AAA.T...SSS.",
    "..S.A.A.T.....S.",
    "SSS.A.A.T...SSS.",
  ], { S: "#ff9900", A: "#ff9900", T: "#ff9900" });

  // ─────────────────────────────────────────────────────────────────────────
  // ETH ZONE (500,0 → 1000,320)
  // ─────────────────────────────────────────────────────────────────────────
  // Ethereum diamond
  drawPattern(g, 680, 30, [
    "......EEEE......",
    ".....EEEEEE.....",
    "....EEEEEEEE....",
    "...EEEEEEEEEE...",
    "..EEEEEEEEEEEE..",
    ".EEEEEEEEEEEEEE.",
    "EEEEEEEEEEEEEEEE",
    "EEEEEEEEEEEEEEEE",
    ".DDDDDDDDDDDDDD.",
    "..DDDDDDDDDDDD..",
    "...DDDDDDDDDD...",
    "....DDDDDDDD....",
    ".....DDDDDD.....",
    "......DDDD......",
    ".......DD.......",
    "........D.......",
  ], { E: "#a79af5", D: "#7b68ee" });

  // "ETH" label
  drawPattern(g, 670, 175, [
    "EEE.TTT.HHH.",
    "E...T...H.H.",
    "EEE.T...HHH.",
    "E...T...H.H.",
    "EEE.T...H.H.",
  ], { E: "#a79af5", T: "#a79af5", H: "#a79af5" });

  // Scattered ETH diamonds
  for (const [sx, sy] of [[820,20],[900,80],[850,200],[950,150],[810,260],[770,40],[940,240]]) {
    drawPattern(g, sx, sy, ["..E..","EEEEE","EEEEE",".EEE.","..E.."], { E: "#7b68ee" });
  }

  // "GAS FEES" humor
  drawPattern(g, 505, 250, [
    "GGG.AAA.SSS...FFF.EEE.EEE.SSS.",
    "G...A.A.S.....F...E...E...S...",
    "GGG.AAA.SSS...FFF.EEE.EEE.SSS.",
    "G.G.A.A...S...F...E...E.....S.",
    "GGG.A.A.SSS...F...EEE.EEE.SSS.",
  ], { G: "#a79af5", A: "#a79af5", S: "#a79af5", F: "#ff4444", E: "#ff4444" });

  // EIP-1559 burn flame
  drawPattern(g, 940, 260, [
    "..F..",
    ".FFF.",
    "FFFFF",
    "FFFFF",
    ".FFF.",
    "..F..",
  ], { F: "#ff4400" });

  // ─────────────────────────────────────────────────────────────────────────
  // DOGE ZONE (0,320 → 270,540)
  // ─────────────────────────────────────────────────────────────────────────
  // Shiba Inu face
  drawPattern(g, 20, 345, [
    "..CCCCCCCCCCC..",
    ".CCCCCCCCCCCCC.",
    "CCCCCCCCCCCCCCC",
    "CCCCCCCCCCCCCCC",
    "CC.CCCCCCC.CCCC",
    "CWWCCCCCCCWWCCC",
    "CBBCCCCCCCBBCCC",
    "CCCCCCCCCCCCCCC",
    ".CCNNNNNNNNCCC.",
    ".CCNBBBBBBNCC..",
    "..CCCCCCCCCCC..",
    "..CRRRRRRRRCC..",
    "...CRRRRRRCC...",
    "CCCCCCCCCCCCCCC",
  ], { C: "#c8922a", W: "#f5f5f5", B: "#333333", N: "#a0522d", R: "#cc3333" });

  // "DOGE" label
  drawPattern(g, 15, 490, [
    "DDD.OOO.GGG.EEE.",
    "D.D.O.O.G...E...",
    "D.D.O.O.G.G.EEE.",
    "D.D.O.O.G.G.E...",
    "DDD.OOO.GGG.EEE.",
  ], { D: "#c8922a", O: "#c8922a", G: "#c8922a", E: "#c8922a" });

  // "MUCH WOW" meme text
  drawPattern(g, 155, 360, [
    "M.M.W.W.O.W.",
    "MMM.W.W.WWW.",
    "M.M..W..W.W.",
    "M.M..W..W.W.",
  ], { M: "#ffd700", W: "#ffd700", O: "#ffd700" });

  // "VERY CRYPTO"
  drawPattern(g, 155, 420, [
    "V.V.EEE.R.R.Y.Y.",
    "V.V.E...RRR..Y..",
    ".V..EEE.R.R..Y..",
    ".V..E...R.R..Y..",
    ".V..EEE.R.R..Y..",
  ], { V: "#f5c518", E: "#f5c518", R: "#f5c518", Y: "#f5c518" });

  // ─────────────────────────────────────────────────────────────────────────
  // TRUMP / MAGA ZONE (270,320 → 500,540)
  // ─────────────────────────────────────────────────────────────────────────
  // Trump pixel face (golden hair, skin, red tie)
  drawPattern(g, 300, 330, [
    "....HHHHHHHHHHHHHH....",
    "...HHHHHHHHHHHHHHHH...",
    "..HHHHHHHHHHHHHHHHHH..",
    "..HHHHHHHHHHHHHHHHHH..",
    "..SSSSSSSSSSSSSSSSSS..",
    "..SSSSSSSSSSSSSSSSSS..",
    "..SS..SSSSSSSS..SS...",
    "..SBBSSSSSSSSBBSS....",
    "..SEESSSSSSSEESS.....",
    "..SWWSSSSSSSWWSS.....",
    "..SSSSSSSSSSSSSS.....",
    "..SSSSNNNNSSSSSS.....",
    "..SSSSSSSSSSSSSS.....",
    "..SRRRRRRRRRSSSS.....",
    "..SSSSSSSSSSSSSS.....",
    "...WWWWWWWWWWWW......",
    "...WTTTTTTTTTW.......",
    "...WTTTTTTTTTW.......",
    "..BBBBBBBBBBBBB......",
    "..BBBBBBBBBBBBB......",
  ], { H: "#e8a200", S: "#ffd4a0", B: "#331100", E: "#552200", W: "#ffffff", R: "#dd3333", T: "#cc0000" });

  // "MAGA" label
  drawPattern(g, 290, 505, [
    "M.M.AAA.GGG.AAA.",
    "MMM.A.A.G...A.A.",
    "M.M.AAA.GGG.AAA.",
    "M.M.A.A.G.G.A.A.",
    "M.M.A.A.GGG.A.A.",
  ], { M: "#cc0000", A: "#cc0000", G: "#cc0000" });

  // "TRUMP COIN" text
  drawPattern(g, 390, 345, [
    "TTT.R.R.",
    "T...RRR.",
    "T...R.R.",
    "T...R.R.",
    "T...R.R.",
  ], { T: "#ffd700", R: "#ffd700" });

  // ─────────────────────────────────────────────────────────────────────────
  // SOL ZONE (500,320 → 760,540)
  // ─────────────────────────────────────────────────────────────────────────
  // Solana logo (three gradient bars)
  drawPattern(g, 510, 345, [
    "PPPPPPPPPPPPPPPPPPPP",
    "PPPPPPPPPPPPPPPPPP..",
    "PPPPPPPPPPPPPPPPPP..",
    "PPPPPPPPPPPPPPPP....",
    "....................",
    "GGGGGGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGGGG..",
    "GGGGGGGGGGGGGGGG....",
    "GGGGGGGGGGGGGG......",
    "....................",
    "PPPPPPPPPPPPPPPPPPPP",
    "PPPPPPPPPPPPPPPPPP..",
    "PPPPPPPPPPPPPPPPPP..",
    "PPPPPPPPPPPPPPPP....",
  ], { P: "#9945ff", G: "#14f195" });

  // "SOL" label
  drawPattern(g, 515, 390, [
    "SSS.OOO.L...",
    "S...O.O.L...",
    "SSS.O.O.L...",
    "..S.O.O.L...",
    "SSS.OOO.LLL.",
  ], { S: "#9945ff", O: "#9945ff", L: "#14f195" });

  // "$SOL" price text
  drawPattern(g, 600, 390, [
    "SSS.PPP.",
    "S...P.P.",
    "SSS.PPP.",
    "..S.P...",
    "SSS.P...",
  ], { S: "#14f195", P: "#14f195" });

  // "FASTEST L1" label
  drawPattern(g, 510, 460, [
    "FFF.AAA.SSS.TTT.EEE.SSS.TTT.",
    "F...A.A.S...T...E...S...T...",
    "FFF.AAA.SSS.T...EEE.SSS.T...",
    "F...A.A...S.T...E.....S.T...",
    "F...A.A.SSS.T...EEE.SSS.T...",
  ], { F: "#14f195", A: "#14f195", S: "#14f195", T: "#14f195", E: "#14f195" });

  // "DeFi" text
  drawPattern(g, 640, 460, [
    "DDD.EEE.FFF.iii.",
    "D.D.E...F....i..",
    "D.D.EEE.FFF..i..",
    "D.D.E...F....i..",
    "DDD.EEE.F...iii.",
  ], { D: "#9945ff", E: "#9945ff", F: "#9945ff", i: "#9945ff" });

  // ─────────────────────────────────────────────────────────────────────────
  // ELON / SPACE ZONE (760,320 → 1000,540)
  // ─────────────────────────────────────────────────────────────────────────
  // SpaceX rocket
  drawPattern(g, 820, 330, [
    "...WW...",
    "..WWWW..",
    ".WWWWWW.",
    ".WRRWWW.",
    ".WRRWWW.",
    ".WWWWWW.",
    "WWWWWWWW",
    "WWWWWWWW",
    "WWWWWWWW",
    "WWWWWWWW",
    "WWWWWWWW",
    "BWWWWWWB",
    "BWWWWWWB",
    "BWWWWWWB",
    ".BBBBBB.",
    "..FFFF..",
    "..FFFF..",
    "...FF...",
    "...FF...",
  ], { W: "#c0c0c0", R: "#3399ff", B: "#707070", F: "#ff6600" });

  // Stars in space
  for (const [sx, sy] of [[780,325],[800,340],[850,360],[900,330],[960,345],[770,380],[990,370],
                           [785,410],[930,400],[870,430],[800,450],[950,460],[775,490],[920,500]]) {
    px(g, sx, sy, "#ffffff");
  }

  // Elon face (simple pixel portrait)
  drawPattern(g, 900, 340, [
    ".SSSSSS.",
    "SSSSSSSS",
    "SS.SS.SS",
    "SBBSSBBS",
    "SSSSSSSS",
    ".SNSSNSS",
    "SSSSSSSS",
    ".SRRRRSS",
    "SSSSSSSS",
    ".SSSSSS.",
  ], { S: "#f0d5b0", B: "#444444", N: "#cc9966", R: "#cc5555" });

  // "X" logo
  drawPattern(g, 955, 340, [
    "X...X",
    ".X.X.",
    "..X..",
    ".X.X.",
    "X...X",
  ], { X: "#ffffff" });

  // "SPACEX" label
  drawPattern(g, 775, 490, [
    "SSS.PPP.AAA.CCC.EEE.X.X.",
    "S...P.P.A.A.C...E...X.X.",
    "SSS.PPP.AAA.C...EEE..X..",
    "..S.P...A.A.C...E...X.X.",
    "SSS.P...A.A.CCC.EEE.X.X.",
  ], { S: "#ffffff", P: "#ffffff", A: "#ffffff", C: "#ffffff", E: "#ffffff", X: "#ffffff" });

  // ─────────────────────────────────────────────────────────────────────────
  // CHINA ZONE (0,540 → 270,750)
  // ─────────────────────────────────────────────────────────────────────────
  fillRect(g, 10, 555, 240, 150, "#de2910");
  // Big yellow star
  drawPattern(g, 25, 565, [
    "...YY...",
    "..YYYY..",
    ".YYYYYY.",
    "YYYYYYYY",
    ".YYYYYY.",
    "..YYYY..",
    "...YY...",
  ], { Y: "#ffde00" });
  // 4 small stars
  drawPattern(g, 90, 565, [".y.","yyy",".y."], { y: "#ffde00" });
  drawPattern(g, 115, 580, [".y.","yyy",".y."], { y: "#ffde00" });
  drawPattern(g, 115, 605, [".y.","yyy",".y."], { y: "#ffde00" });
  drawPattern(g, 90, 620, [".y.","yyy",".y."], { y: "#ffde00" });

  // "CHINA" label
  drawPattern(g, 10, 715, [
    "CCC.HHH.III.NNN.AAA.",
    "C...H.H..I..N.N.A.A.",
    "C...HHH..I..NNN.AAA.",
    "C...H.H..I..N.N.A.A.",
    "CCC.H.H.III.N.N.A.A.",
  ], { C: "#de2910", H: "#de2910", I: "#de2910", N: "#de2910", A: "#de2910" });

  // Crypto ban/chaos text
  drawPattern(g, 140, 620, [
    "BBB.AAA.NNN.",
    "B...A.A.N.N.",
    "BBB.AAA.NNN.",
    "B...A.A.N.N.",
    "BBB.A.A.N.N.",
  ], { B: "#ffde00", A: "#ffde00", N: "#ffde00" });
  drawPattern(g, 145, 675, [
    "CCC.R.R.Y.Y.PPP.",
    "C...RRR..Y..P.P.",
    "C...R.R..Y..PPP.",
    "C...R.R..Y..P...",
    "CCC.R.R..Y..P...",
  ], { C: "#ffde00", R: "#ffde00", Y: "#ffde00", P: "#ffde00" });

  // ─────────────────────────────────────────────────────────────────────────
  // CZ / BNB ZONE (270,540 → 500,750)
  // ─────────────────────────────────────────────────────────────────────────
  // BNB diamond logo (bigger)
  drawPattern(g, 290, 560, [
    "....YYYY....",
    "...YYYYYY...",
    "..YYYYYYYY..",
    ".YYYYYY.YYY.",
    "YYYYYYY.YYYY",
    "YYYYYYYYYYY.",
    ".YYYYYY.YYY.",
    "..YYYYYYYY..",
    "...YYYYYY...",
    "....YYYY....",
  ], { Y: "#f3ba2f" });

  // CZ pixel face
  drawPattern(g, 380, 558, [
    ".SSSSSSS.",
    "SSSSSSSSS",
    "SS.SSS.SS",
    "SBBSSSBBSS",
    "SSSSSSSSS",
    ".SNNNSSS.",
    "SSSSSSSSS",
    ".SRRRRSS.",
    "SSSSSSSSS",
    ".SSSSSSS.",
  ], { S: "#f5c27a", B: "#333333", N: "#cc9966", R: "#cc5555" });

  // "CZ" label
  drawPattern(g, 380, 670, [
    "CCC.ZZZ.",
    "C...Z...",
    "C...ZZZ.",
    "C...Z...",
    "CCC.ZZZ.",
  ], { C: "#f3ba2f", Z: "#f3ba2f" });

  // "BNB" label
  drawPattern(g, 285, 680, [
    "BBB.NNN.BBB.",
    "B.B.NNN.B.B.",
    "BBB.N.N.BBB.",
    "B.B.N.N.B.B.",
    "BBB.N.N.BBB.",
  ], { B: "#f3ba2f", N: "#f3ba2f" });

  // "BINANCE" text
  drawPattern(g, 285, 720, [
    "BBB.III.NNN.AAA.NNN.CCC.EEE.",
    "B.B..I..N.N.A.A.N.N.C...E...",
    "BBB..I..NNN.AAA.NNN.C...EEE.",
    "B...III.N.N.A.A.N.N.C...E...",
    "B...III.N.N.A.A.N.N.CCC.EEE.",
  ], { B: "#f3ba2f", I: "#f3ba2f", N: "#f3ba2f", A: "#f3ba2f", C: "#f3ba2f", E: "#f3ba2f" });

  // ─────────────────────────────────────────────────────────────────────────
  // KOREA ZONE (500,540 → 760,750)
  // ─────────────────────────────────────────────────────────────────────────
  fillRect(g, 510, 552, 230, 160, "#f0f0f0");
  // Taegeuk circle — red top, blue bottom
  for (let dy = -30; dy <= 30; dy++)
    for (let dx = -30; dx <= 30; dx++)
      if (dx*dx + dy*dy <= 900)
        px(g, 625+dx, 632+dy, dy < 0 ? "#cd2e3a" : "#003478");
  // White yin-yang divider
  for (let dx = -30; dx <= 30; dx++) { px(g, 625+dx, 631, "#f0f0f0"); px(g, 625+dx, 632, "#f0f0f0"); }
  // Trigrams corners
  for (const [tx, ty, p] of [[515,557,3],[725,557,3],[515,677,3],[725,677,3]] as [number,number,number][]) {
    for (let i = 0; i < p; i++) fillRect(g, tx, ty + i*7, 15, 4, "#000000");
  }

  // "KOREA" label
  drawPattern(g, 510, 720, [
    "K.K.OOO.R.R.EEE.AAA.",
    "KK..O.O.RRR.E...A.A.",
    "K.K.O.O.R.R.EEE.AAA.",
    "KK..O.O.RRR.E...A.A.",
    "K.K.OOO.R.R.EEE.A.A.",
  ], { K: "#cd2e3a", O: "#cd2e3a", R: "#cd2e3a", E: "#cd2e3a", A: "#cd2e3a" });

  // "KIMCHI PREMIUM"
  drawPattern(g, 505, 508, [
    "K.K.III.M.M.CCC.HHH.III.",
    "KK...I..MMM.C...H.H..I..",
    "K.K..I..M.M.CCC.HHH..I..",
    "KK...I..M.M.C...H.H..I..",
    "K.K.III.M.M.CCC.H.H.III.",
  ], { K: "#003478", I: "#003478", M: "#003478", C: "#cd2e3a", H: "#cd2e3a" });

  // ─────────────────────────────────────────────────────────────────────────
  // PEPE ZONE (760,540 → 1000,750)
  // ─────────────────────────────────────────────────────────────────────────
  // Pepe frog face (classic meme)
  drawPattern(g, 780, 555, [
    "..GGGGGGGGGGGG..",
    ".GGGGGGGGGGGGGG.",
    "GGGGGGGGGGGGGGGG",
    "GG.GGGGGGGGGG.GG",
    "GEWWGGGGGGWWGGGG",
    "GBBGGGGGGGBBGGGG",
    "GGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGG",
    ".GGNNGGGGNNGGGG.",
    ".GGGGGGGGGGGGG..",
    ".GLLLLLLLLLLLG..",
    "GGGGGGGGGGGGGG..",
  ], { G: "#3d9a3d", W: "#f0f0f0", B: "#000000", N: "#2d7a2d", L: "#2d7a2d" });

  // "KEKW" text
  drawPattern(g, 780, 680, [
    "K.K.EEE.K.K.W.W.",
    "KK..E...KK..W.W.",
    "K.K.EEE.K.K..W..",
    "KK..E...KK..W.W.",
    "K.K.EEE.K.K.W.W.",
  ], { K: "#3d9a3d", E: "#3d9a3d", W: "#3d9a3d" });

  // "GG EZ" text
  drawPattern(g, 890, 680, [
    "GGG.GGG...EEE.ZZZ.",
    "G...G.....E.....Z.",
    "GGG.GGG...EEE..Z..",
    "G.G.G.....E...Z...",
    "GGG.GGG...EEE.ZZZ.",
  ], { G: "#55cc55", E: "#55cc55", Z: "#55cc55" });

  // "PEPE" label
  drawPattern(g, 780, 720, [
    "PPP.EEE.PPP.EEE.",
    "P.P.E...P.P.E...",
    "PPP.EEE.PPP.EEE.",
    "P...E...P...E...",
    "P...EEE.P...EEE.",
  ], { P: "#3d9a3d", E: "#3d9a3d" });

  // ─────────────────────────────────────────────────────────────────────────
  // MOON / HODL BOTTOM ZONE (0,750 → 1000,1000)
  // ─────────────────────────────────────────────────────────────────────────
  // Moon (large circle)
  for (let dy = -55; dy <= 55; dy++)
    for (let dx = -55; dx <= 55; dx++)
      if (dx*dx + dy*dy <= 3025) px(g, 110+dx, 840+dy, "#f5f5a0");
  // Craters
  for (let dy = -10; dy <= 10; dy++)
    for (let dx = -10; dx <= 10; dx++)
      if (dx*dx + dy*dy <= 100) px(g, 90+dx, 820+dy, "#d8d870");
  for (let dy = -7; dy <= 7; dy++)
    for (let dx = -7; dx <= 7; dx++)
      if (dx*dx + dy*dy <= 49) px(g, 145+dx, 865+dy, "#d8d870");
  for (let dy = -4; dy <= 4; dy++)
    for (let dx = -4; dx <= 4; dx++)
      if (dx*dx + dy*dy <= 16) px(g, 100+dx, 870+dy, "#d8d870");

  // "TO THE MOON" text
  drawPattern(g, 185, 790, [
    "TTT.OOO...TTT.HHH.EEE...M.M.OOO.OOO.NNN.",
    "T...O.O...T...H.H.E...MMM.M.O.O.O.O.N.N.",
    "T...O.O...T...HHH.EEE.M.M.M.O.O.O.O.NNN.",
    "T...O.O...T...H.H.E...M.M.M.O.O.O.O.N.N.",
    "T...OOO...T...H.H.EEE.M.M.M.OOO.OOO.N.N.",
  ], { T: "#ffff44", O: "#ffff44", H: "#ffff44", E: "#ffff44", M: "#ffff44", N: "#ffff44" });

  // "HODL" large
  drawPattern(g, 185, 860, [
    "HHH.OOO.DDD.LLL.",
    "H.H.O.O.D.D.L...",
    "HHH.O.O.D.D.L...",
    "H.H.O.O.D.D.L...",
    "H.H.OOO.DDD.LLL.",
  ], { H: "#ff8c00", O: "#ff8c00", D: "#ff8c00", L: "#ff8c00" });

  // "WAGMI" text
  drawPattern(g, 185, 930, [
    "W.W.AAA.GGG.M.M.III.",
    "W.W.A.A.G...MMM..I..",
    "W.W.AAA.GGG.M.M..I..",
    ".W..A.A.G.G.M.M..I..",
    ".W..A.A.GGG.M.M.III.",
  ], { W: "#00ff88", A: "#00ff88", G: "#00ff88", M: "#00ff88", I: "#00ff88" });

  // "GM" crypto greeting
  drawPattern(g, 60, 900, [
    "GGG.M.M.",
    "G...MMM.",
    "GGG.M.M.",
    "G.G.M.M.",
    "GGG.M.M.",
  ], { G: "#44ffaa", M: "#44ffaa" });

  // "NFA DYOR" disclaimer humor
  drawPattern(g, 60, 960, [
    "NNN.FFF.AAA...DDD.Y.Y.OOO.R.R.",
    "N.N.F...A.A...D.D..Y..O.O.RRR.",
    "NNN.FFF.AAA...D.D..Y..O.O.R.R.",
    "N.N.F...A.A...D.D..Y..O.O.R.R.",
    "N.N.F...A.A...DDD..Y..OOO.R.R.",
  ], { N: "#ff4444", F: "#ff4444", A: "#ff4444", D: "#88ff88", Y: "#88ff88", O: "#88ff88", R: "#88ff88" });

  // Bull pixel art
  drawPattern(g, 520, 860, [
    "H.......H.",
    "HH.BBB.HH.",
    ".BBBBBBB..",
    ".BBBBBBB..",
    "BBBBBBBBB.",
    "BBBBBBBBB.",
    "BBBBBBBBB.",
    ".BB.B.BB..",
    ".BB.B.BB..",
    ".BB.B.BB..",
  ], { H: "#c0c0c0", B: "#8B5e3c" });

  // "BULL RUN" text
  drawPattern(g, 540, 940, [
    "BBB.U.U.LLL.LLL...R.R.U.U.NNN.",
    "B.B.U.U.L...L.....RRR.U.U.NNN.",
    "BBB.U.U.L...L.....R.R.U.U.N.N.",
    "B...U.U.L...L.....R.R.U.U.N.N.",
    "B...UUU.LLL.LLL...R.R.UUU.N.N.",
  ], { B: "#ff8800", U: "#ff8800", L: "#ff8800", R: "#ff8800", N: "#ff8800" });

  // Diamond hands 💎
  drawPattern(g, 720, 820, [
    "..DDD.DDD..",
    ".DDDDDDDDD.",
    "DDDDDDDDDDD",
    "DDDDDDDDDDD",
    ".DDDDDDDDD.",
    "..DDDDDDD..",
    "...DDDDD...",
    "....DDD....",
    ".....D.....",
  ], { D: "#00bfff" });
  drawPattern(g, 790, 820, [
    "..DDD.DDD..",
    ".DDDDDDDDD.",
    "DDDDDDDDDDD",
    "DDDDDDDDDDD",
    ".DDDDDDDDD.",
    "..DDDDDDD..",
    "...DDDDD...",
    "....DDD....",
    ".....D.....",
  ], { D: "#00bfff" });

  // "DIAMOND HANDS" text
  drawPattern(g, 700, 880, [
    "DDD.III.AAA.M.M.OOO.NNN.DDD.",
    "D.D..I..A.A.MMM.O.O.N.N.D.D.",
    "D.D..I..AAA.M.M.O.O.NNN.D.D.",
    "D.D..I..A.A.M.M.O.O.N.N.D.D.",
    "DDD.III.A.A.M.M.OOO.N.N.DDD.",
  ], { D: "#00bfff", I: "#00bfff", A: "#00bfff", M: "#00bfff", O: "#00bfff", N: "#00bfff" });

  // Lambo pixel art
  drawPattern(g, 700, 935, [
    ".......YYYY....",
    ".....YYYYYY....",
    "....YYYYYYYYYYY",
    "...YYYYYYWWYYYY",
    "YYYYYYYYYY.YYYY",
    "YYYYYYYYYY.YYYY",
    ".WW.YYYYYYY.WW.",
    ".WW.YYYYYYY.WW.",
  ], { Y: "#ffd700", W: "#333333" });

  // "$$$" money signs scattered
  for (const [sx, sy] of [[860,760],[910,785],[870,830],[940,760],[920,920],[960,880],[880,960]]) {
    drawPattern(g, sx, sy, [".S.","SSS",".S.","SSS",".S."], { S: "#ffd700" });
  }

  // Scattered moon crescent symbols
  for (const [sx, sy] of [[30,755],[430,780],[450,860],[420,940]]) {
    drawPattern(g, sx, sy, [".CCC","C...","C...","C...","C...",".CCC"], { C: "#ffff88" });
  }

  // Stars scattered in bottom zone
  for (const [sx, sy] of [[395,760],[470,820],[480,900],[385,830],[475,960],[465,755]]) {
    px(g, sx, sy, "#ffffff"); px(g, sx+1, sy, "#ffffff");
    px(g, sx, sy+1, "#ffffff"); px(g, sx+1, sy+1, "#ffffff");
  }
}}

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
    const img = ctx.createImageData(GRID, GRID);
    const buf = img.data;
    for (let i = 0; i < GRID*GRID; i++) {
      const p = gridRef.current[i];
      const off = i * 4;
      if (p) {
        const hex = p.color.replace("#","");
        buf[off]   = parseInt(hex.slice(0,2),16);
        buf[off+1] = parseInt(hex.slice(2,4),16);
        buf[off+2] = parseInt(hex.slice(4,6),16);
        buf[off+3] = 255;
      } else {
        buf[off]=15; buf[off+1]=15; buf[off+2]=30; buf[off+3]=255;
      }
    }
    ctx.putImageData(img, 0, 0);
  },[]);

  // Seed canvas with preset artwork
  useEffect(() => {
    const g = gridRef.current;
    seedCanvas(g);
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
      if (cell?.owner === WALLET) return;
      const newOwner = rndOwner();
      const newColor = PALETTE[Math.floor(Math.random()*PALETTE.length)];
      g[idx] = { color:newColor, owner:newOwner };
      const c = canvasRef.current; if(!c) return;
      const ctx = c.getContext("2d")!;
      const img3 = ctx.createImageData(1, 1);
      const hex3 = newColor.replace("#","");
      img3.data[0]=parseInt(hex3.slice(0,2),16); img3.data[1]=parseInt(hex3.slice(2,4),16);
      img3.data[2]=parseInt(hex3.slice(4,6),16); img3.data[3]=255;
      ctx.putImageData(img3, idx%GRID, Math.floor(idx/GRID));
    }, 300);
    return () => clearInterval(t);
  },[]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (cooldown > 0) return;
    const rect2 = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const gx = Math.floor((e.clientX-rect2.left)/PX);
    const gy = Math.floor((e.clientY-rect2.top)/PX);
    if (gx<0||gy<0||gx>=GRID||gy>=GRID) return;
    const idx = gy*GRID+gx;
    const g = gridRef.current;
    const prev = g[idx];
    const wasOwn = prev?.owner===WALLET;
    g[idx] = {color, owner:WALLET};

    const c = canvasRef.current; if(!c) return;
    const ctx = c.getContext("2d")!;
    const img4 = ctx.createImageData(1, 1);
    const hex4 = color.replace("#","");
    img4.data[0]=parseInt(hex4.slice(0,2),16); img4.data[1]=parseInt(hex4.slice(2,4),16);
    img4.data[2]=parseInt(hex4.slice(4,6),16); img4.data[3]=255;
    ctx.putImageData(img4, gx, gy);

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
    const rect2 = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const gx = Math.floor((e.clientX-rect2.left)/PX);
    const gy = Math.floor((e.clientY-rect2.top)/PX);
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
            100×100 demo · 10s cooldown (real: 5 min) · no wallet needed
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
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"auto",background:"radial-gradient(ellipse at center,#0d0d20,#070710)"}}>

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
                imageRendering:"pixelated",
                border:"1px solid #1e1e3f",
                borderRadius:4,
                boxShadow:"0 0 60px rgba(88,28,235,0.15)",
              }}
            />

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

          {/* Activity log */}
          <div style={{background:"#0d0d1a",border:"1px solid #1e1e3f",borderRadius:8,padding:10,flex:1,overflow:"hidden"}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:8,letterSpacing:1}}>ACTIVITY LOG</div>
            <div style={{fontSize:8,lineHeight:2,overflow:"hidden"}}>
              {log.slice(0,8).map((l,i) => (
                <div key={i} style={{color:i===0?"#a855f7":"#334155",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l}</div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div style={{background:"#0d0d1a",border:"1px solid #1e1e3f",borderRadius:8,padding:10}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:10,letterSpacing:1}}>TOP PLAYERS</div>
            {[
              {addr:"0xaf1…c32", px:1284, earn:24680, isYou:false},
              {addr:"0x7a3…b9f", px:963,  earn:18420, isYou:false},
              {addr:WALLET,      px:owned, earn:Math.floor(balance), isYou:true},
              {addr:"0x99d…441", px:312,  earn:6180,  isYou:false},
              {addr:"0xb82…71a", px:148,  earn:2860,  isYou:false},
            ]
            .sort((a,b)=>b.px-a.px)
            .slice(0,5)
            .map((p,i) => (
              <div key={p.addr} style={{
                display:"flex",justifyContent:"space-between",
                marginBottom:6,fontSize:9,
                color:p.isYou?"#a855f7":i===0?"#f59e0b":"#475569",
              }}>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:90}}>
                  {i+1}. {p.addr}
                </span>
                <span style={{flexShrink:0,marginLeft:4}}>{p.px}px</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
