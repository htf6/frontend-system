<template>
  <div class="rules-page">
    <section class="page-header glass-card">
      <div class="header-main">
        <span class="header-badge"><ShieldAlert :size="22" /></span>
        <div>
          <h2>预警规则</h2>
          <p>统一管理阈值、作用范围和生效时段。</p>
        </div>
      </div>
      <el-button type="primary" @click="handleAdd">
        <Plus :size="16" />
        <span>新增规则</span>
      </el-button>
    </section>

    <section class="filter-card glass-card">
      <div class="filter-grid">
        <el-input v-model="searchQuery" placeholder="按规则名称或说明搜索" clearable>
          <template #prefix>
            <Search :size="16" />
          </template>
        </el-input>
        <el-select v-model="typeFilter" placeholder="全部类型" clearable>
          <el-option label="噪声预警" value="noise" />
          <el-option label="拥挤预警" value="crowded" />
          <el-option label="设备异常" value="device" />
          <el-option label="能耗预警" value="energy" />
        </el-select>
        <el-select v-model="enabledFilter" placeholder="全部状态" clearable>
          <el-option label="启用中" :value="true" />
          <el-option label="已停用" :value="false" />
        </el-select>
      </div>
    </section>

    <section class="stats-grid">
      <article v-for="item in statCards" :key="item.key" class="stat-card glass-card">
        <span class="stat-icon"><component :is="item.icon" :size="18" /></span>
        <div>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </article>
    </section>

    <section class="table-card glass-card">
      <div class="table-head">
        <div class="panel-title-wrap">
          <span class="panel-icon"><FileText :size="18" /></span>
          <div>
            <h3>规则列表</h3>
            <p>{{ filteredRules.length }} 条规则符合当前筛选条件</p>
          </div>
        </div>
      </div>

      <el-empty v-if="!filteredRules.length" description="暂无符合条件的规则" />
      <el-table v-else :data="filteredRules" v-loading="loading" max-height="560">
        <el-table-column type="index" label="序号" width="72" />
        <el-table-column prop="name" label="规则名称" min-width="180" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="阈值" width="120">
          <template #default="{ row }">{{ row.threshold }}{{ row.unit }}</template>
        </el-table-column>
        <el-table-column prop="scopeLabel" label="作用范围" min-width="140" />
        <el-table-column prop="timeRange" label="生效时段" width="140" />
        <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '启用中' : '已停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启停" width="92">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="handleToggle(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增规则' : '编辑规则'" width="620px" append-to-body>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="96px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="噪声预警" value="noise" />
            <el-option label="拥挤预警" value="crowded" />
            <el-option label="设备异常" value="device" />
            <el-option label="能耗预警" value="energy" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警阈值" prop="threshold">
          <el-input-number v-model="formData.threshold" :min="1" :max="9999" />
          <span class="field-suffix">{{ currentUnit }}</span>
        </el-form-item>
        <el-form-item label="作用范围" prop="scope">
          <el-select v-model="formData.scope" placeholder="请选择作用范围" style="width: 100%">
            <el-option label="全部教室" value="all" />
            <el-option label="至善楼" value="zhishan" />
            <el-option label="博学楼" value="boxue" />
          </el-select>
        </el-form-item>
        <el-form-item label="生效时间">
          <div class="time-range-row">
            <el-time-picker v-model="formData.startTime" value-format="HH:mm" format="HH:mm" placeholder="开始时间" />
            <span>至</span>
            <el-time-picker v-model="formData.endTime" value-format="HH:mm" format="HH:mm" placeholder="结束时间" />
          </div>
        </el-form-item>
        <el-form-item label="规则说明">
          <el-input v-model="formData.description" type="textarea" rows="3" placeholder="请输入说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button plain @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createAlertRule, deleteAlertRule, getAlertRules, toggleAlertRule, updateAlertRule } from '@/api/alerts'
import { FileText, Plus, Search, ShieldAlert } from 'lucide-vue-next'

const loading = ref(false)
const saving = ref(false)
const searchQuery = ref('')
const typeFilter = ref('')
const enabledFilter = ref(undefined)
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const rules = ref([])

const formData = reactive({
  id: null,
  name: '',
  type: 'noise',
  threshold: 80,
  scope: 'all',
  startTime: '08:00',
  endTime: '22:00',
  description: '',
  enabled: true
})

const formRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  threshold: [{ required: true, message: '请输入告警阈值', trigger: 'blur' }]
}

const currentUnit = computed(() => ({
  noise: 'dB',
  crowded: '%',
  device: '分钟',
  energy: 'kWh'
}[formData.type] || ''))

const filteredRules = computed(() => rules.value.filter((rule) => {
  const keyword = searchQuery.value.trim().toLowerCase()
  const matchKeyword = !keyword
    || rule.name.toLowerCase().includes(keyword)
    || String(rule.description || '').toLowerCase().includes(keyword)
  const matchType = !typeFilter.value || rule.type === typeFilter.value
  const matchEnabled = typeof enabledFilter.value !== 'boolean' || rule.enabled === enabledFilter.value
  return matchKeyword && matchType && matchEnabled
}))

