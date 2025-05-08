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
  background: #f2f4ff;
  padding: 20px 40px; /* 增加左右内边距 */
  box-sizing: border-box;
  width: 100%;
  min-height: calc(100vh - 60px);
  display: flex;
  justify-content: flex-start;
}

.profile-card {
  width: 100%;
  max-width: 1200px; /* 扩展最大宽度 */
  min-width: 800px; /* 增加最小宽度 */
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  margin-left: 20px;
}

.card-title {
  text-align: left;
  padding-left: 40px; /* 增加标题左侧间距 */
  margin: 30px 0; /* 增加标题间距 */
  font-size: 32px; /* 放大标题字号 */
}

.demo-form {
  padding: 0 40px 40px; /* 增加表单内边距 */
}

/* 输入项扩展 */
:deep(.el-form-item__content) {
  flex: 1;
  max-width: 800px; /* 输入区域最大宽度 */
}

:deep(.custom-input) {
  width: 100%;
  height: 48px; /* 增加输入框高度 */
  font-size: 16px;
}

/* 按钮放大 */
.submit-btn {
  width: 240px;
  height: 52px;
  font-size: 20px;
}

/* 响应式调整 */
@media (max-width: 1600px) {
  .profile-card {
    margin-left: 10px;
    min-width: auto;
  }
  
  :deep(.custom-input) {
    height: 44px;
  }
}

@media (max-width: 1200px) {
  .profile-container {
    padding: 20px;
  }
  
  .demo-form {
    padding: 0 20px 30px;
  }
}
</style>