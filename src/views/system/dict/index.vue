<script setup lang="ts">
/** 字典管理：类型分页 CRUD（M4 对接）；行内入口进入字典数据页 */
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { listDictType, addDictType, updateDictType, delDictType } from '@/api/system/dict'
import { usePagedList } from '@/composables/usePagedList'
import { useDict } from '@/composables/useDict'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import type { SysDictType } from '@/types/system'
import AppDialog from '@/components/AppDialog.vue'
import AppPagination from '@/components/AppPagination.vue'
import DictTag from '@/components/DictTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()

const { query, rows, total, page, pageSize, loading, load, search, reset } = usePagedList<SysDictType>(listDictType, {
  dictName: '',
  dictType: '',
  status: '',
})

const statusOptions = useDict('sys_normal_disable')

const dialog = reactive({ visible: false, editing: false, saving: false })
const form = reactive<Partial<SysDictType>>({})

function openAdd(): void {
  Object.assign(form, { dictId: undefined, dictName: '', dictType: '', status: '0', remark: '' })
  dialog.editing = false
  dialog.visible = true
}

function openEdit(row: SysDictType): void {
  Object.assign(form, { ...row })
  dialog.editing = true
  dialog.visible = true
}

async function save(): Promise<void> {
  if (!form.dictName || !form.dictType) {
    message.error('请填写字典名称与类型')
    return
  }
  dialog.saving = true
  try {
    if (dialog.editing) {
      await updateDictType(form)
      message.success('修改成功（类型变更将同步字典数据）')
    } else {
      await addDictType(form)
      message.success('新增成功')
    }
    dialog.visible = false
    void load()
  } finally {
    dialog.saving = false
  }
}

async function remove(list: SysDictType[]): Promise<void> {
  const ok = await confirm({
    title: '删除字典类型',
    text: `确认删除「${list.map((t) => t.dictName).join('、')}」？已分配字典数据时无法删除。`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  await delDictType(list.map((t) => t.dictId))
  message.success('删除成功')
  void load()
}
</script>

<template>
  <div class="n-page max-w-6xl mx-auto">
    <h1 class="n-page-title mb-4">字典管理</h1>

    <div class="n-card p-4 md:p-5">
      <div class="n-toolbar">
        <input v-model="query.dictName" class="n-input !w-40" placeholder="字典名称" @keyup.enter="search" />
        <input v-model="query.dictType" class="n-input !w-44" placeholder="字典类型" @keyup.enter="search" />
        <select v-model="query.status" class="n-select !w-28">
          <option value="">全部状态</option>
          <option v-for="d in statusOptions.data.value" :key="d.dictValue" :value="d.dictValue">{{ d.dictLabel }}</option>
        </select>
        <button class="n-btn n-btn-primary" @click="search"><AppIcon name="search" :size="14" /> 搜索</button>
        <button class="n-btn" @click="reset">重置</button>
        <span class="flex-1" />
        <button v-perm="'system:dict:add'" class="n-btn n-btn-primary" @click="openAdd"><AppIcon name="plus" :size="14" /> 新增</button>
      </div>

      <div class="overflow-x-auto n-scroll">
        <table class="n-table" v-if="rows.length">
          <thead>
            <tr>
              <th class="w-16">编号</th>
              <th>字典名称</th>
              <th>字典类型</th>
              <th class="w-20">状态</th>
              <th>备注</th>
              <th>创建时间</th>
              <th class="!text-right w-56">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.dictId">
              <td class="n-mono">{{ row.dictId }}</td>
              <td class="font-medium text-ink">{{ row.dictName }}</td>
              <td>
                <router-link class="n-link n-mono !text-accent" :to="{ path: '/system/dict/data', query: { dictType: row.dictType } }">
                  {{ row.dictType }}
                </router-link>
              </td>
              <td><DictTag dict-type="sys_normal_disable" :value="row.status" /></td>
              <td class="text-ink/60">{{ row.remark || '—' }}</td>
              <td class="text-ink/60 text-[13px]">{{ row.createTime }}</td>
              <td class="!text-right whitespace-nowrap">
                <button class="n-btn n-btn-sm" @click="router.push({ path: '/system/dict/data', query: { dictType: row.dictType } })">字典数据</button>
                <button v-perm="'system:dict:edit'" class="n-btn n-btn-sm" @click="openEdit(row)">编辑</button>
                <button v-perm="'system:dict:remove'" class="n-btn n-btn-sm n-btn-danger" @click="remove([row])">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else-if="!loading" />
      </div>

      <AppPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
    </div>

    <AppDialog v-model="dialog.visible" :title="dialog.editing ? '编辑字典类型' : '新增字典类型'" :width="480">
      <form @submit.prevent="save">
        <div class="n-field">
          <label class="n-label" for="dt-name">字典名称 *</label>
          <input id="dt-name" v-model.trim="form.dictName" class="n-input" placeholder="如 用户性别" />
        </div>
        <div class="n-field">
          <label class="n-label" for="dt-type">字典类型 *</label>
          <input id="dt-type" v-model.trim="form.dictType" class="n-input" placeholder="如 sys_user_sex" />
        </div>
        <div class="n-field">
          <label class="n-label">状态</label>
          <div class="flex gap-3 pt-1.5 text-sm">
            <label v-for="d in statusOptions.data.value" :key="d.dictValue" class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" :value="d.dictValue" v-model="form.status" class="accent-[#37352f]" /> {{ d.dictLabel }}
            </label>
          </div>
        </div>
        <div class="n-field">
          <label class="n-label" for="dt-remark">备注</label>
          <textarea id="dt-remark" v-model.trim="form.remark" class="n-textarea" placeholder="选填" />
        </div>
      </form>
      <template #footer>
        <button class="n-btn" @click="dialog.visible = false">取消</button>
        <button class="n-btn n-btn-primary" :disabled="dialog.saving" @click="save">{{ dialog.saving ? '保存中…' : '确定' }}</button>
      </template>
    </AppDialog>
  </div>
</template>
