<script setup lang="ts">
/** 菜单管理：树表 + CRUD（目录/菜单/按钮三态表单，M3 对接） */
import { computed, onMounted, reactive, ref } from 'vue'
import { listMenu, getMenu, addMenu, updateMenu, delMenu } from '@/api/system/menu'
import { useDict } from '@/composables/useDict'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import type { MenuType, SysMenu } from '@/types/system'
import AppDialog from '@/components/AppDialog.vue'
import DictTag from '@/components/DictTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const query = reactive({ menuName: '', status: '' })
const allMenus = ref<SysMenu[]>([])
const expanded = ref<Set<number>>(new Set())
const loading = ref(false)

function buildTree(list: SysMenu[], parentId = 0): SysMenu[] {
  return list
    .filter((x) => x.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum)
    .map((x) => ({ ...x, children: buildTree(list, x.menuId) }))
}

const menuTree = computed(() => buildTree(allMenus.value))
const statusOptions = useDict('sys_normal_disable')

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await listMenu({ ...query })
    allMenus.value = res.data ?? []
  } finally {
    loading.value = false
  }
}

function toggleExpand(id: number): void {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

function flattenMenus(list: SysMenu[], prefix = ''): { id: number; label: string }[] {
  return list.flatMap((n) => {
    const label = prefix ? `${prefix} / ${n.menuName}` : n.menuName
    return [{ id: n.menuId, label }, ...flattenMenus(n.children ?? [], label)]
  })
}
const parentOptions = computed(() => [{ id: 0, label: '根目录' }, ...flattenMenus(menuTree.value)])

/* ---------- 表单 ---------- */
const dialog = reactive({ visible: false, editing: false, saving: false })
const form = reactive<Partial<SysMenu>>({})

const TYPE_META: Record<MenuType, { label: string; cls: string }> = {
  M: { label: '目录', cls: 'n-tag-gray' },
  C: { label: '菜单', cls: 'n-tag-blue' },
  F: { label: '按钮', cls: 'n-tag-yellow' },
}

function openAdd(parent?: SysMenu): void {
  Object.assign(form, {
    menuId: undefined, menuName: '', parentId: parent?.menuId ?? 0, orderNum: 0,
    menuType: 'C' as MenuType, path: '', component: '', perms: '', icon: '', visible: '0', status: '0', remark: '',
  })
  dialog.editing = false
  dialog.visible = true
}

async function openEdit(row: SysMenu): Promise<void> {
  const res = await getMenu(row.menuId)
  Object.assign(form, { ...row, ...(res.data ?? {}) })
  dialog.editing = true
  dialog.visible = true
}

async function save(): Promise<void> {
  if (!form.menuName) {
    message.error('请填写菜单名称')
    return
  }
  dialog.saving = true
  try {
    if (dialog.editing) {
      await updateMenu(form)
      message.success('修改成功')
    } else {
      await addMenu(form)
      message.success('新增成功')
    }
    dialog.visible = false
    void load()
  } finally {
    dialog.saving = false
  }
}

async function remove(row: SysMenu): Promise<void> {
  const ok = await confirm({
    title: '删除菜单',
    text: `确认删除「${row.menuName}」？存在子菜单或已分配角色时将无法删除。`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  await delMenu(row.menuId)
  message.success('删除成功')
  void load()
}

onMounted(load)
</script>

<template>
  <div class="n-page max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-5">
      <h1 class="n-page-title">菜单管理</h1>
      <span class="text-[13px] text-muted">component 路径需与前端视图对齐（如 system/user/index）</span>
    </div>

    <div class="n-card p-4 md:p-5">
      <div class="n-toolbar">
        <input v-model="query.menuName" class="n-input !w-44" placeholder="菜单名称" @keyup.enter="load" />
        <select v-model="query.status" class="n-select !w-28">
          <option value="">全部状态</option>
          <option v-for="d in statusOptions.data.value" :key="d.dictValue" :value="d.dictValue">{{ d.dictLabel }}</option>
        </select>
        <button class="n-btn n-btn-primary" @click="load"><AppIcon name="search" :size="14" /> 搜索</button>
        <button class="n-btn" @click="() => { query.menuName = ''; query.status = ''; load() }">重置</button>
        <span class="flex-1" />
        <button v-perm="'system:menu:add'" class="n-btn n-btn-primary" @click="openAdd()"><AppIcon name="plus" :size="14" /> 新增</button>
      </div>

      <div class="overflow-x-auto n-scroll" v-if="menuTree.length">
        <table class="n-table">
          <thead>
            <tr>
              <th>菜单名称</th>
              <th class="w-20">图标</th>
              <th class="w-16">排序</th>
              <th class="w-20">类型</th>
              <th>权限标识</th>
              <th>组件路径</th>
              <th class="w-20">状态</th>
              <th class="!text-right w-52">操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="node in menuTree" :key="node.menuId">
              <tr>
                <td>
                  <button v-if="node.children?.length" class="n-btn !p-1 -ml-1" :aria-label="`展开 ${node.menuName}`" @click="toggleExpand(node.menuId)">
                    <AppIcon :name="expanded.has(node.menuId) ? 'chevron-down' : 'chevron-right'" :size="13" />
                  </button>
                  <span class="ml-1.5 font-medium text-ink">{{ node.menuName }}</span>
                </td>
                <td><AppIcon v-if="node.icon && node.icon !== '#'" :name="node.icon" :size="15" class="text-ink/60" /></td>
                <td class="n-mono">{{ node.orderNum }}</td>
                <td><span class="n-tag" :class="TYPE_META[node.menuType].cls">{{ TYPE_META[node.menuType].label }}</span></td>
                <td class="n-mono">{{ node.perms || '—' }}</td>
                <td class="n-mono">{{ node.component || '—' }}</td>
                <td><DictTag dict-type="sys_normal_disable" :value="node.status" /></td>
                <td class="!text-right whitespace-nowrap">
                  <button v-perm="'system:menu:add'" class="n-btn n-btn-sm" @click="openAdd(node)">新增</button>
                  <button v-perm="'system:menu:edit'" class="n-btn n-btn-sm" @click="openEdit(node)">编辑</button>
                  <button v-perm="'system:menu:remove'" class="n-btn n-btn-sm n-btn-danger" @click="remove(node)">删除</button>
                </td>
              </tr>
              <template v-if="expanded.has(node.menuId)">
                <tr v-for="child in node.children" :key="child.menuId" class="bg-canvas/40">
                  <td class="pl-10">
                    <span class="text-ink/80">└ {{ child.menuName }}</span>
                  </td>
                  <td><AppIcon v-if="child.icon && child.icon !== '#'" :name="child.icon" :size="15" class="text-ink/60" /></td>
                  <td class="n-mono">{{ child.orderNum }}</td>
                  <td><span class="n-tag" :class="TYPE_META[child.menuType].cls">{{ TYPE_META[child.menuType].label }}</span></td>
                  <td class="n-mono">{{ child.perms || '—' }}</td>
                  <td class="n-mono">{{ child.component || '—' }}</td>
                  <td><DictTag dict-type="sys_normal_disable" :value="child.status" /></td>
                  <td class="!text-right whitespace-nowrap">
                    <button v-perm="'system:menu:edit'" class="n-btn n-btn-sm" @click="openEdit(child)">编辑</button>
                    <button v-perm="'system:menu:remove'" class="n-btn n-btn-sm n-btn-danger" @click="remove(child)">删除</button>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>
      <EmptyState v-else-if="!loading" />
    </div>

    <AppDialog v-model="dialog.visible" :title="dialog.editing ? '编辑菜单' : '新增菜单'" :width="560">
      <form @submit.prevent="save">
        <div class="n-field">
          <label class="n-label">菜单类型</label>
          <div class="flex gap-3 text-sm">
            <label v-for="(meta, t) in TYPE_META" :key="t" class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" :value="t" v-model="form.menuType" class="accent-[#37352f]" /> {{ meta.label }}
            </label>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-4">
          <div class="n-field">
            <label class="n-label" for="m-parent">上级菜单</label>
            <select id="m-parent" v-model.number="form.parentId" class="n-select">
              <option v-for="opt in parentOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
            </select>
          </div>
          <div class="n-field">
            <label class="n-label" for="m-name">菜单名称 *</label>
            <input id="m-name" v-model.trim="form.menuName" class="n-input" placeholder="显示名称" />
          </div>
          <div v-if="form.menuType !== 'F'" class="n-field">
            <label class="n-label" for="m-path">路由地址</label>
            <input id="m-path" v-model.trim="form.path" class="n-input" placeholder="如 user" />
          </div>
          <div v-if="form.menuType === 'C'" class="n-field">
            <label class="n-label" for="m-component">组件路径</label>
            <input id="m-component" v-model.trim="form.component" class="n-input" placeholder="如 system/user/index" />
          </div>
          <div class="n-field">
            <label class="n-label" for="m-perms">权限标识</label>
            <input id="m-perms" v-model.trim="form.perms" class="n-input" placeholder="如 system:user:list" />
          </div>
          <div v-if="form.menuType !== 'F'" class="n-field">
            <label class="n-label" for="m-icon">图标名</label>
            <input id="m-icon" v-model.trim="form.icon" class="n-input" placeholder="如 user / build" />
          </div>
          <div class="n-field">
            <label class="n-label" for="m-sort">排序</label>
            <input id="m-sort" v-model.number="form.orderNum" type="number" class="n-input" placeholder="0" />
          </div>
          <div class="n-field">
            <label class="n-label">状态</label>
            <div class="flex gap-3 pt-1.5 text-sm">
              <label v-for="d in statusOptions.data.value" :key="d.dictValue" class="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" :value="d.dictValue" v-model="form.status" class="accent-[#37352f]" /> {{ d.dictLabel }}
              </label>
            </div>
          </div>
        </div>
      </form>
      <template #footer>
        <button class="n-btn" @click="dialog.visible = false">取消</button>
        <button class="n-btn n-btn-primary" :disabled="dialog.saving" @click="save">{{ dialog.saving ? '保存中…' : '确定' }}</button>
      </template>
    </AppDialog>
  </div>
</template>
