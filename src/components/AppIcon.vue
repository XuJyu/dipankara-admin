<script setup lang="ts">
/** 内联 SVG 图标：覆盖 RuoYi 种子菜单常用图标名 + 界面操作图标；未命中回退圆点 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{ name?: string; size?: number }>(), {
  name: '',
  size: 16,
})

const ICONS: Record<string, string> = {
  dashboard: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  system: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/><circle cx="15" cy="6.5" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="17" cy="17.5" r="2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  peoples: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1.2-3.2 3.7-5 6.5-5s5.3 1.8 6.5 5"/><path d="M16 5.2a3.5 3.5 0 0 1 0 5.6"/><path d="M17.8 15.6c1.7.8 3 2.3 3.7 4.4"/>',
  tree: '<rect x="9" y="2.5" width="6" height="5" rx="1"/><rect x="2.5" y="16.5" width="6" height="5" rx="1"/><rect x="15.5" y="16.5" width="6" height="5" rx="1"/><path d="M12 7.5V14M5.5 14h13M5.5 14v2.5M18.5 14v2.5"/>',
  'tree-table': '<rect x="3" y="4" width="6" height="5" rx="1"/><rect x="13" y="4" width="8" height="5" rx="1"/><rect x="13" y="15" width="8" height="5" rx="1"/><path d="M9 6.5h4M9 6.5v8h4"/>',
  dict: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>',
  edit: '<path d="M4 20l1-4L16.5 4.5a2.12 2.12 0 0 1 3 3L8 19l-4 1z"/><path d="M14.5 6.5l3 3"/>',
  monitor: '<path d="M3 12h4l2.5-6 4 12 2.5-6h5"/>',
  form: '<path d="M6 2.5h8l4 4V21a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 21z"/><path d="M14 2.5V7h4"/><path d="M9 12h6M9 16h6"/>',
  logininfor: '<path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/><path d="M17 8l4 4-4 4"/><path d="M21 12H10"/>',
  server: '<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  build: '<path d="M8 6L2 12l6 6M16 6l6 6-6 6"/>',
  example: '<path d="M12 2.7l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.5l6.5-.9z"/>',
  documentation: '<path d="M12 6.5C10 4.5 7 4 3.5 4.5v14c3.5-.5 6.5 0 8.5 2 2-2 5-2.5 8.5-2v-14C17 4 14 4.5 12 6.5z"/><path d="M12 6.5V21"/>',
  guide: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7"/><path d="M6.5 7l.8 13a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-13"/><path d="M10 11v6M14 11v6"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  'chevron-right': '<path d="M9 6l6 6-6 6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  captcha: '<path d="M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z"/><path d="M8.5 12l2.5 2.5 4.5-4.5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  'panel-left': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  'empty-box': '<path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8L12 12.5 20.5 8M12 12.5v8"/>',
  seed: '<path d="M12 21c-5 0-8-3.5-8-8 6-1 9.5 1.5 8 8z"/><path d="M12 21c5 0 8-3.5 8-8-6-1-9.5 1.5-8 8z"/><path d="M12 21V9"/><path d="M12 9c0-3 2-5.5 5-6.5C16.5 5.5 15 8 12 9z"/>',
}

const markup = computed(() => {
  const key = props.name?.replace(/^#/, '') || ''
  return ICONS[key] ?? '<circle cx="12" cy="12" r="3.5"/>'
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="markup"
  />
</template>
