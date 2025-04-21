<template>
    <div
        v-clickoutside="handleClose"
        class="el-select"
        :class="[
            selectSize ? 'el-select--' + selectSize : '',
            multiple ? 'el-select--multiple' : '',
            filterable ? 'el-select--filterable' : '',
            collapseTags ? 'el-select--collapse' : '',
            'el-select--virtual',
        ]"
        @click.stop="toggleMenu"
    >
        <div
            v-if="multiple"
            ref="tags"
            class="el-select__tags"
            :style="{ 'max-width': inputWidth - 32 + 'px', width: '100%' }"
        >
            <span v-if="collapseTags && selected.length">
                <el-tag
                    :closable="!selectDisabled"
                    :size="collapseTagSize"
                    :hit="selected[0].hitState"
                    type="info"
                    disable-transitions
                    @close="deleteTag($event, selected[0])"
                >
                    <span class="el-select__tags-text">{{ selected[0].currentLabel }}</span>
                </el-tag>
                <el-tag
                    v-if="selected.length > 1"
                    :closable="false"
                    :size="collapseTagSize"
                    type="info"
                    disable-transitions
                >
                    <span class="el-select__tags-text">+ {{ selected.length - 1 }}</span>
                </el-tag>
            </span>
            <transition-group v-if="!collapseTags" @after-leave="resetInputHeight">
                <el-tag
                    v-for="item in selected"
                    :key="getValueKey(item)"
                    :closable="!selectDisabled"
                    :size="collapseTagSize"
                    :hit="item.hitState"
                    type="info"
                    disable-transitions
                    @close="deleteTag($event, item)"
                >
                    <span class="el-select__tags-text">{{ item.currentLabel }}</span>
                </el-tag>
            </transition-group>
            <input
                v-if="filterable"
                ref="input"
                v-model="query"
                type="text"
                class="el-select__input test_0"
                :class="[selectSize ? `is-${selectSize}` : '']"
                :disabled="selectDisabled"
                :autocomplete="autoComplete || autocomplete"
                :style="{ 'flex-grow': '1', width: inputLength / (inputWidth - 32) + '%', 'max-width': inputWidth - 42 + 'px' }"
                @focus="handleFocus"
                @blur="softFocus = false"
                @keyup="managePlaceholder"
                @keydown="resetInputState"
                @keydown.down.prevent="handleNavigate('next')"
                @keydown.up.prevent="handleNavigate('prev')"
                @keydown.enter.prevent="selectOption"
                @keydown.esc.stop.prevent="visible = false"
                @keydown.delete="deletePrevTag"
                @keydown.tab="visible = false"
                @compositionstart="handleComposition"
                @compositionupdate="handleComposition"
                @compositionend="handleComposition"
                @input="debouncedQueryChange"
            >
        </div>
        <el-input
            :id="id"
            ref="reference"
            v-model="selectedLabel"
            type="text"
            :placeholder="currentPlaceholder"
            :name="name"
            :autocomplete="autoComplete || autocomplete"
            :size="selectSize"
            :disabled="selectDisabled"
            :readonly="readonly"
            :validate-event="false"
            :class="{ 'is-focus': visible }"
            :tabindex="(multiple && filterable) ? '-1' : null"
            @focus="handleFocus"
            @blur="handleBlur"
            @input="debouncedOnInputChange"
            @keydown.native.down.stop.prevent="handleNavigate('next')"
            @keydown.native.up.stop.prevent="handleNavigate('prev')"
            @keydown.native.enter.prevent="selectOption"
            @keydown.native.esc.stop.prevent="visible = false"
            @keydown.native.tab="visible = false"
            @compositionstart="handleComposition"
            @compositionupdate="handleComposition"
            @compositionend="handleComposition"
            @mouseenter.native="inputHovering = true"
            @mouseleave.native="inputHovering = false"
        >
            <template v-if="$slots.prefix" #prefix>
                <slot name="prefix"></slot>
            </template>
            <template #suffix>
                <i v-show="!showClose" :class="['el-select__caret', 'el-input__icon', 'el-icon-' + iconClass]"></i>
                <i
                    v-if="showClose"
                    class="el-select__caret el-input__icon el-icon-circle-close"
                    @click="handleClearClick"
                ></i>
            </template>
        </el-input>
        <transition name="el-zoom-in-top" @before-enter="handleMenuEnter" @after-leave="doDestroy">
            <el-select-menu v-show="visible && emptyText !== false" ref="popper" :append-to-body="popperAppendToBody">
                <div v-show="filteredOptions.length > 0 && !loading" class="el-select-dropdown__virtual">
                    <virtual-scroll
                        ref="virtualRef"
                        v-bind="virtualProps"
                        :class="{ 'is-empty': !allowCreate && query && filteredOptionsCount === 0 }"
                        :data="filteredOptions"
                        wrap-class="el-select-dropdown__wrap"
                        list-tag="ul"
                        list-class="el-select-dropdown__list"
                        list-style="padding: 0;"
                    >
                        <template #default="{ item, index: virtualIndex, uniqueKey }">
                            <v-group
                                v-if="item.type === 'group'"
                                :key="uniqueKey"
                                :style="{
                                    height: virtual.minItemSize + 'px',
                                    lineHeight: virtual.minItemSize + 'px',
                                }"
                                :label="item[optionsProps.label]"
                                :disabled="item.disabled"
                            />
                            <v-option
                                v-else
                                :key="uniqueKey"
                                :label="item[optionsProps.label]"
                                :title="item[optionsProps.label]"
                                :value="item[optionsProps.value]"
                                :disabled="item.disabled"
                                :virtual-index="virtualIndex"
                                :created="item.created"
                            />
                        </template>
                    </virtual-scroll>
                </div>
                <template
                    v-if="emptyText && (!allowCreate || loading || (allowCreate && filteredOptions.length === 0))"
                >
                    <slot v-if="$slots.empty" name="empty"></slot>
                    <p v-else class="el-select-dropdown__empty">
                        {{ emptyText }}
                    </p>
                </template>
            </el-select-menu>
        </transition>
    </div>
