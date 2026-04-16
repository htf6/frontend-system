<template>
  <div class="classrooms-page">
    <div class="page-atmosphere" aria-hidden="true">
      <span class="orb orb-a"></span>
      <span class="orb orb-b"></span>
      <span class="orb orb-c"></span>
    </div>

    <section class="toolbar-strip reveal reveal-1">
      <div class="toolbar-context">
        <span class="context-pill context-pill--primary">
          <Building2 :size="15" />
          <span>{{ selectedScopeLabel || '全部教室范围' }}</span>
        </span>
        <span class="context-pill">
          <DoorOpen :size="15" />
          <span>{{ treeStats.classroomCount }} 间教室</span>
        </span>
        <span class="context-pill">
          <CircleCheck :size="15" />
          <span>筛选结果 {{ pagination.total }}</span>
        </span>
      </div>
      <div class="toolbar-actions">
        <el-button plain @click="handleRefresh">
          <RefreshCw :size="16" />
          <span>刷新</span>
        </el-button>
        <el-button v-if="canManageClassroom" plain @click="handleOpenImport">
          <Upload :size="16" />
          <span>批量导入</span>
        </el-button>
        <el-button v-if="canManageClassroom" type="primary" @click="handleAdd">
          <Plus :size="16" />
          <span>新增教室</span>
        </el-button>
      </div>
    </section>

    <section class="metric-grid">
      <article class="metric-card glass-card reveal reveal-2">
        <div class="metric-icon soft-blue">
          <DoorOpen :size="18" />
        </div>
        <div>
          <span class="metric-label">教室总数</span>
          <strong>{{ treeStats.classroomCount }}</strong>
        </div>
      </article>
      <article class="metric-card glass-card reveal reveal-3">
        <div class="metric-icon soft-green">
          <MapPinned :size="18" />
        </div>
        <div>
          <span class="metric-label">校区数量</span>
          <strong>{{ treeStats.campusCount }}</strong>
        </div>
      </article>
      <article class="metric-card glass-card reveal reveal-4">
        <div class="metric-icon soft-amber">
          <LayoutGrid :size="18" />
        </div>
        <div>
          <span class="metric-label">楼栋数量</span>
          <strong>{{ treeStats.buildingCount }}</strong>
        </div>
      </article>
      <article class="metric-card glass-card reveal reveal-5">
        <div class="metric-icon soft-rose">
          <CircleCheck :size="18" />
        </div>
        <div>
          <span class="metric-label">当前筛选结果</span>
          <strong>{{ pagination.total }}</strong>
        </div>
      </article>
    </section>

    <section class="workspace-grid">
      <aside class="tree-card glass-card reveal reveal-3">
        <div class="card-head">
          <div>
            <h3>教室树</h3>
          </div>
          <el-button text @click="clearTreeSelection">清空</el-button>
        </div>

        <div v-if="selectedScopeLabel" class="tree-selection">
          <span>{{ selectedScopeLabel }}</span>
        </div>

        <el-skeleton v-if="treeLoading" :rows="6" animated />
        <el-empty v-else-if="!classroomTree.length" description="暂无教室树数据" />
        <el-tree
          v-else
          ref="treeRef"
          :data="classroomTree"
          :props="treeProps"
          node-key="key"
          highlight-current
          :expand-on-click-node="false"
          :current-node-key="currentTreeKey"
          v-show="scopeViewMode === 'tree'"
          class="classroom-tree"
          @node-click="handleTreeNodeClick"
        >
          <template #default="{ data }">
            <div class="tree-node">
              <span class="tree-node__label">{{ data.label }}</span>
              <el-tag size="small" effect="plain">{{ treeTypeLabelMap[data.type] || '节点' }}</el-tag>
            </div>
          </template>
        </el-tree>

        <div class="tree-card-actions tree-card-actions--inner">
          <div class="scope-mode-switch">
            <button
              type="button"
              class="scope-mode-switch__btn"
              :class="{ active: scopeViewMode === 'map' }"
              @click="scopeViewMode = 'map'"
            >
              空间导航
            </button>
            <button
              type="button"
              class="scope-mode-switch__btn"
              :class="{ active: scopeViewMode === 'tree' }"
              @click="scopeViewMode = 'tree'"
            >
              树形结构
            </button>
          </div>
        </div>

        <transition name="scope-fade">
          <section
            v-show="scopeViewMode === 'map'"
            :key="activeScopeKey"
            class="scope-panel scope-panel--stage"
          >
            <div class="navigator-breadcrumb">
              <button
                v-for="item in scopeBreadcrumbs"
                :key="item.key"
                type="button"
                class="navigator-breadcrumb__item"
                :class="{ active: item.key === activeScopeKey }"
                @click="handleScopeCardClick(item.key)"
              >
                {{ item.label }}
              </button>
            </div>
            <div v-if="scopeSwitchCards.length" class="scope-switch-grid scope-switch-grid--stage">
              <button
                v-for="item in scopeSwitchCards"
                :key="item.key"
                type="button"
                class="scope-switch-card scope-switch-card--stage"
                @click="handleScopeCardClick(item.key)"
              >
                <div>
                  <span class="scope-switch-card__type">{{ item.typeLabel }}</span>
                  <strong>{{ item.label }}</strong>
                  <p>{{ item.meta }}</p>
                </div>
                <span class="scope-switch-card__count">{{ item.classroomCount }}</span>
              </button>
            </div>

          </section>
        </transition>
      </aside>

      <div class="content-shell reveal reveal-4">
        <div class="content-column">
        <section class="table-card glass-card section-accent accent-slate reveal reveal-5">
          <div class="panel-toolbar">
            <div class="panel-toolbar__main">
              <div class="search-row">
                <el-autocomplete
                  v-model="searchQuery"
                  class="search-input search-input--hero"
                  popper-class="classroom-search-popper"
                  clearable
                  :fetch-suggestions="querySearchSuggestions"
                  value-key="value"
                  trigger-on-focus
                  placeholder="搜索校区、楼栋、楼层或教室编码"
                  @select="handleSuggestionSelect"
                  @input="handleSearchInput"
                  @clear="fetchFirstPage"
                >
                  <template #prefix>
                    <Search :size="16" />
                  </template>
                  <template #default="{ item }">
                    <div class="suggestion-item">
                      <div>
                        <strong>{{ item.value }}</strong>
                        <p>{{ item.path }}</p>
                      </div>
                      <el-tag size="small" effect="plain">{{ treeTypeLabelMap[item.type] || '搜索' }}</el-tag>
                    </div>
                  </template>
                </el-autocomplete>

                <el-button plain class="reset-filter-btn" @click="resetFilters">重置筛选</el-button>
              </div>

              <div class="filter-grid">
                <el-select v-model="filterCampus" clearable placeholder="全部校区" @change="handleCampusChange">
                  <el-option v-for="option in campusOptions" :key="option" :label="option" :value="option" />
                </el-select>

                <el-select v-model="filterBuilding" clearable placeholder="全部楼栋" @change="handleBuildingChange">
                  <el-option v-for="option in buildingOptions" :key="option" :label="option" :value="option" />
                </el-select>

                <el-select v-model="filterFloor" clearable placeholder="全部楼层" @change="handleFilterChange">
                  <el-option v-for="option in floorOptions" :key="option" :label="formatFloorLabel(option)" :value="option" />
                </el-select>

                <el-select v-model="filterStatus" clearable placeholder="全部状态" @change="handleFilterChange">
                  <el-option label="启用" :value="1" />
                  <el-option label="停用" :value="0" />
                </el-select>
              </div>

              <div class="filter-summary-bar">
                <span class="filter-summary-label">当前筛选</span>
                <span class="summary-pill summary-pill--quiet">{{ filterSummary }}</span>
              </div>
            </div>
          </div>

          <div class="card-head">
            <div>
              <h3>教室档案</h3>
              <p>分页结果按当前筛选范围展示。</p>
            </div>
            <div class="head-tags">
              <el-tag effect="dark" type="primary">第 {{ pagination.current }} 页</el-tag>
              <el-tag type="success">启用 {{ enabledClassroomCount }}</el-tag>
            </div>
          </div>

          <el-table :data="classrooms" v-loading="loading" class="classroom-table" max-height="520">
            <el-table-column type="index" label="序号" width="72" :index="getRowIndex" />
            <el-table-column prop="classroomCode" label="教室编码" min-width="128">
              <template #default="{ row }">
                <div class="table-primary-cell">
                  <strong>{{ row.classroomCode }}</strong>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="campus" label="校区" min-width="128">
              <template #default="{ row }">
                <div class="table-meta-cell">
                  <span>{{ row.campus }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="building" label="楼栋" min-width="168" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="table-stack-cell">
                  <strong>{{ row.building }}</strong>
                  <span>{{ row.campus }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="floor" label="楼层" width="100">
              <template #default="{ row }">
                <span class="table-floor-chip">{{ formatFloorLabel(row.floor) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="rtspUrl" label="RTSP 地址" min-width="280" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="table-url">{{ row.rtspUrl }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="110">
              <template #default="{ row }">
                <el-switch
                  v-model="row.enabled"
                  :disabled="!canToggleClassroom"
                  inline-prompt
                  active-text="启用"
                  inactive-text="停用"
                  @change="handleStatusChange(row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="createdAtLabel" label="创建时间" min-width="168">
              <template #default="{ row }">
                <span class="table-meta-text">{{ row.createdAtLabel }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <div class="table-actions">
                  <el-button
                    type="primary"
                    text
                    size="small"
                    :disabled="!row.rtspUrl || row.rtspUrl === '-'"
                    @click="handleViewMonitor(row)"
                  >
                    查看监控
                  </el-button>
                  <el-button v-if="canManageClassroom" type="primary" text size="small" @click="handleEdit(row)">编辑</el-button>
                  <el-button v-if="canManageClassroom" type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-row">
            <el-pagination
              v-model:current-page="pagination.current"
              v-model:page-size="pagination.size"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next"
              @size-change="fetchData"
              @current-change="fetchData"
            />
          </div>
        </section>

        <section v-if="false" class="overview-card glass-card section-accent accent-amber reveal reveal-6">
          <div class="card-head">
            <div>
              <h3>楼栋概览</h3>
              <p>基于当前列表结果统计各楼栋规模与可用状态。</p>
            </div>
          </div>

          <div v-if="buildingSummaries.length" class="overview-grid">
            <article v-for="item in buildingSummaries" :key="item.key" class="overview-item">
              <div class="overview-top">
                <div>
                  <strong>{{ item.building }}</strong>
                  <p>{{ item.campus }}</p>
                </div>
                <span class="overview-badge">{{ item.floorCount }} 层</span>
              </div>
              <div class="overview-metrics">
                <div>
                  <span>教室</span>
                  <strong>{{ item.classroomCount }}</strong>
                </div>
                <div>
                  <span>启用</span>
                  <strong>{{ item.enabledCount }}</strong>
                </div>
                <div>
                  <span>停用</span>
                  <strong>{{ item.disabledCount }}</strong>
                </div>
              </div>
            </article>
          </div>
          <el-empty v-else description="当前筛选范围内暂无楼栋概览" />
        </section>
        </div>
      </div>
    </section>

    <el-dialog
      v-model="importDialogVisible"
      title="批量导入教室"
      width="960px"
      top="6vh"
      append-to-body
      destroy-on-close
      class="classroom-dialog"
      @closed="resetImportState"
    >
      <div class="dialog-scroll-body dialog-scroll-body--import">
      <div class="import-toolbar">
        <div class="import-actions">
          <el-button plain @click="downloadImportTemplate">
            <Download :size="16" />
            <span>下载模板</span>
          </el-button>
          <el-upload
            drag
            accept=".xlsx,.xls"
            :auto-upload="false"
            :show-file-list="false"
            :before-upload="handleImportFile"
          >
            <div class="upload-placeholder">
              <Upload :size="22" />
              <strong>上传教室表格</strong>
              <span>支持 xlsx、xls，读取第一个工作表</span>
            </div>
          </el-upload>
        </div>
        <div class="import-tips">
          <p>模板字段：校区、楼栋、楼层、教室编码、RTSP地址、状态。</p>
          <p>状态可填 `1/0`、`启用/停用`，为空时默认按启用导入。</p>
          <p>后端会按“校区 + 楼栋 + 楼层 + 教室编码”判重，避免重复创建。</p>
        </div>
      </div>

      <div class="import-summary">
        <div class="summary-chip">
          <FileText :size="16" />
          <span>{{ importFileName || '尚未选择文件' }}</span>
        </div>
        <div class="summary-chip">
          <CircleCheck :size="16" />
          <span>可导入 {{ validImportCount }} 条</span>
        </div>
        <div class="summary-chip success">
          <Upload :size="16" />
          <span>已导入 {{ importedCount }} 条</span>
        </div>
        <div class="summary-chip danger" v-if="invalidImportCount">
          <span>待修正 {{ invalidImportCount }} 条</span>
        </div>
      </div>

      <el-empty v-if="!importRows.length" description="请先上传导入文件" />
      <el-table v-else :data="importRows" class="import-table" max-height="380">
        <el-table-column prop="rowNumber" label="行号" width="72" />
        <el-table-column prop="campus" label="校区" min-width="120" />
        <el-table-column prop="building" label="楼栋" min-width="120" />
        <el-table-column prop="floor" label="楼层" width="92">
          <template #default="{ row }">
            {{ formatFloorLabel(row.floor) }}
          </template>
        </el-table-column>
        <el-table-column prop="classroomCode" label="教室编码" min-width="140" />
        <el-table-column prop="rtspUrl" label="RTSP地址" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.statusLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="220">
          <template #default="{ row }">
            <span class="import-error-text">{{ getImportRowError(row) || row.serverError || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
      </div>

      <template #footer>
        <el-button plain @click="importDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="importLoading" :disabled="!importRows.length" @click="handleBatchImport">
          提交导入
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增教室' : '编辑教室'"
      width="620px"
      top="6vh"
      append-to-body
      destroy-on-close
      class="classroom-dialog"
    >
      <div class="dialog-scroll-body">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="96px">
        <el-form-item label="校区" prop="campus">
          <el-input v-model="formData.campus" placeholder="例如：主校区" />
        </el-form-item>
        <el-form-item label="楼栋" prop="building">
          <el-input v-model="formData.building" placeholder="例如：至善楼" />
        </el-form-item>
        <el-form-item label="楼层" prop="floor">
          <el-input v-model="formData.floor" placeholder="例如：3" />
        </el-form-item>
        <el-form-item label="教室编码" prop="classroomCode">
          <el-input v-model="formData.classroomCode" placeholder="例如：ZS-301" />
        </el-form-item>
        <el-form-item label="RTSP 地址" prop="rtspUrl">
          <el-input v-model="formData.rtspUrl" placeholder="例如：rtsp://127.0.0.1/live/zs301" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="formData.enabled" />
        </el-form-item>
      </el-form>
      </div>

      <template #footer>
        <el-button plain @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import {
  Building2,
  CircleCheck,
  DoorOpen,
  Download,
  FileText,
  LayoutGrid,
  MapPinned,
  Plus,
  RefreshCw,
  Search,
  Upload
} from 'lucide-vue-next'
import { debounce } from 'lodash-es'
import { useUserStore } from '@/stores/user'
import {
  createClassroom,
  deleteClassroom,
  getClassrooms,
  getClassroomTree,
  importClassrooms,
  updateClassroom,
  updateClassroomStatus
} from '@/api/classrooms'

const treeTypeLabelMap = {
  CAMPUS: '校区',
  BUILDING: '楼栋',
  FLOOR: '楼层',
  CLASSROOM: '教室'
}

const userStore = useUserStore()
const router = useRouter()
const treeRef = ref(null)
const formRef = ref(null)

const loading = ref(false)
const treeLoading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const classrooms = ref([])
const classroomTree = ref([])
const currentTreeKey = ref('')
const selectedTreeNode = ref(null)
const scopeViewMode = ref('map')
const searchQuery = ref('')
const filterCampus = ref('')
const filterBuilding = ref('')
const filterFloor = ref('')
const filterStatus = ref('')
const importDialogVisible = ref(false)
const importLoading = ref(false)
const importFileName = ref('')
const importSourceFile = ref(null)
const importRows = ref([])

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

const formData = reactive({
  id: null,
  campus: '',
  building: '',
  floor: '',
  classroomCode: '',
  rtspUrl: '',
  enabled: true
})

const formRules = {
  campus: [{ required: true, message: '请输入校区', trigger: 'blur' }],
  building: [{ required: true, message: '请输入楼栋', trigger: 'blur' }],
  floor: [{ required: true, message: '请输入楼层', trigger: 'blur' }],
  classroomCode: [{ required: true, message: '请输入教室编码', trigger: 'blur' }],
  rtspUrl: [{ required: true, message: '请输入 RTSP 地址', trigger: 'blur' }]
}

const treeProps = {
  label: 'label',
  children: 'children'
}

const canManageClassroom = computed(() => userStore.hasPermission('classroom:manage'))
const canToggleClassroom = computed(() => userStore.hasPermission('classroom:status') || canManageClassroom.value)
const enabledClassroomCount = computed(() => classrooms.value.filter((item) => item.enabled).length)

const treeNodesFlat = computed(() => {
  const result = []
  const visit = (nodes, parents = []) => {
    nodes.forEach((node) => {
      const path = [...parents, node.label]
      result.push({
        key: node.key,
        value: node.classroomCode || node.label,
        type: node.type,
        campus: node.campus || '',
        building: node.building || '',
        floor: node.floor || '',
        classroomCode: node.classroomCode || '',
        path: path.join(' / ')
      })
      if (Array.isArray(node.children) && node.children.length) {
        visit(node.children, path)
      }
    })
  }
  visit(classroomTree.value)
  return result
})

function visitScopeNodes(source, visitor) {
  const nodes = Array.isArray(source) ? source : (source ? [source] : [])
  const walk = (node) => {
    visitor(node)
    if (Array.isArray(node.children) && node.children.length) {
      node.children.forEach(walk)
    }
  }
  nodes.forEach(walk)
}

function findTreeNodeByKey(key, nodes = classroomTree.value) {
  for (const node of nodes) {
    if (node.key === key) {
      return node
    }
    if (Array.isArray(node.children) && node.children.length) {
      const childMatch = findTreeNodeByKey(key, node.children)
      if (childMatch) {
        return childMatch
      }
    }
  }
  return null
}

function collectScopeStats(source) {
  const campusSet = new Set()
  const buildingSet = new Set()
  const floorSet = new Set()
  let classroomCount = 0

  visitScopeNodes(source, (node) => {
    if (node.type === 'CAMPUS' && node.campus) {
      campusSet.add(node.campus)
    }
    if (node.type === 'BUILDING' && node.campus && node.building) {
      buildingSet.add(`${node.campus}|${node.building}`)
    }
    if (node.type === 'FLOOR' && node.campus && node.building && node.floor) {
      floorSet.add(`${node.campus}|${node.building}|${node.floor}`)
    }
    if (node.type === 'CLASSROOM') {
      classroomCount += 1
    }
  })

  return {
    campusCount: campusSet.size,
    buildingCount: buildingSet.size,
    floorCount: floorSet.size,
    classroomCount
  }
}

function countClassroomsInNode(node) {
  return collectScopeStats(node).classroomCount
}

function collectScopeLeafPreview(source, limit = 5) {
  const items = []
  visitScopeNodes(source, (node) => {
    if (items.length >= limit || node.type !== 'CLASSROOM') {
      return
    }
    items.push({
      key: node.key,
      label: node.classroomCode || node.label,
      path: [node.campus, node.building, node.floor ? formatFloorLabel(node.floor) : '']
        .filter(Boolean)
        .join(' / ')
    })
  })
  return items
}

const treeStats = computed(() => {
  const stats = collectScopeStats(classroomTree.value)
  return {
    campusCount: stats.campusCount,
    buildingCount: stats.buildingCount,
    classroomCount: stats.classroomCount
  }
})

const campusOptions = computed(() => {
  return Array.from(
    new Set(
      treeNodesFlat.value
        .filter((item) => item.type === 'CAMPUS' && item.campus)
        .map((item) => item.campus)
    )
  )
})

const buildingOptions = computed(() => {
  return Array.from(
    new Set(
      treeNodesFlat.value
        .filter((item) => item.type === 'BUILDING')
        .filter((item) => !filterCampus.value || item.campus === filterCampus.value)
        .map((item) => item.building)
        .filter(Boolean)
    )
  )
})

const floorOptions = computed(() => {
  return Array.from(
    new Set(
      treeNodesFlat.value
        .filter((item) => item.type === 'FLOOR')
        .filter((item) => !filterCampus.value || item.campus === filterCampus.value)
        .filter((item) => !filterBuilding.value || item.building === filterBuilding.value)
        .map((item) => item.floor)
        .filter(Boolean)
    )
  )
})

const selectedScopeLabel = computed(() => {
  const node = selectedTreeNode.value
  if (!node) return ''
  return [node.campus, node.building, node.floor ? formatFloorLabel(node.floor) : '', node.classroomCode || '']
    .filter(Boolean)
    .join(' / ')
})

const activeScopeNode = computed(() => {
  const key = selectedTreeNode.value?.key
  return key ? (findTreeNodeByKey(key) || selectedTreeNode.value) : null
})

const activeScopeKey = computed(() => activeScopeNode.value?.key || 'scope-all')


const scopeBreadcrumbs = computed(() => {
  const node = activeScopeNode.value
  if (!node) {
    return [{ key: 'scope-all', label: '全校区' }]
  }

  const crumbs = [{ key: 'scope-all', label: '全校区' }]
  if (node.campus) {
    crumbs.push({ key: `campus:${node.campus}`, label: node.campus })
  }
  if (node.building) {
    crumbs.push({ key: `campus:${node.campus}|building:${node.building}`, label: node.building })
  }
  if (node.floor) {
    crumbs.push({
      key: `campus:${node.campus}|building:${node.building}|floor:${node.floor}`,
      label: formatFloorLabel(node.floor)
    })
  }
  if (node.type === 'CLASSROOM') {
    crumbs.push({ key: node.key, label: node.classroomCode || node.label })
  }
  return crumbs
})

const scopePanelMeta = computed(() => {
  const node = activeScopeNode.value
  if (!node) {
    return {
      eyebrow: '全局视图',
      title: '全校区空间树',
      description: '左侧负责范围切换，这里只保留空间导航，不再重复展示统计数字。'
    }
  }

  if (node.type === 'CLASSROOM') {
    return {
      eyebrow: '教室节点',
      title: node.classroomCode || node.label,
      description: [node.campus, node.building, node.floor ? formatFloorLabel(node.floor) : '']
        .filter(Boolean)
        .join(' / ')
    }
  }

  return {
    eyebrow: `${treeTypeLabelMap[node.type] || '空间'}视图`,
    title: node.label,
    description: `${selectedScopeLabel.value || '当前空间节点'} 的子级结构会在这里切换展示。`
  }
})

const filterSummary = computed(() => {
  return [
    filterCampus.value || '全部校区',
    filterBuilding.value || '全部楼栋',
    filterFloor.value ? formatFloorLabel(filterFloor.value) : '全部楼层',
    filterStatus.value === '' ? '全部状态' : (Number(filterStatus.value) === 1 ? '仅启用' : '仅停用'),
    searchQuery.value ? `关键词：${searchQuery.value}` : '未输入关键词'
  ].join(' / ')
})

const scopeSwitchCards = computed(() => {
  const nodes = activeScopeNode.value
    ? (Array.isArray(activeScopeNode.value.children) ? activeScopeNode.value.children : [])
    : classroomTree.value

  return nodes.slice(0, 8).map((node) => {
    const stats = collectScopeStats(node)
    const meta = [node.campus, node.building, node.floor ? formatFloorLabel(node.floor) : '']
      .filter(Boolean)
      .join(' / ')
    return {
      key: node.key,
      label: node.label,
      typeLabel: treeTypeLabelMap[node.type] || '节点',
      classroomCount: Math.max(stats.classroomCount, node.type === 'CLASSROOM' ? 1 : 0),
      meta: meta || '点击切换到该节点'
    }
  })
})

const scopeLeafPreview = computed(() => {
  const source = activeScopeNode.value || classroomTree.value
  return collectScopeLeafPreview(source)
})

const validImportCount = computed(() => {
  return importRows.value.filter((row) => !row.imported && !getImportRowError(row) && !row.serverError).length
})

const importedCount = computed(() => importRows.value.filter((row) => row.imported).length)
const invalidImportCount = computed(() => importRows.value.filter((row) => !!getImportRowError(row) || !!row.serverError).length)

function formatDateTime(value) {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : '-'
}

function formatFloorLabel(value) {
  if (!value && value !== 0) return '-'
  const text = String(value)
  return text.endsWith('层') ? text : `${text}层`
}

function normalizeClassroom(item) {
  const status = Number(item.status ?? 0)
  return {
    id: item.id,
    campus: item.campus || '-',
    building: item.building || '-',
    floor: item.floor || '',
    classroomCode: item.classroomCode || '-',
    rtspUrl: item.rtspUrl || '-',
    status,
    enabled: status === 1,
    createdAtLabel: formatDateTime(item.createdAt)
  }
}

function parseClassroomPageData(res) {
  const payload = res?.data ?? res ?? {}
  const pageData = Array.isArray(payload)
    ? { records: payload, total: payload.length, current: pagination.current, size: pagination.size }
    : (payload.records || payload.list ? payload : (payload.data || payload.page || payload.result || {}))
  const list = Array.isArray(pageData) ? pageData : (pageData.records || pageData.list || [])

  classrooms.value = list.map(normalizeClassroom)
  pagination.current = Number(pageData.current ?? pageData.pageNum ?? pagination.current)
  pagination.size = Number(pageData.size ?? pageData.pageSize ?? pagination.size)
  pagination.total = Number(pageData.total ?? pageData.count ?? classrooms.value.length)
}

function buildQueryParams() {
  return {
    current: pagination.current,
    size: pagination.size,
    keyword: searchQuery.value || undefined,
    campus: filterCampus.value || undefined,
    building: filterBuilding.value || undefined,
    floor: filterFloor.value || undefined,
    status: filterStatus.value === '' ? undefined : Number(filterStatus.value)
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getClassrooms(buildQueryParams())
    parseClassroomPageData(res)
  } catch (error) {
    console.error('获取教室列表失败:', error)
    classrooms.value = []
    pagination.total = 0
    ElMessage.error('获取教室列表失败')
  } finally {
    loading.value = false
  }
}

async function loadTree() {
  treeLoading.value = true
  try {
    const res = await getClassroomTree()
    classroomTree.value = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取教室树失败:', error)
    classroomTree.value = []
    ElMessage.error('获取教室树失败')
  } finally {
    treeLoading.value = false
  }
}

const debouncedFetchFirstPage = debounce(() => {
  pagination.current = 1
  fetchData()
}, 300)

function fetchFirstPage() {
  pagination.current = 1
  fetchData()
}

function handleSearchInput() {
  debouncedFetchFirstPage()
}

function querySearchSuggestions(queryString, callback) {
  const keyword = (queryString || '').trim().toLowerCase()
  const matches = treeNodesFlat.value
    .filter((item) => item.value)
    .filter((item) => {
      if (!keyword) return true
      return item.value.toLowerCase().includes(keyword) || item.path.toLowerCase().includes(keyword)
    })
    .slice(0, 10)
  callback(matches)
}

function applyTreeSelection(node, keyword = '') {
  if (!node) return
  currentTreeKey.value = node.key
  selectedTreeNode.value = node
  treeRef.value?.setCurrentKey(node.key)
  filterCampus.value = node.campus || ''
  filterBuilding.value = node.building || ''
  filterFloor.value = node.floor || ''
  searchQuery.value = keyword
  fetchFirstPage()
}

function handleSuggestionSelect(item) {
  const matchedNode = findTreeNodeByKey(item.key) || item
  applyTreeSelection(matchedNode, item.value || '')
}

function handleCampusChange() {
  filterBuilding.value = ''
  filterFloor.value = ''
  currentTreeKey.value = ''
  selectedTreeNode.value = null
  fetchFirstPage()
}

function handleBuildingChange() {
  filterFloor.value = ''
  currentTreeKey.value = ''
  selectedTreeNode.value = null
  fetchFirstPage()
}

function handleFilterChange() {
  currentTreeKey.value = ''
  selectedTreeNode.value = null
  fetchFirstPage()
}

function clearTreeSelection() {
  currentTreeKey.value = ''
  selectedTreeNode.value = null
  treeRef.value?.setCurrentKey(null)
}

function handleScopeCardClick(key) {
  if (key === 'scope-all') {
    scopeViewMode.value = 'map'
    resetFilters()
    return
  }
  const node = findTreeNodeByKey(key)
  if (!node) return
  const keyword = node.type === 'CLASSROOM' ? (node.classroomCode || node.label || '') : ''
  scopeViewMode.value = 'map'
  applyTreeSelection(node, keyword)
}

function resetFilters() {
  searchQuery.value = ''
  filterCampus.value = ''
  filterBuilding.value = ''
  filterFloor.value = ''
  filterStatus.value = ''
  clearTreeSelection()
  fetchFirstPage()
}

function handleTreeNodeClick(node) {
  const keyword = node.type === 'CLASSROOM' ? (node.classroomCode || node.label || '') : ''
  scopeViewMode.value = 'tree'
  applyTreeSelection(node, keyword)
}

function resetFormData() {
  Object.assign(formData, {
    id: null,
    campus: filterCampus.value || '',
    building: filterBuilding.value || '',
    floor: filterFloor.value || '',
    classroomCode: '',
    rtspUrl: '',
    enabled: true
  })
}

function getRowIndex(index) {
  return (pagination.current - 1) * pagination.size + index + 1
}

async function handleRefresh() {
  await loadTree()
  await fetchData()
}

function handleAdd() {
  dialogType.value = 'add'
  resetFormData()
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogType.value = 'edit'
  Object.assign(formData, {
    id: row.id,
    campus: row.campus === '-' ? '' : row.campus,
    building: row.building === '-' ? '' : row.building,
    floor: row.floor || '',
    classroomCode: row.classroomCode === '-' ? '' : row.classroomCode,
    rtspUrl: row.rtspUrl === '-' ? '' : row.rtspUrl,
    enabled: row.enabled
  })
  dialogVisible.value = true
}

function handleViewMonitor(row) {
  if (!row?.id) {
    ElMessage.warning('当前教室缺少可用标识，无法打开监控')
    return
  }
  if (!row.rtspUrl || row.rtspUrl === '-') {
    ElMessage.warning('当前教室未配置 RTSP 地址')
    return
  }
  router.push({
    name: 'DataIngest',
    query: {
      classroomId: String(row.id)
    }
  })
}

function buildSubmitPayload() {
  return {
    campus: formData.campus.trim(),
    building: formData.building.trim(),
    floor: String(formData.floor).trim(),
    classroomCode: formData.classroomCode.trim(),
    rtspUrl: formData.rtspUrl.trim(),
    status: formData.enabled ? 1 : 0
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const payload = buildSubmitPayload()
      if (dialogType.value === 'add') {
        await createClassroom(payload)
        ElMessage.success('教室创建成功')
      } else {
        await updateClassroom(formData.id, payload)
        ElMessage.success('教室更新成功')
      }
      dialogVisible.value = false
      await loadTree()
      await fetchData()
    } catch (error) {
      console.error('保存教室失败:', error)
      ElMessage.error('保存教室失败')
    }
  })
}

async function handleStatusChange(row) {
  const nextStatus = row.enabled ? 1 : 0
  try {
    await updateClassroomStatus(row.id, nextStatus)
    row.status = nextStatus
    ElMessage.success(nextStatus === 1 ? '教室已启用' : '教室已停用')
  } catch (error) {
    console.error('切换教室状态失败:', error)
    row.enabled = !row.enabled
    ElMessage.error('状态更新失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除教室“${row.classroomCode}”吗？`, '删除确认', { type: 'warning' })
    await deleteClassroom(row.id)
    ElMessage.success('删除成功')
    if (classrooms.value.length === 1 && pagination.current > 1) {
      pagination.current -= 1
    }
    await loadTree()
    await fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除教室失败:', error)
    }
  }
}

function resetImportState() {
  importLoading.value = false
  importFileName.value = ''
  importSourceFile.value = null
  importRows.value = []
}

function handleOpenImport() {
  resetImportState()
  importDialogVisible.value = true
}

function normalizeImportedStatus(value) {
  const raw = value == null ? '' : String(value).trim()
  if (!raw) {
    return { status: 1, label: '启用' }
  }
  const upper = raw.toUpperCase()
  if (/^1(\.0+)?$/.test(raw) || ['启用', '可用', '正常', 'ENABLED', 'ACTIVE'].includes(upper) || ['启用', '可用', '正常'].includes(raw)) {
    return { status: 1, label: '启用' }
  }
  if (/^0(\.0+)?$/.test(raw) || ['停用', '禁用', 'DISABLED', 'INACTIVE'].includes(upper) || ['停用', '禁用'].includes(raw)) {
    return { status: 0, label: '停用' }
  }
  return { status: null, label: raw }
}

function buildImportRows(rows) {
  return rows.map((row, index) => {
    const campus = String(row['校区'] ?? row.campus ?? '').trim()
    const building = String(row['楼栋'] ?? row.building ?? '').trim()
    const floor = String(row['楼层'] ?? row.floor ?? '').trim()
    const classroomCode = String(row['教室编码'] ?? row.classroomCode ?? '').trim()
    const rtspUrl = String(row['RTSP地址'] ?? row.rtspUrl ?? '').trim()
    const statusInfo = normalizeImportedStatus(row['状态'] ?? row.status ?? '')
    return {
      rowNumber: index + 2,
      campus,
      building,
      floor,
      classroomCode,
      rtspUrl,
      status: statusInfo.status,
      statusLabel: statusInfo.label,
      imported: false,
      serverError: ''
    }
  }).filter((row) => row.campus || row.building || row.floor || row.classroomCode || row.rtspUrl || row.statusLabel)
}

function getImportRowError(row) {
  if (!row.campus) return '校区不能为空'
  if (!row.building) return '楼栋不能为空'
  if (!row.floor) return '楼层不能为空'
  if (!row.classroomCode) return '教室编码不能为空'
  if (!row.rtspUrl) return 'RTSP地址不能为空'
  if (row.status == null) return '状态仅支持 1、0、启用、停用'
  return ''
}

function downloadImportTemplate() {
  const sheet = XLSX.utils.json_to_sheet([
    {
      '校区': '主校区',
      '楼栋': '至善楼',
      '楼层': '3',
      '教室编码': 'ZS-301',
      'RTSP地址': 'rtsp://127.0.0.1/live/zs301',
      '状态': '启用'
    },
    {
      '校区': '东校区',
      '楼栋': '明德楼',
      '楼层': '5',
      '教室编码': 'MD-501',
      'RTSP地址': 'rtsp://127.0.0.1/live/md501',
      '状态': '停用'
    }
  ])
  sheet['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 36 }, { wch: 12 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, '教室导入模板')
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), '教室导入模板.xlsx')
}

async function handleImportFile(uploadFile) {
  try {
    const buffer = await uploadFile.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      throw new Error('文件中没有可读取的工作表')
    }
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: '' })
    const parsedRows = buildImportRows(rows)
    if (!parsedRows.length) {
      throw new Error('未识别到可导入的数据行')
    }
    importFileName.value = uploadFile.name
    importSourceFile.value = uploadFile
    importRows.value = parsedRows
    ElMessage.success(`已读取 ${parsedRows.length} 条记录`)
  } catch (error) {
    console.error('解析导入文件失败:', error)
    ElMessage.error(error.message || '解析导入文件失败')
  }
  return false
}

async function handleBatchImport() {
  if (!importSourceFile.value) {
    ElMessage.warning('请先上传导入文件')
    return
  }

  importLoading.value = true
  try {
    const payload = new FormData()
    payload.append('file', importSourceFile.value)
    const res = await importClassrooms(payload)
    const result = res?.data || {}
    const failureMap = new Map((result.failures || []).map((item) => [item.rowNumber, item.reason]))

    importRows.value = importRows.value.map((row) => ({
      ...row,
      imported: !failureMap.has(row.rowNumber) && !getImportRowError(row),
      serverError: failureMap.get(row.rowNumber) || ''
    }))

    await loadTree()
    await fetchData()

    if (Number(result.failureCount || 0) > 0) {
      ElMessage.warning(`成功导入 ${result.successCount || 0} 条，失败 ${result.failureCount || 0} 条`)
      return
    }

    ElMessage.success(`成功导入 ${result.successCount || 0} 间教室`)
    importDialogVisible.value = false
  } catch (error) {
    console.error('批量导入教室失败:', error)
    ElMessage.error(error.message || '批量导入教室失败')
  } finally {
    importLoading.value = false
  }
}

onMounted(async () => {
  await loadTree()
  await fetchData()
})
</script>

<style lang="scss" scoped>
.classrooms-page {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 8px;
  overflow: hidden;
}

.page-atmosphere {
  display: none;
}

.orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(8px);
  opacity: 0.5;
}

.orb-a {
  top: 22px;
  left: -40px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(59, 130, 246, 0) 72%);
  animation: drift 12s ease-in-out infinite;
}

