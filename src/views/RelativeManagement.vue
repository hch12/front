<template>
  <div class="relative-management-container">
    <!-- 操作按钮区 -->
    <div class="operation-bar">
      <el-button type="primary" @click="handleAdd" plain>新增亲友</el-button>
    </div>

    <!-- 数据表格区 -->
    <el-table :data="relativeList" border stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="regulated" label="亲友ID" width="100" />
      <el-table-column prop="username" label="姓名" width="120" />
      <el-table-column prop="relationship" label="关系" width="120">
        <template #default="{row}">
          {{ relationshipOptions.find(opt => opt.value === row.relationship)?.label }}
        </template>
      </el-table-column>
      <!-- 添加手机号列 -->
      <el-table-column prop="phone" label="联系方式" width="150" />
      <el-table-column label="操作" width="220">
        <template #default="{row}">
          <!-- 触发编辑操作 -->
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.regulated)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="currentAction === 'add' ? '新增亲友' : '编辑亲友信息'"
        width="500px"
        @close="resetDialog"
    >
      <el-radio-group v-model="addType" @change="resetForms" v-if="currentAction === 'add'">
        <el-radio value="existing">已有用户</el-radio>
        <el-radio value="new">新建用户</el-radio>
      </el-radio-group>

      <!-- 根据 currentAction 显示不同表单 -->

      <div v-if="currentAction === 'add' && addType === 'existing'">
        <el-form label-width="80px">
          <el-form-item label="用户名">
            <el-input v-model="searchUserId" placeholder="请输入用户名" />
          </el-form-item>
          <div v-if="searchResults.length === 0 && !isLoading && searchUserId.trim() !== ''" style="color: #909399; font-size: 12px; margin-top: 10px;">未找到相关用户</div>
          <el-form-item v-if="searchResults.length > 0" label="选择用户" style="margin-top: 10px;">
            <el-select v-model="selectedUserId" placeholder="请选择用户">
              <el-option
                  v-for="item in searchResults"
                  :key="item.regulated"
                  :label="`(${item.regulated}) ${item.username} `"
                  :value="item.regulated"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="isLoading" @click="searchUser" style="float: right;">搜索</el-button>
          </el-form-item>
          <el-form-item label="关系" prop="relationship">
            <el-select
                v-model="existingUserForm.relationship"
                placeholder="请选择关系"
                style="width: 100%"
            >
              <el-option
                  v-for="item in relationshipOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div v-else-if="currentAction === 'add' && addType === 'new'">
        <el-form
            ref="newFormRef"
            :model="newUserForm"
            :rules="newUserRules"
            label-width="80px"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="newUserForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="newUserForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input type="password" v-model="newUserForm.password" placeholder="请输入密码" show-password />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input type="password" v-model="newUserForm.confirmPassword" placeholder="请确认密码" show-password />
          </el-form-item>
          <el-form-item label="关系" prop="relationship">
            <el-select
                v-model="newUserForm.relationship"
                placeholder="请选择关系"
                style="width: 100%"
            >
              <el-option
                  v-for="item in relationshipOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="联系方式" prop="phone">
            <el-input v-model="newUserForm.phone" placeholder="请输入联系方式" />
          </el-form-item>
        </el-form>
      </div>

      <div v-else-if="currentAction === 'edit'">
        <el-form
            ref="editFormRef"
            :model="editFormData"
            :rules="editRules"
            label-width="80px"
        >
          <!-- 显示亲友姓名和ID，不可编辑 -->
          <el-form-item label="亲友姓名">
            <el-input v-model="editFormData.username" disabled />
          </el-form-item>
          <el-form-item label="亲友ID">
            <el-input v-model="editFormData.regulated" disabled />
          </el-form-item>

          <el-form-item label="关系" prop="relationship">
            <el-select
                v-model="editFormData.relationship"
                placeholder="请选择关系"
                style="width: 100%"
            >
              <el-option
                  v-for="item in relationshipOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="联系方式" prop="phone">
            <el-input v-model="editFormData.phone" placeholder="请输入联系方式" />
          </el-form-item>

        </el-form>
      </div>

      <div v-else style="text-align: center; padding: 20px;">
        <p>请选择操作类型</p>
      </div>


      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :disabled="currentAction === 'add' && addType === null">确认</el-button>
        </span>
      </template>
    </el-dialog>

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
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

