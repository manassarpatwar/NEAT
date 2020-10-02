export const selectRandom = arr => {
    return arr[Math.floor(Math.random() * arr.length)];
};

export const random = (min, max) => {
    return Math.random() * (max - min) + min;
};

export function gaussian(mean = 0, standardDeviation = 1) {
    let u, v, s;

    do {
        v = random(-1, 1);
        u = random(-1, 1);
        s = u ** 2 + v ** 2;
    } while (s === 0 || s >= 1);

    s = Math.sqrt((-2 * Math.log(s)) / s);

    return s * u * standardDeviation + mean;
}

export const wrapNumber = (min, max, value) => {
    const l = max - min + 1;
    return ((((value - min) % l) + l) % l) + min;
};

export const clamp = (min, max, value) => {
    return Math.min(Math.max(value, min), max);
};

export const shuffle = array => {
    const copy = [...array];
    let current = copy.length,
        temp,
        rand;
    // While there remain elements to shuffle...
    while (0 !== current) {
        // Pick a remaining element...
        rand = Math.floor(Math.random() * current);
        current -= 1;

        // And swap it with the current element.
        temp = copy[current];
        copy[current] = copy[rand];
        copy[rand] = temp;
    }

    return copy;
};

export default {
    selectRandom,
    random,
    gaussian,
    clamp,
    shuffle,
    wrapNumber,
};
