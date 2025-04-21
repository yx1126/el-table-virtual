<script>
import { defineComponent } from "vue";
import { Item } from "vue-virtual-scroll-list/src/item";

export default defineComponent({
    name: "VirtualItem",
    extends: Item,
    render() {
        const { extraProps = {}, index, source, slotComponent } = this
        const props = {
            ...extraProps,
            source,
            index
        }
        return slotComponent ? slotComponent({ item: source, index: index, scope: props }) : null;
    }
});
</script>