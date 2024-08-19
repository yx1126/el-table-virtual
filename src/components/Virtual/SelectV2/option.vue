<template>
    <li
        class="el-select-dropdown__item"
        :class="{
            'selected': itemSelected,
            'is-disabled': disabled || limitReached,
            'hover': hover
        }"
        @mouseenter="hoverItem"
        @click.stop="selectOptionClick"
    >
        <slot>
            <span>{{ currentLabel }}</span>
        </slot>
    </li>
</template>

<script>
import Emitter from "element-ui/src/mixins/emitter";
import { getValueByPath } from "element-ui/src/utils/util";

export default {
    name: "ElOption",
    mixins: [Emitter],
    componentName: "ElOption",
    inject: ["select"],
    props: {
        value: {
            required: true
        },
        label: [String, Number],
        created: Boolean,
        disabled: {
            type: Boolean,
            default: false
        },
        virtualIndex: {
            type: Number,
            default: -1
        },
    },
    data() {
        return {
            index: -1,
            hitState: false,
            hover: false
        };
    },
    computed: {
        isObject() {
            return Object.prototype.toString.call(this.value).toLowerCase() === '[object object]';
        },
        currentLabel() {
            return this.label || (this.isObject ? '' : this.value);
        },
        currentValue() {
            return this.value || this.label || '';
        },
        itemSelected() {
            if (!this.select.multiple) {
                return this.isEqual(this.value, this.select.value);
            } else {
                return this.contains(this.select.value, this.value);
            }
        },
        limitReached() {
            if (this.select.multiple) {
                return !this.itemSelected &&
                    (this.select.value || []).length >= this.select.multipleLimit &&
                    this.select.multipleLimit > 0;
            } else {
                return false;
            }
        }
    },

    watch: {
        currentLabel() {
            if (!this.created && !this.select.remote) this.dispatch("ElSelect", "setSelected");
        },
        value(val, oldVal) {
            const { remote, valueKey } = this.select;
            if (!this.created && !remote) {
                if (valueKey && typeof val === 'object' && typeof oldVal === 'object' && val[valueKey] === oldVal[valueKey]) {
                    return;
                }
                this.dispatch('ElSelect', 'setSelected');
            }
        }
    },

    methods: {
        isEqual(a, b) {
            if (!this.isObject) {
                return a === b;
            } else {
                const valueKey = this.select.valueKey;
                return getValueByPath(a, valueKey) === getValueByPath(b, valueKey);
            }
        },

        contains(arr = [], target) {
            if (!this.isObject) {
                return arr && arr.indexOf(target) > -1;
            } else {
                const valueKey = this.select.valueKey;
                return arr && arr.some(item => {
                    return getValueByPath(item, valueKey) === getValueByPath(target, valueKey);
                });
            }
        },

        hoverItem() {
            if (!this.disabled) {
                this.select.hoverIndex = this.virtualIndex;
            }
        },

        selectOptionClick() {
            if (this.disabled !== true) {
                this.dispatch('ElSelect', 'handleOptionClick', [this, true]);
            }
        },
    }
};
</script>
