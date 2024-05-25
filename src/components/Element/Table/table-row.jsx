import { Table } from "element-ui";
import { defineComponent } from "vue";

const TableRow = Table.components.TableBody.components.TableRow;

export default defineComponent({
    name: TableRow.name,
    extends: TableRow,
    computed: {
        table() {
            let parent = this.$parent;
            while (parent.$options.tableId !== "ElTable") {
                parent = parent.$parent;
            }
            return parent;
        },
    },
    render() {
        const {
            table,
            columns,
            row,
            index: $index,
            store,
            context,
            firstDefaultColumnIndex,
            treeRowData,
            treeIndent,
            columnsHidden = [],
            isSelected,
            isExpanded
        } = this;
        const tds = columns.map((column, cellIndex) => {
            const { rowspan, colspan } = this.getSpan(row, column, $index, cellIndex);
            if (!rowspan || !colspan) {
                return null;
            }
            const columnData = { ...column };
            columnData.realWidth = this.getColspanRealWidth(columns, colspan, cellIndex);
            const data = {
                store,
                isSelected,
                isExpanded,
                _self: context,
                column: columnData,
                row,
                $index
            };
            if (cellIndex === firstDefaultColumnIndex && treeRowData) {
                data.treeNode = {
                    indent: treeRowData.level * treeIndent,
                    level: treeRowData.level
                };
                if (typeof treeRowData.expanded === "boolean") {
                    data.treeNode.expanded = treeRowData.expanded;
                    // 表明是懒加载
                    if ("loading" in treeRowData) {
                        data.treeNode.loading = treeRowData.loading;
                    }
                    if ("noLazyChildren" in treeRowData) {
                        data.treeNode.noLazyChildren = treeRowData.noLazyChildren;
                    }
                }
            }
            const cells = column.renderCell.call(
                this._renderProxy,
                this.$createElement,
                data,
                columnsHidden[cellIndex]
            );
            if(table.virtual) {
                return (
                    <div node="td"
                        style={[{ 
                            width: `${column.realWidth}px`,
                            minWidth: `${column.realWidth}px`,
                        }, this.getCellStyle($index, cellIndex, row, column)]}
                        class={["el-table-virtual__cell", this.getCellClass($index, cellIndex, row, column)]}
                        rowspan={rowspan}
                        colspan={colspan}
                        on-mouseenter={($event) => this.handleCellMouseEnter($event, row)}
                        on-mouseleave={this.handleCellMouseLeave}
                    >{cells}</div>
                );
            }
            return (
                <td 
                    style={this.getCellStyle($index, cellIndex, row, column)}
                    class={this.getCellClass($index, cellIndex, row, column)}
                    rowspan={rowspan}
                    colspan={colspan}
                    on-mouseenter={($event) => this.handleCellMouseEnter($event, row)}
                    on-mouseleave={this.handleCellMouseLeave}
                >{cells}</td>
            );
        })
        if(table.virtual) {
            return (<div class="el-table-virtual__row" row-index={$index} node="tr">{tds}</div>);
        }
        return (<tr>{tds}</tr>);
    }
});