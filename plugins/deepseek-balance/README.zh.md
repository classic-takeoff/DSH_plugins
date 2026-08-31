---
description: "DeepSeek 账户余额的配置文件插件包：基于官方 user/balance 接口的宿主 Remote 命名空间，加上美观的 Web 侧边栏小组件与设置卡片，支持手动与自动刷新。"
kind: "bundle"
---

# @deepseek-ai/dsh-deepseek-balance

[English](README.md) | 中文

## 概述

`dsh-deepseek-balance` 在 Web 客户端中展示你的 DeepSeek 账户余额。宿主端读取 `GET {baseURL}/user/balance` —— 官方 [Get User Balance](https://api-docs.deepseek.com/api/get-user-balance) 接口 —— API 密钥通过凭据服务（`ctx.credentials`）按请求解析，与 `llm-deepseek` 适配器完全一致：密钥永不进入配置，也永不跨 Remote 链路传输。浏览器端在一个共享可观测对象上渲染两个界面：侧边栏底部操作项（紧凑余额徽标 + 可用性圆点、一键刷新、包含各币种明细 / 更新时间 / 自动刷新开关与间隔的弹层）以及插件配置设置卡片（密钥引用、接口地址、周期参数、密钥状态、实时余额预览）。余额既可手动刷新，也可按可配置间隔自动刷新。

## 目录

- [使用本包](#use-this-package)
- [配置](#configuration)
- [理解实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## 使用本包

本包是一个 profile 插件包（bundle）：其 `cordis.patch.yml` 挂载单个 `deepseek-balance` 行即可同时启用两半（节点半注册 `deepseekBalance` Remote 命名空间与 `deepseek-balance` 设置分区；浏览器半会自动服务于任何声明了 `dsh.client` 且已启用的 Loader 条目）。

安装到某个 profile（例如内置的 web profile）：

```sh
dsh plugin --profile web add @deepseek-ai/dsh-deepseek-balance
```

若使用本地 checkout 构建产物，改为安装包目录后重启 profile：

```sh
dsh plugin --profile web add D:\path\to\packages\extensions\deepseek-balance
```

由于包声明了 `dsh.bundle.patch`，profile 的 `dsh.profile.bundles` 会自动加入该包。

### 侧边栏组件展示什么

`sidebar.footer.action` 席位显示主币种总额（例如 `¥110.00`）、可用性圆点与刷新图标。打开弹层后列出 API 返回的每个币种 —— 总余额、赠送余额、充值余额及占比条 —— 同时显示拉取时间、手动刷新操作以及自动刷新开关与间隔。`is_available` 为真时圆点为绿色，余额不足时为琥珀色，最近一次读取失败时为红色；失败读取保留上一次成功快照，并展示宿主的错误信息与重试操作。

### 设置卡片展示什么

设置面板的**插件配置**标签页会为 `deepseek-balance` 命名空间渲染卡片：凭据引用（`apiKeyEnv`，默认 `DEEPSEEK_API_KEY`）、API 地址、自动刷新开关、刷新间隔、缓存时长、请求超时、密钥状态（已配置 / 未配置）以及实时余额预览。字段通过带修订号栅栏的 settings scope 即时写入；被覆盖的字段带有标记徽标与恢复默认操作。弹层中的开关与间隔与卡片写入同一个设置文档。

### 需要了解的边界

余额读取是真实的网络请求：宿主按 `cacheTtlMs`（默认 30 秒）缓存快照并去重并发调用；但若 profile 没有 `apiKeyEnv` 对应的凭据，会显示未配置密钥状态，直到存入密钥（Web Models 页面可写入凭据）。接口地址跟随 `baseURL`；处于网关后的部署请将 `baseURL` 设为兼容的 DeepSeek 源。

<a id="configuration"></a>
## 配置

所有字段均可选；每个字段同时对应用户设置文档中的 `deepseek-balance:` 分区。

| 键 | 默认值 | 含义 |
|---|---|---|
| `apiKeyEnv` | `DEEPSEEK_API_KEY` | 凭据引用（环境变量名），按请求通过 `ctx.credentials` 解析。 |
| `baseURL` | `https://api.deepseek.com` | API 源地址；自动追加 `/user/balance`。 |
| `autoRefresh` | `true` | 浏览器组件是否自动刷新。 |
| `refreshIntervalMs` | `600000` | 自动刷新间隔（1 秒 – 24 小时）。 |
| `cacheTtlMs` | `30000` | 宿主快照缓存时长；`0` 表示禁用缓存。 |
| `timeoutMs` | `10000` | 单次请求超时。 |

<a id="understand-the-implementation"></a>
## 理解实现

### 设计思想

一个事实只读取一次、渲染两次。宿主独占唯一的网络调用 —— 组件与设置卡片从不自行请求 —— 两个浏览器界面订阅同一个 `BalanceWidgetController` 可观测对象，因此徽标与卡片上的刷新永远一致，设置修改也会重排同一个定时器。Remote 命名空间刻意保持无状态：三个零参数读取方法，配以短 TTL 缓存与并发去重，由 Gateway 的 SRC 回退从实时 `@Remote` 标记发现，因此打包无需 Typert 生成步骤。浏览器端通过 `ctx.remote.$mount` 挂载与之匹配的手工构建贡献（`BALANCE_REMOTE`，严格 zod codec），与生成器输出同构。

### 源码地图

| 文件 | 职责 |
|---|---|
| `src/index.ts` | 宿主插件：`BalanceController`（`getBalance` / `refreshBalance` / `getOptions`）、配置与设置分区、凭据解析。 |
| `src/types.ts` | 线路类型与 `RemoteErrorDetailsMap` 合并（`deepseek-balance/missing-credential`、`deepseek-balance/api-error`）。 |
| `src/client/index.ts` | 浏览器入口：挂载贡献、注册组件与卡片。 |
| `src/client/controller.ts` | 共享可观测对象：读取管线、自动刷新定时器、scope 写入。 |
| `src/client/BalanceWidget.tsx` | 侧边栏底部操作项：徽标 + 刷新 + 弹层面板。 |
| `src/client/BalanceSettingsCard.tsx` | 带实时预览的插件配置卡片。 |
| `cordis.patch.yml` | 挂载 `deepseek-balance` 行的 profile bundle 补丁。 |

<a id="model-experience"></a>
## 模型体验

无 —— 本包仅通过 Remote 命名空间读取一个用户账户事实并渲染，不向模型贡献任何系统提示、工具 schema 或会话上下文。其宿主请求与任何模型请求相互独立。

#### KV Cache 效应

独立模型请求 —— 余额 HTTP 调用与会话无关，不参与 provider 的 KV 缓存复用，本包的任何改动也不会使既有缓存前缀失效。

## Known Limitations and Deferred Work

- **依赖凭据** —— 若 `apiKeyEnv` 没有可用值，组件显示未配置密钥状态；仅支持通过凭据服务（Web Models 页面）存入密钥，未实现 `process.env` 环境变量回退（base profile 始终挂载 `credentials-local`，其本身已分层读取环境）。
- **单一接口** —— 仅解析官方 `GET /user/balance` 报文形状；其他网关须线路兼容。非 2xx 响应直接展示宿主错误而非猜测。
- **无推送更新** —— 余额变化按组件刷新节奏（手动或自动）到达，宿主不推送余额事件。`deepseek-balance/*` 错误码仅由本包自身界面消费。
