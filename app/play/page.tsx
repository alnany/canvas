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

  // ── LAYER 1: ZONE BASE FILLS ───────────────────────────────────────────────
  fillRect(g, 0,   0,   500, 500, "#150800");
  fillRect(g, 500, 0,   500, 500, "#08001f");
  fillRect(g, 0,   500, 500, 500, "#001208");
  fillRect(g, 500, 500, 500, 500, "#120a00");

  // ── LAYER 2: DENSE SYMBOL TILING (every 10px across full canvas) ──────────
  for (let ty = 0; ty < 500; ty += 10)
    for (let tx = 0; tx < 500; tx += 10)
      drawPattern(g, tx+3, ty+2, [".B.","BBB","B.B","BBB",".B."],
        { B: (tx+ty)%20<10 ? "#5c2d00" : "#7a3d00" });
  for (let ty = 0; ty < 500; ty += 10)
    for (let tx = 500; tx < 1000; tx += 10)
      drawPattern(g, tx+3, ty+2, [".E.","EEE","EEE",".E.","..."],
        { E: (tx+ty)%20<10 ? "#2d1060" : "#3d2080" });
  for (let ty = 500; ty < 1000; ty += 10)
    for (let tx = 0; tx < 500; tx += 10)
      drawPattern(g, tx+2, ty+2, ["DD.","D.D","D.D","D.D","DD."],
        { D: (tx+ty)%20<10 ? "#5c3500" : "#7a4500" });
  for (let ty = 500; ty < 1000; ty += 10)
    for (let tx = 500; tx < 1000; tx += 10)
      drawPattern(g, tx+3, ty+2, [".Y.","YYY",".Y.","YYY",".Y."],
        { Y: (tx+ty)%20<10 ? "#3d2800" : "#553800" });

  // ── LAYER 3: PORTRAIT GRID — Trump/Musk/CZ every 35px (~800 portraits) ────
  const tP = [
    "..HHHHHH..",".HHHHHHHH.","HHHHHHHHHH",
    "HSSSSSSSSH","SSSSSSSSSS","SE..SS..ES",
    "SSSSSSSSSS",".S.RRRR.S.","SSSSSSSSSS",
    ".WWWWWWWWW",".WRTTTTTRW","..TTTTTTT.",
    "...TTTTT..","....TTT...",
  ];
  const tC = { H:"#f97316",S:"#fddcb0",E:"#111",R:"#cc0000",W:"#f0f0f0",T:"#cc0000" };

  const mP = [
    "..DDDDDD..",".DDDDDDDD.","DDDDDDDDDD",
    "DDSSSSSSDD","SSSSSSSSSS","SE..SS..ES",
    "SSSSSSSSSS",".SS.SSSS.S","SSSSSSSSSS",
    ".BBBBBBBB.","BBBBBBBBBB","BBBBBBBBBB",
    "...RRRR...","....RR....",
  ];
  const mC = { D:"#2d2020",S:"#ffdfbf",E:"#111",B:"#0a0a30",R:"#cc2200" };

  const cP = [
    "..KKKKKK..",".KKKKKKKK.","KKKKKKKKKK",
    "KKSSSSSSKK","SSSSSSSSSS","SE..SS..ES",
    "SSSSSSSSSS",".SS.YY.SS.","SSSSSSSSSS",
    ".GGGGGGGG.","GGGGGGGGGG","GGGGGGGGG.",
    "...GGGGG..","....GGG...",
  ];
  const cC = { K:"#111",S:"#ffe0c8",E:"#111",Y:"#f7c948",G:"#f3ba2f" };

  for (let row = 0; row < 1000; row += 35)
    for (let col = 0; col < 1000; col += 35) {
      const idx = (Math.floor(row/35) * 29 + Math.floor(col/35)) % 3;
      if (idx === 0) drawPattern(g, col, row, tP, tC);
      else if (idx === 1) drawPattern(g, col, row, mP, mC);
      else drawPattern(g, col, row, cP, cC);
    }

  // ── LAYER 4: LARGE BITCOIN COIN (top-left) ────────────────────────────────
  for (let dy = -60; dy <= 60; dy++)
    for (let dx = -60; dx <= 60; dx++) {
      const r2 = dx*dx + dy*dy;
      if (r2 <= 3600 && r2 > 3025) px(g, 180+dx, 200+dy, "#c46a00");
      else if (r2 <= 3025) px(g, 180+dx, 200+dy, "#f7931a");
    }
  drawPattern(g, 152, 178, [
    "..BBBBBBBBB..","..B.......BB.","..B.......BB.",
    "..BBBBBBBBB..","..B.......BB.","..B.......BB.",
    "..BBBBBBBBB..",
  ], { B: "#7a3800" });
  for (let y = 170; y <= 220; y++) { px(g, 150, y, "#7a3800"); px(g, 151, y, "#7a3800"); }

  // ── LAYER 5: LARGE ETH DIAMOND (top-right) ────────────────────────────────
  drawPattern(g, 660, 50, [
    "............EEEEEEEEEEEEEE............",
    "...........EEEEEEEEEEEEEEEE...........",
    "..........EEEEEEEEEEEEEEEEEE..........",
    ".........EEEEEEEEEEEEEEEEEEEE.........",
    "........EEEEEEEEEEEEEEEEEEEEEE........",
    ".......EEEEEEEEEEEEEEEEEEEEEEEE.......",
    "......EEEEEEEEEEEEEEEEEEEEEEEEEE......",
    ".....EEEEEEEEEEEEEEEEEEEEEEEEEEEE.....",
    "....EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE....",
    "...EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE...",
    "..EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE..",
    ".EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE.",
    "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
    ".DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD.",
    "..DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD..",
    "...DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD...",
    "....DDDDDDDDDDDDDDDDDDDDDDDDDDDDDD....",
    ".....DDDDDDDDDDDDDDDDDDDDDDDDDDDD.....",
    "......DDDDDDDDDDDDDDDDDDDDDDDDDD......",
    ".......DDDDDDDDDDDDDDDDDDDDDDDD.......",
    "........DDDDDDDDDDDDDDDDDDDDDD........",
    ".........DDDDDDDDDDDDDDDDDDDD.........",
    "..........DDDDDDDDDDDDDDDDDD..........",
    "...........DDDDDDDDDDDDDDDD...........",
    "............DDDDDDDDDDDDDD............",
    ".............DDDDDDDDDDDD.............",
    "..............DDDDDDDDDD..............",
    "...............DDDDDDDD...............",
    "................DDDDDD................",
    ".................DDDD.................",
    "..................DD...................",
  ], { E: "#9945ff", D: "#7b68ee" });

  // ── LAYER 6: LARGE TRUMP FACE (center, 34w×26h) ───────────────────────────
  drawPattern(g, 290, 390, [
    "..HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH..",
    ".HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH",
    "HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH",
    "HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH",
    "HHSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSH",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    "SSS.BBBB.SSSSSSSSSSSSSSSS.BBBB.SSSSS",
    "SSSBBBBBBSSSSSSSSSSSSSSSSBBBBBBBSSSSS",
    "SSSB....BSSSSSSSSSSSSSSSSB....BBSSSSS",
    "SSSBBBBBBSSSSSSSSSSSSSSSSBBBBBBBSSSSS",
    "SSS.BBBB.SSSSSSSSSSSSSSSS.BBBB.SSSSS",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSSSSSS.NNNNNN.SSSSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSRRRRRRRRRRRSSSSSSSSSSSSSSS",
    "SSSSSSSSSSRRRRRRRRRRRRRSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSRRRRRRRRRRRSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    ".WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    ".WTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTW",
    "..TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT.",
    "...TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT..",
    "....TTTTTTTTTTTTTTTTTTTTTTTTTTTTT...",
    ".....TTTTTTTTTTTTTTTTTTTTTTTTTTT....",
    "......TTTTTTTTTTTTTTTTTTTTTTTTT.....",
  ], { H:"#f97316",S:"#fddcb0",B:"#111",N:"#cc9966",R:"#cc1111",W:"#f0f0f0",T:"#cc0000" });

  // ── LAYER 7: LARGE MUSK FACE (left side, 34w×26h) ─────────────────────────
  drawPattern(g, 30, 540, [
    "...DDDDDDDDDDDDDDDDDDDDDDDDDDDDDD...",
    "..DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD..",
    ".DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD.",
    "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
    "DDDSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSDDD",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    "SSS.EEEE.SSSSSSSSSSSSSSSS.EEEE.SSSSS",
    "SSSEEEEEESSSSSSSSSSSSSSSSEEEEEESSSSS",
    "SSSE....ESSSSSSSSSSSSSSSSSE....ESSSS",
    "SSSEEEEEESSSSSSSSSSSSSSSSEEEEEESSSSS",
    "SSS.EEEE.SSSSSSSSSSSSSSSS.EEEE.SSSSS",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSSSS.NNNNNNNNN.SSSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSMMMMMMMMMMSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSSMMMMMMMMMSSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSMMMMMMMMMMSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    ".BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.",
    ".BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.",
    "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
    "...BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB...",
    "....BBBBBBBBBBBBBBBBBBBBBBBBBBBB....",
    ".....BBBBBBBBBBBBBBBBBBBBBBBBBB.....",
  ], { D:"#2d2020",S:"#ffdfbf",E:"#111",N:"#cc9966",M:"#444",B:"#0a0a30" });

  // ── LAYER 8: LARGE CZ FACE (right side) ───────────────────────────────────
  drawPattern(g, 660, 560, [
    "....KKKKKKKKKKKKKKKKKKKKKKKKKKKK....",
    "...KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK...",
    "..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
    ".KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.",
    "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
    "KKKKSSSSSSSSSSSSSSSSSSSSSSSSSSSSKKKK",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    "SSS.EEEE.SSSSSSSSSSSSSSSS.EEEE.SSSSS",
    "SSSEEEEEESSSSSSSSSSSSSSSSEEEEEESSSS",
    "SSSE....ESSSSSSSSSSSSSSSSEE....ESSSS",
    "SSSEEEEEESSSSSSSSSSSSSSSSEEEEEESSSS",
    "SSS.EEEE.SSSSSSSSSSSSSSSS.EEEE.SSSSS",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSS.NNNNNNNNNNNN.SSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSSS.YYYYYYYYYYYYYY.SSSSSSSSSSSSS",
    "SSSSSSSS.YYYYYYYYYYYY.SSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    ".GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG.",
    ".GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG.",
    "..GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..",
    "...GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG...",
    "....GGGGGGGGGGGGGGGGGGGGGGGGGGGG....",
  ], { K:"#111",S:"#ffe0c8",E:"#111",N:"#cc9966",Y:"#f7c948",G:"#f3ba2f" });

  // ── LAYER 9: TEXT BANNERS ─────────────────────────────────────────────────
  drawPattern(g, 5, 5, ["BBB.TTT.CCC.","B.B.T...C...","BBB.T...C...","B...T...C...","B...T...CCC."],
    { B:"#f7931a",T:"#f7931a",C:"#f7931a" });
  drawPattern(g, 820, 5, ["EEE.TTT.HHH.","E...T...H.H.","EEE.T...HHH.","E...T...H.H.","EEE.T...H.H."],
    { E:"#9945ff",T:"#9945ff",H:"#9945ff" });
  drawPattern(g, 5, 505, ["DDD.OOO.GGG.EEE.","D.D.O.O.G...E...","D.D.O.O.GGG.EEE.","D.D.O.O.G.G.E...","DDD.OOO.GGG.EEE."],
    { D:"#c8922a",O:"#c8922a",G:"#c8922a",E:"#c8922a" });
  drawPattern(g, 505, 505, ["SSS.OOO.LLL.AAA.NNN.AAA.","S...O.O.L...A.A.N.N.A.A.","SSS.O.O.L...AAA.NNN.AAA.","..S.O.O.L...A.A.N.N.A.A.","SSS.OOO.LLL.A.A.N.N.A.A."],
    { S:"#9945ff",O:"#9945ff",L:"#14f195",A:"#14f195",N:"#14f195" });
  drawPattern(g, 330, 320, ["HHH.OOO.DDD.LLL.","H.H.O.O.D.D.L...","HHH.O.O.D.D.L...","H.H.O.O.D.D.L...","H.H.OOO.DDD.LLL."],
    { H:"#ffd700",O:"#ffd700",D:"#ffd700",L:"#ffd700" });
  drawPattern(g, 330, 820, ["W.W.AAA.GGG.M.M.III.","W.W.A.A.G...MMM..I..",".W..AAA.GGG.M.M..I..",".W..A.A.G.G.M.M..I..",".W..A.A.GGG.M.M.III."],
    { W:"#00ff88",A:"#00ff88",G:"#00ff88",M:"#00ff88",I:"#00ff88" });
  drawPattern(g, 500, 870, ["TTT.OOO...TTT.HHH.EEE...M.M.OOO.OOO.NNN.","T...O.O...T...H.H.E...MMM.M.O.O.O.O.N.N.","T...O.O...T...HHH.EEE.M.M.M.O.O.O.O.NNN.","T...O.O...T...H.H.E...M.M.M.O.O.O.O.N.N.","T...OOO...T...H.H.EEE.M.M.M.OOO.OOO.N.N."],
    { T:"#ffd700",O:"#ffd700",H:"#ffd700",E:"#ffd700",M:"#ffd700",N:"#ffd700" });
  drawPattern(g, 285, 665, ["M.M.AAA.GGG.AAA.","MMM.A.A.G...A.A.","M.M.AAA.GGG.AAA.","M.M.A.A.G.G.A.A.","M.M.A.A.GGG.A.A."],
    { M:"#cc0000",A:"#cc0000",G:"#cc0000" });
  drawPattern(g, 5, 985, ["NNN.FFF.AAA.","N.N.F...A.A.","NNN.FFF.AAA.","N.N.F...A.A.","N.N.F...A.A."],
    { N:"#ff4444",F:"#ff4444",A:"#ff4444" });
  drawPattern(g, 800, 985, ["DDD.Y.Y.OOO.R.R.","D.D..Y..O.O.RRR.","D.D..Y..O.O.R.R.","D.D..Y..O.O.R.R.","DDD..Y..OOO.R.R."],
    { D:"#44ff88",Y:"#44ff88",O:"#44ff88",R:"#44ff88" });

  // ── LAYER 10: PEPE FACES (scattered) ─────────────────────────────────────
  for (const [px2,py2] of [[600,250],[790,650],[200,750],[50,310],[850,450],[420,750]] as [number,number][])
    drawPattern(g, px2, py2, [
      "..GGGGGGGGGG..","GGGGGGGGGGGGGG","GG.GGGGGGGG.GG",
      "GWWGGGGGGWWGGG","GBBGGGGGGBBGGG","GGGGGGGGGGGGGG",
      ".GGNNNNNNNGG..","..GLLLLLLLGG..",
    ], { G:"#3d9a3d",W:"#f0f0f0",B:"#000",N:"#2d7a2d",L:"#1a5a1a" });

  // ── LAYER 11: BNB DIAMONDS (scattered) ───────────────────────────────────
  for (const [bx,by] of [[200,870],[350,50],[850,870],[450,290]] as [number,number][])
    drawPattern(g, bx, by, [
      "....YYYY....","...YYYYYY...","..YYYYYYYY..",
      ".YYYYYY.YYY.","YYYYYYY.YYYY","YYYYYYYYYYY.",
      ".YYYYYY.YYY.","..YYYYYYYY..","...YYYYYY...","....YYYY....",
    ], { Y:"#f3ba2f" });

  // ── LAYER 12: SOL LOGOS (scattered) ──────────────────────────────────────
  for (const [sx,sy] of [[500,285],[100,795],[750,280],[600,800]] as [number,number][])
    drawPattern(g, sx, sy, [
      "PPPPPPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPPPP..","...................",
      "GGGGGGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG....","...................",
      "PPPPPPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPPPP..",
    ], { P:"#9945ff",G:"#14f195" });

  // ── LAYER 13: RAINBOW SEPARATORS ─────────────────────────────────────────
  const rc2 = ["#ef4444","#f97316","#f59e0b","#84cc16","#22c55e","#06b6d4","#8b5cf6","#ec4899"];
  for (let x = 0; x < 1000; x++) {
    const ci = Math.floor(x / 125) % 8;
    for (let t = 0; t < 4; t++) { px(g, x, 496+t, rc2[ci]); px(g, x, 996+t, rc2[ci]); }
  }

  // ── LAYER 14: EXTRA TRUMP/MUSK/CZ CLOSE-UP PORTRAITS (larger, prominent) ─
  // Big Trump close-up (top-center)
  drawPattern(g, 400, 20, [
    "....HHHHHHHHHHHHHHHH....","...HHHHHHHHHHHHHHHHHH...",
    "..HHHHHHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHHHHHH",
    "HHHSSSSSSSSSSSSSSSSSSHHH","SSSSSSSSSSSSSSSSSSSSSSSS",
    "SS.BBBB.SSSSSSSSSBBBB.SS","SSBBBBBBSSSSSSSSBBBBBBBSS",
    "SSB....BSSSSSSSSB....BSSS","SSBBBBBBSSSSSSSSBBBBBBBSS",
    "SS.BBBB.SSSSSSSSSBBBB.SS","SSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSS.NNNNNN.SSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSSSRRRRRRRRRSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSS",
    ".WWWWWWWWWWWWWWWWWWWWWW",".WRTTTTTTTTTTTTTTTTTTTW",
    "..TTTTTTTTTTTTTTTTTTTT..","...TTTTTTTTTTTTTTTTTT...",
  ], { H:"#f97316",S:"#fddcb0",B:"#111",N:"#cc9966",R:"#cc1111",W:"#f0f0f0",T:"#cc0000" });

  // Big Musk (bottom-left)
  drawPattern(g, 20, 820, [
    "....DDDDDDDDDDDDDDDD....","...DDDDDDDDDDDDDDDDDD...",
    "..DDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDD",
    "DDSSSSSSSSSSSSSSSSSSSSDD","SSSSSSSSSSSSSSSSSSSSSSSS",
    "SS.EEEE.SSSSSSSSSEEEE.SS","SSEEEEEEESSSSSSSSEEEEEESSS",
    "SSE....ESSSSSSSSSSE....ESS","SSEEEEEEESSSSSSSSEEEEEESSS",
    "SS.EEEE.SSSSSSSSSEEEE.SS","SSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSS.NNNNNNN.SSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSSSMMMMMMMMMSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSS",
    ".BBBBBBBBBBBBBBBBBBBBBB",".BBBBBBBBBBBBBBBBBBBBBB",
    "..BBBBBBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBBBBBB...",
  ], { D:"#2d2020",S:"#ffdfbf",E:"#111",N:"#cc9966",M:"#444",B:"#0a0a30" });

  // Big CZ (bottom-right)
  drawPattern(g, 770, 820, [
    "....KKKKKKKKKKKKKKKK....","...KKKKKKKKKKKKKKKKKK...",
    "..KKKKKKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKKKKKK",
    "KKSSSSSSSSSSSSSSSSSSSSKK","SSSSSSSSSSSSSSSSSSSSSSSS",
    "SS.EEEE.SSSSSSSSSEEEE.SS","SSEEEEEEESSSSSSSSEEEEEESS",
    "SSE....ESSSSSSSSSSE....ESS","SSEEEEEEESSSSSSSSEEEEEESS",
    "SS.EEEE.SSSSSSSSSEEEE.SS","SSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSS.NNNNNNN.SSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSS",
    "SSSSSSS.YYYYYYYY.SSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSS",
    ".GGGGGGGGGGGGGGGGGGGGGG",".GGGGGGGGGGGGGGGGGGGGGG",
    "..GGGGGGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGGGGGG...",
  ], { K:"#111",S:"#ffe0c8",E:"#111",N:"#cc9966",Y:"#f7c948",G:"#f3ba2f" });
}


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