.orb-b {
  top: 56px;
  right: 8%;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.18) 0%, rgba(249, 115, 22, 0) 74%);
  animation: drift 14s ease-in-out infinite reverse;
}

.orb-c {
  top: 200px;
  left: 32%;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, rgba(16, 185, 129, 0) 74%);
  animation: pulse 10s ease-in-out infinite;
}

.toolbar-strip,
.tree-card,
.filter-card,
.table-card,
.overview-card,
.metric-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
}

.toolbar-strip {
  position: relative;
  z-index: 1;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  background: transparent;
  border: none;
  box-shadow: none;
}

.toolbar-context,
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-actions {
  margin-left: auto;

  :deep(.el-button) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
}

.context-pill {
  min-height: 38px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.95);
  color: #475569;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(10px);
}

.context-pill--primary {
  color: #1e3a8a;
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.96) 0%, rgba(219, 234, 254, 0.94) 100%);
  border-color: rgba(96, 165, 250, 0.28);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  position: relative;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.07);
    border-color: rgba(37, 99, 235, 0.14);
  }

  strong {
    display: block;
    margin-top: 4px;
    font-size: 24px;
    color: #0f172a;
  }
}

.metric-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.metric-label {
  color: #64748b;
  font-size: 13px;
}

.soft-blue {
  background: #e0f2fe;
  color: #0284c7;
}

