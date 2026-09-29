# ScaffoldSeed Admin

[cookiecutter-java-scaffold](../cookiecutter-java-scaffold/) 配套管理后台前端。**独立工程、前后端分离**；接口契约锚定后端六接口集（RuoYi-Vue3 契约）；UI 采用 [Notion Style](https://www.stylekit.top/zh/styles/notion-style)。

## 技术栈

Vue 3.5 · TypeScript · Vite 6 · Pinia · Vue Router · Tailwind CSS 4 · Axios

## 快速开始

```bash
npm install
npm run dev          # http://localhost:5173（真实模式见下）
npm run typecheck    # vue-tsc
npm run build        # 生产构建
```

**默认账号**：`admin / admin123`（真实接口与 mock 通用；mock 模式另有 `seed / user123` 受限账号演示 `v-perm`）

## Mock ↔ 真实接口

前端所有请求经 `src/api/request.ts` 单点封装，`.env.development` 中：

```
VITE_USE_MOCK=true     # 内置 mock（内存数据，离线开发用；与后端契约逐字对齐）
VITE_PROXY_TARGET=http://localhost:8080   # 后端地址（生成项目的 server_port）
```

**当前状态（2026-09-29）：后端全部模块已就绪并完成全模块实机走查**（45 断言全过，报告见 `../.omc/handoffs/real-mode-ready.md`）。仓内 `.env.development.local` 已设 `VITE_USE_MOCK=false`（优先级更高）——`npm run dev` 即真实模式；需要离线 mock 开发时把它改成 `true` 或删除该文件。

后端启动（日常联调）：

```bash
cd ../cookiecutter-java-scaffold && make smoke
sed 's/scaffold_dev/demo_app/' scripts/dev-local.yml > .smoke/demo_app/src/main/resources/application-local.yml
cd .smoke/demo_app && mvn spring-boot:run
```

| 前端模块（视图路径） | 契约接口 | 实测状态 |
|---|---|---|
| login、system/user、system/role、system/menu、system/dept、monitor/operlog、monitor/logininfor | `/login` `/logout` `/getInfo` `/getRouters` `/captchaImage` + 各 CRUD | ✅ 实机走查过（含用户/角色完整 CRUD+权限树） |
| system/dict（+dict/data）、system/config | `/system/dict/**` `/system/config/**` | ✅ 实机走查过 |
| monitor/server（Druid/Actuator/Swagger 直链） | 静态资源 | ✅ 三直链 200 |
| demo/article | `/demo/article/**` | ✅ 实机走查过（CRUD） |
| ~~tool/gen 代码生成~~ | — | **模块已整体剔除**（2026-09-29 用户决策，前后端同步移除） |

## 契约要点（与后端 `common/result` 逐字对齐）

- 统一响应 `R{code, msg, data}`，成功码 **200**；**未登录 401 / 无权限 403 均为 HTTP 200**（响应体 code 表达）
- 分页响应 `{code, msg, rows, total}`；分页入参 `pageNum/pageSize`（query）
- token：请求头 `Authorization: Bearer <uuid>`，localStorage key `Admin-Token`
- 动态路由：`/getRouters` 返回 RouterVO，`component` 字符串（`Layout`/`ParentView`/`system/user/index`）解析到 `src/views/**`
- 菜单种子数据的 `component` 路径必须与前端视图路径一致（后端计划已锚定）
- `getInfo`/`login` 字段读取做了顶层/`data` 内双兼容（后端 M3 fixture 定稿前的前置保险）

## 目录结构

```
src/
├── api/            # 接口客户端（auth + system/* + demo/*）
├── mock/           # mock 层（db 内存数据 + 路由处理器，契约 fixture）
├── stores/         # user（会话）/ permission（动态路由）/ app（侧栏）
├── router/         # 静态路由 + 守卫（token、动态注入、404 兜底后置注册）
├── directives/     # v-perm 按钮权限
├── components/     # Dialog/Pagination/Switch/TreeCheck/DictTag/Icon/SideMenu…
├── composables/    # usePagedList / useDict
├── layout/         # 侧栏（米色 #f7f6f3）+ 顶栏 + 内容区
└── views/          # 视图（component 路径对齐 RuoYi-Vue3：system/user/index 等）
```

## 对接注意事项

1. 后端生成项目端口由 `server_port` 模板变量决定，改 `.env.development` 的 `VITE_PROXY_TARGET` 即可
2. 重灌数据库后需清理 Redis 的 `sys_config:*`/`sys_dict:*` 缓存键，否则读到旧值
3. 前端已实测（真实模式）：登录链路（含验证码）、动态菜单、全页面、用户/角色/文章 CRUD、权限裁剪（mock 的 seed 账号）、401 回登录、404 兜底、冷启动直达深层 URL
