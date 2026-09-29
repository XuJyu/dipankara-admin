/** 角色管理接口（RuoYi 路径约定；数据权限不做） */
import request from '@/api/request'
import type { R, TableDataInfo } from '@/types/api'
import type { SysRole, TreeSelect } from '@/types/system'

export const listRole = (query: Record<string, unknown>) =>
  request.get<never, TableDataInfo<SysRole>>('/system/role/list', { params: query })

export const getRole = (roleId: number) =>
  request.get<never, R<SysRole>>(`/system/role/${roleId}`)

export const addRole = (data: Partial<SysRole>) =>
  request.post<never, R<null>>('/system/role', data)

export const updateRole = (data: Partial<SysRole>) =>
  request.put<never, R<null>>('/system/role', data)

export const delRole = (roleIds: number | number[]) =>
  request.delete<never, R<null>>(`/system/role/${roleIds}`)

export const changeRoleStatus = (roleId: number, status: string) =>
  request.put<never, R<null>>('/system/role/changeStatus', { roleId, status })

export const menuTreeselect = () =>
  request.get<never, R<TreeSelect[]>>('/system/menu/treeselect')

export const roleMenuTreeselect = (roleId: number) =>
  request.get<never, R<{ menus: TreeSelect[]; checkedKeys: number[] }>>(
    `/system/menu/roleMenuTreeselect/${roleId}`,
  )
