<template>
  <div class="monitor-page">
    <div class="status-cards">
      <div class="status-card glass-card" :class="healthStatus">
        <div class="status-icon">
          <el-icon :size="32"><CircleCheck v-if="healthStatus === 'healthy'" /><Warning v-else /></el-icon>
        </div>
        <div class="status-info">
          <h4>系统状态</h4>
          <p>{{ healthText }}</p>
        </div>
      </div>
      
      <div class="status-card glass-card">
        <div class="status-icon version">
          <el-icon :size="32"><InfoFilled /></el-icon>
        </div>
        <div class="status-info">
          <h4>版本信息</h4>
          <p>v{{ systemInfo.version }}</p>
        </div>
      </div>
      
      <div class="status-card glass-card">
        <div class="status-icon uptime">
          <el-icon :size="32"><Timer /></el-icon>
        </div>
        <div class="status-info">
          <h4>运行时长</h4>
          <p>{{ systemInfo.uptime }}</p>
        </div>
      </div>
      
      <div class="status-card glass-card">
        <div class="status-icon connections">
          <el-icon :size="32"><Connection /></el-icon>
        </div>
        <div class="status-info">
          <h4>当前连接</h4>
          <p>{{ metrics.connections }} 个</p>
        </div>
      </div>
    </div>
    
    <div class="metrics-section">
      <div class="metric-card glass-card">
        <h3>CPU 使用率</h3>
        <div class="metric-value">{{ metrics.cpu }}%</div>
        <el-progress :percentage="metrics.cpu" :stroke-width="8" :show-text="false" :color="getProgressColor(metrics.cpu)" />
      </div>
      
      <div class="metric-card glass-card">
        <h3>内存使用率</h3>
        <div class="metric-value">{{ metrics.memory }}%</div>
        <el-progress :percentage="metrics.memory" :stroke-width="8" :show-text="false" :color="getProgressColor(metrics.memory)" />
      </div>
      
      <div class="metric-card glass-card">
        <h3>磁盘使用率</h3>
        <div class="metric-value">{{ metrics.disk }}%</div>
        <el-progress :percentage="metrics.disk" :stroke-width="8" :show-text="false" :color="getProgressColor(metrics.disk)" />
      </div>
    </div>
    
    <div class="services-section glass-card">
      <h3>服务状态</h3>
      <div class="services-list">
        <div v-for="service in services" :key="service.name" class="service-item">
          <span class="dot" :class="service.status"></span>
          <span class="name">{{ service.name }}</span>
          <span class="status-text">{{ service.statusText }}</span>
          <span class="response">{{ service.responseTime }}ms</span>
        </div>
      </div>
    </div>
    
    <div class="logs-section glass-card">
      <div class="logs-header">
        <h3>异常日志</h3>
        <el-button type="primary" text size="small">查看全部</el-button>
      </div>
      <div class="logs-list">
        <div v-for="log in recentLogs" :key="log.id" class="log-item" :class="log.level">
          <span class="time">{{ log.time }}</span>
          <span class="level">{{ log.levelText }}</span>
          <span class="message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { CircleCheck, Warning, InfoFilled, Timer, Connection } from '@element-plus/icons-vue'
import { getHealthCheck, getMetrics } from '@/api/audit'

const healthStatus = ref('healthy')
const healthText = computed(() => {
  const map = { healthy: '运行正常', warning: '部分异常', error: '系统故障' }
  return map[healthStatus.value]
})

const systemInfo = ref({
  version: '1.0.0',
  uptime: '15天 6小时 23分'
})

const metrics = ref({
  cpu: 35,
  memory: 62,
  disk: 48,
  connections: 156
})

const services = ref([
  { name: 'API Server', status: 'healthy', statusText: '正常', responseTime: 12 },
  { name: 'Redis Cache', status: 'healthy', statusText: '正常', responseTime: 2 },
  { name: 'PostgreSQL', status: 'healthy', statusText: '正常', responseTime: 8 },
  { name: 'RTSP Processor', status: 'warning', statusText: '延迟', responseTime: 156 },
])

const recentLogs = ref([
  { id: 1, time: '10:30:15', level: 'error', levelText: 'ERROR', message: 'RTSP连接超时: 至善楼103' },
  { id: 2, time: '10:28:42', level: 'warn', levelText: 'WARN', message: '内存使用率超过80%' },
  { id: 3, time: '10:25:10', level: 'info', levelText: 'INFO', message: '定时任务执行完成：数据清理' },
])

const getProgressColor = (value) => {
  if (value >= 80) return '#F56C6C'
  if (value >= 60) return '#E6A23C'
  return '#67C23A'
}

let refreshTimer = null

const fetchData = async () => {
  try {
    const [healthRes, metricsRes] = await Promise.all([getHealthCheck(), getMetrics()])
    healthStatus.value = healthRes.data.status
    Object.assign(metrics.value, metricsRes.data)
  } catch (error) {
    console.error('获取监控数据失败:', error)
  }
}

onMounted(() => {
  fetchData()
  refreshTimer = setInterval(fetchData, 10000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style lang="scss" scoped>
.monitor-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
}

.status-card {
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  
  .status-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    
    &.version { background: linear-gradient(135deg, #409EFF 0%, #5B8DEF 100%); }
    &.uptime { background: linear-gradient(135deg, #67C23A 0%, #5daf34 100%); }
    &.connections { background: linear-gradient(135deg, #E6A23C 0%, #d9930a 100%); }
  }
  
  &.healthy .status-icon { background: linear-gradient(135deg, #67C23A 0%, #5daf34 100%); }
  &.warning .status-icon { background: linear-gradient(135deg, #E6A23C 0%, #d9930a 100%); }
  &.error .status-icon { background: linear-gradient(135deg, #F56C6C 0%, #e04545 100%); }
  
  .status-info {
    h4 { font-size: 13px; color: var(--text-muted); margin: 0 0 4px; }
    p { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0; }
  }
}

.metrics-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.metric-card {
  padding: var(--spacing-lg);
  
  h3 { font-size: 14px; color: var(--text-secondary); margin: 0 0 var(--spacing-sm); }
  .metric-value { font-size: 32px; font-weight: 700; color: var(--text-primary); margin-bottom: var(--spacing-md); }
}

.services-section {
  padding: var(--spacing-lg);
  
  h3 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 var(--spacing-md); }
  
  .services-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
  
  .service-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-md);
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--border-radius-sm);
    
    .dot {
      width: 8px; height: 8px; border-radius: 50%;
      &.healthy { background: var(--success-color); }
      &.warning { background: var(--warning-color); }
      &.error { background: var(--danger-color); }
    }
    
    .name { flex: 1; color: var(--text-primary); }
    .status-text { color: var(--text-secondary); font-size: 13px; }
    .response { color: var(--text-muted); font-size: 12px; }
  }
}

.logs-section {
  padding: var(--spacing-lg);
  
  .logs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    
    h3 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0; }
  }
  
  .log-item {
    display: flex;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border-color);
    font-size: 13px;
    
    .time { color: var(--text-muted); width: 80px; }
    .level { width: 50px; font-weight: 600; }
    .message { flex: 1; color: var(--text-secondary); }
    
    &.error .level { color: var(--danger-color); }
    &.warn .level { color: var(--warning-color); }
    &.info .level { color: var(--info-color); }
  }
}

@media (max-width: 1200px) { .status-cards { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { 
  .status-cards, .metrics-section { grid-template-columns: 1fr; }
}
</style>
