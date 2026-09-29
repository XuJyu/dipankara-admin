/** 字典数据缓存：模块级 Map，页面与 DictTag 共享；对接后端 M4 后由接口刷新 */
import { ref } from 'vue'
import { dictDataByType } from '@/api/system/dict'
import type { SysDictData } from '@/types/system'

const cache = new Map<string, SysDictData[]>()
const loading = new Map<string, Promise<SysDictData[]>>()

export function useDict(dictType: string) {
  const data = ref<SysDictData[]>(cache.get(dictType) ?? [])
  const loaded = ref(cache.has(dictType))

  async function load(): Promise<void> {
    if (cache.has(dictType)) {
      data.value = cache.get(dictType) ?? []
      loaded.value = true
      return
    }
    let p = loading.get(dictType)
    if (!p) {
      p = dictDataByType(dictType)
        .then((res) => {
          const list = (res.data ?? []) as SysDictData[]
          cache.set(dictType, list)
          return list
        })
        .finally(() => loading.delete(dictType))
      loading.set(dictType, p)
    }
    data.value = await p
    loaded.value = true
  }

  function labelOf(value: unknown): string {
    return data.value.find((d) => d.dictValue === String(value))?.dictLabel ?? String(value ?? '')
  }

  function tagClassOf(value: unknown): string {
    const listClass = data.value.find((d) => d.dictValue === String(value))?.listClass ?? ''
    const map: Record<string, string> = {
      primary: 'n-tag-blue',
      success: 'n-tag-green',
      danger: 'n-tag-red',
      warning: 'n-tag-yellow',
      info: 'n-tag-gray',
      default: 'n-tag-gray',
      '': 'n-tag-gray',
    }
    return map[listClass] ?? 'n-tag-gray'
  }

  load()

  return { data, loaded, labelOf, tagClassOf }
}
