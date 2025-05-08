<template>
    <div class="detail-container">
      <!-- 头部导航 -->
      <div class="header">
        <el-button type="primary" link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>返回列表
        </el-button>
        <h1 class="title">{{ data.organizationName }}</h1>
      </div>
  
      <!-- 主体内容 -->
      <div class="content">
        <!-- 基础信息卡片 -->
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><OfficeBuilding /></el-icon>
              <span>基础信息</span>
            </div>
          </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="机构ID">{{ data.organizationID }}</el-descriptions-item>
            <el-descriptions-item label="所在城市">{{ data.city }}</el-descriptions-item>
            <el-descriptions-item label="成立时间">{{ data.establish_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="机构类型">{{ data.type || '-' }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ data.manager || '-' }}</el-descriptions-item>
            <el-descriptions-item label="员工数量">{{ data.staff_count || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
  
        <!-- 联系方式卡片 -->
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><Phone /></el-icon>
              <span>联系方式</span>
            </div>
          </template>
          
          <div class="contact-info">
            <div class="contact-item">
              <el-icon><PhoneFilled /></el-icon>
              <span>联系电话：{{ data.phone }}</span>
            </div>
            <div class="contact-item">
              <el-icon><Message /></el-icon>
              <span>电子邮箱：{{ data.email || '-' }}</span>
            </div>
            <div class="contact-item">
              <el-icon><Location /></el-icon>
              <span>详细地址：{{ data.address || '-' }}</span>
            </div>
          </div>
        </el-card>
  
        <!-- 营业时间卡片 -->
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><Clock /></el-icon>
              <span>营业安排</span>
            </div>
          </template>
          
          <div class="schedule">
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in scheduleData"
                :key="index"
                :timestamp="item.time"
              >
                {{ item.description }}
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </div>
  
      <!-- 加载状态 -->
      <el-skeleton :rows="6" animated v-if="loading" />
      
      <!-- 错误提示 -->
      <el-empty v-if="error" description="数据加载失败">
        <el-button type="primary" @click="fetchData">重新加载</el-button>
      </el-empty>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import {
    ArrowLeft,
    OfficeBuilding,
    Phone,
    PhoneFilled,
    Message,
    Location,
    Clock
  } from '@element-plus/icons-vue'
  import request from '@/utils/request'
  
  const route = useRoute()
  const router = useRouter()
  
  const data = reactive({
    organizationId: '',
    organizationName: '',
    city: '',
    phone: '',
    // 其他扩展字段
    establish_date: '2018-05-20',
    type: '综合医疗机构',
    manager: '张伟',
    staff_count: 45,
    email: 'contact@health.org',
    address: '北京市朝阳区建国路123号',
    workdays: '周一至周五:09:00-18:00;周六:09:00-12:00'
  })
  
  const loading = ref(true)
  const error = ref(false)
  const scheduleData = ref([])
  
  // 解析营业时间
  const parseSchedule = () => {
    return data.workdays.split(';').map(item => {
      const [time, description] = item.split(':')
      return { time: time.trim(), description: description?.trim() || '正常营业' }
    })
  }
  
  // 获取数据
  const fetchData = async () => {
    try {
      loading.value = true
      error.value = false
      const res = await request.get(`/organization/${route.params.id}`)
      
      if (res.code === '200') {
        Object.assign(data, res.data)
        scheduleData.value = parseSchedule()
      } else {
        error.value = true
      }
    } catch (err) {
      error.value = true
      console.error('获取详情失败:', err)
    } finally {
      loading.value = false
    }
  }
  
  // 返回列表
  const goBack = () => {
    router.push('/user/institute')
  }
  
  onMounted(() => {
    fetchData()
  })
  </script>
  
  <style scoped>
  .detail-container {
    padding: 24px;
    background-color: #f5f7fa;
    min-height: calc(100vh - 60px);
  }
  
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
    gap: 20px;
  }
  
  .title {
    margin: 0;
    color: #3a216b;
    font-size: 24px;
  }
  
  .content {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  }
  
  .info-card {
    min-height: 300px;
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #3a216b;
  }
  
  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 10px;
  }
  
  .contact-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  
  .schedule {
    padding: 10px;
  }
  
  .el-timeline {
    padding-left: 10px;
  }
  
  .el-descriptions {
    margin-top: 10px;
  }
  
  .el-empty {
    background: white;
    border-radius: 8px;
    padding: 40px 0;
  }
  </style>