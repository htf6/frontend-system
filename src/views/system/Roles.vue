<template>
  <div class="roles-page">
    <section class="page-header glass-card">
      <div class="header-main">
        <span class="header-badge"><ShieldCheck :size="22" /></span>
        <div>
          <h2>角色权限</h2>
          <p>按角色查看成员规模，并统一配置系统权限。</p>
        </div>
      </div>
      <div class="page-actions">
        <el-button @click="fetchAll">
          <RefreshCw :size="16" />
          <span>刷新</span>
        </el-button>
        <el-button type="primary" @click="openPermissionDialog(selectedRole)">
          <Settings2 :size="16" />
          <span>配置权限</span>
        </el-button>
      </div>
    </section>

    <div class="page-layout" v-loading="loading">
      <aside class="role-sidebar glass-card">
        <div class="section-head">
          <div class="section-title-wrap">
            <span class="section-icon"><LayoutGrid :size="16" /></span>
            <div>
              <h3>角色列表</h3>
              <span>共 {{ roles.length }} 个角色</span>
            </div>
          </div>
        </div>

        <button
          v-for="role in roles"
          :key="role.code"
          type="button"
          class="role-item"
          :class="{ active: role.code === selectedRoleCode }"
          @click="focusRole(role)"
        >
          <div class="role-item-head">
            <strong>{{ role.name }}</strong>
            <el-tag :type="role.system ? 'danger' : 'info'" size="small">{{ role.code }}</el-tag>
          </div>
          <p>{{ role.description }}</p>
          <div class="role-item-meta">
            <span>{{ role.userCount }} 人</span>
            <span>{{ role.permissionCount }} 项权限</span>
          </div>
        </button>
      </aside>

      <section v-if="selectedRole" class="role-content">
        <section class="overview-card glass-card">
          <div class="overview-top">
            <div class="overview-info">
              <span class="role-code">{{ selectedRole.code }}</span>
              <div>
                <h3>{{ selectedRole.name }}</h3>
                <p>{{ selectedRole.description }}</p>
              </div>
            </div>
            <div class="overview-actions">
              <el-button type="primary" @click="openPermissionDialog(selectedRole)">
                <Settings2 :size="16" />
                <span>编辑权限</span>
              </el-button>
              <el-button plain @click="openMembersDialog(selectedRole)">
                <Users :size="16" />
                <span>查看成员</span>
              </el-button>
            </div>
          </div>

          <div class="overview-stats">
            <div class="stat-block">
              <span class="stat-icon"><Users :size="18" /></span>
              <div>
                <span>成员数量</span>
                <strong>{{ selectedRole.userCount }}</strong>
              </div>
            </div>
            <div class="stat-block">
              <span class="stat-icon"><KeyRound :size="18" /></span>
              <div>
                <span>权限数量</span>
                <strong>{{ selectedRole.permissionCount }}</strong>
              </div>
            </div>
            <div class="stat-block">
              <span class="stat-icon"><Blocks :size="18" /></span>
              <div>
                <span>覆盖模块</span>
                <strong>{{ selectedModules.length }}</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="permission-card glass-card">
          <div class="section-head section-head-inline">
            <div class="section-title-wrap">
              <span class="section-icon"><Blocks :size="16" /></span>
              <div>
                <h3>模块权限</h3>
                <span>按模块查看当前角色已分配的权限范围</span>
              </div>
            </div>
            <span>{{ selectedModules.length }} 个模块</span>
          </div>

          <div class="module-list">
            <article v-for="module in selectedModules" :key="module.key" class="module-row">
              <div class="module-row-head">
                <div class="module-title-wrap">
                  <span class="module-icon"><LayoutGrid :size="16" /></span>
                  <div>
                    <strong>{{ module.name }}</strong>
                    <p>已分配 {{ module.selectedCount }} / {{ module.totalCount }} 项</p>
                  </div>
                </div>
                <span class="module-rate">{{ module.coverage }}%</span>
              </div>
              <div class="module-progress">
                <span :style="{ width: `${module.coverage}%` }"></span>
              </div>
              <div class="module-tags">
                <el-tag
                  v-for="item in module.items"
                  :key="item.code"
                  size="small"
                  effect="plain"
                  :type="item.checked ? 'danger' : 'info'"
                >
                  {{ item.name }}
                </el-tag>
              </div>
            </article>
          </div>
        </section>
      </section>
    </div>

    <el-dialog
      v-model="permDialogVisible"
      :title="`权限配置 - ${currentRole?.name || ''}`"
      width="760px"
      append-to-body
    >
      <div class="dialog-header">
        <strong>{{ currentRole?.name }}</strong>
        <span>已选 {{ selectedPermissionCount }} / {{ totalPermissions }}</span>
      </div>

      <div class="permission-tree" v-loading="permissionLoading">
        <el-tree
          ref="treeRef"
          :data="permissionTree"
          show-checkbox
          node-key="id"
          :props="{ label: 'name', children: 'children' }"
        />
      </div>

      <template #footer>
        <el-button plain @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="savePermissions">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="memberDrawerVisible"
      :title="`角色成员 - ${memberRoleName}`"
      size="42%"
      append-to-body
    >
      <el-table :data="memberUsers" v-loading="memberLoading" class="member-table" max-height="520">
        <el-table-column type="index" label="序号" width="72" :index="getMemberRowIndex" />
        <el-table-column prop="username" label="账号" min-width="140" />
        <el-table-column prop="nickname" label="姓名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="lastLoginTime" label="最后登录" min-width="180" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { Blocks, KeyRound, LayoutGrid, RefreshCw, Settings2, ShieldCheck, Users } from 'lucide-vue-next'
