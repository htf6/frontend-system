import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, clearAuth } from './auth'
import router from '@/router'

const isDev = import.meta.env.DEV
const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (isDev) {
    console.log('[Request] Environment:', { isDev, useMock, apiBaseUrl })
}

function normalizePaginationParams(params) {
    if (!params || typeof params !== 'object' || Array.isArray(params)) {
        return params
    }

    const normalized = { ...params }
    const rawPage = normalized.page ?? normalized.current ?? normalized.pageNum
    const rawPageSize = normalized.pageSize ?? normalized.size
    const page = Number(rawPage)
    const pageSize = Number(rawPageSize)

    if (Number.isFinite(page) && page > 0) {
        normalized.page = normalized.page ?? page
        normalized.current = normalized.current ?? page
        normalized.pageNum = normalized.pageNum ?? page
    }

    if (Number.isFinite(pageSize) && pageSize > 0) {
        normalized.pageSize = normalized.pageSize ?? pageSize
        normalized.size = normalized.size ?? pageSize
    }

    return normalized
}

const request = axios.create({
    // 使用空 baseURL，让 Vite 代理处理 /api 请求的转发
    baseURL: '',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
})

request.interceptors.request.use(
    (config) => {
        const token = getToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData
        if (isFormData && config.headers) {
            delete config.headers['Content-Type']
        }
        if (config.params) {
            config.params = normalizePaginationParams(config.params)
        }
        return config
    },
    (error) => Promise.reject(error)
)

request.interceptors.response.use(
    (response) => {
        const res = response.data
        if (res.code !== 200) {
            ElMessage.error(res.message || '请求失败')
            if (res.code === 401) {
                clearAuth()
                router.push('/login')
            }
            return Promise.reject(new Error(res.message || '请求失败'))
        }
        return res
    },
    (error) => {
        console.error('请求错误:', error)
        ElMessage.error(error.message || '网络错误')
        return Promise.reject(error)
    }
)

export default request