// API配置
const APIs = {
  RELATIVE_LIST: '/rela/list',
  RELATIVE_UPDATE: '/rela/update', // 修改：确认编辑亲友信息的API路径
  RELATIVE_DELETE: '/rela/delete',
  SEARCH_USER: '/rela/search', // 搜索用户 (用于新增已有用户)
  CREATE_USER: '/rela/create', // 创建用户 (用于新增新用户)
  ADD_RELATIVE_EXISTING: '/rela/addExisting' // 添加已有用户为亲友的 (用于新增已有用户)
};

// 获取当前登录用户ID
const user = JSON.parse(localStorage.getItem('user'));
const user_id = user ? user.id : null;

// 响应式状态
const newFormRef = ref(null); // 用于新建用户表单的ref
const editFormRef = ref(null); // 用于编辑表单的ref
const relativeList = ref([]);
const dialogVisible = ref(false);
const currentAction = ref(null); //初始化为 null，add/edit
const loading = ref(false);
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
});

// 新增类型
const addType = ref(null);

// 已有用户相关 (仅用于新增操作)
const searchUserId = ref('');
const searchResults = ref([]);
const selectedUserId = ref(null);
const isLoading = ref(false);
const existingUserForm = ref({
  relationship: ''
});

// 新建用户相关 (仅用于新增操作)
const newUserForm = ref({
  regulator: user_id, // 关联当前登录用户ID
  username: '',
  email: '',
  password: '',
  confirmPassword: '', // 确认密码（仅前端验证）
  relationship: '',
  phone: ''
});

// 编辑亲友信息相关 (仅用于编辑操作)
const editFormData = ref({
  regulator: null, // 当前用户ID
  regulated: null, // 被编辑亲友的ID
  username: '', // 亲友姓名，显示用
  relationship: '',
  phone: ''
});

// 关系类型选项
const relationshipOptions = [
  { value: 'parent', label: '父母' },
  { value: 'spouse', label: '配偶' },
  { value: 'child', label: '子女' },
  { value: 'sibling', label: '兄弟姐妹' },
  { value: 'other', label: '其他' }
];

// 新建用户表单验证规则 (仅用于新增操作)
const newUserRules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== newUserForm.value.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  relationship: [{ required: true, message: '请选择关系', trigger: 'change' }],
});

// 编辑表单验证规则 (仅用于编辑操作)
const editRules = reactive({
  relationship: [{ required: true, message: '请选择关系', trigger: 'change' }],
});


// 分页处理 - 直接定义函数
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  loadRelatives();
};

const handlePageChange = (page) => {
  pagination.pageNum = page;
  loadRelatives();
};

