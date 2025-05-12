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
import personalArchive from "@/views/personalArchive.vue";
import relativeArchive from "@/views/relativeArchive.vue";
import instituteInfo from "@/views/institute.vue";
import instituteDetail from "@/views/instituteDetail.vue";
import archiveDetail from "@/views/archiveDetail.vue";
import comb from "@/views/comb.vue";
import relativeManagement from "@/views/RelativeManagement.vue";
import serviceDetail from "@/views/ServiceDetail.vue";
import analysis from "@/views/analysis.vue"

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
                { path: "welcome", component: welcome },
                { path: 'information', component: information },
                { path: "ChangePassword",component: changePassword},
                { path: "perArch",component: personalArchive},
                { path: "relaArch",component: relativeArchive},
                { path: "institute",component: instituteInfo},
                { path: '/institute/detail/:id', component: instituteDetail, props: true},
                { path: '/archive/detail/:id', component: archiveDetail, props: true},
                { path: "comb",component: comb},
                { path: "relaManage",component: relativeManagement},
                { path: "/service/detail",component: serviceDetail}
                { path: "analysis",component:analysis}
            ]
        },
        
        { path: '/notFound', component: notfound },
        { path: '/:pathMatch(.*)', redirect: '/notFound' },
    ],
})

export default router;