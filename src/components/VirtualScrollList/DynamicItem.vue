<script>
import { defineComponent } from "vue";
import { renderSlot } from "./utils";

export default defineComponent({
    name: "DynamicItem",
    inject: ["virtual"],
    props: {
        tag: { type: [String, Object], default: "div" },
        index: { type: Number, default: -1 },
        extraProps: { type: Object },
        uniqueKey: {},
    },
    computed: {
        isVertical() {
            return this.virtual?.direction === "vertical";
        },
    },
    mounted() {
        if(typeof ResizeObserver !== "undefined") {
            this.resizeObserver = new ResizeObserver(() => {
                this.dispatchSizeChange()
            })
            this.resizeObserver.observe(this.$el)
        }
    },
    updated() {
        this.resizeObserver.observe(this.$el);
    },
    beforeUnmount() {
        if(this.resizeObserver) {
            this.resizeObserver.disconnect()
            this.resizeObserver = null
        }
    },
    methods: {
        getSize() {
            return this.$el ? this.$el[this.isVertical ? "offsetHeight" : "offsetWidth"] : 0;
        },
        async dispatchSizeChange() {
            await this.$nextTick();
            if(this.virtual && this.virtual.onItemSizeChange) {
                this.virtual.onItemSizeChange(this.index, this.getSize());
            }
        }
    },
    render(h) {
        const { $scopedSlots: slots, tag, uniqueKey, extraProps } = this;
        return h(tag, { 
            key: uniqueKey,
            attrs: {
                role: "listitem"
            },
            props: extraProps,
        }, renderSlot(slots, "default"));
    }
});
</script>