<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <h2 class="card-title">个人信息</h2>
      <transition-group name="fade" tag="div">
        <el-form
            :model="form"
            label-position="left"
            label-width="120px"
            class="demo-form"
        >
          <el-form-item label="用户姓名">
            <el-input
                v-model="form.name"
                placeholder="请输入姓名"
                class="custom-input"
                clearable
            />
          </el-form-item>

          <el-form-item label="电子邮箱">
            <el-input
                v-model="form.email"
                placeholder="请输入邮箱"
                class="custom-input"
                clearable
            >
              <template #prefix>
                <el-icon class="el-input__icon"><Message /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="手机号码">
            <el-input
                v-model="form.phone"
                placeholder="请输入手机号"
                class="custom-input"
                clearable
            >
              <template #prefix>
                <el-icon class="el-input__icon"><Iphone /></el-icon>
              </template>
            </el-input>
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
          </div>
        </el-form>
      </transition-group>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Check, Message, Iphone } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import request from "@/utils/request.js";

export default {
  data() {
    return {
      form: {
        id:'',
        name:'',
        email: '',
        phone: ''
      }
    };
  },
  mounted() {
    this.fetchUserData();
  },
  methods: {

    fetchUserData() {
      const user = JSON.parse(localStorage.getItem("user"));
      const id = user.id;
      this.form.id=id;
      console.log(id);
      // 使用 axios 发送 POST 请求，并将参数包装在对象中
      request.post('/user/personalinfo',  id )
          .then((res) => {
            if (res.code === '200') {
              const data = res.data;
              console.log(data);
              this.form.name = data.name;
              this.form.email = data.email;
              this.form.phone = data.phone;
            } else {
              ElMessage.error("获取数据失败");
            }
          })
          .catch((error) => {
            console.error('请求失败:', error);
            ElMessage.error("请求失败，请检查网络或稍后重试");
          });
    },
    handleSubmit() {
      const user = JSON.parse(localStorage.getItem("user"));
      const id = user.id;
      console.log(id);
      request.post('/user/updatePersonalInfo',this.form).then(res=>{
        if(res.code=="200")
        {
          console.log('提交表单:', id,this.form);
          localStorage.removeItem('user');
          localStorage.setItem("user", JSON.stringify(res.data || {}));
          ElMessage.success('个人信息更新成功');
        }
        else {
          ElMessage.error("个人信息提交失败")
        }
      })
    }
  },
    // 提交表单数据到后端

};
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #f2f4ff;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  box-sizing: border-box;
  /* 确保容器不会受到其他样式影响 */
  width: 100%;
  margin: 0 auto;
}

.profile-card {
  width: 100%;
  max-width: 900px;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.profile-card:hover {
  transform: scale(1.02);
}

.card-title {
  text-align: center;
  color: #3a216b;
  font-size: 28px;
  margin: 20px 0 40px;
  position: relative;
}

.card-title::after {
  content: '';
  display: block;
  width: 80px;
  height: 3px;
  background: #3a216b;
  margin: 12px auto 0;
  border-radius: 2px;
}

.demo-form {
  padding: 0 50px 50px;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar {
  width: 120px;
  height: 120px;
  display: block;
  border-radius: 50%;
}

:deep(.el-input__prefix) {
  left: 12px;
  font-size: 18px;
}

.submit-btn {
  width: 220px;
  height: 48px;
  border-radius: 8px;
  font-size: 18px;
  transition: all 0.3s;
}

.submit-btn:hover {
  transform: scale(1.05);
}

.icon {
  margin-right: 8px;
  font-size: 18px;
}

.form-actions {
  margin-top: 40px;
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>