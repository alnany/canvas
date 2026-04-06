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

  // ── ZONE BASE FILLS ──────────────────────────────────────────
  fillRect(g, 0,   0,   1000, 1000, "#0a0500");

  // ── BACKGROUND NOISE (dense, every 8px) ─────────────────────
  for (let ty = 0; ty < 1000; ty += 8)
    for (let tx = 0; tx < 1000; tx += 8) {
      const c = (tx * 7 + ty * 13) % 11;
      const base = c < 3 ? "#1a0900" : c < 5 ? "#000d30" : c < 7 ? "#001508" : c < 9 ? "#1a0500" : "#0a0010";
      px(g, tx, ty, base); px(g, tx+1, ty, base); px(g, tx, ty+1, base);
    }

  // ── CRYPTO LOGOS (random sizes/positions) ────────────────────
  drawPattern(g, 569, 93, ["..Y..",".YYY.","YYYYY",".YYY.","..Y.."], {"Y":"#f3ba2f"});
  drawPattern(g, 244, 377, ["..Y..",".YYY.","YYYYY",".YYY.","..Y.."], {"Y":"#f3ba2f"});
  drawPattern(g, 828, 583, ["DDDDD",".D.D.","DDDDD","D...D","DDDDD"], {"D":"#c2a633"});
  drawPattern(g, 908, 20, ["SSSSS","SSSSS","GGGGG","GGGGG","SSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 392, 423, ["..GGGGGG..","GGGGGGGGGG","GG.GG.GG.G","GG........","GGGGGGGGGG",".GNNNNNGG.","..GLLLLG..","...GGGG..."], {"G":"#3d9a3d","N":"#2d7a2d","L":"#1a5a1a"});
  drawPattern(g, 215, 385, ["YYYYY","YY...","YY...","YY...","YYYYY"], {"Y":"#ffd700"});
  drawPattern(g, 346, 770, ["DDDDD",".D.D.","DDDDD","D...D","DDDDD"], {"D":"#c2a633"});
  drawPattern(g, 510, 284, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 128, 703, ["...YYY...","..YYYYY..","YYYYYYYYY","YYY...YYY","Y.......Y","YYY...YYY","YYYYYYYYY","..YYYYY..","...YYY..."], {"Y":"#f3ba2f"});
  drawPattern(g, 541, 644, ["YYYYY","YY...","YY...","YY...","YYYYY"], {"Y":"#ffd700"});
  drawPattern(g, 94, 277, ["SSSSS","SSSSS","GGGGG","GGGGG","SSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 393, 409, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 442, 976, ["..W..","WWWWW","W.F.W","WWWWW","..F.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 869, 833, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 130, 33, ["BBBBB","B...B","BBBBB","B...B","BBBBB"], {"B":"#f7931a"});
  drawPattern(g, 726, 782, ["..GGGGGG..","GGGGGGGGGG","GG.GG.GG.G","GG........","GGGGGGGGGG",".GNNNNNGG.","..GLLLLG..","...GGGG..."], {"G":"#3d9a3d","N":"#2d7a2d","L":"#1a5a1a"});
  drawPattern(g, 601, 501, ["...WWW...","..WWWWW..","WWWWWWWWW","W..FFF..W","WWWWWWWWW","W..FFF..W","WWWWWWWWW",".WW.W.WW.","..FF.FF.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 74, 400, ["BBBBB","B...B","BBBBB","B...B","BBBBB"], {"B":"#f7931a"});
  drawPattern(g, 875, 479, ["YYYYY","YY...","YY...","YY...","YYYYY"], {"Y":"#ffd700"});
  drawPattern(g, 254, 801, ["..W..","WWWWW","W.F.W","WWWWW","..F.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 229, 158, ["..E..","EEEEE","..E..","EEEEE","..E.."], {"E":"#9945ff"});
  drawPattern(g, 534, 698, ["...E...","..EEE..","EEEEEEE","EEEEEEE",".EEEEE.","..EEE..","...E...","..EEE..","...E..."], {"E":"#9945ff"});
  drawPattern(g, 964, 845, ["..E..","EEEEE","..E..","EEEEE","..E.."], {"E":"#9945ff"});
  drawPattern(g, 87, 564, ["..W..","WWWWW","W.F.W","WWWWW","..F.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 1, 801, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 238, 583, ["...E...","..EEE..","EEEEEEE","EEEEEEE",".EEEEE.","..EEE..","...E...","..EEE..","...E..."], {"E":"#9945ff"});
  drawPattern(g, 660, 732, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 985, 131, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 540, 651, ["DDDDD",".D.D.","DDDDD","D...D","DDDDD"], {"D":"#c2a633"});
  drawPattern(g, 715, 782, ["..GGGGGG..","GGGGGGGGGG","GG.GG.GG.G","GG........","GGGGGGGGGG",".GNNNNNGG.","..GLLLLG..","...GGGG..."], {"G":"#3d9a3d","N":"#2d7a2d","L":"#1a5a1a"});
  drawPattern(g, 101, 72, ["..E..","EEEEE","..E..","EEEEE","..E.."], {"E":"#9945ff"});
  drawPattern(g, 537, 966, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 397, 267, ["SSSSS","SSSSS","GGGGG","GGGGG","SSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 809, 615, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 10, 550, ["BBBBB","B...B","BBBBB","B...B","BBBBB"], {"B":"#f7931a"});
  drawPattern(g, 471, 285, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 660, 859, ["..Y..",".YYY.","YYYYY",".YYY.","..Y.."], {"Y":"#f3ba2f"});
  drawPattern(g, 486, 538, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 560, 252, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 983, 421, ["BBBBB","B...B","BBBBB","B...B","BBBBB"], {"B":"#f7931a"});
  drawPattern(g, 56, 22, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 510, 906, ["SSSSS","SSSSS","GGGGG","GGGGG","SSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 83, 263, ["..GGGGGG..","GGGGGGGGGG","GG.GG.GG.G","GG........","GGGGGGGGGG",".GNNNNNGG.","..GLLLLG..","...GGGG..."], {"G":"#3d9a3d","N":"#2d7a2d","L":"#1a5a1a"});
  drawPattern(g, 683, 434, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 232, 504, ["...YYY...","..YYYYY..","YYYYYYYYY","YYY...YYY","Y.......Y","YYY...YYY","YYYYYYYYY","..YYYYY..","...YYY..."], {"Y":"#f3ba2f"});
  drawPattern(g, 712, 346, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 371, 698, ["..GGGGGG..","GGGGGGGGGG","GG.GG.GG.G","GG........","GGGGGGGGGG",".GNNNNNGG.","..GLLLLG..","...GGGG..."], {"G":"#3d9a3d","N":"#2d7a2d","L":"#1a5a1a"});
  drawPattern(g, 202, 6, ["GGGGG","G.G.G","GGGGG",".G.G.","GGGGG"], {"G":"#3d9a3d"});
  drawPattern(g, 756, 865, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 69, 210, ["YYYYY","YY...","YY...","YY...","YYYYY"], {"Y":"#ffd700"});
  drawPattern(g, 205, 319, ["...WWW...","..WWWWW..","WWWWWWWWW","W..FFF..W","WWWWWWWWW","W..FFF..W","WWWWWWWWW",".WW.W.WW.","..FF.FF.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 236, 476, ["SSSSS","SSSSS","GGGGG","GGGGG","SSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 271, 778, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 111, 974, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 624, 191, ["...WWW...","..WWWWW..","WWWWWWWWW","W..FFF..W","WWWWWWWWW","W..FFF..W","WWWWWWWWW",".WW.W.WW.","..FF.FF.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 496, 427, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 971, 609, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 944, 402, ["...E...","..EEE..","EEEEEEE","EEEEEEE",".EEEEE.","..EEE..","...E...","..EEE..","...E..."], {"E":"#9945ff"});
  drawPattern(g, 218, 24, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 425, 53, ["...E...","..EEE..","EEEEEEE","EEEEEEE",".EEEEE.","..EEE..","...E...","..EEE..","...E..."], {"E":"#9945ff"});
  drawPattern(g, 188, 402, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 919, 729, ["..W..","WWWWW","W.F.W","WWWWW","..F.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 750, 115, ["..Y..",".YYY.","YYYYY",".YYY.","..Y.."], {"Y":"#f3ba2f"});
  drawPattern(g, 953, 169, ["..BBBBBBBBBBB..","BBBBBBBBBBBBBBB","B.............B","B..BB..B..BB..B","B..BB..B..BB..B","BBBBBBBBBBBBBBB","B..BB..B..BB..B","B..BB..B..BB..B","B.............B","BBBBBBBBBBBBBBB","..BBBBBBBBBBB.."], {"B":"#f7931a"});
  drawPattern(g, 195, 189, ["..Y..",".YYY.","YYYYY",".YYY.","..Y.."], {"Y":"#f3ba2f"});
  drawPattern(g, 764, 478, ["YYYYY","YY...","YY...","YY...","YYYYY"], {"Y":"#ffd700"});
  drawPattern(g, 319, 680, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 859, 382, ["GGGGG","G.G.G","GGGGG",".G.G.","GGGGG"], {"G":"#3d9a3d"});
  drawPattern(g, 453, 173, ["..Y..",".YYY.","YYYYY",".YYY.","..Y.."], {"Y":"#f3ba2f"});
  drawPattern(g, 2, 80, ["..E..","EEEEE","..E..","EEEEE","..E.."], {"E":"#9945ff"});
  drawPattern(g, 82, 359, ["DDDDD",".D.D.","DDDDD","D...D","DDDDD"], {"D":"#c2a633"});
  drawPattern(g, 978, 906, ["..GGGGGG..","GGGGGGGGGG","GG.GG.GG.G","GG........","GGGGGGGGGG",".GNNNNNGG.","..GLLLLG..","...GGGG..."], {"G":"#3d9a3d","N":"#2d7a2d","L":"#1a5a1a"});
  drawPattern(g, 574, 777, ["..E..","EEEEE","..E..","EEEEE","..E.."], {"E":"#9945ff"});
  drawPattern(g, 389, 365, ["SSSSS","SSSSS","GGGGG","GGGGG","SSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 841, 823, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 89, 50, ["..GGGGGG..","GGGGGGGGGG","GG.GG.GG.G","GG........","GGGGGGGGGG",".GNNNNNGG.","..GLLLLG..","...GGGG..."], {"G":"#3d9a3d","N":"#2d7a2d","L":"#1a5a1a"});
  drawPattern(g, 200, 381, ["...WWW...","..WWWWW..","WWWWWWWWW","W..FFF..W","WWWWWWWWW","W..FFF..W","WWWWWWWWW",".WW.W.WW.","..FF.FF.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 197, 331, ["..W..","WWWWW","W.F.W","WWWWW","..F.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 755, 918, ["...YYY...","..YYYYY..","YYYYYYYYY","YYY...YYY","Y.......Y","YYY...YYY","YYYYYYYYY","..YYYYY..","...YYY..."], {"Y":"#f3ba2f"});
  drawPattern(g, 31, 646, ["...WWW...","..WWWWW..","WWWWWWWWW","W..FFF..W","WWWWWWWWW","W..FFF..W","WWWWWWWWW",".WW.W.WW.","..FF.FF.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 253, 831, ["..GGGGGG..","GGGGGGGGGG","GG.GG.GG.G","GG........","GGGGGGGGGG",".GNNNNNGG.","..GLLLLG..","...GGGG..."], {"G":"#3d9a3d","N":"#2d7a2d","L":"#1a5a1a"});
  drawPattern(g, 41, 384, ["GGGGG","G.G.G","GGGGG",".G.G.","GGGGG"], {"G":"#3d9a3d"});
  drawPattern(g, 475, 64, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 263, 199, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 920, 620, ["..BBBBBBBBBBB..","BBBBBBBBBBBBBBB","B.............B","B..BB..B..BB..B","B..BB..B..BB..B","BBBBBBBBBBBBBBB","B..BB..B..BB..B","B..BB..B..BB..B","B.............B","BBBBBBBBBBBBBBB","..BBBBBBBBBBB.."], {"B":"#f7931a"});
  drawPattern(g, 371, 278, ["..Y..",".YYY.","YYYYY",".YYY.","..Y.."], {"Y":"#f3ba2f"});
  drawPattern(g, 980, 976, ["..Y..",".YYY.","YYYYY",".YYY.","..Y.."], {"Y":"#f3ba2f"});
  drawPattern(g, 268, 764, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 946, 282, ["..Y..",".YYY.","YYYYY",".YYY.","..Y.."], {"Y":"#f3ba2f"});
  drawPattern(g, 3, 738, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 24, 845, ["..BBBBBBBBBBB..","BBBBBBBBBBBBBBB","B.............B","B..BB..B..BB..B","B..BB..B..BB..B","BBBBBBBBBBBBBBB","B..BB..B..BB..B","B..BB..B..BB..B","B.............B","BBBBBBBBBBBBBBB","..BBBBBBBBBBB.."], {"B":"#f7931a"});
  drawPattern(g, 109, 486, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 976, 794, ["..W..","WWWWW","W.F.W","WWWWW","..F.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 808, 257, ["GGGGG","G.G.G","GGGGG",".G.G.","GGGGG"], {"G":"#3d9a3d"});
  drawPattern(g, 834, 505, ["..GGGGGG..","GGGGGGGGGG","GG.GG.GG.G","GG........","GGGGGGGGGG",".GNNNNNGG.","..GLLLLG..","...GGGG..."], {"G":"#3d9a3d","N":"#2d7a2d","L":"#1a5a1a"});
  drawPattern(g, 950, 508, ["...E...","..EEE..","EEEEEEE","EEEEEEE",".EEEEE.","..EEE..","...E...","..EEE..","...E..."], {"E":"#9945ff"});
  drawPattern(g, 8, 821, ["....EEE....","..EEEEEEE..","EEEEEEEEEEE","EEEEEEEEEEE",".EEEEEEEEE.",".EEEEEEEEE.","..EEEEEEE..","...EEEEE...","....EEE....","...EEEEE...","..EEEEEEE..","...EEEEE...","....EEE...."], {"E":"#9945ff"});
  drawPattern(g, 842, 708, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 621, 241, ["...E...","..EEE..","EEEEEEE","EEEEEEE",".EEEEE.","..EEE..","...E...","..EEE..","...E..."], {"E":"#9945ff"});
  drawPattern(g, 881, 327, ["..Y..",".YYY.","YYYYY",".YYY.","..Y.."], {"Y":"#f3ba2f"});
  drawPattern(g, 370, 802, ["..W..","WWWWW","W.F.W","WWWWW","..F.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 524, 202, ["..BBBBBBBBBBB..","BBBBBBBBBBBBBBB","B.............B","B..BB..B..BB..B","B..BB..B..BB..B","BBBBBBBBBBBBBBB","B..BB..B..BB..B","B..BB..B..BB..B","B.............B","BBBBBBBBBBBBBBB","..BBBBBBBBBBB.."], {"B":"#f7931a"});
  drawPattern(g, 770, 163, ["GGGGG","G.G.G","GGGGG",".G.G.","GGGGG"], {"G":"#3d9a3d"});
  drawPattern(g, 417, 66, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 493, 565, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 164, 436, ["..Y..",".YYY.","YYYYY",".YYY.","..Y.."], {"Y":"#f3ba2f"});
  drawPattern(g, 73, 271, ["..E..","EEEEE","..E..","EEEEE","..E.."], {"E":"#9945ff"});
  drawPattern(g, 213, 98, ["..BBBBBBBBBBB..","BBBBBBBBBBBBBBB","B.............B","B..BB..B..BB..B","B..BB..B..BB..B","BBBBBBBBBBBBBBB","B..BB..B..BB..B","B..BB..B..BB..B","B.............B","BBBBBBBBBBBBBBB","..BBBBBBBBBBB.."], {"B":"#f7931a"});
  drawPattern(g, 510, 726, ["..GGGGGG..","GGGGGGGGGG","GG.GG.GG.G","GG........","GGGGGGGGGG",".GNNNNNGG.","..GLLLLG..","...GGGG..."], {"G":"#3d9a3d","N":"#2d7a2d","L":"#1a5a1a"});
  drawPattern(g, 177, 239, ["..W..","WWWWW","W.F.W","WWWWW","..F.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 426, 471, ["...E...","..EEE..","EEEEEEE","EEEEEEE",".EEEEE.","..EEE..","...E...","..EEE..","...E..."], {"E":"#9945ff"});
  drawPattern(g, 765, 551, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 798, 861, ["..E..","EEEEE","..E..","EEEEE","..E.."], {"E":"#9945ff"});
  drawPattern(g, 300, 286, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 381, 260, ["DDDDD",".D.D.","DDDDD","D...D","DDDDD"], {"D":"#c2a633"});
  drawPattern(g, 203, 449, ["DDDDD",".D.D.","DDDDD","D...D","DDDDD"], {"D":"#c2a633"});
  drawPattern(g, 190, 251, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 157, 288, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 334, 66, ["SSSSS","SSSSS","GGGGG","GGGGG","SSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 257, 251, ["GGGGG","G.G.G","GGGGG",".G.G.","GGGGG"], {"G":"#3d9a3d"});
  drawPattern(g, 538, 236, ["YYYYY","YY...","YY...","YY...","YYYYY"], {"Y":"#ffd700"});
  drawPattern(g, 669, 475, ["..E..","EEEEE","..E..","EEEEE","..E.."], {"E":"#9945ff"});
  drawPattern(g, 104, 4, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 904, 838, ["...WWW...","..WWWWW..","WWWWWWWWW","W..FFF..W","WWWWWWWWW","W..FFF..W","WWWWWWWWW",".WW.W.WW.","..FF.FF.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 860, 459, ["SSSSSSSSSS","SSSSSSSSSS","..........","GGGGGGGGGG","GGGGGGGGGG","..........","SSSSSSSSSS","SSSSSSSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 41, 897, ["...YYY...","..YYYYY..","YYYYYYYYY","YYY...YYY","Y.......Y","YYY...YYY","YYYYYYYYY","..YYYYY..","...YYY..."], {"Y":"#f3ba2f"});
  drawPattern(g, 238, 122, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 194, 614, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 952, 76, ["SSSSS","SSSSS","GGGGG","GGGGG","SSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 524, 886, ["...YYY...","..YYYYY..","YYYYYYYYY","YYY...YYY","Y.......Y","YYY...YYY","YYYYYYYYY","..YYYYY..","...YYY..."], {"Y":"#f3ba2f"});
  drawPattern(g, 459, 617, ["....EEE....","..EEEEEEE..","EEEEEEEEEEE","EEEEEEEEEEE",".EEEEEEEEE.",".EEEEEEEEE.","..EEEEEEE..","...EEEEE...","....EEE....","...EEEEE...","..EEEEEEE..","...EEEEE...","....EEE...."], {"E":"#9945ff"});
  drawPattern(g, 793, 796, ["DDDDD",".D.D.","DDDDD","D...D","DDDDD"], {"D":"#c2a633"});
  drawPattern(g, 108, 652, ["BBBBB","B...B","BBBBB","B...B","BBBBB"], {"B":"#f7931a"});
  drawPattern(g, 222, 38, ["...YYY...","..YYYYY..","YYYYYYYYY","YYY...YYY","Y.......Y","YYY...YYY","YYYYYYYYY","..YYYYY..","...YYY..."], {"Y":"#f3ba2f"});
  drawPattern(g, 348, 144, ["...YYY...","..YYYYY..","YYYYYYYYY","YYY...YYY","Y.......Y","YYY...YYY","YYYYYYYYY","..YYYYY..","...YYY..."], {"Y":"#f3ba2f"});
  drawPattern(g, 208, 261, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 613, 749, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 834, 11, ["SSSSS","SSSSS","GGGGG","GGGGG","SSSSS"], {"S":"#9945ff","G":"#14f195"});
  drawPattern(g, 418, 694, ["..Y..",".YYY.","YYYYY",".YYY.","..Y.."], {"Y":"#f3ba2f"});
  drawPattern(g, 189, 635, ["...YYY...","..YYYYY..","YYYYYYYYY","YYY...YYY","Y.......Y","YYY...YYY","YYYYYYYYY","..YYYYY..","...YYY..."], {"Y":"#f3ba2f"});
  drawPattern(g, 79, 208, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 814, 507, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});
  drawPattern(g, 64, 417, ["...WWW...","..WWWWW..","WWWWWWWWW","W..FFF..W","WWWWWWWWW","W..FFF..W","WWWWWWWWW",".WW.W.WW.","..FF.FF.."], {"W":"#ddd","F":"#ff6600"});
  drawPattern(g, 814, 404, ["..E..","EEEEE","..E..","EEEEE","..E.."], {"E":"#9945ff"});
  drawPattern(g, 654, 546, ["...E...","..EEE..","EEEEEEE","EEEEEEE",".EEEEE.","..EEE..","...E...","..EEE..","...E..."], {"E":"#9945ff"});
  drawPattern(g, 668, 167, ["..BBBBBBBBBBB..","BBBBBBBBBBBBBBB","B.............B","B..BB..B..BB..B","B..BB..B..BB..B","BBBBBBBBBBBBBBB","B..BB..B..BB..B","B..BB..B..BB..B","B.............B","BBBBBBBBBBBBBBB","..BBBBBBBBBBB.."], {"B":"#f7931a"});
  drawPattern(g, 712, 277, ["GGGGG","G.G.G","GGGGG",".G.G.","GGGGG"], {"G":"#3d9a3d"});
  drawPattern(g, 290, 683, ["..GGGGGG..","GGGGGGGGGG","GG.GG.GG.G","GG........","GGGGGGGGGG",".GNNNNNGG.","..GLLLLG..","...GGGG..."], {"G":"#3d9a3d","N":"#2d7a2d","L":"#1a5a1a"});
  drawPattern(g, 427, 976, ["..DDD....","DDDDDDDD.","D.......D","D..DDD..D","D.......D","D..N.N..D","DDDDDDDD.",".D.LLLLL.","..DDDDD.."], {"D":"#c2a633","N":"#333","L":"#c2a633"});
  drawPattern(g, 319, 763, [".BBBBBBB.","BBBBBBBBB","B.......B","B.BBBBB.B","BBBBBBBBB","B.BBBBB.B","B.......B","BBBBBBBBB",".BBBBBBB."], {"B":"#f7931a"});

  // ── PORTRAITS: TRUMP / MUSK / CZ (random sizes/positions) ────
  drawPattern(g, 154, 404, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 74, 840, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 374, 596, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 519, 219, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 444, 428, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 92, 564, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 846, 579, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 228, 645, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 970, 63, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 406, 50, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 47, 570, ["......HHHHHHHHHHHHHHHHHHHH......","....HHHHHHHHHHHHHHHHHHHHHHHH....","..HHHHHHHHHHHHHHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSH.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSSB.....BSSSSSSSSSSB.....BSSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSS.RRRRRRRRRRR.SSSSSSSSS","....WWWWWWWWWWWWWWWWWWWWWWWWWW..","....TTTTTTTTTTTTTTTTTTTTTTTTTTTT","......TTTTTTTTTTTTTTTTTTTTTTTT..",".......TTTTTTTTTTTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 296, 429, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 120, 584, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 835, 698, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 595, 584, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 381, 99, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 64, 577, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 210, 508, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 437, 795, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 599, 945, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 306, 254, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 715, 798, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 588, 307, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 896, 351, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 294, 623, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 120, 524, ["......HHHHHHHHHHHHHHHHHHHH......","....HHHHHHHHHHHHHHHHHHHHHHHH....","..HHHHHHHHHHHHHHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSH.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSSB.....BSSSSSSSSSSB.....BSSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSS.RRRRRRRRRRR.SSSSSSSSS","....WWWWWWWWWWWWWWWWWWWWWWWWWW..","....TTTTTTTTTTTTTTTTTTTTTTTTTTTT","......TTTTTTTTTTTTTTTTTTTTTTTT..",".......TTTTTTTTTTTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 775, 350, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 500, 431, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 684, 79, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 586, 808, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 321, 348, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 608, 508, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 467, 70, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 967, 276, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 680, 66, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 718, 317, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 697, 841, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 733, 395, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 355, 23, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 363, 172, ["......HHHHHHHHHHHHHHHHHHHH......","....HHHHHHHHHHHHHHHHHHHHHHHH....","..HHHHHHHHHHHHHHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSH.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSSB.....BSSSSSSSSSSB.....BSSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSS.RRRRRRRRRRR.SSSSSSSSS","....WWWWWWWWWWWWWWWWWWWWWWWWWW..","....TTTTTTTTTTTTTTTTTTTTTTTTTTTT","......TTTTTTTTTTTTTTTTTTTTTTTT..",".......TTTTTTTTTTTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 505, 60, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 294, 132, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 407, 400, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 508, 82, ["......HHHHHHHHHHHHHHHHHHHH......","....HHHHHHHHHHHHHHHHHHHHHHHH....","..HHHHHHHHHHHHHHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSH.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSSB.....BSSSSSSSSSSB.....BSSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSS.RRRRRRRRRRR.SSSSSSSSS","....WWWWWWWWWWWWWWWWWWWWWWWWWW..","....TTTTTTTTTTTTTTTTTTTTTTTTTTTT","......TTTTTTTTTTTTTTTTTTTTTTTT..",".......TTTTTTTTTTTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 411, 562, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 140, 838, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 563, 285, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 367, 699, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 980, 236, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 180, 154, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 238, 12, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 603, 186, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 4, 149, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 378, 624, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 975, 128, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 527, 973, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 692, 757, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 921, 891, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 895, 696, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 401, 407, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 106, 493, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 63, 195, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 213, 451, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 348, 615, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 0, 580, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 103, 971, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 26, 72, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 628, 385, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 258, 978, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 372, 485, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 869, 499, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 477, 491, ["......HHHHHHHHHHHHHHHHHHHH......","....HHHHHHHHHHHHHHHHHHHHHHHH....","..HHHHHHHHHHHHHHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSH.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSSB.....BSSSSSSSSSSB.....BSSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSS.RRRRRRRRRRR.SSSSSSSSS","....WWWWWWWWWWWWWWWWWWWWWWWWWW..","....TTTTTTTTTTTTTTTTTTTTTTTTTTTT","......TTTTTTTTTTTTTTTTTTTTTTTT..",".......TTTTTTTTTTTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 87, 147, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 350, 758, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 848, 708, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 23, 210, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 540, 370, ["......HHHHHHHHHHHHHHHHHHHH......","....HHHHHHHHHHHHHHHHHHHHHHHH....","..HHHHHHHHHHHHHHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSH.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSSB.....BSSSSSSSSSSB.....BSSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSS.RRRRRRRRRRR.SSSSSSSSS","....WWWWWWWWWWWWWWWWWWWWWWWWWW..","....TTTTTTTTTTTTTTTTTTTTTTTTTTTT","......TTTTTTTTTTTTTTTTTTTTTTTT..",".......TTTTTTTTTTTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 556, 936, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 540, 305, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 884, 93, ["......HHHHHHHHHHHHHHHHHHHH......","....HHHHHHHHHHHHHHHHHHHHHHHH....","..HHHHHHHHHHHHHHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSH.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSSB.....BSSSSSSSSSSB.....BSSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSS.RRRRRRRRRRR.SSSSSSSSS","....WWWWWWWWWWWWWWWWWWWWWWWWWW..","....TTTTTTTTTTTTTTTTTTTTTTTTTTTT","......TTTTTTTTTTTTTTTTTTTTTTTT..",".......TTTTTTTTTTTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 267, 530, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 171, 364, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 545, 554, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 337, 651, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 830, 807, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 873, 199, ["......HHHHHHHHHHHHHHHHHHHH......","....HHHHHHHHHHHHHHHHHHHHHHHH....","..HHHHHHHHHHHHHHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSH.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSSB.....BSSSSSSSSSSB.....BSSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSS.RRRRRRRRRRR.SSSSSSSSS","....WWWWWWWWWWWWWWWWWWWWWWWWWW..","....TTTTTTTTTTTTTTTTTTTTTTTTTTTT","......TTTTTTTTTTTTTTTTTTTTTTTT..",".......TTTTTTTTTTTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 837, 410, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 232, 204, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 364, 748, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 28, 809, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 265, 198, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 979, 352, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 959, 740, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 977, 373, ["......HHHHHHHHHHHHHHHHHHHH......","....HHHHHHHHHHHHHHHHHHHHHHHH....","..HHHHHHHHHHHHHHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSH.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSSB.....BSSSSSSSSSSB.....BSSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSS.RRRRRRRRRRR.SSSSSSSSS","....WWWWWWWWWWWWWWWWWWWWWWWWWW..","....TTTTTTTTTTTTTTTTTTTTTTTTTTTT","......TTTTTTTTTTTTTTTTTTTTTTTT..",".......TTTTTTTTTTTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 104, 232, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 345, 209, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 921, 624, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 490, 931, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 818, 658, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 676, 122, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 801, 728, ["......HHHHHHHHHHHHHHHHHHHH......","....HHHHHHHHHHHHHHHHHHHHHHHH....","..HHHHHHHHHHHHHHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSH.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSSB.....BSSSSSSSSSSB.....BSSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSS.RRRRRRRRRRR.SSSSSSSSS","....WWWWWWWWWWWWWWWWWWWWWWWWWW..","....TTTTTTTTTTTTTTTTTTTTTTTTTTTT","......TTTTTTTTTTTTTTTTTTTTTTTT..",".......TTTTTTTTTTTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 489, 910, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 808, 651, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 820, 968, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 405, 474, ["......HHHHHHHHHHHHHHHHHHHH......","....HHHHHHHHHHHHHHHHHHHHHHHH....","..HHHHHHHHHHHHHHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSH.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSSB.....BSSSSSSSSSSB.....BSSSS","SSSSBBBBBBBSSSSSSSSSSSBBBBBBBSSSS","SSSS.BBBBB.SSSSSSSSSS.BBBBB.SSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSS.RRRRRRRRRRR.SSSSSSSSS","....WWWWWWWWWWWWWWWWWWWWWWWWWW..","....TTTTTTTTTTTTTTTTTTTTTTTTTTTT","......TTTTTTTTTTTTTTTTTTTTTTTT..",".......TTTTTTTTTTTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 969, 86, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 174, 130, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 604, 926, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 671, 149, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 610, 485, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 358, 159, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 134, 21, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 743, 665, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 767, 956, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 892, 199, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 216, 28, ["....HHHHHHHHHHHH....","..HHHHHHHHHHHHHHHH..","HHHHHHHHHHHHHHHHHHHH","HSSSSSSSSSSSSSSSSSH.","SSS.BBBB.SS.BBBB.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSS.RRRRRRRR.SSSS","SSSSRRRRRRRRRRRRRSS.","..WWWWWWWWWWWWWWWW..","..TTTTTTTTTTTTTTTTT.","...TTTTTTTTTTTTTTT..","....TTTTTTTTTTTTT..."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 299, 513, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 600, 333, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 429, 854, ["..HHHHHHHH..","HHHHHHHHHHHH","HSSSSSSSSSH.","SS.BB..BB.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSSRRRRRRSSS",".WWWWWWWWWW.",".TTTTTTTTTT.","..TTTTTTTT.."], {"H":"#f97316","S":"#fddcb0","B":"#111","N":"#bb8844","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 931, 757, ["HHHHHHHH","SSSSSSSS","S.BB.BSS","SSSSSSSS","WRRRRRWW","TTTTTTTT"], {"H":"#f97316","S":"#fddcb0","B":"#111","W":"#f0f0f0","R":"#cc0000","T":"#cc0000"});
  drawPattern(g, 469, 678, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 925, 529, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 939, 899, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 544, 155, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 19, 893, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 187, 623, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 818, 153, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 484, 633, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 569, 63, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 530, 543, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 803, 795, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 573, 58, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 283, 43, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 519, 463, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 778, 915, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 453, 333, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 517, 620, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 709, 283, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 546, 826, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 964, 253, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 897, 897, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 265, 944, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 965, 207, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 140, 426, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 452, 323, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 246, 438, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 685, 310, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 918, 795, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 733, 658, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 146, 259, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 478, 224, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 96, 407, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 166, 683, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 165, 723, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 527, 413, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 200, 365, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 739, 374, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 567, 469, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 18, 393, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 638, 302, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 65, 115, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 807, 234, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 107, 86, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 40, 927, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 276, 773, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 432, 869, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 838, 968, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 152, 549, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 584, 506, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 91, 285, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 704, 187, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 74, 275, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 649, 90, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 85, 622, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 68, 270, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 464, 11, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 566, 427, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 274, 636, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 539, 726, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 112, 165, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 185, 206, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 643, 312, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 210, 296, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 688, 182, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 822, 18, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 37, 15, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 517, 564, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 526, 486, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 457, 108, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 665, 442, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 559, 854, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 518, 315, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 235, 350, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 903, 723, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 143, 414, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 55, 857, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 72, 640, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 261, 441, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 86, 681, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 891, 518, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 288, 613, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 300, 46, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 161, 275, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 269, 372, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 560, 331, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 903, 316, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 187, 1, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 85, 486, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 671, 205, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 794, 5, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 836, 91, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 600, 42, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 306, 311, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 86, 599, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 873, 768, ["......DDDDDDDDDDDDDDDDDDDD......","....DDDDDDDDDDDDDDDDDDDDDDDD....","..DDDDDDDDDDDDDDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.MMMMMMM.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....BBBBBBBBBBBBBBBBBBBBBBBBBB..","....BBBBBBBBBBBBBBBBBBBBBBBBBBBB","......BBBBBBBBBBBBBBBBBBBBBBBB..","......BBBBBBBBBBBBBBBBBBBBBBBB...",".......BBBBBBBBBBBBBBBBBBBBBB..."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 914, 733, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 610, 398, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 737, 506, ["....DDDDDDDDDDDD....","..DDDDDDDDDDDDDDDD..","DDDDDDDDDDDDDDDDDDDD","DSSSSSSSSSSSSSSSSSD.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.MMMM.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..BBBBBBBBBBBBBBBB..","..BBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBB...","....BBBBBBBBBBBB...."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 741, 633, ["DDDDDDDD","SSSSSSSS","S.EE.ESS","SSSSSSSS","BBBBBBBB","BBBBBBBB"], {"D":"#2d2020","S":"#ffdfbf","E":"#111","B":"#0a0a30"});
  drawPattern(g, 44, 844, ["..DDDDDDDD..","DDDDDDDDDDDD","DSSSSSSSSSD.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.MMMM.SSS",".BBBBBBBBBB.",".BBBBBBBBBB.","..BBBBBBBB.."], {"D":"#2d2020","S":"#ffdfbf","E":"#111","N":"#bb8844","M":"#555","B":"#0a0a30"});
  drawPattern(g, 913, 525, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 751, 717, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 142, 931, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 516, 582, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 823, 16, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 598, 817, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 699, 979, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 235, 87, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 136, 652, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 107, 385, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 571, 51, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 641, 544, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 501, 270, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 816, 71, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 515, 919, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 675, 538, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 754, 485, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 76, 866, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 746, 774, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 757, 665, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 505, 865, ["......KKKKKKKKKKKKKKKKKKKK......","....KKKKKKKKKKKKKKKKKKKKKKKK....","..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSSSSSSSSSSSSSK.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.YYYYYYY.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....GGGGGGGGGGGGGGGGGGGGGGGGGG..","....GGGGGGGGGGGGGGGGGGGGGGGGGGGG","......GGGGGGGGGGGGGGGGGGGGGGGG..","......GGGGGGGGGGGGGGGGGGGGGGGG...",".......GGGGGGGGGGGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 490, 932, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 785, 47, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 658, 203, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 150, 339, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 761, 709, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 581, 136, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 62, 497, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 688, 101, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 691, 501, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 528, 292, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 477, 785, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 915, 562, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 87, 958, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 296, 469, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 518, 460, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 396, 214, ["......KKKKKKKKKKKKKKKKKKKK......","....KKKKKKKKKKKKKKKKKKKKKKKK....","..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSSSSSSSSSSSSSK.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.YYYYYYY.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....GGGGGGGGGGGGGGGGGGGGGGGGGG..","....GGGGGGGGGGGGGGGGGGGGGGGGGGGG","......GGGGGGGGGGGGGGGGGGGGGGGG..","......GGGGGGGGGGGGGGGGGGGGGGGG...",".......GGGGGGGGGGGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 952, 215, ["......KKKKKKKKKKKKKKKKKKKK......","....KKKKKKKKKKKKKKKKKKKKKKKK....","..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSSSSSSSSSSSSSK.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.YYYYYYY.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....GGGGGGGGGGGGGGGGGGGGGGGGGG..","....GGGGGGGGGGGGGGGGGGGGGGGGGGGG","......GGGGGGGGGGGGGGGGGGGGGGGG..","......GGGGGGGGGGGGGGGGGGGGGGGG...",".......GGGGGGGGGGGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 92, 145, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 268, 975, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 617, 839, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 286, 908, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 373, 236, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 897, 497, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 162, 3, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 697, 461, ["......KKKKKKKKKKKKKKKKKKKK......","....KKKKKKKKKKKKKKKKKKKKKKKK....","..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSSSSSSSSSSSSSK.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.YYYYYYY.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....GGGGGGGGGGGGGGGGGGGGGGGGGG..","....GGGGGGGGGGGGGGGGGGGGGGGGGGGG","......GGGGGGGGGGGGGGGGGGGGGGGG..","......GGGGGGGGGGGGGGGGGGGGGGGG...",".......GGGGGGGGGGGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 744, 144, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 385, 323, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 339, 1, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 346, 859, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 962, 948, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 12, 923, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 259, 381, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 399, 890, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 369, 947, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 281, 874, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 104, 52, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 292, 650, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 255, 272, ["......KKKKKKKKKKKKKKKKKKKK......","....KKKKKKKKKKKKKKKKKKKKKKKK....","..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSSSSSSSSSSSSSK.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.YYYYYYY.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....GGGGGGGGGGGGGGGGGGGGGGGGGG..","....GGGGGGGGGGGGGGGGGGGGGGGGGGGG","......GGGGGGGGGGGGGGGGGGGGGGGG..","......GGGGGGGGGGGGGGGGGGGGGGGG...",".......GGGGGGGGGGGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 323, 194, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 803, 979, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 29, 831, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 409, 935, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 567, 562, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 82, 50, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 420, 461, ["......KKKKKKKKKKKKKKKKKKKK......","....KKKKKKKKKKKKKKKKKKKKKKKK....","..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSSSSSSSSSSSSSK.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.YYYYYYY.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....GGGGGGGGGGGGGGGGGGGGGGGGGG..","....GGGGGGGGGGGGGGGGGGGGGGGGGGGG","......GGGGGGGGGGGGGGGGGGGGGGGG..","......GGGGGGGGGGGGGGGGGGGGGGGG...",".......GGGGGGGGGGGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 141, 659, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 497, 50, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 563, 130, ["......KKKKKKKKKKKKKKKKKKKK......","....KKKKKKKKKKKKKKKKKKKKKKKK....","..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSSSSSSSSSSSSSK.","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","SSSS.EEEEE.SSSSSSSSSS.EEEEE.SSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSEEEEEEEESSSSSSSSSSEEEEEEESSSS","SSSSSSSSSSSS.NNNNNNN.SSSSSSSSSSS","SSSSSSSSSSSS.YYYYYYY.SSSSSSSSSSS","SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS","....GGGGGGGGGGGGGGGGGGGGGGGGGG..","....GGGGGGGGGGGGGGGGGGGGGGGGGGGG","......GGGGGGGGGGGGGGGGGGGGGGGG..","......GGGGGGGGGGGGGGGGGGGGGGGG...",".......GGGGGGGGGGGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 424, 351, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 261, 756, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 668, 266, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 244, 308, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 684, 403, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 658, 165, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 512, 927, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});
  drawPattern(g, 563, 225, ["....KKKKKKKKKKKK....","..KKKKKKKKKKKKKKKK..","KKKKKKKKKKKKKKKKKKKK","KSSSSSSSSSSSSSSSSSK.","SSS.EEEE.SS.EEEE.SSS","SSSSSSSSSSSSSSSSSSSS","SSSSSSSS.NNNN.SSSSSS","SSSSSSSS.YYYY.SSSSSS","SSSSSSSSSSSSSSSSSSSS","..GGGGGGGGGGGGGGGG..","..GGGGGGGGGGGGGGGG..","...GGGGGGGGGGGGGG...","....GGGGGGGGGGGG...."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 340, 777, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 142, 560, ["..KKKKKKKK..","KKKKKKKKKKKK","KSSSSSSSSSK.","SS.EE..EE.SS","SSSSSSSSSSSS","SSS.NNNN.SSS","SSS.YYYY.SSS",".GGGGGGGGGG.",".GGGGGGGGGG.","..GGGGGGGG.."], {"K":"#111","S":"#ffe0c8","E":"#111","N":"#bb8844","Y":"#f7c948","G":"#f3ba2f"});
  drawPattern(g, 92, 178, ["KKKKKKKK","SSSSSSSS","S.EE.ESS","SSSSSSSS","GGGGGGGG","GGGGGGGG"], {"K":"#111","S":"#ffe0c8","E":"#111","G":"#f3ba2f"});

  // ── TEXT STAMPS (scattered) ─────────────────────────────────
  drawPattern(g, 424, 426, ["PPP.U.U.MMM.PPP","PPP.U.U.M.M.PPP","P...UUU.M.M.P.."], {"P":"#00ff88","U":"#00ff88","M":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 884, 785, ["H.H.OOO.DD..L..","HHH.O.O.D.D.L..","H.H.OOO.DD..LLL"], {"H":"#ffd700","O":"#ffd700","D":"#ffd700","L":"#ffd700","$":"#ffd700","!":"#ffd700"});
  drawPattern(g, 659, 201, ["PPP.U.U.MMM.PPP","PPP.U.U.M.M.PPP","P...UUU.M.M.P.."], {"P":"#00ff88","U":"#00ff88","M":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 745, 414, ["DD..U.U.MMM.PPP","D.D.U.U.M.M.PPP","DD..UUU.M.M.P.."], {"D":"#ff4444","U":"#ff4444","M":"#ff4444","P":"#ff4444","$":"#ff4444","!":"#ff4444"});
  drawPattern(g, 964, 6, ["DD..OOO.GGG.EEE","D.D.O.O.G.G.EE.","DD..OOO.GGG.EEE"], {"D":"#c2a633","O":"#c2a633","G":"#c2a633","E":"#c2a633","$":"#c2a633","!":"#c2a633"});
  drawPattern(g, 923, 160, ["GGG.GGG","G.G.G.G","GGG.GGG"], {"G":"#ffd700","$":"#ffd700","!":"#ffd700"});
  drawPattern(g, 116, 840, ["GGG.GGG","G.G.G.G","GGG.GGG"], {"G":"#ffd700","$":"#ffd700","!":"#ffd700"});
  drawPattern(g, 415, 591, ["MMM.OOO.OOO.N.N","M.M.O.O.O.O.NNN","M.M.OOO.OOO.N.N"], {"M":"#ffd700","O":"#ffd700","N":"#ffd700","$":"#ffd700","!":"#ffd700"});
  drawPattern(g, 471, 791, ["PPP.U.U.MMM.PPP","PPP.U.U.M.M.PPP","P...UUU.M.M.P.."], {"P":"#00ff88","U":"#00ff88","M":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 133, 15, ["SSS.OOO.L..","SSS.O.O.L..","SSS.OOO.LLL"], {"S":"#14f195","O":"#14f195","L":"#14f195","$":"#14f195","!":"#14f195"});
  drawPattern(g, 564, 145, ["W.W..A..GGG.MMM.III","W.W.AAA.G.G.M.M..I.","WWW.A.A.GGG.M.M.III"], {"W":"#00ff88","A":"#00ff88","G":"#00ff88","M":"#00ff88","I":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 91, 586, ["DD..U.U.MMM.PPP","D.D.U.U.M.M.PPP","DD..UUU.M.M.P.."], {"D":"#ff4444","U":"#ff4444","M":"#ff4444","P":"#ff4444","$":"#ff4444","!":"#ff4444"});
  drawPattern(g, 754, 516, ["PPP.U.U.MMM.PPP","PPP.U.U.M.M.PPP","P...UUU.M.M.P.."], {"P":"#00ff88","U":"#00ff88","M":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 149, 356, ["SSS.OOO.L..","SSS.O.O.L..","SSS.OOO.LLL"], {"S":"#14f195","O":"#14f195","L":"#14f195","$":"#14f195","!":"#14f195"});
  drawPattern(g, 165, 533, ["RRR.EEE.K.K.TTT","RR..EE..KK...T.","R.R.EEE.K.K..T."], {"R":"#ff4444","E":"#ff4444","K":"#ff4444","T":"#ff4444","$":"#ff4444","!":"#ff4444"});
  drawPattern(g, 947, 68, ["SSS.OOO.L..","SSS.O.O.L..","SSS.OOO.LLL"], {"S":"#14f195","O":"#14f195","L":"#14f195","$":"#14f195","!":"#14f195"});
  drawPattern(g, 392, 502, ["BB..TTT.CCC","BBB..T..C..","BB...T..CCC"], {"B":"#f7931a","T":"#f7931a","C":"#f7931a","$":"#f7931a","!":"#f7931a"});
  drawPattern(g, 308, 129, ["DD..OOO.GGG.EEE","D.D.O.O.G.G.EE.","DD..OOO.GGG.EEE"], {"D":"#c2a633","O":"#c2a633","G":"#c2a633","E":"#c2a633","$":"#c2a633","!":"#c2a633"});
  drawPattern(g, 934, 494, ["W.W..A..GGG.MMM.III","W.W.AAA.G.G.M.M..I.","WWW.A.A.GGG.M.M.III"], {"W":"#00ff88","A":"#00ff88","G":"#00ff88","M":"#00ff88","I":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 54, 622, [".A..PPP.EEE","AAA.PPP.EE.","A.A.P...EEE"], {"A":"#00ccff","P":"#00ccff","E":"#00ccff","$":"#00ccff","!":"#00ccff"});
  drawPattern(g, 88, 925, ["DD..U.U.MMM.PPP","D.D.U.U.M.M.PPP","DD..UUU.M.M.P.."], {"D":"#ff4444","U":"#ff4444","M":"#ff4444","P":"#ff4444","$":"#ff4444","!":"#ff4444"});
  drawPattern(g, 655, 804, ["SSS.OOO.L..","SSS.O.O.L..","SSS.OOO.LLL"], {"S":"#14f195","O":"#14f195","L":"#14f195","$":"#14f195","!":"#14f195"});
  drawPattern(g, 635, 414, ["N.N.FFF..A.","NNN.FF..AAA","N.N.F...A.A"], {"N":"#ff4444","F":"#ff4444","A":"#ff4444","$":"#ff4444","!":"#ff4444"});
  drawPattern(g, 849, 484, ["DD..OOO.GGG.EEE","D.D.O.O.G.G.EE.","DD..OOO.GGG.EEE"], {"D":"#c2a633","O":"#c2a633","G":"#c2a633","E":"#c2a633","$":"#c2a633","!":"#c2a633"});
  drawPattern(g, 578, 223, ["SSS.OOO.L..","SSS.O.O.L..","SSS.OOO.LLL"], {"S":"#14f195","O":"#14f195","L":"#14f195","$":"#14f195","!":"#14f195"});
  drawPattern(g, 409, 961, ["W.W..A..GGG.MMM.III","W.W.AAA.G.G.M.M..I.","WWW.A.A.GGG.M.M.III"], {"W":"#00ff88","A":"#00ff88","G":"#00ff88","M":"#00ff88","I":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 160, 392, ["K.K.EEE.K.K.W.W","KK..EE..KK..W.W","K.K.EEE.K.K.WWW"], {"K":"#3d9a3d","E":"#3d9a3d","W":"#3d9a3d","$":"#3d9a3d","!":"#3d9a3d"});
  drawPattern(g, 126, 153, ["PPP.U.U.MMM.PPP","PPP.U.U.M.M.PPP","P...UUU.M.M.P.."], {"P":"#00ff88","U":"#00ff88","M":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 742, 835, ["N.N.FFF..A.","NNN.FF..AAA","N.N.F...A.A"], {"N":"#ff4444","F":"#ff4444","A":"#ff4444","$":"#ff4444","!":"#ff4444"});
  drawPattern(g, 42, 905, ["DD..OOO.GGG.EEE","D.D.O.O.G.G.EE.","DD..OOO.GGG.EEE"], {"D":"#c2a633","O":"#c2a633","G":"#c2a633","E":"#c2a633","$":"#c2a633","!":"#c2a633"});
  drawPattern(g, 862, 775, ["SSS.EEE.RRR.SSS","SSS.EE..RR..SSS","SSS.EEE.R.R.SSS"], {"S":"#9945ff","E":"#9945ff","R":"#9945ff","$":"#9945ff","!":"#9945ff"});
  drawPattern(g, 683, 858, ["W.W..A..GGG.MMM.III","W.W.AAA.G.G.M.M..I.","WWW.A.A.GGG.M.M.III"], {"W":"#00ff88","A":"#00ff88","G":"#00ff88","M":"#00ff88","I":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 120, 399, [".A..PPP.EEE","AAA.PPP.EE.","A.A.P...EEE"], {"A":"#00ccff","P":"#00ccff","E":"#00ccff","$":"#00ccff","!":"#00ccff"});
  drawPattern(g, 563, 869, ["L...FFF.GGG","L...FF..G.G","LLL.F...GGG"], {"L":"#00ff88","F":"#00ff88","G":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 664, 430, ["RRR.EEE.K.K.TTT","RR..EE..KK...T.","R.R.EEE.K.K..T."], {"R":"#ff4444","E":"#ff4444","K":"#ff4444","T":"#ff4444","$":"#ff4444","!":"#ff4444"});
  drawPattern(g, 596, 255, ["RRR.EEE.K.K.TTT","RR..EE..KK...T.","R.R.EEE.K.K..T."], {"R":"#ff4444","E":"#ff4444","K":"#ff4444","T":"#ff4444","$":"#ff4444","!":"#ff4444"});
  drawPattern(g, 398, 674, ["GGG.GGG","G.G.G.G","GGG.GGG"], {"G":"#ffd700","$":"#ffd700","!":"#ffd700"});
  drawPattern(g, 457, 515, ["PPP.U.U.MMM.PPP","PPP.U.U.M.M.PPP","P...UUU.M.M.P.."], {"P":"#00ff88","U":"#00ff88","M":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 183, 23, ["L...FFF.GGG","L...FF..G.G","LLL.F...GGG"], {"L":"#00ff88","F":"#00ff88","G":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 633, 501, ["H.H.OOO.DD..L..","HHH.O.O.D.D.L..","H.H.OOO.DD..LLL"], {"H":"#ffd700","O":"#ffd700","D":"#ffd700","L":"#ffd700","$":"#ffd700","!":"#ffd700"});
  drawPattern(g, 240, 457, ["L...FFF.GGG","L...FF..G.G","LLL.F...GGG"], {"L":"#00ff88","F":"#00ff88","G":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 856, 183, ["L...FFF.GGG","L...FF..G.G","LLL.F...GGG"], {"L":"#00ff88","F":"#00ff88","G":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 409, 109, ["MMM..A..GGG..A.","M.M.AAA.G.G.AAA","M.M.A.A.GGG.A.A"], {"M":"#cc0000","A":"#cc0000","G":"#cc0000","$":"#cc0000","!":"#cc0000"});
  drawPattern(g, 131, 367, ["MMM.OOO.OOO.N.N","M.M.O.O.O.O.NNN","M.M.OOO.OOO.N.N"], {"M":"#ffd700","O":"#ffd700","N":"#ffd700","$":"#ffd700","!":"#ffd700"});
  drawPattern(g, 374, 93, ["GGG.GGG","G.G.G.G","GGG.GGG"], {"G":"#ffd700","$":"#ffd700","!":"#ffd700"});
  drawPattern(g, 516, 522, ["L...FFF.GGG","L...FF..G.G","LLL.F...GGG"], {"L":"#00ff88","F":"#00ff88","G":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 41, 651, ["W.W..A..GGG.MMM.III","W.W.AAA.G.G.M.M..I.","WWW.A.A.GGG.M.M.III"], {"W":"#00ff88","A":"#00ff88","G":"#00ff88","M":"#00ff88","I":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 84, 944, ["EEE.TTT.H.H","EE...T..HHH","EEE..T..H.H"], {"E":"#9945ff","T":"#9945ff","H":"#9945ff","$":"#9945ff","!":"#9945ff"});
  drawPattern(g, 796, 737, [".A..PPP.EEE","AAA.PPP.EE.","A.A.P...EEE"], {"A":"#00ccff","P":"#00ccff","E":"#00ccff","$":"#00ccff","!":"#00ccff"});
  drawPattern(g, 81, 55, ["K.K.EEE.K.K.W.W","KK..EE..KK..W.W","K.K.EEE.K.K.WWW"], {"K":"#3d9a3d","E":"#3d9a3d","W":"#3d9a3d","$":"#3d9a3d","!":"#3d9a3d"});
  drawPattern(g, 916, 386, ["K.K.EEE.K.K.W.W","KK..EE..KK..W.W","K.K.EEE.K.K.WWW"], {"K":"#3d9a3d","E":"#3d9a3d","W":"#3d9a3d","$":"#3d9a3d","!":"#3d9a3d"});
  drawPattern(g, 26, 877, ["EEE.TTT.H.H","EE...T..HHH","EEE..T..H.H"], {"E":"#9945ff","T":"#9945ff","H":"#9945ff","$":"#9945ff","!":"#9945ff"});
  drawPattern(g, 628, 749, ["MMM.OOO.OOO.N.N","M.M.O.O.O.O.NNN","M.M.OOO.OOO.N.N"], {"M":"#ffd700","O":"#ffd700","N":"#ffd700","$":"#ffd700","!":"#ffd700"});
  drawPattern(g, 198, 134, ["BB..TTT.CCC","BBB..T..C..","BB...T..CCC"], {"B":"#f7931a","T":"#f7931a","C":"#f7931a","$":"#f7931a","!":"#f7931a"});
  drawPattern(g, 294, 979, ["MMM..A..GGG..A.","M.M.AAA.G.G.AAA","M.M.A.A.GGG.A.A"], {"M":"#cc0000","A":"#cc0000","G":"#cc0000","$":"#cc0000","!":"#cc0000"});
  drawPattern(g, 702, 807, ["SSS.OOO.L..","SSS.O.O.L..","SSS.OOO.LLL"], {"S":"#14f195","O":"#14f195","L":"#14f195","$":"#14f195","!":"#14f195"});
  drawPattern(g, 67, 853, ["N.N.FFF..A.","NNN.FF..AAA","N.N.F...A.A"], {"N":"#ff4444","F":"#ff4444","A":"#ff4444","$":"#ff4444","!":"#ff4444"});
  drawPattern(g, 625, 774, ["PPP.U.U.MMM.PPP","PPP.U.U.M.M.PPP","P...UUU.M.M.P.."], {"P":"#00ff88","U":"#00ff88","M":"#00ff88","$":"#00ff88","!":"#00ff88"});
  drawPattern(g, 162, 331, ["N.N.GGG.MMM.III","NNN.G.G.M.M..I.","N.N.GGG.M.M.III"], {"N":"#ff4444","G":"#ff4444","M":"#ff4444","I":"#ff4444","$":"#ff4444","!":"#ff4444"});
  drawPattern(g, 926, 835, ["N.N.GGG.MMM.III","NNN.G.G.M.M..I.","N.N.GGG.M.M.III"], {"N":"#ff4444","G":"#ff4444","M":"#ff4444","I":"#ff4444","$":"#ff4444","!":"#ff4444"});

  // ── RAINBOW SEPARATOR BANDS ─────────────────────────────────
  for (let x = 0; x < 125; x++) { px(g,x,500,"#ef4444"); px(g,x,501,"#ef4444"); px(g,x,999,"#ef4444"); }
  for (let x = 125; x < 250; x++) { px(g,x,500,"#f97316"); px(g,x,501,"#f97316"); px(g,x,999,"#f97316"); }
  for (let x = 250; x < 375; x++) { px(g,x,500,"#f59e0b"); px(g,x,501,"#f59e0b"); px(g,x,999,"#f59e0b"); }
  for (let x = 375; x < 500; x++) { px(g,x,500,"#84cc16"); px(g,x,501,"#84cc16"); px(g,x,999,"#84cc16"); }
  for (let x = 500; x < 625; x++) { px(g,x,500,"#22c55e"); px(g,x,501,"#22c55e"); px(g,x,999,"#22c55e"); }
  for (let x = 625; x < 750; x++) { px(g,x,500,"#06b6d4"); px(g,x,501,"#06b6d4"); px(g,x,999,"#06b6d4"); }
  for (let x = 750; x < 875; x++) { px(g,x,500,"#8b5cf6"); px(g,x,501,"#8b5cf6"); px(g,x,999,"#8b5cf6"); }
  for (let x = 875; x < 1000; x++) { px(g,x,500,"#ec4899"); px(g,x,501,"#ec4899"); px(g,x,999,"#ec4899"); }

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
