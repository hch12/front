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
           localStorage.getItem("user")
            localStorage.setItem("user", JSON.stringify(res));

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
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.password-card {
  width: 100%;
  max-width: 480px;
  border-radius: 1.5rem;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.password-card:hover {
  transform: translateY(-4px);
}

.card-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.card-title {
  color: #2d3436;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.title-icon {
  font-size: 2rem;
  color: #4a90e2;
}

.card-subtitle {
  color: #636e72;
  font-size: 0.9rem;
  margin: 0;
}

.auth-form {
  padding: 0 1.5rem;
}

.form-item {
  margin-bottom: 1.75rem;
}

.form-item :deep(.el-form-item__label) {
  font-weight: 500;
  color: #2d3436;
  margin-bottom: 0.5rem;
  padding: 0;
}

.custom-input {
  width: 100%;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.custom-input :deep(.el-input__wrapper) {
  padding: 0.75rem 1.25rem;
  background: #f8f9fa;
  box-shadow: 0 0 0 1px #e0e0e0;
}

.custom-input :deep(.el-input__wrapper:hover),
.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #4a90e2;
}

.input-icon {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin-right: 0.5rem;
}

.input-hint {
  font-size: 0.85rem;
  color: #636e72;
  margin-top: 0.5rem;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.submit-btn {
  width: 100%;
  height: 3rem;
  font-size: 1rem;
  border-radius: 0.75rem;
  background: #4a90e2;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.submit-btn:hover {
  background: #357abd;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.back-btn {
  width: 100%;
  height: 3rem;
  font-size: 1rem;
  border-radius: 0.75rem;
  color: #4a90e2;
  border: 1px solid #4a90e2;
  background: transparent;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(74, 144, 226, 0.1);
  transform: translateY(-1px);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0;
  animation: shake 0.4s ease;
}

.error-icon {
  font-size: 1rem;
}

.icon {
  font-size: 1.2rem;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
</style>