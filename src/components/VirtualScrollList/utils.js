
export function renderSlot(slots, name, props = {}, fallback) {
    if(!slots) {
        throw new Error("Missing slots.");
    }
    if(fallback && typeof fallback !== "function") {
        throw new Error("fallback must be function.");
    }
    const slot = slots[name];
    if(!slot) return fallback ? fallback() : null;
    if(typeof slot === "function") {
        return slot(props);
    }
    return slot;
}

export function isFn(val) { return typeof val === "function" }

export function defineValid(values) {
    return (val) => values.includes(val);
}

export function getStyles(...styles) {
    return styles.reduce((pre, sty) => {
        let val = ";";
        if(typeof sty === "string") {
            val += sty
        } else {
            Object.entries(Object.assign({}, sty)).forEach(([k, v]) => {
                val += `${k}: ${v};`
            })
        }
        return pre + val;
    }, "");
}

export function sum(...args) {
    return args.reduce((pre, cur) => pre + cur, 0)
}