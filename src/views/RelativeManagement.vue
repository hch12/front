<template>
  <div class="relative-management-container">
    <!-- 操作按钮区 -->
    <div class="operation-bar">
      <el-button type="primary" @click="handleAdd" plain>新增亲友</el-button>
    </div>

    <!-- 数据表格区 -->
    <el-table :data="relativeList" border stripe style="width: 100%">
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="relationship" label="关系" width="120">
        <template #default="{row}">
          {{ relationshipOptions.find(opt => opt.value === row.relationship)?.label }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="联系方式" width="150" />
      <el-table-column prop="authorized" label="授权状态" width="120">
        <template #default="{row}">
          <el-switch
              v-model="row.authorized"
              active-text="已授权"
              inactive-text="未授权"
              @change="toggleAuthorization(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{row}">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="currentAction === 'add' ? '新增亲友' : '编辑亲友信息'"
        width="500px"
    >
      <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="80px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="关系" prop="relationship">
          <el-select
              v-model="formData.relationship"
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
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// API配置
const APIs = {
  RELATIVE_LIST: '/relative/list',
  RELATIVE_ADD: '/relative/add',
  RELATIVE_UPDATE: '/relative/update',
  RELATIVE_DELETE: '/relative/delete',
  TOGGLE_AUTH: '/relative/toggle-auth'
}

export default {
  name: 'RelativeManagement',
  setup() {
    const formRef = ref(null)
    const relativeList = ref([])
    const dialogVisible = ref(false)
    const currentAction = ref('add') // add/edit
    const formData = ref({
      id: null,
      name: '',
      relationship: '',
      phone: ''
    })

    // 关系类型选项
    const relationshipOptions = [
      { value: 'parent', label: '父母' },
      { value: 'spouse', label: '配偶' },
      { value: 'child', label: '子女' },
      { value: 'sibling', label: '兄弟姐妹' },
      { value: 'other', label: '其他' }
    ]

    // 表单验证规则
    const rules = {
      name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
      relationship: [{ required: true, message: '请选择关系', trigger: 'change' }],
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ]
    }

    // 加载亲友列表
    const loadRelatives = async () => {
      try {
        const res = await request.get(APIs.RELATIVE_LIST)
        relativeList.value = res.data || []
      } catch (error) {
        ElMessage.error('数据加载失败')
      }
    }

    // 处理新增
    const handleAdd = () => {
      currentAction.value = 'add'
      formData.value = { id: null, name: '', relationship: '', phone: '' }
      dialogVisible.value = true
    }

    // 处理编辑
    const handleEdit = (row) => {
      currentAction.value = 'edit'
      formData.value = { ...row }
      dialogVisible.value = true
    }

    // 提交表单
    const submitForm = async () => {
      try {
        await formRef.value.validate()
        const api = currentAction.value === 'add' ? APIs.RELATIVE_ADD : APIs.RELATIVE_UPDATE
        await request.post(api, formData.value)
        ElMessage.success('操作成功')
        dialogVisible.value = false
        loadRelatives()
      } catch (error) {
        if (!error?.fields) ElMessage.error('操作失败')
      }
    }

    // 删除操作
    const handleDelete = async (id) => {
      try {
        await ElMessageBox.confirm('确定要删除该记录吗？', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await request.post(APIs.RELATIVE_DELETE, { id })
        ElMessage.success('删除成功')
        loadRelatives()
      } catch (error) {
        // 取消删除不处理
      }
    }

    // 切换授权状态
    const toggleAuthorization = async (row) => {
      try {
        await request.post(APIs.TOGGLE_AUTH, {
          id: row.id,
          status: row.authorized ? 1 : 0
        })
        ElMessage.success('状态更新成功')
      } catch (error) {
        row.authorized = !row.authorized // 回滚状态
        ElMessage.error('状态更新失败')
      }
    }

    onMounted(() => {
      loadRelatives()
    })

    return {
      formRef,
      relativeList,
      dialogVisible,
      formData,
      currentAction,
      relationshipOptions,
      rules,
      handleAdd,
      handleEdit,
      handleDelete,
      submitForm,
      toggleAuthorization
    }
  }
}
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
</style>