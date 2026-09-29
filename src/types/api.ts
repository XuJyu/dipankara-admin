/** 后端统一响应契约 common/result/R.java：字段钉死 code/msg/data，成功码 200 */
export interface R<T = unknown> {
  code: number
  msg: string
  data: T
}

/** 分页响应契约 common/result/TableDataInfo.java：字段钉死 code/msg/rows/total */
export interface TableDataInfo<T = unknown> {
  code: number
  msg: string
  rows: T[]
  total: number
}

/** 分页入参（query）：pageNum/pageSize，对齐 RuoYi 约定 */
export interface PageQuery {
  pageNum?: number
  pageSize?: number
  [key: string]: unknown
}

/** RuoYi-Vue3 兼容读取：getInfo/login 响应字段可能在顶层（RuoYi 原样）或 data 内（R 包裹） */
export function pick<T>(payload: R<unknown> & Record<string, unknown>, key: string): T | undefined {
  const top = payload[key] as T | undefined
  if (top !== undefined) return top
  const data = payload.data as Record<string, unknown> | null | undefined
  return (data && (data[key] as T | undefined)) ?? undefined
}
