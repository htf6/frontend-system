import request from '@/utils/request'

export function getAuditLogs(params) {
    return request({ url: '/api/audit-logs', method: 'get', params })
}

export function getHealthCheck() {
    return request({ url: '/api/health', method: 'get' })
}

export function getMetrics() {
    return request({ url: '/api/metrics', method: 'get' })
}

export function getSystemLogs(params) {
    return request({ url: '/api/logs', method: 'get', params })
}
