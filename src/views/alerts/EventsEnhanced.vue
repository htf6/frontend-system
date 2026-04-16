<template>
  <div class="events-page">
    <section class="page-header glass-card">
      <div class="header-main">
        <span class="header-badge"><Bell :size="22" /></span>
        <div>
          <h2>预警事件</h2>
          <p>查看事件列表、筛选状态并完成处置闭环。</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button plain @click="handleReset">
          <RefreshCw :size="16" />
          <span>重置</span>
        </el-button>
        <el-button :loading="exportLoading" @click="handleExport">
          <Download :size="16" />
          <span>导出</span>
        </el-button>
      </div>
    </section>

    <section class="filter-card glass-card">
      <div class="filter-grid">
        <el-input
          v-model="filters.keyword"
          placeholder="按教室、描述、责任人搜索"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <Search :size="16" />
          </template>
        </el-input>
        <el-select v-model="filters.status" placeholder="全部状态" clearable>
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已关闭" value="closed" />
        </el-select>
        <el-select v-model="filters.type" placeholder="全部类型" clearable>
          <el-option label="噪声预警" value="noise" />
          <el-option label="拥挤预警" value="crowded" />
          <el-option label="设备异常" value="device" />
        </el-select>
        <el-date-picker
          v-model="filters.dateRange"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
        <div class="filter-actions">
          <el-button plain @click="handleReset">清空</el-button>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>
    </section>

    <section class="stats-grid">
      <article v-for="item in statCards" :key="item.key" class="stat-card glass-card" :class="item.tone">
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
          <span class="panel-icon"><LayoutList :size="18" /></span>
          <div>
            <h3>事件列表</h3>
            <p>{{ filterSummary }}</p>
          </div>
        </div>
      </div>

      <el-table :data="events" v-loading="loading" class="events-table" max-height="560">
        <el-table-column type="index" label="序号" width="72" :index="getRowIndex" />
        <el-table-column prop="id" label="ID" width="88" />
        <el-table-column prop="classroom" label="教室" min-width="140" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getSeverityTag(row.severity)" size="small">{{ getSeverityLabel(row.severity) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="描述" min-width="240" show-overflow-tooltip />
        <el-table-column label="状态" width="108">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="责任人" min-width="120" />
        <el-table-column prop="createdAt" label="发生时间" min-width="168" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="openDetail(row)">详情</el-button>
            <el-button type="warning" text size="small" @click="openProcess(row)">
              {{ row.status === 'closed' ? '复核' : '处置' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </section>

    <el-drawer v-model="detailVisible" size="42%" :title="`事件详情 - ${detailEvent.classroom || '-'}`" append-to-body>
      <el-descriptions :column="1" border class="detail-descriptions">
        <el-descriptions-item label="事件 ID">{{ detailEvent.id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="教室">{{ detailEvent.classroom || '-' }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ getTypeLabel(detailEvent.type) }}</el-descriptions-item>
        <el-descriptions-item label="等级">{{ getSeverityLabel(detailEvent.severity) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusLabel(detailEvent.status) }}</el-descriptions-item>
        <el-descriptions-item label="责任人">{{ detailEvent.assignee || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发生时间">{{ detailEvent.createdAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后更新时间">{{ detailEvent.updatedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处置备注">
          <pre class="detail-text">{{ detailEvent.remark || '暂无处置备注' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="事件描述">
          <pre class="detail-text">{{ detailEvent.message || '-' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <el-dialog v-model="processVisible" title="处置预警事件" width="520px" append-to-body>
      <el-form label-width="88px">
        <el-form-item label="事件">
          <div class="process-event-summary">{{ currentEvent.classroom }} / {{ getTypeLabel(currentEvent.type) }}</div>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="processForm.status" style="width: 100%">
            <el-option label="处理中" value="processing" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="责任人">
          <el-input v-model="processForm.assignee" placeholder="请输入责任人" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="processForm.remark" type="textarea" rows="4" placeholder="请输入处置说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button plain @click="processVisible = false">取消</el-button>
        <el-button type="primary" :loading="processLoading" @click="submitProcess">保存处置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { saveAs } from 'file-saver'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'
import { exportAlertEvents, getAlertEvents, handleAlertEvent } from '@/api/alerts'
import { Bell, Clock3, Download, LayoutList, RefreshCw, Search, ShieldAlert } from 'lucide-vue-next'

const loading = ref(false)
const exportLoading = ref(false)
const processLoading = ref(false)
const detailVisible = ref(false)
const processVisible = ref(false)
const events = ref([])
const detailEvent = ref({})
const currentEvent = ref({})
const serverStats = reactive({ pending: 0, processing: 0, closed: 0, total: 0 })

const filters = reactive({
  keyword: '',
  status: '',
  type: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const processForm = reactive({
  status: 'processing',
  assignee: '',
  remark: ''
})

const statCards = computed(() => [
  { key: 'pending', label: '待处理', value: serverStats.pending, icon: ShieldAlert, tone: 'danger' },
  { key: 'processing', label: '处理中', value: serverStats.processing, icon: Clock3, tone: 'warning' },
  { key: 'closed', label: '已关闭', value: serverStats.closed, icon: Bell, tone: 'success' },
  { key: 'total', label: '事件总数', value: serverStats.total, icon: LayoutList, tone: 'neutral' }
])

const filterSummary = computed(() => {
  const parts = [
    filters.status ? `状态：${getStatusLabel(filters.status)}` : '状态：全部',
    filters.type ? `类型：${getTypeLabel(filters.type)}` : '类型：全部',
    filters.keyword ? `关键词：${filters.keyword}` : '关键词：未输入'
  ]
  return parts.join(' · ')
})

const getRowIndex = (index) => (pagination.page - 1) * pagination.pageSize + index + 1

const getTypeLabel = (type) => ({
  noise: '噪声预警',
  crowded: '拥挤预警',
  device: '设备异常'
}[type] || type || '-')

const getTypeTag = (type) => ({
  noise: 'warning',
  crowded: 'danger',
  device: 'info'
}[type] || 'info')

const getStatusLabel = (status) => ({
  pending: '待处理',
  processing: '处理中',
  closed: '已关闭'
}[status] || status || '-')

const getStatusTag = (status) => ({
  pending: 'danger',
  processing: 'warning',
  closed: 'success'
}[status] || 'info')

const getSeverityLabel = (severity) => ({
  high: '高',
  medium: '中',
  low: '低'
}[severity] || '中')

const getSeverityTag = (severity) => ({
  high: 'danger',
  medium: 'warning',
  low: 'success'
}[severity] || 'warning')

const formatDateTime = (value) => {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : String(value)
}

const buildQueryParams = () => {
  const [startTime, endTime] = filters.dateRange || []
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword || undefined,
    status: filters.status || undefined,
    type: filters.type || undefined,
    startTime,
    endTime
  }
}

const normalizeEvent = (item) => ({
  id: item.id,
  classroom: item.classroom || item.location || '-',
  type: item.type || 'noise',
  severity: item.severity || (item.type === 'crowded' ? 'high' : item.type === 'device' ? 'medium' : 'low'),
  message: item.message || item.description || '-',
  status: item.status || 'pending',
  assignee: item.assignee || '-',
  createdAt: formatDateTime(item.createdAt || item.createTime || item.eventTime),
  updatedAt: formatDateTime(item.updatedAt || item.updateTime || item.handleTime || item.createdAt),
  remark: item.remark || item.handleRemark || item.disposeRemark || ''
})

const parsePageData = (res) => {
  const payload = res?.data ?? {}
  const pageData = Array.isArray(payload)
    ? { list: payload, total: payload.length }
    : (payload.records || payload.list ? payload : (payload.data || payload.page || payload.result || {}))
  const list = pageData.records || pageData.list || []
  events.value = list.map(normalizeEvent)
  pagination.total = pageData.total || payload.total || list.length || 0

  const stats = payload.stats || pageData.stats || {}
  serverStats.pending = stats.pending ?? events.value.filter((item) => item.status === 'pending').length
  serverStats.processing = stats.processing ?? events.value.filter((item) => item.status === 'processing').length
  serverStats.closed = stats.closed ?? events.value.filter((item) => item.status === 'closed').length
  serverStats.total = stats.total ?? pagination.total
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAlertEvents(buildQueryParams())
    parsePageData(res)
  } catch (error) {
    console.error('获取预警事件失败:', error)
    ElMessage.error('获取预警事件失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  filters.keyword = ''
  filters.status = ''
  filters.type = ''
  filters.dateRange = []
  pagination.page = 1
  fetchData()
}

const openDetail = (row) => {
  detailEvent.value = row
  detailVisible.value = true
}

const openProcess = (row) => {
  currentEvent.value = row
  processForm.status = row.status === 'closed' ? 'closed' : 'processing'
  processForm.assignee = row.assignee === '-' ? '' : row.assignee
  processForm.remark = row.remark || ''
  processVisible.value = true
}

const submitProcess = async () => {
  if (!currentEvent.value.id) return

  processLoading.value = true
  try {
    await handleAlertEvent(currentEvent.value.id, {
      status: processForm.status,
      assignee: processForm.assignee || null,
      remark: processForm.remark || null
    })
    ElMessage.success('处置已保存')
    processVisible.value = false
    await fetchData()
  } catch (error) {
    console.error('处置预警事件失败:', error)
    ElMessage.error('处置预警事件失败')
  } finally {
    processLoading.value = false
  }
}

const resolveExportFilename = (headers) => {
  const disposition = headers?.['content-disposition'] || ''
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/)
  const rawName = match?.[1] || match?.[2]
  return rawName ? decodeURIComponent(rawName) : `预警事件_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
}

const handleExport = async () => {
  exportLoading.value = true
  try {
    const token = getToken()
    const response = await axios.get('/api/alerts/events/export', {
      params: buildQueryParams(),
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
    saveAs(response.data, resolveExportFilename(response.headers))
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出预警事件失败:', error)
    ElMessage.error('导出预警事件失败')
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.events-page {
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

.header-actions,
.filter-actions {
  display: flex;
  gap: 10px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr)) auto;
  gap: 12px;
  align-items: center;
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

.stat-card.danger {
  border-color: rgba(216, 95, 87, 0.18);
}

.stat-card.warning {
  border-color: rgba(201, 137, 44, 0.18);
}

.stat-card.success {
  border-color: rgba(63, 143, 96, 0.18);
}

.panel-icon,
.stat-icon {
  width: 38px;
  height: 38px;
}

.table-head {
  margin-bottom: 16px;
}

.pagination-row {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-descriptions :deep(.el-descriptions__label.el-descriptions__cell) {
  width: 108px;
  color: var(--text-secondary);
}

.detail-text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
  color: var(--text-primary);
}

.process-event-summary {
  color: var(--text-primary);
  font-weight: 600;
}

@media (max-width: 1080px) {
  .filter-grid,
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-actions {
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .page-header,
  .header-actions,
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
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
