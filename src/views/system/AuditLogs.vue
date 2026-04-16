<template>
  <div class="audit-page">
    <div class="page-header glass-card">
      <div class="header-top">
        <div class="title-group">
          <h3>审计日志</h3>
          <p>查看系统关键操作轨迹与执行结果</p>
        </div>
        <div class="actions">
          <el-button plain @click="handleReset">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
        </div>
      </div>

      <div class="search-panel">
        <div class="search-row primary-row">
          <div class="search-field search-time">
            <span class="field-label">操作时间</span>
            <el-date-picker
              v-model="filters.dateRange"
              type="datetimerange"
              value-format="YYYY-MM-DD HH:mm:ss"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              @change="fetchData"
            />
          </div>
          <div class="search-field">
            <span class="field-label">操作者角色</span>
            <el-select v-model="filters.operatorRole" placeholder="请选择角色" clearable @change="fetchData">
              <el-option label="管理员" value="ADMIN" />
              <el-option label="教师" value="TEACHER" />
              <el-option label="学生" value="STUDENT" />
            </el-select>
          </div>
          <div class="search-field">
            <span class="field-label">模块名称</span>
            <el-input v-model="filters.module" placeholder="请输入模块" clearable @change="fetchData" />
          </div>
          <div class="search-field">
            <span class="field-label">执行结果</span>
            <el-select v-model="filters.success" placeholder="全部" clearable @change="fetchData">
              <el-option label="成功" :value="true" />
              <el-option label="失败" :value="false" />
            </el-select>
          </div>
        </div>
        <div class="search-row">
          <div class="search-field search-keyword">
            <span class="field-label">关键字</span>
            <el-input v-model="filters.keyword" placeholder="用户名、昵称、模块、操作名、接口路径" clearable @keyup.enter="handleSearch" />
          </div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <span>当前页日志</span>
          <strong>{{ pageStats.count }}</strong>
        </div>
        <div class="stat-card success">
          <span>成功操作</span>
          <strong>{{ pageStats.success }}</strong>
        </div>
        <div class="stat-card danger">
          <span>失败操作</span>
          <strong>{{ pageStats.failed }}</strong>
        </div>
        <div class="stat-card info">
          <span>平均耗时</span>
          <strong>{{ pageStats.avgDuration }} ms</strong>
        </div>
      </div>
    </div>
    
    <div class="audit-table glass-card">
      <el-table :data="logs" v-loading="loading" class="dark-table" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="createTime" label="时间" width="180" />
        <el-table-column prop="operatorUsername" label="操作人" width="120" />
        <el-table-column prop="operatorRole" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTag(row.operatorRole)" size="small">{{ row.operatorRole || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="操作" min-width="180" />
        <el-table-column prop="requestMethod" label="方法" width="90" />
        <el-table-column prop="requestPath" label="接口路径" min-width="180" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="executionTimeMs" label="耗时(ms)" width="100" />
        <el-table-column label="结果" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.success ? 'success' : 'danger'">
              <el-icon class="result-icon">
                <CircleCheck v-if="row.success" /><CircleClose v-else />
              </el-icon>
              {{ row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </div>
    
    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="审计日志详情" width="720px" class="dark-dialog detail-dialog">
      <el-descriptions :column="2" border class="detail-descriptions">
        <el-descriptions-item label="操作ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog.createTime }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.operatorUsername }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ currentLog.operatorRole || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.module || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">{{ currentLog.action }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">{{ currentLog.requestMethod || '-' }}</el-descriptions-item>
        <el-descriptions-item label="接口路径">{{ currentLog.requestPath || '-' }}</el-descriptions-item>
        <el-descriptions-item label="方法签名" :span="2">{{ currentLog.methodSignature || '-' }}</el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2">{{ currentLog.errorMessage || '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="detail-json">{{ currentLog.requestParams || '-' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleClose, Search, RefreshRight } from '@element-plus/icons-vue'
import { getAuditLogs } from '@/api/audit'

const loading = ref(false)
const detailVisible = ref(false)
const currentLog = ref({})

const filters = reactive({
  dateRange: [],
  operatorRole: '',
  module: '',
  success: undefined,
  keyword: ''
})

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const logs = ref([])

const pageStats = computed(() => {
  const count = logs.value.length
  const success = logs.value.filter((item) => item.success).length
  const failed = count - success
  const durations = logs.value
    .map((item) => Number(item.executionTimeMs || 0))
    .filter((value) => Number.isFinite(value) && value > 0)
  const avgDuration = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : 0

  return { count, success, failed, avgDuration }
})

const buildQueryParams = () => {
  const [startTime, endTime] = filters.dateRange || []
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword || undefined,
    operatorRole: filters.operatorRole || undefined,
    module: filters.module || undefined,
    success: typeof filters.success === 'boolean' ? filters.success : undefined,
    startTime,
    endTime
  }
}

const parsePageData = (res) => {
  const payload = res?.data ?? {}
  const pageData = payload.records || payload.list ? payload : (payload.data || payload.page || {})
  logs.value = pageData.records || pageData.list || []
  pagination.total = pageData.total || 0
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAuditLogs(buildQueryParams())
    parsePageData(res)
  } catch (error) {
    ElMessage.error('获取审计日志失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  filters.dateRange = []
  filters.operatorRole = ''
  filters.module = ''
  filters.success = undefined
  filters.keyword = ''
  pagination.page = 1
  fetchData()
}

const getRoleTag = (role) => {
  const map = { ADMIN: 'danger', TEACHER: 'warning', STUDENT: 'info' }
  return map[role] || 'info'
}

const handleDetail = (row) => {
  currentLog.value = row
  detailVisible.value = true
}

onMounted(() => { fetchData() })
</script>

<style lang="scss" scoped>
.audit-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.page-header {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: 16px;

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .title-group {
    h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: 0.5px;
    }

    p {
      margin: 6px 0 0;
      font-size: 13px;
      color: var(--text-secondary);
    }
  }

  .actions {
    display: flex;
    gap: 10px;
  }

  .search-panel {
    padding: 14px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .search-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .primary-row {
    grid-template-columns: minmax(420px, 2.2fr) repeat(3, minmax(180px, 1fr));
  }

  .search-field {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-label {
    font-size: 12px;
    line-height: 1;
    color: var(--text-secondary);
    padding-left: 2px;
  }

  .search-time,
  .search-keyword {
    min-width: 0;
  }

  .search-time :deep(.el-date-editor),
  .search-field :deep(.el-input),
  .search-field :deep(.el-select) {
    width: 100%;
  }

  .search-field :deep(.el-input__wrapper),
  .search-field :deep(.el-select__wrapper) {
    min-height: 40px;
    border-radius: 10px;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  .stat-card {
    padding: 12px 14px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 6px;

    span {
      font-size: 12px;
      color: var(--text-secondary);
    }

    strong {
      font-size: 22px;
      line-height: 1;
      color: var(--text-primary);
    }

    &.success strong { color: var(--success-color); }
    &.danger strong { color: var(--danger-color); }
    &.info strong { color: var(--primary-color); }
  }
}

.audit-table {
  padding: var(--spacing-lg);

  :deep(.el-table) {
    --el-table-bg-color: transparent;
    --el-table-tr-bg-color: transparent;
    --el-table-header-bg-color: rgba(255, 255, 255, 0.06);
    --el-table-row-hover-bg-color: rgba(64, 158, 255, 0.09);
    border-radius: 12px;
    overflow: hidden;
  }

  :deep(.el-table th.el-table__cell) {
    font-weight: 600;
    color: var(--text-primary);
  }

  :deep(.el-table td.el-table__cell) {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .result-icon {
    margin-right: 4px;
    vertical-align: -1px;
  }
  
  .pagination-wrapper {
    margin-top: var(--spacing-lg);
    display: flex;
    justify-content: flex-end;
  }
}

.detail-json {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 220px;
  overflow: auto;
}

.detail-dialog {
  :deep(.el-dialog__body) {
    padding-top: 8px;
  }
}

.detail-descriptions {
  :deep(.el-descriptions__label.el-descriptions__cell) {
    color: var(--text-secondary);
    width: 96px;
  }

  :deep(.el-descriptions__content.el-descriptions__cell) {
    color: var(--text-primary);
  }
}

@media (max-width: 1200px) {
  .page-header {
    .primary-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}

@media (max-width: 992px) {
  .page-header {
    .search-row,
    .primary-row {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    .header-top {
      flex-direction: column;
      align-items: stretch;
    }

    .actions {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .stats-row {
      grid-template-columns: 1fr;
    }
  }
  
  .audit-table :deep(.el-table__cell:nth-child(1)),
  .audit-table :deep(.el-table__cell:nth-child(7)),
  .audit-table :deep(.el-table__cell:nth-child(8)),
  .audit-table :deep(.el-table__cell:nth-child(9)) {
    display: none !important;
  }
}
</style>
