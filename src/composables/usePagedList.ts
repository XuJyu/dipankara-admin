/** 分页列表 composable：搜索/重置/翻页统一处理（TableDataInfo 契约） */
import { ref, reactive, watch, onMounted, type Ref } from 'vue'
import type { TableDataInfo } from '@/types/api'

export function usePagedList<T>(
  fetcher: (query: Record<string, unknown>) => Promise<TableDataInfo<T>>,
  defaultQuery: Record<string, unknown> = {},
) {
  const query = reactive<Record<string, unknown>>({ ...defaultQuery })
  const rows = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)

  async function load(): Promise<void> {
    loading.value = true
    try {
      const res = await fetcher({ ...query, pageNum: page.value, pageSize: pageSize.value })
      rows.value = res.rows ?? []
      total.value = res.total ?? 0
    } finally {
      loading.value = false
    }
  }

  function search(): void {
    page.value = 1
    void load()
  }

  function reset(): void {
    Object.keys(defaultQuery).forEach((k) => (query[k] = defaultQuery[k]))
    search()
  }

  onMounted(load)
  watch([page, pageSize], () => void load())

  return { query, rows, total, page, pageSize, loading, load, search, reset }
}
