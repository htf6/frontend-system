const TOKEN_KEY = 'system_token'
const USER_INFO_KEY = 'system_user_info'

export function getToken() {
    return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY)
}

export function getUserInfo() {
    const info = localStorage.getItem(USER_INFO_KEY)
    return info ? JSON.parse(info) : null
}

export function setUserInfo(user) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user))
}

export function clearAuth() {
    removeToken()
    localStorage.removeItem(USER_INFO_KEY)
}
