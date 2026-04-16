import Mock from 'mockjs'

// 用户数据
const users = [
    { id: 1, username: 'admin', name: '系统管理员', role: 'sysadmin', roleName: '系统管理员', email: 'admin@example.com', phone: '13800138000', enabled: true, lastLogin: Mock.Random.datetime() },
    { id: 2, username: 'zhangsan', name: '张三', role: 'admin', roleName: '教务管理员', email: 'zhangsan@example.com', phone: '13800138001', enabled: true, lastLogin: Mock.Random.datetime() },
    { id: 3, username: 'lisi', name: '李四', role: 'user', roleName: '普通用户', email: 'lisi@example.com', phone: '13800138002', enabled: false, lastLogin: Mock.Random.datetime() },
]

// 预警规则
const alertRules = [
    { id: 1, name: '噪声超标预警', description: '教室噪声超过阈值时触发', type: 'noise', typeName: '噪声预警', threshold: 80, unit: 'dB', scope: '全部教室', timeRange: '08:00-22:00', enabled: true },
    { id: 2, name: '人数拥挤预警', description: '教室人数超过容量90%时触发', type: 'crowded', typeName: '拥挤预警', threshold: 90, unit: '%', scope: '全部教室', timeRange: '08:00-22:00', enabled: true },
    { id: 3, name: '设备离线预警', description: '设备离线超过30分钟时触发', type: 'device', typeName: '设备异常', threshold: 30, unit: '分钟', scope: '全部教室', timeRange: '全天', enabled: true },
]

// 预警事件
const generateAlertEvents = (count = 20) => {
    const types = ['noise', 'crowded', 'device']
    const typeNames = { noise: '过噪', crowded: '拥挤', device: '设备异常' }
    const statuses = ['pending', 'processing', 'closed']
    const statusNames = { pending: '待处理', processing: '处理中', closed: '已关闭' }
    const buildings = ['至善楼', '博学楼']

    return Array.from({ length: count }, (_, i) => {
        const type = Mock.Random.pick(types)
        const status = Mock.Random.pick(statuses)
        return {
            id: i + 1,
            classroom: `${Mock.Random.pick(buildings)}${Mock.Random.integer(1, 5)}0${Mock.Random.integer(1, 8)}`,
            type,
            typeName: typeNames[type],
            message: Mock.Random.csentence(10, 30),
            status,
            statusName: statusNames[status],
            assignee: status === 'pending' ? '-' : Mock.Random.pick(['张三', '李四', '王五']),
            createdAt: Mock.Random.datetime()
        }
    })
}

// 审计日志
const generateAuditLogs = (count = 50) => {
    const types = ['auth', 'user', 'role', 'config', 'alert']
    const typeNames = { auth: '登录', user: '用户管理', role: '角色管理', config: '配置变更', alert: '预警处置' }
    const operators = ['admin', 'zhangsan', 'lisi']

    return Array.from({ length: count }, (_, i) => {
        const type = Mock.Random.pick(types)
        return {
            id: i + 1,
            time: Mock.Random.datetime(),
            operator: Mock.Random.pick(operators),
            type,
            typeName: typeNames[type],
            action: Mock.Random.csentence(5, 15),
            ip: Mock.Random.ip(),
            success: Mock.Random.boolean(0.9)
        }
    })
}

