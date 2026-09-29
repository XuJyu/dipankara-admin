/** 按钮权限：v-perm="['system:user:add']"，admin 的 *:*:* 通配全部放行 */
import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

export function hasPerm(perms: string | string[]): boolean {
  const userStore = useUserStore()
  if (userStore.permissions.includes('*:*:*')) return true
  const list = Array.isArray(perms) ? perms : [perms]
  return list.some((p) => userStore.permissions.includes(p))
}

export const permDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    if (!binding.value) return
    if (!hasPerm(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  },
}
