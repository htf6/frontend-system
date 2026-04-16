import request from '@/utils/request'

export function getRoles(params) {
    return request({ url: '/api/roles', method: 'get', params })
}

export function createRole(data) {
    return request({ url: '/api/roles', method: 'post', data })
}

export function updateRole(id, data) {
    return request({ url: `/api/roles/${id}/permissions`, method: 'put', data })
}

export function deleteRole(id) {
    return request({ url: `/api/roles/${id}`, method: 'delete' })
}

export function getPermissions() {
    return request({ url: '/api/permissions', method: 'get' })
}
