// Simulates bot settlers growing Canvas World for N days and writes public/world/seed.json.
// Run: bun scripts/simulate-world.ts [days=45] [bots=40]
import { writeFileSync } from "fs";
import { PLOT, biomeAt, findSpawn, isLand, plotOf } from "../app/world/engine";
import { BOT_NAMES, PLOT_SUFFIX, pickSprite, seededRand, zoneAt } from "../app/world/bots";

const DAYS = Number(process.argv[2] ?? 45);
const NBOTS = Math.min(Number(process.argv[3] ?? 40), BOT_NAMES.length);
const r = seededRand(20261101);

type Plot = { px: number; py: number; owner: string; name: string; born: number; last: number; public?: boolean };
type Obj = { id: string; x: number; y: number; prompt: string; lib: string; owner: string; t: number; appeal: number; likes: number; visits: number };
type Bot = { name: string; join: number; quit: number; activity: number; favs: string[]; group: number; plots: string[]; suffix: number };

const pk = (px: number, py: number) => `${px},${py}`;
const plots = new Map<string, Plot>();
const objs: Obj[] = [];
const spawn = findSpawn();
const sp = plotOf(spawn.x, spawn.y);
const timeline: { day: number; plots: number; objs: number; players: number }[] = [];

function landFrac(px: number, py: number) {
  let n = 0;
  for (let y = 0; y < PLOT; y += 2) for (let x = 0; x < PLOT; x += 2) if (isLand(biomeAt(px * PLOT + x + 0.5, py * PLOT + y + 0.5))) n++;
  return n / 16;
}

// Founders' Plaza: the public spawn plot every player starts beside.
plots.set(pk(sp.px, sp.py), { px: sp.px, py: sp.py, owner: "Canvas", name: "Founders' Plaza", born: 0, last: DAYS, public: true });
objs.push({ id: "plaza-fountain", x: sp.px * PLOT + 3, y: sp.py * PLOT + 4, prompt: "the first fountain of the world", lib: "fountain", owner: "Canvas", t: 0, appeal: 2, likes: 0, visits: 0 });

// Bots: early adopters join first, growth accelerates (word of mouth), some quit.
const bots: Bot[] = BOT_NAMES.slice(0, NBOTS).map((name, i) => {
  const join = Math.floor(Math.pow(r(), 0.8) * (DAYS - 3));
  const quits = r() < 0.25;
  const allKeys = ["castle", "dragon", "tower", "pagoda", "ramen", "balloon", "mushroom", "treehouse", "observatory", "airship", "sword", "catstatue", "lanterns", "koipond", "bakery", "ruins"];
  const favs = [0, 1, 2].map(() => allKeys[Math.floor(r() * allKeys.length)]);
  return { name, join, quit: quits ? join + 4 + Math.floor(r() * 10) : 9999, activity: 0.35 + r() * 0.65, favs, group: Math.floor(i / 3.5), plots: [], suffix: Math.floor(r() * PLOT_SUFFIX.length) };
});
const groupAnchor = new Map<number, { px: number; py: number }>();

function claimFor(b: Bot, day: number): boolean {
  const cands: { px: number; py: number }[] = [];
  const own = b.plots.map(k => plots.get(k)!);
  const groupPlots = [...plots.values()].filter(p => bots.find(x => x.name === p.owner)?.group === b.group);
  const base = own.length ? own : groupPlots;
  if (base.length) {
    for (const p of base) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) cands.push({ px: p.px + dx, py: p.py + dy });
  } else {
    // new settlement on the frontier, which pushes outward as the world ages
    const radius = 2 + day * 0.28 + r() * 3;
    for (let i = 0; i < 24; i++) {
      const a = r() * Math.PI * 2;
      cands.push({ px: sp.px + Math.round(Math.cos(a) * radius), py: sp.py + Math.round(Math.sin(a) * radius) });
    }
  }
  const ok = cands.filter(c => !plots.has(pk(c.px, c.py)) && landFrac(c.px, c.py) >= 0.6);
  if (!ok.length) return false;
  const c = ok[Math.floor(r() * ok.length)];
  const n = b.plots.length;
  plots.set(pk(c.px, c.py), { px: c.px, py: c.py, owner: b.name, name: `${b.name}'s ${PLOT_SUFFIX[(b.suffix + n) % PLOT_SUFFIX.length]}`, born: day + r(), last: day });
  b.plots.push(pk(c.px, c.py));
  if (!groupAnchor.has(b.group)) groupAnchor.set(b.group, c);
  return true;
}

