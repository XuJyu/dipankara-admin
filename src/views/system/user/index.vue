<script setup lang="ts">
/** 用户管理：部门树侧板 + 分页 CRUD + 状态切换 + 重置密码（M3 对接） */
import { computed, onMounted, reactive, ref } from 'vue'
import { listUser, addUser, updateUser, delUser, changeUserStatus, resetUserPwd, userDeptTree, getUser } from '@/api/system/user'
import { usePagedList } from '@/composables/usePagedList'
import { useDict } from '@/composables/useDict'
import { pick } from '@/types/api'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import type { SysRole, SysUser, TreeSelect } from '@/types/system'
import AppDialog from '@/components/AppDialog.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSwitch from '@/components/AppSwitch.vue'
import DictTag from '@/components/DictTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const { query, rows, total, page, pageSize, loading, load, search, reset } = usePagedList<SysUser>(listUser, {
  userName: '',
  phonenumber: '',
  status: '',
})

/* ---------- 部门树 ---------- */
interface DeptNode extends TreeSelect {
  children?: DeptNode[]
}
const deptTree = ref<DeptNode[]>([])
const selectedDeptId = ref<number | null>(null)

function flattenTree(nodes: DeptNode[], prefix = ''): { id: number; label: string }[] {
  return nodes.flatMap((n) => {
    const label = prefix ? `${prefix} / ${n.label}` : n.label
    return [{ id: n.id, label }, ...flattenTree(n.children ?? [], label)]
  })
}
const deptOptions = computed(() => flattenTree(deptTree.value))

async function loadDeptTree(): Promise<void> {
  const res = await userDeptTree()
  deptTree.value = (res.data ?? []) as DeptNode[]
}

function pickDept(node: DeptNode): void {
  selectedDeptId.value = node.id
  query.deptId = node.id
  search()
}

function clearDept(): void {
  selectedDeptId.value = null
  delete query.deptId
  search()
}

/** 重置：清空搜索表单并同步退出部门树筛选（deptId 是动态键，不在 usePagedList 的 defaultQuery 内） */
function resetAll(): void {
  selectedDeptId.value = null
  delete query.deptId
  reset()
}

/* ---------- 角色选项 ---------- */
const roleOptions = ref<SysRole[]>([])

/** 弹窗角色列表来自用户详情接口自带的 roles（仅需 system:user:query，与 RuoYi 一致）——
 *  不能单独调 listRole：只授了用户权限的账号会被 system:role:list 拦成 403 拿到空列表 */
function rolesFromDetail(res: unknown): SysRole[] {
  return (pick<SysRole[]>(res as never, 'roles') ?? []) as SysRole[]
}

/* ---------- 新增/编辑 ---------- */
const dialog = reactive({ visible: false, editing: false, saving: false })
const form = reactive<Partial<SysUser> & { password?: string; roleIds: number[] }>({ roleIds: [] })

async function openAdd(): Promise<void> {
  const res = await getUser()
  roleOptions.value = rolesFromDetail(res)
  Object.assign(form, {
    userId: undefined, userName: '', nickName: '', password: '', deptId: selectedDeptId.value ?? undefined,
    phonenumber: '', email: '', sex: '0', status: '0', remark: '', roleIds: [],
  })
  dialog.editing = false
  dialog.visible = true
}

async function openEdit(row: SysUser): Promise<void> {
  const res = await getUser(row.userId)
  roleOptions.value = rolesFromDetail(res)
  // 双兼容：详情在 data 内（R 包裹）或顶层（RuoYi 原样）
  const detail = pick<SysUser>(res as never, 'user') ?? row
  const roleIds = pick<number[]>(res as never, 'roleIds') ?? []
  Object.assign(form, { ...detail, password: undefined, roleIds })
  dialog.editing = true
  dialog.visible = true
}

async function save(): Promise<void> {
  if (!form.userName || !form.nickName) {
    message.error('请填写账号与昵称')
    return
  }
  dialog.saving = true
  try {
    if (dialog.editing) {
      await updateUser(form)
      message.success('修改成功')
    } else {
      await addUser(form)
      message.success('新增成功')
    }
    dialog.visible = false
    void load()
  } finally {
    dialog.saving = false
  }
}

/* ---------- 状态/密码/删除 ---------- */
async function onStatusChange(row: SysUser, status: boolean): Promise<void> {
  const res = await changeUserStatus(row.userId, status ? '0' : '1')
  if (res.code === 200) {
    row.status = status ? '0' : '1'
    message.success(status ? '已启用' : '已停用')
  }
}

