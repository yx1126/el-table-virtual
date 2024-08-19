<template>
    <li class="el-select-group__title">{{ label }}</li>
</template>

<script>

export default {
    name: "ElOptionGroup",
    componentName: "ElOptionGroup",
    props: {
        label: String,
        disabled: {
            type: Boolean,
            default: false
        }
    },
};
</script>
