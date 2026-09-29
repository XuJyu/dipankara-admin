/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** true = 使用内置 mock（开发默认），后端模块落地后切 false */
  readonly VITE_USE_MOCK: string
  /** axios baseURL，dev 下由 vite proxy 转发 */
  readonly VITE_API_BASE: string
  /** dev 代理目标（后端地址） */
  readonly VITE_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