.soft-green {
  background: #dcfce7;
  color: #15803d;
}

.soft-amber {
  background: #fef3c7;
  color: #b45309;
}

.soft-rose {
  background: #ffe4e6;
  color: #be123c;
}

.workspace-grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  gap: 18px;
  align-items: stretch;
  padding-top: 8px;
}

.content-shell {
  position: relative;
  z-index: 1;
  margin-left: 0;
  margin-top: 8px;
  height: 100%;
  min-height: 100%;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.content-column {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 100%;
}

.tree-card,
.table-card,
.overview-card {
  padding: 20px;
  transition: border-color 0.24s ease, background-color 0.24s ease;

  &:hover {
    transform: none;
    box-shadow: none;
  }
}

.tree-card {
  position: relative;
  z-index: 2;
  margin-top: 4px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
  min-height: 100%;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: none;

  &::before {
    content: '';
    position: absolute;
    inset: 14px auto 14px 0;
    width: 4px;
    border-radius: 999px;
    background: linear-gradient(180deg, #2563eb 0%, #38bdf8 100%);
  }
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;

  h3 {
    margin: 0 0 6px;
    font-size: 18px;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
    line-height: 1.6;
  }

  &.compact {
    margin-bottom: 12px;
  }
}

.tree-card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tree-card-actions--inner {
  order: 1;
  margin-top: 0;
  align-self: flex-start;
}

.tree-card > .el-skeleton,
.tree-card > .el-empty,
.classroom-tree,
.scope-panel--stage {
  order: 2;
  width: 100%;
  flex: 1;
}

.tree-card > .el-skeleton,
.tree-card > .el-empty {
  min-height: 0;
}

.scope-mode-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border-radius: 16px;
  background: rgba(226, 232, 240, 0.7);
  border: 1px solid rgba(203, 213, 225, 0.92);
}

.scope-mode-switch__btn {
  min-width: 96px;
  height: 38px;
  padding: 0 14px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;

  &.active {
    background: linear-gradient(135deg, #2563eb 0%, #38bdf8 100%);
    color: #fff;
    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
  }

  &:hover {
    transform: translateY(-1px);
  }
}

.section-accent {
  position: relative;
  overflow: hidden;
}

.table-card {
  padding: 22px 22px 18px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.99);
  border-color: rgba(226, 232, 240, 0.82);
  box-shadow: none;
  flex: 1;
  display: flex;
  flex-direction: column;

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 46px;
    border-radius: 16px;
    box-shadow: 0 0 0 1px rgba(226, 232, 240, 0.96) inset;
    background: rgba(255, 255, 255, 0.92);
  }

  :deep(.el-input__wrapper:hover),
  :deep(.el-select__wrapper:hover) {
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.82) inset;
  }

  :deep(.el-button) {
    min-height: 46px;
    padding: 0 20px;
    border-radius: 14px;
    font-weight: 700;
  }
}

