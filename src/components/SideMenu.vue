<script setup lang="ts">
/** 侧边栏菜单：静态工作台 + permissionStore 动态路由，递归渲染；Notion 米色侧栏 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'
import type { AppRouteRecordRaw } from '@/stores/permission'
import AppIcon from '@/components/AppIcon.vue'

interface MenuNode {
  title: string
  icon?: string
  path: string
  hidden?: boolean
  children: MenuNode[]
}

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

const homeItem: MenuNode = {
  title: '工作台',
  icon: 'dashboard',
  path: '/index',
  children: [],
}

function toNode(r: AppRouteRecordRaw, parentPath: string): MenuNode {
  const fullPath = r.path.startsWith('/') ? r.path : `${parentPath}/${r.path}`.replace(/\/+/g, '/')
  return {
    title: String((r.meta?.title as string) ?? ''),
    icon: (r.meta?.icon as string) ?? undefined,
    path: fullPath,
    hidden: r.hidden,
    children: (r.children ?? []).filter((c) => !(c as AppRouteRecordRaw).hidden).map((c) => toNode(c as AppRouteRecordRaw, fullPath)),
  }
}

const menus = computed<MenuNode[]>(() => {
  const dynamic = permissionStore.dynamicRoutes
    .filter((r) => !r.hidden)
    .map((r) => toNode(r, ''))
    .filter((n) => n.title)
  return [homeItem, ...dynamic]
})

// 展开状态：默认展开当前激活项所在目录
const expanded = ref<Set<string>>(new Set())

function initExpanded(): void {
  const parent = menus.value.find((m) => m.children.some((c) => route.path.startsWith(c.path)))
  expanded.value = new Set(parent ? [parent.path] : [])
}

watch(
  () => permissionStore.loaded,
  () => initExpanded(),
  { immediate: true },
)

function toggleDir(path: string): void {
  const next = new Set(expanded.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  expanded.value = next
}

function isActive(node: MenuNode): boolean {
  if (node.children.length) return route.path.startsWith(node.path)
  return route.path === node.path
}

function collapsed(): boolean {
  return appStore.sidebarCollapsed
}
</script>

<template>
  <nav class="flex-1 overflow-y-auto n-scroll px-2 py-2" aria-label="主导航">
    <template v-for="node in menus" :key="node.path">
      <!-- 目录 -->
      <div v-if="node.children.length">
        <button
          class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-ink/75 hover:bg-hover"
          :class="{ 'bg-pressed/70 text-ink font-medium': expanded.has(node.path) }"
          @click="!collapsed() && toggleDir(node.path)"
        >
          <AppIcon :name="node.icon || 'chevron-right'" :size="16" class="shrink-0 opacity-80" />
          <span v-if="!collapsed()" class="truncate">{{ node.title }}</span>
          <span v-if="!collapsed()" class="ml-auto opacity-50">
            <AppIcon :name="expanded.has(node.path) ? 'chevron-down' : 'chevron-right'" :size="13" />
          </span>
        </button>
        <div v-if="expanded.has(node.path) && !collapsed()" class="ml-4 pl-2 border-l border-line mt-0.5 mb-1">
          <button
            v-for="child in node.children"
            :key="child.path"
            class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-ink/75 hover:bg-hover"
            :class="{ 'bg-pressed text-ink font-medium': isActive(child) }"
            @click="router.push(child.path)"
          >
            <AppIcon :name="child.icon || 'chevron-right'" :size="15" class="shrink-0 opacity-70" />
            <span class="truncate">{{ child.title }}</span>
          </button>
        </div>
      </div>
      <!-- 单项（工作台） -->
      <button
        v-else
        class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-ink/75 hover:bg-hover"
        :class="{ 'bg-pressed text-ink font-medium': isActive(node) }"
        @click="router.push(node.path)"
      >
        <AppIcon :name="node.icon || 'chevron-right'" :size="16" class="shrink-0 opacity-80" />
        <span v-if="!collapsed()" class="truncate">{{ node.title }}</span>
      </button>
    </template>
  </nav>
</template>
