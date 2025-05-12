<template>
  <div class="indicator-container">
    <el-select
        v-model="selectedCategory"
        placeholder="请选择类别"
        style="width: 240px; margin-bottom: 20px"
    >
      <el-option
          v-for="category in categories"
          :key="category.value"
          :label="category.label"
          :value="category.value"
      />
    </el-select>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="charts-wrapper">
      <div v-if="charts.length > 0" class="chart-list">
        <div
            v-for="(chart, index) in charts"
            :key="index"
            class="chart-item"
        >
          <div class="chart-container">
            <div class="chart-title">{{ chart.title }}</div>
            <div
                :ref="el => setChartRef(el, index)"
                class="chart"
                :style="{ height: chartHeight + 'px' }"
            ></div>
          </div>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { ElSelect, ElOption } from 'element-plus'
import request from '@/utils/request'

// 类别数据
const categories = ref([
  { value: '一般检查', label: '一般检查' },
  { value: '内科', label: '内科' },
  { value: '眼科', label: '眼科' },
  { value: '耳、鼻、喉', label: '耳鼻喉' },
  { value: '肝功能', label: '肝功能' },
  { value: '血脂', label: '血脂' },
  { value: '肾功能', label: '肾功能' },
  { value: '血糖', label: '血糖' }
])

// 分类对应的指标ID映射
const categoryIndicatorMap = {
  '一般检查': [1, 2, 3, 4, 5],
  '内科': [6, 7, 8],
  '眼科': [9, 10, 11],
  '耳、鼻、喉': [12, 13, 14, 15, 16, 17],
  '肝功能': [18, 19, 20, 21, 22],
  '血脂': [23, 24, 25, 26, 27],
  '肾功能': [28, 29, 30],
  '血糖': [31]
}

const selectedCategory = ref('一般检查')
const charts = ref([])
const chartRefs = ref([])
const resizeListeners = ref([])
const loading = ref(false)
const chartHeight = 320

// 设置图表引用
function setChartRef(el, index) {
  if (el) {
    chartRefs.value[index] = el
  }
}

// 数据处理函数
function processChartData(data) {
  if (data.length === 0) {
    charts.value = []
    return
  }

  const grouped = {}
  for (let i = 0; i < data.length; i++) {
    const curr = data[i]
    const key = curr.indicatorName

    if (!key || !curr.date || curr.value === undefined) {
      console.warn('数据不完整，跳过:', curr)
      continue
    }

    if (!grouped[key]) {
      grouped[key] = {
        dates: [],
        values: [],
        type: curr.dataType === 0 ? 'value' : 'category',
        originalValues: []
      }
    }

    const processedValue = processValue(curr.value, curr.dataType)
    if (processedValue !== null) {
      grouped[key].dates.push(curr.date)
      grouped[key].values.push(processedValue)
      grouped[key].originalValues.push(curr.value)
    }
  }

  const processedCharts = []
  for (const key in grouped) {
    processedCharts.push({
      title: key,
      option: getChartOption(key, grouped[key])
    })
  }

  charts.value = processedCharts
}

// 值处理函数
function processValue(value, dataType) {
  if (value === null || value === undefined) {
    return null
  }

  if (dataType === 0) {
    if (typeof value === 'string' && value.includes('/')) {
      const [systolic, diastolic] = value.split('/')
      return parseFloat(systolic) || null
    }
    return parseFloat(value) || null
  }

  const lowerValue = value.toString().toLowerCase().trim()
  const normalKeywords = [
    '正常', 'negative', '无', '否', 'no', '阴性', 'negative',
    '通畅', '完整', '居中'
  ]
  if (normalKeywords.includes(lowerValue)) {
    return 1
  } else if (lowerValue.includes('度')) {
    const degreeMap = { 'i': 1, 'ii': 2, 'iii': 3, '1': 1, '2': 2, '3': 3 }
    const degreeMatch = lowerValue.match(/([i1-3])(?=度)/i)
    return degreeMatch ? degreeMap[degreeMatch[1].toLowerCase()] || 0 : 0
  } else {
    return 0
  }
}