.panel-toolbar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.92);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.58) 0%, rgba(255, 255, 255, 0.92) 100%);
  border-radius: 20px;
  padding: 16px;
}

.panel-toolbar__main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.reset-filter-btn {
  min-width: 132px;
}

.filter-summary-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-summary-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.overview-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 247, 237, 0.56) 100%);
}

.tree-selection {
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
  border: 1px solid #dbeafe;
  color: #1d4ed8;
  font-size: 13px;
}

.navigator-panel {
  min-height: 420px;
}

.classroom-tree {
  position: relative;
  min-height: 0;
  max-height: none;
  overflow: auto;
  padding-right: 4px;
}

.tree-node {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.tree-node__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scope-panel {
  border-radius: 20px;
  padding: 18px;
  background: linear-gradient(160deg, rgba(239, 246, 255, 0.9) 0%, rgba(255, 255, 255, 0.96) 100%);
  border: 1px solid rgba(191, 219, 254, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 16px 34px rgba(37, 99, 235, 0.08);
}

.scope-panel--stage {
  min-height: 0;
  max-height: none;
  overflow: auto;
}

.navigator-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.navigator-breadcrumb__item {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(191, 219, 254, 0.92);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;

  &.active {
    background: #dbeafe;
    color: #1d4ed8;
  }

  &:hover {
    transform: translateY(-1px);
  }
}

.scope-switch-grid {
  margin-top: 0;
  display: grid;
  gap: 10px;
}

.scope-switch-grid--stage {
  grid-template-columns: 1fr;
}

.scope-switch-card {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(226, 232, 240, 0.96);
  border-radius: 16px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.92) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;

  &:hover {
    transform: translateX(4px);
    border-color: rgba(59, 130, 246, 0.28);
    box-shadow: 0 14px 30px rgba(37, 99, 235, 0.08);
  }

  strong {
    display: block;
    margin-top: 6px;
    color: #0f172a;
    font-size: 15px;
  }

  p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
  }
}

