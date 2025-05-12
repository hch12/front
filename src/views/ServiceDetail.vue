<template>
  <div class="detail-container">
    <!-- 头部导航 -->
    <div class="header">
      <el-button type="primary" link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>返回列表
      </el-button>
      <h1 class="title">{{ data.serviceName || '加载中...' }}</h1>
    </div>

    <!-- 加载状态 -->
    <el-skeleton :rows="8" animated v-if="loading && !error" />

    <!-- 错误提示 -->
    <el-empty v-if="error" description="数据加载失败">
      <el-button type="primary" @click="fetchData">重新加载</el-button>
    </el-empty>

    <!-- 主体内容 -->
    <div class="content" v-if="!loading && !error && data.serviceID">
      <!-- 套餐基础信息卡片 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <el-icon><List /></el-icon>
            <span>套餐基础信息</span>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="套餐ID">{{ data.serviceID }}</el-descriptions-item>
          <el-descriptions-item label="套餐名称">{{ data.serviceName }}</el-descriptions-item>
          <el-descriptions-item label="所属机构">{{ data.organization?.organizationName || '-' }}</el-descriptions-item>
          <!-- 数据库缺失信息 -->
          <el-descriptions-item label="套餐价格">
            {{ typeof data.price === 'number' ? `¥${data.price.toFixed(2)}` : '暂无数据' }}
            <el-tooltip
                v-if="typeof data.price !== 'number'"
            content="数据库中缺少价格信息，请联系管理员添加"
            placement="top"
            >
            <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="预估时长">
            {{ data.duration || '暂无数据' }}
            <el-tooltip
                v-if="!data.duration"
                content="数据库中缺少时长信息，请联系管理员添加"
                placement="top"
            >
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 数据库缺失的详细描述 -->
        <div class="description-section" v-if="data.description !== undefined || true">
          <h4 class="section-title">套餐描述</h4>
          <p v-if="data.description">{{ data.description }}</p>
          <p v-else class="missing-data">
            暂无详细描述。
            <el-tooltip
                content="数据库中缺少详细描述信息，请联系管理员添加"
                placement="top"
            >
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </p>
        </div>

      </el-card>

      <!-- 所属机构信息卡片 -->
      <el-card class="info-card" v-if="data.organization">
        <template #header>
          <div class="card-header">
            <el-icon><OfficeBuilding /></el-icon>
            <span>所属机构信息</span>
          </div>
        </template>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="机构名称">{{ data.organization.organizationName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所在城市">{{ data.organization.city || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ data.organization.phone || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="schedule-section" v-if="data.organization.workdays">
          <h4 class="section-title">营业安排</h4>
          <el-timeline>
            <el-timeline-item
                v-for="(item, index) in scheduleData"
                :key="index"
                :timestamp="item.time"
                type="primary"
            >
              {{ item.description }}
            </el-timeline-item>
          </el-timeline>
        </div>
        <div v-else class="missing-data schedule-section">
          <h4 class="section-title">营业安排</h4>
          暂无营业安排信息。
          <el-tooltip
              content="数据库中机构缺少营业安排信息，请联系管理员添加"
              placement="top"
          >
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </el-card>

      <!-- 包含项目列表卡片 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>包含检测项目 ({{ data.indicators?.length || 0 }})</span>
          </div>
        </template>

        <div v-if="data.indicators && data.indicators.length > 0">
          <el-table
              :data="data.indicators"
              stripe
              style="width: 100%"
              :header-cell-style="{
              color: '#333',
              backgroundColor: '#f5f7fa',
              fontWeight: '600'
            }"
          >
            <el-table-column prop="indicatorID" label="项目ID" width="100" />
            <el-table-column prop="indicatorName" label="项目名称" />
            <el-table-column prop="type" label="类型" width="150" />
            <el-table-column prop="dataType" label="数据类型" width="120">
              <template #default="{ row }">
                {{ formatDataType(row.dataType) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-empty description="该套餐暂未关联任何检测项目" :image-size="100" v-else />

      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  OfficeBuilding,
  List,
  Document, // 使用 Document for indicators
  QuestionFilled // Icon for missing info tooltip
} from '@element-plus/icons-vue';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();

// API配置 - 统一管理
const APIs = {
  SERVICE_DETAIL: '/service/detail', // 注意：后端需要实现根据ID获取详情
};

// 数据状态
const data = reactive({
  serviceID: null,
  serviceName: '',
  organization: null, // 将机构信息作为嵌套对象
  indicators: [], // 包含的项目列表
  // 数据库缺失的字段，先设置为 null 或 undefined
  price: undefined,
  description: undefined,
  duration: undefined,
});

const loading = ref(true);
const error = ref(false);
const scheduleData = ref([]); // 用于解析机构工作时间

// 解析营业时间，同机构详情页
const parseSchedule = (workdays) => {
  if (!workdays) return [];
  return workdays.split(';').map(item => {
    const parts = item.split(':');
    const time = parts[0]?.trim() || '未知';
    const description = parts.slice(1).join(':')?.trim() || '正常营业'; // Handle cases like "周一:全天"
    return { time, description };
  });
};

// 格式化数据类型显示
const formatDataType = (dataType) => {
  switch (dataType) {
    case 1: return '数值';
    case 2: return '文本';
    case 3: return '枚举';
      // 根据你的实际需求添加更多类型
    default: return '未知';
  }
};


// 获取数据
const fetchData = async () => {
  loading.value = true;
  error.value = false;
  const serviceId = route.query.id; // 从查询参数获取ID

  if (!serviceId) {
    error.value = true;
    loading.value = false;
    ElMessage.error("套餐ID未提供！");
    return;
  }

  try {
    // 注意：这里假设后端接口是 GET /service/detail?id=...
    // 如果是 GET /service/detail/:id，需要修改 url
    const res = await request.get(APIs.SERVICE_DETAIL, {
      params: { id: serviceId }
    });

    if (res.code === '200' && res.data) {
      // 使用 Object.assign 合并数据，保留 reactive 引用
      Object.assign(data, res.data);
      // 解析机构工作时间
      if (data.organization?.workdays) {
        scheduleData.value = parseSchedule(data.organization.workdays);
      }
      // 确保 indicators 始终是数组
      if (!Array.isArray(data.indicators)) {
        data.indicators = [];
      }

    } else {
      // 如果code不是200或data为空，视为加载失败
      error.value = true;
      ElMessage.error(res.msg || '获取套餐详情失败');
    }
  } catch (err) {
    error.value = true;
    ElMessage.error('请求套餐详情失败，请检查网络');
    console.error('Fetch Service Detail Error:', err);
  } finally {
    loading.value = false;
  }
};

// 返回列表
const goBack = () => {
  router.push('/user/comb');
};

// 组件挂载时获取数据
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* 沿用机构详情页的样式 */
.detail-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px); /* 头部高度60px */
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
}

