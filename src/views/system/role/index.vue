<script setup lang="ts">
/** 角色管理：分页 CRUD + 菜单权限树分配（M3 对接） */
import { reactive, ref } from 'vue'
import { listRole, addRole, updateRole, delRole, changeRoleStatus, menuTreeselect, roleMenuTreeselect } from '@/api/system/role'
import { usePagedList } from '@/composables/usePagedList'
import { useDict } from '@/composables/useDict'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import { pick } from '@/types/api'
import type { SysRole, TreeSelect } from '@/types/system'
import AppDialog from '@/components/AppDialog.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSwitch from '@/components/AppSwitch.vue'
import DictTag from '@/components/DictTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import TreeCheck from '@/components/TreeCheck.vue'
import AppIcon from '@/components/AppIcon.vue'

const { query, rows, total, page, pageSize, loading, load, search, reset } = usePagedList<SysRole>(listRole, {
  roleName: '',
  roleKey: '',
  status: '',
})

const dialog = reactive({ visible: false, editing: false, saving: false })
const form = reactive<Partial<SysRole>>({})
const menuTree = ref<TreeSelect[]>([])
const checked = ref<Set<number>>(new Set())
const statusOptions = useDict('sys_normal_disable')

async function loadMenuTree(): Promise<void> {
  const res = await menuTreeselect()
  menuTree.value = (res.data ?? []) as TreeSelect[]
}

function openAdd(): void {
  Object.assign(form, { roleId: undefined, roleName: '', roleKey: '', roleSort: 0, status: '0', remark: '' })
  checked.value = new Set()
  dialog.editing = false
  dialog.visible = true
}

async function openEdit(row: SysRole): Promise<void> {
  const res = await roleMenuTreeselect(row.roleId)
  const data = (pick<unknown>(res as never, 'data') ?? res) as { menus?: TreeSelect[]; checkedKeys?: number[] }
  menuTree.value = (data.menus ?? (res.data as { menus?: TreeSelect[] })?.menus ?? []) as TreeSelect[]
  checked.value = new Set(data.checkedKeys ?? [])
  Object.assign(form, { ...row })
  dialog.editing = true
  dialog.visible = true
}

/** 收集授权节点：自身被勾或任一子孙被勾则计入（补齐半选父节点——
 *  对齐 RuoYi getCheckedKeys+getHalfCheckedKeys 语义；后端回显剥父，保存须带回祖先） */
function collectGranted(nodes: TreeSelect[]): number[] {
  const out: number[] = []
  for (const n of nodes) {
    const childIds = n.children?.length ? collectGranted(n.children) : []
    if (checked.value.has(n.id) || childIds.length > 0) out.push(n.id, ...childIds)
  }
  return out
}

async function save(): Promise<void> {
  if (!form.roleName || !form.roleKey) {
    message.error('请填写角色名称与权限字符')
    return
  }
  dialog.saving = true
  try {
    const payload = { ...form, menuIds: collectGranted(menuTree.value) }
    if (dialog.editing) {
      await updateRole(payload)
      message.success('修改成功')
    } else {
      await addRole(payload)
      message.success('新增成功')
    }
    dialog.visible = false
    void load()
  } finally {
    dialog.saving = false
  }
}

async function onStatusChange(row: SysRole, status: boolean): Promise<void> {
  await changeRoleStatus(row.roleId, status ? '0' : '1')
  row.status = status ? '0' : '1'
  message.success(status ? '已启用' : '已停用')
}