.scope-switch-card--stage {
  min-height: 112px;
}

.scope-switch-card__type {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
}

.scope-switch-card__count {
  min-width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.scope-fade-enter-active,
.scope-fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.scope-fade-enter-from,
.scope-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.navigator-switch-enter-active,
.navigator-switch-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.navigator-switch-enter-from,
.navigator-switch-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  align-items: center;

  :deep(.el-select) {
    width: 100%;
  }
}

.search-input {
  width: 100%;
}

.search-input--hero {
  :deep(.el-input__wrapper) {
    min-height: 50px;
    padding-left: 10px;
    border-radius: 18px;
    box-shadow:
      0 0 0 1px rgba(203, 213, 225, 0.96) inset;
    background: #ffffff;
  }

  :deep(.el-input__prefix-inner) {
    color: #94a3b8;
  }

  :deep(.el-input__inner) {
    font-size: 15px;
    color: #0f172a;
  }

  :deep(.el-input__inner::placeholder) {
    color: #94a3b8;
    opacity: 1;
  }
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  strong {
    display: block;
    color: #0f172a;
  }

  p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 12px;
  }
}

.summary-pill {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid rgba(226, 232, 240, 0.96);
  color: #475569;
  font-size: 13px;
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(148, 163, 184, 0.72);
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
  }
}