.title {
  margin: 0;
  color: #3a216b; /* 主题色 */
  font-size: 24px;
  flex-grow: 1; /* 让标题占据剩余空间 */
}

.content {
  display: grid;
  gap: 20px;
  /* 根据内容调整列布局，可以考虑三列或者两列 */
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); /* 示例：自动调整列，最小350px宽 */
}

/* 可以给包含项目列表的卡片更宽的最小宽度 */
.info-card:last-child {
  grid-column: 1 / -1; /* 让最后一个卡片占据整行 */
  min-height: auto; /* 表格高度自适应 */
}

.info-card {
  min-height: 200px; /* 适当调整卡片最小高度 */
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #3a216b; /* 主题色 */
}

.el-descriptions {
  margin-top: 10px;
  margin-bottom: 20px; /* Descriptions下方留白 */
}

/* 新增的样式 */
.description-section,
.schedule-section {
  padding: 10px 0 0; /* 顶部留白 */
}

.section-title {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 1px dashed #eee;
  padding-bottom: 8px;
}

.description-section p {
  font-size: 14px;
  line-height: 1.6;
  color: #555;
}

.missing-data {
  font-size: 14px;
  color: #999; /* 灰色文字表示缺失 */
  display: flex;
  align-items: center;
  gap: 5px;
}

.el-table {
  margin-top: 15px; /* 如果表格在卡片里，顶部可以留白 */
}

.el-empty {
  background: white;
  border-radius: 8px;
  padding: 40px 0;
  grid-column: 1 / -1; /* 让 Empty 占据整行 */
}
</style>
