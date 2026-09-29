<script setup lang="ts">
/** 服务监控：入口链接 + 运行说明（后端 M6 收口后对接 Druid/Actuator 实况） */
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const apiBase = import.meta.env.VITE_API_BASE || '/api'

const links = computed(() => [
  { name: 'Druid 连接池监控', url: `${apiBase}/druid/index.html`, desc: 'SQL 统计、慢查询、连接池状态（账号走后端配置）', ready: !useMock },
  { name: 'Actuator 健康检查', url: `${apiBase}/actuator/health`, desc: 'health / info 端点（application.yml 已暴露）', ready: !useMock },
  { name: '接口文档 Swagger', url: `${apiBase}/swagger-ui.html`, desc: 'system / tool / member 三分组（springdoc）', ready: !useMock },
])

const runtime = [
  { label: '前端模式', value: useMock ? 'mock（内置数据）' : '真实接口' },
  { label: '代理目标', value: import.meta.env.VITE_PROXY_TARGET ?? '未配置（生产直连 /api）' },
  { label: '契约', value: 'R{code,msg,data} · 分页{rows,total} · Bearer token' },
]
</script>

<template>
  <div class="n-page max-w-4xl mx-auto">
    <h1 class="n-page-title mb-4">服务监控</h1>

    <div class="grid md:grid-cols-3 gap-3 mb-4">
      <div v-for="item in runtime" :key="item.label" class="n-card p-4">
        <div class="text-[13px] text-muted">{{ item.label }}</div>
        <div class="text-sm text-ink mt-1 font-medium break-all">{{ item.value }}</div>
      </div>
    </div>

    <div class="n-card p-4 md:p-5">
      <h2 class="text-[15px] font-semibold text-ink mb-1">后端监控入口</h2>
      <p v-if="useMock" class="text-[13px] text-muted mb-4">
        以下入口由后端提供。mock 模式下不可用；后端启动且 <span class="n-mono">VITE_USE_MOCK=false</span> 后点击直达（dev 由 vite 代理转发）。
      </p>
      <p v-else class="text-[13px] text-muted mb-4">以下入口由后端提供，点击直达（dev 由 vite 代理转发）。</p>
      <div class="flex flex-col gap-2">
        <a
          v-for="link in links"
          :key="link.name"
          :href="link.ready ? link.url : undefined"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-3 px-3 py-2.5 rounded-md border border-line hover:bg-hover"
          :class="{ 'opacity-60 pointer-events-none': !link.ready }"
        >
          <span class="w-8 h-8 rounded-md bg-canvas flex items-center justify-center text-ink/70 shrink-0">
            <AppIcon name="server" :size="16" />
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-sm font-medium text-ink">{{ link.name }}</span>
            <span class="block text-[13px] text-muted truncate">{{ link.desc }}</span>
          </span>
          <span class="n-tag" :class="link.ready ? 'n-tag-green' : 'n-tag-gray'">{{ link.ready ? '可访问' : '待对接' }}</span>
          <AppIcon name="link" :size="14" class="text-muted shrink-0" />
        </a>
      </div>
    </div>
  </div>
</template>
