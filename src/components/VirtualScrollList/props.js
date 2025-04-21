export function defineValid(values) {
    return (val) => values.includes(val);
}

export const barProps = {
    direction: { type: String, default: "vertical", validator: defineValid(["vertical", "horizontal"]) },
    minSize: { type: Number, default: 20 },
    isResize: { type: Boolean, default: false },
}