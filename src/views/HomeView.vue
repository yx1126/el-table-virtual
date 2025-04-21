<template>
    <div>
        <div class="table">
            <el-table :virtual="true" :data="data" height="300" border stripe>
                <el-table-column fixed type="index" label="#" width="80" align="center" />
                <el-table-column fixed prop="id" label="id" width="80" align="center" />
                <el-table-column prop="date" label="日期1" width="300">
                    <el-table-column prop="date" label="日期1-1" width="150" />
                    <el-table-column prop="date" label="日期1-2" width="150" />
                </el-table-column>
                <el-table-column prop="date" label="日期" width="150" />
                <el-table-column prop="name" label="姓名" width="120" />
                <el-table-column prop="province" label="省份" width="120" />
                <el-table-column prop="city" label="市区" width="120" />
                <el-table-column prop="address" label="地址" width="300" />
                <el-table-column prop="zip" label="邮编" width="120" />
                <el-table-column fixed="right" label="操作" width="120">
                    <template #default="{ row, $index }">
                        <el-button type="text" size="small" @click.native.prevent="deleteRow(row, $index)">
                            移除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        <!-- <div class="table">
            <el-table :virtual="false" :data="data" height="400" border stripe>
                <el-table-column fixed prop="id" label="id" width="80" align="center" />
                <el-table-column prop="date" label="日期" width="150" />
                <el-table-column prop="name" label="姓名" width="120" />
                <el-table-column prop="province" label="省份" width="120" />
                <el-table-column prop="city" label="市区" width="120" />
                <el-table-column prop="address" label="地址" width="300" />
                <el-table-column prop="zip" label="邮编" width="120" />
                <el-table-column fixed="right" label="操作" width="120">
                    <template #default="{ row, $index }">
                        <el-button type="text" size="small" @click.native.prevent="deleteRow(row, $index)">
                            移除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div> -->
    </div>
</template>

<script setup>
const data = Array.from({ length: 1000 }, (_, i) => {
    return {
        id: "id-" + i,
        name: "王小虎" + i,
        date: "2016-05-03",
        province: "上海",
        city: "普陀区",
        address: "上海市普陀区金沙江路 1518 弄",
        zip: 200333
    }
})

function deleteRow(row, index) {
    console.log(row, index);
}
</script>

<style lang="scss" scoped>
.table {
    width: 1000px;
    margin: 50px auto;
}
</style>