function buildFor(b: Bot, day: number): boolean {
  if (!b.plots.length) return false;
  const p = plots.get(b.plots[Math.floor(r() * b.plots.length)])!;
  const inPlot = objs.filter(o => plotOf(o.x, o.y).px === p.px && plotOf(o.x, o.y).py === p.py);
  if (inPlot.length >= 6) return false;
  for (let tries = 0; tries < 12; tries++) {
    const x = p.px * PLOT + 1 + Math.floor(r() * 6), y = p.py * PLOT + 2 + Math.floor(r() * 5);
    if (!isLand(biomeAt(x + 0.5, y + 0.5))) continue;
    if (objs.some(o => Math.abs(o.x - x) < 2 && Math.abs(o.y - y) < 2)) continue;
    const { key, prompt } = pickSprite(zoneAt(x, y), r, b.favs);
    objs.push({ id: `b${objs.length}`, x, y, prompt, lib: key, owner: b.name, t: day + r(), appeal: Math.exp((r() - 0.5) * 1.6), likes: 0, visits: 0 });
    p.last = day;
    return true;
  }
  return false;
}

for (let day = 0; day < DAYS; day++) {
  const active = bots.filter(b => b.join <= day && b.quit > day);
  for (const b of active) {
    if (!b.plots.length) { claimFor(b, day); buildFor(b, day); continue; }
    if (r() < b.activity * 0.75) buildFor(b, day);
    if (r() < b.activity * 0.25) buildFor(b, day);
    const mine = objs.filter(o => o.owner === b.name).length;
    if (mine >= b.plots.length * 3 && r() < 0.12 * b.activity) claimFor(b, day);
  }
  // visits & likes: everyone wanders; appealing builds near the plaza get more traffic
  for (const o of objs) {
    const dist = Math.hypot(o.x - spawn.x, o.y - spawn.y) / PLOT;
    const traffic = active.length * 0.35 * o.appeal / (1 + dist * 0.15);
    const v = Math.floor(traffic * (0.6 + r() * 0.8));
    o.visits += v;
    o.likes += Math.floor(v * 0.1 * o.appeal + (r() < 0.3 ? 1 : 0));
  }
  timeline.push({ day, plots: plots.size, objs: objs.length, players: active.length });
}

const HOUR = 3600_000, DAYMS = 24 * HOUR;
const ago = (d: number) => Math.round((DAYS - d) * DAYMS);
const out = {
  version: 2,
  simDays: DAYS,
  spawn,
  plots: [...plots.values()].map(p => ({ px: p.px, py: p.py, owner: p.owner, name: p.name, bornAgo: ago(p.born), lastAgo: ago(p.last), public: p.public || undefined })),
  objs: objs.map(o => ({ id: o.id, x: o.x, y: o.y, prompt: o.prompt, lib: o.lib, owner: o.owner, ago: ago(o.t), likes: o.likes, visits: o.visits })),
  bots: bots.filter(b => b.join < DAYS).map(b => ({ name: b.name, active: b.quit > DAYS, favs: b.favs, plots: b.plots.map(k => { const [px, py] = k.split(",").map(Number); return { px, py }; }) })),
  timeline,
};
writeFileSync(new URL("../public/world/seed.json", import.meta.url), JSON.stringify(out));
const abandoned = out.plots.filter(p => p.lastAgo > 30 * DAYMS).length;
console.log(`days=${DAYS} bots=${out.bots.length} active=${out.bots.filter(b => b.active).length} plots=${out.plots.length} overgrown=${abandoned} objs=${out.objs.length} topLikes=${Math.max(...out.objs.map(o => o.likes))}`);
