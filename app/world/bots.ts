// Canvas World — bot settlers: sprite catalog (with biome fit + prompt variants) and bot roster.
import { biomeAt, type Biome } from "./engine";

export type Zone = "grass" | "desert" | "snow" | "coast" | "any";
export function zoneOf(b: Biome): Zone {
  if (b === "grass" || b === "forest") return "grass";
  if (b === "desert") return "desert";
  if (b === "snow") return "snow";
  if (b === "beach") return "coast";
  return "any";
}
export const zoneAt = (x: number, y: number) => zoneOf(biomeAt(x + 0.5, y + 0.5));

type Entry = { zones: Zone[]; prompts: string[] };
export const CATALOG: Record<string, Entry> = {
  lighthouse: { zones: ["coast", "grass"], prompts: ["a lighthouse on the cliffs", "a beacon for lost sailors", "an old lighthouse that never sleeps"] },
  castle: { zones: ["grass", "any"], prompts: ["a castle for the Moon Queen", "my kingdom's first keep", "a fairytale castle with blue towers"] },
  cottage: { zones: ["grass", "coast"], prompts: ["a cozy cottage for grandma", "my first little house", "a thatched home by the road"] },
  dragon: { zones: ["any", "grass", "desert", "snow"], prompts: ["a sleepy red dragon", "the dragon that guards our village", "a dragon napping in the sun"] },
  tree: { zones: ["grass"], prompts: ["a cherry blossom tree", "a sakura tree where friends meet", "the oldest tree in the hollow"] },
  torii: { zones: ["grass", "coast"], prompts: ["a red torii gate", "a gate to the spirit path", "a shrine gate at the crossroads"] },
  windmill: { zones: ["grass"], prompts: ["a windmill for the farm", "a mill that grinds starlight flour", "an old wooden windmill"] },
  fountain: { zones: ["grass", "any"], prompts: ["a fountain for the town square", "a wishing fountain", "a marble fountain with blue water"] },
  pyramid: { zones: ["desert"], prompts: ["a pyramid for the sun king", "a lost desert pyramid", "a tomb full of secrets"] },
  igloo: { zones: ["snow"], prompts: ["an igloo with a warm glow", "a snow home for travelers", "my tiny ice house"] },
  tower: { zones: ["any", "grass", "snow"], prompts: ["a wizard tower with a crystal", "a mage's purple tower", "a tower where spells are made"] },
  ship: { zones: ["coast"], prompts: ["a little sailing ship", "a pirate ship washed ashore", "a boat for exploring the sea"] },
  robot: { zones: ["any", "grass", "desert"], prompts: ["a moss-covered robot", "a giant robot that fell asleep", "an ancient guardian golem"] },
  market: { zones: ["grass", "coast", "desert"], prompts: ["a tiny market stall", "a fruit stand for travelers", "the best market in the land"] },
  cactus: { zones: ["desert"], prompts: ["a cactus garden", "desert cacti with a pink flower", "a prickly welcome sign"] },
  snowman: { zones: ["snow"], prompts: ["a snowman in a top hat", "a friendly snowman", "the snowman who waves at everyone"] },
  pagoda: { zones: ["grass"], prompts: ["a five-story pagoda", "a temple pagoda on the hill", "a pagoda for quiet thoughts"] },
  ramen: { zones: ["grass", "coast", "snow"], prompts: ["a tiny ramen shop", "late-night ramen stand", "ramen for weary explorers"] },
  balloon: { zones: ["grass", "desert", "any"], prompts: ["a hot air balloon", "a patchwork balloon ready to fly", "a balloon to see the whole world"] },
  mushroom: { zones: ["grass"], prompts: ["a mushroom house", "a giant red mushroom home", "where the forest gnomes live"] },
  treehouse: { zones: ["grass"], prompts: ["a treehouse with a rope ladder", "a secret clubhouse in the oak", "a treehouse for my friends"] },
  tents: { zones: ["grass", "desert", "snow", "coast"], prompts: ["a campfire with tents", "base camp for explorers", "a cozy camp under the stars"] },
  oasis: { zones: ["desert"], prompts: ["a desert oasis", "palm trees around a hidden pond", "water for desert travelers"] },
  camel: { zones: ["desert"], prompts: ["a resting camel", "a camel caravan stop", "my loyal desert camel"] },
  sphinx: { zones: ["desert"], prompts: ["a sphinx statue", "a sphinx that asks riddles", "an ancient sandstone sphinx"] },
  cabin: { zones: ["snow"], prompts: ["a snowy log cabin", "a cabin with warm windows", "a hideout in the frost"] },
  icepalace: { zones: ["snow"], prompts: ["an ice crystal palace", "a palace made of frozen light", "the Frost Queen's palace"] },
  penguin: { zones: ["snow", "coast"], prompts: ["three cute penguins", "a penguin family", "penguins waiting for fish"] },
  lanterns: { zones: ["grass", "coast"], prompts: ["a lantern festival arch", "glowing paper lanterns", "lights for the summer festival"] },
  stones: { zones: ["grass", "any", "snow"], prompts: ["an ancient stone circle", "standing stones of the old ones", "a mossy ritual circle"] },
  ruins: { zones: ["grass", "desert", "any"], prompts: ["overgrown temple ruins", "the ruins of a forgotten city", "columns from a lost age"] },
  observatory: { zones: ["any", "snow", "grass"], prompts: ["an observatory for stargazing", "a telescope dome on the peak", "where we watch the comets"] },
  clocktower: { zones: ["grass"], prompts: ["a town clock tower", "a clock tower with a copper roof", "the tower that rings at noon"] },
  bakery: { zones: ["grass", "coast"], prompts: ["a charming bakery", "fresh bread for the village", "a bakery that smells amazing"] },
  catstatue: { zones: ["grass", "coast", "desert"], prompts: ["a giant lucky cat statue", "a maneki-neko for good fortune", "a waving cat for luck"] },
  sword: { zones: ["any", "grass"], prompts: ["a legendary sword in the stone", "a glowing blade waiting for a hero", "the sword nobody can pull"] },
  koipond: { zones: ["grass"], prompts: ["a koi pond", "a garden pond with lily pads", "orange koi in a quiet pool"] },
  scarecrow: { zones: ["grass"], prompts: ["a scarecrow in a pumpkin patch", "a pumpkin farm", "a scarecrow who keeps watch"] },
  airship: { zones: ["any", "grass", "desert"], prompts: ["a steampunk airship", "an airship docked for repairs", "a flying ship for explorers"] },
  totem: { zones: ["grass", "snow", "any"], prompts: ["a carved totem pole", "a totem of the four spirits", "a painted wooden totem"] },
};
export const CATALOG_KEYS = Object.keys(CATALOG);