.summary-pill--quiet {
  min-height: 42px;
  padding: 0 18px;
  background: #f8fafc;
  box-shadow: none;
  color: #334155;
  font-weight: 600;
  flex: 1;
  justify-content: flex-start;
}

.head-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  :deep(.el-tag) {
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    font-weight: 700;
  }
}

.classroom-table {
  margin-top: 8px;
  flex: 1;

  :deep(.el-table) {
    --el-table-border-color: rgba(226, 232, 240, 0.92);
    --el-table-header-bg-color: #f8fafc;
    --el-table-row-hover-bg-color: #f8fbff;
    border-radius: 22px;
    overflow: hidden;
    background: #fff;
    box-shadow: none;
    font-size: 14px;
  }

  :deep(.el-table__inner-wrapper) {
    border-radius: 22px;
    border: 1px solid rgba(226, 232, 240, 0.96);
    box-shadow: none;
  }

  :deep(.el-table__header-wrapper th) {
    height: 50px;
    background: #f8fafc;
    color: #334155;
    font-weight: 700;
  }

  :deep(.el-table__header-wrapper .cell) {
    font-size: 13px;
    letter-spacing: 0.02em;
  }

  :deep(.el-table__row td) {
    background: rgba(255, 255, 255, 0.98);
    padding: 0;
  }

  :deep(.el-table__fixed-right::before),
  :deep(.el-table__fixed::before) {
    display: none;
  }

  :deep(.el-table__body .cell) {
    min-height: 58px;
    display: flex;
    align-items: center;
    padding-top: 10px;
    padding-bottom: 10px;
    line-height: 1.5;
    color: #475569;
  }

  :deep(.el-table__fixed-right),
  :deep(.el-table__fixed) {
    box-shadow: none !important;
  }

  :deep(.el-table__fixed-right-patch) {
    background: #f8fafc;
  }
}

