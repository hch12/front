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
      <div v-for="(chart, index) in charts" :key="index" class="chart-container">
        <div class="chart-title">{{ chart.title }}</div>
        <div
            :ref="el => setChartRef(el, index)"
            class="chart"
            :style="{ height: chartHeight + 'px' }"
        ></div>
      </div>
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
    console.error('原始数据为空，无法进行数据处理')
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

  console.log('分组后的数据:', grouped)

  const processedCharts = []
  for (const key in grouped) {
    processedCharts.push({
      title: key,
      option: getChartOption(key, grouped[key])
    })
  }

  charts.value = processedCharts
}

// 值处理函数（优化非数值型数据处理）
function processValue(value, dataType) {
  if (value === null || value === undefined) {
    return null // 空值保持null，后续处理会过滤
  }

  if (dataType === 0) {
    // 数值类型处理（保持原有逻辑）
    if (typeof value === 'string' && value.includes('/')) {
      const [systolic, diastolic] = value.split('/')
      return parseFloat(systolic) || null
    }
    return parseFloat(value) || null
  }

  // 分类类型处理（新增通畅、完整、居中判断）
  const lowerValue = value.toString().toLowerCase().trim()

  // 新增正常关键词（通畅、完整、居中）
  const normalKeywords = [
    '正常', 'negative', '无', '否', 'no', '阴性', 'negative',
    '通畅', '完整', '居中' // 新增判断词
  ]
  if (normalKeywords.includes(lowerValue)) {
    return 1
  }
  else
  {
    return 0
  }

  // 处理度数等级（保留原有逻辑，无法识别的度数归为异常）
  if (lowerValue.includes('度')) {
    const degreeMap = { 'i': 1, 'ii': 2, 'iii': 3, '1': 1, '2': 2, '3': 3 } // 统一小写处理
    const degreeMatch = lowerValue.match(/([i1-3])(?=度)/i) // 匹配i/1-3后面跟"度"的情况
    return degreeMatch ? degreeMap[degreeMatch[1].toLowerCase()] || 0 : 0
  }

  // 所有无法识别的字符（包括空字符串、特殊符号、未知文本等）统一归为异常
  return 0
}

// 图表配置函数（补充分类轴标签映射）
function getChartOption(title, data) {
  const isNumerical = data.type === 'value'

  return {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        const date = params[0].axisValue
        const originalValue = data.originalValues[params[0].dataIndex]
        return `${date}<br/>${title}: ${originalValue}`
      }
    },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLabel: {
        formatter: function (v) {
          return v.split('-').slice(1).join('-')
        }
      }
    },
    yAxis: {
      type: isNumerical ? 'value' : 'category',
      scale: isNumerical,
      // 明确分类轴映射关系（异常对应0，正常对应1）
      data: isNumerical ? null : ['异常', '正常'],
      axisLabel: {
        formatter: function (v) {
          if (isNumerical) return v
          // 确保数值0对应异常，1对应正常（防御性处理）
          return v === 0 ? '异常' : v === 1 ? '正常' : '异常'
        }
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
        data: [
          { type: 'max', name: '最大值' },
          { type: 'min', name: '最小值' }
        ]
      } : {
        // 分类类型标记异常点
        data: data.values.map((val, index) => ({
          name: val === 0 ? '异常点' : '',
          value: val,
          xAxis: index,
          yAxis: val,
          symbolSize: val === 0 ? 12 : 0,
          itemStyle: { color: val === 0 ? 'red' : '#666' }
        }))
      },
      label: {
        show: isNumerical,
        formatter: function (params) {
          return isNumerical ? params.data : ''
        }
      }
    }],
    grid: { top: 60, bottom: 30, left: 50, right: 30, containLabel: true }
  }
}

// 初始化图表
function initCharts() {
  nextTick(function () {
    chartRefs.value.forEach(function (el, index) {
      if (el && charts.value[index]) {
        const chart = echarts.init(el)
        chart.setOption(charts.value[index].option)

        const resizeListener = function () {
          chart.resize()
        }

        window.addEventListener('resize', resizeListener)

        onUnmounted(function () {
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
  let id = null

  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      id = user.id
    } catch (error) {
      console.error('解析用户数据失败:', error)
      return Promise.resolve([])
    }
  } else {
    console.error('未找到用户数据')
    return Promise.resolve([])
  }

  loading.value = true

  return request.post('/user/analysis', {
    userId: id,
    indicatorIds: indicatorIds
  })
      .then(function (res) {
        console.log('API响应状态码:', res.code)
        console.log('API响应数据长度:', res.data.length)

        if (res.code === '200') {
          const processedData = []

          for (let i = 0; i < res.data.length; i++) {
            const item = res.data[i]
            const newItem = Object.assign({}, item, {
              dataType: getDataTypeById(item.indicatorId)
            })
            processedData.push(newItem)
          }

          return processedData
        } else {
          console.error('请求失败:', res.message)
          return []
        }
      })
      .catch(function (error) {
        console.error('网络请求错误:', error)
        return []
      })
      .finally(function () {
        loading.value = false
      })
}

// 监听分类变化
watch(selectedCategory, function (newVal) {
  fetchDataByCategory(newVal)
      .then(function (processedData) {
        processChartData(processedData)
        initCharts()
      })
}, { immediate: true })

onMounted(function () {
  fetchDataByCategory('一般检查')
      .then(function (processedData) {
        processChartData(processedData)
        initCharts()
      })
})

onUnmounted(function () {
  resizeListeners.value.forEach(function (listener, index) {
    if (listener) {
      window.removeEventListener('resize', listener)
    }
  })

  chartRefs.value.forEach(function (el, index) {
    if (el) {
      const chart = echarts.getInstanceByDom(el)
      if (chart) {
        chart.dispose()
      }
    }
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 24px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: 16px;
  transition: all 0.3s ease;
}

.chart-container:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
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

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #909399;
  font-size: 16px;
}
</style>