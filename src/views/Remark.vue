<template>
  <div class="remark-container">
    <!-- 搜索和操作区域 -->
    <div class="card search-box">
      <div class="search-group">
        <!-- 机构搜索 -->
        <el-autocomplete
            v-model="displayOrgName"
            :fetch-suggestions="queryOrgSuggestions"
            placeholder="搜索机构名称"
            clearable
            class="search-input"
            @select="handleOrgSelect"
            @clear="handleClearOrg"
        >
          <template #prefix>
            <el-icon><OfficeBuilding /></el-icon>
          </template>
        </el-autocomplete>

        <!-- 我的评论切换 -->
        <el-checkbox v-model="showMyComments" class="my-comments-check">
          仅显示我的评论
        </el-checkbox>

        <!-- 新建评论按钮 -->
        <el-button
            type="primary"
            @click="handleCreateComment"
            :icon="Plus"
        >
          发表评论
        </el-button>
      </div>
    </div>

    <!-- 评论表格 -->
    <div class="card table-box">
      <el-table
          :data="commentData"
          v-loading="loading"
          stripe
          style="width: 100%"
          :header-cell-style="{
          color: '#333',
          backgroundColor: '#f5f7fa',
          fontWeight: '600'
        }"
      >
        <el-table-column prop="username" label="评论用户" width="100" />
        <el-table-column prop="organizationName" label="机构名称" width="100" />
        <el-table-column label="评分" width="150">
          <template #default="{ row }">
            <el-rate
                v-model="row.rating"
                disabled
                :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
            />
          </template>
        </el-table-column>
        <el-table-column prop="commenttext" label="评论内容" />
        <el-table-column prop="createdat" label="评论时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdat) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
                v-if="row.userid === currentUser.id"
                type="primary"
                link
                @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
                v-if="row.userid === currentUser.id"
                type="danger"
                link
                @click="handleDelete(row.commentid)"
            >
              删除
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

    <!-- 评论编辑对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="isEditMode ? '编辑评论' : '发表评论'"
        width="600px"
    >
      <el-form :model="commentForm" label-width="80px" :rules="formRules">
        <el-form-item label="机构" prop="organizationid">
          <el-autocomplete
              v-model="dialogDisplayOrgName"
              :fetch-suggestions="queryOrgSuggestions"
              placeholder="搜索机构名称"
              clearable
              style="width: 100%"
              @select="handleDialogOrgSelect"
              @clear="handleDialogClearOrg"
          >
            <template #prefix>
              <el-icon><OfficeBuilding /></el-icon>
            </template>
          </el-autocomplete>
        </el-form-item>

        <el-form-item label="评分" prop="rating">
          <el-rate
              v-model="commentForm.rating"
              :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
              show-text
              :texts="['差', '一般', '不错', '满意', '非常满意']"
          />
        </el-form-item>

        <el-form-item label="评论内容" prop="commenttext">
          <el-input
              v-model="commentForm.commenttext"
              type="textarea"
              :rows="4"
              placeholder="请输入您的评论内容"
              maxlength="500"
              show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComment">
          {{ isEditMode ? '保存修改' : '立即发表' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { OfficeBuilding, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

// 用户信息
const currentUser = JSON.parse(localStorage.getItem('user'))

// 状态管理
const loading = ref(false)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const showMyComments = ref(false)
const selectedOrg = ref(null)
const displayOrgName = ref('')
const commentData = ref([])
const orgOptions = ref([])

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const commentForm = reactive({
  commentid: null,
  organizationid: null,
  rating: 5,
  commenttext: ''
})

const formRules = {
  organizationid: [
    { required: true, message: '请选择机构', trigger: 'blur' }
  ],
  rating: [
    { required: true, message: '请选择评分', trigger: 'change' }
  ],
  commenttext: [
    { required: true, message: '请输入评论内容', trigger: 'blur' }
  ]
}

// API配置
const APIs = {
  COMMENT_LIST: '/comment/list',
  COMMENT_CREATE: '/comment/create',
  COMMENT_UPDATE: '/comment/update',
  COMMENT_DELETE: '/comment/delete',
  ORG_SUGGEST: '/comment/org-suggest'
}

// 时间格式化
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const dialogSelectedOrg = ref(null); // 用于存储对话框中选择的机构
const dialogDisplayOrgName = ref('');

// 获取机构建议
const queryOrgSuggestions = async (queryString, cb) => {
  try {
    const res = await request.get(APIs.ORG_SUGGEST, {
      params: { keyword: queryString }
    })
    if (res.code === '200') {
      const results = res.data.records.map(org => ({
        value: org.organizationName, // 用于显示
        organizationID: org.organizationID, // 用于提交
        organizationName: org.organizationName // 用于其他地方
      }));
      orgOptions.value = results; // 保存到 orgOptions
      cb(results);
    } else {
      cb([]);
    }
  } catch (error) {
    console.error('获取机构建议失败:', error);
    cb([]);
  }
};

// 处理机构选择
const handleOrgSelect = (item) => {
  selectedOrg.value = item
  displayOrgName.value = item.value
  fetchComments()
}

// 清空机构搜索
const handleClearOrg = () => {
  selectedOrg.value = null
  displayOrgName.value = ''
  fetchComments()
}

// 获取评论数据
const fetchComments = async () => {
  try {
    loading.value = true
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      orgId: selectedOrg.value?.organizationID,
      userId: showMyComments.value ? currentUser.id : null
    }

    const res = await request.get(APIs.COMMENT_LIST, { params })
    console.log(res);
    if (res.code === '200') {
      commentData.value = res.data.records || []
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取评论失败')
    }
  } catch (error) {
    ElMessage.error('请求失败，请检查网络')
    console.error('请求错误:', error)
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  fetchComments()
}

const handlePageChange = (page) => {
  pagination.pageNum = page
  fetchComments()
}

// 处理对话框中的机构选择
const handleDialogOrgSelect = (item) => {
  dialogSelectedOrg.value = item;
  dialogDisplayOrgName.value = item.value;
  commentForm.organizationid = item.organizationID; // 更新 commentForm
};

// 清空对话框中的机构搜索
const handleDialogClearOrg = () => {
  dialogSelectedOrg.value = null;
  dialogDisplayOrgName.value = '';
  commentForm.organizationid = null; // 清空 commentForm
};

// 新建评论
const handleCreateComment = () => {
  isEditMode.value = false;
  Object.assign(commentForm, {
    commentid: null,
    organizationid: null,
    rating: 5,
    commenttext: '',
  });
  dialogSelectedOrg.value = null;
  dialogDisplayOrgName.value = '';
  dialogVisible.value = true;
};

// 提交评论
const submitComment = async () => {
  try {
    const payload = {
      ...commentForm,
      userid: currentUser.id
    }

    const api = isEditMode.value
        ? APIs.COMMENT_UPDATE
        : APIs.COMMENT_CREATE

    const res = await request.post(api, payload)

    if (res.code === '200') {
      ElMessage.success(res.msg || '操作成功')
      dialogVisible.value = false
      fetchComments()
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (error) {
    ElMessage.error('请求失败，请检查网络')
    console.error('提交错误:', error)
  }
}

// 编辑评论
const handleEdit = (row) => {
  isEditMode.value = true
  Object.assign(commentForm, {
    commentid: row.commentid,
    organizationid: row.organizationid,
    rating: row.rating,
    commenttext: row.commenttext
  })
  // 初始化对话框中的机构选择
  const org = orgOptions.value.find(o => o.organizationID === row.organizationid);
  dialogSelectedOrg.value = org || null;
  dialogDisplayOrgName.value = org ? org.organizationName : '';
  dialogVisible.value = true
}

// 删除评论
const handleDelete = (commentid) => {
  ElMessageBox.confirm('确定删除该评论吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await request.delete(`${APIs.COMMENT_DELETE}/${commentid}`)
    if (res.code === '200') {
      ElMessage.success('删除成功')
      fetchComments()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchComments()
  // 加载机构数据
  queryOrgSuggestions('', () => {}); // 不需要在回调中赋值，已经在函数内部赋值
})

// 监听 showMyComments 的变化
watch(showMyComments, () => {
  pagination.pageNum = 1; // 重置页码
  fetchComments();
});

</script>

<style scoped>
.remark-container {
  padding: 20px;
}

.search-box {
  margin-bottom: 20px;
}

.search-group {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 300px;
}

.my-comments-check {
  margin-left: 20px;
}

.el-table {
  margin-top: 15px;
}

.el-rate {
  display: inline-flex;
  align-items: center;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
