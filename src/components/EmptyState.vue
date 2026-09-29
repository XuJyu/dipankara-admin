<script setup lang="ts">
withDefaults(defineProps<{ text?: string }>(), { text: '暂无数据' })
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 py-14 text-muted">
    <AppIcon name="empty-box" :size="34" class="opacity-60" />
    <span class="text-sm">{{ text }}</span>
  </div>
</template>
