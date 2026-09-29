/**
 * Mock 内存数据库：数据结构对齐后端 17 实体模型与 RuoYi 种子数据形态。
 * 菜单为唯一源（flat），getRouters 的 RouterVO 与菜单管理页树表均由它派生。
 */
import type {
  LoginLog,
  OperLog,
  RouterVO,
  SysConfig,
  SysDept,
  SysDictData,
  SysDictType,
  SysMenu,
  SysRole,
  SysUser,
} from '@/types/system'
import type { DemoArticle } from '@/types/demo'

export interface MockUser extends SysUser {
  password: string
  roleKeys: string[]
}

export function ok<T>(data: T = null as T, msg = '操作成功') {
  return { code: 200, msg, data }
}

export function fail(msg: string, code = 500) {
  return { code, msg, data: null }
}

export function page<T>(rows: T[], total: number, msg = '查询成功') {
  return { code: 200, msg, rows, total }
}

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86400000).toISOString().slice(0, 19).replace('T', ' ')

/* ===================== 部门 ===================== */
export const depts: SysDept[] = [
  { deptId: 100, parentId: 0, ancestors: '0', deptName: 'Dipankara Tech', orderNum: 0, leader: '若依', phone: '15888888888', email: 'ry@qq.com', status: '0', createTime: daysAgo(60) },
  { deptId: 101, parentId: 100, ancestors: '0,100', deptName: '深圳总公司', orderNum: 1, leader: 'scaffold', phone: '15888888811', email: 'sz@qq.com', status: '0', createTime: daysAgo(60) },
  { deptId: 102, parentId: 101, ancestors: '0,100,101', deptName: '研发部门', orderNum: 1, leader: 'seed', phone: '15888888812', email: 'rd@qq.com', status: '0', createTime: daysAgo(60) },
  { deptId: 103, parentId: 101, ancestors: '0,100,101', deptName: '测试部门', orderNum: 2, leader: 'qa', phone: '15888888813', email: 'qa@qq.com', status: '0', createTime: daysAgo(60) },
  { deptId: 104, parentId: 100, ancestors: '0,100', deptName: '市场部门', orderNum: 2, leader: 'mk', phone: '15888888814', email: 'mk@qq.com', status: '1', createTime: daysAgo(60) },
]

/* ===================== 用户 ===================== */
export const users: MockUser[] = [
  { userId: 1, deptId: 102, userName: 'admin', nickName: '脚手架管理员', password: 'admin123', email: 'admin@scaffoldseed.dev', phonenumber: '15888888888', sex: '0', status: '0', loginIp: '127.0.0.1', loginDate: daysAgo(0), createTime: daysAgo(60), remark: '超级管理员', roleKeys: ['admin'] },
  { userId: 2, deptId: 102, userName: 'seed', nickName: '接单演示账号', password: 'user123', email: 'seed@scaffoldseed.dev', phonenumber: '15666666666', sex: '1', status: '0', loginIp: '192.168.1.10', loginDate: daysAgo(1), createTime: daysAgo(30), remark: '普通角色演示', roleKeys: ['common'] },
  { userId: 3, deptId: 103, userName: 'qa', nickName: '测试同学', password: 'user123', email: 'qa@scaffoldseed.dev', phonenumber: '15777777777', sex: '2', status: '0', loginIp: '10.0.0.8', loginDate: daysAgo(2), createTime: daysAgo(25), remark: '', roleKeys: ['common'] },
  { userId: 4, deptId: 104, userName: 'mk01', nickName: '市场一号', password: 'user123', email: 'mk01@scaffoldseed.dev', phonenumber: '15555555555', sex: '0', status: '1', loginIp: '', loginDate: daysAgo(9), createTime: daysAgo(20), remark: '已停用演示', roleKeys: ['common'] },
]

/* ===================== 角色 ===================== */
export const roles: SysRole[] = [
  { roleId: 1, roleName: '超级管理员', roleKey: 'admin', roleSort: 1, status: '0', remark: '拥有全部权限', createTime: daysAgo(60), menuIds: [] },
  { roleId: 2, roleName: '普通角色', roleKey: 'common', roleSort: 2, status: '0', remark: '仅演示权限差异', createTime: daysAgo(30), menuIds: [1, 100, 1001, 1005, 1006, 3, 1010, 1011] },
]

