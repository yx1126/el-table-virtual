<script>
import { defineComponent } from "vue";
import virtual from "vue-virtual-scroll-list";
import { Slot } from "vue-virtual-scroll-list/src/item";
import Item from "./Item.vue";

const EVENT_TYPE = {
    ITEM: "item_resize",
    SLOT: "slot_resize"
}

const SLOT_TYPE = {
    HEADER: "thead", // string value also use for aria role attribute
    FOOTER: "tfoot"
}


export default defineComponent({
    name: "VirtualBody",
    extends: virtual,
    props: {
        renderColGroup: { type: Function, default: void 0 }
    },
    methods: {
        getRenderSlots (h) {
            const slots = []
            const { start, end } = this.range
            const { dataSources, dataKey, itemClass, itemTag, itemStyle, isHorizontal, extraProps, dataComponent, itemScopedSlots } = this
            const slotComponent = this.$scopedSlots && this.$scopedSlots.item
            for (let index = start; index <= end; index++) {
                const dataSource = dataSources[index]
                if (dataSource) {
                    const uniqueKey = typeof dataKey === "function" ? dataKey(dataSource, index) : dataSource[dataKey]
                    if (typeof uniqueKey === "string" || typeof uniqueKey === "number") {
                        slots.push(h(Item, {
                            props: {
                                index,
                                tag: itemTag,
                                event: EVENT_TYPE.ITEM,
                                horizontal: isHorizontal,
                                uniqueKey: uniqueKey,
                                source: dataSource,
                                extraProps: extraProps,
                                component: dataComponent,
                                slotComponent: slotComponent,
                                scopedSlots: itemScopedSlots
                            },
                            style: itemStyle,
                            class: `${itemClass}${this.itemClassAdd ? " " + this.itemClassAdd(index) : ""}`
                        }))
                    } else {
                        console.warn(`Cannot get the data-key '${dataKey}' from data-sources.`)
                    }
                } else {
                    console.warn(`Cannot get the index '${index}' from data-sources.`)
                }
            }
            return slots
        }
    },
    render (h) {
        const { footer } = this.$slots
        const { padFront, padBehind } = this.range
        const { isHorizontal, pageMode, rootTag, wrapTag, wrapClass, wrapStyle, footerTag, footerClass, footerStyle, renderColGroup } = this
        const paddingStyle = { padding: isHorizontal ? `0px ${padBehind}px 0px ${padFront}px` : `${padFront}px 0px ${padBehind}px` }
        const wrapperStyle = wrapStyle ? Object.assign({}, wrapStyle, paddingStyle) : paddingStyle

        return h(rootTag, {
            ref: "root",
            on: {
                "&scroll": !pageMode && this.onScroll
            }
        }, [
            renderColGroup ? renderColGroup() : null,
            // main list
            h(wrapTag, {
                class: wrapClass,
                attrs: {
                    role: "group"
                },
                style: wrapperStyle
            }, this.getRenderSlots(h)),

            // footer slot
            footer ? h(Slot, {
                class: footerClass,
                style: footerStyle,
                props: {
                    tag: footerTag,
                    event: EVENT_TYPE.SLOT,
                    uniqueKey: SLOT_TYPE.FOOTER
                }
            }, footer) : null,

            // an empty element use to scroll to bottom
            h("div", {
                ref: "shepherd",
                style: {
                    width: isHorizontal ? "0px" : "100%",
                    height: isHorizontal ? "100%" : "0px"
                }
            })
        ])
    }
});
</script>