# DeepSeek 余额插件 —— 独立插件目录工作流

本目录是 `@deepseek-ai/dsh-deepseek-balance` 的**已发布插件包**，通过 web profile 的
`dsh.profile.bundles` 以 link 方式导入（见 `C:\Users\57861\.dsh\profiles\web\package.json`）。

## 日常改代码流程（不用编译 DSH 主体）

```
1. 编辑源码：D:\DSH\Raw\deepseek-harness\packages\extensions\deepseek-balance\src\...
2. 在本目录执行：.\build.ps1
   （内部：tsc -b + tsdown 只构建这一个包 → 把 lib/ 产物同步回本目录）
3. 重启 GUI（浏览器半改动若已启动 dev:web，页面会自动热更新）
```

`build.ps1` 可选参数：

| 参数 | 说明 |
|---|---|
| `-Repo <路径>` | DSH checkout 路径（默认 `D:\DSH\Raw\deepseek-harness`） |
| `-SkipSync` | 只构建，不同步产物 |

## 目录结构

| 路径 | 作用 |
|---|---|
| `src/` | 源码（仓库内编辑，构建后同步到此处保持最新） |
| `lib/` | 构建产物：`index.js`（宿主半）、`client.js`（浏览器半）、`types/` |
| `cordis.patch.yml` | bundle 补丁：向组合插入 `deepseek-balance` 行 |
| `package.json` | 声明 `dsh.bundle.patch` + `dsh.client`（导入机制的关键） |

## 插件导入 / 移除

```powershell
# 导入（已执行）
dsh plugin --profile web add D:\DSH\Project\plugins\deepseek-balance

# 移除
dsh plugin --profile web remove @deepseek-ai/dsh-deepseek-balance
```

## 运行原理（为什么重启不编译）

- GUI 用 `node --import tsx/esm` 直接运行 DSH 源码（tsx 即时转译），本身不产生编译产物。
- 插件走已构建的 `lib/*.js`，重启只做：按 `dsh.profile.bundles` 叠加各 bundle 的
  `cordis.patch.yml` → Loader 挂载 `deepseek-balance` 行 → modules 半区把
  `lib/client.js` 合成进页面插件表。
- 因此：**只有改插件代码才需要构建**，且只构建这一个包；改 `cordis.patch.yml` /
  bundles 列表（profile 的 `patchReload: live`）可热应用补丁，但换包代码仍需重启。

## 配置项（设置 → 插件配置 → DeepSeek 余额）

| 键 | 默认值 | 含义 |
|---|---|---|
| `apiKeyEnv` | `DEEPSEEK_API_KEY` | 凭据引用（环境变量名），按请求经凭据服务解析 |
| `baseURL` | `https://api.deepseek.com` | 官方接口源；自动追加 `/user/balance` |
| `autoRefresh` | `true` | 浏览器组件自动刷新 |
| `refreshIntervalMs` | `600000` | 自动刷新间隔（毫秒） |
| `cacheTtlMs` | `30000` | 宿主快照缓存时长（毫秒） |
| `timeoutMs` | `10000` | 请求超时（毫秒） |

接口与字段遵循官方 [Get User Balance](https://api-docs.deepseek.com/api/get-user-balance) 文档。
