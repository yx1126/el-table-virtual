import Vue from "vue"
import stores from "@/stores"
import router from "@/router"
import App from "@/App.vue"
import "element-ui/lib/theme-chalk/index.css";

import Element from "@/components/Element"

Vue.use(stores)
Vue.use(router)
Vue.use(Element);

new Vue({
    el: "#app",
    router,
    render: (h) => h(App)
});