import ElementUI from "element-ui";
import Table from "./Table";

export default {
    install: (Vue) => {
        Vue.use(ElementUI);
        Vue.component("ElTable", Table);
    }
}