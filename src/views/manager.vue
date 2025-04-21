<template>
  <div>
    <!-- 头部区域开始 -->
    <div style="height: 60px; display: flex;">
      <div style="width: 240px; display: flex; align-items: center; padding-left: 20px; background-color: #3a216b">
        <img style="width: 40px; height: 40px; border-radius: 50%" src="@/assets/imgs/logo.png" alt="">
        <span style="font-size: 20px; font-weight: bold; color: #f1f1f1; margin-left: 5px">健康档案系统</span>
      </div>
      <div style="flex: 1; display: flex; align-items: center; padding-left: 20px; border-bottom: 1px solid #ddd">
        管理系统
      </div>
      <div style="width: fit-content; padding-right: 20px; display: flex; align-items: center; border-bottom: 1px solid #ddd">
        <el-dropdown>
          <div style="display: flex; align-items: center">
            <img style="width: 40px; height: 40px; border-radius: 50%" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" alt="">
            <span style="margin-left: 5px">管理员</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
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
        <el-menu router :default-openeds="['1']" :default-active="router.currentRoute.value.path" style="min-height: calc(100vh - 60px)">
          <el-menu-item index="/manager/home">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/manager/kinship">
            <el-icon><Link /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-sub-menu index="1">
            <template #title>
              <el-icon><Memo /></el-icon>
              <span>机构管理</span>
            </template>
            <el-menu-item index="/manager/institute">机构管理</el-menu-item>
            <el-menu-item index="/manager/comb">套餐管理</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/manager/remark">评论管理</el-menu-item>

        </el-menu>
      </div>
      <!--  菜单区域结束 -->

      <!--  数据渲染区域开始 -->
      <div style="flex: 1; width: 0; padding: 50px 100px ; background-color: #f2f4ff">
        <RouterView />
      </div>
      <!--  数据渲染区域结束 -->

    </div>
    <!--  下方区域结束 -->

  </div>
</template>

<script setup>

import router from "@/router/index.js";
import {Avatar} from "@element-plus/icons-vue";
const logout =() =>{
  localStorage.removeItem('user')
  location.href='/login'
}
let userStr =localStorage.getItem('user')
if(userStr)
{
  let user=JSON.parse(userStr)
  if (!user.id)
  {
    location.href='/login'
  }
}
else
{
  location.href='/login'
}
</script>
<style>
.el-menu {
  background-color: white; /* 菜单背景改为白色 */
  border: none;
}
.el-sub-menu__title {
  background-color: white !important; /* 子菜单标题背景白色 */
  color: #333 !important; /* 文字黑色 */
}
.el-menu-item {
  height: 50px;
  color: #333 !important; /* 默认文字黑色 */
  background-color: white !important; /* 默认背景白色 */
}
.el-menu .is-active {
  background-color: #e8f5e9 !important; /* 选中项淡绿色背景 */
  color: #2e7d32 !important; /* 选中项文字深绿色 */
}
.el-sub-menu__title:hover {
  background-color: #f5f5f5 !important; /* 悬停浅灰色 */
}
.el-menu-item:not(.is-active):hover {
  background-color: #f5f5f5 !important; /* 非选中项悬停浅灰色 */
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

/* 图标颜色调整 */
.el-menu-item .el-icon, .el-sub-menu__title .el-icon {
  color: #333 !important;
}
.el-menu-item.is-active .el-icon {
  color: #2e7d32 !important;
}

/* 子菜单箭头颜色 */
.el-sub-menu__title .el-sub-menu__icon-arrow {
  color: #333 !important;
}
</style>