</template>

<script>
import Emitter from "element-ui/src/mixins/emitter"
import Focus from "element-ui/src/mixins/focus"
import Locale from "element-ui/src/mixins/locale"
import { Select, Input as ElInput, Tag as ElTag } from "element-ui"
import { debounce } from "./"
import Clickoutside from "element-ui/src/utils/clickoutside"
import { addResizeListener, removeResizeListener } from "element-ui/src/utils/resize-event"
import { getValueByPath, valueEquals, isIE, isEdge, escapeRegexpString } from "element-ui/src/utils/util"
import NavigationMixin from "element-ui/packages/select/src/navigation-mixin"
import { isKorean } from "element-ui/src/utils/shared"
import VirtualScroll from "@/components/VirtualScrollList"
import ElOption from "./option.vue"
import ElOptionGroup from "./option-group.vue"

export default {
    name: "ElSelect",
    components: { ElInput, ElSelectMenu: Select.components.ElSelectMenu, ElTag, VirtualScroll, VOption: ElOption, VGroup: ElOptionGroup },
    directives: { Clickoutside },
    mixins: [Emitter, Locale, Focus("reference"), NavigationMixin],
    componentName: "ElSelect",
    inject: {
        elForm: { default: "" },
        elFormItem: { default: "" },
    },
    provide() {
        return {
            select: this,
        }
    },
    props: {
        options: { type: Array, default: () => [] },
        name: String,
        id: String,

        value: {
            required: true,
        },
        autocomplete: {
            type: String,
            default: "off",
        },
        /** @Deprecated in next major version */
        autoComplete: {
            type: String,
            validator() {
                process.env.NODE_ENV !== "production" && console.warn("[Element Warn][Select]'auto-complete' property will be deprecated in next major version. please use 'autocomplete' instead.")
                return true
            },
        },
        automaticDropdown: Boolean,
        size: String,
        disabled: Boolean,
        clearable: Boolean,
        filterable: Boolean,
        allowCreate: Boolean,
        loading: Boolean,
        popperClass: String,
        remote: Boolean,
        loadingText: String,
        noMatchText: String,
        noDataText: String,
        remoteMethod: Function,
        filterMethod: Function,
        multiple: Boolean,
        multipleLimit: {
            type: Number,
            default: 0,
        },
        placeholder: {
            type: String,
            required: false,
        },
        defaultFirstOption: Boolean,
        reserveKeyword: Boolean,
        valueKey: {
            type: String,
            default: "value",
        },
        collapseTags: Boolean,
        popperAppendToBody: {
            type: Boolean,
            default: true,
        },
        virtual: Object,
        props: Object,
    },
    data() {
        return {
            optionsList: [],
            createdLabel: null,
            createdSelected: false,
            selected: this.multiple ? [] : {},
            inputLength: 20,
            inputWidth: 0,
            initialInputHeight: 0,
            cachedPlaceHolder: "",
            filteredOptionsCount: 0,
            visible: false,
            softFocus: false,
            selectedLabel: "",
            hoverIndex: -1,
            query: "",
            previousQuery: null,
            inputHovering: false,
            currentPlaceholder: "",
            menuVisibleOnFocus: false,
            isOnComposition: false,
            isSilentBlur: false,
            filterQuery: "",
        }
    },

    computed: {
        optionsProps() {
            return Object.assign({
                label: "label",
                value: "value",
            }, this.props)
        },
        virtualProps() {
            return Object.assign({ dataKey: this.optionsProps.value, minItemSize: 34 }, this.virtual)
        },
        filteredOptions() {
            const { filterQuery: query, onQueryOption, optionsProps } = this
            return this.optionsList.reduce((pre, option) => {
                if(Array.isArray(option.options)) {
                    const options = query ? option.options.filter(v => onQueryOption(query, v)) : option.options
                    if(options.length > 0) {
                        pre.push({ ...option, type: "group", value: option[optionsProps.value] || option[optionsProps.label] }, ...options)
                    }
                } else {
                    if(query) {
                        if(onQueryOption(query, option)) {
                            pre.push(option)
                        }
                    } else {
                        pre.push(option)
                    }
                }
                return pre
            }, [])
        },
        _elFormItemSize() {
            return (this.elFormItem || {}).elFormItemSize
        },

        readonly() {
            return !this.filterable || this.multiple || (!isIE() && !isEdge() && !this.visible)
        },

        showClose() {
            const hasValue = this.multiple
                ? Array.isArray(this.value) && this.value.length > 0
                : this.value !== undefined && this.value !== null && this.value !== ""
            const criteria = this.clearable
                && !this.selectDisabled
                && this.inputHovering
                && hasValue
            return criteria
        },

        iconClass() {
            return this.remote && this.filterable ? "" : (this.visible ? "arrow-up is-reverse" : "arrow-up")
        },

        debounce() {
            return this.remote ? 300 : 0
        },

        emptyText() {
            if(this.loading) {
                return this.loadingText || this.t("el.select.loading")
            }
            if(this.remote && this.query === "" && this.filteredOptions.length === 0) return false
            if(this.filterable && this.query && this.optionsList.length > 0 && this.filteredOptions.length <= 0) {
                return this.noMatchText || this.t("el.select.noMatch")
            }
            if(this.filteredOptions.length === 0) {
                return this.noDataText || this.t("el.select.noData")
            }

            return null
        },

        showNewOption() {
            const hasExistingOption = this.filteredOptions.filter(option => !option.created)
                .some(option => option.currentLabel === this.query)
            return this.filterable && this.allowCreate && this.query !== "" && !hasExistingOption
        },

        selectSize() {
            return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size
        },

        selectDisabled() {
            return this.disabled || (this.elForm || {}).disabled
        },

        collapseTagSize() {
            return ["small", "mini"].indexOf(this.selectSize) > -1
                ? "mini"
                : "small"
        },
        propPlaceholder() {
            return typeof this.placeholder !== "undefined" ? this.placeholder : this.t("el.select.placeholder")
        },
    },

    watch: {
        options: {
            handler(val) {
                this.optionsList = val.slice()
            },
            immediate: true,
            deep: true,
        },
        selectDisabled() {
            this.$nextTick(() => {
                this.resetInputHeight()
            })
        },

        propPlaceholder(val) {
            this.cachedPlaceHolder = this.currentPlaceholder = val
        },

        value(val, oldVal) {
            if(this.multiple) {
                this.resetInputHeight()
                if((val && val.length > 0) || (this.$refs.input && this.query !== "")) {
                    this.currentPlaceholder = ""
                } else {
                    this.currentPlaceholder = this.cachedPlaceHolder
                }
                if(this.filterable && !this.reserveKeyword) {
                    this.query = ""
                    this.handleQueryChange(this.query)
                }
            }
            this.setSelected()
            if(this.filterable && !this.multiple) {
                this.inputLength = 20
            }
            if(!valueEquals(val, oldVal)) {
                this.dispatch("ElFormItem", "el.form.change", val)
            }
        },

        visible(val) {
            if(!val) {
                this.broadcast("ElSelectDropdown", "destroyPopper")
                if(this.$refs.input) {
                    this.$refs.input.blur()
                }
                this.query = ""
                this.previousQuery = null
                this.selectedLabel = ""
                this.inputLength = 20
                this.menuVisibleOnFocus = false
                this.resetHoverIndex()
                this.$nextTick(() => {
                    if(this.$refs.input
                        && this.$refs.input.value === ""
                        && this.selected.length === 0) {
                        this.currentPlaceholder = this.cachedPlaceHolder
                    }
                })
                if(!this.multiple) {
                    if(this.selected) {
                        if(this.filterable && this.allowCreate
                            && this.createdSelected && this.createdLabel) {
                            this.selectedLabel = this.createdLabel
                        } else {
                            this.selectedLabel = this.selected.currentLabel
                        }
                        if(this.filterable) this.query = this.selectedLabel
                    }

                    if(this.filterable) {
                        this.currentPlaceholder = this.cachedPlaceHolder
                    }
                }
            } else {
                this.broadcast("ElSelectDropdown", "updatePopper")
                if(this.filterable) {
                    this.query = this.remote ? "" : this.selectedLabel
                    this.handleQueryChange(this.query)
                    if(this.multiple) {
                        this.$refs.input.focus()
                    } else {
                        if(!this.remote) {
                            this.queryChange("")
                        }
                        if(this.selectedLabel) {
                            this.currentPlaceholder = this.selectedLabel
                            this.selectedLabel = ""
                        }
                    }
                }
            }
            this.$emit("visible-change", val)
        },
        optionsList() {
            if(this.$isServer) return
            this.$nextTick(() => {
                this.broadcast("ElSelectDropdown", "updatePopper")
            })
            if(this.multiple) {
                this.resetInputHeight()
            }
            const inputs = this.$el.querySelectorAll("input")
            if([].indexOf.call(inputs, document.activeElement) === -1) {
                this.setSelected()
            }
            if(this.defaultFirstOption && (this.filterable || this.remote) && this.filteredOptionsCount) {
                this.checkDefaultFirstOption()
            }
        },
    },

    created() {
        this.cachedPlaceHolder = this.currentPlaceholder = this.propPlaceholder
        if(this.multiple && !Array.isArray(this.value)) {
            this.$emit("input", [])
        }
        if(!this.multiple && Array.isArray(this.value)) {
            this.$emit("input", "")
        }

        this.debouncedOnInputChange = debounce(this.debounce, () => {
            this.onInputChange()
        })

        this.debouncedQueryChange = debounce(this.debounce, e => {
            this.handleQueryChange(e.target.value)
        })

        this.$on("handleOptionClick", this.handleOptionSelect)
        this.$on("setSelected", this.setSelected)
    },

    mounted() {
        if(this.multiple && Array.isArray(this.value) && this.value.length > 0) {
            this.currentPlaceholder = ""
        }
        addResizeListener(this.$el, this.handleResize)

        const reference = this.$refs.reference
        if(reference && reference.$el) {
            const sizeMap = {
                medium: 36,
                small: 32,
                mini: 28,
            }
            const input = reference.$el.querySelector("input")
            this.initialInputHeight = input.getBoundingClientRect().height || sizeMap[this.selectSize]
        }
        if(this.remote && this.multiple) {
            this.resetInputHeight()
        }
        this.$nextTick(() => {
            if(reference && reference.$el) {
                this.inputWidth = reference.$el.getBoundingClientRect().width
            }
        })
        this.setSelected()
    },

    beforeUnmount() {
        if(this.$el && this.handleResize) removeResizeListener(this.$el, this.handleResize)
    },

    methods: {
        queryChange(query) {
            this.filterQuery = query
        },
        onQueryOption(query, option) {
            const { label, value } = this.optionsProps
            const currentLabel = option[label] || (Object.prototype.toString.call(option[value]).toLowerCase() === "[object object]" ? "" : option.value)
            return new RegExp(escapeRegexpString(query), "i").test(currentLabel) || option.created
        },
        handleNavigate(direction) {
            if(this.isOnComposition) return

            this.navigateOptions(direction)
        },
        handleComposition(event) {
            const text = event.target.value
            if(event.type === "compositionend") {
                this.isOnComposition = false
                this.$nextTick(_ => this.handleQueryChange(text))
            } else {
                const lastCharacter = text[text.length - 1] || ""
                this.isOnComposition = !isKorean(lastCharacter)
            }
        },
        handleQueryChange(val) {
            if(this.previousQuery === val || this.isOnComposition) return
            if(
                this.previousQuery === null
                && (typeof this.filterMethod === "function" || typeof this.remoteMethod === "function")
            ) {
                this.previousQuery = val
                return
            }
            this.previousQuery = val
            this.$nextTick(() => {
                if(this.visible) this.broadcast("ElSelectDropdown", "updatePopper")
            })
            this.hoverIndex = -1
            if(this.multiple && this.filterable) {
                this.$nextTick(() => {
                    const length = this.$refs.input.value.length * 15 + 20
                    this.inputLength = this.collapseTags ? Math.min(50, length) : length
                    this.managePlaceholder()
                    this.resetInputHeight()
                })
            }
            if(this.remote && typeof this.remoteMethod === "function") {
                this.hoverIndex = -1
                this.remoteMethod(val)
            } else if(typeof this.filterMethod === "function") {
                this.filterMethod(val)
                this.queryChange()
            } else {
                this.queryChange(val)
            }
            if(this.defaultFirstOption && (this.filterable || this.remote) && this.filteredOptionsCount) {
                this.checkDefaultFirstOption()
            }
        },

        scrollToOption(option) {
            const index = Array.isArray(option) && option[0] ? option[0].virtualIndex : option.virtualIndex
            this.$refs["virtualRef"].scrollToIndex(index)
        },

        handleMenuEnter() {
            this.$nextTick(() => {
                this.$refs["virtualRef"].update()
                this.scrollToOption(this.selected)
            })
        },

        emitChange(val) {
            if(!valueEquals(this.value, val)) {
                this.$emit("change", val)
            }
        },

        getOption(value) {
            let option
            const isObject = Object.prototype.toString.call(value).toLowerCase() === "[object object]"
            const isNull = Object.prototype.toString.call(value).toLowerCase() === "[object null]"
            const isUndefined = Object.prototype.toString.call(value).toLowerCase() === "[object undefined]"

            for(let i = this.filteredOptions.length - 1; i >= 0; i--) {
                const cachedOption = this.filteredOptions[i]
                if(!cachedOption.virtualIndex) {
                    cachedOption.virtualIndex = i
                }
                cachedOption.currentLabel = cachedOption[this.optionsProps.label]
                const isEqual = isObject
                    ? getValueByPath(cachedOption[this.optionsProps.value], this.valueKey) === getValueByPath(value, this.valueKey)
                    : cachedOption[this.optionsProps.value] === value
                if(isEqual) {
                    option = cachedOption
                    break
                }
            }
            if(option) return option
            const label = (!isObject && !isNull && !isUndefined)
                ? String(value)
                : ""
            const newOption = {
                value: value,
                currentLabel: label,
                virtualIndex: 0,
            }
            if(this.multiple) {
                newOption.hitState = false
            }
            return newOption
        },

        setSelected() {
            if(!this.multiple) {
                const option = this.getOption(this.value)
                if(option.created) {
                    this.createdLabel = option.currentLabel
                    this.createdSelected = true
                } else {
                    this.createdSelected = false
                }
                this.selectedLabel = option.currentLabel
                this.selected = option
                if(this.filterable) this.query = this.selectedLabel
                return
            }
            const result = []
            if(Array.isArray(this.value)) {
                this.value.forEach(value => {
                    result.push(this.getOption(value))
                })
            }
            this.selected = result
            this.$nextTick(() => {
                this.resetInputHeight()
            })
        },

        handleFocus(event) {
            if(!this.softFocus) {
                if(this.automaticDropdown || this.filterable) {
                    if(this.filterable && !this.visible) {
                        this.menuVisibleOnFocus = true
                    }
                    this.visible = true
                }
                this.$emit("focus", event)
            } else {
                this.softFocus = false
            }
        },

        blur() {
            this.visible = false
            this.$refs.reference.blur()
        },

        handleBlur(event) {
            setTimeout(() => {
                if(this.isSilentBlur) {
                    this.isSilentBlur = false
                } else {
                    this.$emit("blur", event)
                }
            }, 50)
            this.softFocus = false
        },

        handleClearClick(event) {
            this.deleteSelected(event)
        },

        doDestroy() {
            this.$refs.popper && this.$refs.popper.doDestroy()
        },

        handleClose() {
            this.visible = false
        },

        toggleLastOptionHitState(hit) {
            if(!Array.isArray(this.selected)) return
            const option = this.selected[this.selected.length - 1]
            if(!option) return

            if(hit === true || hit === false) {
                option.hitState = hit
                return hit
            }

            option.hitState = !option.hitState
            return option.hitState
        },

        deletePrevTag(e) {
            if(e.target.value.length <= 0 && !this.toggleLastOptionHitState()) {
                const value = this.value.slice()
                value.pop()
                this.$emit("input", value)
                this.emitChange(value)
            }
        },

        managePlaceholder() {
            if(this.currentPlaceholder !== "") {
                this.currentPlaceholder = this.$refs.input.value ? "" : this.cachedPlaceHolder
            }
        },

        resetInputState(e) {
            if(e.keyCode !== 8) this.toggleLastOptionHitState(false)
            this.inputLength = this.$refs.input.value.length * 15 + 20
            this.resetInputHeight()
        },

        resetInputHeight() {
            if(this.collapseTags && !this.filterable) return
            this.$nextTick(() => {
                if(!this.$refs.reference) return
                const inputChildNodes = this.$refs.reference.$el.childNodes
                const input = [].filter.call(inputChildNodes, item => item.tagName === "INPUT")[0]
                const tags = this.$refs.tags
                const tagsHeight = tags ? Math.round(tags.getBoundingClientRect().height) : 0
                const sizeInMap = this.initialInputHeight || 40
                input.style.height = this.selected.length === 0
                    ? sizeInMap + "px"
                    : Math.max(
                        tags ? (tagsHeight + (tagsHeight > sizeInMap ? 6 : 0)) : 0,
                        sizeInMap,
                    ) + "px"
                if(this.visible && this.emptyText !== false) {
                    this.broadcast("ElSelectDropdown", "updatePopper")
                }
            })
        },

        resetHoverIndex() {
            setTimeout(() => {
                if(!this.multiple) {
                    this.hoverIndex = this.selected.virtualIndex
                } else {
                    if(this.selected.length > 0) {
                        this.hoverIndex = Math.min.apply(null, this.selected.map(item => item.virtualIndex))
                    } else {
                        this.hoverIndex = -1
                    }
                }
            }, 300)
        },

        handleOptionSelect(option, byClick) {
            if(this.multiple) {
                const value = (this.value || []).slice()
                const optionIndex = this.getValueIndex(value, option.value)
                if(optionIndex > -1) {
                    value.splice(optionIndex, 1)
                } else if(this.multipleLimit <= 0 || value.length < this.multipleLimit) {
                    value.push(option.value)
                }
                this.$emit("input", value)
                this.emitChange(value)
                if(option.created) {
                    this.query = ""
                    this.handleQueryChange("")
                    this.inputLength = 20
                }
                if(this.filterable) this.$refs.input.focus()
            } else {
                this.$emit("input", option.value)
                this.emitChange(option.value)
                this.visible = false
            }
            this.isSilentBlur = byClick
            this.setSoftFocus()
            if(this.visible) return
            this.$nextTick(() => {
                this.scrollToOption(option)
            })
        },

        setSoftFocus() {
            this.softFocus = true
            const input = this.$refs.input || this.$refs.reference
            if(input) {
                input.focus()
            }
        },

        getValueIndex(arr = [], value) {
            const isObject = Object.prototype.toString.call(value).toLowerCase() === "[object object]"
            if(!isObject) {
                return arr.indexOf(value)
            }
            const valueKey = this.valueKey
            let index = -1
            arr.some((item, i) => {
                if(getValueByPath(item, valueKey) === getValueByPath(value, valueKey)) {
                    index = i
                    return true
                }
                return false
            })
            return index
        },

        toggleMenu() {
            if(!this.selectDisabled) {
                if(this.menuVisibleOnFocus) {
                    this.menuVisibleOnFocus = false
                } else {
                    this.visible = !this.visible
                }
                if(this.visible) {
                    (this.$refs.input || this.$refs.reference).focus()
                }
            }
        },

        selectOption() {
            if(!this.visible) {
                this.toggleMenu()
            } else {
                if(this.filteredOptions[this.hoverIndex]) {
                    this.handleOptionSelect(this.filteredOptions[this.hoverIndex])
                }
            }
        },

        deleteSelected(event) {
            event.stopPropagation()
            const value = this.multiple ? [] : ""
            this.$emit("input", value)
            this.emitChange(value)
            this.visible = false
            this.$emit("clear")
        },

        deleteTag(event, tag) {
            const index = this.selected.indexOf(tag)
            if(index > -1 && !this.selectDisabled) {
                const value = this.value.slice()
                value.splice(index, 1)
                this.$emit("input", value)
                this.emitChange(value)
                this.$emit("remove-tag", tag.value)
            }
            event.stopPropagation()
        },

        onInputChange() {
            if(this.filterable && this.query !== this.selectedLabel) {
                this.$refs["virtualRef"].scrollToIndex(0)
                this.query = this.selectedLabel
                this.handleQueryChange(this.query)
            }
        },

        resetInputWidth() {
            this.inputWidth = this.$refs.reference?.$el?.getBoundingClientRect().width
        },

        handleResize() {
            this.resetInputWidth()
            if(this.multiple) this.resetInputHeight()
        },

        checkDefaultFirstOption() {
            this.hoverIndex = -1
            // highlight the created option
            let hasCreated = false
            for(let i = this.filteredOptions.length - 1; i >= 0; i--) {
                if(this.filteredOptions[i].created) {
                    hasCreated = true
                    this.hoverIndex = i
                    break
                }
            }
            if(hasCreated) return
            for(let i = 0; i !== this.filteredOptions.length; ++i) {
                const option = this.filteredOptions[i]
                if(this.query) {
                    // highlight first options that passes the filter
                    if(!option.disabled && !option.groupDisabled && option.visible) {
                        this.hoverIndex = i
                        break
                    }
                } else {
                    // highlight currently selected option
                    if(option.itemSelected) {
                        this.hoverIndex = i
                        break
                    }
                }
            }
        },

        getValueKey(item) {
            if(Object.prototype.toString.call(item.value).toLowerCase() !== "[object object]") {
                return item.value
            }
            return getValueByPath(item.value, this.valueKey)
        },
    },
}
</script>

<style scoped>
.el-select-dropdown__virtual {
    padding: 6px 0;
}
</style>