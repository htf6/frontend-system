<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="grid-lines"></div>
    </div>
    
    <div class="login-container">
      <div class="login-card glass-card animate-fade-in">
        <div class="login-header">
          <div class="logo">🛡️</div>
          <h1>智慧教室巡课系统</h1>
          <p>系统管理员端</p>
        </div>
        
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="formData.username"
              placeholder="用户名"
              prefix-icon="User"
              size="large"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="密码"
              prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-checkbox v-model="formData.remember">记住登录状态</el-checkbox>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="login-btn"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="login-footer">
          <p>仅限授权管理员访问</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const formData = reactive({
  username: '',
  password: '',
  remember: false
})

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      await userStore.login({
        username: formData.username,
        password: formData.password
      })
      
      ElMessage.success('登录成功')
      const redirect = route.query.redirect || '/alerts/events'
      router.push(redirect)
    } catch (error) {
      ElMessage.error(error.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  background: var(--bg-dark);
  
  .grid-lines {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(211, 47, 47, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(211, 47, 47, 0.05) 1px, transparent 1px);
    background-size: 50px 50px;
  }
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: var(--spacing-lg);
}

.login-card {
  padding: 48px 40px;
  text-align: center;
}

.login-header {
  margin-bottom: 40px;
  
  .logo {
    font-size: 56px;
    margin-bottom: 16px;
  }
  
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 8px;
  }
  
  p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
  }
}

.login-form {
  text-align: left;
  
  :deep(.el-input__wrapper) {
    padding: 8px 16px;
  }
  
  :deep(.el-checkbox__label) {
    color: var(--text-secondary);
  }
  
  .login-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    background: var(--primary-gradient);
    border: none;
    
    &:hover { opacity: 0.9; color: #fff; }
  }
}

.login-footer {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
  
  p {
    font-size: 12px;
    color: var(--text-muted);
    margin: 0;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }
}
</style>
