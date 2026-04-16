<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const handleResize = () => {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
