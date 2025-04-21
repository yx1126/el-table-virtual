<script>
import { defineComponent } from "vue";
import { renderSlot, defineValid, isFn, getStyles } from "./utils";

let originalOnSelectStart;

export default defineComponent({
    name: "VirtualScroll",
    props: {
        data: { type: Array, default: () => [] },
        rootTag: { type: String, default: "div" },
        wrapTag: { type: String, default: "div" },
        wrapClass: [String, Object],
        wrapStyle: [String, Object],
        listTag: { type: String, default: "div" },
        listClass: [String, Object],
        listStyle: [String, Object],
        dataKey: { type: [String, Function], default: void 0, required: true },
        direction: { type: String, default: "vertical", validator: defineValid(["vertical", "horizontal"]) },
        minSize: { type: Number, default: 20 },
        minItemSize: { type: Number, default: 20 },
        itemComponent: Object,
        extraCount: { type: Number, default: 8 },
        native: Boolean,
        always: Boolean,
        isResize: { type: Boolean, default: false }
    },
    emits: ["scroll"],
    data() {
        return {
            startIndex: 0,
            containerSize: 0,

            // bar
            isExistScroll: false, // 是否存在滚动条
            thumbSize: 0, // 滑块大小
            scrollSize: 0, // 滚动的高度 = 容器总高度 - 容器自身高度
            thumbScrollSize: 0, // 滑块 滚动高度
            translateXY: 0, // 滑块 移动距离

            resizeObserver: null,
        }
    },
    computed: {
        isVertical() {
            return this.direction === "vertical";
        },
        totalSize() {
            const { data, minItemSize } = this;
            return data.length * minItemSize;
        },
        count() {
            const { minItemSize, extraCount, containerSize } = this;
            return Math.ceil(containerSize / minItemSize) + extraCount;
        },
        dataList() {
            const { data, startIndex, count } = this;
            return data.slice(startIndex, startIndex + count).map((item, i) => {
                return {
                    item,
                    index: startIndex + i
                }
            });
        },
    },
    watch: {
        "data.length": {
            handler() {
                this.startIndex = 0;
                this.update();
            },
            immediate: true
        },
        direction: {
            handler: "updateSize",
            immediate: true
        },
        native: {
            handler: "init",
            immediate: true,
        },
        minSize: "init",
    },
    created() {
        const { $nextTick, init } = this;
        const unWatch = this.$watch("isResize", async (resize) => {
            await $nextTick();
            if(resize) {
                this.resizeObserver = new ResizeObserver(() => init());
                this.resizeObserver.observe(this.$refs["wrapperRef"])
            } else {
                this.resizeObserver?.disconnect();
                this.resizeObserver = null;
            }
        }, {
            immediate: true,
        })
        this.$once("hook:destroyed", () => {
            unWatch();
        })
    },
    activated() {
        const { onScroll, native, init } = this;
        onScroll(null, false);
        if(!native) init();
    },
    methods: {
        // expose
        scrollToIndex(index) {
            const { minItemSize, data } = this;
            if(typeof index !== "number" || index < 0 || data.length <= 0) return;
            this.scrollToOffset(index * minItemSize);
        },
        scrollToOffset(offset) {
            const { data, isVertical } = this;
            if(typeof offset !== "number" || offset < 0 || data.length <= 0) return;
            const scrollValue = isVertical ? "scrollTop" : "scrollLeft";
            this.$refs["wrapperRef"][scrollValue] = offset;
            this.onScroll({ target: { [scrollValue]: offset } });
        },
        scrollToBottom() {
            const { data } = this;
            if(data.length <= 0) return;
            this.scrollToIndex(data.length);
        },
        async update() {
            await this.updateSize();
            await this.init();
        },
        // methods
        async updateSize() {
            const { $nextTick, direction } = this;
            await $nextTick();
            this.containerSize = this.$refs["wrapperRef"][direction === "vertical" ? "clientHeight" : "clientWidth"];
        },
        onScroll(e, isEmit = true) {
            const { data, minItemSize, count, isVertical, updateThumb } = this;
            const scrollValue = e?.target[isVertical ? "scrollTop" : "scrollLeft"] || 0;
            this.startIndex = Math.min(data.length > count ? data.length - count : 0, Math.floor(scrollValue / minItemSize));
            updateThumb();
            if(isEmit) {
                this.$emit("scroll", e);
            }
        },
        async init() {
            await this.$nextTick();
            const { isVertical: isY, minSize, updateThumb } = this;
            const { offsetWidth: ow, offsetHeight: oh, scrollWidth: sw, scrollHeight: sh } = this.$refs["wrapperRef"];
            this.isExistScroll = !isY ? sw > ow : sh > oh;
            this.thumbSize = Math.max(!isY ? ow ** 2 / sw : oh ** 2 / sh, minSize);
            this.scrollSize = !isY ? sw - ow : sh - oh;
            this.thumbScrollSize = (!isY ? ow : oh) - this.thumbSize;
            updateThumb();
        },
        updateThumb() {
            if(!this.$refs["wrapperRef"] || this.native) return;
            const { isVertical, scrollSize, thumbScrollSize } = this;
            this.translateXY = this.$refs["wrapperRef"][isVertical ? "scrollTop" : "scrollLeft"] / scrollSize * thumbScrollSize;
        },
        onMousedown(event) {
            event.stopPropagation();
            // 禁止鼠标 middle right 点击
            if(event.ctrlKey || [1, 2].includes(event.button)) return;
            window.getSelection()?.removeAllRanges();
            event.stopImmediatePropagation();
            originalOnSelectStart = document.onselectstart;
            document.onselectstart = () => false;

            // 鼠标点击时滑块Y轴默认偏移量
            let translateXY = 0;
            const transform = getComputedStyle(this.$refs["thumbRef"])["transform"];
            if(transform !== "none") {
                const list = (transform.match(/\((.+)\)/)[1] || "").split(",");
                translateXY = Number(list[list.length - (this.isVertical ? 1 : 2)]);
            }
            const onMousemove = (e) => {
                const { isVertical: isY, thumbScrollSize, scrollSize } = this;
                const xy = (!isY ? e.clientX - event.clientX : e.clientY - event.clientY) + translateXY;
                const moveXY = xy < 0 ? 0 : xy > thumbScrollSize ? thumbScrollSize : xy;
                this.$refs["wrapperRef"][!isY ? "scrollLeft" : "scrollTop"] = moveXY / thumbScrollSize * scrollSize;
            }

            function onMouseup() {
                document.removeEventListener("mousemove", onMousemove);
                document.removeEventListener("mouseup", onMouseup);
                if(document.onselectstart !== originalOnSelectStart) {
                    document.onselectstart = originalOnSelectStart;
                }
            }
            document.addEventListener("mousemove", onMousemove);
            document.addEventListener("mouseup", onMouseup);
        }
    },
    render(h) {
        const {
            $scopedSlots: slots,
            // props
            native,
            dataKey,
            rootTag,
            direction,
            wrapTag,
            wrapClass,
            wrapStyle,
            listTag,
            listClass,
            listStyle,
            itemComponent,
            minItemSize,
            always,
            // data
            startIndex,
            isExistScroll,
            translateXY,
            thumbSize,
            // computed
            dataList,
            totalSize,
            isVertical,
            // methods
            onScroll,
            onMousedown
        } = this;
        return h(rootTag, {
            class: ["virtual-scroll", `is-${direction}`, { 
                "virtual-scroll--hidden": !native,
                "is-hover": !always
            }],
        }, [
            h(wrapTag, {
                ref: "wrapperRef",
                class: ["virtual-scroll__wrapper", wrapClass],
                style: wrapStyle,
                on: {
                    scroll: onScroll
                }
            }, [
                h("div", {
                    class: "virtual-scroll__transform",
                    style: { [isVertical ? "height" : "width"]: `${totalSize}px` } 
                }),
                h(listTag, {
                    class: ["virtual-scroll__list", listClass],
                    style: getStyles(listStyle, {
                        transform: `translate${[isVertical ? "Y" : "X"]}(${startIndex * minItemSize}px)`
                    }),
                }, dataList.map((data) => {
                    const uniqueKey = isFn(dataKey) ? dataKey(data) : data.item[dataKey];
                    if(typeof uniqueKey === "string" || typeof uniqueKey === "number") {
                        return renderSlot(slots, "default", { ...data, uniqueKey }, () => {
                            return h(itemComponent ?? "div", { 
                                props: data,
                                uniqueKey
                            })
                        })
                    } 
                    console.warn(`Cannot get the data-key '${dataKey}' from data.`)
                    return null
                }))
            ]),
            isExistScroll && !native ? h("div", {
                class: ["virtual-scroll__bar"],
            }, [
                h("div", {
                    ref: "thumbRef",
                    class: "virtual-scroll__thumb",
                    style: {
                        transform: `translate${isVertical ? "Y" : "X"}(${translateXY}px)`,
                        [isVertical ? "height" : "width"]: thumbSize + "px"
                    },
                    on: {
                        mousedown: onMousedown
                    }
                })
            ]) : null,
        ])
    }
});
</script>

