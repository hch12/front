import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import notfound from '../views/404.vue'
import manage from "@/views/manager.vue";
import login from "@/views/Login.vue";
import register from "@/views/register.vue";
import user from "@/views/User.vue"
import welcome from "@/views/welcome.vue";
import information from "@/views/information.vue"
import changePassword from "@/views/ChangePassword.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/login', name: 'login', component: login },
        { path: '/register', name: 'register', component: register },
        { path: '/', redirect: '/login' },
        {
            path: '/manager',
            name: 'manager',
            component: manage,
            children: [
                { path: "home", name: 'home', component: Home }
            ]
        },
        {
            path: '/user',
            name: 'user',
            component: user,
            children: [
                { path: "welcome", name: 'welcome', component: welcome },
                { path: 'information', component: information },
                {path: "ChangePassword",name: changePassword,component: changePassword}
            ]
        },
        { path: '/notFound', component: notfound },
        { path: '/:pathMatch(.*)', redirect: '/notFound' },
    ],
})

export default router;