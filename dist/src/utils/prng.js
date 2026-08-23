function mulberry32(a) {
    return function () {
        a |= 0;
        a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
function cyrb128(str) {
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
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}
function sfc32(a, b, c, d) {
    return function () {
        a |= 0;
        b |= 0;
        c |= 0;
        d |= 0;
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
export function createRandom(seed) {
    let rng;
    let seedValue;
    if (seed === undefined || seed === null || seed === "") {
        seedValue = Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    else {
        seedValue = String(seed);
    }
    const hash = cyrb128(seedValue);
    rng = sfc32(hash[0], hash[1], hash[2], hash[3]);
    // Warm up
    for (let i = 0; i < 10; i++)
        rng();
    const state = [];
    function captureState() {
        return [...state];
    }
    return {
        next() {
            const val = rng();
            state.push(val);
            if (state.length > 1000)
                state.shift();
            return val;
        },
        nextInt(min, max) {
            return Math.floor(this.next() * (max - min + 1)) + min;
        },
        nextFloat() {
            return this.next();
        },
        nextBool(probability = 0.5) {
            return this.next() < probability;
        },
        shuffle(array) {
            const result = [...array];
            for (let i = result.length - 1; i > 0; i--) {
                const j = this.nextInt(0, i);
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
        },
        pick(array) {
            return array[this.nextInt(0, array.length - 1)];
        },
        pickMany(array, count) {
            const shuffled = this.shuffle(array);
            return shuffled.slice(0, Math.min(count, array.length));
        },
        seed(newSeed) {
            seedValue = String(newSeed);
            const hash = cyrb128(seedValue);
            rng = sfc32(hash[0], hash[1], hash[2], hash[3]);
            for (let i = 0; i < 10; i++)
                rng();
            state.length = 0;
        },
        getSeed() {
            return seedValue;
        },
        state: captureState,
    };
}
export function generateSeed() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    const array = new Uint32Array(4);
    crypto.getRandomValues(array);
    for (let i = 0; i < 8; i++) {
        result += chars[array[i >> 2] % chars.length];
    }
    return result;
}