const statCards = computed(() => [
  { key: 'total', label: '规则总数', value: rules.value.length, icon: FileText },
  { key: 'enabled', label: '启用中', value: rules.value.filter((item) => item.enabled).length, icon: ShieldAlert },
  { key: 'disabled', label: '已停用', value: rules.value.filter((item) => !item.enabled).length, icon: ShieldAlert },
  { key: 'types', label: '类型数', value: new Set(rules.value.map((item) => item.type)).size, icon: ShieldAlert }
])

const getTypeLabel = (type) => ({
  noise: '噪声预警',
  crowded: '拥挤预警',
  device: '设备异常',
  energy: '能耗预警'
}[type] || type || '-')

const getTypeTag = (type) => ({
  noise: 'warning',
  crowded: 'danger',
  device: 'info',
  energy: 'success'
}[type] || 'info')

const getScopeLabel = (scope) => ({
  all: '全部教室',
  zhishan: '至善楼',
  boxue: '博学楼'
}[scope] || scope || '全部教室')

const normalizeRule = (item) => ({
  id: item.id,
  name: item.name || '-',
  type: item.type || 'noise',
  threshold: item.threshold ?? 0,
  unit: item.unit || ({ noise: 'dB', crowded: '%', device: '分钟', energy: 'kWh' }[item.type] || ''),
  scope: item.scope || 'all',
  scopeLabel: item.scopeLabel || item.scopeName || getScopeLabel(item.scope),
  timeRange: item.timeRange || `${item.startTime || '08:00'}-${item.endTime || '22:00'}`,
  startTime: item.startTime || item.timeRange?.split('-')?.[0] || '08:00',
  endTime: item.endTime || item.timeRange?.split('-')?.[1] || '22:00',
  description: item.description || '-',
  enabled: item.enabled !== false
})

const buildPayload = () => ({
  name: formData.name,
  type: formData.type,
  typeName: getTypeLabel(formData.type),
  threshold: formData.threshold,
  unit: currentUnit.value,
  scope: formData.scope,
  scopeLabel: getScopeLabel(formData.scope),
  startTime: formData.startTime,
  endTime: formData.endTime,
  timeRange: `${formData.startTime || '00:00'}-${formData.endTime || '23:59'}`,
  description: formData.description || '',
  enabled: formData.enabled
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAlertRules()
    const payload = res?.data ?? {}
    const list = Array.isArray(payload) ? payload : (payload.list || payload.records || [])
    rules.value = list.map(normalizeRule)
  } catch (error) {
    console.error('获取规则列表失败:', error)
    ElMessage.error('获取规则列表失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(formData, {
    id: null,
    name: '',
    type: 'noise',
    threshold: 80,
    scope: 'all',
    startTime: '08:00',
    endTime: '22:00',
    description: '',
    enabled: true
  })
}

const handleAdd = () => {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (rule) => {
  dialogType.value = 'edit'
  Object.assign(formData, rule)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload = buildPayload()
    if (dialogType.value === 'add') {
      await createAlertRule(payload)
      ElMessage.success('规则已创建')
    } else {
      await updateAlertRule(formData.id, payload)
      ElMessage.success('规则已更新')
    }
    dialogVisible.value = false
    await fetchData()
  } catch (error) {
    console.error('保存规则失败:', error)
    ElMessage.error('保存规则失败')
  } finally {
    saving.value = false
  }
}

const handleToggle = async (rule) => {
  try {
    await toggleAlertRule(rule.id, rule.enabled)
    ElMessage.success(rule.enabled ? '规则已启用' : '规则已停用')
  } catch (error) {
    console.error('切换规则状态失败:', error)
    rule.enabled = !rule.enabled
    ElMessage.error('切换规则状态失败')
  }
}

const handleDelete = async (rule) => {
  try {
    await ElMessageBox.confirm(`确认删除规则“${rule.name}”吗？`, '删除规则', { type: 'warning' })
    await deleteAlertRule(rule.id)
    ElMessage.success('规则已删除')
    await fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除规则失败:', error)
    }
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.rules-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header,
.filter-card,
.table-card {
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
.panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-badge,
.panel-icon,
.stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: var(--primary-color);
  background: linear-gradient(135deg, #fff4ef 0%, #f7ece8 100%);
  border: 1px solid rgba(191, 77, 60, 0.08);
}

.header-badge {
  width: 48px;
  height: 48px;
}

.header-main h2 {
  font-size: 28px;
  margin-bottom: 6px;
}

.header-main p,
.panel-title-wrap p {
  color: var(--text-secondary);
}

.filter-grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(2, minmax(0, 180px));
  gap: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
}

.stat-card span {
  color: var(--text-secondary);
}

.stat-icon,
.panel-icon {
  width: 38px;
  height: 38px;
}

.table-head {
  margin-bottom: 16px;
}

.field-suffix {
  margin-left: 10px;
  color: var(--text-secondary);
}

.time-range-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: center;
  width: 100%;
}

@media (max-width: 1080px) {
  .filter-grid,
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header,
  .header-main {
    flex-direction: column;
    align-items: stretch;
  }

  .header-main,
  .panel-title-wrap {
    align-items: center;
  }

  .page-header,
  .filter-card,
  .table-card {
    padding: 18px;
  }

  .filter-grid,
  .stats-grid,
  .time-range-row {
    grid-template-columns: 1fr;
  }
}
</style>
