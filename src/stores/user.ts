/** 用户会话 store：登录链路（验证码 → login → getInfo），token 持久化 */
import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, getInfo as getInfoApi } from '@/api/auth'
import type { LoginBody } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { pick } from '@/types/api'
import type { LoginUser } from '@/types/system'

interface UserState {
  token: string
  userInfo: LoginUser | null
  roles: string[]
  permissions: string[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken() ?? '',
    userInfo: null,
    roles: [],
    permissions: [],
  }),
  getters: {
    nickName: (s) => s.userInfo?.nickName ?? s.userInfo?.userName ?? '',
    isAdmin: (s) => s.permissions.includes('*:*:*'),
  },
  actions: {
    async login(payload: LoginBody): Promise<void> {
      const res = await loginApi(payload)
      // 双兼容：token 在 data 内（R 包裹）或顶层（RuoYi 原样）
      const token = pick<string>(res as never, 'token') ?? ''
      if (!token) throw new Error('登录响应缺少 token')
      this.token = token
      setToken(token)
    },
    async loadUserInfo(): Promise<void> {
      const res = await getInfoApi()
      const user = pick<LoginUser>(res as never, 'user')
      const roles = pick<string[]>(res as never, 'roles') ?? []
      const permissions = pick<string[]>(res as never, 'permissions') ?? []
      this.userInfo = user ?? null
      this.roles = roles
      this.permissions = permissions
    },
    async logout(): Promise<void> {
      try {
        await logoutApi()
      } finally {
        this.resetToken()
      }
    },
    resetToken(): void {
      this.token = ''
      this.userInfo = null
      this.roles = []
      this.permissions = []
      removeToken()
      // 硬刷新回登录页：清掉 pinia（含 permission store 的动态路由）与 router 上
      // 已注册的旧账号路由——SPA 内跳转会让 loaded 仍为 true，换账号登录后
      // 守卫不重建路由，上一账号的菜单/路由残留（RuoYi-Vue3 同款硬跳转方案）
      window.location.href = '/login'
    },
  },
})