/** 普通角色的显式权限（admin 为 *:*:* 通配） */
export const commonPermissions = [
  'system:user:list', 'system:user:query',
  'system:dict:list', 'system:dict:query',
  'monitor:operlog:list', 'monitor:operlog:query',
]

/* ===================== 菜单（唯一源，flat） ===================== */
const m = (
  menuId: number, menuName: string, parentId: number, orderNum: number,
  menuType: SysMenu['menuType'], path: string, perms: string,
  component?: string, icon?: string,
): SysMenu => ({
  menuId, menuName, parentId, orderNum, menuType, path, perms,
  component: component ?? '', icon: icon ?? '#', status: '0', visible: '0',
  createTime: daysAgo(60),
})

export const menus: SysMenu[] = [
  // 一级目录：系统管理
  m(1, '系统管理', 0, 1, 'M', 'system', '', '', 'system'),
  m(1001, '用户管理', 1, 1, 'C', 'user', 'system:user:list', 'system/user/index', 'user'),
  m(1002, '角色管理', 1, 2, 'C', 'role', 'system:role:list', 'system/role/index', 'peoples'),
  m(1003, '菜单管理', 1, 3, 'C', 'menu', 'system:menu:list', 'system/menu/index', 'tree-table'),
  m(1004, '部门管理', 1, 4, 'C', 'dept', 'system:dept:list', 'system/dept/index', 'tree'),
  m(1005, '字典管理', 1, 5, 'C', 'dict', 'system:dict:list', 'system/dict/index', 'dict'),
  m(1006, '参数设置', 1, 6, 'C', 'config', 'system:config:list', 'system/config/index', 'edit'),
  // 用户管理按钮
  m(1007, '用户查询', 1001, 1, 'F', '', 'system:user:query'),
  m(1008, '用户新增', 1001, 2, 'F', '', 'system:user:add'),
  m(1009, '用户修改', 1001, 3, 'F', '', 'system:user:edit'),
  m(1013, '用户删除', 1001, 4, 'F', '', 'system:user:remove'),
  m(1014, '重置密码', 1001, 5, 'F', '', 'system:user:resetPwd'),
  // 角色按钮
  m(1015, '角色查询', 1002, 1, 'F', '', 'system:role:query'),
  m(1016, '角色新增', 1002, 2, 'F', '', 'system:role:add'),
  m(1017, '角色修改', 1002, 3, 'F', '', 'system:role:edit'),
  m(1018, '角色删除', 1002, 4, 'F', '', 'system:role:remove'),
  // 菜单按钮
  m(1019, '菜单查询', 1003, 1, 'F', '', 'system:menu:query'),
  m(1020, '菜单新增', 1003, 2, 'F', '', 'system:menu:add'),
  m(1021, '菜单修改', 1003, 3, 'F', '', 'system:menu:edit'),
  m(1022, '菜单删除', 1003, 4, 'F', '', 'system:menu:remove'),
  // 部门按钮
  m(1023, '部门查询', 1004, 1, 'F', '', 'system:dept:query'),
  m(1024, '部门新增', 1004, 2, 'F', '', 'system:dept:add'),
  m(1025, '部门修改', 1004, 3, 'F', '', 'system:dept:edit'),
  m(1026, '部门删除', 1004, 4, 'F', '', 'system:dept:remove'),
  // 字典按钮
  m(1027, '字典查询', 1005, 1, 'F', '', 'system:dict:query'),
  m(1028, '字典新增', 1005, 2, 'F', '', 'system:dict:add'),
  m(1029, '字典修改', 1005, 3, 'F', '', 'system:dict:edit'),
  m(1030, '字典删除', 1005, 4, 'F', '', 'system:dict:remove'),
  // 参数按钮
  m(1031, '参数查询', 1006, 1, 'F', '', 'system:config:query'),
  m(1032, '参数新增', 1006, 2, 'F', '', 'system:config:add'),
  m(1033, '参数修改', 1006, 3, 'F', '', 'system:config:edit'),
  m(1034, '参数删除', 1006, 4, 'F', '', 'system:config:remove'),

  // 一级目录：系统监控
  m(3, '系统监控', 0, 2, 'M', 'monitor', '', '', 'monitor'),
  m(1010, '操作日志', 3, 1, 'C', 'operlog', 'monitor:operlog:list', 'monitor/operlog/index', 'form'),
  m(1011, '登录日志', 3, 2, 'C', 'logininfor', 'monitor:logininfor:list', 'monitor/logininfor/index', 'logininfor'),
  m(1012, '服务监控', 3, 3, 'C', 'server', 'monitor:server:list', 'monitor/server/index', 'server'),
  m(1035, '日志查询', 1010, 1, 'F', '', 'monitor:operlog:query'),
  m(1036, '日志删除', 1010, 2, 'F', '', 'monitor:operlog:remove'),
  m(1037, '日志查询', 1011, 1, 'F', '', 'monitor:logininfor:query'),
  m(1038, '日志删除', 1011, 2, 'F', '', 'monitor:logininfor:remove'),

  // 一级目录：示例演示
  m(5, '示例演示', 0, 4, 'M', 'demo', '', '', 'example'),
  m(1060, '文章管理', 5, 1, 'C', 'article', 'demo:article:list', 'demo/article/index', 'documentation'),
  m(1061, '文章查询', 1060, 1, 'F', '', 'demo:article:query'),
  m(1062, '文章新增', 1060, 2, 'F', '', 'demo:article:add'),
  m(1063, '文章修改', 1060, 3, 'F', '', 'demo:article:edit'),
  m(1064, '文章删除', 1060, 4, 'F', '', 'demo:article:remove'),
]

