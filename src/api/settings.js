import request from '@/utils/request'

export function getSettings() {
    return request({ url: '/api/settings', method: 'get' })
}

export function updateSettings(data) {
    return request({ url: '/api/settings', method: 'put', data })
}

export function getSettingsHistory() {
    return request({ url: '/api/settings/history', method: 'get' })
}
