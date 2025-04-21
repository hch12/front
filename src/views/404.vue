<template>
  <div style="height: 100vh; display: flex; align-items: center; justify-content: center">
    <div style="width: 50%">
      <img style="width: 100%" src="@/assets/imgs/404.png" alt="">
      <div style="text-align: center; padding: 20px 0; font-size: 20px;"><a style="color: #3741fb" @click="back">返回主界面</a></div>
    </div>
  </div>
</template>

<script>
import request from "@/utils/request.js";
import { ElMessage } from "element-plus";
// 引入 router 实例
import router from '@/router';

export default {
  methods: {
    back() {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.id) { // 检查用户是否登录
          if (user.username === 'admin') {
            router.push('/manager/home'); // 注意添加路径前缀 /
          } else {
            router.push('/user/welcome'); // 注意添加路径前缀 /
          }
        } else {
          // 用户信息不完整，跳转登录
          localStorage.removeItem('user');
          router.push('/login');
        }
      } else {
        // 未登录，跳转登录
        router.push('/login');
      }
    }
  }
}
</script>