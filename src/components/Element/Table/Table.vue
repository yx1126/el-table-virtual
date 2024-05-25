<template>
    <div
        class="el-table"
        :class="[{
            'el-table--fit': fit,
            'el-table--striped': stripe,
            'el-table--border': border || isGroup,
            'el-table--hidden': isHidden,
            'el-table--group': isGroup,
            'el-table--fluid-height': maxHeight,
            'el-table--scrollable-x': layout.scrollX,
            'el-table--scrollable-y': !virtual && layout.scrollY,
            'el-table--virtual': virtual,
            'el-table--enable-row-hover': !store.states.isComplex,
            'el-table--enable-row-transition': (store.states.data || []).length !== 0 && (store.states.data || []).length < 100
        }, tableSize ? `el-table--${ tableSize }` : '']"
        @mouseleave="handleMouseLeave($event)"
    >
        <div ref="hiddenColumns" class="hidden-columns">
            <slot />
        </div>
        <div v-if="showHeader" ref="headerWrapper" v-mousewheel="handleHeaderFooterMousewheel" class="el-table__header-wrapper">
            <table-header ref="tableHeader" :store="store" :border="border" :default-sort="defaultSort" :style="{ width: layout.bodyWidth ? layout.bodyWidth + 'px' : '' }" />
        </div>
        <div
            ref="bodyWrapper"
            class="el-table__body-wrapper"
            :class="[layout.scrollX ? `is-scrolling-${scrollPosition}` : 'is-scrolling-none']"
            :style="[bodyHeight]"
        >
            <table-body ref="tableBodyRef" :context="context" :store="store" :stripe="stripe" :row-class-name="rowClassName" :row-style="rowStyle" :highlight="highlightCurrentRow" />
            <div v-if="!data || data.length === 0" ref="emptyBlock" class="el-table__empty-block" :style="emptyBlockStyle">
                <span class="el-table__empty-text">
                    <slot name="empty">{{ emptyText || t('el.table.emptyText') }}</slot>
                </span>
            </div>
            <div v-if="$slots.append" ref="appendWrapper" class="el-table__append-wrapper">
                <slot name="append" />
            </div>
        </div>
        <div v-if="showSummary" v-show="data && data.length > 0" ref="footerWrapper" v-mousewheel="handleHeaderFooterMousewheel" class="el-table__footer-wrapper">
            <table-footer :store="store" :border="border" :sum-text="sumText || t('el.table.sumText')" :summary-method="summaryMethod" :default-sort="defaultSort" :style="{ width: layout.bodyWidth ? layout.bodyWidth + 'px' : '' }" />
        </div>
        <div v-if="fixedColumns.length > 0" ref="fixedWrapper" v-mousewheel="handleFixedMousewheel" class="el-table__fixed" :style="[{ width: layout.fixedWidth ? layout.fixedWidth + 'px' : '' }, fixedHeight ]">
            <div v-if="showHeader" ref="fixedHeaderWrapper" class="el-table__fixed-header-wrapper">
                <table-header ref="fixedTableHeader" fixed="left" :border="border" :store="store" :style="{ width: bodyWidth }" />
            </div>
            <div ref="fixedBodyWrapper" class="el-table__fixed-body-wrapper" :style="[{ top: layout.headerHeight + 'px' }, fixedBodyHeight]">
                <table-body ref="fixedVirtualBodyWrapper" fixed="left" :store="store" :stripe="stripe" :highlight="highlightCurrentRow" :row-class-name="rowClassName" :row-style="rowStyle" />
                <div v-if="$slots.append" class="el-table__append-gutter" :style="{ height: layout.appendHeight + 'px'}" />
            </div>
            <div v-if="showSummary" v-show="data && data.length > 0" ref="fixedFooterWrapper" class="el-table__fixed-footer-wrapper">
                <table-footer fixed="left" :border="border" :sum-text="sumText || t('el.table.sumText')" :summary-method="summaryMethod" :store="store" :style="{ width: bodyWidth }" />
            </div>
        </div>
        <div v-if="rightFixedColumns.length > 0" ref="rightFixedWrapper" v-mousewheel="handleFixedMousewheel" class="el-table__fixed-right" :style="[{ width: layout.rightFixedWidth ? layout.rightFixedWidth + 'px' : '', right: layout.scrollY ? (border ? layout.gutterWidth : (layout.gutterWidth || 0)) + 'px' : '' }, fixedHeight]">
            <div v-if="showHeader" ref="rightFixedHeaderWrapper" class="el-table__fixed-header-wrapper">
                <table-header ref="rightFixedTableHeader" fixed="right" :border="border" :store="store" :style="{ width: bodyWidth }" />
            </div>
            <div ref="rightFixedBodyWrapper" class="el-table__fixed-body-wrapper" :style="[{ top: layout.headerHeight + 'px' }, fixedBodyHeight]">
                <table-body ref="rightVirtualFixedBodyWrapper" fixed="right" :store="store" :stripe="stripe" :row-class-name="rowClassName" :row-style="rowStyle" :highlight="highlightCurrentRow" />
                <div v-if="$slots.append" class="el-table__append-gutter" :style="{ height: layout.appendHeight + 'px' }" />
            </div>
            <div v-if="showSummary" v-show="data && data.length > 0" ref="rightFixedFooterWrapper" class="el-table__fixed-footer-wrapper">
                <table-footer fixed="right" :border="border" :sum-text="sumText || t('el.table.sumText')" :summary-method="summaryMethod" :store="store" :style="{ width: bodyWidth }" />
            </div>
        </div>
        <div
            v-if="rightFixedColumns.length > 0"
            ref="rightFixedPatch"
            class="el-table__fixed-right-patch"
            :style="{
                width: layout.scrollY ? layout.gutterWidth + 'px' : '0',
                height: layout.headerHeight + 'px'
            }"
        />
        <div v-show="resizeProxyVisible" ref="resizeProxy" class="el-table__column-resize-proxy" />
    </div>
