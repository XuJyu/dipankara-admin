<script setup lang="ts">
/** 通用对话框（Teleport + 遮罩，Notion 风格白卡、shadow-pop、150ms 渐隐） */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    width?: number
    closeOnClickOverlay?: boolean
  }>(),
  { title: '', width: 520, closeOnClickOverlay: true },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

function close(): void {
  visible.value = false
}

function onOverlay(): void {
  if (props.closeOnClickOverlay) close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="n-dialog">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-start justify-center px-4 py-[8vh] overflow-y-auto"
        style="background: rgba(15, 15, 15, 0.55)"
        @click.self="onOverlay"
      >
        <div
          class="bg-paper rounded-lg w-full shadow-[var(--shadow-pop)]"
          :style="{ maxWidth: `${width}px` }"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-line">
            <h3 class="text-[15px] font-semibold text-ink">{{ title }}</h3>
            <button class="n-btn !p-1.5 -mr-1.5" aria-label="关闭" @click="close">
              <AppIcon name="x" :size="16" />
            </button>
          </div>
          <div class="px-5 py-4">
            <slot />
          </div>
          <div v-if="$slots.footer" class="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-canvas/50 rounded-b-lg">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.n-dialog-enter-active,
.n-dialog-leave-active {
  transition: opacity 150ms ease;
}
.n-dialog-enter-from,
.n-dialog-leave-to {
  opacity: 0;
}
</style>
