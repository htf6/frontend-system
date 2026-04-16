import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setToken, getUserInfo, setUserInfo, clearAuth } from '@/utils/auth'
import { login as loginApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
    const token = ref(getToken() || '')
    const userInfo = ref(getUserInfo() || null)

    const isLoggedIn = computed(() => !!token.value)
    const userName = computed(() => userInfo.value?.nickname || userInfo.value?.name || '系统管理员')
    const userId = computed(() => userInfo.value?.id || '')
    const role = computed(() => userInfo.value?.role || '')
    const permissions = computed(() => userInfo.value?.permissions || [])

    async function login(credentials) {
        const response = await loginApi(credentials)
        const payload = response.data || {}
        const newToken = payload.token
        const user = payload.userInfo

        token.value = newToken
        userInfo.value = user

        setToken(newToken)
        setUserInfo(user)

        return response
    }

    function logout() {
        token.value = ''
        userInfo.value = null
        clearAuth()
    }

    function hasPermission(permission) {
        if (role.value === 'ADMIN') {
            return true
        }

        const permissionList = permissions.value || []
        if (permissionList.includes(permission) || permissionList.includes('*')) {
            return true
        }

        const parts = String(permission || '').split(':').filter(Boolean)
        for (let index = 1; index < parts.length; index += 1) {
            const wildcard = `${parts.slice(0, index).join(':')}:*`
            if (permissionList.includes(wildcard)) {
                return true
            }
        }

        return false
    }

    return {
        token,
        userInfo,
        isLoggedIn,
        userName,
        userId,
        role,
        permissions,
        login,
        logout,
        hasPermission
    }
})