/* ===================== 字典 ===================== */
export const dictTypes: SysDictType[] = [
  { dictId: 1, dictName: '用户性别', dictType: 'sys_user_sex', status: '0', remark: '用户性别列表', createTime: daysAgo(60) },
  { dictId: 2, dictName: '系统开关', dictType: 'sys_normal_disable', status: '0', remark: '通用启停状态', createTime: daysAgo(60) },
  { dictId: 3, dictName: '操作类型', dictType: 'sys_oper_type', status: '0', remark: '操作日志业务类型', createTime: daysAgo(60) },
  { dictId: 4, dictName: '文章状态', dictType: 'demo_article_status', status: '0', remark: '示例文章发布状态', createTime: daysAgo(15) },
]

export const dictDatas: SysDictData[] = [
  { dictCode: 1, dictType: 'sys_user_sex', dictLabel: '男', dictValue: '0', dictSort: 1, listClass: '', isDefault: 'Y', status: '0', createTime: daysAgo(60) },
  { dictCode: 2, dictType: 'sys_user_sex', dictLabel: '女', dictValue: '1', dictSort: 2, listClass: '', isDefault: 'N', status: '0', createTime: daysAgo(60) },
  { dictCode: 3, dictType: 'sys_user_sex', dictLabel: '未知', dictValue: '2', dictSort: 3, listClass: '', isDefault: 'N', status: '0', createTime: daysAgo(60) },
  { dictCode: 4, dictType: 'sys_normal_disable', dictLabel: '正常', dictValue: '0', dictSort: 1, listClass: 'primary', isDefault: 'Y', status: '0', createTime: daysAgo(60) },
  { dictCode: 5, dictType: 'sys_normal_disable', dictLabel: '停用', dictValue: '1', dictSort: 2, listClass: 'danger', isDefault: 'N', status: '0', createTime: daysAgo(60) },
  { dictCode: 6, dictType: 'sys_oper_type', dictLabel: '新增', dictValue: '1', dictSort: 1, listClass: 'info', status: '0', createTime: daysAgo(60) },
  { dictCode: 7, dictType: 'sys_oper_type', dictLabel: '修改', dictValue: '2', dictSort: 2, listClass: 'info', status: '0', createTime: daysAgo(60) },
  { dictCode: 8, dictType: 'sys_oper_type', dictLabel: '删除', dictValue: '3', dictSort: 3, listClass: 'danger', status: '0', createTime: daysAgo(60) },
  { dictCode: 9, dictType: 'sys_oper_type', dictLabel: '导出', dictValue: '5', dictSort: 4, listClass: 'warning', status: '0', createTime: daysAgo(60) },
  { dictCode: 10, dictType: 'demo_article_status', dictLabel: '草稿', dictValue: '0', dictSort: 1, listClass: 'info', status: '0', createTime: daysAgo(15) },
  { dictCode: 11, dictType: 'demo_article_status', dictLabel: '发布', dictValue: '1', dictSort: 2, listClass: 'primary', status: '0', createTime: daysAgo(15) },
  { dictCode: 12, dictType: 'demo_article_status', dictLabel: '下架', dictValue: '2', dictSort: 3, listClass: 'danger', status: '0', createTime: daysAgo(15) },
]

