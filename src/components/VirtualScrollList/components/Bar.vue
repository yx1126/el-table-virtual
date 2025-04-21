<template>
    <div 
        v-if="isExistScroll"
        class="scroll-bar"
        :class="[
            `is-${direction}`,
        ]"
    >
        <div
            ref="thumbRef" 
            class="scroll-bar__thumb"
            :style="{
                transform: `translate${isHorizontal ? 'X' : 'Y'}(${translateXY}px)`,
                [isHorizontal ? 'width' : 'height']: thumbSize + 'px'
            }"
            @mousedown="onMousedown"
        />
    </div>
</template>

<script>
import { defineComponent } from "vue";
import { isFn } from "../utils";
import { barProps } from "../props";

let originalOnSelectStart;

export default defineComponent({
    name: "Bar",
    props: {
        ...barProps,
        scrollTarget: { type: [Function, String], required: true }
    },
    data() {
        return {
            translateXY: 0,
            scrollValue: 0,
            isExistScroll: true,
            thumbSize: 0,
            scrollSize: 0,
            thumbScrollSize: 0
        }
    },
    computed: {
        isHorizontal() {
            return this.direction === "horizontal";
        }
    },
    watch: {
        minSize: "init",
        direction: "init"
    },
    created() {
        this.directionKey = this.isHorizontal ? "scrollLeft" : "scrollTop";
        const { $nextTick, init } = this;
        const unWatch = this.$watch("isResize", async (resize) => {
            await $nextTick();
            if(resize) {
                this.resizeObserver = new ResizeObserver(() => init());
                this.resizeObserver.observe(this.$el);
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
        this.$nextTick(this.init);
    },
    mounted() {
        this.init();
    },
    methods: {
        getScrollTarget() {
            const { scrollTarget } = this;
            return isFn(scrollTarget) ? scrollTarget() : document.querySelector(scrollTarget);
        },
        init() {
            const { isHorizontal: isX, minSize, updateThumb } = this;
            const { offsetWidth: ow, offsetHeight: oh, scrollWidth: sw, scrollHeight: sh } = this.getScrollTarget();
            const { offsetWidth: pow, offsetHeight: poh } = this.$el;
            this.isExistScroll = isX ? sw > pow : sh > poh;
            this.thumbSize = Math.max(isX ? ow ** 2 / sw : oh ** 2 / sh, minSize);
            this.scrollSize = isX ? sw - ow : sh - oh;
            this.thumbScrollSize = (isX ? ow : oh) - this.thumbSize;
            updateThumb();
        },
        update(e) {
            if(!e) return;
            const offset = typeof e === "number" ? e : e?.target[this.directionKey] || 0;
            this.updateThumb(offset);
        },
        updateThumb(offset = 0) {
            const { scrollSize, thumbScrollSize } = this;
            this.translateXY = offset / scrollSize * thumbScrollSize;
        },
        onMousedown(event) {
            event.stopPropagation();
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
                translateXY = Number(list[list.length - (this.isHorizontal ? 2 : 1)]);
            }
            const onMousemove = (e) => {
                const { isHorizontal: isX, thumbScrollSize, scrollSize, directionKey } = this;
                const xy = (isX ? e.clientX - event.clientX : e.clientY - event.clientY) + translateXY;
                const moveXY = xy < 0 ? 0 : xy > thumbScrollSize ? thumbScrollSize : xy;
                const scrollValue = moveXY / thumbScrollSize * scrollSize;
                this.$emit("scroll", { type: directionKey, value: scrollValue });
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
    }
});
</script>

<style lang="scss" scoped>

$thumn-color: #909399;

@mixin when($state) {
    @at-root {
        &.is-#{$state} {
            @content;
        }
    }
}

.scroll-bar {
    position: absolute;
    @include when(vertical) {
        width: 6px;
        right: 2px;
        top: 0;
        bottom: 0;
        .scroll-bar__thumb {
            width: 100%;
        }
    }
    @include when(horizontal) {
        height: 6px;
        left: 0;
        right: 0;
        bottom: 2px;
        .scroll-bar__thumb {
            height: 100%;
        }
    }
    &__thumb {
        border-radius: 5px;
        background-color: $thumn-color;
        cursor: pointer;
        opacity: .3;
        transition: all 0s;
        &:hover {
            background-color: $thumn-color;
            opacity: .5;
        }
    }
}
</style>