export function pickSprite(zone: Zone, r: () => number, favs: string[]): { key: string; prompt: string } {
  const fits = CATALOG_KEYS.filter(k => CATALOG[k].zones.includes(zone) || CATALOG[k].zones.includes("any"));
  const favFits = favs.filter(f => fits.includes(f));
  const pool = favFits.length && r() < 0.5 ? favFits : fits.length ? fits : CATALOG_KEYS;
  const key = pool[Math.floor(r() * pool.length)];
  const ps = CATALOG[key].prompts;
  return { key, prompt: ps[Math.floor(r() * ps.length)] };
}

export const BOT_NAMES = [
  "Mochi", "Ren", "Aiko", "Kenji", "Yuna", "Taro", "Hana", "Sora", "Kai", "Mei", "Haru", "Nori", "Rin", "Jun", "Saki", "Daichi",
  "Luna", "Felix", "Iris", "Otto", "Nova", "Milo", "Zara", "Theo", "Pixel", "Bramble", "Juniper", "Wren", "Ash", "Ember",
  "Koji", "Momo", "Yuki", "Shiro", "Akane", "Hikari", "Tomo", "Nami", "Riku", "Sumi",
];
export const PLOT_SUFFIX = ["Hearth", "Village", "Garden", "Outpost", "Haven", "Hold", "Glade", "Rest", "Landing", "Retreat"];

export function seededRand(seed: number) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
