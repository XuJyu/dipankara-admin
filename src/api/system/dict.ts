/** 字典接口（M4 对接；/system/dict/data/type/{type} 为 RuoYi 契约路径，后端计划已锚定） */
import request from '@/api/request'
import type { R, TableDataInfo } from '@/types/api'
import type { SysDictData, SysDictType } from '@/types/system'

export const listDictType = (query: Record<string, unknown>) =>
  request.get<never, TableDataInfo<SysDictType>>('/system/dict/type/list', { params: query })

export const getDictType = (dictId: number) =>
  request.get<never, R<SysDictType>>(`/system/dict/type/${dictId}`)

export const addDictType = (data: Partial<SysDictType>) =>
  request.post<never, R<null>>('/system/dict/type', data)

export const updateDictType = (data: Partial<SysDictType>) =>
  request.put<never, R<null>>('/system/dict/type', data)

export const delDictType = (dictIds: number | number[]) =>
  request.delete<never, R<null>>(`/system/dict/type/${dictIds}`)

export const listDictData = (query: Record<string, unknown>) =>
  request.get<never, TableDataInfo<SysDictData>>('/system/dict/data/list', { params: query })

export const getDictData = (dictCode: number) =>
  request.get<never, R<SysDictData>>(`/system/dict/data/${dictCode}`)

export const addDictData = (data: Partial<SysDictData>) =>
  request.post<never, R<null>>('/system/dict/data', data)

export const updateDictData = (data: Partial<SysDictData>) =>
  request.put<never, R<null>>('/system/dict/data', data)

export const delDictData = (dictCodes: number | number[]) =>
  request.delete<never, R<null>>(`/system/dict/data/${dictCodes}`)

/** 按类型取字典数据（RuoYi 契约） */
export const dictDataByType = (dictType: string) =>
  request.get<never, R<SysDictData[]>>(`/system/dict/data/type/${dictType}`)
