<template>
  <div class="channels-page">
    <section class="page-header glass-card">
      <div class="header-main">
        <span class="header-badge"><Send :size="22" /></span>
        <div>
          <h2>通知通道</h2>
          <p>配置站内消息、邮件、短信和企业微信等通知方式。</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button plain @click="handleValidate">校验配置</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
      </div>
    </section>

    <section class="summary-row">
      <div class="summary-chip">
        <Bell :size="16" />
        <span>已启用 {{ enabledChannelCount }} 个通道</span>
      </div>
      <div class="summary-chip success">
        <CircleCheck :size="16" />
        <span>{{ validationErrors.length ? `存在 ${validationErrors.length} 项待修正` : '当前配置校验通过' }}</span>
      </div>
    </section>

    <section class="channels-grid">
      <article class="channel-card glass-card">
        <div class="channel-head">
          <div class="channel-title">
            <span class="channel-icon tone-primary"><Bell :size="20" /></span>
            <div>
              <h3>站内消息</h3>
              <p>默认启用，适合作为基础兜底通道。</p>
            </div>
          </div>
          <el-switch v-model="channels.inApp" disabled />
        </div>
        <el-form-item label="接收对象">
          <el-checkbox-group v-model="channels.inAppReceivers">
            <el-checkbox label="admin">系统管理员</el-checkbox>
            <el-checkbox label="teacher">教务管理员</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </article>

      <article class="channel-card glass-card">
        <div class="channel-head">
          <div class="channel-title">
            <span class="channel-icon tone-success"><Mail :size="20" /></span>
            <div>
              <h3>邮件通知</h3>
              <p>适合发送较完整的告警上下文和处置建议。</p>
            </div>
          </div>
          <el-switch v-model="channels.email" />
        </div>
        <div v-if="channels.email" class="channel-body">
          <el-form-item label="SMTP 服务">
            <el-input v-model="channels.emailConfig.smtp" placeholder="smtp.example.com" />
          </el-form-item>
          <el-form-item label="发件邮箱">
            <el-input v-model="channels.emailConfig.sender" placeholder="noreply@example.com" />
          </el-form-item>
        </div>
      </article>

      <article class="channel-card glass-card">
        <div class="channel-head">
          <div class="channel-title">
            <span class="channel-icon tone-warning"><Smartphone :size="20" /></span>
            <div>
              <h3>短信通知</h3>
              <p>适合高优先级、需要即时触达的场景。</p>
            </div>
          </div>
          <el-switch v-model="channels.sms" />
        </div>
        <div v-if="channels.sms" class="channel-body">
          <el-form-item label="短信服务商">
            <el-select v-model="channels.smsConfig.provider" style="width: 100%">
              <el-option label="阿里云短信" value="aliyun" />
              <el-option label="腾讯云短信" value="tencent" />
            </el-select>
          </el-form-item>
          <el-form-item label="API 密钥">
            <el-input v-model="channels.smsConfig.apiKey" type="password" show-password placeholder="请输入 API 密钥" />
          </el-form-item>
        </div>
      </article>

      <article class="channel-card glass-card">
        <div class="channel-head">
          <div class="channel-title">
            <span class="channel-icon tone-info"><MessageSquare :size="20" /></span>
            <div>
              <h3>企业微信</h3>
              <p>适合对接值班群和部门群做集中通知。</p>
            </div>
          </div>
          <el-switch v-model="channels.wechat" />
        </div>
        <div v-if="channels.wechat" class="channel-body">
          <el-form-item label="Webhook 地址">
            <el-input v-model="channels.wechatConfig.webhook" placeholder="https://qyapi.weixin.qq.com/..." />
          </el-form-item>
        </div>
      </article>
    </section>

    <section class="tips-card glass-card">
      <h3>接入建议</h3>
      <p>当前页面已支持配置保存和本地校验。若要真正发送“测试通知”，后端还需要补一个通知测试接口，并让消息发送服务复用同一套渠道配置。</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getNotificationChannels, updateNotificationChannels } from '@/api/alerts'
import { Bell, CircleCheck, Mail, MessageSquare, Send, Smartphone } from 'lucide-vue-next'

const saving = ref(false)

const channels = reactive({
  inApp: true,
  inAppReceivers: ['admin', 'teacher'],
  email: false,
  emailConfig: { smtp: '', sender: '' },
  sms: false,
  smsConfig: { provider: 'aliyun', apiKey: '' },
  wechat: false,
  wechatConfig: { webhook: '' }
})

