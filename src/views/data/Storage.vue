<template>
  <div class="storage-page">
    <div class="page-header glass-card">
      <h2>存储策略配置</h2>
      <p>配置数据存储和归档策略</p>
    </div>
    
    <div class="storage-overview">
      <div class="storage-card glass-card">
        <h3>PostgreSQL</h3>
        <div class="usage-info">
          <div class="usage-bar">
            <div class="usage-fill" :style="{ width: storage.pg.usage + '%' }"></div>
          </div>
          <div class="usage-text">
            <span>已用 {{ storage.pg.used }}</span>
            <span>共 {{ storage.pg.total }}</span>
          </div>
        </div>
        <div class="storage-details">
          <div class="detail-item">
            <span class="label">元数据</span>
            <span class="value">{{ storage.pg.metadata }}</span>
          </div>
          <div class="detail-item">
            <span class="label">事件记录</span>
            <span class="value">{{ storage.pg.events }}</span>
          </div>
        </div>
      </div>
      
      <div class="storage-card glass-card">
        <h3>Redis Cache</h3>
        <div class="usage-info">
          <div class="usage-bar">
            <div class="usage-fill" :style="{ width: storage.redis.usage + '%' }"></div>
          </div>
          <div class="usage-text">
            <span>已用 {{ storage.redis.used }}</span>
            <span>共 {{ storage.redis.total }}</span>
          </div>
        </div>
        <div class="storage-details">
          <div class="detail-item">
            <span class="label">实时状态</span>
            <span class="value">{{ storage.redis.status }}</span>
          </div>
          <div class="detail-item">
            <span class="label">会话数据</span>
            <span class="value">{{ storage.redis.session }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="retention-config glass-card">
      <h3>数据保留策略</h3>
      <el-form label-width="140px" class="config-form">
        <el-form-item label="实时状态数据">
          <el-select v-model="retention.realtime" style="width: 200px">
            <el-option label="24小时" :value="1" />
            <el-option label="3天" :value="3" />
            <el-option label="7天" :value="7" />
          </el-select>
          <span class="hint">存储在 Redis</span>
        </el-form-item>
        <el-form-item label="历史状态数据">
          <el-select v-model="retention.history" style="width: 200px">
            <el-option label="30天" :value="30" />
            <el-option label="90天" :value="90" />
            <el-option label="180天" :value="180" />
            <el-option label="365天" :value="365" />
          </el-select>
          <span class="hint">存储在 PostgreSQL</span>
        </el-form-item>
        <el-form-item label="预警事件">
          <el-select v-model="retention.alerts" style="width: 200px">
            <el-option label="90天" :value="90" />
            <el-option label="180天" :value="180" />
            <el-option label="365天" :value="365" />
            <el-option label="永久保留" :value="-1" />
          </el-select>
        </el-form-item>
        <el-form-item label="审计日志">
          <el-select v-model="retention.audit" style="width: 200px">
            <el-option label="180天" :value="180" />
            <el-option label="365天" :value="365" />
            <el-option label="永久保留" :value="-1" />
          </el-select>
        </el-form-item>
        <el-form-item label="自动归档">
          <el-switch v-model="retention.autoArchive" />
          <span class="hint">超期数据自动归档到冷存储</span>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="cleanup-section glass-card">
      <h3>数据清理</h3>
      <p class="section-desc">手动清理过期数据，释放存储空间</p>
      <div class="cleanup-actions">
        <el-button @click="handleCleanup('cache')">清理缓存数据</el-button>
        <el-button @click="handleCleanup('temp')">清理临时文件</el-button>
        <el-button type="danger" @click="handleCleanup('expired')">清理过期数据</el-button>
      </div>
    </div>
    
    <div class="save-actions glass-card">
      <el-button type="primary" @click="handleSave">保存配置</el-button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const storage = reactive({
  pg: { usage: 35, used: '12.5 GB', total: '36 GB', metadata: '2.1 GB', events: '10.4 GB' },
  redis: { usage: 28, used: '1.4 GB', total: '5 GB', status: '0.8 GB', session: '0.6 GB' }
})

const retention = reactive({
  realtime: 3,
  history: 90,
  alerts: 180,
  audit: 365,
  autoArchive: true
})

const handleSave = () => {
  ElMessage.success('存储策略保存成功')
}

const handleCleanup = async (type) => {
  const typeNames = { cache: '缓存数据', temp: '临时文件', expired: '过期数据' }
  try {
    await ElMessageBox.confirm(`确定要清理${typeNames[type]}吗？`, '清理确认', { type: 'warning' })
    ElMessage.success(`${typeNames[type]}清理完成`)
  } catch {}
}
</script>

<style lang="scss" scoped>
.storage-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.page-header {
  padding: var(--spacing-lg);
  h2 { font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px; }
  p { font-size: 14px; color: var(--text-secondary); margin: 0; }
}

.storage-overview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.storage-card {
  padding: var(--spacing-lg);
  
  h3 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 var(--spacing-md); }
  
  .usage-info {
    .usage-bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      
      .usage-fill {
        height: 100%;
        background: var(--primary-gradient);
        border-radius: 4px;
        transition: width 0.3s ease;
      }
    }
    
    .usage-text {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 13px;
      color: var(--text-secondary);
    }
  }
  
  .storage-details {
    display: flex;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border-color);
    
    .detail-item {
      .label { display: block; font-size: 12px; color: var(--text-muted); }
      .value { font-size: 14px; font-weight: 500; color: var(--text-primary); }
    }
  }
}

.retention-config, .cleanup-section {
  padding: var(--spacing-lg);
  
  h3 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 var(--spacing-md); }
  
  .section-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 var(--spacing-md); }
  
  .config-form {
    :deep(.el-form-item__label) { color: var(--text-secondary); }
    .hint { margin-left: 12px; font-size: 12px; color: var(--text-muted); }
  }
  
  .cleanup-actions { display: flex; gap: var(--spacing-md); flex-wrap: wrap; }
}

.save-actions {
  padding: var(--spacing-lg);
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .storage-overview { grid-template-columns: 1fr; }
  .cleanup-actions { flex-direction: column; .el-button { width: 100%; } }
}
</style>