async function removeRoles(list: SysRole[]): Promise<void> {
  const ids = list.map((r) => r.roleId)
  const ok = await confirm({
    title: '删除角色',
    text: `确认删除角色「${list.map((r) => r.roleName).join('、')}」？`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  await delRole(ids)
  message.success('删除成功')
  void load()
}

void loadMenuTree()
</script>

<template>
  <div class="n-page max-w-6xl mx-auto">
    <h1 class="n-page-title mb-4">角色管理</h1>

    <div class="n-card p-4 md:p-5">
      <div class="n-toolbar">
        <input v-model="query.roleName" class="n-input !w-40" placeholder="角色名称" @keyup.enter="search" />
        <input v-model="query.roleKey" class="n-input !w-40" placeholder="权限字符" @keyup.enter="search" />
        <select v-model="query.status" class="n-select !w-28">
          <option value="">全部状态</option>
          <option v-for="d in statusOptions.data.value" :key="d.dictValue" :value="d.dictValue">{{ d.dictLabel }}</option>
        </select>
        <button class="n-btn n-btn-primary" @click="search"><AppIcon name="search" :size="14" /> 搜索</button>
        <button class="n-btn" @click="reset">重置</button>
        <span class="flex-1" />
        <button v-perm="'system:role:add'" class="n-btn n-btn-primary" @click="openAdd"><AppIcon name="plus" :size="14" /> 新增</button>
      </div>

      <div class="overflow-x-auto n-scroll">
        <table class="n-table" v-if="rows.length">
          <thead>
            <tr>
              <th class="w-16">编号</th>
              <th>角色名称</th>
              <th>权限字符</th>
              <th>排序</th>
              <th>状态</th>
              <th>创建时间</th>
              <th class="!text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.roleId">
              <td class="n-mono">{{ row.roleId }}</td>
              <td>
                <span class="font-medium text-ink">{{ row.roleName }}</span>
                <span v-if="row.roleId === 1" class="n-tag n-tag-purple ml-2">内置</span>
              </td>
              <td class="n-mono">{{ row.roleKey }}</td>
              <td class="n-mono">{{ row.roleSort }}</td>
              <td>
                <div class="flex items-center gap-2">
                  <AppSwitch :model-value="row.status === '0'" :disabled="row.roleId === 1" @change="(v: boolean) => onStatusChange(row, v)" />
                  <DictTag dict-type="sys_normal_disable" :value="row.status" />
                </div>
              </td>
              <td class="text-ink/60 text-[13px]">{{ row.createTime }}</td>
              <td class="!text-right whitespace-nowrap">
                <button v-perm="'system:role:edit'" class="n-btn n-btn-sm" @click="openEdit(row)">编辑</button>
                <button v-if="row.roleId !== 1" v-perm="'system:role:remove'" class="n-btn n-btn-sm n-btn-danger" @click="removeRoles([row])">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else-if="!loading" />
      </div>

      <AppPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
    </div>

    <AppDialog v-model="dialog.visible" :title="dialog.editing ? '编辑角色' : '新增角色'" :width="560">
      <form @submit.prevent="save">
        <div class="grid grid-cols-2 gap-x-4">
          <div class="n-field">
            <label class="n-label" for="r-name">角色名称 *</label>
            <input id="r-name" v-model.trim="form.roleName" class="n-input" placeholder="如：运营专员" />
          </div>
          <div class="n-field">
            <label class="n-label" for="r-key">权限字符 *</label>
            <input id="r-key" v-model.trim="form.roleKey" class="n-input" placeholder="如：operator" :disabled="dialog.editing && form.roleId === 1" />
          </div>
          <div class="n-field">
            <label class="n-label" for="r-sort">排序</label>
            <input id="r-sort" v-model.number="form.roleSort" type="number" class="n-input" placeholder="0" />
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
        <div class="n-field">
          <label class="n-label">菜单权限</label>
          <div class="border border-line rounded-md p-3 max-h-64 overflow-y-auto n-scroll bg-canvas/40">
            <TreeCheck v-model="checked" :nodes="menuTree" />
          </div>
        </div>
        <div class="n-field">
          <label class="n-label" for="r-remark">备注</label>
          <textarea id="r-remark" v-model.trim="form.remark" class="n-textarea" placeholder="选填" />
        </div>
      </form>
      <template #footer>
        <button class="n-btn" @click="dialog.visible = false">取消</button>
        <button class="n-btn n-btn-primary" :disabled="dialog.saving" @click="save">{{ dialog.saving ? '保存中…' : '确定' }}</button>
      </template>
    </AppDialog>
  </div>
</template>
