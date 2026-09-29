<script setup lang="ts">
/** 分页条（Notion 风格：文字信息 + 上下页 + 页大小） */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    total: number
    page: number
    pageSize: number
    pageSizes?: number[]
  }>(),
  { pageSizes: () => [10, 20, 50] },
)

const emit = defineEmits<{ 'update:page': [v: number]; 'update:pageSize': [v: number] }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

function go(p: number): void {
  const target = Math.min(Math.max(1, p), totalPages.value)
  if (target !== props.page) emit('update:page', target)
}

function changeSize(e: Event): void {
  const size = Number((e.target as HTMLSelectElement).value)
  emit('update:pageSize', size)
  emit('update:page', 1)
}
</script>

<template>
  <div class="flex items-center justify-between gap-3 pt-4 mt-1 text-[13px] text-muted">
    <span>共 {{ total }} 条</span>
    <div class="flex items-center gap-1.5">
      <button class="n-btn n-btn-sm !px-2 !text-muted" :disabled="page <= 1" aria-label="上一页" @click="go(page - 1)">‹ 上一页</button>
      <span class="n-mono !text-ink/60 px-1">{{ page }} / {{ totalPages }}</span>
      <button class="n-btn n-btn-sm !px-2 !text-muted" :disabled="page >= totalPages" aria-label="下一页" @click="go(page + 1)">下一页 ›</button>
      <select class="n-select !w-auto !py-1 !px-1.5 !text-[12px] !text-muted !border-transparent hover:!border-line ml-1" :value="pageSize" @change="changeSize">
        <option v-for="s in pageSizes" :key="s" :value="s">{{ s }} 条/页</option>
      </select>
    </div>
  </div>
</template>
