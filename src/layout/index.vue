<script setup lang="ts">
/** 主布局：米色侧栏 + 白色顶栏 + 内容区（Notion 三层结构） */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import AppIcon from '@/components/AppIcon.vue'
import SideMenu from '@/components/SideMenu.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { message } from '@/utils/message'

const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()

const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent): void {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    userMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

async function handleLogout(): Promise<void> {
  userMenuOpen.value = false
  await userStore.logout()
  message.success('已退出登录')
  router.push('/login')
}

const displayName = () => userStore.nickName || userStore.userInfo?.userName || '用户'
const initial = () => displayName().charAt(0).toUpperCase()

/** mock 模式标记：侧栏角标仅 mock 模式标注演示 */
const useMock = import.meta.env.VITE_USE_MOCK === 'true'
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 侧栏 -->
    <aside
      class="flex flex-col bg-canvas border-r border-line shrink-0"
      :class="appStore.sidebarCollapsed ? 'w-14' : 'w-56'"
    >
      <div class="flex items-center gap-2 h-12 px-3.5 border-b border-line shrink-0">
        <AppIcon name="seed" :size="18" class="text-ink shrink-0" />
        <span v-if="!appStore.sidebarCollapsed" class="text-[14px] font-semibold text-ink truncate">
          Dipankara Platform
        </span>
      </div>
      <SideMenu />
      <div class="px-3 py-2 border-t border-line text-[11px] text-muted shrink-0 n-mono">
        <span v-if="!appStore.sidebarCollapsed">{{ useMock ? 'v0.1 · mock 演示' : 'v0.1' }}</span>
        <span v-else>·</span>
      </div>
    </aside>

    <!-- 右侧 -->
    <div class="flex flex-col flex-1 min-w-0">
      <!-- 顶栏 -->
      <header class="flex items-center gap-3 h-12 px-4 bg-paper border-b border-line shrink-0">
        <button class="n-btn !p-1.5" :aria-label="appStore.sidebarCollapsed ? '展开侧栏' : '折叠侧栏'" @click="appStore.toggleSidebar()">
          <AppIcon name="panel-left" :size="16" />
        </button>
        <Breadcrumb />
        <div class="ml-auto relative" ref="userMenuRef">
          <button
            class="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-hover text-sm text-ink"
            @click="userMenuOpen = !userMenuOpen"
          >
            <span class="w-6 h-6 rounded-full bg-ink text-paper text-[12px] font-medium flex items-center justify-center select-none">
              {{ initial() }}
            </span>
            <span class="hidden md:inline">{{ displayName() }}</span>
            <AppIcon name="chevron-down" :size="13" class="opacity-60" />
          </button>
          <Transition name="n-drop">
            <div
              v-if="userMenuOpen"
              class="absolute right-0 top-[calc(100%+4px)] w-44 bg-paper rounded-md shadow-[var(--shadow-pop)] py-1 z-40"
            >
              <div class="px-3 py-2 border-b border-line">
                <div class="text-sm font-medium text-ink truncate">{{ displayName() }}</div>
                <div class="text-[12px] text-muted mt-0.5">
                  {{ userStore.roles.map((r) => (r === 'admin' ? '超级管理员' : r)).join(' · ') || '未获取角色' }}
                </div>
              </div>
              <button class="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink/85 hover:bg-hover" @click="userMenuOpen = false; router.push('/index')">
                <AppIcon name="dashboard" :size="15" /> 返回工作台
              </button>
              <button class="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-soft" @click="handleLogout">
                <AppIcon name="logout" :size="15" /> 退出登录
              </button>
            </div>
          </Transition>
        </div>
      </header>

      <!-- 内容 -->
      <main class="flex-1 overflow-y-auto n-scroll bg-canvas">
        <router-view v-slot="{ Component }">
          <Transition name="n-fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.n-fade-enter-active,
.n-fade-leave-active {
  transition: opacity 150ms ease;
}
.n-fade-enter-from,
.n-fade-leave-to {
  opacity: 0;
}
.n-drop-enter-active,
.n-drop-leave-active {
  transition: opacity 150ms ease;
}
.n-drop-enter-from,
.n-drop-leave-to {
  opacity: 0;
}
</style>
