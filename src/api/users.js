import request from '@/utils/request'

export function getUsers(params) {
    return request({ url: '/api/user', method: 'get', params })
}

export function createUser(data) {
    return request({ url: '/api/user', method: 'post', data })
}

export function updateUser(id, data) {
    return request({ url: `/api/user/${id}`, method: 'put', data })
}

export function deleteUser(id) {
    return request({ url: `/api/user/${id}`, method: 'delete' })
}

export function resetPassword(id) {
    return request({ url: `/api/user/${id}/reset-password`, method: 'post' })
}

export function toggleUserStatus(id, status) {
    return request({ url: `/api/user/${id}/status`, method: 'put', data: { status } })
}