.table-primary-cell,
.table-meta-cell,
.table-stack-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.table-primary-cell strong,
.table-stack-cell strong {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.table-meta-cell span,
.table-stack-cell span,
.table-meta-text {
  color: #64748b;
  font-size: 13px;
}

.table-floor-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
}

.table-url {
  display: inline-block;
  max-width: 100%;
  color: #64748b;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  :deep(.el-button) {
    min-height: auto;
    padding: 0;
    font-weight: 700;
  }
}

:deep(.classroom-dialog) {
  .el-dialog {
    max-height: 88vh;
    display: flex;
    flex-direction: column;
  }

  .el-dialog__body {
    padding-top: 12px;
    padding-bottom: 12px;
    overflow: hidden;
  }

  .el-dialog__footer {
    padding-top: 12px;
  }
}

.dialog-scroll-body {
  max-height: calc(88vh - 150px);
  overflow: auto;
  padding-right: 6px;
}

.dialog-scroll-body--import {
  max-height: calc(88vh - 180px);
}

.pagination-row {
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(226, 232, 240, 0.92);

  :deep(.el-pagination) {
    margin-left: auto;
    padding: 10px 14px;
    border-radius: 18px;
    background: rgba(248, 250, 252, 0.92);
    border: 1px solid rgba(226, 232, 240, 0.96);
  }
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.overview-item {
  padding: 18px;
  border-radius: 16px;
  background: linear-gradient(160deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 34px rgba(15, 23, 42, 0.08);
    border-color: rgba(37, 99, 235, 0.18);
  }
}

.overview-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;

  strong {
    font-size: 17px;
    color: #0f172a;
  }

  p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
  }
}

