<script setup lang="ts">
/** 工作台：问候 + 统计 + 后端对接进度 + 最近登录 */
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { listUser } from '@/api/system/user'
import { listRole } from '@/api/system/role'
import { listArticle } from '@/api/demo/article'
import { listLoginLog } from '@/api/system/log'
import type { LoginLog } from '@/types/system'
import { useDict } from '@/composables/useDict'
import DictTag from '@/components/DictTag.vue'
import AppIcon from '@/components/AppIcon.vue'

const userStore = useUserStore()

/** mock 模式标记：仅 mock 模式渲染对接进度等开发期内容 */
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

/** 权限判定：admin 通配或显式持有；无权限的统计卡/最近登录直接隐藏（受限账号不触发 403 噪音） */
function hasPerm(perm: string): boolean {
  const p = userStore.permissions
  return p.includes('*:*:*') || p.includes(perm)
}

const stats = ref([
  { label: '用户总数', value: '—', icon: 'user', path: '/system/user', perm: 'system:user:list' },
  { label: '角色总数', value: '—', icon: 'peoples', path: '/system/role', perm: 'system:role:list' },
  { label: '示例文章', value: '—', icon: 'documentation', path: '/demo/article', perm: 'demo:article:list' },
  { label: '登录记录', value: '—', icon: 'logininfor', path: '/log/logininfor', perm: 'monitor:logininfor:list' },
])
const visibleStats = computed(() => stats.value.filter((s) => hasPerm(s.perm)))

const recentLogins = ref<LoginLog[]>([])
const { labelOf: loginStatusLabel } = useDict('sys_normal_disable')

/** 后端里程碑→前端对接进度（与共识计划 M0-M11 对应，人工维护） */
const milestones = [
  { name: 'M0 模板骨架', status: 'done' },
  { name: 'M1 工程基建', status: 'done' },
  { name: 'M2 框架集成', status: 'doing' },
  { name: 'M3 RBAC+登录 ★', status: 'todo' },
  { name: 'M4 字典+参数', status: 'todo' },
  { name: 'M5 文件+Excel', status: 'todo' },
  { name: 'M6 定时+监控', status: 'todo' },
  { name: 'M7 C端+示例', status: 'todo' },
  { name: 'M8 单测收口', status: 'todo' },
  { name: 'M10 Docker+CI', status: 'todo' },
  { name: 'M11 验收', status: 'todo' },
] as const

const STATUS_META: Record<string, { cls: string; text: string }> = {
  done: { cls: 'n-tag-green', text: '已落地' },
  doing: { cls: 'n-tag-blue', text: '开发中' },
  todo: { cls: 'n-tag-gray', text: '待开发' },
}

onMounted(async () => {
  // 逐项按权限请求并独立容错：无权限/失败显示 —，不拖垮其余卡片
  const jobs: Array<Promise<void>> = []
  if (hasPerm('system:user:list')) {
    jobs.push(listUser({ pageNum: 1, pageSize: 1 }).then((r) => { stats.value[0].value = String(r.total) }).catch(() => {}))
  }
  if (hasPerm('system:role:list')) {
    jobs.push(listRole({ pageNum: 1, pageSize: 1 }).then((r) => { stats.value[1].value = String(r.total) }).catch(() => {}))
  }
  if (hasPerm('demo:article:list')) {
    jobs.push(listArticle({ pageNum: 1, pageSize: 1 }).then((r) => { stats.value[2].value = String(r.total) }).catch(() => {}))
  }
  if (hasPerm('monitor:logininfor:list')) {
    jobs.push(listLoginLog({ pageNum: 1, pageSize: 6 }).then((r) => {
      stats.value[3].value = String(r.total)
      recentLogins.value = r.rows
    }).catch(() => {}))
  }
  await Promise.all(jobs)
})
</script>

<template>
  <div class="n-page max-w-6xl mx-auto">
    <!-- 问候 -->
    <div class="mb-6">
      <h1 class="n-page-title">{{ greeting }}，{{ userStore.nickName }}</h1>
      <p v-if="useMock" class="text-sm text-muted mt-1">
        当前运行于 <span class="n-mono">mock</span> 数据模式 · 后端接口按里程碑逐步接入（见下方对接进度）
      </p>
    </div>

    <!-- 统计卡（按权限裁剪：受限账号只显示有权限的项） -->
    <div v-if="visibleStats.length" class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div
        v-for="s in visibleStats"
        :key="s.label"
        class="n-card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md"
        @click="$router.push(s.path)"
      >
        <span class="w-9 h-9 rounded-md bg-canvas flex items-center justify-center text-ink/70">
          <AppIcon :name="s.icon" :size="18" />
        </span>
        <div>
          <div class="text-xl font-semibold text-ink leading-6">{{ s.value }}</div>
          <div class="text-[13px] text-muted">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-4">
      <!-- 后端对接进度（开发期内容，仅 mock 模式展示） -->
      <div v-if="useMock" class="n-card p-5">
        <h2 class="text-[15px] font-semibold text-ink mb-3">后端里程碑对接进度</h2>
        <p class="text-[13px] text-muted mb-3">
          后端会话（cookiecutter-java-scaffold）每完成一个里程碑，对应模块在此前端把 mock 切换为真实接口。
        </p>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="ms in milestones" :key="ms.name" class="n-tag" :class="STATUS_META[ms.status].cls">
            {{ ms.name }} · {{ STATUS_META[ms.status].text }}
          </span>
        </div>
      </div>

      <!-- 最近登录（需登录日志查询权限） -->
      <div v-if="hasPerm('monitor:logininfor:list')" class="n-card p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-[15px] font-semibold text-ink">最近登录</h2>
          <router-link to="/log/logininfor" class="n-link text-[13px]">查看全部</router-link>
        </div>
        <table class="n-table" v-if="recentLogins.length">
          <thead>
            <tr><th>账号</th><th>IP</th><th>状态</th><th class="!text-right">时间</th></tr>
          </thead>
          <tbody>
            <tr v-for="log in recentLogins" :key="log.infoId">
              <td class="font-medium">{{ log.userName }}</td>
              <td class="n-mono">{{ log.ipaddr }}</td>
              <td>
                <DictTag v-if="log.status" dict-type="sys_normal_disable" :value="log.status === '0' ? '0' : '1'" />
                <span class="text-[12px] text-muted ml-1">{{ loginStatusLabel(log.status === '0' ? '0' : '1') === '正常' ? '成功' : '失败' }}</span>
              </td>
              <td class="!text-right text-ink/60 text-[13px]">{{ log.loginTime }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="text-sm text-muted py-6 text-center">暂无登录记录</div>
      </div>
    </div>
  </div>
</template>