// 加载亲友列表
const loadRelatives = async () => {
  // 如果 user_id 不存在（例如用户未登录），则不加载数据
  if (!user_id) {
    ElMessage.error('用户信息获取失败，请重新登录');
    relativeList.value = [];
    pagination.total = 0;
    return;
  }

  try {
    loading.value = true;
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      userId: user_id,
      nameId: user_id
    };
    const res = await request.get(APIs.RELATIVE_LIST, { params });

    if (res.code === '200') {
      // 确保 res.data 是一个包含 records 和 total 的对象，并且 records 是数组
      relativeList.value = (res.data && Array.isArray(res.data.records)) ? res.data.records : [];
      pagination.total = (res.data && typeof res.data.total === 'number') ? res.data.total : 0;
      console.log(relativeList.value);
    } else {
      ElMessage.error(res.message || '加载亲友列表失败');
      relativeList.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    ElMessage.error('请求失败，请检查网络');
    console.error('加载亲友列表错误:', error);
    relativeList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 处理新增
const handleAdd = () => {
  currentAction.value = 'add';
  dialogVisible.value = true;
  addType.value = null; // 初始化为null，强制用户选择类型
  resetForms(); // 打开对话框时重置所有表单
};

// 处理编辑
const handleEdit = (row) => {
  if (!user_id) {
    ElMessage.error('用户信息获取失败，无法编辑');
    return;
  }
  currentAction.value = 'edit';
  dialogVisible.value = true;

  editFormData.value = {
    regulator: user_id, // 当前登录用户ID
    regulated: row.regulated, // 被编辑亲友的ID
    username: row.username, // 亲友姓名（显示用）
    relationship: row.relationship,
    phone: row.phone || '' // 手机号可能为 null 或 undefined
  };
  // 重置其他不相关的表单
  resetForms(true); // 传递 false 表示不清空 editFormData
};

// 删除操作
const handleDelete = async (id) => {
  // 如果 user_id 或要删除的 id 无效，直接返回
  if (!user_id || !id) {
    ElMessage.error('删除失败：参数无效');
    return;
  }
  try {
    await ElMessageBox.confirm('确定要删除该关系吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const params = {
      regulator: user_id,
      regulated: id
    };
    console.log(params);
    const res = await request.post(APIs.RELATIVE_DELETE, params); // 直接发送对象

    if (res.code === '200') {
      ElMessage.success('删除成功');
      loadRelatives(); // 删除成功后刷新列表
    } else {
      ElMessage.error(res.message || '删除失败');
    }

  } catch (error) {
    // ElMessageBox.confirm 取消会抛出错误，这里捕获但不处理
    if (error !== 'cancel') {
      console.error('删除亲友错误:', error);
      ElMessage.error('删除亲友失败');
    }
  }
};

// 搜索用户
const searchUser = async () => {
  if (searchUserId.value.trim() === '') {
    searchResults.value = [];
    selectedUserId.value = null; // 清空搜索结果时也清空已选用户
    return;
  }
  isLoading.value = true; // 开始加载
  try {
    const params = { username: searchUserId.value };
    const res = await request.get(APIs.SEARCH_USER, { params });

    if (res.code === '200') {
      // 确保 res.data 是一个数组
      searchResults.value = Array.isArray(res.data) ? res.data : [];
      selectedUserId.value = null; // 搜索成功后清空已选用户
      console.log("搜索结果:", res.data);
    } else if (res.code === 'USER_NOT_FOUND') {
      searchResults.value = [];
      selectedUserId.value = null;
      // ElMessage.warning(res.message || '未找到相关用户');
    } else {
      ElMessage.error(res.message || '用户搜索失败');
      searchResults.value = [];
      selectedUserId.value = null;
    }
  } catch (error) {
    console.error('搜索用户出错:', error);
    ElMessage.error('网络错误，请稍后重试');
    searchResults.value = [];
    selectedUserId.value = null;
  } finally {
    isLoading.value = false; // 结束加载
  }
};

// 提交表单
const submitForm = async () => {
  if (currentAction.value === 'add') {
    // 新增操作
    if (addType.value === 'existing') {
      // 添加已有用户为亲友
      if (!selectedUserId.value || !existingUserForm.value.relationship) {
        ElMessage.error('请选择用户和关系');
        return;
      }
      // 检查是否尝试添加自己为亲友
      if (selectedUserId.value === user_id) {
        ElMessage.warning('不能添加自己为亲友');
        return;
      }
      try {
        const params = {
          regulator: user_id, // 当前登录用户
          regulated: selectedUserId.value, // 被关联的用户ID
          relationship: existingUserForm.value.relationship // 关系
        };
        const res = await request.post(APIs.ADD_RELATIVE_EXISTING, params); // 直接发送对象

        if (res.code === '200') {
          ElMessage.success('亲友关系添加成功');
          dialogVisible.value = false;
          loadRelatives(); // 成功后刷新列表
        } else {
          ElMessage.error(res.message || '添加亲友关系失败');
        }

      } catch (error) {
        console.error('添加已有亲友错误:', error);
        ElMessage.error('添加亲友关系失败');
      }
    } else if (addType.value === 'new') {
      // 创建新用户并添加亲友关系
      try {
        // 触发表单验证
        await newFormRef.value.validate();

        // 构建创建用户的请求体
        const createUserParams = {
          regulator: user_id, // 当前登录用户
          username: newUserForm.value.username,
          email: newUserForm.value.email,
          password: newUserForm.value.password,
          phone: newUserForm.value.phone, // 包含手机号
          relationship: newUserForm.value.relationship // 关系
        };

        const res = await request.post(APIs.CREATE_USER, createUserParams);

        if (res.code === '200') {
          ElMessage.success('用户创建并关联成功'); // 根据后端实际逻辑调整消息
          dialogVisible.value = false;
          loadRelatives(); // 成功后刷新列表
        } else {
          ElMessage.error(res.message || '用户创建失败');
        }
      } catch (error) {
        // 如果是表单验证失败，validate 会抛出错误对象，这里捕获的是其他错误
        if (error && !error.fields) { // 排除Element Plus表单验证错误
          console.error('创建新用户错误:', error);
          ElMessage.error('提交失败，请检查输入或网络');
        }
      }
    } else {
      ElMessage.warning('请选择添加类型');
    }
  } else if (currentAction.value === 'edit') {
    // 编辑操作
    try {
      // 触发表单验证
      await editFormRef.value.validate();

      // 构建更新亲友关系的请求体
      const updateParams = {
        regulator: user_id, // 当前用户ID
        regulated: editFormData.value.regulated, // 被编辑亲友的ID
        relationship: editFormData.value.relationship, // 更新后的关系
        phone: editFormData.value.phone // 更新后的手机号
      };

      const res = await request.post(APIs.RELATIVE_UPDATE, updateParams);

      if (res.code === '200') {
        ElMessage.success('亲友信息更新成功');
        dialogVisible.value = false;
        loadRelatives(); // 更新成功后刷新列表
      } else {
        ElMessage.error(res.message || '亲友信息更新失败');
      }
    } catch (error) {
      // 如果是表单验证失败，validate 会抛出错误对象，这里捕获的是其他错误
      if (error && !error.fields) { // 排除Element Plus表单验证错误
        console.error('更新亲友信息错误:', error);
        ElMessage.error('更新失败，请检查输入或网络');
      }
    }
  }
};

// 重置表单和状态
// 参数 keepEditData用于在编辑模式下重置，但不清空正在编辑的数据
const resetForms = (keepEditData = false) => {
  // 重置新增相关表单
  searchUserId.value = '';
  searchResults.value = [];
  selectedUserId.value = null;
  isLoading.value = false;
  existingUserForm.value = { relationship: '' };

  newUserForm.value = {
    regulator: user_id,
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    relationship: '',
    phone: ''
  };
  if (newFormRef.value) {
    newFormRef.value.resetFields();
  }

  // 重置编辑相关表单 (除非 keepEditData 为 true)
  if (!keepEditData) {
    editFormData.value = {
      regulator: null,
      regulated: null,
      username: '',
      relationship: '',
      phone: ''
    };
    if (editFormRef.value) {
      editFormRef.value.resetFields();
    }
  }
};

// 对话框关闭时触发的重置
const resetDialog = () => {
  resetForms(false); // 对话框关闭时清空所有表单数据 (包括编辑数据)
  currentAction.value = null; // 重置当前操作
  addType.value = null; // 重置新增类型选择
};


// 组件挂载后加载列表
onMounted(() => {
  loadRelatives();
});

// 在 <script setup> 中，顶层声明的变量和函数会自动暴露给模板，无需 return

</script>

<style scoped>
.relative-management-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.operation-bar {
  margin-bottom: 20px;
}

.el-table {
  margin-top: 20px;
}

.el-button + .el-button {
  margin-left: 10px;
}

.el-switch {
  height: auto;
}

/* 分页样式 */
.pagination-box {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end; /* 右对齐 */
}

/* 调整已有用户和新建用户表单之间的间距 */
.el-radio-group {
  margin-bottom: 20px;
}

/* 给未找到用户提示加一点样式 */
.el-form-item + div[v-if="searchResults.length === 0"] {
  margin-top: 10px;
  margin-bottom: 10px;
}

/* 确保选择用户项和关系项之间的间距 */
.el-form-item[label="选择用户"] {
  margin-bottom: 18px; /* Element Plus form-item默认间距 */
}

/* 对只读的form item内容加一点样式，使其看起来不像可输入 */
.el-form-item.is-disabled .el-input__inner {
  cursor: default !important;
  color: #606266 !important; /* 保持标准文本颜色 */
  background-color: #f5f7fa !important; /* Element Plus 默认的禁用背景色 */
}

</style>
