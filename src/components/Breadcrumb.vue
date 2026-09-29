<script setup lang="ts">
/** 面包屑：从 route.matched 取标题链 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const items = computed(() =>
  route.matched
    .filter((r) => r.meta?.title)
    .map((r) => ({ title: String(r.meta?.title), path: r.path })),
)
</script>

<template>
  <nav class="flex items-center gap-1.5 text-[13px] text-muted min-w-0" aria-label="面包屑">
    <template v-for="(item, i) in items" :key="item.path">
      <span v-if="i > 0" class="opacity-60">/</span>
      <span :class="i === items.length - 1 ? 'text-ink font-medium' : ''">{{ item.title }}</span>
    </template>
  </nav>
</template>
