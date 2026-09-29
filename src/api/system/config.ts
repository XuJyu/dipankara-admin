/** 系统参数接口（M4 对接） */
import request from '@/api/request'
import type { R, TableDataInfo } from '@/types/api'
import type { SysConfig } from '@/types/system'

export const listConfig = (query: Record<string, unknown>) =>
  request.get<never, TableDataInfo<SysConfig>>('/system/config/list', { params: query })

export const getConfig = (configId: number) =>
  request.get<never, R<SysConfig>>(`/system/config/${configId}`)

export const configByKey = (configKey: string) =>
  request.get<never, R<string>>(`/system/config/configKey/${configKey}`)

export const addConfig = (data: Partial<SysConfig>) =>
  request.post<never, R<null>>('/system/config', data)

export const updateConfig = (data: Partial<SysConfig>) =>
  request.put<never, R<null>>('/system/config', data)

export const delConfig = (configIds: number | number[]) =>
  request.delete<never, R<null>>(`/system/config/${configIds}`)
