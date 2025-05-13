<template>
  <div class="welcome-container">
    <!-- 欢迎标题 -->
    <div class="welcome-header">
      <h1>欢迎回来，{{ username }}！</h1>
      <p>请选择以下功能快速开始</p>
    </div>

    <!-- 功能跳转卡片 -->
    <div class="card-grid">
      <el-card 
        v-for="item in menuItems" 
        :key="item.path" 
        shadow="hover" 
        class="nav-card"
        @click="router.push(item.path)"
      >
        <div class="card-content">
          <component :is="item.icon" class="card-icon" />
          <span class="card-text">{{ item.name }}</span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Notebook,
  Link,
  Memo,
  House,
} from '@element-plus/icons-vue';

const router = useRouter();
const username = ref('');

// 侧边栏菜单项配置（与User.vue保持一致）
const menuItems = [
  { name: '个人档案管理', path: '/user/perArch', icon: Notebook },
  { name: '亲友档案管理', path: '/user/relaArch', icon: Notebook },
  { name: '档案上传', path: '/user/measure', icon: Notebook },
  { name: '纵向指标分析', path: '/user/analysis', icon: Notebook },
  { name: '亲友关系管理', path: '/user/relaManage', icon: Link },
  { name: '机构信息', path: '/user/institute', icon: Memo },
  { name: '套餐信息', path: '/user/comb', icon: Memo },
  { name: '评论信息', path: '/user/remark', icon: Memo },
];

onMounted(() => {
  // 从localStorage获取用户名
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  username.value = user.username || '用户';
});
</script>

<style scoped>
.welcome-container {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-header {
  text-align: center;
  margin-bottom: 40px;
}

.welcome-header h1 {
  color: #3a216b;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  padding: 20px;
}

.nav-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.nav-card:hover {
  transform: translateY(-5px);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
}

.card-icon {
  width: 40px;
  height: 40px;
  color: #3a216b;
  margin-bottom: 15px;
}

.card-text {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}
</style>