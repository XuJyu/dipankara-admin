<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
</script>

<template>
  <div class="min-h-[70vh] flex flex-col items-center justify-center gap-3">
    <AppIcon name="lock" :size="40" class="text-muted" />
    <h1 class="text-xl font-semibold text-ink mt-2">没有操作权限</h1>
    <p class="text-sm text-muted">你的账号权限不包含该页面（HTTP 200 · code=403）</p>
    <router-link to="/index" class="n-btn n-btn-primary mt-2">返回工作台</router-link>
  </div>
</template>
