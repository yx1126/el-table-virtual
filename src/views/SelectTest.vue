<template>
    <div class="select">
        <el-select-v2 v-model="value" :options="data" filterable :props="{ label: 'label', value: 'id' }" />
        <p>value: {{ value }}</p>
    </div>
</template>

<script setup name="SelectTest22">
import { ref } from "vue"
const data = Array.from({ length: 1000 }, (_, i) => {
    return {
        id: "id-" + i,
        label: "王小虎" + i,
        date: "2016-05-03",
        province: "上海",
        city: "普陀区",
        address: "上海市普陀区金沙江路 1518 弄",
        zip: 200333
    }
})
const value = ref("");
</script>

<style lang="scss" scoped>
.select {
    padding: 50px;
    display: flex;
    justify-content: center;
    gap: 20px;
}
.text {
    white-space: pre-wrap;
}
</style>