<template>
  <aside class="sidebar" :class="{ collapsed, 'mobile-open': isMobile && isOpen }">
    <button v-if="isMobile" class="close-btn" @click="$emit('close')">
      <el-icon><Close /></el-icon>
    </button>

    <div class="sidebar-header" :class="{ compact: collapsed && !isMobile }">
      <div class="brand-mark">
        <el-icon><OfficeBuilding /></el-icon>
      </div>
      <transition name="brand-fade" mode="out-in">
        <div v-if="!collapsed || isMobile" class="brand-copy">
          <strong>智慧教室后台</strong>
          <span>Control Center</span>
        </div>
      </transition>
    </div>

    <el-scrollbar class="sidebar-scroll">
      <div class="sidebar-nav">
        <el-menu
          class="sidebar-menu"
          :default-active="activeMenuPath"
          :collapse="collapsed && !isMobile"
          :collapse-transition="false"
          :router="true"
        >
          <el-menu-item-group
            v-for="group in filteredMenuGroups"
            :key="group.key"
            class="menu-group"
            :class="{ 'menu-group-collapsed': collapsed && !isMobile }"
          >
            <template #title>
              <span v-if="!collapsed || isMobile" class="group-title">{{ group.title }}</span>
            </template>

            <el-menu-item
              v-for="item in group.items"
              :key="item.path"
              :index="item.path"
              @click="handleNavClick"
            >
              <el-icon class="nav-icon">
                <component :is="item.icon" />
              </el-icon>
              <template #title>{{ item.title }}</template>
            </el-menu-item>
          </el-menu-item-group>
        </el-menu>
      </div>
    </el-scrollbar>

    <div v-if="!isMobile" class="sidebar-footer">
      <button class="collapse-btn" @click="$emit('toggle')">
        <el-icon>
          <ArrowLeft v-if="!collapsed" />
          <ArrowRight v-else />
        </el-icon>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Setting, Bell,
  User, Document, Lock, OfficeBuilding,
  Coin, Calendar,
  ArrowLeft, ArrowRight, Close
} from '@element-plus/icons-vue'

const props = defineProps({
  collapsed: { type: Boolean, default: false },
  isMobile: { type: Boolean, default: false },
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle', 'close'])
const route = useRoute()
const userStore = useUserStore()

const menuGroups = [
  {
    key: 'alerts',
    title: '预警管理',
    items: [
      { path: '/alerts/events', title: '预警事件', icon: Bell, permission: 'alerts:events:view' },
      { path: '/alerts/rules', title: '规则配置', icon: Setting, permission: 'alerts:rules:view' },
          ]
  },
  {
    key: 'system',
    title: '系统管理',
    items: [
      { path: '/system/users', title: '用户管理', icon: User, permission: 'system:users:view' },
      { path: '/system/classrooms', title: '教室管理', icon: OfficeBuilding, permission: 'classroom:view' },
      { path: '/system/roles', title: '角色权限', icon: Lock, permission: 'system:roles:view' },
      { path: '/system/audit', title: '审计日志', icon: Document, permission: 'system:audit:view' }
    ]
  },
  {
    key: 'data',
    title: '数据管理',
    items: [
{ path: '/data/course-schedules', title: '课表导入', icon: Calendar, permission: 'classroom:manage' },
{ path: '/data/storage', title: '存储策略', icon: Coin, permission: 'data:storage:view' }
    ]
  }
]

const filteredMenuGroups = computed(() => menuGroups
  .map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || userStore.hasPermission(item.permission))
  }))
  .filter((group) => group.items.length > 0)
)

const allMenuItems = computed(() => filteredMenuGroups.value.flatMap((group) => group.items))

const activeMenuPath = computed(() => {
  const matched = allMenuItems.value.find((item) => route.path === item.path || route.path.startsWith(item.path + '/'))
  return matched?.path || route.path
})

const handleNavClick = () => {
  if (props.isMobile) {
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 258px;
  height: 100vh;
  padding: 16px 14px;
  background: linear-gradient(180deg, rgba(255, 250, 246, 0.94), rgba(247, 241, 235, 0.96));
  border-right: 1px solid rgba(166, 115, 83, 0.14);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition:
    width 0.16s ease-out,
    transform 0.16s ease-out;
  z-index: 1000;
  box-shadow: 6px 0 18px rgba(91, 52, 36, 0.04);
  contain: layout paint;
  will-change: width, transform;

  &.collapsed {
    width: 86px;

    .sidebar-header {
      justify-content: center;
    }
  }
}

.close-btn {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 34px;
  height: 34px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(166, 115, 83, 0.16);
  border-radius: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.sidebar-header {
  padding: 14px 12px 18px;
  display: flex;
  align-items: center;
  gap: 12px;

  &.compact {
    justify-content: center;
  }
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: var(--primary-gradient, linear-gradient(135deg, #bf4d3c 0%, #a23d2e 100%));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 16px 28px rgba(182, 58, 43, 0.22);
  flex-shrink: 0;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  overflow: hidden;

  strong {
    font-size: 16px;
    color: var(--text-primary);
  }

  span {
    font-size: 12px;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
}

.sidebar-scroll {
  flex: 1;
  min-height: 0;

  :deep(.el-scrollbar__view) {
    min-height: 100%;
  }
}

.sidebar-nav {
  padding: 8px 4px;
  min-height: 100%;
}

.group-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.sidebar-menu {
  border-right: none;
  background: transparent;
  min-height: 100%;

  :deep(.el-menu) {
    border-right: none;
  }

  :deep(.el-menu-item-group) {
    margin-bottom: 14px;
  }

  :deep(.el-menu-item-group__title) {
    padding: 10px 14px 8px;
    line-height: 1.2;
  }

  :deep(.el-menu-item) {
    height: 48px;
    margin-bottom: 4px;
    border-radius: 16px;
    color: var(--text-secondary);
    transition: background-color 0.12s ease, color 0.12s ease;
  }

  :deep(.el-menu-item:hover) {
    background: rgba(182, 58, 43, 0.06);
    color: var(--primary-color);
  }

  :deep(.el-menu-item.is-active) {
    background: linear-gradient(135deg, rgba(182, 58, 43, 0.92), rgba(143, 47, 37, 0.9));
    color: #fff;
    box-shadow: 0 16px 28px rgba(182, 58, 43, 0.22);
  }

  :deep(.el-menu-item.is-active .el-icon) {
    color: #fff;
  }

  :deep(.el-menu--collapse .el-menu-item) {
    justify-content: center;
    padding: 0;
  }

  :deep(.el-menu--collapse .el-menu-item-group__title) {
    display: none;
  }
}

.menu-group-collapsed {
  :deep(.el-menu-item-group__title) {
    display: none !important;
    height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
  }
}

.nav-icon {
  font-size: 18px;
}

.sidebar-footer {
  padding: 12px 4px 2px;
}

.collapse-btn {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(166, 115, 83, 0.16);
  border-radius: 16px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.92);
    border-color: rgba(166, 115, 83, 0.24);
  }
}

.brand-fade-enter-active,
.brand-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.brand-fade-enter-from,
.brand-fade-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: 288px;

    &.mobile-open {
      transform: translateX(0);
    }

    &.collapsed {
      width: 288px;

      .sidebar-header {
        justify-content: flex-start;
      }
    }
  }
}
</style>

