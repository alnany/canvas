// Canvas World — terrain, fog and plot logic (pure, no React)

export const TEX = 8;          // texels per tile (pixel-art resolution)
export const CHUNK = 16;       // tiles per chunk
export const PLOT = 8;         // tiles per plot side
export const REVEAL_R = 9;     // reveal radius in tiles

// ── Deterministic value noise ────────────────────────────────────────────────
const SEED = 1337;
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263 + SEED * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}
function smooth(t: number) { return t * t * (3 - 2 * t); }
function vnoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = smooth(x - xi), yf = smooth(y - yi);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}
function fbm(x: number, y: number, oct = 4): number {
  let v = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { v += vnoise(x * f, y * f) * amp; norm += amp; amp *= 0.5; f *= 2; }
  return v / norm;
}

export type Biome = "deep" | "water" | "foam" | "beach" | "grass" | "forest" | "rock" | "desert" | "snow";

export function heightAt(x: number, y: number) { return fbm(x / 26 + 100, y / 26 + 100, 5); }
export function tempAt(x: number, y: number) { return fbm(x / 90 - 300, y / 90 + 50, 3); }

export function biomeAt(x: number, y: number): Biome {
  const h = heightAt(x, y);
  if (h < 0.36) return "deep";
  if (h < 0.42) return "water";
  if (h < 0.432) return "foam";
  if (h < 0.46) return "beach";
  const t = tempAt(x, y);
  if (h > 0.72) return "rock";
  if (t < 0.42) return "snow";
  if (t > 0.6) return "desert";
  if (h > 0.62) return "forest";
  return "grass";
}

export function regionName(x: number, y: number): string {
  const t = tempAt(x, y);
  if (t < 0.42) return "Frostveil Reach";
  if (t > 0.6) return "Sunscar Dunes";
  return "Verdant Hollow";
}

export function isLand(b: Biome) { return b !== "deep" && b !== "water" && b !== "foam"; }

const PAL: Record<Biome, [string, string, string]> = {
  deep:   ["#1b3f78", "#1f4886", "#25529a"],
  water:  ["#2e6fb3", "#3a80c4", "#4b93d4"],
  foam:   ["#d9f1f4", "#bfe4ec", "#ffffff"],
  beach:  ["#ecd59c", "#e2c585", "#f5e2b2"],
  grass:  ["#63ad4f", "#55a045", "#79c35d"],
  forest: ["#3c7d3a", "#2f6b31", "#4f9447"],
  rock:   ["#8c8a86", "#76746f", "#a7a49e"],
  desert: ["#e6b96b", "#d6a45a", "#f0cc85"],
  snow:   ["#eef3f8", "#d6e1ec", "#ffffff"],
};

function rgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
const PAL_RGB = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, v.map(rgb)])) as Record<Biome, [number, number, number][]>;

/** Render one chunk at texel resolution. Coasts curve naturally because biome is sampled per texel. */
export function renderChunk(cx: number, cy: number): HTMLCanvasElement {
  const size = CHUNK * TEX;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const ox = cx * CHUNK, oy = cy * CHUNK;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const wx = ox + px / TEX, wy = oy + py / TEX;
      const b = biomeAt(wx, wy);
      const n = hash(Math.floor(wx * TEX), Math.floor(wy * TEX));
      let shade = n < 0.12 ? 1 : n > 0.93 ? 2 : 0;
      // biome detail: grass tufts, forest canopy blobs, water ripples
      if (b === "forest" && vnoise(wx * 2.2, wy * 2.2) > 0.62) shade = 1;
      if ((b === "water" || b === "deep") && Math.sin(wx * 3 + Math.floor(wy * 2) * 1.7) > 0.96) shade = 2;
      const [r, g, bl] = PAL_RGB[b][shade];
      const i = (py * size + px) * 4;
      img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = bl; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export const key = (x: number, y: number) => `${x},${y}`;
export const plotOf = (x: number, y: number) => ({ px: Math.floor(x / PLOT), py: Math.floor(y / PLOT) });

export function findSpawn(): { x: number; y: number } {
  for (let r = 0; r < 200; r++) {
    for (let a = 0; a < 16; a++) {
      const x = Math.round(Math.cos(a / 16 * Math.PI * 2) * r), y = Math.round(Math.sin(a / 16 * Math.PI * 2) * r);
      if (biomeAt(x + 0.5, y + 0.5) !== "grass") continue;
      let land = 0;
      for (let dy = -6; dy <= 6; dy += 2) for (let dx = -6; dx <= 6; dx += 2) if (isLand(biomeAt(x + dx + 0.5, y + dy + 0.5))) land++;
      if (land >= 45) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

// ── Sprite library (prototype fallback for AI generation) ────────────────────
export const LIBRARY: Record<string, string[]> = {
  lighthouse: ["lighthouse", "beacon", "light"],
  castle: ["castle", "palace", "fort", "kingdom", "king", "queen", "princess"],
  cottage: ["house", "home", "cottage", "cabin", "hut", "village"],
  dragon: ["dragon", "monster", "beast", "wyvern"],
  tree: ["tree", "sakura", "cherry", "blossom", "forest", "garden"],
  torii: ["torii", "shrine", "temple", "gate", "japan"],
  windmill: ["windmill", "mill", "farm"],
  fountain: ["fountain", "well", "plaza", "statue"],
  pyramid: ["pyramid", "egypt", "tomb", "sphinx"],
  igloo: ["igloo", "ice", "eskimo"],
  tower: ["tower", "wizard", "mage", "magic", "crystal"],
  ship: ["ship", "boat", "pirate", "sail"],
  robot: ["robot", "mech", "golem", "machine"],
  market: ["market", "shop", "stall", "store", "food", "fruit"],
  cactus: ["cactus", "desert", "succulent"],
  snowman: ["snowman", "snow", "winter", "christmas"],
};
export const LIB_KEYS = Object.keys(LIBRARY);
