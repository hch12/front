<template>
  <div class="login-container">
    <div class="wrapper">
      <form @submit.prevent="loginBrungle">
        <h1>健康档案系统</h1>

        <div class="input-box">
          <i class="fas fa-user icon"></i>
          <input
              v-model="form.username"
              type="text"
              required
              placeholder=" "
              @blur="validateForm"
              :class="{ 'error-input': errors.username }"
          />
          <label>用户名</label>
          <span class="error-message" v-if="errors.username">{{ errors.username }}</span>
        </div>

        <div class="input-box">
          <i class="fas fa-lock icon"></i>
          <input
              v-model="form.password"
              type="password"
              required
              placeholder=" "
              @blur="validateForm"
              :class="{ 'error-input': errors.password }"
          />
          <label>密码</label>
          <span class="error-message" v-if="errors.password">{{ errors.password }}</span>
        </div>

        <button type="submit" class="btn">登录</button>

        <div class="signup-link">
          <p>没有账号？<router-link to="/register">创建一个</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import request from "@/utils/request.js";
import {ElMessage} from "element-plus";

export default {
  name: 'LoginPage',
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      errors: {
        username: '',
        password: ''
      }
    }
  },
  methods: {
   loginBrungle() {
      if(!this.validateForm()) {
        return
      }
     request.post('/login', this.form).then(res => {
       console.log(res)
       if (res.code === '200') {
         // 存储用户信息
         localStorage.setItem("user", JSON.stringify(res.data || {}));
         if (res.data.username === 'admin') {
           this.$router.push('/manager/home');
         } else {
           this.$router.push('/user/welcome');
         }
         ElMessage.success("登录成功");
       } else {
         ElMessage.error(res.msg);
       }
     })
   },
    validateForm() {
      this.errors = { username: '', password: '' }
      let isValid = true

      // 用户名验证
      if (!this.form.username.trim()) {
        this.errors.username = '用户名不能为空'
        isValid = false
      } else if (this.form.username.length < 3) {
        this.errors.username = '用户名至少3个字符'
        isValid = false
      }

      // 密码验证
      if (!this.form.password) {
        this.errors.password = '密码不能为空'
        isValid = false
      } else if (this.form.password.length < 6) {
        this.errors.password = '密码至少6位'
        isValid = false
      }

      return isValid
    }
  }
}
</script>

<style scoped>
/* 动态渐变背景 */
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(-45deg, #23a6d5, #23d5ab, #ee7752, #e73c7e);
  background-size: 400% 400%;
  animation: gradientFlow 15s ease infinite;
  position: relative;
  overflow: hidden;
}

@keyframes gradientFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 玻璃拟态登录框 */
.wrapper {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.wrapper:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.3);
}

h1 {
  color: #fff;
  text-align: center;
  margin-bottom: 40px;
  font-size: 2.2em;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.input-box {
  position: relative;
  margin: 30px 0;
}

.input-box input {
  width: 100%;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1em;
  transition: all 0.3s ease;
}

.input-box input:focus {
  background: rgba(255, 255, 255, 0.2);
  outline: none;
}

.input-box label {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
  transition: all 0.3s ease;
}

.input-box input:focus ~ label,
.input-box input:not(:placeholder-shown) ~ label {
  top: -10px;
  left: 10px;
  font-size: 0.8em;
  color: #fff;
}

.icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
}

.btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(45deg, #23a6d5, #23d5ab);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:hover {
  background: linear-gradient(45deg, #1e87b0, #1dbd96);
  transform: translateY(-2px);
}

.signup-link {
  text-align: center;
  margin-top: 30px;
  color: rgba(255, 255, 255, 0.8);
}

.signup-link a {
  color: #23d5ab;
  text-decoration: none;
  font-weight: 600;
}

.signup-link a:hover {
  text-decoration: underline;
}

/* 错误提示样式 */
.error-message {
  position: absolute;
  left: 0;
  bottom: -20px;
  color: #ff4757;
  font-size: 12px;
  margin-top: 5px;
}

.error-input {
  border: 1px solid #ff4757 !important;
  background: rgba(255, 71, 87, 0.1) !important;
}

.error-input ~ label {
  color: #ff4757 !important;
}

.error-input ~ .icon {
  color: #ff4757 !important;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .wrapper {
    width: 90%;
    margin: 20px;
    padding: 25px;
  }

  .login-container {
    padding: 20px;
  }
}

/* 悬浮粒子效果 */
.login-container::after {
  content: "";
  position: absolute;
  width: 150vw;
  height: 150vh;
  background-image: radial-gradient(circle at 50% 50%,
  rgba(255,255,255,0.1) 1%,
  transparent 20%);
  animation: particleFlow 20s linear infinite;
}

@keyframes particleFlow {
  from { transform: rotate(0deg) translateX(-50%); }
  to { transform: rotate(360deg) translateX(-50%); }
}
</style>