const enabledChannelCount = computed(() => [channels.inApp, channels.email, channels.sms, channels.wechat].filter(Boolean).length)

const validationErrors = computed(() => {
  const errors = []
  if (!channels.inAppReceivers.length) {
    errors.push('站内消息至少选择一个接收对象')
  }
  if (channels.email) {
    if (!channels.emailConfig.smtp.trim()) errors.push('邮件通知缺少 SMTP 服务地址')
    if (!channels.emailConfig.sender.trim()) errors.push('邮件通知缺少发件邮箱')
  }
  if (channels.sms && !channels.smsConfig.apiKey.trim()) {
    errors.push('短信通知缺少 API 密钥')
  }
  if (channels.wechat && !channels.wechatConfig.webhook.trim()) {
    errors.push('企业微信缺少 Webhook 地址')
  }
  return errors
})

const mergeChannelConfig = (data = {}) => {
  channels.inApp = data.inApp ?? true
  channels.inAppReceivers = Array.isArray(data.inAppReceivers) ? data.inAppReceivers : ['admin', 'teacher']
  channels.email = data.email ?? false
  channels.emailConfig = {
    smtp: data.emailConfig?.smtp || '',
    sender: data.emailConfig?.sender || ''
  }
  channels.sms = data.sms ?? false
  channels.smsConfig = {
    provider: data.smsConfig?.provider || 'aliyun',
    apiKey: data.smsConfig?.apiKey || ''
  }
  channels.wechat = data.wechat ?? false
  channels.wechatConfig = {
    webhook: data.wechatConfig?.webhook || ''
  }
}

const fetchData = async () => {
  try {
    const res = await getNotificationChannels()
    mergeChannelConfig(res?.data || {})
  } catch (error) {
    console.error('获取通知通道配置失败:', error)
    ElMessage.error('获取通知通道配置失败')
  }
}

const handleValidate = () => {
  if (!validationErrors.value.length) {
    ElMessage.success('当前通知配置校验通过')
    return
  }
  ElMessage.warning(validationErrors.value[0])
}

const handleSave = async () => {
  if (validationErrors.value.length) {
    ElMessage.warning(validationErrors.value[0])
    return
  }

  saving.value = true
  try {
    await updateNotificationChannels({
      inApp: channels.inApp,
      inAppReceivers: channels.inAppReceivers,
      email: channels.email,
      emailConfig: channels.emailConfig,
      sms: channels.sms,
      smsConfig: channels.smsConfig,
      wechat: channels.wechat,
      wechatConfig: channels.wechatConfig
    })
    ElMessage.success('通知配置已保存')
  } catch (error) {
    console.error('保存通知配置失败:', error)
    ElMessage.error('保存通知配置失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.channels-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header,
.tips-card {
  padding: 22px 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.header-main,
.channel-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-badge,
.channel-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.header-badge {
  width: 48px;
  height: 48px;
  color: var(--primary-color);
  background: linear-gradient(135deg, #fff4ef 0%, #f7ece8 100%);
  border: 1px solid rgba(191, 77, 60, 0.08);
}

.header-main h2 {
  font-size: 28px;
  margin-bottom: 6px;
}

.header-main p,
.summary-chip span,
.channel-title p,
.tips-card p {
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-chip {
  height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-subtle);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.summary-chip.success {
  background: #f4fbf6;
  border-color: rgba(63, 143, 96, 0.16);
}

.channels-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.channel-card {
  padding: 20px;
}

.channel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.channel-title h3 {
  font-size: 18px;
  margin-bottom: 6px;
}

.channel-title p {
  font-size: 13px;
}

.channel-icon {
  width: 44px;
  height: 44px;
  color: #fff;
}

.tone-primary {
  background: linear-gradient(135deg, #bf4d3c 0%, #a23d2e 100%);
}

.tone-success {
  background: linear-gradient(135deg, #3f8f60 0%, #2f7d54 100%);
}

.tone-warning {
  background: linear-gradient(135deg, #c9892c 0%, #b5761d 100%);
}

.tone-info {
  background: linear-gradient(135deg, #728096 0%, #5a677a 100%);
}

.channel-body {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.tips-card h3 {
  font-size: 18px;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .page-header,
  .header-main,
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .header-main,
  .channel-title {
    align-items: center;
  }

  .page-header,
  .tips-card {
    padding: 18px;
  }

  .channels-grid {
    grid-template-columns: 1fr;
  }
}
</style>
