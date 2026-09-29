/** 日志接口（操作日志/登录日志，M3 对接） */
import request from '@/api/request'
import type { R, TableDataInfo } from '@/types/api'
import type { LoginLog, OperLog } from '@/types/system'

export const listOperLog = (query: Record<string, unknown>) =>
  request.get<never, TableDataInfo<OperLog>>('/monitor/operlog/list', { params: query })

export const delOperLog = (operIds: number | number[]) =>
  request.delete<never, R<null>>(`/monitor/operlog/${operIds}`)

export const cleanOperLog = () =>
  request.delete<never, R<null>>('/monitor/operlog/clean')

export const listLoginLog = (query: Record<string, unknown>) =>
  request.get<never, TableDataInfo<LoginLog>>('/monitor/logininfor/list', { params: query })

export const delLoginLog = (infoIds: number | number[]) =>
  request.delete<never, R<null>>(`/monitor/logininfor/${infoIds}`)

export const cleanLoginLog = () =>
  request.delete<never, R<null>>('/monitor/logininfor/clean')