import { getRoles, updateRole, getPermissions } from '@/api/roles'
import { getUsers } from '@/api/users'

const loading = ref(false)
const permissionLoading = ref(false)
const saving = ref(false)
const memberLoading = ref(false)
const roles = ref([])
const permissionTree = ref([])
const currentRole = ref(null)
const selectedRoleCode = ref('')
const treeRef = ref(null)
const permDialogVisible = ref(false)
const memberDrawerVisible = ref(false)
const memberUsers = ref([])
const memberRoleName = ref('')

const totalPermissions = computed(() => permissionTree.value.reduce((sum, group) => sum + ((group.children || []).length), 0))
const selectedRole = computed(() => roles.value.find((role) => role.code === selectedRoleCode.value) || roles.value[0] || null)
const selectedPermissionSet = computed(() => new Set(selectedRole.value?.permissionCodes || []))
const selectedPermissionCount = computed(() => treeRef.value?.getCheckedKeys(true)?.length || currentRole.value?.permissionCount || 0)
const selectedModules = computed(() => permissionTree.value.map((group) => {
  const items = (group.children || []).map((item) => ({
    code: item.code || item.id,
    name: item.name,
    checked: selectedPermissionSet.value.has(item.code || item.id)
  }))
  const selectedCount = items.filter((item) => item.checked).length
  const totalCount = items.length
  const coverage = totalCount ? Math.round((selectedCount / totalCount) * 100) : 0

  return {
    key: group.id || group.code,
    name: group.name,
    items,
    selectedCount,
    totalCount,
    coverage
  }
}))

const formatDateTime = (value) => {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : '-'
}

const getMemberRowIndex = (index) => index + 1

const focusRole = (role) => {
  selectedRoleCode.value = role.code
}

const fetchRoles = async () => {
  const res = await getRoles()
  const payload = res?.data ?? []
  const list = Array.isArray(payload) ? payload : (payload.records || payload.list || [])
  roles.value = list.map((item) => ({
    code: item.code,
    name: item.name,
    description: item.description,
    system: item.system ?? true,
    userCount: item.userCount || 0,
    permissionCount: item.permissionCount || 0,
    permissionCodes: item.permissionCodes || []
  }))

  if (!selectedRoleCode.value || !roles.value.some((role) => role.code === selectedRoleCode.value)) {
    selectedRoleCode.value = roles.value[0]?.code || ''
  }
}

const fetchPermissionTree = async () => {
  const res = await getPermissions()
  permissionTree.value = Array.isArray(res?.data) ? res.data : []
}

const fetchAll = async () => {
  loading.value = true
  try {
    await Promise.all([fetchRoles(), fetchPermissionTree()])
  } catch (error) {
    console.error('加载角色权限失败:', error)
    ElMessage.error('加载角色权限失败')
  } finally {
    loading.value = false
  }
}

const openPermissionDialog = async (role) => {
  const targetRole = role || selectedRole.value
  if (!targetRole) return
  currentRole.value = targetRole
  permDialogVisible.value = true
  await nextTick()
  treeRef.value?.setCheckedKeys(targetRole.permissionCodes || [])
}

const savePermissions = async () => {
  if (!currentRole.value) return
  saving.value = true
  try {
    const checked = treeRef.value?.getCheckedKeys(true) || []
    await updateRole(currentRole.value.code, { permissionCodes: checked })
    ElMessage.success(`已保存 ${checked.length} 项权限`)
    permDialogVisible.value = false
    await fetchRoles()
  } catch (error) {
    console.error('保存角色权限失败:', error)
    ElMessage.error('保存角色权限失败')
  } finally {
    saving.value = false
  }
}

