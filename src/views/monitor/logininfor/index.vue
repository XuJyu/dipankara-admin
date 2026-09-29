<script setup lang="ts">
/** 登录日志：分页 + 删除/清空（M3 对接） */
import { listLoginLog, delLoginLog, cleanLoginLog } from '@/api/system/log'
import { usePagedList } from '@/composables/usePagedList'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import type { LoginLog } from '@/types/system'
import AppPagination from '@/components/AppPagination.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const { query, rows, total, page, pageSize, loading, load, search, reset } = usePagedList<LoginLog>(listLoginLog, {
  userName: '',
  ipaddr: '',
  status: '',
})

async function remove(list: LoginLog[]): Promise<void> {
  const ok = await confirm({
    title: '删除日志',
    text: `确认删除 ${list.length} 条登录日志？`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  await delLoginLog(list.map((l) => l.infoId))
  message.success('删除成功')
  void load()
}

async function clean(): Promise<void> {
  const ok = await confirm({
    title: '清空日志',
    text: '确认清空全部登录日志？该操作不可恢复。',
    confirmText: '清空',
    danger: true,
  })
  if (!ok) return
  await cleanLoginLog()
  message.success('清空成功')
  void load()
}
</script>

<template>
  <div class="n-page max-w-6xl mx-auto">
    <h1 class="n-page-title mb-4">登录日志</h1>

    <div class="n-card p-4 md:p-5">
      <div class="n-toolbar">
        <input v-model="query.userName" class="n-input !w-36" placeholder="登录账号" @keyup.enter="search" />
        <input v-model="query.ipaddr" class="n-input !w-40" placeholder="IP 地址" @keyup.enter="search" />
        <select v-model="query.status" class="n-select !w-28">
          <option value="">全部状态</option>
          <option value="0">成功</option>
          <option value="1">失败</option>
        </select>
        <button class="n-btn n-btn-primary" @click="search"><AppIcon name="search" :size="14" /> 搜索</button>
        <button class="n-btn" @click="reset">重置</button>
        <span class="flex-1" />
        <button v-perm="'monitor:logininfor:remove'" class="n-btn n-btn-danger" @click="clean">清空</button>
      </div>

      <div class="overflow-x-auto n-scroll">
        <table class="n-table" v-if="rows.length">
          <thead>
            <tr>
              <th class="w-16">编号</th>
              <th>登录账号</th>
              <th>IP 地址</th>
              <th>登录地点</th>
              <th>浏览器</th>
              <th class="w-20">结果</th>
              <th>描述</th>
              <th>时间</th>
              <th class="!text-right w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.infoId">
              <td class="n-mono">{{ row.infoId }}</td>
              <td class="font-medium text-ink">{{ row.userName }}</td>
              <td class="n-mono">{{ row.ipaddr }}</td>
              <td class="text-ink/75">{{ row.loginLocation || '—' }}</td>
              <td class="text-ink/75 text-[13px]">{{ row.browser }}</td>
              <td><span class="n-tag" :class="row.status === '0' ? 'n-tag-green' : 'n-tag-red'">{{ row.status === '0' ? '成功' : '失败' }}</span></td>
              <td class="text-ink/60">{{ row.msg }}</td>
              <td class="text-ink/60 text-[13px]">{{ row.loginTime }}</td>
              <td class="!text-right">
                <button v-perm="'monitor:logininfor:remove'" class="n-btn n-btn-sm n-btn-danger" @click="remove([row])">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else-if="!loading" />
      </div>

      <AppPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
    </div>
  </div>
</template>
