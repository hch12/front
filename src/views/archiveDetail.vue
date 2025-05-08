<template>
  <div class="archive-container">
    <div class="back-header">
      <el-button link @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
    </div>
    <!-- 基础信息 -->
    <el-card class="base-info">
      <div class="info-grid">
        <div class="info-item">
          <label>档案编号：</label>
          <span>{{ archiveInfo.archiveID }}</span>
        </div>
        <div class="info-item">
          <label>体检人：</label>
          <span>{{ archiveInfo.name }}</span>
        </div>
        <div class="info-item">
          <label>机构名称：</label>
          <span>{{ archiveInfo.organizationName }}</span>
        </div>
        <div class="info-item">
          <label>套餐名称：</label>
          <span>{{ archiveInfo.serviceName }}</span>
        </div>
        <div class="info-item">
          <label>体检日期：</label>
          <span>{{ formatDate(archiveInfo.date) }}</span>
        </div>
      </div>
    </el-card>

    <!-- 指标分类 -->
    <div v-for="type in uniqueNames" :key="type" class="indicator-section">
      <el-card>
        <template #header>
          <div class="section-title">{{ type }}</div>
        </template>
        <div class="indicator-grid">
          <div v-for="(indicator) in groupedIndicators[type]" :key="indicator.id" 
              class="indicator-item">
            <label>{{ indicator.indicatorName }}：</label>
            <template v-if="!isEditing">
              <span>{{ indicator.value || '未填写' }}</span>
            </template>
            <template v-else>
              <el-input 
                v-model="editValues[indicator.id]"
                :class="{ 'error-input': hasError(indicator.id) }"
                @blur="validateInput(indicator)"
                placeholder="请输入内容"
              >
                <template #suffix>
                  <el-icon v-if="hasError(indicator.id)" class="error-icon">
                    <Warning />
                  </el-icon>
                </template>
              </el-input>
              <div v-if="hasError(indicator.id)" class="error-tip">请输入有效数字</div>
            </template>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <template v-if="!isEditing">
        <el-button type="primary" @click="handleEdit">修改档案</el-button>
        <el-button type="danger" @click="handleDelete">删除档案</el-button>
      </template>
      <template v-else>
        <el-button type="success" @click="submitChanges">提交修改</el-button>
        <el-button @click="cancelEdit">返回</el-button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Warning } from '@element-plus/icons-vue'
import request from '@/utils/request'
import dayjs from 'dayjs'
import { dataType } from 'element-plus/es/components/table-v2/src/common'

const route = useRoute()
const router = useRouter()

const fromPath = computed(() => {
  return route.query.from || 
    (route.params.id.startsWith('P_') ? '/user/perArch' : '/user/relaArch')
})

const handleBack = () => {
  // 优先使用保存的完整路径
  const backPath = route.query.from || fromPath.value
  router.push(backPath)
}

// 数据状态
const archiveInfo = reactive({
  archiveID: '',
  name: '',
  organizationName: '',
  serviceName: '',
  date: ''
})
const originalIndicators = ref([])
const uniqueNames = ref([])
const isEditing = ref(false)
const editValues = reactive({})
const validationErrors = reactive({})

// 计算分组指标
const groupedIndicators = computed(() => {
  return originalIndicators.value.reduce((acc, cur) => {
    if (!acc[cur.type]) acc[cur.type] = []
    acc[cur.type].push(cur)
    return acc
  }, {})
})

// 初始化加载
onMounted(async () => {
  try {
    const res = await request.get(`/archive/${route.params.id}`)
    if (res.code === '200') {
      Object.assign(archiveInfo, res.data.archive)
      originalIndicators.value = res.data.indicators
      uniqueNames.value = res.data.uniqueNames
      
      // 初始化编辑值
      originalIndicators.value.forEach(indicator => {
        editValues[indicator.id] = indicator.value
      })
    }
  } catch (error) {
    ElMessage.error('获取档案详情失败')
  }
})

// 日期格式化
const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : ''
}

// 输入验证
const validateInput = (indicator) => {
  if (indicator.dataType === 0) {
    const isValid = !isNaN(editValues[indicator.id]) && editValues[indicator.id] !== ''
    validationErrors[indicator.id] = !isValid
    return isValid
  }
  return true
}

// 错误状态
const hasError = (id) => {
  return validationErrors[id]
}

// 操作处理
const handleEdit = () => {
  isEditing.value = true
}

const cancelEdit = async () => {
  await ElMessageBox.confirm('确定放弃修改吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  isEditing.value = false
  Object.assign(editValues, originalIndicators.value.reduce((acc, cur) => {
    acc[cur.id] = cur.value
    return acc
  }, {}))
  Object.keys(validationErrors).forEach(key => {
    validationErrors[key] = false
  })
}

const submitChanges = async () => {
  // 验证所有输入
  const invalidItems = originalIndicators.value.filter(indicator => 
    indicator.dataType === 0 && 
    (isNaN(editValues[indicator.id]) || editValues[indicator.id] === '')
  )

  if (invalidItems.length > 0) {
    ElMessage.warning('请修正标红项的数字格式')
    return
  }

  try {
    await ElMessageBox.confirm('确定提交修改吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 构造请求数据
    const payload = originalIndicators.value.map(indicator => ({
      id: indicator.id,
      value: editValues[indicator.id]
    }))

    // 发送更新请求
    await request.put(`/archive/${route.params.id}`, payload)
    ElMessage.success('修改成功')
    isEditing.value = false
    // 更新本地数据
    originalIndicators.value.forEach(indicator => {
      indicator.value = editValues[indicator.id]
    })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('修改失败')
    }
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定删除该档案吗？', '警告', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    
    await request.delete(`/archive/${route.params.id}`)
    ElMessage.success('删除成功')
    router.push('/user/perArch')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
</script>

<style scoped>
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
</style>