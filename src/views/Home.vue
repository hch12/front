<template>
  <div>
    <div class="card" style="margin-bottom: 5px">
      <el-input style="width: 260px; margin-right: 5px" v-model="data.name" placeholder="请输入名称查询" :prefix-icon="Search"></el-input>
      <el-button type="primary">查 询</el-button>
    </div>
    <div class="card" style="margin-bottom: 5px">
      <el-button type="danger">批量删除</el-button>
      <el-button type="primary">新 增</el-button>
      <el-button type="success">批量导入</el-button>
      <el-button type="info">批量导出</el-button>
    </div>

    <div class="card" style="margin-bottom: 5px">
      <el-table :data="data.tableData" style="width: 100%" :header-cell-style="{ color: '#333', backgroundColor: '#eaf4ff' }">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="phone" label="电话" />
        <el-table-column prop="address" label="地址" width="180" />
      </el-table>
    </div>
    <div class="card">
      <el-pagination
          v-model:current-page="data.pageNum"
          :page-size="data.pageSize"
          layout="total, prev, pager, next"
          :total="data.total"
      />
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from "vue";
import { Search } from "@element-plus/icons-vue";
import request from "@/utils/request.js";
import { ElMessage } from "element-plus";

// 使用 reactive 定义响应式数据
const data = reactive({
  name: null,
  pageNum: 1,
  pageSize: 5,
  total: 6,
  tableData: [
    { name: '小李', phone: '138799882566', address: '安徽省合肥市' },
    { name: '小王', phone: '13987622566', address: '安徽省合肥市' },
    { name: '小周', phone: '13487772266', address: '安徽省合肥市' },
  ]
});

// 在组件挂载时发起请求
onMounted(() => {
  request.get('/selectAll').then(res => {
    console.log(res);
    // 假设响应数据中有 tableData 和 total 字段
    if (res.data && res.data.tableData) {
      data.tableData = res.data.tableData;
    }
    if (res.data && res.data.total) {
      data.total = res.data.total;
    }
  }).catch(error => {
    ElMessage.error('请求数据失败');
    console.error(error);
  });
});
</script>
