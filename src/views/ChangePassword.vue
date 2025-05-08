<template>
  <div class="password-container">
    <el-card class="password-card">
      <div class="card-header">
        <h2 class="card-title">
          <el-icon class="title-icon"><Lock /></el-icon>
          修改密码
        </h2>
        <p class="card-subtitle">请设置包含字母和数字的组合密码</p>
      </div>

      <el-form
          :model="form"
          label-position="top"
          class="auth-form"
      >
        <el-form-item label="新密码" class="form-item">
          <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入至少6位密码"
              class="custom-input"
              clearable
          >
            <template #prefix>
              <el-icon class="input-icon"><Key /></el-icon>
            </template>
          </el-input>
          <div class="input-hint">至少6位字符，建议包含字母和数字</div>
          <span v-if="errors.password" class="error-message">
            <el-icon class="error-icon"><Warning /></el-icon>
            {{ errors.password }}
          </span>
        </el-form-item>

        <el-form-item label="确认密码" class="form-item">
          <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              class="custom-input"
              clearable
          >
            <template #prefix>
              <el-icon class="input-icon"><Key /></el-icon>
            </template>
          </el-input>
          <span v-if="errors.confirmPassword" class="error-message">
            <el-icon class="error-icon"><Warning /></el-icon>
            {{ errors.confirmPassword }}
          </span>
        </el-form-item>

        <div class="form-actions">
          <el-button
              type="primary"
              class="submit-btn"
              @click="handleSubmit"
          >
            <el-icon class="icon"><Check /></el-icon>
            保存修改
          </el-button>
          <el-button
              class="back-btn"
              @click="goBack"
          >
            <el-icon class="icon"><ArrowLeft /></el-icon>
            返回首页
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { Check, ArrowLeft, Lock, Key, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from "@/utils/request.js"
import { useRouter } from 'vue-router'

export default {
  data() {
    return {
      form: {
        password: '',
        confirmPassword: ''
      },
      errors: {
        password: '',
        confirmPassword: ''
      }
    }
  },
  components: {
    Lock,
    Key,
    Warning,
    Check,
    ArrowLeft
  },
  setup() {
    const router = useRouter()
    const goBack = () => {
      router.push('/user/welcome')
    }
    return {
      goBack
    }
  },
  methods: {
    validatePassword(password) {
      const minLength = 6
      return password.length >= minLength
    },
    handleSubmit() {
      // 修复1：添加安全校验
      const user = JSON.parse(localStorage.getItem('user')) || {}
      if (!user?.id) {
        ElMessage.error('用户信息获取失败，请重新登录')
        return this.goBack()
      }

      this.errors = {}
      let isValid = true

      // 修复2：使用正确的this.form.password
      if (!this.form.password) {
        this.errors.password = '密码不能为空'
        isValid = false
      } else if (!this.validatePassword(this.form.password)) { // 添加this
        this.errors.password = '需至少6位且包含字母和数字'
        isValid = false
      }

      if (this.form.password !== this.form.confirmPassword) {
        this.errors.confirmPassword = '两次输入的密码不一致'
        isValid = false
      }

      if (isValid) {
        // 修复3：正确构造请求参数
        const requestData = {
          id: user.id,
          password: this.form.password
        }

        request.post('/user/updatePassword', requestData).then(res => { // 参数修正
          if (res.code === "200") {
            // 修复4：安全更新用户信息
            localStorage.removeItem("user")
            localStorage.setItem("user", JSON.stringify(res.data || {}));

            ElMessage.success({
              message: '密码修改成功',
              duration: 1500,
              showClose: true
            })
            this.goBack()
          } else {
            ElMessage.error(res.msg || '密码修改失败')
          }
        }).catch(error => { // 添加错误处理
          console.error('API Error:', error)
          ElMessage.error('请求失败，请检查网络连接')
        })
      }
    }
  }
}
</script>

<style scoped>
.password-container {
  background: #f2f4ff; /* 保持背景色统一 */
  padding: 20px 40px;
  box-sizing: border-box;
  width: 100%;
  min-height: calc(100vh - 60px);
  display: flex;
  justify-content: flex-start; /* 改为左对齐 */
}

.password-card {
  width: 100%;
  max-width: 900px; /* 扩大最大宽度 */
  min-width: 600px; /* 设置最小宽度 */
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  margin-left: 20px; /* 左侧保留间距 */
  transform-origin: left top;
  background: white; /* 背景改为纯白 */
}

.card-header {
  text-align: left; /* 标题左对齐 */
  padding: 30px 40px 20px;
  margin-bottom: 0;
}

.card-title {
  justify-content: flex-start; /* 图标文字左对齐 */
  font-size: 28px; /* 增大字号 */
}

.title-icon {
  font-size: 32px;
}

.card-subtitle {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.auth-form {
  padding: 0 40px 40px; /* 增大内边距 */
}

.form-item {
  margin-bottom: 30px; /* 增加表单项间距 */
}

.custom-input :deep(.el-input__wrapper) {
  height: 48px; /* 增加输入框高度 */
  font-size: 16px;
  border-radius: 8px;
}

.input-hint {
  font-size: 13px;
  margin-top: 8px;
}

.form-actions {
  margin-top: 40px;
  flex-direction: row; /* 按钮横向排列 */
  gap: 20px;
}

.submit-btn {
  width: 200px;
  height: 52px;
  font-size: 16px;
  border-radius: 8px;
}

.back-btn {
  width: 120px;
}

/* 错误提示优化 */
.error-message {
  font-size: 13px;
  padding-left: 28px;
  position: relative;
}

.error-icon {
  position: absolute;
  left: 0;
  top: 2px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .password-card {
    min-width: auto;
    margin-left: 10px;
  }
  
  .auth-form {
    padding: 0 30px 30px;
  }
}

@media (max-width: 768px) {
  .password-container {
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .submit-btn,
  .back-btn {
    width: 100%;
  }
}
</style>