<script setup lang="ts">
/** 开关（Notion 风格小滑块，仅状态色变化，无位移动效以外的装饰） */
const props = withDefaults(defineProps<{ modelValue: boolean; disabled?: boolean }>(), {
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [v: boolean]; change: [v: boolean] }>()

function toggle(): void {
  if (props.disabled) return
  const next = !props.modelValue
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    class="relative inline-flex items-center h-[18px] w-8 rounded-full border border-line shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="modelValue ? 'bg-ink' : 'bg-pressed'"
    @click="toggle"
  >
    <span
      class="absolute top-[2px] h-3 w-3 rounded-full bg-white shadow-sm"
      :style="{ left: modelValue ? '14px' : '2px' }"
      style="transition: left 150ms ease"
    />
  </button>
</template>
