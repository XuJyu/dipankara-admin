<script setup lang="ts">
/** 部门管理：树表 CRUD（M3 对接） */
import { computed, onMounted, reactive, ref } from 'vue'
import { listDept, getDept, addDept, updateDept, delDept } from '@/api/system/dept'
import { useDict } from '@/composables/useDict'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import type { SysDept } from '@/types/system'
import AppDialog from '@/components/AppDialog.vue'
import DictTag from '@/components/DictTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const query = reactive({ deptName: '', status: '' })
const allDepts = ref<SysDept[]>([])
const expanded = ref<Set<number>>(new Set([100]))
const loading = ref(false)
const statusOptions = useDict('sys_normal_disable')

function buildTree(list: SysDept[], parentId = 0): SysDept[] {
  return list
    .filter((x) => x.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum)
    .map((x) => ({ ...x, children: buildTree(list, x.deptId) }))
}

const deptTree = computed(() => buildTree(allDepts.value))

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await listDept({ ...query })
    allDepts.value = res.data ?? []
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

function flattenDepts(list: SysDept[], prefix = ''): { id: number; label: string }[] {
  return list.flatMap((n) => {
    const label = prefix ? `${prefix} / ${n.deptName}` : n.deptName
    return [{ id: n.deptId, label }, ...flattenDepts(n.children ?? [], label)]
  })
}
const parentOptions = computed(() => flattenDepts(deptTree.value))

const dialog = reactive({ visible: false, editing: false, saving: false })
const form = reactive<Partial<SysDept>>({})

function openAdd(parent?: SysDept): void {
  Object.assign(form, {
    deptId: undefined, deptName: '', parentId: parent?.deptId ?? 100, orderNum: 0,
    leader: '', phone: '', email: '', status: '0',
  })
  dialog.editing = false
  dialog.visible = true
}

async function openEdit(row: SysDept): Promise<void> {
  const res = await getDept(row.deptId)
  Object.assign(form, { ...row, ...(res.data ?? {}) })
  dialog.editing = true
  dialog.visible = true
}

async function save(): Promise<void> {
  if (!form.deptName) {
    message.error('请填写部门名称')
    return
  }
  dialog.saving = true
  try {
    if (dialog.editing) {
      await updateDept(form)
      message.success('修改成功')
    } else {
      await addDept(form)
      message.success('新增成功')
    }
    dialog.visible = false
    void load()
  } finally {
    dialog.saving = false
  }
}

