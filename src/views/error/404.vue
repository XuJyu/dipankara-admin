<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
</script>

<template>
  <div class="min-h-[70vh] flex flex-col items-center justify-center gap-3">
    <AppIcon name="empty-box" :size="40" class="text-muted" />
    <h1 class="text-xl font-semibold text-ink mt-2">页面不存在</h1>
    <p class="text-sm text-muted">访问的地址没有对应路由，或菜单 component 路径与视图不一致</p>
    <router-link to="/index" class="n-btn n-btn-primary mt-2">返回工作台</router-link>
  </div>
</template>
