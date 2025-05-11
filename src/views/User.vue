<template>
  <div>
    <!-- 头部区域开始 -->
    <div style="height: 60px; display: flex;">
      <div style="width: 240px; display: flex; align-items: center; padding-left: 20px; background-color: #3a216b">
        <img style="width: 40px; height: 40px; border-radius: 50%" src="@/assets/imgs/logo.png" alt="">
        <span style="font-size: 20px; font-weight: bold; color: #f1f1f1; margin-left: 5px">健康档案系统</span>
      </div>
      <div style="flex: 1; display: flex; align-items: center; padding-left: 20px; border-bottom: 1px solid #ddd">
        <!-- 动态显示返回按钮和系统标题 -->
        <template v-if="showBackButton">
          <el-button 
            link 
            @click="goHome"
            style="margin-right: 10px; color: #3a216b"
          >
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
        </template>
        <span v-else style="font-weight: 500">用户档案管理系统</span>
      </div>
      <div style="width: fit-content; padding-right: 20px; display: flex; align-items: center; border-bottom: 1px solid #ddd">
        <el-dropdown>
          <div style="display: flex; align-items: center">
            <img style="width: 40px; height: 40px; border-radius: 50%" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" alt="">
            <span style="margin-left: 5px">{{username}}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="personal">个人信息</el-dropdown-item>
              <el-dropdown-item @click="change">修改密码</el-dropdown-item>
              <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <!--  头部区域结束 -->

    <!--  下方区域开始 -->
    <div style="display: flex">
      <!--  菜单区域开始 -->
      <div style="width: 240px;">
        <el-menu router :default-openeds="[]" :default-active="router.currentRoute.value.path" style="min-height: calc(100vh - 60px)">
          <el-menu-item index="/user/welcome">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>

          <el-sub-menu index="1">
            <template #title>
              <el-icon><Notebook /></el-icon>
              <span>档案管理</span>
            </template>
            <el-menu-item index="/user/perArch">个人档案管理</el-menu-item>
            <el-menu-item index="/user/relaArch">亲友档案管理</el-menu-item>
            <el-menu-item index="/user/measure">档案上传/指标管理</el-menu-item>
            <el-menu-item index="/user/analysis">纵向指标分析</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/user/relaManage">
            <el-icon><Link /></el-icon>
            <span>亲友关系管理</span>
          </el-menu-item>
          <el-sub-menu index="2">
            <template #title>
              <el-icon><Memo /></el-icon>
              <span>机构信息</span>
            </template>
            <el-menu-item index="/user/institute">机构信息</el-menu-item>
            <el-menu-item index="/user/comb">套餐信息</el-menu-item>
            <el-menu-item index="/user/remark">评论信息</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
      <!--  菜单区域结束 -->

      <!--  数据渲染区域开始 -->
      <div style="flex: 1; width: 0; padding: 50px 100px ; background-color: #ffe4e1">
        <RouterView />
      </div>
      <!--  数据渲染区域结束 -->

    </div>
    <!--  下方区域结束 -->

  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  House,
  Notebook,
  Link,
  Memo,
  ArrowLeft
} from '@element-plus/icons-vue';

export default {
  components: {
    House,
    Notebook,
    Link,
    Memo,
    ArrowLeft
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const username = ref('');

    // 显示返回按钮条件
    const showBackButton = computed(() => {
      return route.path !== '/user/welcome';
    });

    // 返回首页方法
    const goHome = () => {
      router.push('/user/welcome');
    };

    // 初始化用户信息
    onMounted(() => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.id) { // 检查用户是否登录
          username.value = user.username; // 正确赋值
        } else {
          localStorage.removeItem('user');
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    });

    // 退出登录逻辑
    const logout = () => {
      localStorage.removeItem('user');
      router.push('/login');
    };

    // 跳转个人信息
    const personal = () => {
      router.push('/user/information');
    };

    // 跳转修改密码
    const change = () => {
      router.push('/user/ChangePassword');
    };

    return {
      username,
      showBackButton,
      goHome,
      logout,
      personal,
      change,
      router
    };
  }
};
</script>

<style>
.el-menu {
  background-color: white;
  border: none;
}
.el-sub-menu__title {
  background-color: white !important;
  color: #333 !important;
}
.el-menu-item {
  height: 50px;
  color: #333 !important;
  background-color: white !important;
}
.el-menu .is-active {
  background-color: #e8f5e9 !important;
  color: #2e7d32 !important;
}
.el-sub-menu__title:hover {
  background-color: #f5f5f5 !important;
}
.el-menu-item:not(.is-active):hover {
  background-color: #f5f5f5 !important;
  color: #333 !important;
}
.el-dropdown {
  cursor: pointer;
}
.el-tooltip__trigger {
  outline: none;
}
.el-menu--inline .el-menu-item {
  padding-left: 48px !important;
}

/* 图标颜色 */
.el-menu-item .el-icon, .el-sub-menu__title .el-icon {
  color: #333 !important;
}
.el-menu-item.is-active .el-icon {
  color: #2e7d32 !important;
}

/* 返回按钮样式 */
.el-button--link {
  padding: 0 8px;
}
.el-button--link .el-icon {
  vertical-align: middle;
  margin-right: 4px;
}
</style>