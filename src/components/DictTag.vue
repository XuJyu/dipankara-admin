<script setup lang="ts">
/** 字典标签：按 dictType + value 渲染带色标签（缓存来自 useDict） */
import { useDict } from '@/composables/useDict'

const props = defineProps<{ dictType: string; value: unknown }>()

const { labelOf, tagClassOf } = useDict(props.dictType)
</script>

<template>
  <span class="n-tag" :class="tagClassOf(value)">{{ labelOf(value) }}</span>
</template>
