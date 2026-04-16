import request from '@/utils/request'

// 预警规则
export function getAlertRules(params) {
    return request({ url: '/api/alerts/rules', method: 'get', params })
}

export function createAlertRule(data) {
    return request({ url: '/api/alerts/rules', method: 'post', data })
}

export function updateAlertRule(id, data) {
    return request({ url: `/api/alerts/rules/${id}`, method: 'put', data })
}

export function deleteAlertRule(id) {
    return request({ url: `/api/alerts/rules/${id}`, method: 'delete' })
}

export function toggleAlertRule(id, enabled) {
    return request({ url: `/api/alerts/rules/${id}/toggle`, method: 'put', data: { enabled } })
}

// 预警事件
export function getAlertEvents(params) {
    return request({ url: '/api/alerts/events', method: 'get', params })
}

export function handleAlertEvent(id, data) {
    return request({ url: `/api/alerts/events/${id}`, method: 'put', data })
}

export function exportAlertEvents(params) {
    return request({ url: '/api/alerts/events/export', method: 'get', params, responseType: 'blob' })
}

// 通知渠道
export function getNotificationChannels() {
    return request({ url: '/api/notifications/channels', method: 'get' })
}

export function updateNotificationChannels(data) {
    return request({ url: '/api/notifications/channels', method: 'put', data })
}
