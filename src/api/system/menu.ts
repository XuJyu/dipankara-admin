/** 菜单管理接口（树表，不分页） */
import request from '@/api/request'
import type { R } from '@/types/api'
import type { SysMenu, TreeSelect } from '@/types/system'

export const listMenu = (query?: Record<string, unknown>) =>
  request.get<never, R<SysMenu[]>>('/system/menu/list', { params: query })

export const getMenu = (menuId: number) =>
  request.get<never, R<SysMenu>>(`/system/menu/${menuId}`)

export const addMenu = (data: Partial<SysMenu>) =>
  request.post<never, R<null>>('/system/menu', data)

export const updateMenu = (data: Partial<SysMenu>) =>
  request.put<never, R<null>>('/system/menu', data)

export const delMenu = (menuId: number) =>
  request.delete<never, R<null>>(`/system/menu/${menuId}`)

export const menuTreeselect = () =>
  request.get<never, R<TreeSelect[]>>('/system/menu/treeselect')
