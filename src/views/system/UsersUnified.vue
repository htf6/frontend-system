<template>
  <div class="users-page">
    <div class="page-header glass-card">
      <div class="header-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户..."
          prefix-icon="Search"
          clearable
          style="width: 250px"
          @input="handleSearch"
        />
        <el-select v-model="filterRole" placeholder="角色" @change="fetchData">
          <el-option label="全部角色" value="" />
          <el-option label="管理员" value="ADMIN" />
          <el-option label="教师" value="TEACHER" />
          <el-option label="学生" value="STUDENT" />
        </el-select>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          <span class="btn-text">新增用户</span>
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="glass-card management-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="用户列表" name="users">
        <div class="users-table">
          <el-table :data="users" v-loading="loading" class="dark-table">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="账号" width="140" />
            <el-table-column prop="name" label="姓名" width="140" />
            <el-table-column prop="role" label="角色" width="120">
              <template #default="{ row }">
                <el-tag :type="getRoleTag(row.role)" size="small">{{ getRoleLabel(row.role) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="email" label="邮箱" min-width="180" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="handleStatusChange(row)" />
              </template>
            </el-table-column>
            <el-table-column prop="lastLogin" label="最后登录" width="200" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" text size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button type="warning" text size="small" @click="handleResetPwd(row)">重置密码</el-button>
                <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.current"
              v-model:page-size="pagination.size"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next"
              @size-change="fetchData"
              @current-change="fetchData"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="角色与权限" name="roles">
        <div class="roles-grid">
          <div v-for="role in roleConfigs" :key="role.key" class="role-card">
            <div class="role-title-row">
              <div>
                <h4>{{ role.label }}</h4>
                <p>{{ role.description }}</p>
              </div>
              <el-tag :type="getRoleTag(role.key)" size="small">{{ role.key }}</el-tag>
            </div>

            <div class="permission-preview">
              <el-tag
                v-for="perm in getRolePermissionLabels(role.key).slice(0, 6)"
                :key="`${role.key}-${perm}`"
                size="small"
                effect="plain"
              >
                {{ perm }}
              </el-tag>
              <span class="perm-count">共 {{ rolePermissions[role.key]?.length || 0 }} 项</span>
            </div>

            <div class="role-actions">
              <el-button type="primary" text @click="openPermissionDialog(role)">编辑权限</el-button>
              <el-button type="primary" text @click="openMembersDialog(role)">管理名单</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="permissionDialogVisible" :title="`编辑权限 - ${editingRoleLabel}`" width="640px" class="dark-dialog">
      <el-checkbox-group v-model="editingPermissions" class="permission-grid">
        <el-checkbox v-for="perm in permissionCatalog" :key="perm.id" :label="perm.id">
          {{ perm.label }}
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRolePermissions">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="memberDrawerVisible" :title="`角色名单 - ${memberRoleLabel}`" size="40%">
      <el-table :data="memberUsers" v-loading="memberLoading" class="dark-table">
        <el-table-column prop="username" label="账号" min-width="130" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="lastLogin" label="最后登录" min-width="180" />
      </el-table>
      <template #footer>
        <span class="drawer-footer">共 {{ memberUsers.length }} 人</span>
      </template>
    </el-drawer>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增用户' : '编辑用户'" width="500px" class="dark-dialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="formData.username" :disabled="dialogType === 'edit'" placeholder="登录账号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="用户姓名" />
        </el-form-item>
        <el-form-item v-if="dialogType === 'add'" label="密码" prop="password">
          <el-input v-model="formData.password" type="password" show-password placeholder="初始密码" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" style="width: 100%">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="教师" value="TEACHER" />
            <el-option label="学生" value="STUDENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="email@example.com" />
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model="formData.phone" placeholder="手机号码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getUsers, createUser, updateUser, deleteUser, resetPassword, toggleUserStatus } from '@/api/users'
import { getRoles, updateRole, getPermissions } from '@/api/roles'
import { debounce } from 'lodash-es'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const searchQuery = ref('')
const filterRole = ref('')
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const activeTab = ref('users')

const pagination = reactive({ current: 1, size: 10, total: 0 })

const users = ref([])
const memberUsers = ref([])
const memberLoading = ref(false)
const memberDrawerVisible = ref(false)
const memberRoleKey = ref('')

const permissionDialogVisible = ref(false)
const editingRoleKey = ref('')
const editingPermissions = ref([])

const formData = reactive({
  id: null, username: '', name: '', password: '', role: 'STUDENT', email: '', phone: ''
})

const formRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const roleLabelMap = {
  ADMIN: '管理员',
  TEACHER: '教师',
  STUDENT: '学生',
  sysadmin: '系统管理员',
  admin: '教务管理员',
  user: '普通用户'
}

const roleConfigs = [
  { key: 'ADMIN', label: '管理员', description: '可配置系统参数并管理全局权限' },
  { key: 'TEACHER', label: '教务管理员', description: '负责教学运营与规则配置' },
  { key: 'STUDENT', label: '学生', description: '拥有基础查看与反馈能力' }
]

const permissionCatalog = [
  { id: 'alerts:events:view', label: '查看预警事件' },
  { id: 'alerts:events:handle', label: '处置预警事件' },
  { id: 'alerts:rules:view', label: '查看预警规则' },
  { id: 'alerts:rules:edit', label: '编辑预警规则' },
  { id: 'alerts:channels:edit', label: '配置通知渠道' },
  { id: 'system:users:view', label: '查看用户列表' },
  { id: 'system:users:edit', label: '编辑用户' },
  { id: 'system:audit:view', label: '查看审计日志' },
  { id: 'system:settings:edit', label: '编辑系统参数' },
  { id: 'data:ingest:view', label: '查看数据接入' },
  { id: 'data:ingest:edit', label: '编辑接入配置' },
  { id: 'data:storage:view', label: '查看存储策略' }
]

const defaultRolePermissions = {
  ADMIN: permissionCatalog.map((item) => item.id),
  TEACHER: [
    'alerts:events:view',
    'alerts:events:handle',
    'alerts:rules:view',
    'alerts:rules:edit',
    'alerts:channels:edit',
    'system:users:view',
    'system:audit:view',
    'data:ingest:view',
    'data:storage:view'
  ],
  STUDENT: ['alerts:events:view', 'data:ingest:view']
}

const rolePermissions = reactive({ ...defaultRolePermissions })

const resolveEnabled = (item) => {
  if (typeof item.enabled === 'boolean') return item.enabled
  if (typeof item.status === 'boolean') return item.status
  if (typeof item.status === 'number') return item.status === 1
  if (typeof item.status === 'string') return ['enabled', 'active', 'normal', '1'].includes(item.status.toLowerCase())
  return true
}

const normalizeUser = (item) => ({
  id: item.id,
  username: item.username || item.userName || '-',
  name: item.name || item.nickname || item.realName || '-',
  role: item.role || item.operatorRole || '',
  roleName: item.roleName || roleLabelMap[item.role] || item.role || '-',
  email: item.email || '-',
  phone: item.phone || '',
  enabled: resolveEnabled(item),
  lastLogin: item.lastLogin || item.lastLoginTime || item.loginTime || item.updateTime || '-'
})

const parseUserPageData = (res) => {
  const payload = res?.data ?? {}
  const pageData = payload.records || payload.list || Array.isArray(payload)
    ? payload
    : (payload.data || payload.page || payload.result || {})
  const list = Array.isArray(pageData) ? pageData : (pageData.records || pageData.list || [])

  users.value = list.map(normalizeUser)
  pagination.current = pageData.current || pagination.current
  pagination.size = pageData.size || pagination.size
  pagination.total = pageData.total || pageData.count || users.value.length || 0
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getUsers({
      current: pagination.current,
      size: pagination.size,
      username: searchQuery.value || undefined,
      role: filterRole.value || undefined
    })
    parseUserPageData(res)
  } catch {
    users.value = []
    pagination.total = 0
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = debounce(() => {
  pagination.current = 1
  fetchData()
}, 300)

const getRoleTag = (role) => {
  const map = { ADMIN: 'danger', TEACHER: 'warning', STUDENT: 'info', sysadmin: 'danger', admin: 'warning', user: 'info' }
  return map[role] || 'info'
}

const getRoleLabel = (role) => roleLabelMap[role] || role || '-'

const editingRoleLabel = computed(() => getRoleLabel(editingRoleKey.value))
const memberRoleLabel = computed(() => getRoleLabel(memberRoleKey.value))

const getRolePermissionLabels = (roleKey) => {
  const ids = rolePermissions[roleKey] || []
  return ids.map((id) => permissionCatalog.find((item) => item.id === id)?.label).filter(Boolean)
}

const loadRolePermissions = () => {
  const raw = localStorage.getItem('role-permissions-config')
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    roleConfigs.forEach((role) => {
      if (Array.isArray(parsed[role.key])) {
        rolePermissions[role.key] = parsed[role.key]
      }
    })
  } catch {
    localStorage.removeItem('role-permissions-config')
  }
}

const saveRolePermissions = () => {
  if (!editingRoleKey.value) return
  rolePermissions[editingRoleKey.value] = [...editingPermissions.value]
  localStorage.setItem('role-permissions-config', JSON.stringify(rolePermissions))
  permissionDialogVisible.value = false
  ElMessage.success('角色权限已保存')
}

const openPermissionDialog = (role) => {
  editingRoleKey.value = role.key
  editingPermissions.value = [...(rolePermissions[role.key] || [])]
  permissionDialogVisible.value = true
}

const openMembersDialog = async (role) => {
  memberRoleKey.value = role.key
  memberDrawerVisible.value = true
  memberLoading.value = true
  try {
    const res = await getUsers({ current: 1, size: 200, role: role.key })
    const payload = res?.data ?? {}
    const pageData = payload.records || payload.list || Array.isArray(payload)
      ? payload
      : (payload.data || payload.page || payload.result || {})
    const source = Array.isArray(pageData) ? pageData : (pageData.records || pageData.list || [])
    memberUsers.value = source.map(normalizeUser)
  } catch {
    memberUsers.value = []
    ElMessage.error('获取角色成员失败')
  } finally {
    memberLoading.value = false
  }
}

const handleTabChange = (tabName) => {
  router.replace({ query: { ...route.query, tab: tabName } })
}

const handleAdd = () => {
  dialogType.value = 'add'
  Object.assign(formData, { id: null, username: '', name: '', password: '', role: 'STUDENT', email: '', phone: '' })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const payload = {
        username: formData.username,
        nickname: formData.name,
        role: formData.role,
        email: formData.email || null,
        phone: formData.phone || null
      }

      if (dialogType.value === 'add') {
        await createUser({ ...payload, password: formData.password })
        ElMessage.success('新增成功')
      } else {
        await updateUser(formData.id, payload)
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      fetchData()
    } catch {
      ElMessage.error('操作失败')
    }
  })
}

