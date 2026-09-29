<script setup lang="ts">
/** 操作日志：分页 + 详情 + 删除/清空（M3 对接） */
import { ref } from 'vue'
import { listOperLog, delOperLog, cleanOperLog } from '@/api/system/log'
import { usePagedList } from '@/composables/usePagedList'
import { useDict } from '@/composables/useDict'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import type { OperLog } from '@/types/system'
import AppDialog from '@/components/AppDialog.vue'
import AppPagination from '@/components/AppPagination.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const { query, rows, total, page, pageSize, loading, load, search, reset } = usePagedList<OperLog>(listOperLog, {
  title: '',
  operName: '',
  businessType: '',
})

const typeOptions = useDict('sys_oper_type')

const detail = ref<OperLog | null>(null)

async function remove(list: OperLog[]): Promise<void> {
  const ok = await confirm({
    title: '删除日志',
    text: `确认删除 ${list.length} 条操作日志？`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  await delOperLog(list.map((l) => l.operId))
  message.success('删除成功')
  void load()
}

async function clean(): Promise<void> {
  const ok = await confirm({
    title: '清空日志',
    text: '确认清空全部操作日志？该操作不可恢复。',
    confirmText: '清空',
    danger: true,
  })
  if (!ok) return
  await cleanOperLog()
  message.success('清空成功')
  void load()
}
</script>

<template>
  <div class="n-page max-w-6xl mx-auto">
    <h1 class="n-page-title mb-4">操作日志</h1>

    <div class="n-card p-4 md:p-5">
      <div class="n-toolbar">
        <input v-model="query.title" class="n-input !w-36" placeholder="系统模块" @keyup.enter="search" />
        <input v-model="query.operName" class="n-input !w-32" placeholder="操作人员" @keyup.enter="search" />
        <select v-model="query.businessType" class="n-select !w-28">
          <option value="">全部类型</option>
          <option v-for="d in typeOptions.data.value" :key="d.dictValue" :value="d.dictValue">{{ d.dictLabel }}</option>
        </select>
        <button class="n-btn n-btn-primary" @click="search"><AppIcon name="search" :size="14" /> 搜索</button>
        <button class="n-btn" @click="reset">重置</button>
        <span class="flex-1" />
        <button v-perm="'monitor:operlog:remove'" class="n-btn n-btn-danger" @click="clean">清空</button>
      </div>

      <div class="overflow-x-auto n-scroll">
        <table class="n-table" v-if="rows.length">
          <thead>
            <tr>
              <th class="w-16">编号</th>
              <th>系统模块</th>
              <th>操作类型</th>
              <th>请求方式</th>
              <th>操作人员</th>
              <th>操作地址</th>
              <th class="w-20">结果</th>
              <th>耗时</th>
              <th>时间</th>
              <th class="!text-right w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.operId">
              <td class="n-mono">{{ row.operId }}</td>
              <td class="font-medium text-ink">{{ row.title }}</td>
              <td><span class="n-tag n-tag-gray">{{ typeOptions.labelOf(row.businessType) }}</span></td>
              <td class="n-mono">{{ row.requestMethod }}</td>
              <td>{{ row.operName }}</td>
              <td class="n-mono text-[12px] max-w-[220px] truncate" :title="row.operUrl">{{ row.operUrl }}</td>
              <td><span class="n-tag" :class="row.status === 0 ? 'n-tag-green' : 'n-tag-red'">{{ row.status === 0 ? '成功' : '失败' }}</span></td>
              <td class="n-mono">{{ row.costTime }}ms</td>
              <td class="text-ink/60 text-[13px]">{{ row.operTime }}</td>
              <td class="!text-right whitespace-nowrap">
                <button class="n-btn n-btn-sm" @click="detail = row">详情</button>
                <button v-perm="'monitor:operlog:remove'" class="n-btn n-btn-sm n-btn-danger" @click="remove([row])">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else-if="!loading" />
      </div>

      <AppPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
    </div>

    <AppDialog :model-value="detail !== null" title="操作日志详情" :width="620" @update:model-value="(v: boolean) => !v && (detail = null)">
      <div v-if="detail" class="text-sm">
        <div class="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
          <div><span class="text-muted">系统模块：</span>{{ detail.title }}</div>
          <div><span class="text-muted">操作类型：</span>{{ typeOptions.labelOf(detail.businessType) }}</div>
          <div><span class="text-muted">操作人员：</span>{{ detail.operName }}</div>
          <div><span class="text-muted">请求方式：</span><span class="n-mono">{{ detail.requestMethod }}</span></div>
          <div><span class="text-muted">操作 IP：</span><span class="n-mono">{{ detail.operIp }}</span></div>
          <div><span class="text-muted">耗时：</span><span class="n-mono">{{ detail.costTime }}ms</span></div>
        </div>
        <div class="mb-2">
          <div class="text-muted mb-1">请求地址</div>
          <div class="n-mono !text-ink/80 break-all bg-canvas rounded-md px-3 py-2 border border-line">{{ detail.operUrl }}</div>
        </div>
        <div class="mb-2">
          <div class="text-muted mb-1">请求方法</div>
          <div class="n-mono !text-ink/80 break-all bg-canvas rounded-md px-3 py-2 border border-line">{{ detail.method }}</div>
        </div>
        <div v-if="detail.operParam" class="mb-2">
          <div class="text-muted mb-1">请求参数</div>
          <div class="n-mono !text-ink/80 break-all bg-canvas rounded-md px-3 py-2 border border-line">{{ detail.operParam }}</div>
        </div>
        <div v-if="detail.jsonResult">
          <div class="text-muted mb-1">返回结果</div>
          <div class="n-mono !text-ink/80 break-all bg-canvas rounded-md px-3 py-2 border border-line">{{ detail.jsonResult }}</div>
        </div>
      </div>
      <template #footer>
        <button class="n-btn" @click="detail = null">关闭</button>
      </template>
    </AppDialog>
  </div>
</template>