async function remove(row: SysDept): Promise<void> {
  const ok = await confirm({
    title: '删除部门',
    text: `确认删除「${row.deptName}」？存在下级部门或用户时无法删除。`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  await delDept(row.deptId)
  message.success('删除成功')
  void load()
}

onMounted(load)
</script>

<template>
  <div class="n-page max-w-5xl mx-auto">
    <h1 class="n-page-title mb-4">部门管理</h1>

    <div class="n-card p-4 md:p-5">
      <div class="n-toolbar">
        <input v-model="query.deptName" class="n-input !w-44" placeholder="部门名称" @keyup.enter="load" />
        <select v-model="query.status" class="n-select !w-28">
          <option value="">全部状态</option>
          <option v-for="d in statusOptions.data.value" :key="d.dictValue" :value="d.dictValue">{{ d.dictLabel }}</option>
        </select>
        <button class="n-btn n-btn-primary" @click="load"><AppIcon name="search" :size="14" /> 搜索</button>
        <button class="n-btn" @click="() => { query.deptName = ''; query.status = ''; load() }">重置</button>
        <span class="flex-1" />
        <button v-perm="'system:dept:add'" class="n-btn n-btn-primary" @click="openAdd()"><AppIcon name="plus" :size="14" /> 新增</button>
      </div>

      <div class="overflow-x-auto n-scroll" v-if="deptTree.length">
        <table class="n-table">
          <thead>
            <tr>
              <th>部门名称</th>
              <th class="w-16">排序</th>
              <th>负责人</th>
              <th>联系方式</th>
              <th class="w-20">状态</th>
              <th>创建时间</th>
              <th class="!text-right w-48">操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="node in deptTree" :key="node.deptId">
              <tr>
                <td>
                  <button v-if="node.children?.length" class="n-btn !p-1 -ml-1" :aria-label="`展开 ${node.deptName}`" @click="toggleExpand(node.deptId)">
                    <AppIcon :name="expanded.has(node.deptId) ? 'chevron-down' : 'chevron-right'" :size="13" />
                  </button>
                  <span class="ml-1.5 font-medium text-ink">{{ node.deptName }}</span>
                </td>
                <td class="n-mono">{{ node.orderNum }}</td>
                <td class="text-ink/75">{{ node.leader || '—' }}</td>
                <td class="n-mono">{{ node.phone || '—' }}</td>
                <td><DictTag dict-type="sys_normal_disable" :value="node.status" /></td>
                <td class="text-ink/60 text-[13px]">{{ node.createTime }}</td>
                <td class="!text-right whitespace-nowrap">
                  <button v-perm="'system:dept:add'" class="n-btn n-btn-sm" @click="openAdd(node)">新增</button>
                  <button v-perm="'system:dept:edit'" class="n-btn n-btn-sm" @click="openEdit(node)">编辑</button>
                  <button v-perm="'system:dept:remove'" class="n-btn n-btn-sm n-btn-danger" @click="remove(node)">删除</button>
                </td>
              </tr>
              <template v-if="expanded.has(node.deptId)">
                <tr v-for="child in node.children" :key="child.deptId" class="bg-canvas/40">
                  <td class="pl-10 text-ink/80">└ {{ child.deptName }}</td>
                  <td class="n-mono">{{ child.orderNum }}</td>
                  <td class="text-ink/75">{{ child.leader || '—' }}</td>
                  <td class="n-mono">{{ child.phone || '—' }}</td>
                  <td><DictTag dict-type="sys_normal_disable" :value="child.status" /></td>
                  <td class="text-ink/60 text-[13px]">{{ child.createTime }}</td>
                  <td class="!text-right whitespace-nowrap">
                    <button v-perm="'system:dept:edit'" class="n-btn n-btn-sm" @click="openEdit(child)">编辑</button>
                    <button v-perm="'system:dept:remove'" class="n-btn n-btn-sm n-btn-danger" @click="remove(child)">删除</button>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>
      <EmptyState v-else-if="!loading" />
    </div>

    <AppDialog v-model="dialog.visible" :title="dialog.editing ? '编辑部门' : '新增部门'" :width="520">
      <form @submit.prevent="save">
        <div class="grid grid-cols-2 gap-x-4">
          <div class="n-field">
            <label class="n-label" for="d-parent">上级部门</label>
            <select id="d-parent" v-model.number="form.parentId" class="n-select">
              <option v-for="opt in parentOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
            </select>
          </div>
          <div class="n-field">
            <label class="n-label" for="d-name">部门名称 *</label>
            <input id="d-name" v-model.trim="form.deptName" class="n-input" placeholder="如 研发部门" />
          </div>
          <div class="n-field">
            <label class="n-label" for="d-leader">负责人</label>
            <input id="d-leader" v-model.trim="form.leader" class="n-input" placeholder="选填" />
          </div>
          <div class="n-field">
            <label class="n-label" for="d-phone">联系电话</label>
            <input id="d-phone" v-model.trim="form.phone" class="n-input" placeholder="选填" />
          </div>
          <div class="n-field">
            <label class="n-label" for="d-email">邮箱</label>
            <input id="d-email" v-model.trim="form.email" class="n-input" placeholder="选填" />
          </div>
          <div class="n-field">
            <label class="n-label" for="d-sort">排序</label>
            <input id="d-sort" v-model.number="form.orderNum" type="number" class="n-input" placeholder="0" />
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
