/** 用户管理接口（RuoYi 路径约定） */
import request from '@/api/request'
import type { R, TableDataInfo } from '@/types/api'
import type { SysUser, TreeSelect } from '@/types/system'

export const listUser = (query: Record<string, unknown>) =>
  request.get<never, TableDataInfo<SysUser>>('/system/user/list', { params: query })

export const getUser = (userId?: number | string) =>
  request.get<never, R<{ user: SysUser; roles: unknown[]; posts?: unknown[] }>>(
    `/system/user/${userId ?? ''}`,
  )

/** 新增时后端返回：{roles, posts}；编辑返回：{data:{user,roles,posts}}，双兼容在调用侧用 pick */
export const addUser = (data: Partial<SysUser>) =>
  request.post<never, R<null>>('/system/user', data)

export const updateUser = (data: Partial<SysUser>) =>
  request.put<never, R<null>>('/system/user', data)

export const delUser = (userIds: number | number[]) =>
  request.delete<never, R<null>>(`/system/user/${userIds}`)

export const changeUserStatus = (userId: number, status: string) =>
  request.put<never, R<null>>('/system/user/changeStatus', { userId, status })

export const resetUserPwd = (userId: number, password: string) =>
  request.put<never, R<null>>('/system/user/resetPwd', { userId, password })

export const userDeptTree = () =>
  request.get<never, R<TreeSelect[]>>('/system/user/deptTree')
