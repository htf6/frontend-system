<template>
  <header class="header">
    <div class="header-left">
      <button class="menu-btn" @click="handleMenuClick">
        <el-icon><Menu /></el-icon>
      </button>
      <div class="breadcrumb">
        <span class="page-title">{{ currentTitle }}</span>
      </div>
    </div>
    
    <div class="header-right">
      <div class="status-badge" :class="systemStatus">
        <span class="dot"></span>
        <span v-if="!isMobile" class="text">{{ statusText }}</span>
      </div>
      
      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="isMobile ? 32 : 36" :src="avatar">
            {{ userStore.userName.charAt(0) }}
          </el-avatar>
          <span v-if="!isMobile" class="user-name">{{ userStore.userName }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon> 个人中心
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon> 修改密码
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon> 退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Menu, ArrowDown, User, Lock, SwitchButton } from '@element-plus/icons-vue'

const props = defineProps({
  collapsed: { type: Boolean, default: false },
  isMobile: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle', 'toggleMobile'])
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const systemStatus = ref('healthy')
const avatar = computed(() => userStore.userInfo?.avatar || '')
const currentTitle = computed(() => route.meta?.title || '首页')

const statusText = computed(() => {
  const map = { healthy: '系统正常', warning: '部分异常', error: '系统故障' }
  return map[systemStatus.value] || '未知'
})

const handleMenuClick = () => {
  if (props.isMobile) {
    emit('toggleMobile')
  } else {
    emit('toggle')
  }
}

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心功能开发中...')
      break
    case 'password':
      ElMessage.info('修改密码功能开发中...')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
        userStore.logout()
        router.push('/login')
        ElMessage.success('已退出登录')
      } catch {}
      break
  }
}
</script>

<style lang="scss" scoped>
.header {
  height: 64px;
  padding: 0 var(--spacing-lg);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  
  .menu-btn {
    display: none;
    width: 40px;
    height: 40px;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-sm);
    color: var(--text-primary);
    cursor: pointer;
    
    &:hover {
      background: var(--bg-card-hover);
    }
    
    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .page-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  
  .status-badge {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    &.healthy {
      background: rgba(103, 194, 58, 0.15);
      .dot { background: var(--success-color); }
      .text { color: var(--success-color); }
    }
    
    &.warning {
      background: rgba(230, 162, 60, 0.15);
      .dot { background: var(--warning-color); }
      .text { color: var(--warning-color); }
    }
    
    &.error {
      background: rgba(245, 108, 108, 0.15);
      .dot { background: var(--danger-color); animation-duration: 1s; }
      .text { color: var(--danger-color); }
    }
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 6px 12px;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background 0.2s ease;
    
    &:hover { background: var(--bg-card-hover); }
    
    .user-name {
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 500;
    }
    
    .el-icon { color: var(--text-secondary); }
  }
}

@media (max-width: 768px) {
  .header {
    height: 56px;
    padding: 0 var(--spacing-md);
  }
  
  .header-left .page-title { font-size: 16px; }
  
  .header-right {
    gap: var(--spacing-sm);
    
    .status-badge { padding: 4px 8px; }
    .user-info { padding: 4px 8px; }
  }
}
</style>
