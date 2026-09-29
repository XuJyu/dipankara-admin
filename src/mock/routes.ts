/**
 * Mock 路由表：路径 → 处理器。响应结构与后端契约逐字对齐
 * （R{code,msg,data} / TableDataInfo{code,msg,rows,total}，HTTP 恒 200）。
 * 白名单与后端 security.excludes 一致；带 token 校验模拟 401。
 */
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import * as db from '@/mock/db'
import type { SysDept, SysDictData, SysDictType, SysMenu } from '@/types/system'
import type { DemoArticle } from '@/types/demo'

interface Ctx {
  params: Record<string, string>
  query: Record<string, unknown>
  body: Record<string, unknown>
  token?: string
  username?: string
}

type Handler = (ctx: Ctx) => unknown

interface Route {
  method: string
  pattern: string
  handler: Handler
}

const WHITELIST = ['/login', '/captchaImage', '/ping']

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const ps = pattern.split('/').filter(Boolean)
  const xs = path.split('/').filter(Boolean)
  if (ps.length !== xs.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < ps.length; i++) {
    if (ps[i].startsWith(':')) params[ps[i].slice(1)] = decodeURIComponent(xs[i])
    else if (ps[i] !== xs[i]) return null
  }
  return params
}

const like = (v: unknown, q: unknown): boolean =>
  q === undefined || q === null || q === '' || String(v ?? '').toLowerCase().includes(String(q).toLowerCase())

const eq = (v: unknown, q: unknown): boolean =>
  q === undefined || q === null || q === '' || String(v ?? '') === String(q)

function paginate<T>(list: T[], query: Record<string, unknown>): { rows: T[]; total: number } {
  const pageNum = Number(query.pageNum ?? 1) || 1
  const pageSize = Number(query.pageSize ?? 10) || 10
  const total = list.length
  const rows = list.slice((pageNum - 1) * pageSize, pageNum * pageSize)
  return { rows, total }
}

/** 部门子树 id 集（用户列表按部门过滤需含子孙部门） */
function deptSubtreeIds(deptId: number): Set<number> {
  const ids = new Set<number>([deptId])
  let grew = true
  while (grew) {
    grew = false
    for (const d of db.depts) {
      if (ids.has(d.parentId) && !ids.has(d.deptId)) {
        ids.add(d.deptId)
        grew = true
      }
    }
  }
  return ids
}

