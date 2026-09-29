/**
 * axios 封装：契约拦截器（R{code,msg,data} / TableDataInfo{rows,total}，HTTP 恒 200）
 * - code 200 → 返回整个响应体
 * - code 401 → 清 token 回登录页（携带 redirect）
 * - code 403 → 提示无权限
 * - 其余 → 提示 msg
 * VITE_USE_MOCK=true 时挂接内置 mock adapter（与真实接口共用本层，切换零代码改动）
 */
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
// InternalAxiosRequestConfig / AxiosResponse 供下方 mock adapter 类型引用
import type { R } from '@/types/api'
import { getToken, removeToken } from '@/utils/auth'
import { message } from '@/utils/message'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
})

service.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

service.interceptors.response.use(
  (response: AxiosResponse) => {
    // blob（文件下载等）直接放行
    if (response.config.responseType === 'blob') return response
    const body = response.data as R & Record<string, unknown>
    if (body && typeof body.code === 'number') {
      if (body.code === 200) return body as unknown as AxiosResponse
      if (body.code === 401) {
        removeToken()
        message.error('登录已过期，请重新登录')
        // 当前已在登录页则不再跳转，避免循环
        if (!location.pathname.startsWith('/login')) {
          location.href = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
        }
        return Promise.reject(new Error(body.msg || '未认证'))
      }
      if (body.code === 403) {
        message.error(body.msg || '没有操作权限')
        return Promise.reject(new Error(body.msg || '无权限'))
      }
      message.error(body.msg || '请求失败')
      return Promise.reject(new Error(body.msg || '请求失败'))
    }
    return body as unknown as AxiosResponse
  },
  (error) => {
    message.error(error.message || '网络异常')
    return Promise.reject(error)
  },
)

if (useMock) {
  // axios 自定义 adapter；import.meta.env 静态替换保证生产构建不含 mock
  service.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const { mockAdapter } = await import('@/mock/routes')
    return mockAdapter(config)
  }
}

export default service