const openMembersDialog = async (role) => {
  const targetRole = role || selectedRole.value
  if (!targetRole) return
  memberRoleName.value = targetRole.name
  memberDrawerVisible.value = true
  memberLoading.value = true
  try {
    const pageSize = 100
    let current = 1
    let pages = 1
    const allMembers = []

    while (current <= pages) {
      const res = await getUsers({ current, size: pageSize, role: targetRole.code })
      const payload = res?.data ?? {}
      const pageData = Array.isArray(payload)
        ? { records: payload, current: 1, pages: 1 }
        : (payload.records || payload.list ? payload : (payload.data || payload.page || payload.result || {}))

      const records = pageData.records || pageData.list || []
      allMembers.push(...records.map((item) => ({
        ...item,
        lastLoginTime: formatDateTime(item.lastLoginTime || item.loginTime || item.updateTime)
      })))
      pages = pageData.pages || (pageData.total ? Math.ceil(pageData.total / pageSize) : current)
      current += 1
    }

    memberUsers.value = allMembers
  } catch (error) {
    console.error('获取角色成员失败:', error)
    ElMessage.error('获取角色成员失败')
    memberUsers.value = []
  } finally {
    memberLoading.value = false
  }
}

fetchAll()
</script>

<style lang="scss" scoped>
.roles-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 10px;
}

.page-header {
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 14px;

  h2 {
    font-size: 28px;
    margin-bottom: 6px;
  }

  p {
    color: var(--text-secondary);
  }
}

.header-badge,
.section-icon,
.module-icon,
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

.page-actions {
  display: flex;
  gap: 10px;

  :deep(.el-button) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
}

.page-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.role-sidebar {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 20px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  h3 {
    font-size: 18px;
    margin-bottom: 4px;
  }

  span {
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.section-head-inline {
  align-items: flex-end;
}

.section-title-wrap,
.module-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.section-icon,
.module-icon {
  width: 34px;
  height: 34px;
}

.role-item {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--border-color);
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: rgba(191, 77, 60, 0.22);
    background: #fffdfc;
    transform: translateY(-1px);
  }

  &.active {
    border-color: rgba(191, 77, 60, 0.34);
    background: #fff9f7;
  }

  p {
    margin: 8px 0 10px;
    color: var(--text-secondary);
    line-height: 1.6;
    font-size: 13px;
  }
}

.role-item-head,
.overview-top,
.module-row-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.role-item-meta {
  display: flex;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 12px;
}

.role-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overview-card,
.permission-card {
  padding: 22px 24px;
}

.overview-info {
  display: flex;
  align-items: flex-start;
  gap: 14px;

  h3 {
    font-size: 24px;
    margin-bottom: 6px;
  }

  p {
    color: var(--text-secondary);
  }
}

.role-code {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 76px;
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-color);
  font-weight: 700;
}

.overview-actions {
  display: flex;
  gap: 10px;

  :deep(.el-button) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
}

.overview-stats {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.stat-block {
  padding: 16px 18px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfd 100%);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 12px;

  > div > span {
    display: block;
    color: var(--text-secondary);
    margin-bottom: 8px;
    font-size: 13px;
  }

  strong {
    font-size: 28px;
  }
}

.stat-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
}

.module-list {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.module-row {
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid var(--border-color);
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfd 100%);
}

.module-row-head {
  align-items: center;

  strong {
    font-size: 16px;
  }

  p {
    margin-top: 4px;
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.module-rate {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color);
}

.module-progress {
  margin: 12px 0;
  height: 8px;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #d26b5a 0%, var(--primary-color) 100%);
  }
}

.module-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dialog-header {
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  strong {
    font-size: 16px;
  }

  span {
    color: var(--text-secondary);
  }
}

.permission-tree {
  max-height: 430px;
  overflow-y: auto;
}

.member-table {
  border-radius: 16px;
}

@media (max-width: 1080px) {
  .page-layout {
    grid-template-columns: 1fr;
  }

  .role-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .page-header,
  .page-actions,
  .overview-top,
  .overview-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .header-main,
  .section-title-wrap,
  .module-title-wrap {
    align-items: center;
  }

  .overview-card,
  .permission-card,
  .page-header {
    padding: 18px;
  }

  .overview-info {
    flex-direction: column;
  }

  .overview-stats {
    grid-template-columns: 1fr;
  }
}
</style>


