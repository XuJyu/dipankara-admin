/** 部门管理接口（树表，不分页） */
import request from '@/api/request'
import type { R } from '@/types/api'
import type { SysDept } from '@/types/system'

export const listDept = (query?: Record<string, unknown>) =>
  request.get<never, R<SysDept[]>>('/system/dept/list', { params: query })

export const listDeptExclude = (deptId: number) =>
  request.get<never, R<SysDept[]>>(`/system/dept/list/exclude/${deptId}`)

export const getDept = (deptId: number) =>
  request.get<never, R<SysDept>>(`/system/dept/${deptId}`)

export const addDept = (data: Partial<SysDept>) =>
  request.post<never, R<null>>('/system/dept', data)

export const updateDept = (data: Partial<SysDept>) =>
  request.put<never, R<null>>('/system/dept', data)

export const delDept = (deptId: number) =>
  request.delete<never, R<null>>(`/system/dept/${deptId}`)