<style lang="scss" scoped>
.virtual-scroll {
    position: relative;
    
    &--hidden &__wrapper {
        -ms-overflow-style: none;
        scrollbar-width: none !important;
        &::-webkit-scrollbar {
            width: 0 !important;
            display: none !important;
        }
    }
    
    &.is-vertical & {
        &__wrapper {
            overflow-y: auto;
        }
        &__list {
            top: 0;
            left: 0;
            right: 0;
        }
        &__bar {
            width: 6px;
            height: 100%;
            right: 2px;
            top: 0;
        }
        &__thumb {
            width: 100%;
        }
    }
    &.is-horizontal & {
        &__wrapper {
            overflow-x: auto;
        }
        &__list {
            top: 0;
            left: 0;
            bottom: 0;
        }
        &__bar {
            left: 0;
            bottom: 2px;
            width: 100%;
            height: 6px;
        }
        &__thumb {
            height: 100%;
        }
    }
    &.is-hover &__thumb {
        background-color: transparent;
    }
    &.is-hover {
        &:active .virtual-scroll__thumb,
        &:hover .virtual-scroll__thumb {
            background-color: #909399;
        }
    }
    &__wrapper {
        position: relative;
        width: 100%;
        height: 100%;
    }
    &__list {
        position: absolute;
        will-change: transform;
    }
    &__bar {
        position: absolute;
    }
    &__thumb {
        border-radius: 5px;
        background-color: #909399;
        cursor: pointer;
        opacity: .3;
        transition: all 0s;
        &:hover {
            background-color: #909399;
            opacity: .5;
        }
    }
}
</style>