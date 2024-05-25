
import { defineComponent } from "vue";
import { Table, Tooltip } from "element-ui";
import VirtualBody from "./VirtualBody"
import { getRowIdentity } from "element-ui/packages/table/src/util";
import { addClass, removeClass } from "element-ui/src/utils/dom";
import TableRow from "./table-row";

const TableBody = Table.components.TableBody;

export default defineComponent({
    name: TableBody.name,
    components: { TableRow },
    extends: TableBody,
    watch: {
        // don't trigger getter of currentRow in getCellClass. see https://jsfiddle.net/oe2b4hqt/
        // update DOM manually. see https://github.com/ElemeFE/element/pull/13954/files#diff-9b450c00d0a9dec0ffad5a3176972e40
        "store.states.hoverRow"(newVal, oldVal) {
            if (!this.store.states.isComplex || this.$isServer) return;
            const virtual = this.table.virtual;
            let raf = window.requestAnimationFrame;
            if (!raf) {
                raf = (fn) => setTimeout(fn, 16);
            }
            raf(() => {
                const rows = this.$el.querySelectorAll(".el-table__row");
                const oldRow = virtual ? this.$el.querySelector(`.el-table__row[row-index="${oldVal}"]`) : rows[oldVal];
                const newRow = virtual ? this.$el.querySelector(`.el-table__row[row-index="${newVal}"]`) : rows[newVal];
                if (oldRow) {
                    removeClass(oldRow, "hover-row");
                }
                if (newRow) {
                    addClass(newRow, "hover-row");
                }
            });
        }
    },
    methods: {
        wrappedRowRender(row, $index) {
            const store = this.store;
            const { isRowExpanded, assertRowKey } = store;
            const { treeData, lazyTreeNodeMap, childrenColumnName, rowKey } = store.states;
            if (this.hasExpandColumn && isRowExpanded(row)) {
                const renderExpanded = this.table.renderExpanded;
                const tr = this.rowRender(row, $index);
                if (!renderExpanded) {
                    console.error("[Element Error]renderExpanded is required.");
                    return tr;
                }
                // 使用二维数组，避免修改 $index
                return [[
                    tr,
                    <div node="tr" key={"expanded-row__" + tr.key}>
                        <div node="td" colspan={ this.columnsCount } class="el-table__cell el-table__expanded-cell">
                            { renderExpanded(this.$createElement, { row, $index, store: this.store }) }
                        </div>
                    </div>]];
            } else if (Object.keys(treeData).length) {
                assertRowKey();
                // TreeTable 时，rowKey 必须由用户设定，不使用 getKeyOfRow 计算
                // 在调用 rowRender 函数时，仍然会计算 rowKey，不太好的操作
                const key = getRowIdentity(row, rowKey);
                let cur = treeData[key];
                let treeRowData = null;
                if (cur) {
                    treeRowData = {
                        expanded: cur.expanded,
                        level: cur.level,
                        display: true
                    };
                    if (typeof cur.lazy === "boolean") {
                        if (typeof cur.loaded === "boolean" && cur.loaded) {
                            treeRowData.noLazyChildren = !(cur.children && cur.children.length);
                        }
                        treeRowData.loading = cur.loading;
                    }
                }
                const tmp = [this.rowRender(row, $index, treeRowData)];
                // 渲染嵌套数据
                if (cur) {
                    // currentRow 记录的是 index，所以还需主动增加 TreeTable 的 index
                    let i = 0;
                    const traverse = (children, parent) => {
                        if (!(children && children.length && parent)) return;
                        children.forEach(node => {
                            // 父节点的 display 状态影响子节点的显示状态
                            const innerTreeRowData = {
                                display: parent.display && parent.expanded,
                                level: parent.level + 1
                            };
                            const childKey = getRowIdentity(node, rowKey);
                            if (childKey === undefined || childKey === null) {
                                throw new Error("for nested data item, row-key is required.");
                            }
                            cur = { ...treeData[childKey] };
                            // 对于当前节点，分成有无子节点两种情况。
                            // 如果包含子节点的，设置 expanded 属性。
                            // 对于它子节点的 display 属性由它本身的 expanded 与 display 共同决定。
                            if (cur) {
                                innerTreeRowData.expanded = cur.expanded;
                                // 懒加载的某些节点，level 未知
                                cur.level = cur.level || innerTreeRowData.level;
                                cur.display = !!(cur.expanded && innerTreeRowData.display);
                                if (typeof cur.lazy === "boolean") {
                                    if (typeof cur.loaded === "boolean" && cur.loaded) {
                                        innerTreeRowData.noLazyChildren = !(cur.children && cur.children.length);
                                    }
                                    innerTreeRowData.loading = cur.loading;
                                }
                            }
                            i++;
                            tmp.push(this.rowRender(node, $index + i, innerTreeRowData));
                            if (cur) {
                                const nodes = lazyTreeNodeMap[childKey] || node[childrenColumnName];
                                traverse(nodes, cur);
                            }
                        });
                    };
                    // 对于 root 节点，display 一定为 true
                    cur.display = true;
                    const nodes = lazyTreeNodeMap[key] || row[childrenColumnName];
                    traverse(nodes, cur);
                }
                return tmp;
            } else {
                return this.rowRender(row, $index);
            }
        },
        rowRender(row, $index, treeRowData) {
            const { treeIndent, columns, firstDefaultColumnIndex } = this;
            const rowClasses = this.getRowClass(row, $index);
            let display = true;
            if (treeRowData) {
                rowClasses.push("el-table__row--level-" + treeRowData.level);
                display = treeRowData.display;
            }
            // 指令 v-show 会覆盖 row-style 中 display
            // 使用 :style 代替 v-show https://github.com/ElemeFE/element/issues/16995
            let displayStyle = display ? null : {
                display: "none"
            };
            return (
                <TableRow
                    style={[displayStyle, this.getRowStyle(row, $index)]}
                    class={rowClasses}
                    key={this.getKeyOfRow(row, $index)}
                    nativeOn-dblclick={($event) => this.handleDoubleClick($event, row)}
                    nativeOn-click={($event) => this.handleClick($event, row)}
                    nativeOn-contextmenu={($event) => this.handleContextMenu($event, row)}
                    nativeOn-mouseenter={() => this.handleMouseEnter($index)}
                    nativeOn-mouseleave={this.handleMouseLeave}
                    columns={columns}
                    row={row}
                    index={$index}
                    store={this.store}
                    context={this.context || this.table.$vnode.context}
                    firstDefaultColumnIndex={firstDefaultColumnIndex}
                    treeRowData={treeRowData}
                    treeIndent={treeIndent}
                    columnsHidden={this.columnsHidden}
                    getSpan={this.getSpan}
                    getColspanRealWidth={this.getColspanRealWidth}
                    getCellStyle={this.getCellStyle}
                    getCellClass={this.getCellClass}
                    handleCellMouseEnter={this.handleCellMouseEnter}
                    handleCellMouseLeave={this.handleCellMouseLeave}
                    isSelected={this.store.isSelected(row)}
                    isExpanded={this.store.states.expandRows.indexOf(row) > -1}
                    fixed={this.fixed}
                >
                </TableRow>
            );
        },
        scrollToOffset(offset) {
            if(!this.table.virtual) return;
            this.$refs["virtualBodyRef"].scrollToOffset(offset);
        }
    },
    render(h) {
        const data = this.data || [];
        const tip = h(Tooltip, {
            ref: "tooltip",
            props: { 
                effect: this.table.tooltipEffect,
                placement: "top",
                content: this.tooltipContent,
            },
            slot: "footer"
        });
        const colgroup = h("colgroup", null, this.columns.map(column => h("col", { attrs: { name: column.id }, key: column.id })));

        if(this.table.virtual) {
            const gutterWidth = this.table.layout.gutterWidth;
            const width = this.fixed ? `calc(${this.table.bodyWidth} + ${gutterWidth}px)` : this.table.bodyWidth;
            return h(VirtualBody, {
                class: "el-table__body el-table-virtual__body",
                ref: "virtualBodyRef",
                attrs: {
                    cellspacing: "0",
                    cellpadding: "0",
                    border: "0"
                },
                style: {
                    width: this.fixed ? `calc(100% + ${gutterWidth}px)` : "100%",
                    marginRight: this.fixed ? -gutterWidth + "px" : undefined
                },
                props: {
                    dataKey: this.getKeyOfRow,
                    dataSources: data,
                    dataComponent: {},
                    wrapClass: "el-table-virtual__body-main",
                    wrapStyle: { width }
                },
                scopedSlots: {
                    item: ({ item, index }) => this.wrappedRowRender(item, index)
                },
            }, [tip]);
        }

        return h("table", {
            class: "el-table__body",
            attrs: {
                cellspacing: "0",
                cellpadding: "0",
                border: "0"
            },
            style: { width: this.table.bodyWidth }
        },[
            colgroup,
            h("tbody", null, [
                data.reduce((acc, row) => {
                    return acc.concat(this.wrappedRowRender(row, acc.length));
                }, []),
                tip
            ])
        ]);
    }
});