</template>

<script>
import { Table } from "element-ui";
import { defineComponent } from "vue";
import TableBody from "./table-body";

export default defineComponent({
    name: Table.name,
    components: { TableBody },
    extends: Table,
    tableId: Table.name,
    props: {
        virtual: { type: Boolean, default: false },
    },
    computed: {
        bodyWrapper() {
            if(this.virtual) {
                return this.$refs.tableBodyRef.$el;
            }
            return this.$refs.bodyWrapper;
        },
    },
    created() {
        const virtual = this.virtual;
        this.layout.updateScrollY = function updateScrollY() {
            const height = this.height;
            if (height === null) return false;
            const bodyWrapper = this.table.bodyWrapper;
            if (this.table.$el && bodyWrapper) {
                const body = bodyWrapper.querySelector(virtual ? ".el-table-virtual__body-main" : ".el-table__body");
                const prevScrollY = this.scrollY;
                const scrollY = body.offsetHeight > this.bodyHeight;
                this.scrollY = scrollY;
                return prevScrollY !== scrollY;
            }
            return false;
        }
    },
    methods: {
        syncPostion() {
            const { scrollLeft, scrollTop, offsetWidth, scrollWidth } = this.bodyWrapper;
            const { headerWrapper, footerWrapper, fixedBodyWrapper, rightFixedBodyWrapper, fixedVirtualBodyWrapper, rightVirtualFixedBodyWrapper } = this.$refs;
            if (headerWrapper) headerWrapper.scrollLeft = scrollLeft;
            if (footerWrapper) footerWrapper.scrollLeft = scrollLeft;
            if(this.virtual) {
                if(fixedVirtualBodyWrapper) {
                    // fixedVirtualBodyWrapper.$el.scrollTop = scrollTop; scrollToOffset
                    fixedVirtualBodyWrapper.scrollToOffset(scrollTop);
                }
                if(rightVirtualFixedBodyWrapper) {
                    // rightVirtualFixedBodyWrapper.$el.scrollTop = scrollTop;
                    rightVirtualFixedBodyWrapper.scrollToOffset(scrollTop);
                }
            } else {
                if (fixedBodyWrapper) {
                    fixedBodyWrapper.scrollTop = scrollTop;
                }
                if (rightFixedBodyWrapper) {
                    rightFixedBodyWrapper.scrollTop = scrollTop;
                }
            }
            const maxScrollLeftPosition = scrollWidth - offsetWidth - 1;
            if (scrollLeft >= maxScrollLeftPosition) {
                this.scrollPosition = "right";
            } else if (scrollLeft === 0) {
                this.scrollPosition = "left";
            } else {
                this.scrollPosition = "middle";
            }
        },
    }
});
</script>


<style lang="scss" scoped>
.el-table.el-table--virtual ::v-deep {
    .el-table__fixed-right {
        background-color: #fff;
    }
    .el-table-virtual__body {
        height: inherit;
        max-height: inherit;
        overflow-y: auto;
        .el-table-virtual__row {
            background-color: #fff;
            display: flex;
            flex-wrap: nowrap;
            .el-table-virtual__cell {
                display: flex;
                align-items: center;
                border-bottom: 1px solid #EBEEF5;
                .cell {
                    width: 100%;
                }
            }
        }
    }
     div[node="td"].el-table__cell{
        border-bottom: 1px solid #EBEEF5
    }

    div[node="tr"] {
        background-color: #FFF
    }

    div[node="tr"] input[type=checkbox] {
        margin: 0
    }

    div[node="td"].el-table__cell div {
        -webkit-box-sizing: border-box;
        box-sizing: border-box
    }

    div[node="td"].el-table__cell.gutter {
        width: 0
    }


    .el-table__fixed-footer-wrapper tbody div[node="td"].el-table__cell {
        border-top: 1px solid #EBEEF5;
        background-color: #F5F7FA;
        color: #606266
    }

    &.el-table--striped .el-table__body div[node="tr"].el-table__row--striped div[node="td"].el-table__cell {
        background: #FAFAFA
    }

    &.el-table--striped .el-table__body div[node="tr"].el-table__row--striped.current-row div[node="td"].el-table__cell,
    &.el-table--striped .el-table__body div[node="tr"].el-table__row--striped.selection-row div[node="td"].el-table__cell {
        background-color: #ecf5ff
    }

    .el-table__body div[node="tr"].hover-row.current-row>div[node="td"].el-table__cell,
    .el-table__body div[node="tr"].hover-row.el-table__row--striped.current-row>div[node="td"].el-table__cell,
    .el-table__body div[node="tr"].hover-row.el-table__row--striped.selection-row>div[node="td"].el-table__cell,
    .el-table__body div[node="tr"].hover-row.el-table__row--striped>div[node="td"].el-table__cell,
    .el-table__body div[node="tr"].hover-row.selection-row>div[node="td"].el-table__cell,
    .el-table__body div[node="tr"].hover-row>div[node="td"].el-table__cell {
        background-color: #F5F7FA
    }

    .el-table__body div[node="tr"].current-row>div[node="td"].el-table__cell,
    .el-table__body div[node="tr"].selection-row>div[node="td"].el-table__cell {
        background-color: #ecf5ff
    }

    &.el-table--enable-row-transition .el-table__body div[node="td"].el-table__cell {
        -webkit-transition: background-color .25s ease;
        transition: background-color .25s ease
    }

    &.el-table--enable-row-hover .el-table__body div[node="tr"]:hover>div[node="td"].el-table__cell {
        background-color: #F5F7FA
    }

}
</style>