// 图表配置函数
function getChartOption(title, data) {
  const isNumerical = data.type === 'value'

  // 确保分类数据类型显示正确的Y轴标签
  const yAxisData = isNumerical ? null : [
    { value: 0, name: '异常' },
    { value: 1, name: '正常' }
  ]

  return {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => `${params[0].axisValue}<br/>${title}: ${data.originalValues[params[0].dataIndex]}`
    },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLabel: { formatter: (v) => v.split('-').slice(1).join('-') }
    },
    yAxis: {
      type: isNumerical ? 'value' : 'category',
      scale: isNumerical,
      // 直接设置类目轴的类别名称（修正点）
      data: isNumerical ? null : ['异常', '正常'],
      axisLabel: {
        // 类目轴的formatter接收的参数是类目名称，而非索引（修正点）
        formatter: (v) => v
      }
    },
    series: [{
      data: data.values,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3 },
      areaStyle: isNumerical ? { opacity: 0.1 } : undefined,
      markPoint: isNumerical ? {
        data: [{ type: 'max', name: '最大值' }, { type: 'min', name: '最小值' }]
      } : {
        data: data.values.map((val, index) => ({
          name: val === 0 ? '异常' : '正常',
          value: val,
          xAxis: index,
          yAxis: val,
          symbolSize: val === 0 ? 12 : 8,
          itemStyle: { color: val === 0 ? 'red' : '#666' }
        }))
      },
      label: { show: isNumerical, formatter: (params) => isNumerical ? params.data : '' }
    }],
    grid: { top: 60, bottom: 30, left: 50, right: 30, containLabel: true }
  }
}

// 初始化图表
function initCharts() {
  nextTick(() => {
    chartRefs.value.forEach((el, index) => {
      if (el && charts.value[index]) {
        const chart = echarts.init(el)
        chart.setOption(charts.value[index].option)

        const resizeListener = () => chart.resize()
        window.addEventListener('resize', resizeListener)
        resizeListeners.value.push(resizeListener)

        onUnmounted(() => {
          window.removeEventListener('resize', resizeListener)
          chart.dispose()
        })
      }
    })
  })
}

// 根据指标ID获取数据类型
function getDataTypeById(indicatorId) {
  const indicatorTypes = {
    0: [1, 2, 3, 4, 5, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    1: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
  }

  for (const type in indicatorTypes) {
    if (indicatorTypes[type].includes(indicatorId)) {
      return parseInt(type)
    }
  }

  return 0
}

// 数据请求函数
function fetchDataByCategory(category) {
  const indicatorIds = categoryIndicatorMap[category]
  if (!indicatorIds) return Promise.resolve([])

  const userStr = localStorage.getItem('user')
  let userId = null

  try {
    userId = JSON.parse(userStr)?.id
  } catch (error) {
    console.error('解析用户数据失败:', error)
    return Promise.resolve([])
  }

  if (!userId) {
    console.error('未找到用户ID')
    return Promise.resolve([])
  }

  loading.value = true

  return request.post('/user/analysis', { userId, indicatorIds })
      .then(res => {
        if (res.code === '200') {
          return res.data.map(item => ({
            ...item,
            dataType: getDataTypeById(item.indicatorId)
          }))
        } else {
          console.error('请求失败:', res.message)
          return []
        }
      })
      .catch(error => {
        console.error('网络请求错误:', error)
        return []
      })
      .finally(() => loading.value = false)
}

// 监听分类变化
watch(selectedCategory, async (newVal) => {
  const data = await fetchDataByCategory(newVal)
  processChartData(data)
  initCharts()
}, { immediate: true })

onMounted(async () => {
  const data = await fetchDataByCategory('一般检查')
  processChartData(data)
  initCharts()
})

onUnmounted(() => {
  resizeListeners.value.forEach(listener => {
    window.removeEventListener('resize', listener)
  })
  chartRefs.value.forEach(el => {
    const chart = echarts.getInstanceByDom(el)
    chart?.dispose()
  })
})
</script>

<style scoped>
.indicator-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.charts-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.chart-list {
  display: flex;
  flex-wrap: wrap;
  margin: -12px;
}

.chart-item {
  width: 50%;
  padding: 12px;
  box-sizing: border-box;
}

.chart-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: 16px;
  transition: all 0.3s ease;
  height: 100%;
}

.chart-container:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.chart-title {
  font-size: 16px;
  color: #303133;
  margin-bottom: 12px;
  font-weight: 500;
  text-align: center;
}

.chart {
  width: 100%;
  height: 100%;
}

.loading, .no-data {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #909399;
  font-size: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  margin-top: 12px;
}

@media (max-width: 600px) {
  .chart-item {
    width: 100%;
  }
}
</style>