<template>
  <div class="settings-page">
    <div class="page-header glass-card">
      <h2>参数配置</h2>
      <p>系统运行参数设置</p>
    </div>
    
    <div class="settings-groups">
      <div class="settings-group glass-card">
        <h3>基础配置</h3>
        <el-form label-width="140px" class="settings-form">
          <el-form-item label="数据刷新频率">
            <el-select v-model="settings.refreshInterval" style="width: 200px">
              <el-option label="5秒" :value="5000" />
              <el-option label="10秒" :value="10000" />
              <el-option label="30秒" :value="30000" />
              <el-option label="1分钟" :value="60000" />
            </el-select>
            <span class="hint">即时生效</span>
          </el-form-item>
          <el-form-item label="数据保留期">
            <el-select v-model="settings.dataRetention" style="width: 200px">
              <el-option label="7天" :value="7" />
              <el-option label="30天" :value="30" />
              <el-option label="90天" :value="90" />
              <el-option label="180天" :value="180" />
            </el-select>
            <span class="hint">需重启服务</span>
          </el-form-item>
        </el-form>
      </div>
      
      <div class="settings-group glass-card">
        <h3>预警阈值</h3>
        <el-form label-width="140px" class="settings-form">
          <el-form-item label="噪声阈值">
            <el-input-number v-model="settings.noiseThreshold" :min="60" :max="100" />
            <span class="unit">dB</span>
          </el-form-item>
          <el-form-item label="拥挤阈值">
            <el-input-number v-model="settings.crowdedThreshold" :min="50" :max="100" />
            <span class="unit">%</span>
          </el-form-item>
          <el-form-item label="设备离线时长">
            <el-input-number v-model="settings.offlineThreshold" :min="5" :max="120" />
            <span class="unit">分钟</span>
          </el-form-item>
        </el-form>
      </div>
      
      <div class="settings-group glass-card">
        <h3>通知设置</h3>
        <el-form label-width="140px" class="settings-form">
          <el-form-item label="启用邮件通知">
            <el-switch v-model="settings.emailEnabled" />
          </el-form-item>
          <el-form-item label="启用短信通知">
            <el-switch v-model="settings.smsEnabled" />
          </el-form-item>
          <el-form-item label="免打扰时段">
            <el-time-picker v-model="settings.quietStart" format="HH:mm" value-format="HH:mm" placeholder="开始" />
            <span style="margin: 0 8px;">至</span>
            <el-time-picker v-model="settings.quietEnd" format="HH:mm" value-format="HH:mm" placeholder="结束" />
          </el-form-item>
        </el-form>
      </div>
      
      <div class="settings-group glass-card">
        <h3>安全设置</h3>
        <el-form label-width="140px" class="settings-form">
          <el-form-item label="会话超时">
            <el-select v-model="settings.sessionTimeout" style="width: 200px">
              <el-option label="30分钟" :value="30" />
              <el-option label="1小时" :value="60" />
              <el-option label="2小时" :value="120" />
              <el-option label="4小时" :value="240" />
            </el-select>
          </el-form-item>
          <el-form-item label="密码强度要求">
            <el-select v-model="settings.passwordStrength" style="width: 200px">
              <el-option label="低（6位以上）" value="low" />
              <el-option label="中（8位，含数字）" value="medium" />
              <el-option label="高（8位，含特殊字符）" value="high" />
            </el-select>
          </el-form-item>
          <el-form-item label="登录失败锁定">
            <el-input-number v-model="settings.loginFailLock" :min="3" :max="10" />
            <span class="unit">次</span>
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <div class="save-actions glass-card">
      <el-button @click="handleReset">恢复默认</el-button>
      <el-button type="primary" @click="handleSave">保存配置</el-button>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, updateSettings } from '@/api/settings'

const settings = reactive({
  refreshInterval: 10000,
  dataRetention: 30,
  noiseThreshold: 80,
  crowdedThreshold: 90,
  offlineThreshold: 30,
  emailEnabled: true,
  smsEnabled: false,
  quietStart: '22:00',
  quietEnd: '08:00',
  sessionTimeout: 60,
  passwordStrength: 'medium',
  loginFailLock: 5
})

const fetchData = async () => {
  try {
    const res = await getSettings()
    Object.assign(settings, res.data)
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

const handleSave = async () => {
  try {
    await updateSettings(settings)
    ElMessage.success('配置保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleReset = () => {
  ElMessage.info('恢复默认配置...')
}

onMounted(() => { fetchData() })
</script>

<style lang="scss" scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.page-header {
  padding: var(--spacing-lg);
  h2 { font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px; }
  p { font-size: 14px; color: var(--text-secondary); margin: 0; }
}

.settings-groups {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.settings-group {
  padding: var(--spacing-lg);
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
  }
  
  .settings-form {
    :deep(.el-form-item__label) { color: var(--text-secondary); }
    
    .hint {
      margin-left: 12px;
      font-size: 12px;
      color: var(--text-muted);
    }
    
    .unit {
      margin-left: 8px;
      color: var(--text-muted);
    }
  }
}

.save-actions {
  padding: var(--spacing-lg);
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .settings-groups { grid-template-columns: 1fr; }
  .save-actions { flex-direction: column; .el-button { width: 100%; } }
}
</style>
