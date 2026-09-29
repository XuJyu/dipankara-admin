/** 路由：静态路由（登录/错误页）+ 全局守卫（token 校验、动态路由注入） */
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

export const staticRoutes: RouteRecordRaw[] = [
  { path: '/login', name: 'Login', component: () => import('@/views/login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/layout/index.vue'),
    redirect: '/index',
    children: [
      { path: 'index', name: 'Index', component: () => import('@/views/index.vue'), meta: { title: '工作台', icon: 'dashboard' } },
      // 隐藏路由：字典数据页（从字典类型页跳入，对齐 RuoYi system/dict/data 视图路径）
      { path: 'system/dict/data', name: 'DictData', component: () => import('@/views/system/dict/data.vue'), meta: { title: '字典数据' } },
    ],
  },
  { path: '/403', name: 'Forbidden', component: () => import('@/views/error/403.vue'), meta: { title: '无权限' } },
]

/** 404 兜底路由：必须在动态路由注入之后再注册，否则冷启动直达深层 URL 会先被兜底路由吞掉 */
const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/views/error/404.vue'),
  meta: { title: '页面不存在' },
}

const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes,
})

const WHITELIST = ['/login', '/403']

router.beforeEach(async (to) => {
  document.title = to.meta?.title ? `${to.meta.title} · Dipankara Platform` : 'Dipankara Platform'
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (to.path === '/login') {
    return userStore.token ? { path: '/' } : true
  }
  if (WHITELIST.includes(to.path)) return true
  if (!userStore.token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (permissionStore.loaded) return true

  try {
    await userStore.loadUserInfo()
    const routes = await permissionStore.buildRoutes()
    routes.forEach((r) => router.addRoute(r))
    // 动态路由注入完成后才挂 404 兜底（见 notFoundRoute 注释）
    router.addRoute(notFoundRoute)
    // 重新进入目标路由，让新增动态路由生效（query/hash 需显式携带，path 解析会丢弃内嵌查询串）
    return { path: to.path, query: to.query, hash: to.hash, replace: true }
  } catch {
    userStore.resetToken()
    permissionStore.reset()
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

export default router
