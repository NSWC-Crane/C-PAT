// MIT License
// Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)
// https://github.com/lukeed/klona

function cloneValue(val) {
    return val && typeof val === 'object' ? klona(val) : val;
}

function cloneArray(val) {
    let k = val.length;
    const out = new Array(k);

    while (k--) out[k] = cloneValue(val[k]);

    return out;
}

function cloneObject(val) {
    const out = {};

    for (const k in val) {
        if (k === '__proto__') {
            Object.defineProperty(out, k, {
                value: cloneValue(val[k]),
                configurable: true,
                enumerable: true,
                writable: true,
            });
        } else {
            out[k] = cloneValue(val[k]);
        }
    }

    return out;
}

function klona(val) {
    if (Array.isArray(val)) return cloneArray(val);

    if (Object.prototype.toString.call(val) === '[object Object]') return cloneObject(val);

    return val;
}

module.exports = klona;
