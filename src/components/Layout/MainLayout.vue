<template>
  <div class="main-layout" :class="{ 'sidebar-collapsed': isCollapsed, 'sidebar-open': isMobileMenuOpen }">
    <div v-if="isMobile && isMobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>
    
    <Sidebar 
      :collapsed="isCollapsed" 
      :isMobile="isMobile"
      :isOpen="isMobileMenuOpen"
      @toggle="toggleSidebar" 
      @close="closeMobileMenu"
    />
    <div class="layout-content">
      <Header 
        :collapsed="isCollapsed" 
        :isMobile="isMobile"
        @toggle="toggleSidebar" 
        @toggleMobile="toggleMobileMenu"
      />
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Sidebar from './SidebarLibrary.vue'
import Header from './HeaderLibrary.vue'

const isCollapsed = ref(false)
const isMobileMenuOpen = ref(false)
const windowWidth = ref(window.innerWidth)

const isMobile = computed(() => windowWidth.value < 768)

const toggleSidebar = () => {
  if (isMobile.value) {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  } else {
    isCollapsed.value = !isCollapsed.value
  }
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
  if (!isMobile.value) {
    isMobileMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.main-layout {
  --sidebar-width: 258px;
  --sidebar-collapsed-width: 86px;
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: var(--bg-dark);
  
  .layout-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-left: var(--sidebar-width);
    min-width: 0;
    min-height: 0;
  }
  
  &.sidebar-collapsed .layout-content {
    margin-left: var(--sidebar-collapsed-width);
  }
  
  .main-content {
    flex: 1;
    min-height: 0;
    padding: var(--spacing-lg);
    overflow-y: auto;
    overflow-x: auto;
    contain: layout paint;
  }
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  animation: fadeIn 0.2s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.22s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 768px) {
  .main-layout {
    .layout-content {
      margin-left: 0 !important;
    }
    
    .main-content {
      padding: var(--spacing-md);
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
