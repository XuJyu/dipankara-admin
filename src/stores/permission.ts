/** 动态路由 store：/getRouters 的 RouterVO → 路由记录（component 字符串解析对齐 RuoYi-Vue3） */
import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { getRouters } from '@/api/auth'
import { pick } from '@/types/api'
import type { RouterVO } from '@/types/system'

export const viewsModules = import.meta.glob('@/views/**/*.vue')

/** RuoYi 约定：路由记录额外携带 hidden（侧边栏渲染用） */
export type AppRouteRecordRaw = RouteRecordRaw & {
  hidden?: boolean
  children?: AppRouteRecordRaw[]
}

const LAYOUT = () => import('@/layout/index.vue')
const PARENT_VIEW = () => import('@/components/ParentView.vue')

/** component 字符串 → 异步组件；'Layout'/'ParentView' 为保留字（RuoYi 约定） */
function resolveComponent(component: string): RouteRecordRaw['component'] {
  if (component === 'Layout') return LAYOUT
  if (component === 'ParentView') return PARENT_VIEW
  // 'system/user/index' → '/src/views/system/user/index.vue'
  const key = `/src/views/${component.replace(/^\//, '')}.vue`
  const loader = viewsModules[key]
  if (!loader) {
    // 未找到对应视图：回退 404 页，避免整树构建失败（菜单 component 与视图路径对齐是后端种子数据契约）
    return () => import('@/views/error/404.vue')
  }
  return loader as RouteRecordRaw['component']
}

function toName(component: string, fallback: string): string {
  const seg = component.split('/').filter(Boolean).pop() ?? fallback
  return seg.charAt(0).toUpperCase() + seg.slice(1)
}

function convert(router: RouterVO): AppRouteRecordRaw {
  // as 断言：vue-router 的 RouteRecordRaw 联合类型（含 Redirect 变体）无法表达「redirect 可选」
  const route = {
    path: router.path,
    name: router.name || toName(router.component, router.path),
    hidden: router.hidden ?? false,
    component: resolveComponent(router.component),
    meta: { title: router.meta?.title, icon: router.meta?.icon, noCache: router.meta?.noCache, link: router.meta?.link },
  } as AppRouteRecordRaw
  if (router.redirect) route.redirect = router.redirect
  if (router.children?.length) {
    route.children = router.children.map(convert)
  }
  return route
}

interface PermissionState {
  dynamicRoutes: AppRouteRecordRaw[]
  loaded: boolean
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    dynamicRoutes: [],
    loaded: false,
  }),
  actions: {
    async buildRoutes(): Promise<AppRouteRecordRaw[]> {
      const res = await getRouters()
      const routers = pick<RouterVO[]>(res as never, 'data') ?? (res as unknown as RouterVO[])
      this.dynamicRoutes = routers.map(convert)
      this.loaded = true
      return this.dynamicRoutes
    },
    reset(): void {
      this.dynamicRoutes = []
      this.loaded = false
    },
  },
})
