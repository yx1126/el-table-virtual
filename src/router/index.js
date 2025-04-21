import VueRouter from "vue-router"
import Vue from "vue";

Vue.use(VueRouter);

const router = new VueRouter({
    routes: [
        {
            path: "/",
            name: "home",
            component: () => import("@/views/HomeView.vue")
        },
        {
            path: "/about",
            name: "about",
            component: () => import("@/views/AboutView.vue")
        },
        {
            path: "/select",
            name: "about",
            component: () => import("@/views/SelectTest.vue")
        }
    ]
})

export default router
