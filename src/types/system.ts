/** 系统模块实体（对齐后端 17 实体模型中管理端消费的部分，字段命名 camelCase 对齐 RuoYi-Vue3） */

export interface LoginUser {
  userId: number
  deptId?: number
  userName: string
  nickName: string
  avatar?: string
  email?: string
  phonenumber?: string
  sex?: string
  admin?: boolean
  remark?: string
  createTime?: string
  [key: string]: unknown
}

/** /getRouters 返回的动态路由（RuoYi-Vue3 RouterVO 结构） */
export interface RouterVO {
  name: string
  path: string
  hidden?: boolean
  redirect?: string
  component: string
  alwaysShow?: boolean
  meta: {
    title: string
    icon?: string
    noCache?: boolean
    link?: string | null
  }
  children?: RouterVO[]
}

export interface SysUser {
  userId: number
  deptId?: number
  dept?: { deptId: number; deptName: string } | null
  userName: string
  nickName: string
  email?: string
  phonenumber?: string
  sex?: string
  avatar?: string
  status: string
  loginIp?: string
  loginDate?: string
  createTime?: string
  remark?: string
  roleIds?: number[]
  roleNames?: string[]
  [key: string]: unknown
}

export interface SysRole {
  roleId: number
  roleName: string
  roleKey: string
  roleSort: number
  status: string
  menuCheckStrictly?: boolean
  menuIds?: number[]
  remark?: string
  createTime?: string
  [key: string]: unknown
}

export type MenuType = 'M' | 'C' | 'F'

export interface SysMenu {
  menuId: number
  menuName: string
  parentId: number
  orderNum: number
  path: string
  component?: string
  query?: string
  menuType: MenuType
  visible?: string
  status: string
  perms?: string
  icon?: string
  children?: SysMenu[]
  createTime?: string
  remark?: string
  [key: string]: unknown
}

export interface TreeSelect {
  id: number
  label: string
  children?: TreeSelect[]
}

export interface SysDept {
  deptId: number
  parentId: number
  ancestors?: string
  deptName: string
  orderNum: number
  leader?: string
  phone?: string
  email?: string
  status: string
  createTime?: string
  children?: SysDept[]
  [key: string]: unknown
}

export interface SysDictType {
  dictId: number
  dictName: string
  dictType: string
  status: string
  remark?: string
  createTime?: string
  [key: string]: unknown
}

export interface SysDictData {
  dictCode: number
  dictType: string
  dictLabel: string
  dictValue: string
  dictSort: number
  cssClass?: string
  listClass?: string
  isDefault?: string
  status: string
  remark?: string
  createTime?: string
  [key: string]: unknown
}

export interface SysConfig {
  configId: number
  configName: string
  configKey: string
  configValue: string
  configType?: string
  remark?: string
  createTime?: string
  [key: string]: unknown
}

export interface OperLog {
  operId: number
  title: string
  businessType: number
  businessTypeName?: string
  method: string
  requestMethod?: string
  operName: string
  operUrl?: string
  operIp?: string
  operLocation?: string
  operParam?: string
  jsonResult?: string
  status: number
  errorMsg?: string
  costTime?: number
  operTime?: string
  [key: string]: unknown
}

export interface LoginLog {
  infoId: number
  userName: string
  ipaddr: string
  loginLocation?: string
  browser?: string
  os?: string
  status: string
  msg?: string
  loginTime?: string
  [key: string]: unknown
}