/* ===================== 系统参数 ===================== */
export const configs: SysConfig[] = [
  { configId: 1, configName: '是否开启验证码', configKey: 'sys.account.captchaEnabled', configValue: 'true', configType: 'Y', remark: '登录页验证码开关', createTime: daysAgo(60) },
  { configId: 2, configName: '用户初始密码', configKey: 'sys.user.initPassword', configValue: '123456', configType: 'Y', remark: '新增用户初始密码', createTime: daysAgo(60) },
  { configId: 3, configName: '服务器端口', configKey: 'sys.server.port', configValue: '8080', configType: 'N', remark: '脚手架默认端口示例', createTime: daysAgo(30) },
  { configId: 4, configName: '索引页皮肤', configKey: 'sys.index.skinName', configValue: 'skin-blue', configType: 'N', remark: '保留的 RuoYi 皮肤参数示例', createTime: daysAgo(30) },
]

/* ===================== 日志 ===================== */
const operSeeds: Array<[string, number, string, string, string, number, string]> = [
  ['用户管理', 2, 'com.scaffoldseed.modules.system.controller.SysUserController.updateUser()', 'PUT /system/user', 'admin', 0, '正常'],
  ['用户管理', 1, 'com.scaffoldseed.modules.system.controller.SysUserController.addUser()', 'POST /system/user', 'admin', 1, '正常'],
  ['角色管理', 3, 'com.scaffoldseed.modules.system.controller.SysRoleController.delRole()', 'DELETE /system/role/2', 'admin', 2, '正常'],
  ['字典管理', 2, 'com.scaffoldseed.modules.system.controller.SysDictTypeController.updateDictType()', 'PUT /system/dict/type', 'admin', 1, '正常'],
  ['文章管理', 1, 'com.scaffoldseed.modules.demo.controller.DemoArticleController.addArticle()', 'POST /demo/article', 'seed', 3, '正常'],
  ['用户管理', 4, 'com.scaffoldseed.modules.system.controller.SysUserController.resetPwd()', 'PUT /system/user/resetPwd', 'admin', 5, '正常'],
  ['参数管理', 2, 'com.scaffoldseed.modules.system.controller.SysConfigController.updateConfig()', 'PUT /system/config', 'admin', 2, '正常'],
  ['登录日志', 3, 'com.scaffoldseed.modules.monitor.controller.LoginLogController.clean()', 'DELETE /monitor/logininfor/clean', 'admin', 8, '正常'],
]

export const operLogs: OperLog[] = operSeeds.map((s, i) => ({
  operId: i + 1,
  title: s[0], businessType: s[1], method: s[2], operUrl: s[3],
  requestMethod: s[3].split(' ')[0],
  operName: s[4], operIp: `192.168.1.${100 + i}`, operLocation: '内网',
  operParam: '{}', jsonResult: '{"code":200,"msg":"操作成功"}',
  status: 0, errorMsg: '', costTime: 20 + i * 13, operTime: daysAgo(i),
}))

const loginSeeds: Array<[string, string, string, number]> = [
  ['admin', '127.0.0.1', 'Chrome 13 · macOS', 0],
  ['seed', '192.168.1.23', 'Safari 18 · macOS', 0],
  ['qa', '10.0.0.8', 'Edge 130 · Windows', 0],
  ['admin', '127.0.0.1', 'Chrome 13 · macOS', 0],
  ['mk01', '172.16.2.5', 'Firefox 141 · Linux', 1],
  ['admin', '127.0.0.1', 'api-docs · curl', 1],
]

export const loginLogs: LoginLog[] = loginSeeds.map((s, i) => ({
  infoId: i + 1,
  userName: s[0], ipaddr: s[1], browser: s[2], os: '',
  status: String(s[3]), msg: s[3] === 0 ? '登录成功' : '密码错误',
  loginTime: daysAgo(i),
}))