.overview-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 62px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
}

.overview-metrics {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  span {
    color: #64748b;
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 6px;
    font-size: 22px;
    color: #0f172a;
  }
}

.import-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.9fr);
  gap: 18px;
  align-items: start;
}

.import-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-placeholder {
  min-height: 170px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #475569;

  strong {
    color: #0f172a;
  }
}

.import-tips {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;

  p {
    margin: 0;
    color: #475569;
    line-height: 1.8;
  }

  p + p {
    margin-top: 8px;
  }
}

.import-summary {
  margin: 18px 0 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.summary-chip {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #475569;

  &.success {
    background: #ecfdf5;
    color: #15803d;
    border-color: rgba(21, 128, 61, 0.16);
  }

  &.danger {
    background: #fff1f2;
    color: #be123c;
    border-color: rgba(190, 24, 93, 0.16);
  }
}

.import-table {
  border-radius: 14px;
}

.import-error-text {
  color: #64748b;
}

.reveal {
  opacity: 0;
  transform: translateY(18px);
  animation: reveal-up 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}

.reveal-1 { animation-delay: 0.04s; }
.reveal-2 { animation-delay: 0.1s; }
.reveal-3 { animation-delay: 0.16s; }
.reveal-4 { animation-delay: 0.22s; }
.reveal-5 { animation-delay: 0.3s; }
.reveal-6 { animation-delay: 0.38s; }

@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes drift {
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(18px, -12px, 0) scale(1.06);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.45;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.68;
  }
}

@media (max-width: 1440px) {
  .filter-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .metric-grid {
    grid-template-columns: 1fr 1fr;
  }

  .workspace-grid,
  .import-toolbar {
    grid-template-columns: 1fr;
  }

  .content-shell {
    margin-left: 0;
    margin-top: 0;
  }

  .toolbar-strip {
    align-items: flex-start;
  }

  .search-row,
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .filter-summary-bar {
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .toolbar-strip,
  .toolbar-context,
  .toolbar-actions,
  .filter-summary-bar,
  .card-head {
    flex-direction: column;
    align-items: stretch;
  }

  .metric-grid,
  .overview-metrics {
    grid-template-columns: 1fr;
  }

  .tree-card-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .scope-mode-switch {
    width: 100%;
  }

  .scope-mode-switch__btn {
    flex: 1;
    min-width: 0;
  }

  .tree-card,
  .table-card,
  .overview-card,
  .toolbar-strip,
  .content-shell {
    padding: 16px;
  }

  .pagination-row {
    justify-content: center;
  }
}
</style>








