<template>
    <div>
      <!-- 搜索区域 -->
      <div class="card search-box">
        <el-autocomplete
          v-model="searchParams.orgName"
          :fetch-suggestions="querySearch"
          placeholder="请输入机构名称"
          clearable
          class="search-input"
          @select="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          
        </el-autocomplete>
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
          <el-table-column prop="serviceID" label="套餐ID" width="120" />
          <el-table-column prop="organizationName" label="机构名称" />
          <el-table-column prop="serviceName" label="套餐名称" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="viewDetail(row.serviceID)"
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
  const searchParams = reactive({ orgName: '' })
  const pagination = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0
  })
  const tableData = ref([])
  
  // API配置
  const APIs = {
    SERVICE_LIST: '/service/list',
    ORG_SUGGEST: '/organization/suggest',
    SERVICE_DETAIL: '/service/detail'
  }
  
  // 获取机构建议（适配新响应格式）
  const querySearch = async (queryString, cb) => {
    try {
      const res = await request.get(APIs.ORG_SUGGEST, {
        params: { 
          keyword: queryString
        }
      })
      
      if (res.code === '200') {
        const results = res.data.records.map(org => ({
          value: org.organizationName,
          id: org.organizationID
        }))
        cb(results)
      } else {
        cb([])
      }
    } catch (error) {
      console.error('获取机构建议失败:', error)
      cb([])
    }
  }
  
  // 查看详情
  const viewDetail = (serviceID) => {
    router.push({
      path: '/service/detail',
      query: { id: serviceID }
    })
  }
  
  const handleSearch = () => {
    pagination.pageNum = 1
    fetchData()
  }
  
  const resetSearch = () => {
    searchParams.orgName = ''
    handleSearch()
  }
  
  const handleSizeChange = (size) => {
    pagination.pageNum = 1
    pagination.pageSize = size
    fetchData()
  }
  
  const handlePageChange = (page) => {
    pagination.pageNum = page
    fetchData()
  }
  
  const fetchData = async () => {
    try {
      loading.value = true
      const params = {
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        orgName: searchParams.orgName 
      }
  
      const res = await request.get(APIs.SERVICE_LIST, { params })
      
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
  
  onMounted(() => {
    fetchData()
  })
  </script>
  
  <style scoped>
  /* 样式保持不变 */
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