/* ===================== 示例文章 ===================== */
export const articles: DemoArticle[] = [
  { articleId: 1, title: '脚手架快速上手：一条命令生成新项目', summary: 'cookiecutter 生成、建库、配置 local、启动四步走。', content: 'cookiecutter 生成项目后，按 README 四步操作……', author: 'admin', status: '1', publishTime: daysAgo(5), createTime: daysAgo(5) },
  { articleId: 2, title: 'RBAC 权限模型速查', summary: 'role-menu-perms 三表结构速查表。', content: '角色-菜单-按钮权限……', author: 'admin', status: '1', publishTime: daysAgo(4), createTime: daysAgo(4) },
  { articleId: 4, title: 'C 端接口模板接单指南', summary: 'member 模块 TODO 语义接口如何补真实实现。', content: '短信/微信登录接入点……', author: 'seed', status: '1', publishTime: daysAgo(2), createTime: daysAgo(2) },
  { articleId: 5, title: '字典与参数缓存机制说明', summary: 'Redis 缓存即时刷新策略。', content: 'DictUtils 更新即刷新……', author: 'qa', status: '1', publishTime: daysAgo(1), createTime: daysAgo(1) },
  { articleId: 6, title: '旧版部署手册（已废弃）', summary: 'v0 时代的手工部署流程存档。', content: '……', author: 'admin', status: '2', createTime: daysAgo(30) },
]

/* ===================== 运行时状态 ===================== */
export const state = {
  seq: 2000,
  captcha: new Map<string, string>(),
  token2user: new Map<string, string>(),
}

export function nextId(): number {
  state.seq += 1
  return state.seq
}

export function deptName(deptId?: number): string {
  return depts.find((d) => d.deptId === deptId)?.deptName ?? ''
}

export function roleNames(user: MockUser): string[] {
  return user.roleKeys.map((k) => roles.find((r) => r.roleKey === k)?.roleName ?? k)
}

/** SysMenu flat → 管理页树 */
export function buildMenuTree(list: SysMenu[], parentId = 0): SysMenu[] {
  return list
    .filter((x) => x.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum)
    .map((x) => ({ ...x, children: buildMenuTree(list, x.menuId) }))
}

export function buildDeptTree(list: SysDept[], parentId = 0): SysDept[] {
  return list
    .filter((x) => x.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum)
    .map((x) => ({ ...x, children: buildDeptTree(list, x.deptId) }))
}

export function menuTreeSelect(parentId = 0): { id: number; label: string; children: unknown[] }[] {
  return menus
    .filter((x) => x.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum)
    .map((x) => ({ id: x.menuId, label: x.menuName, children: menuTreeSelect(x.menuId) }))
}

export function deptTreeSelect(parentId = 0): { id: number; label: string; children: unknown[] }[] {
  return depts
    .filter((x) => x.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum)
    .map((x) => ({ id: x.deptId, label: x.deptName, children: deptTreeSelect(x.deptId) }))
}

/** SysMenu flat → /getRouters 的 RouterVO（对齐 RuoYi-Vue3 结构） */
export function buildRouters(username: string): RouterVO[] {
  const isAdmin = username === 'admin'
  const role = roles.find((r) => r.roleKey === (isAdmin ? 'admin' : 'common'))
  const visible = (menuId: number) => isAdmin || (role?.menuIds ?? []).includes(menuId)

  const roots = menus.filter((x) => x.parentId === 0 && x.menuType === 'M')
  return roots.map((dir) => {
    const children = menus
      .filter((x) => x.parentId === dir.menuId && x.menuType === 'C' && visible(dir.menuId) && visible(x.menuId))
      .sort((a, b) => a.orderNum - b.orderNum)
      .map((c) => ({
        name: c.path.replace(/(^|[-_])(\w)/g, (_, s, ch) => (s ? ch.toUpperCase() : ch.toUpperCase())),
        path: c.path,
        component: c.component ?? '',
        hidden: c.visible === '1',
        meta: { title: c.menuName, icon: c.icon, noCache: false },
      }))
    return {
      name: dir.path.replace(/^(\w)/, (ch) => ch.toUpperCase()),
      path: `/${dir.path}`,
      redirect: children[0] ? `/${dir.path}/${children[0].path}` : undefined,
      component: 'Layout',
      alwaysShow: true,
      hidden: dir.visible === '1' || children.length === 0,
      meta: { title: dir.menuName, icon: dir.icon, noCache: false },
      children,
    }
  }).filter((d) => !d.hidden)
}
