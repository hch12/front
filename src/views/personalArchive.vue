<template>
  <div>
    <!-- 搜索区域 -->
    <div class="card search-box">
      <div class="search-group">

        <!-- 机构名称搜索 -->
        <el-autocomplete
          v-model="displayOrgName"
          :fetch-suggestions="queryOrgSuggestions"
          placeholder="请输入机构名称"
          clearable
          class="search-input"
          @select="handleOrgSelect"
          @blur="validateOrgInput"
          @clear="handleClearOrg"
        >
          <template #prefix>
            <el-icon><OfficeBuilding /></el-icon>
          </template>
        </el-autocomplete>

        <!-- 套餐名称搜索 -->
        <el-autocomplete
          v-model="displayServiceName"
          :fetch-suggestions="queryServiceSuggestions"
          placeholder="请输入套餐名称"
          clearable
          class="search-input"
          :disabled="!searchParams.orgName"
          @select="handleServiceSelect"
          @blur="validateServiceInput"
          @clear="handleClearService"
        >
          <template #prefix>
            <el-icon><List /></el-icon>
          </template>
        </el-autocomplete>
      </div>
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
        <el-table-column prop="organizationName" label="机构名称"  />
        <el-table-column prop="serviceName" label="套餐名称"  />
        <el-table-column prop="date" label="体检日期" >
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewDetail(row.archiveID)"
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
import { useRoute, useRouter } from 'vue-router'
import { User, OfficeBuilding, List } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

// 状态管理
const loading = ref(false)
const searchParams = reactive({
  orgName: '', 
  serviceName: ''  
})
const displayName = ref('')
const displayOrgName = ref('')
const displayServiceName = ref('')
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})
const tableData = ref([])

const user = JSON.parse(localStorage.getItem('user'))

// API配置
const APIs = {
  RELATIVE_LIST: '/relative/list',
  NAME_SUGGEST: '/relative/name-suggest',
  ORG_SUGGEST: '/relative/org-suggest',
  SERVICE_SUGGEST: '/relative/service-suggest'
}

// 日期格式化
const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

const handleClearOrg = () => {
  displayOrgName.value = ''
  searchParams.orgName = ''
  handleClearService()
}

const handleClearService = () => {
  displayServiceName.value = ''
  searchParams.serviceName = ''
  fetchData()
}


// 获取机构建议
const queryOrgSuggestions = async (queryString, cb) => {
  try {
    const res = await request.get(APIs.ORG_SUGGEST, {
      params: { 
        keyword: queryString,
        nameId: user.id
      }
    })
    
    if (res.code === '200') {
      const results = res.data.records.map(org => {
        return { value: org}
      })
      cb(results)
    } else {
      cb([])
    }
  } catch (error) {
    console.error('获取机构建议失败:', error)
    cb([])
  }
}

// 验证机构输入
const validateOrgInput = () => {
  if (displayOrgName.value != searchParams.orgName) {
    ElMessage.warning('请输入有效的机构名称')
    clearOrgSearch()
  } else if (displayOrgName.value) {
    searchParams.orgName = displayOrgName.value
  }
}

// 处理机构选择
const handleOrgSelect = (item) => {
  displayOrgName.value = item.value
  searchParams.orgName = item.value
  pagination.pageNum = 1
  clearServiceSearch()
  fetchData()
}

// 获取套餐建议
const queryServiceSuggestions = async (queryString, cb) => {
  try {
    const res = await request.get(APIs.SERVICE_SUGGEST, {
      params: { 
        keyword: queryString,
        nameId: user.id,
        orgName: searchParams.orgName
      }
    })
    
    if (res.code === '200') {
      const results = res.data.records.map(svc => {
        return { value: svc}
      })
      cb(results)
    } else {
      cb([])
    }
  } catch (error) {
    console.error('获取套餐建议失败:', error)
    cb([])
  }
}

// 验证套餐输入
const validateServiceInput = () => {
  if (displayServiceName.value != searchParams.serviceName) {
    ElMessage.warning('请输入有效的套餐名称')
    clearServiceSearch()
  } else if (displayServiceName.value) {
    searchParams.serviceName = displayServiceName.value
  }
}

// 处理套餐选择
const handleServiceSelect = (item) => {
  displayServiceName.value = item.value
  searchParams.serviceName = item.value
  pagination.pageNum = 1
  fetchData()
}

// 清空机构相关搜索
const clearOrgSearch = () => {
  displayOrgName.value = ''
  displayServiceName.value = ''
  searchParams.orgName = ''
  searchParams.serviceName = ''
}

// 清空套餐相关搜索
const clearServiceSearch = () => {
  displayServiceName.value = ''
  searchParams.serviceName = ''
}

  // 状态持久化键值
  const SEARCH_STATE_KEY = 'relative_search_state'

// 保存搜索状态
const saveSearchState = () => {
  const state = {
    path: route.path, // 存储当前页面路径
    displayName: displayName.value,
    displayOrgName: displayOrgName.value,
    displayServiceName: displayServiceName.value,
    searchParams: { ...searchParams },
    pagination: { ...pagination },
    timestamp: Date.now() // 添加时间戳
  }
  sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state))
}

// 恢复搜索状态
const restoreSearchState = () => {
  const savedState = sessionStorage.getItem(SEARCH_STATE_KEY)
  if (savedState) {
    const state = JSON.parse(savedState)
    const isSamePath = state.path === route.path
    const isExpired = Date.now() - state.timestamp > 3600000 // 1小时有效期

    if (isSamePath && !isExpired) {
      displayName.value = state.displayName
      displayOrgName.value = state.displayOrgName
      displayServiceName.value = state.displayServiceName
      Object.assign(searchParams, state.searchParams)
      Object.assign(pagination, state.pagination)
    }
    sessionStorage.removeItem(SEARCH_STATE_KEY) // 无论是否匹配都清理
  }
}

// 添加路由离开监听
import { onBeforeUnmount } from 'vue'

const removeStateHandler = router.beforeEach((to, from, next) => {
  if (from.path === route.path && !/^\/archive\/detail\/[^/]+$/.test(to.path)) {
    sessionStorage.removeItem(SEARCH_STATE_KEY)
  }
  next()
})

onBeforeUnmount(() => {
  removeStateHandler() // 清理路由监听
})

  
  // 查看详情
  const viewDetail = (id) => {
  saveSearchState() // 保存当前状态
  router.push({
    path: `/archive/detail/${id}`,
    query: { 
      from: route.fullPath // 携带完整路径包含查询参数
    }
  })
}

  // 分页处理
  const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  saveSearchState()
  fetchData()
}

const handlePageChange = (page) => {
  pagination.pageNum = page
  saveSearchState()
  fetchData()
}

// 获取数据
const fetchData = async () => {
  try {
    loading.value = true
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      nameId: user.id,
      orgName: searchParams.orgName,
      serviceName: searchParams.serviceName
    }

    const res = await request.get(APIs.RELATIVE_LIST, { params })
    
    if (res.code === '200') {
      tableData.value = res.data.records || []
      pagination.total = res.data.total || 0
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

onMounted(async () => {
  restoreSearchState()
  await fetchData()
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
  flex-direction: column;
  gap: 15px;
}

.search-group {
  display: flex;
  gap: 15px;
  flex-wrap: nowrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
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