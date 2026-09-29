/** 示例业务模块（后端 M7 demo/DemoArticle，接单参照抄改的第一个模块） */
export interface DemoArticle {
  articleId: number
  title: string
  summary?: string
  content?: string
  author?: string
  status: string
  publishTime?: string
  createTime?: string
  [key: string]: unknown
}