/* ===================== 验证码 ===================== */
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function makeCaptcha(): { uuid: string; img: string; code: string } {
  const code = Array.from({ length: 4 }, () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]).join('')
  const uuid = `cap-${Math.random().toString(36).slice(2, 10)}`
  const color = ['#37352f', '#2eaadc', '#0f7b6c', '#eb5757'][Math.floor(Math.random() * 4)]
  const chars = code
    .split('')
    .map((ch, i) => {
      const x = 14 + i * 26
      const y = 30 + Math.round(Math.random() * 6 - 3)
      const rot = Math.round(Math.random() * 40 - 20)
      return `<text x="${x}" y="${y}" font-size="26" font-family="Menlo,monospace" fill="${color}" transform="rotate(${rot} ${x} ${y})">${ch}</text>`
    })
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" rx="4" fill="#f7f6f3"/><line x1="6" y1="${8 + Math.random() * 8}" x2="114" y2="${24 + Math.random() * 8}" stroke="rgba(55,53,47,.14)" stroke-width="1"/>${chars}</svg>`
  return { uuid, img: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`, code }
}

/* ===================== 路由表 ===================== */
const routes: Route[] = [
  { method: 'get', pattern: '/ping', handler: () => db.ok('pong') },

  /* ---------- 认证 ---------- */
  {
    method: 'post',
    pattern: '/login',
    handler: ({ body }) => {
      const captchaOn = db.configs.find((c) => c.configKey === 'sys.account.captchaEnabled')?.configValue !== 'false'
      if (captchaOn) {
        const { uuid, code } = body as { uuid?: string; code?: string }
        if (!uuid) return db.fail('验证码已过期，请刷新后重试')
        const expect = db.state.captcha.get(uuid)
        if (!expect) return db.fail('验证码已过期，请刷新后重试')
        db.state.captcha.delete(uuid)
        if (!code || code.toUpperCase() !== expect) return db.fail('验证码错误')
      }
      const user = db.users.find((u) => u.userName === body.username)
      if (!user || user.password !== body.password) return db.fail('用户名或密码错误')
      if (user.status === '1') return db.fail('账号已停用，请联系管理员')
      const token = `mock-${user.userName}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
      db.state.token2user.set(token, user.userName)
      db.loginLogs.unshift({
        infoId: db.nextId(), userName: user.userName, ipaddr: '127.0.0.1', browser: 'Chrome · mock',
        os: '', status: '0', msg: '登录成功', loginTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      return db.ok({ token }, '登录成功')
    },
  },
  {
    method: 'get',
    pattern: '/captchaImage',
    handler: () => {
      const captchaOn = db.configs.find((c) => c.configKey === 'sys.account.captchaEnabled')?.configValue !== 'false'
      if (!captchaOn) return db.ok({ captchaEnabled: false }, '操作成功')
      const { uuid, img, code } = makeCaptcha()
      db.state.captcha.set(uuid, code)
      return db.ok({ captchaEnabled: true, uuid, img }, '操作成功')
    },
  },
  {
    method: 'post',
    pattern: '/logout',
    handler: ({ token }) => {
      if (token) db.state.token2user.delete(token)
      return db.ok(null, '退出成功')
    },
  },
  {
    method: 'get',
    pattern: '/getInfo',
    handler: ({ username }) => {
      const user = db.users.find((u) => u.userName === username)
      if (!user) return db.fail('登录已过期，请重新登录', 401)
      const { password: _pw, roleKeys, ...safe } = user
      const isAdmin = roleKeys.includes('admin')
      return db.ok({
        user: { ...safe, admin: isAdmin, roles: db.roleNames(user) },
        roles: roleKeys,
        permissions: isAdmin ? ['*:*:*'] : db.commonPermissions,
      })
    },
  },
  {
    method: 'get',
    pattern: '/getRouters',
    handler: ({ username }) => db.ok(db.buildRouters(username ?? 'admin')),
  },

  /* ---------- 用户 ---------- */
  {
    method: 'get',
    pattern: '/system/user/list',
    handler: ({ query }) => {
      const deptId = query.deptId ? Number(query.deptId) : undefined
      const subtree = deptId ? deptSubtreeIds(deptId) : null
      const list = db.users
        .filter((u) => subtree === null || subtree.has(u.deptId ?? -1))
        .filter((u) => like(u.userName, query.userName) && like(u.nickName, query.nickName)
          && like(u.phonenumber, query.phonenumber) && eq(u.status, query.status))
        .map((u) => ({ ...u, password: undefined, dept: { deptId: u.deptId ?? 0, deptName: db.deptName(u.deptId) }, roleNames: db.roleNames(u) }))
      return db.page(...Object.values(paginate(list, query)) as [typeof list, number])
    },
  },
  {
    method: 'get',
    pattern: '/system/user/deptTree',
    handler: () => db.ok(db.deptTreeSelect()),
  },
  {
    method: 'get',
    pattern: '/system/user/',
    handler: () => db.ok({ roles: db.roles.filter((r) => r.status === '0'), posts: [] }),
  },
  {
    method: 'get',
    pattern: '/system/user/:id',
    handler: ({ params }) => {
      const user = db.users.find((u) => u.userId === Number(params.id))
      if (!user) return db.fail('用户不存在')
      return db.ok({
        user: { ...user, password: undefined, deptName: db.deptName(user.deptId) },
        roles: db.roles.filter((r) => r.status === '0'),
        roleIds: user.roleKeys.map((k) => db.roles.find((r) => r.roleKey === k)?.roleId),
      })
    },
  },
  {
    method: 'post',
    pattern: '/system/user',
    handler: ({ body }) => {
      if (db.users.some((u) => u.userName === body.userName)) return db.fail(`新增用户「${body.userName}」失败：登录账号已存在`)
      const roleKeys = (body.roleIds as number[] | undefined)?.map(
        (id) => db.roles.find((r) => r.roleId === id)?.roleKey,
      ).filter(Boolean) as string[]
      db.users.push({
        userId: db.nextId(),
        userName: String(body.userName), nickName: String(body.nickName ?? ''),
        password: '123456', email: String(body.email ?? ''), phonenumber: String(body.phonenumber ?? ''),
        sex: String(body.sex ?? '0'), status: String(body.status ?? '0'),
        deptId: Number(body.deptId ?? 100), roleKeys: roleKeys ?? [],
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '), remark: String(body.remark ?? ''),
      })
      return db.ok()
    },
  },
  {
    method: 'put',
    pattern: '/system/user',
    handler: ({ body }) => {
      const user = db.users.find((u) => u.userId === Number(body.userId))
      if (!user) return db.fail('用户不存在')
      const roleKeys = (body.roleIds as number[] | undefined)?.map(
        (id) => db.roles.find((r) => r.roleId === id)?.roleKey,
      ).filter(Boolean) as string[]
      Object.assign(user, { ...body, roleIds: undefined, roleKeys: roleKeys ?? user.roleKeys })
      return db.ok()
    },
  },
  {
    method: 'put',
    pattern: '/system/user/changeStatus',
    handler: ({ body }) => {
      const user = db.users.find((u) => u.userId === Number(body.userId))
      if (!user) return db.fail('用户不存在')
      if (user.userId === 1) return db.fail('不允许操作超级管理员用户')
      user.status = String(body.status)
      return db.ok()
    },
  },
  {
    method: 'put',
    pattern: '/system/user/resetPwd',
    handler: ({ body }) => {
      const user = db.users.find((u) => u.userId === Number(body.userId))
      if (!user) return db.fail('用户不存在')
      user.password = String(body.password)
      return db.ok()
    },
  },
  {
    method: 'delete',
    pattern: '/system/user/:ids',
    handler: ({ params, username }) => {
      const ids = params.ids.split(',').map(Number)
      if (ids.includes(1)) return db.fail('当前登录用户不能删除')
      const self = db.users.find((u) => u.userName === username)
      if (self && ids.includes(self.userId)) return db.fail('当前登录用户不能删除')
      for (const id of ids) {
        const i = db.users.findIndex((u) => u.userId === id)
        if (i >= 0) db.users.splice(i, 1)
      }
      return db.ok()
    },
  },

  /* ---------- 角色 ---------- */
  {
    method: 'get',
    pattern: '/system/role/list',
    handler: ({ query }) => {
      const list = db.roles
        .filter((r) => like(r.roleName, query.roleName) && like(r.roleKey, query.roleKey) && eq(r.status, query.status))
      return db.page(...Object.values(paginate(list, query)) as [typeof list, number])
    },
  },
  {
    method: 'get',
    pattern: '/system/role/:id',
    handler: ({ params }) => {
      const role = db.roles.find((r) => r.roleId === Number(params.id))
      return role ? db.ok(role) : db.fail('角色不存在')
    },
  },
  {
    method: 'post',
    pattern: '/system/role',
    handler: ({ body }) => {
      if (db.roles.some((r) => r.roleKey === body.roleKey)) return db.fail(`新增角色「${body.roleName}」失败：角色权限已存在`)
      db.roles.push({
        roleId: db.nextId(), roleName: String(body.roleName), roleKey: String(body.roleKey),
        roleSort: Number(body.roleSort ?? 0), status: String(body.status ?? '0'),
        menuIds: (body.menuIds as number[]) ?? [], remark: String(body.remark ?? ''),
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      return db.ok()
    },
  },
  {
    method: 'put',
    pattern: '/system/role',
    handler: ({ body }) => {
      const role = db.roles.find((r) => r.roleId === Number(body.roleId))
      if (!role) return db.fail('角色不存在')
      if (role.roleId === 1) return db.fail('不允许操作超级管理员角色')
      Object.assign(role, body)
      return db.ok()
    },
  },
  {
    method: 'put',
    pattern: '/system/role/changeStatus',
    handler: ({ body }) => {
      const role = db.roles.find((r) => r.roleId === Number(body.roleId))
      if (!role) return db.fail('角色不存在')
      if (role.roleId === 1) return db.fail('不允许操作超级管理员角色')
      role.status = String(body.status)
      return db.ok()
    },
  },
  {
    method: 'delete',
    pattern: '/system/role/:ids',
    handler: ({ params }) => {
      const ids = params.ids.split(',').map(Number)
      if (ids.includes(1)) return db.fail('不允许操作超级管理员角色')
      for (const id of ids) {
        const i = db.roles.findIndex((r) => r.roleId === id)
        if (i >= 0) db.roles.splice(i, 1)
      }
      return db.ok()
    },
  },

  /* ---------- 菜单 ---------- */
  { method: 'get', pattern: '/system/menu/list', handler: ({ query }) => db.ok(db.menus.filter((x) => like(x.menuName, query.menuName) && eq(x.status, query.status))) },
  { method: 'get', pattern: '/system/menu/treeselect', handler: () => db.ok(db.menuTreeSelect()) },
  {
    method: 'get',
    pattern: '/system/menu/roleMenuTreeselect/:roleId',
    handler: ({ params }) => {
      const role = db.roles.find((r) => r.roleId === Number(params.roleId))
      return db.ok({ menus: db.menuTreeSelect(), checkedKeys: role?.menuIds ?? [] })
    },
  },
  {
    method: 'get',
    pattern: '/system/menu/:id',
    handler: ({ params }) => {
      const menu = db.menus.find((x) => x.menuId === Number(params.id))
      return menu ? db.ok(menu) : db.fail('菜单不存在')
    },
  },
  {
    method: 'post',
    pattern: '/system/menu',
    handler: ({ body }) => {
      const menu: SysMenu = {
        menuId: db.nextId(), menuName: String(body.menuName), parentId: Number(body.parentId ?? 0),
        orderNum: Number(body.orderNum ?? 0), menuType: (body.menuType as SysMenu['menuType']) ?? 'C',
        path: String(body.path ?? ''), perms: String(body.perms ?? ''),
        component: String(body.component ?? ''), icon: String(body.icon ?? '#'),
        status: '0', visible: String(body.visible ?? '0'), createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      db.menus.push(menu)
      return db.ok()
    },
  },
  {
    method: 'put',
    pattern: '/system/menu',
    handler: ({ body }) => {
      const menu = db.menus.find((x) => x.menuId === Number(body.menuId))
      if (!menu) return db.fail('菜单不存在')
      Object.assign(menu, body)
      return db.ok()
    },
  },
  {
    method: 'delete',
    pattern: '/system/menu/:id',
    handler: ({ params }) => {
      const id = Number(params.id)
      if (db.menus.some((x) => x.parentId === id)) return db.fail('存在子菜单，不允许删除')
      const i = db.menus.findIndex((x) => x.menuId === id)
      if (i >= 0) db.menus.splice(i, 1)
      return db.ok()
    },
  },

  /* ---------- 部门 ---------- */
  { method: 'get', pattern: '/system/dept/list', handler: ({ query }) => db.ok(db.depts.filter((d) => like(d.deptName, query.deptName) && eq(d.status, query.status))) },
  {
    method: 'get',
    pattern: '/system/dept/list/exclude/:id',
    handler: ({ params }) => {
      const id = Number(params.id)
      const drop = deptSubtreeIds(id)
      return db.ok(db.depts.filter((d) => !drop.has(d.deptId)))
    },
  },
  {
    method: 'get',
    pattern: '/system/dept/:id',
    handler: ({ params }) => {
      const dept = db.depts.find((d) => d.deptId === Number(params.id))
      return dept ? db.ok(dept) : db.fail('部门不存在')
    },
  },
  {
    method: 'post',
    pattern: '/system/dept',
    handler: ({ body }) => {
      const parent = db.depts.find((d) => d.deptId === Number(body.parentId))
      const dept: SysDept = {
        deptId: db.nextId(), parentId: Number(body.parentId ?? 0),
        ancestors: parent ? `${parent.ancestors},${parent.deptId}` : '0',
        deptName: String(body.deptName), orderNum: Number(body.orderNum ?? 0),
        leader: String(body.leader ?? ''), phone: String(body.phone ?? ''), email: String(body.email ?? ''),
        status: String(body.status ?? '0'), createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      db.depts.push(dept)
      return db.ok()
    },
  },
  {
    method: 'put',
    pattern: '/system/dept',
    handler: ({ body }) => {
      const dept = db.depts.find((d) => d.deptId === Number(body.deptId))
      if (!dept) return db.fail('部门不存在')
      Object.assign(dept, body)
      return db.ok()
    },
  },
  {
    method: 'delete',
    pattern: '/system/dept/:id',
    handler: ({ params }) => {
      const id = Number(params.id)
      if (db.depts.some((d) => d.parentId === id)) return db.fail('存在下级部门，不允许删除')
      if (db.users.some((u) => u.deptId === id)) return db.fail('部门存在用户，不允许删除')
      const i = db.depts.findIndex((d) => d.deptId === id)
      if (i >= 0) db.depts.splice(i, 1)
      return db.ok()
    },
  },

  /* ---------- 字典 ---------- */
  {
    method: 'get',
    pattern: '/system/dict/type/list',
    handler: ({ query }) => {
      const list = db.dictTypes.filter((t) => like(t.dictName, query.dictName) && like(t.dictType, query.dictType) && eq(t.status, query.status))
      return db.page(...Object.values(paginate(list, query)) as [typeof list, number])
    },
  },
  {
    method: 'get',
    pattern: '/system/dict/type/:id',
    handler: ({ params }) => {
      const t = db.dictTypes.find((x) => x.dictId === Number(params.id))
      return t ? db.ok(t) : db.fail('字典类型不存在')
    },
  },
  {
    method: 'post',
    pattern: '/system/dict/type',
    handler: ({ body }) => {
      if (db.dictTypes.some((t) => t.dictType === body.dictType)) return db.fail(`新增字典「${body.dictName}」失败：字典类型已存在`)
      const t: SysDictType = {
        dictId: db.nextId(), dictName: String(body.dictName), dictType: String(body.dictType),
        status: String(body.status ?? '0'), remark: String(body.remark ?? ''),
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      db.dictTypes.push(t)
      return db.ok()
    },
  },
  {
    method: 'put',
    pattern: '/system/dict/type',
    handler: ({ body }) => {
      const t = db.dictTypes.find((x) => x.dictId === Number(body.dictId))
      if (!t) return db.fail('字典类型不存在')
      const oldType = t.dictType
      Object.assign(t, body)
      if (String(body.dictType) !== oldType) {
        db.dictDatas.forEach((d) => { if (d.dictType === oldType) d.dictType = String(body.dictType) })
      }
      return db.ok()
    },
  },
  {
    method: 'delete',
    pattern: '/system/dict/type/:ids',
    handler: ({ params }) => {
      for (const id of params.ids.split(',').map(Number)) {
        const t = db.dictTypes.find((x) => x.dictId === id)
        if (!t) continue
        if (db.dictDatas.some((d) => d.dictType === t.dictType)) return db.fail(`${t.dictName} 已分配字典数据，不能删除`)
        const i = db.dictTypes.indexOf(t)
        db.dictTypes.splice(i, 1)
      }
      return db.ok()
    },
  },
  {
    method: 'get',
    pattern: '/system/dict/data/list',
    handler: ({ query }) => {
      const list = db.dictDatas
        .filter((d) => eq(d.dictType, query.dictType) && like(d.dictLabel, query.dictLabel) && eq(d.status, query.status))
        .sort((a, b) => a.dictSort - b.dictSort)
      return db.page(...Object.values(paginate(list, query)) as [typeof list, number])
    },
  },
  {
    method: 'get',
    pattern: '/system/dict/data/type/:type',
    handler: ({ params }) => db.ok(
      db.dictDatas.filter((d) => d.dictType === params.type && d.status === '0').sort((a, b) => a.dictSort - b.dictSort),
    ),
  },
  {
    method: 'get',
    pattern: '/system/dict/data/:id',
    handler: ({ params }) => {
      const d = db.dictDatas.find((x) => x.dictCode === Number(params.id))
      return d ? db.ok(d) : db.fail('字典数据不存在')
    },
  },
  {
    method: 'post',
    pattern: '/system/dict/data',
    handler: ({ body }) => {
      const d: SysDictData = {
        dictCode: db.nextId(), dictType: String(body.dictType), dictLabel: String(body.dictLabel),
        dictValue: String(body.dictValue), dictSort: Number(body.dictSort ?? 0),
        cssClass: String(body.cssClass ?? ''), listClass: String(body.listClass ?? ''),
        isDefault: String(body.isDefault ?? 'N'), status: String(body.status ?? '0'),
        remark: String(body.remark ?? ''), createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      db.dictDatas.push(d)
      return db.ok()
    },
  },
  {
    method: 'put',
    pattern: '/system/dict/data',
    handler: ({ body }) => {
      const d = db.dictDatas.find((x) => x.dictCode === Number(body.dictCode))
      if (!d) return db.fail('字典数据不存在')
      Object.assign(d, body)
      return db.ok()
    },
  },
  {
    method: 'delete',
    pattern: '/system/dict/data/:ids',
    handler: ({ params }) => {
      for (const id of params.ids.split(',').map(Number)) {
        const i = db.dictDatas.findIndex((x) => x.dictCode === id)
        if (i >= 0) db.dictDatas.splice(i, 1)
      }
      return db.ok()
    },
  },

  /* ---------- 参数 ---------- */
  {
    method: 'get',
    pattern: '/system/config/list',
    handler: ({ query }) => {
      const list = db.configs.filter((c) => like(c.configName, query.configName) && like(c.configKey, query.configKey))
      return db.page(...Object.values(paginate(list, query)) as [typeof list, number])
    },
  },
  {
    method: 'get',
    pattern: '/system/config/configKey/:key',
    handler: ({ params }) => {
      const c = db.configs.find((x) => x.configKey === params.key)
      return c ? db.ok(c.configValue) : db.fail('参数键名不存在')
    },
  },
  {
    method: 'get',
    pattern: '/system/config/:id',
    handler: ({ params }) => {
      const c = db.configs.find((x) => x.configId === Number(params.id))
      return c ? db.ok(c) : db.fail('参数不存在')
    },
  },
  {
    method: 'post',
    pattern: '/system/config',
    handler: ({ body }) => {
      if (db.configs.some((c) => c.configKey === body.configKey)) return db.fail(`新增参数「${body.configName}」失败：参数键名已存在`)
      db.configs.push({
        configId: db.nextId(), configName: String(body.configName), configKey: String(body.configKey),
        configValue: String(body.configValue), configType: String(body.configType ?? 'N'),
        remark: String(body.remark ?? ''), createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      return db.ok()
    },
  },
  {
    method: 'put',
    pattern: '/system/config',
    handler: ({ body }) => {
      const c = db.configs.find((x) => x.configId === Number(body.configId))
      if (!c) return db.fail('参数不存在')
      Object.assign(c, body)
      return db.ok()
    },
  },
  {
    method: 'delete',
    pattern: '/system/config/:ids',
    handler: ({ params }) => {
      for (const id of params.ids.split(',').map(Number)) {
        const i = db.configs.findIndex((x) => x.configId === id)
        if (i >= 0) db.configs.splice(i, 1)
      }
      return db.ok()
    },
  },

  /* ---------- 日志 ---------- */
  {
    method: 'get',
    pattern: '/monitor/operlog/list',
    handler: ({ query }) => {
      const list = db.operLogs.filter((l) => like(l.title, query.title) && like(l.operName, query.operName)
        && eq(l.businessType, query.businessType) && eq(l.status, query.status))
      return db.page(...Object.values(paginate(list, query)) as [typeof list, number])
    },
  },
  { method: 'delete', pattern: '/monitor/operlog/clean', handler: () => { db.operLogs.length = 0; return db.ok() } },
  {
    method: 'delete',
    pattern: '/monitor/operlog/:ids',
    handler: ({ params }) => {
      for (const id of params.ids.split(',').map(Number)) {
        const i = db.operLogs.findIndex((x) => x.operId === id)
        if (i >= 0) db.operLogs.splice(i, 1)
      }
      return db.ok()
    },
  },
  {
    method: 'get',
    pattern: '/monitor/logininfor/list',
    handler: ({ query }) => {
      const list = db.loginLogs.filter((l) => like(l.userName, query.userName) && like(l.ipaddr, query.ipaddr) && eq(l.status, query.status))
      return db.page(...Object.values(paginate(list, query)) as [typeof list, number])
    },
  },
  { method: 'delete', pattern: '/monitor/logininfor/clean', handler: () => { db.loginLogs.length = 0; return db.ok() } },
  {
    method: 'delete',
    pattern: '/monitor/logininfor/:ids',
    handler: ({ params }) => {
      for (const id of params.ids.split(',').map(Number)) {
        const i = db.loginLogs.findIndex((x) => x.infoId === id)
        if (i >= 0) db.loginLogs.splice(i, 1)
      }
      return db.ok()
    },
  },

  /* ---------- 示例文章 ---------- */
  {
    method: 'get',
    pattern: '/demo/article/list',
    handler: ({ query }) => {
      const list = db.articles.filter((a) => like(a.title, query.title) && like(a.author, query.author) && eq(a.status, query.status))
      return db.page(...Object.values(paginate(list, query)) as [typeof list, number])
    },
  },
  {
    method: 'get',
    pattern: '/demo/article/:id',
    handler: ({ params }) => {
      const a = db.articles.find((x) => x.articleId === Number(params.id))
      return a ? db.ok(a) : db.fail('文章不存在')
    },
  },
  {
    method: 'post',
    pattern: '/demo/article',
    handler: ({ body, username }) => {
      const a: DemoArticle = {
        articleId: db.nextId(), title: String(body.title), summary: String(body.summary ?? ''),
        content: String(body.content ?? ''), author: username ?? 'admin',
        status: String(body.status ?? '0'),
        publishTime: body.status === '1' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : undefined,
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      db.articles.unshift(a)
      return db.ok()
    },
  },
  {
    method: 'put',
    pattern: '/demo/article',
    handler: ({ body }) => {
      const a = db.articles.find((x) => x.articleId === Number(body.articleId))
      if (!a) return db.fail('文章不存在')
      Object.assign(a, body)
      return db.ok()
    },
  },
  {
    method: 'delete',
    pattern: '/demo/article/:ids',
    handler: ({ params }) => {
      for (const id of params.ids.split(',').map(Number)) {
        const i = db.articles.findIndex((x) => x.articleId === id)
        if (i >= 0) db.articles.splice(i, 1)
      }
      return db.ok()
    },
  },

  /* ---------- 角色（menuIds 保存，供 roleMenuTreeselect） ---------- */
  {
    method: 'put',
    pattern: '/system/role/authMenu',
    handler: ({ body }) => {
      const role = db.roles.find((r) => r.roleId === Number(body.roleId))
      if (!role) return db.fail('角色不存在')
      role.menuIds = (body.menuIds as number[]) ?? []
      return db.ok()
    },
  },
]

/* ===================== 分发 ===================== */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function handleMock(config: InternalAxiosRequestConfig): Promise<Record<string, unknown>> {
  await sleep(120 + Math.random() * 180)

  const method = (config.method ?? 'get').toLowerCase()
  let path = (config.url ?? '').split('?')[0]
  if (!path.startsWith('/')) path = '/' + path

  // 白名单放行；其余校验 token
  const auth = (config.headers?.Authorization ?? '') as string
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined
  let username: string | undefined
  if (!WHITELIST.includes(path)) {
    username = token ? db.state.token2user.get(token) : undefined
    // 整页刷新后内存映射丢失：token 内嵌用户名，重建映射（模拟后端 Redis 30 天会话）
    if (!username && token?.startsWith('mock-')) {
      const name = token.split('-')[1]
      if (name && db.users.some((u) => u.userName === name)) {
        db.state.token2user.set(token, name)
        username = name
      }
    }
    if (!username) return db.fail('登录已过期，请重新登录', 401)
  }

  let body: Record<string, unknown> = {}
  if (typeof config.data === 'string' && config.data) {
    try { body = JSON.parse(config.data) } catch { body = {} }
  } else if (config.data && typeof config.data === 'object') {
    body = config.data as Record<string, unknown>
  }

  for (const route of routes) {
    if (route.method !== method) continue
    const params = matchRoute(route.pattern, path)
    if (!params) continue
    const ctx: Ctx = { params, query: (config.params ?? {}) as Record<string, unknown>, body, token, username }
    try {
      return route.handler(ctx) as Record<string, unknown>
    } catch (e) {
      return db.fail(e instanceof Error ? e.message : 'mock 处理异常')
    }
  }
  return db.fail(`mock 未实现：${method.toUpperCase()} ${path}`)
}

/** 供 request.ts 挂接 */
export async function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const data = await handleMock(config)
  return { data, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse
}
