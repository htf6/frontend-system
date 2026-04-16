<template>
  <div class="schedule-import-page">
    <section class="page-header glass-card">
      <div class="header-main">
        <span class="header-badge">
          <CalendarDays :size="22" />
        </span>
        <div>
          <h2>课表导入</h2>
          <p>上传教务课表文件，系统会按教室拆分上课时间并写入 PostgreSQL。</p>
        </div>
      </div>
      <div class="page-actions">
        <el-button plain :disabled="!selectedFile" @click="clearSelectedFile">
          <RotateCcw :size="16" />
          <span>清空文件</span>
        </el-button>
        <el-button type="primary" :loading="importLoading" :disabled="!selectedFile" @click="handleImport">
          <Upload :size="16" />
          <span>开始导入</span>
        </el-button>
      </div>

      <div v-if="showProgress" class="progress-panel">
        <div class="progress-meta">
          <span>{{ progressStatusText }}</span>
          <strong>{{ uploadPercent }}%</strong>
        </div>
        <el-progress
          :percentage="uploadPercent"
          :status="progressBarStatus"
          :stroke-width="12"
          :show-text="false"
        />
      </div>
    </section>

    <section class="upload-panel glass-card">
      <div class="panel-head">
        <div class="panel-title-wrap">
          <span class="panel-icon"><FileSpreadsheet :size="18" /></span>
          <div>
            <h3>上传文件</h3>
            <p>支持 `csv`、`xls`、`xlsx`。Excel 默认读取首个工作表，第二个工作表可覆盖节次时间映射。</p>
          </div>
        </div>
      </div>

      <div class="upload-grid">
        <el-upload
          ref="uploadRef"
          class="schedule-uploader"
          drag
          accept=".csv,.xls,.xlsx"
          :limit="1"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleSelectFile"
          :on-exceed="handleFileExceed"
        >
          <div class="upload-placeholder">
            <UploadCloud :size="24" />
            <strong>{{ selectedFileName || '拖拽或点击选择课表文件' }}</strong>
            <span>系统会过滤没有明确楼栋、楼层或教室编号的数据</span>
          </div>
        </el-upload>

        <div class="import-tips">
          <div class="tip-chip">
            <Filter :size="16" />
            <span>过滤空地点、逗号分隔多地点、缺楼栋、缺楼层、缺教室编号</span>
          </div>
          <div class="tip-chip">
            <Clock3 :size="16" />
            <span>`jc` 会按节次映射成开始时间和结束时间</span>
          </div>
          <div class="tip-chip">
            <CalendarRange :size="16" />
            <span>`kkqsz` 优先作为周次位图，`jxzfw` 作为兜底解析</span>
          </div>
          <div class="tip-chip">
            <RefreshCw :size="16" />
            <span>同一学年学期导入时会先覆盖旧课表，再写入新记录</span>
          </div>
        </div>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card glass-card">
        <span class="summary-label">当前文件</span>
        <strong>{{ selectedFileName || '未选择' }}</strong>
      </article>
      <article class="summary-card glass-card">
        <span class="summary-label">成功入库</span>
        <strong>{{ result?.successCount ?? 0 }}</strong>
      </article>
      <article class="summary-card glass-card">
        <span class="summary-label">规则过滤</span>
        <strong>{{ result?.filteredCount ?? 0 }}</strong>
      </article>
      <article class="summary-card glass-card">
        <span class="summary-label">覆盖旧记录</span>
        <strong>{{ result?.replacedCount ?? 0 }}</strong>
      </article>
    </section>

    <section class="result-panel glass-card">
      <div class="panel-head panel-head-spread">
        <div class="panel-title-wrap">
          <span class="panel-icon"><ClipboardList :size="18" /></span>
          <div>
            <h3>导入结果</h3>
            <p v-if="result">共处理 {{ result.totalCount }} 行，其中失败 {{ result.failureCount }} 行。</p>
            <p v-else>导入后会展示处理汇总和问题明细。</p>
          </div>
        </div>
      </div>

      <el-empty v-if="!result" description="请先上传并导入课表文件" />
      <template v-else>
        <div class="status-row">
          <el-tag type="success">成功 {{ result.successCount }}</el-tag>
          <el-tag type="warning">过滤 {{ result.filteredCount }}</el-tag>
          <el-tag type="danger">失败 {{ result.failureCount }}</el-tag>
          <el-tag>覆盖 {{ result.replacedCount }}</el-tag>
        </div>

        <el-empty v-if="!issues.length" description="没有问题明细" />
        <el-table v-else :data="issues" max-height="420" class="issues-table">
          <el-table-column prop="rowNumber" label="行号" width="80" />
          <el-table-column prop="type" label="类型" width="110">
            <template #default="{ row }">
              <el-tag :type="row.type === 'FAILED' ? 'danger' : 'warning'" size="small">
                {{ row.type === 'FAILED' ? '失败' : '过滤' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="classroomName" label="教室" min-width="220" />
          <el-table-column prop="courseName" label="课程" min-width="180" />
          <el-table-column prop="reason" label="说明" min-width="280" />
        </el-table>
      </template>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  RotateCcw,
  Upload,
  UploadCloud
} from 'lucide-vue-next'
import { importCourseSchedules } from '@/api/courseSchedules'

const uploadRef = ref(null)
const selectedFile = ref(null)
const selectedFileName = ref('')
const importLoading = ref(false)
const result = ref(null)
const uploadPercent = ref(0)
const progressStatusText = ref('')

const issues = computed(() => result.value?.failures || [])
const showProgress = computed(() => importLoading.value || uploadPercent.value > 0)
const progressBarStatus = computed(() => {
  if (importLoading.value) return undefined
  return uploadPercent.value >= 100 ? 'success' : undefined
})

function handleSelectFile(uploadFile) {
  const rawFile = uploadFile?.raw || uploadFile
  if (!rawFile) {
    return
  }
  selectedFile.value = rawFile
  selectedFileName.value = rawFile.name || uploadFile?.name || ''
  result.value = null
  uploadPercent.value = 0
  progressStatusText.value = ''
}

function handleFileExceed(files) {
  uploadRef.value?.clearFiles()
  const nextFile = Array.isArray(files) ? files[0] : files
  if (nextFile) {
    handleSelectFile({ raw: nextFile, name: nextFile.name })
  }
}

function clearSelectedFile() {
  uploadRef.value?.clearFiles()
  selectedFile.value = null
  selectedFileName.value = ''
  result.value = null
  uploadPercent.value = 0
  progressStatusText.value = ''
}

async function handleImport() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择课表文件')
    return
  }

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  importLoading.value = true
  uploadPercent.value = 0
  progressStatusText.value = '正在上传文件'
  try {
    const res = await importCourseSchedules(formData, {
      onUploadProgress: (event) => {
        if (!event) return
        if (event.total) {
          uploadPercent.value = Math.min(99, Math.round((event.loaded / event.total) * 100))
        } else if (event.loaded > 0 && uploadPercent.value === 0) {
          uploadPercent.value = 1
        }
        progressStatusText.value = uploadPercent.value >= 99 ? '文件上传完成，正在解析' : '正在上传文件'
      }
    })
    uploadPercent.value = 100
    progressStatusText.value = '服务器解析完成'
    result.value = res.data
    ElMessage.success(`导入完成，成功 ${res.data?.successCount ?? 0} 条`)
  } catch (error) {
    progressStatusText.value = '导入失败'
    console.error('导入课表失败:', error)
    ElMessage.error(error.message || '导入课表失败')
  } finally {
    importLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.schedule-import-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header,
.upload-panel,
.result-panel {
  padding: 24px;
}

.header-main,
.panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.header-badge,
.panel-icon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #c65e2f 0%, #9f3c1e 100%);
  box-shadow: 0 14px 24px rgba(171, 78, 34, 0.2);
}

.page-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1.1fr) minmax(260px, 0.9fr);
  gap: 18px;
  margin-top: 18px;
}

.schedule-uploader {
  :deep(.el-upload-dragger) {
    width: 100%;
    min-height: 220px;
    border-radius: 24px;
    border: 1px dashed rgba(171, 78, 34, 0.3);
    background:
      radial-gradient(circle at top right, rgba(214, 127, 58, 0.16), transparent 36%),
      linear-gradient(180deg, rgba(255, 251, 247, 0.9), rgba(249, 241, 234, 0.92));
  }
}

.upload-placeholder {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-secondary);

  strong {
    font-size: 16px;
    color: var(--text-primary);
  }

  span {
    max-width: 280px;
    line-height: 1.6;
  }
}

.import-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-chip,
.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.tip-chip {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 248, 242, 0.86);
  border: 1px solid rgba(171, 78, 34, 0.12);
  color: var(--text-secondary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  strong {
    font-size: 28px;
    color: var(--text-primary);
  }
}

.summary-label {
  font-size: 13px;
  color: var(--text-muted);
}

.panel-head {
  margin-bottom: 18px;
}

.panel-head-spread {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.issues-table {
  margin-top: 18px;
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .upload-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
