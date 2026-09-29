<script setup lang="ts">
/** 字典数据页：按类型（query.dictType）分页 CRUD（M4 对接）；隐藏路由，从字典类型页进入 */
import { reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listDictData, addDictData, updateDictData, delDictData } from '@/api/system/dict'
import { usePagedList } from '@/composables/usePagedList'
import { useDict } from '@/composables/useDict'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import type { SysDictData } from '@/types/system'
import AppDialog from '@/components/AppDialog.vue'
import AppPagination from '@/components/AppPagination.vue'
import DictTag from '@/components/DictTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const dictType = () => String(route.query.dictType ?? '')

const { query, rows, total, page, pageSize, loading, load, search } = usePagedList<SysDictData>(
  (q) => listDictData({ ...q, dictType: dictType() }),
  { dictLabel: '', status: '' },
)

watch(() => route.query.dictType, () => search(), { immediate: true })

const statusOptions = useDict('sys_normal_disable')
const LIST_CLASS = [
  { value: '', label: '默认（灰）' },
  { value: 'primary', label: '主要（蓝）' },
  { value: 'success', label: '成功（绿）' },
  { value: 'warning', label: '警告（黄）' },
  { value: 'danger', label: '危险（红）' },
]

const dialog = reactive({ visible: false, editing: false, saving: false })
const form = reactive<Partial<SysDictData>>({})

function openAdd(): void {
  Object.assign(form, {
    dictCode: undefined, dictType: dictType(), dictLabel: '', dictValue: '', dictSort: 0,
    listClass: '', isDefault: 'N', status: '0', remark: '',
  })
  dialog.editing = false
  dialog.visible = true
}

function openEdit(row: SysDictData): void {
  Object.assign(form, { ...row })
  dialog.editing = true
  dialog.visible = true
}

async function save(): Promise<void> {
  if (!form.dictLabel || form.dictValue === undefined || form.dictValue === '') {
    message.error('请填写标签与键值')
    return
  }
  dialog.saving = true
  try {
    if (dialog.editing) {
      await updateDictData(form)
      message.success('修改成功')
    } else {
      await addDictData(form)
      message.success('新增成功')
    }
    dialog.visible = false
    void load()
  } finally {
    dialog.saving = false
  }
}

async function remove(list: SysDictData[]): Promise<void> {
  const ok = await confirm({
    title: '删除字典数据',
    text: `确认删除「${list.map((d) => d.dictLabel).join('、')}」？`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  await delDictData(list.map((d) => d.dictCode))
  message.success('删除成功')
  void load()
}
</script>

<template>
  <div class="n-page max-w-5xl mx-auto">
    <div class="flex items-center gap-2 mb-4">
      <button class="n-btn !px-2" aria-label="返回字典类型" @click="router.push('/system/dict')">
        <AppIcon name="chevron-right" :size="14" style="transform: scaleX(-1)" />
      </button>
      <h1 class="n-page-title">字典数据</h1>
      <span class="n-tag n-tag-blue n-mono">{{ dictType() || '未指定类型' }}</span>
    </div>

    <div class="n-card p-4 md:p-5">
      <div class="n-toolbar">
        <input v-model="query.dictLabel" class="n-input !w-40" placeholder="标签" @keyup.enter="search" />
        <select v-model="query.status" class="n-select !w-28">
          <option value="">全部状态</option>
          <option v-for="d in statusOptions.data.value" :key="d.dictValue" :value="d.dictValue">{{ d.dictLabel }}</option>
        </select>
        <button class="n-btn n-btn-primary" @click="search"><AppIcon name="search" :size="14" /> 搜索</button>
        <span class="flex-1" />
        <button v-perm="'system:dict:add'" class="n-btn n-btn-primary" :disabled="!dictType()" @click="openAdd">
          <AppIcon name="plus" :size="14" /> 新增
        </button>
      </div>

      <div class="overflow-x-auto n-scroll">
        <table class="n-table" v-if="rows.length">
          <thead>
            <tr>
              <th class="w-16">编号</th>
              <th>标签</th>
              <th>键值</th>
              <th class="w-16">排序</th>
              <th>标签样式</th>
              <th class="w-20">默认</th>
              <th class="w-20">状态</th>
              <th class="!text-right w-32">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.dictCode">
              <td class="n-mono">{{ row.dictCode }}</td>
              <td><span class="n-tag" :class="row.listClass === 'primary' ? 'n-tag-blue' : row.listClass === 'danger' ? 'n-tag-red' : row.listClass === 'warning' ? 'n-tag-yellow' : row.listClass === 'success' ? 'n-tag-green' : 'n-tag-gray'">{{ row.dictLabel }}</span></td>
              <td class="n-mono">{{ row.dictValue }}</td>
              <td class="n-mono">{{ row.dictSort }}</td>
              <td class="text-ink/60">{{ LIST_CLASS.find((c) => c.value === (row.listClass ?? ''))?.label ?? '默认（灰）' }}</td>
              <td><span class="n-tag" :class="row.isDefault === 'Y' ? 'n-tag-green' : 'n-tag-gray'">{{ row.isDefault === 'Y' ? '是' : '否' }}</span></td>
              <td><DictTag dict-type="sys_normal_disable" :value="row.status" /></td>
              <td class="!text-right whitespace-nowrap">
                <button v-perm="'system:dict:edit'" class="n-btn n-btn-sm" @click="openEdit(row)">编辑</button>
                <button v-perm="'system:dict:remove'" class="n-btn n-btn-sm n-btn-danger" @click="remove([row])">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else-if="!loading" text="该类型暂无字典数据" />
      </div>

      <AppPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
    </div>

    <AppDialog v-model="dialog.visible" :title="dialog.editing ? '编辑字典数据' : '新增字典数据'" :width="480">
      <form @submit.prevent="save">
        <div class="grid grid-cols-2 gap-x-4">
          <div class="n-field">
            <label class="n-label" for="dd-label">标签 *</label>
            <input id="dd-label" v-model.trim="form.dictLabel" class="n-input" placeholder="如 正常" />
          </div>
          <div class="n-field">
            <label class="n-label" for="dd-value">键值 *</label>
            <input id="dd-value" v-model.trim="form.dictValue" class="n-input" placeholder="如 0" />
          </div>
          <div class="n-field">
            <label class="n-label" for="dd-sort">排序</label>
            <input id="dd-sort" v-model.number="form.dictSort" type="number" class="n-input" placeholder="0" />
          </div>
          <div class="n-field">
            <label class="n-label" for="dd-class">标签样式</label>
            <select id="dd-class" v-model="form.listClass" class="n-select">
              <option v-for="c in LIST_CLASS" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
          <div class="n-field">
            <label class="n-label">默认</label>
            <div class="flex gap-3 pt-1.5 text-sm">
              <label class="flex items-center gap-1.5 cursor-pointer"><input type="radio" value="Y" v-model="form.isDefault" class="accent-[#37352f]" /> 是</label>
              <label class="flex items-center gap-1.5 cursor-pointer"><input type="radio" value="N" v-model="form.isDefault" class="accent-[#37352f]" /> 否</label>
            </div>
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
          <label class="n-label" for="dd-remark">备注</label>
          <textarea id="dd-remark" v-model.trim="form.remark" class="n-textarea" placeholder="选填" />
        </div>
      </form>
      <template #footer>
        <button class="n-btn" @click="dialog.visible = false">取消</button>
        <button class="n-btn n-btn-primary" :disabled="dialog.saving" @click="save">{{ dialog.saving ? '保存中…' : '确定' }}</button>
      </template>
    </AppDialog>
  </div>
</template>
