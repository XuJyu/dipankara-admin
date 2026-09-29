<script setup lang="ts">
/** 递归勾选树：父节点勾选带动全部子孙；父节点状态由子孙推导（菜单权限分配用） */
import type { TreeSelect } from '@/types/system'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps<{ nodes: TreeSelect[]; modelValue: Set<number> }>()

const emit = defineEmits<{ 'update:modelValue': [v: Set<number>] }>()

function allIds(node: TreeSelect, acc: number[] = []): number[] {
  acc.push(node.id)
  node.children?.forEach((c) => allIds(c, acc))
  return acc
}

/** 勾选集合按节点推导三态：全选/半选/未选 */
function stateOf(node: TreeSelect): 'all' | 'half' | 'none' {
  const ids = allIds(node)
  const count = ids.filter((id) => props.modelValue.has(id)).length
  if (count === 0) return 'none'
  return count === ids.length ? 'all' : 'half'
}

function toggle(node: TreeSelect): void {
  const next = new Set(props.modelValue)
  const ids = allIds(node)
  // 半选也算"已选"：点击即整棵取消；仅全不选时才整棵勾选。
  // （编辑回显时父节点被后端 menuCheckStrictly 剥离，天然半选——若用 every() 判定，
  // 点半选节点会走"勾选"分支把父节点补进集合，保存后权限被放大为全量）
  const on = ids.some((id) => next.has(id))
  ids.forEach((id) => (on ? next.delete(id) : next.add(id)))
  emit('update:modelValue', next)
}

const expandIcon = () => 'chevron-right'
</script>

<template>
  <ul class="text-sm">
    <li v-for="node in nodes" :key="node.id">
      <div class="flex items-center gap-1.5 py-1">
        <button
          type="button"
          class="w-4 h-4 rounded border flex items-center justify-center shrink-0"
          :class="stateOf(node) === 'none' ? 'border-ink/30 bg-paper' : 'border-transparent'"
          :style="stateOf(node) !== 'none' ? { background: stateOf(node) === 'all' ? '#37352f' : 'rgba(55,53,47,.4)' } : {}"
          :aria-label="`勾选 ${node.label}`"
          @click="toggle(node)"
        >
          <svg v-if="stateOf(node) === 'all'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
          <span v-else-if="stateOf(node) === 'half'" class="w-1.5 h-1.5 rounded-sm bg-white" />
        </button>
        <span class="flex items-center gap-1 text-ink/85">
          <AppIcon v-if="node.children?.length" :name="expandIcon()" :size="13" class="opacity-40" />
          {{ node.label }}
        </span>
      </div>
      <!-- 子节点缩进 -->
      <div v-if="node.children?.length" class="ml-4 pl-2 border-l border-line">
        <TreeCheck :nodes="node.children" :model-value="modelValue" @update:model-value="(v: Set<number>) => emit('update:modelValue', v)" />
      </div>
    </li>
  </ul>
</template>