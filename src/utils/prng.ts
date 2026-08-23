export interface RandomService {
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(): number;
  nextBool(probability?: number): boolean;
  shuffle<T>(array: T[]): T[];
  pick<T>(array: T[]): T;
  pickMany<T>(array: T[], count: number): T[];
  seed(seed: string | number): void;
  getSeed(): string;
  state(): number[];
}

function mulberry32(a: number) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function cyrb128(str: string): number[] {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

function sfc32(a: number, b: number, c: number, d: number) {
  return function() {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
}

export function createRandom(seed?: string | number): RandomService {
  let rng: () => number;
  let seedValue: string;

  if (seed === undefined || seed === null || seed === "") {
    seedValue = Math.random().toString(36).slice(2) + Date.now().toString(36);
  } else {
    seedValue = String(seed);
  }

  const hash = cyrb128(seedValue);
  rng = sfc32(hash[0], hash[1], hash[2], hash[3]);

  // Warm up
  for (let i = 0; i < 10; i++) rng();

  const state: number[] = [];

  function captureState(): number[] {
    return [...state];
  }

  return {
    next(): number {
      const val = rng();
      state.push(val);
      if (state.length > 1000) state.shift();
      return val;
    },
    nextInt(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    nextFloat(): number {
      return this.next();
    },
    nextBool(probability = 0.5): boolean {
      return this.next() < probability;
    },
    shuffle<T>(array: T[]): T[] {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = this.nextInt(0, i);
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
    pick<T>(array: T[]): T {
      return array[this.nextInt(0, array.length - 1)];
    },
    pickMany<T>(array: T[], count: number): T[] {
      const shuffled = this.shuffle(array);
      return shuffled.slice(0, Math.min(count, array.length));
    },
    seed(newSeed: string | number): void {
      seedValue = String(newSeed);
      const hash = cyrb128(seedValue);
      rng = sfc32(hash[0], hash[1], hash[2], hash[3]);
      for (let i = 0; i < 10; i++) rng();
      state.length = 0;
    },
    getSeed(): string {
      return seedValue;
    },
    state: captureState,
  };
}

export function generateSeed(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  const array = new Uint32Array(4);
  crypto.getRandomValues(array);
  for (let i = 0; i < 8; i++) {
    result += chars[array[i >> 2] % chars.length];
  }
  return result;
}