const handleStatusChange = async (row) => {
  try {
    await toggleUserStatus(row.id, row.enabled ? 1 : 0)
    ElMessage.success(row.enabled ? '用户已启用' : '用户已禁用')
  } catch {
    row.enabled = !row.enabled
    ElMessage.error('操作失败')
  }
}

const handleResetPwd = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要重置用户\"${row.name}\"的密码吗？`, '重置密码', { type: 'warning' })
    await resetPassword(row.id)
    ElMessage.success('密码已重置为默认密码')
  } catch {}
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户\"${row.name}\"吗？`, '删除确认', { type: 'warning' })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    if (users.value.length === 1 && pagination.current > 1) {
      pagination.current -= 1
    }
    fetchData()
  } catch {}
}

watch(() => route.query.tab, (tab) => {
  if (tab === 'roles') {
    activeTab.value = 'roles'
    return
  }
  activeTab.value = 'users'
}, { immediate: true })

onMounted(() => {
  loadRolePermissions()
  fetchData()
})
</script>

<style lang="scss" scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.page-header {
  padding: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);

  .header-left { display: flex; gap: var(--spacing-md); flex-wrap: wrap; }
}

.management-tabs {
  padding: var(--spacing-lg);

  :deep(.el-tabs__header) {
    margin-bottom: 18px;
  }

  :deep(.el-tabs__item) {
    font-weight: 600;
  }
}

.users-table {
  .pagination-wrapper {
    margin-top: var(--spacing-lg);
    display: flex;
    justify-content: flex-end;
  }
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

.role-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.role-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  h4 {
    margin: 0;
    font-size: 16px;
    color: var(--text-primary);
  }

  p {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.permission-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .perm-count {
    margin-left: auto;
    font-size: 12px;
    color: var(--text-secondary);
    align-self: center;
  }
}

.role-actions {
  display: flex;
  gap: 8px;
}

.permission-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 10px;
}

.drawer-footer {
  color: var(--text-secondary);
  font-size: 13px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;

    .header-left { flex-direction: column; :deep(.el-input), :deep(.el-select) { width: 100% !important; } }
    .btn-text { display: none; }
  }

  .permission-grid {
    grid-template-columns: 1fr;
  }

  .users-table :deep(.el-table__cell:nth-child(1)), :deep(.el-table__cell:nth-child(5)), :deep(.el-table__cell:nth-child(7)) { display: none !important; }
}
</style>
