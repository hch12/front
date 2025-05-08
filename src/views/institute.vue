<template>
    <div>
      <!-- 搜索区域 -->
      <div class="card search-box">
        <el-input
          v-model="searchParams.name"
          placeholder="请输入机构名称"
          class="search-input"
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
        ></el-input>
        <el-button type="primary" @click="handleSearch">查 询</el-button>
        <el-button @click="resetSearch">重 置</el-button>
      </div>
  
      <!-- 数据表格 -->
      <div class="card table-box">
        <el-table
          :data="tableData"
          v-loading="loading"
          stripe
          style="width: 100%"
          :header-cell-style="{ 
            color: '#333', 
            backgroundColor: '#f5f7fa',
            fontWeight: '600'
          }"
        >
        <el-table-column prop="organizationName" label="机构名称" width="220" />
        <el-table-column prop="city" label="所在城市" width="150" />
        <el-table-column prop="phone" label="联系电话" width="160" />
        <el-table-column prop="workdays" label="营业时间" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewDetail(row.organizationID)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
        </el-table>
      </div>
  
      <!-- 分页组件 -->
      <div class="card pagination-box">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { Search } from '@element-plus/icons-vue'
  import request from '@/utils/request'
  import { ElMessage } from 'element-plus'
  
  const router = useRouter()
  
  // 状态管理
  const loading = ref(false)
  const searchParams = reactive({ name: '' })
  const pagination = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0
  })
  const tableData = ref([])
  
  // API配置
  const APIs = {
    INITIAL_LOAD: '/organization/list',    // 初始加载接口
    SEARCH: '/organization/search'        // 搜索查询接口
  }
  
  // 查看详情
  const viewDetail = (id) => {
    router.push(`/institute/detail/${id}`)
  }
  
  // 处理搜索
  const handleSearch = () => {
    pagination.pageNum = 1
    fetchData(APIs.SEARCH)
  }
  
  // 重置搜索
  const resetSearch = () => {
    searchParams.name = ''
    fetchData(isSearchMode() ? APIs.SEARCH : APIs.INITIAL_LOAD)
  }
  
  // 分页处理
  const handleSizeChange = (size) => {
    pagination.pageNum = 1
    pagination.pageSize = size
    fetchData(isSearchMode() ? APIs.SEARCH : APIs.INITIAL_LOAD)
  }
  
  const handlePageChange = (page) => {
    pagination.pageNum = page
    fetchData(isSearchMode() ? APIs.SEARCH : APIs.INITIAL_LOAD)
  }
  
  // 判断当前是否为搜索模式
  const isSearchMode = () => {
    return !!searchParams.name
  }
  
  // 数据获取
  const fetchData = async (api) => {
    try {
      loading.value = true
      const params = {
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        ...(api === APIs.SEARCH && searchParams)
      }
  
      const res = await request.get(api, { params })
      
      if (res.code === '200') {
        tableData.value = res.data.records
        pagination.total = res.data.total
      } else {
        ElMessage.error(res.msg || '获取数据失败')
      }
    } catch (error) {
      ElMessage.error('请求失败，请检查网络')
      console.error('请求错误:', error)
    } finally {
      loading.value = false
    }
  }
  
  // 初始化加载
  onMounted(() => {
    fetchData(APIs.INITIAL_LOAD)
  })
  </script>
  
  <style scoped>
  .card {
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    margin-bottom: 15px;
  }
  
  .search-box {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .search-input {
    width: 300px;
    margin-right: 15px;
  }
  
  .el-table {
    margin-top: 15px;
  }
  
  .el-pagination {
    justify-content: flex-end;
  }
  
  .el-button + .el-button {
    margin-left: 12px;
  }
  </style>