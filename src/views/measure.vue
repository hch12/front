<template>
  <div class="archive-manage-container">
      <!-- 上传档案模块 -->
      <div class="upload-section">
        <!-- 机构套餐搜索 -->
        <div class="card search-box">
          <div class="search-group">
            <el-autocomplete
              v-model="displayOrgName"
              :fetch-suggestions="queryOrgSuggestions"
              placeholder="请输入机构名称"
              clearable
              class="search-input"
              @select="handleOrgSelect"
              @blur="validateOrgInput"
              @clear="clearOrgSearch"
            >
              <template #prefix>
                <el-icon><OfficeBuilding /></el-icon>
              </template>
            </el-autocomplete>
            <el-autocomplete
              v-model="displayServiceName"
              :fetch-suggestions="queryServiceSuggestions"
              placeholder="请输入套餐名称"
              clearable
              class="search-input"
              :disabled="!searchParams.orgName"
              @select="handleServiceSelect"
              @blur="validateServiceInput"
              @clear="clearServiceSearch"
            >
              <template #prefix>
                <el-icon><List /></el-icon>
              </template>
            </el-autocomplete>
          </div>
        </div>
  
        <!-- 档案表单 -->
        <div v-if="showForm" class="archive-form">
          <div class="form-header">
            <el-autocomplete
              v-model="displayName"
              :fetch-suggestions="queryNameSuggestions"
              placeholder="请选择体检人"
              clearable
              class="search-input"
              @select="handleNameSelect"
              @blur="validateNameInput"
              @clear="handleClearName"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-autocomplete>
            <el-date-picker
              v-model="formData.checkDate"
              type="date"
              placeholder="选择体检日期"
              value-format="YYYY-MM-DD"
              class="date-picker"
            />
          </div>
  
          <!-- 指标输入 -->
          <div v-for="type in indicatorTypes" :key="type" class="indicator-section">
            <el-card>
              <template #header>
                <div class="section-title">{{ type }}</div>
              </template>
              <div class="indicator-grid">
                <div 
                  v-for="indicator in groupedIndicators[type]" 
                  :key="indicator.id" 
                  class="indicator-item"
                >
                  <label>{{ indicator.indicatorName }}：</label>
                  <el-input
                    v-model="formData.indicators[indicator.id]"
                    :class="{ 'error-input': hasError(indicator.id) }"
                    @blur="validateInput(indicator)"
                    :placeholder="indicator.dataType === 0 ? '请输入数字' : '请输入文本'"
                  >
                    <template #suffix>
                      <el-icon v-if="hasError(indicator.id)" class="error-icon">
                        <Warning />
                      </el-icon>
                    </template>
                  </el-input>
                  <div v-if="hasError(indicator.id)" class="error-tip">
                    请输入有效数字
                  </div>
                </div>
              </div>
            </el-card>
          </div>
  
          <!-- 提交按钮 -->
          <div class="action-buttons">
            <el-button 
              type="primary" 
              @click="submitArchive"
              :disabled="!formValid"
            >
              提交档案
            </el-button>
          </div>
        </div>
      </div>
  
        
    
  </div>
</template>
  
  <script setup>
  import { ref, reactive, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { OfficeBuilding, List, Warning } from '@element-plus/icons-vue'
  import request from '@/utils/request'
  import dayjs from 'dayjs'
  
  // 上传档案模块
  const searchParams = reactive({
    orgName: '',
    serviceName: ''
  })
  const displayName = ref('')
  const displayOrgName = ref('')
  const displayServiceName = ref('')
  const currentServiceId = ref('')
  const showForm = ref(false)
  // 名称映射
  const nameMap = ref({})
  // 表单数据
  const formData = reactive({
    personId: '',
    checkDate: '',
    serviceId: '',
    indicators: {}
  })
  const validationErrors = reactive({})
  
  // 指标模板数据
  const indicatorTypes = ref([])
  const groupedIndicators = ref({})
  
  // 指标展示模块
  const selectedPerson = ref('')
  const indicatorHistory = ref([])

const queryNameSuggestions = async (queryString, cb) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await request.get('/relative/suggest', {
        params: { 
          keyword: queryString ,
          id: user.id
        }
      })
      
      if (res.code === '200') {
        const results = res.data.records.map(user => {
          nameMap.value[user.name] = user.id
          return { value: user.name, id: user.id }
        })
        cb(results)
      } else {
        cb([])
      }
    } catch (error) {
      console.error('获取姓名建议失败:', error)
      cb([])
    }
  }

  const handleNameSelect = (item) => {
    displayName.value = item.value
    formData.personId = item.id
  }

  // 验证姓名输入
  const validateNameInput = () => {
    if (displayName.value && !nameMap.value[displayName.value]) {
      ElMessage.warning('请输入有效的亲友姓名')
      clearAllSearch()
    } else if (displayName.value) {
      formData.personId = nameMap.value[displayName.value]
    }
  }

  const handleClearName = () => {
    displayName.value = ''
    formData.personId = ''
  }

  // 机构搜索逻辑
  const queryOrgSuggestions = async (queryString, cb) => {
    try {
      const res = await request.get('/organization/suggest', {
        params: { keyword: queryString }
      })
      if (res.code === '200') {
        const results = res.data.records.map(org => {
          return { value: org.organizationName}
        })
        cb(results)
      } else {
        cb([])
      }
    } catch (error) {
      console.error('机构搜索失败:', error)
      cb([])
    }
  }
  
  const queryServiceSuggestions = async (queryString, cb) => {
    try {
      const res = await request.get('/service/suggest', {
        params: { 
          keyword: queryString,
          orgName: searchParams.orgName
        }
      })
      if (res.code === '200') {
        const results = res.data.records.map(svc => {
          return { 
            value: svc.serviceName,
            id: svc.serviceID
          }
        })
        cb(results)
      } else {
        cb([])
      }
    } catch (error) {
      console.error('机构搜索失败:', error)
      cb([])
    }
  }
  


