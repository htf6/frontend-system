import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: { title: '登录', requiresAuth: false }
    },
    {
        path: '/',
        name: 'Layout',
        component: () => import('@/components/Layout/MainLayout.vue'),
        redirect: '/alerts/events',
        meta: { requiresAuth: true },
        children: [
            {
                path: 'alerts/rules',
                name: 'AlertRules',
                component: () => import('@/views/alerts/Rules.vue'),
                meta: { title: '预警规则', icon: 'Setting', group: 'alerts', permission: 'alerts:rules:view' }
            },
            {
                path: 'alerts/events',
                name: 'AlertEvents',
                component: () => import('@/views/alerts/Events.vue'),
                meta: { title: '预警事件', icon: 'Bell', group: 'alerts', permission: 'alerts:events:view' }
            },
            {
                path: 'alerts/channels',
                name: 'AlertChannels',
                component: () => import('@/views/alerts/Channels.vue'),
                meta: { title: '通知渠道', icon: 'Message', group: 'alerts', permission: 'alerts:channels:view' }
            },
            {
                path: 'system/users',
                name: 'Users',
                component: () => import('@/views/system/UsersUnified.vue'),
                meta: { title: '用户管理', icon: 'User', group: 'system', permission: 'system:users:view' }
            },
            {
                path: 'system/roles',
                name: 'Roles',
                component: () => import('@/views/system/Roles.vue'),
                meta: { title: '角色权限', icon: 'Lock', group: 'system', permission: 'system:roles:view' }
            },
            {
                path: 'system/settings',
                name: 'Settings',
                component: () => import('@/views/system/Settings.vue'),
                meta: { title: '参数配置', icon: 'Tools', group: 'system', permission: 'system:settings:view' }
            },
            {
                path: 'system/monitor',
                name: 'Monitor',
                component: () => import('@/views/system/Monitor.vue'),
                meta: { title: '运行监控', icon: 'Monitor', group: 'system', permission: 'system:monitor:view' }
            },
            {
                path: 'system/audit',
                name: 'AuditLogs',
                component: () => import('@/views/system/AuditLogs.vue'),
                meta: { title: '审计日志', icon: 'Document', group: 'system', permission: 'system:audit:view' }
            },
            {
                path: 'data/ingest',
                name: 'DataIngest',
                component: () => import('@/views/data/Ingest.vue'),
                meta: { title: '数据接入', icon: 'Connection', group: 'data', permission: 'data:ingest:view' }
            },
            {
                path: 'data/storage',
                name: 'DataStorage',
                component: () => import('@/views/data/Storage.vue'),
                meta: { title: '存储策略', icon: 'Coin', group: 'data', permission: 'data:storage:view' }
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/alerts/events'
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    const token = userStore.token

    document.title = `${to.meta.title || '首页'} - 智慧教室巡课系统(系统管理)`

    if (to.meta.requiresAuth && !token) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
    } else if (to.name === 'Login' && token) {
        next({ name: 'AlertEvents' })
    } else if (to.meta.permission && !userStore.hasPermission(to.meta.permission)) {
        next({ name: 'AlertEvents' })
    } else {
        next()
    }
})

export default router