const pwdDialog = reactive({ visible: false, userId: 0, userName: '', password: '', saving: false })
function openResetPwd(row: SysUser): void {
  Object.assign(pwdDialog, { visible: true, userId: row.userId, userName: row.userName, password: '', saving: false })
}
async function savePwd(): Promise<void> {
  if (!pwdDialog.password || pwdDialog.password.length < 5) {
    message.error('密码至少 5 位')
    return
  }
  pwdDialog.saving = true
  try {
    await resetUserPwd(pwdDialog.userId, pwdDialog.password)
    message.success('重置成功')
    pwdDialog.visible = false
  } finally {
    pwdDialog.saving = false
  }
}

async function removeUsers(rows: SysUser[]): Promise<void> {
  const ids = rows.map((r) => r.userId)
  const ok = await confirm({
    title: '删除用户',
    text: `确认删除用户编号「${ids.join('、')}」？该操作不可恢复。`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  await delUser(ids)
  message.success('删除成功')
  void load()
}

/* ---------- 选择 ---------- */
const selected = ref<number[]>([])
const allChecked = computed(() => rows.value.length > 0 && selected.value.length === rows.value.length)
function toggleAll(): void {
  selected.value = allChecked.value ? [] : rows.value.map((r) => r.userId)
}

const sexOptions = useDict('sys_user_sex')
const statusOptions = useDict('sys_normal_disable')

onMounted(() => {
  void loadDeptTree()
})
</script>

<template>
  <div class="n-page">
    <h1 class="n-page-title mb-4">用户管理</h1>

    <div class="flex gap-4 items-start">
      <!-- 部门树 -->
      <div class="n-card p-3 w-52 shrink-0 hidden md:block">
        <div class="flex items-center justify-between mb-2 px-1">
          <span class="text-[13px] font-medium text-ink">部门</span>
          <button v-if="selectedDeptId" class="n-link text-[12px]" @click="clearDept">清除</button>
        </div>
        <div class="max-h-[540px] overflow-y-auto n-scroll text-sm">
          <button
            v-for="opt in deptOptions"
            :key="opt.id"
            class="w-full text-left px-2 py-1.5 rounded-md hover:bg-hover text-[13px]"
            :class="selectedDeptId === opt.id ? 'bg-pressed font-medium' : 'text-ink/75'"
            @click="pickDept({ id: opt.id, label: opt.label })"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- 主表 -->
      <div class="n-card p-4 md:p-5 flex-1 min-w-0">
        <div class="n-toolbar">
          <input v-model="query.userName" class="n-input !w-40" placeholder="账号 / 用户名" @keyup.enter="search" />
          <input v-model="query.phonenumber" class="n-input !w-40" placeholder="手机号" @keyup.enter="search" />
          <select v-model="query.status" class="n-select !w-28">
            <option value="">全部状态</option>
            <option v-for="d in statusOptions.data.value" :key="d.dictValue" :value="d.dictValue">{{ d.dictLabel }}</option>
          </select>
          <button class="n-btn n-btn-primary" @click="search"><AppIcon name="search" :size="14" /> 搜索</button>
          <button class="n-btn" @click="resetAll">重置</button>
          <span class="flex-1" />
          <button v-perm="'system:user:add'" class="n-btn n-btn-primary" @click="openAdd"><AppIcon name="plus" :size="14" /> 新增</button>
          <button
            v-perm="'system:user:remove'"
            class="n-btn n-btn-danger"
            :disabled="!selected.length"
            @click="removeUsers(rows.filter((r) => selected.includes(r.userId)))"
          >
            <AppIcon name="trash" :size="14" /> 删除
          </button>
        </div>

        <div class="overflow-x-auto n-scroll">
          <table class="n-table" v-if="rows.length">
            <thead>
              <tr>
                <th class="w-9">
                  <input type="checkbox" class="accent-[#37352f]" :checked="allChecked" @change="toggleAll" aria-label="全选" />
                </th>
                <th class="w-16">编号</th>
                <th>用户</th>
                <th>部门</th>
                <th>手机号</th>
                <th>状态</th>
                <th>创建时间</th>
                <th class="!text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.userId">
                <td>
                  <input
                    type="checkbox"
                    class="accent-[#37352f]"
                    :value="row.userId"
                    v-model="selected"
                    :aria-label="`选择 ${row.userName}`"
                  />
                </td>
                <td class="n-mono">{{ row.userId }}</td>
                <td>
                  <div class="font-medium text-ink whitespace-nowrap">{{ row.nickName }}</div>
                  <div class="text-[12px] text-muted whitespace-nowrap">@{{ row.userName }}</div>
                </td>
                <td class="text-ink/75">{{ row.dept?.deptName || '—' }}</td>
                <td class="n-mono">{{ row.phonenumber || '—' }}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <AppSwitch
                      :model-value="row.status === '0'"
                      :disabled="row.userId === 1"
                      @change="(v: boolean) => onStatusChange(row, v)"
                    />
                    <DictTag dict-type="sys_normal_disable" :value="row.status" />
                  </div>
                </td>
                <td class="text-ink/60 text-[13px]">{{ row.createTime }}</td>
                <td class="!text-right whitespace-nowrap">
                  <button v-perm="'system:user:edit'" class="n-btn n-btn-sm" @click="openEdit(row)">编辑</button>
                  <button v-perm="'system:user:resetPwd'" class="n-btn n-btn-sm" @click="openResetPwd(row)">重置密码</button>
                  <button
                    v-if="row.userId !== 1"
                    v-perm="'system:user:remove'"
                    class="n-btn n-btn-sm n-btn-danger"
                    @click="removeUsers([row])"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else-if="!loading" />
        </div>

        <AppPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
      </div>
    </div>

    <!-- 新增/编辑 -->
    <AppDialog v-model="dialog.visible" :title="dialog.editing ? '编辑用户' : '新增用户'" :width="560">
      <form class="grid grid-cols-2 gap-x-4" @submit.prevent="save">
        <div class="n-field">
          <label class="n-label" for="f-username">账号 *</label>
          <input id="f-username" v-model.trim="form.userName" class="n-input" :disabled="dialog.editing" placeholder="登录账号" />
        </div>
        <div class="n-field">
          <label class="n-label" for="f-nickname">昵称 *</label>
          <input id="f-nickname" v-model.trim="form.nickName" class="n-input" placeholder="显示名称" />
        </div>
        <div v-if="!dialog.editing" class="n-field">
          <label class="n-label" for="f-password">初始密码</label>
          <input id="f-password" v-model.trim="form.password" class="n-input" placeholder="留空则 123456" />
        </div>
        <div class="n-field">
          <label class="n-label" for="f-dept">部门</label>
          <select id="f-dept" v-model="form.deptId" class="n-select">
            <option :value="undefined" disabled>选择部门</option>
            <option v-for="opt in deptOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
          </select>
        </div>
        <div class="n-field">
          <label class="n-label" for="f-phone">手机号</label>
          <input id="f-phone" v-model.trim="form.phonenumber" class="n-input" placeholder="11 位手机号" />
        </div>
        <div class="n-field">
          <label class="n-label" for="f-email">邮箱</label>
          <input id="f-email" v-model.trim="form.email" class="n-input" placeholder="name@example.com" />
        </div>
        <div class="n-field">
          <label class="n-label">性别</label>
          <div class="flex gap-3 pt-1.5 text-sm">
            <label v-for="d in sexOptions.data.value" :key="d.dictValue" class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" :value="d.dictValue" v-model="form.sex" class="accent-[#37352f]" /> {{ d.dictLabel }}
            </label>
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
        <div class="n-field col-span-2">
          <label class="n-label">角色</label>
          <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            <label v-for="r in roleOptions" :key="r.roleId" class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" :value="r.roleId" v-model="form.roleIds" class="accent-[#37352f]" />
              {{ r.roleName }}
            </label>
          </div>
        </div>
        <div class="n-field col-span-2">
          <label class="n-label" for="f-remark">备注</label>
          <textarea id="f-remark" v-model.trim="form.remark" class="n-textarea" placeholder="选填" />
        </div>
      </form>
      <template #footer>
        <button class="n-btn" @click="dialog.visible = false">取消</button>
        <button class="n-btn n-btn-primary" :disabled="dialog.saving" @click="save">{{ dialog.saving ? '保存中…' : '确定' }}</button>
      </template>
    </AppDialog>

    <!-- 重置密码 -->
    <AppDialog v-model="pwdDialog.visible" title="重置密码" :width="420">
      <p class="text-sm text-muted mb-3">为账号 <span class="n-mono text-ink">{{ pwdDialog.userName }}</span> 设置新密码：</p>
      <input v-model.trim="pwdDialog.password" type="password" class="n-input" placeholder="至少 5 位" @keyup.enter="savePwd" />
      <template #footer>
        <button class="n-btn" @click="pwdDialog.visible = false">取消</button>
        <button class="n-btn n-btn-primary" :disabled="pwdDialog.saving" @click="savePwd">确定</button>
      </template>
    </AppDialog>
  </div>
</template>