// 验证机构输入
const validateOrgInput = () => {
  if (displayOrgName.value && !searchParams.orgName) {
    ElMessage.warning('请输入有效的机构名称')
    clearOrgSearch()
  } else if (displayOrgName.value) {
    searchParams.orgName = displayOrgName.value
  }
}

// 验证套餐输入
const validateServiceInput = () => {
  if (displayServiceName.value && !searchParams.serviceName) {
    ElMessage.warning('请输入有效的套餐名称')
    clearServiceSearch()
  } else if (displayServiceName.value) {
    searchParams.serviceName = displayServiceName.value
  }
}

// 处理机构选择
const handleOrgSelect = (item) => {
  displayOrgName.value = item.value
  searchParams.orgName = item.value
  clearServiceSearch()
}

  const handleServiceSelect = (item) => {
    currentServiceId.value = item.id
    displayServiceName.value = item.value
    searchParams.serviceName = item.value
    loadIndicatorTemplate()
  }
  
  // 清空机构相关搜索
const clearOrgSearch = () => {
  displayOrgName.value = ''
  searchParams.orgName = ''
  clearServiceSearch()
}

// 清空套餐相关搜索
const clearServiceSearch = () => {
  displayServiceName.value = ''
  searchParams.serviceName = ''
  currentServiceId.value = ''
  showForm.value = false
  resetForm()
}

const resetForm = () => {
    displayName.value = ''
    formData.personId = ''
    formData.checkDate = ''
    formData.indicators = {}
    Object.keys(validationErrors).forEach(key => {
      validationErrors[key] = false
    })
  }
  
  const resetAllData = () => {
    displayOrgName.value = ''
    displayServiceName.value = ''
    searchParams.orgName = ''
    searchParams.serviceName = ''
    currentServiceId.value = ''
    showForm.value = false
    resetForm()
    selectedPerson.value = ''
    indicatorHistory.value = []
  }
  // 加载指标模板
  const loadIndicatorTemplate = async () => {
    try {
      const res = await request.get('/archive/template', {
        params: { serviceId: currentServiceId.value }
      })
      if (res.code === '200') {
        indicatorTypes.value = res.data.uniqueNames
        groupedIndicators.value = res.data.indicators.reduce((acc, cur) => {
          if (!acc[cur.type]) acc[cur.type] = []
          acc[cur.type].push(cur)
          // 初始化表单值
          formData.indicators[cur.id] = ''
          return acc
        }, {})
        showForm.value = true
      }
    } catch (error) {
      ElMessage.error('获取指标模板失败')
    }
  }
  
  // 表单验证
  const formValid = computed(() => {
    return formData.personId && formData.checkDate && 
      !Object.values(validationErrors).some(v => v)
  })
  
  const validateInput = (indicator) => {
    if (indicator.dataType === 0) {
      const isValid = !isNaN(formData.indicators[indicator.id]) 
      validationErrors[indicator.id] = !isValid
      return isValid
    }
    return true
  }
  
  const hasError = (id) => {
    return validationErrors[id]
  }
  
  
  // 提交档案
  const submitArchive = async () => {
    try {
      const payload = {
        personId: formData.personId,
        checkDate: formData.checkDate,
        serviceId: currentServiceId.value,
        indicators: Object.entries(formData.indicators)
          .map(([id, value]) => ({ id, value }))
      }
  
      const res = await request.post('/archive/insert', payload)
      if (res.code === '200') {
        ElMessage.success('档案提交成功')
        resetForm()
      }
    } catch (error) {
      ElMessage.error('提交失败')
    }
  }
  
  </script>
  
  <style scoped>
  /* 保持原有样式不变 */
  .archive-manage-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .mode-selector {
    margin-bottom: 20px;
    text-align: center;
  }
  
  .search-box {
    margin-bottom: 20px;
  }
  
  .form-header {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .selector, .date-picker {
    width: 200px;
  }
  
  .indicator-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  
  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
  }
  
  .date-info {
    min-width: 140px;
    text-align: right;
  }
  
  .archive-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.back-header {
  margin-bottom: 20px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.back-header .el-button {
  padding: 0;
  color: #666;
}

.back-header .el-button:hover {
  color: #3a216b;
}

.back-header .el-icon {
  margin-right: 5px;
  vertical-align: -2px;
}

.base-info {
  background: #f8fafc;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.action-buttons {
  position: sticky;
  bottom: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 16px;
  backdrop-filter: blur(4px);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.info-item label {
  font-weight: bold;
  min-width: 80px;
  color: #666;
}

.info-item span {
  color: #333;
  font-weight: 500;
}

.indicator-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.indicator-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.indicator-item {
  position: relative;
  padding-bottom: 24px; /* 为错误提示留出空间 */
}

.indicator-item label {
  min-width: 150px;
  margin-right: 10px;
  color: #444;
}

.error-input {
  --el-input-border-color: #f56c6c;
  --el-input-hover-border-color: #f89898;
  --el-input-focus-border-color: #f56c6c;
}

.error-input :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-input-border-color) inset;
}

.error-icon {
  color: #f56c6c;
  font-size: 14px;
}

.error-tip {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  position: absolute;
}

.el-card {
  margin-bottom: 20px;
  border-radius: 8px;
  transition: box-shadow 0.3s;
}

.el-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

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

  </style>