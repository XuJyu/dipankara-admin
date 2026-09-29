/** 示例文章接口（后端 M7 demo 模块；路径以后端落地为准，暂按 RuoYi 风格约定） */
import request from '@/api/request'
import type { R, TableDataInfo } from '@/types/api'
import type { DemoArticle } from '@/types/demo'

export const listArticle = (query: Record<string, unknown>) =>
  request.get<never, TableDataInfo<DemoArticle>>('/demo/article/list', { params: query })

export const getArticle = (articleId: number) =>
  request.get<never, R<DemoArticle>>(`/demo/article/${articleId}`)

export const addArticle = (data: Partial<DemoArticle>) =>
  request.post<never, R<null>>('/demo/article', data)

export const updateArticle = (data: Partial<DemoArticle>) =>
  request.put<never, R<null>>('/demo/article', data)

export const delArticle = (articleIds: number | number[]) =>
  request.delete<never, R<null>>(`/demo/article/${articleIds}`)