export default [
    // 登录
    {
        url: '/api/auth/login',
        method: 'post',
        response: ({ body }) => {
            if (body.username && body.password) {
                return {
                    code: 200,
                    message: '登录成功',
                    data: {
                        token: Mock.Random.guid(),
                        user: {
                            id: 1,
                            name: '系统管理员',
                            username: body.username,
                            role: 'sysadmin',
                            permissions: ['alerts:*', 'system:*', 'data:*']
                        }
                    }
                }
            }
            return { code: 401, message: '用户名或密码错误' }
        }
    },

    // 预警规则
    {
        url: '/api/alerts/rules',
        method: 'get',
        response: () => ({ code: 200, data: { list: alertRules, total: alertRules.length } })
    },
    {
        url: '/api/alerts/rules',
        method: 'post',
        response: ({ body }) => ({ code: 200, message: '新增成功', data: { id: Mock.Random.integer(10, 99), ...body } })
    },
    {
        url: '/api/alerts/rules/:id',
        method: 'put',
        response: () => ({ code: 200, message: '更新成功' })
    },
    {
        url: '/api/alerts/rules/:id',
        method: 'delete',
        response: () => ({ code: 200, message: '删除成功' })
    },
    {
        url: '/api/alerts/rules/:id/toggle',
        method: 'put',
        response: () => ({ code: 200, message: '操作成功' })
    },

    // 预警事件
    {
        url: '/api/alerts/events',
        method: 'get',
        response: ({ query }) => {
            const list = generateAlertEvents(parseInt(query.pageSize) || 10)
            return { code: 200, data: { list, total: 256, stats: { pending: 8, processing: 3, closed: 245 } } }
        }
    },
    {
        url: '/api/alerts/events/:id',
        method: 'put',
        response: () => ({ code: 200, message: '处置成功' })
    },

    // 通知渠道
    {
        url: '/api/notifications/channels',
        method: 'get',
        response: () => ({
            code: 200,
            data: { inApp: true, inAppReceivers: ['admin', 'teacher'], email: false, sms: false, wechat: false }
        })
    },
    {
        url: '/api/notifications/channels',
        method: 'put',
        response: () => ({ code: 200, message: '保存成功' })
    },

    // 用户管理
    {
        url: '/api/users',
        method: 'get',
        response: () => ({ code: 200, data: { list: users, total: users.length } })
    },
    {
        url: '/api/users',
        method: 'post',
        response: ({ body }) => ({ code: 200, message: '新增成功', data: { id: Mock.Random.integer(10, 99), ...body } })
    },
    {
        url: '/api/users/:id',
        method: 'put',
        response: () => ({ code: 200, message: '更新成功' })
    },
    {
        url: '/api/users/:id',
        method: 'delete',
        response: () => ({ code: 200, message: '删除成功' })
    },
    {
        url: '/api/users/:id/reset-password',
        method: 'post',
        response: () => ({ code: 200, message: '密码已重置为默认密码' })
    },
    {
        url: '/api/users/:id/status',
        method: 'put',
        response: () => ({ code: 200, message: '状态更新成功' })
    },

    // 角色管理
    {
        url: '/api/roles',
        method: 'get',
        response: () => ({
            code: 200,
            data: {
                list: [
                    { id: 1, name: '系统管理员', description: '系统最高权限', isSystem: true, userCount: 2, permissionCount: 45 },
                    { id: 2, name: '教务管理员', description: '教务功能管理', isSystem: true, userCount: 5, permissionCount: 28 },
                    { id: 3, name: '普通用户', description: '基础查看权限', isSystem: true, userCount: 15, permissionCount: 12 },
                ]
            }
        })
    },

    // 系统配置
    {
        url: '/api/settings',
        method: 'get',
        response: () => ({
            code: 200,
            data: { refreshInterval: 10000, dataRetention: 30, noiseThreshold: 80, crowdedThreshold: 90, offlineThreshold: 30, emailEnabled: true, smsEnabled: false }
        })
    },
    {
        url: '/api/settings',
        method: 'put',
        response: () => ({ code: 200, message: '配置保存成功' })
    },

    // 健康检查
    {
        url: '/api/health',
        method: 'get',
        response: () => ({ code: 200, data: { status: 'healthy', version: '1.0.0', uptime: '15天 6小时' } })
    },

    // 系统指标
    {
        url: '/api/metrics',
        method: 'get',
        response: () => ({
            code: 200,
            data: { cpu: Mock.Random.integer(20, 60), memory: Mock.Random.integer(40, 80), disk: Mock.Random.integer(30, 60), connections: Mock.Random.integer(100, 200) }
        })
    },

    // 审计日志
    {
        url: '/api/audit/logs',
        method: 'get',
        response: ({ query }) => {
            const list = generateAuditLogs(parseInt(query.pageSize) || 20)
            return { code: 200, data: { list, total: 1256 } }
        }
    }
]
