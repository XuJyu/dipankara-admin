<script setup lang="ts">
/** 参数设置：分页 CRUD + 按键名取值演示（M4 对接） */
import { reactive } from 'vue'
import { listConfig, addConfig, updateConfig, delConfig } from '@/api/system/config'
import { usePagedList } from '@/composables/usePagedList'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import type { SysConfig } from '@/types/system'
import AppDialog from '@/components/AppDialog.vue'
import AppPagination from '@/components/AppPagination.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const { query, rows, total, page, pageSize, loading, load, search, reset } = usePagedList<SysConfig>(listConfig, {
  configName: '',
  configKey: '',
})

const dialog = reactive({ visible: false, editing: false, saving: false })
const form = reactive<Partial<SysConfig>>({})

function openAdd(): void {
  Object.assign(form, { configId: undefined, configName: '', configKey: '', configValue: '', configType: 'N', remark: '' })
  dialog.editing = false
  dialog.visible = true
}

function openEdit(row: SysConfig): void {
  Object.assign(form, { ...row })
  dialog.editing = true
  dialog.visible = true
}

async function save(): Promise<void> {
  if (!form.configName || !form.configKey || form.configValue === undefined) {
    message.error('请填写参数名称、键名与值')
    return
  }
  dialog.saving = true
  try {
    if (dialog.editing) {
      await updateConfig(form)
      message.success('修改成功')
    } else {
      await addConfig(form)
      message.success('新增成功')
    }
    dialog.visible = false
    void load()
  } finally {
    dialog.saving = false
  }
}

async function remove(list: SysConfig[]): Promise<void> {
  const ok = await confirm({
    title: '删除参数',
    text: `确认删除「${list.map((c) => c.configName).join('、')}」？`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  await delConfig(list.map((c) => c.configId))
  message.success('删除成功')
  void load()
}
</script>

<template>
  <div class="n-page max-w-6xl mx-auto">
    <h1 class="n-page-title mb-4">参数设置</h1>

    <div class="n-card p-4 md:p-5">
      <div class="n-toolbar">
        <input v-model="query.configName" class="n-input !w-40" placeholder="参数名称" @keyup.enter="search" />
        <input v-model="query.configKey" class="n-input !w-44" placeholder="参数键名" @keyup.enter="search" />
        <button class="n-btn n-btn-primary" @click="search"><AppIcon name="search" :size="14" /> 搜索</button>
        <button class="n-btn" @click="reset">重置</button>
        <span class="flex-1" />
        <button v-perm="'system:config:add'" class="n-btn n-btn-primary" @click="openAdd"><AppIcon name="plus" :size="14" /> 新增</button>
      </div>

      <div class="overflow-x-auto n-scroll">
        <table class="n-table" v-if="rows.length">
          <thead>
            <tr>
              <th class="w-16">编号</th>
              <th>参数名称</th>
              <th>参数键名</th>
              <th>参数值</th>
              <th class="w-20">内置</th>
              <th>备注</th>
              <th class="!text-right w-32">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.configId">
              <td class="n-mono">{{ row.configId }}</td>
              <td class="font-medium text-ink">{{ row.configName }}</td>
              <td class="n-mono">{{ row.configKey }}</td>
              <td class="n-mono">{{ row.configValue }}</td>
              <td><span class="n-tag" :class="row.configType === 'Y' ? 'n-tag-purple' : 'n-tag-gray'">{{ row.configType === 'Y' ? '是' : '否' }}</span></td>
              <td class="text-ink/60">{{ row.remark || '—' }}</td>
              <td class="!text-right whitespace-nowrap">
                <button v-perm="'system:config:edit'" class="n-btn n-btn-sm" @click="openEdit(row)">编辑</button>
                <button v-perm="'system:config:remove'" class="n-btn n-btn-sm n-btn-danger" @click="remove([row])">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else-if="!loading" />
      </div>

      <AppPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
    </div>

    <AppDialog v-model="dialog.visible" :title="dialog.editing ? '编辑参数' : '新增参数'" :width="480">
      <form @submit.prevent="save">
        <div class="n-field">
          <label class="n-label" for="c-name">参数名称 *</label>
          <input id="c-name" v-model.trim="form.configName" class="n-input" placeholder="如 是否开启验证码" />
        </div>
        <div class="n-field">
          <label class="n-label" for="c-key">参数键名 *</label>
          <input id="c-key" v-model.trim="form.configKey" class="n-input n-mono" placeholder="如 sys.account.captchaEnabled" />
        </div>
        <div class="n-field">
          <label class="n-label" for="c-value">参数值 *</label>
          <input id="c-value" v-model.trim="form.configValue" class="n-input n-mono" placeholder="如 true" />
        </div>
        <div class="n-field">
          <label class="n-label">内置</label>
          <div class="flex gap-3 pt-1.5 text-sm">
            <label class="flex items-center gap-1.5 cursor-pointer"><input type="radio" value="Y" v-model="form.configType" class="accent-[#37352f]" /> 是</label>
            <label class="flex items-center gap-1.5 cursor-pointer"><input type="radio" value="N" v-model="form.configType" class="accent-[#37352f]" /> 否</label>
          </div>
        </div>
        <div class="n-field">
          <label class="n-label" for="c-remark">备注</label>
          <textarea id="c-remark" v-model.trim="form.remark" class="n-textarea" placeholder="选填" />
        </div>
      </form>
      <template #footer>
        <button class="n-btn" @click="dialog.visible = false">取消</button>
        <button class="n-btn n-btn-primary" :disabled="dialog.saving" @click="save">{{ dialog.saving ? '保存中…' : '确定' }}</button>
      </template>
    </AppDialog>
  </div>
</template>
