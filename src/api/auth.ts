/** 认证与用户会话接口（六接口集中的四个 + 验证码），路径对齐 RuoYi-Vue3 */
import request from '@/api/request'
import type { R } from '@/types/api'
import type { LoginUser, RouterVO } from '@/types/system'

export interface LoginBody {
  username: string
  password: string
  code?: string
  uuid?: string
}

export interface CaptchaResult {
  captchaEnabled: boolean
  uuid?: string
  img?: string
}

export const login = (data: LoginBody) =>
  request.post<never, R<{ token: string }>>('/login', data)

export const logout = () => request.post<never, R<null>>('/logout')

export const getInfo = () =>
  request.get<never, R<{ user: LoginUser; roles: string[]; permissions: string[] }>>('/getInfo')

export const getRouters = () =>
  request.get<never, R<RouterVO[]>>('/getRouters')

export const getCaptchaImage = () =>
  request.get<never, R<CaptchaResult>>('/captchaImage')
