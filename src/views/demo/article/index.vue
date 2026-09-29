<script setup lang="ts">
/** 示例文章：管理端 CRUD（后端 M7 demo 模块，接单参照抄改的第一个业务模块） */
import { reactive } from 'vue'
import { listArticle, getArticle, addArticle, updateArticle, delArticle } from '@/api/demo/article'
import { usePagedList } from '@/composables/usePagedList'
import { useDict } from '@/composables/useDict'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import type { DemoArticle } from '@/types/demo'
import AppDialog from '@/components/AppDialog.vue'
import AppPagination from '@/components/AppPagination.vue'
import DictTag from '@/components/DictTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const { query, rows, total, page, pageSize, loading, load, search, reset } = usePagedList<DemoArticle>(listArticle, {
  title: '',
  status: '',
})

const statusOptions = useDict('demo_article_status')

const dialog = reactive({ visible: false, editing: false, saving: false })
const form = reactive<Partial<DemoArticle>>({})

/* 查看详情（只读）：列表不带正文字段，走详情接口 */
const viewDialog = reactive<{ visible: boolean; loading: boolean; detail: Partial<DemoArticle> }>({
  visible: false, loading: false, detail: {},
})

async function openView(row: DemoArticle): Promise<void> {
  viewDialog.visible = true
  viewDialog.loading = true
  try {
    const res = await getArticle(row.articleId)
    viewDialog.detail = ((res as unknown as { data?: DemoArticle }).data
      ?? (res as unknown as { rows?: never })) as Partial<DemoArticle>
    if (!viewDialog.detail?.articleId) viewDialog.detail = { ...row }
  } finally {
    viewDialog.loading = false
  }
}

function openAdd(): void {
  Object.assign(form, { articleId: undefined, title: '', summary: '', content: '', status: '0' })
  dialog.editing = false
  dialog.visible = true
}

function openEdit(row: DemoArticle): void {
  Object.assign(form, { ...row })
  dialog.editing = true
  dialog.visible = true
}

async function save(): Promise<void> {
  if (!form.title) {
    message.error('请填写标题')
    return
  }
  dialog.saving = true
  try {
    if (dialog.editing) {
      await updateArticle(form)
      message.success('修改成功')
    } else {
      await addArticle(form)
      message.success('新增成功')
    }
    dialog.visible = false
    void load()
  } finally {
    dialog.saving = false
  }
}

async function remove(list: DemoArticle[]): Promise<void> {
  const ok = await confirm({
    title: '删除文章',
    text: `确认删除「${list.map((a) => a.title).join('、')}」？`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  await delArticle(list.map((a) => a.articleId))
  message.success('删除成功')
  void load()
}
</script>

<template>
  <div class="n-page max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-5">
      <h1 class="n-page-title">文章管理</h1>
      <span class="text-[13px] text-muted">示例业务模块 · 接单时参照此页与后端 demo 模块抄改</span>
    </div>

    <div class="n-card p-4 md:p-5">
      <div class="n-toolbar">
        <input v-model="query.title" class="n-input !w-48" placeholder="标题关键词" @keyup.enter="search" />
        <select v-model="query.status" class="n-select !w-28">
          <option value="">全部状态</option>
          <option v-for="d in statusOptions.data.value" :key="d.dictValue" :value="d.dictValue">{{ d.dictLabel }}</option>
        </select>
        <button class="n-btn n-btn-primary" @click="search"><AppIcon name="search" :size="14" /> 搜索</button>
        <button class="n-btn" @click="reset">重置</button>
        <span class="flex-1" />
        <button v-perm="'demo:article:add'" class="n-btn n-btn-primary" @click="openAdd"><AppIcon name="plus" :size="14" /> 新增</button>
      </div>

      <div class="overflow-x-auto n-scroll">
        <table class="n-table" v-if="rows.length">
          <thead>
            <tr>
              <th class="w-16">编号</th>
              <th>标题</th>
              <th>作者</th>
              <th class="w-20">状态</th>
              <th>发布时间</th>
              <th class="!text-right w-36">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.articleId">
              <td class="n-mono">{{ row.articleId }}</td>
              <td>
                <button class="text-left font-medium text-ink hover:text-[#2eaadc] hover:underline" title="查看详情" @click="openView(row)">{{ row.title }}</button>
                <div class="text-[12px] text-muted truncate max-w-md">{{ row.summary }}</div>
              </td>
              <td>{{ row.author }}</td>
              <td><DictTag dict-type="demo_article_status" :value="row.status" /></td>
              <td class="text-ink/60 text-[13px]">{{ row.publishTime || '—' }}</td>
              <td class="!text-right whitespace-nowrap">
                <button v-perm="'demo:article:query'" class="n-btn n-btn-sm" @click="openView(row)">查看</button>
                <button v-perm="'demo:article:edit'" class="n-btn n-btn-sm" @click="openEdit(row)">编辑</button>
                <button v-perm="'demo:article:remove'" class="n-btn n-btn-sm n-btn-danger" @click="remove([row])">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else-if="!loading" />
      </div>

      <AppPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
    </div>

    <AppDialog v-model="dialog.visible" :title="dialog.editing ? '编辑文章' : '新增文章'" :width="560">
      <form @submit.prevent="save">
        <div class="n-field">
          <label class="n-label" for="a-title">标题 *</label>
          <input id="a-title" v-model.trim="form.title" class="n-input" placeholder="文章标题" />
        </div>
        <div class="n-field">
          <label class="n-label" for="a-summary">摘要</label>
          <input id="a-summary" v-model.trim="form.summary" class="n-input" placeholder="一句话摘要（选填）" />
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
          <label class="n-label" for="a-content">正文</label>
          <textarea id="a-content" v-model.trim="form.content" class="n-textarea !min-h-[140px]" placeholder="支持纯文本（M7 后按后端字段对接）" />
        </div>
      </form>
      <template #footer>
        <button class="n-btn" @click="dialog.visible = false">取消</button>
        <button class="n-btn n-btn-primary" :disabled="dialog.saving" @click="save">{{ dialog.saving ? '保存中…' : '确定' }}</button>
      </template>
    </AppDialog>
    <!-- 查看详情（只读） -->
    <AppDialog v-model="viewDialog.visible" title="文章详情" :width="640">
      <div v-if="viewDialog.loading" class="py-10 text-center text-muted text-sm">加载中…</div>
      <div v-else class="space-y-3">
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-[17px] font-semibold text-ink leading-snug">{{ viewDialog.detail.title }}</h3>
          <DictTag dict-type="demo_article_status" :value="viewDialog.detail.status ?? ''" />
        </div>
        <div class="flex gap-4 text-[12px] text-muted">
          <span>编号 <span class="n-mono">{{ viewDialog.detail.articleId }}</span></span>
          <span>作者 {{ viewDialog.detail.author || '—' }}</span>
          <span>发布时间 {{ viewDialog.detail.publishTime || '—' }}</span>
        </div>
        <div v-if="viewDialog.detail.summary" class="text-[13px] text-ink/75 border-l-2 border-line pl-3">
          {{ viewDialog.detail.summary }}
        </div>
        <div class="text-[14px] text-ink/85 whitespace-pre-wrap leading-relaxed n-scroll max-h-[46vh] overflow-y-auto">
          {{ viewDialog.detail.content || '（无正文）' }}
        </div>
      </div>
      <template #footer>
        <button class="n-btn" @click="viewDialog.visible = false">关闭</button>
      </template>
    </AppDialog>
  </div>
</template>
