---
description: "DeepSeek account balance as a profile plugin bundle: a host Remote namespace over the official user/balance API plus a beautiful web sidebar widget and settings card, with manual and auto refresh."
kind: "bundle"
---

# @deepseek-ai/dsh-deepseek-balance

English | [中文](README.zh.md)

## Summary

`dsh-deepseek-balance` shows your DeepSeek account balance inside the web client. The Host half reads `GET {baseURL}/user/balance` — the official [Get User Balance](https://api-docs.deepseek.com/api/get-user-balance) endpoint — with the API key resolved per request through the credentials seam (`ctx.credentials`), exactly like the `llm-deepseek` adapter: the key never lives in configuration and never crosses the Remote wire. The browser half renders two surfaces over one shared observable: a sidebar footer action (compact balance badge with an availability dot, one-tap refresh, and a popover with per-currency breakdowns, last-updated time, and the auto-refresh toggle + interval) and a plugin-configuration settings card (key reference, endpoint, periods, key status, and a live balance preview). Balance refreshes manually on demand or automatically on a configurable interval.

## Table of Contents

- [Use this package](#use-this-package)
- [Configuration](#configuration)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## Use this package

The package is a profile plugin bundle: its `cordis.patch.yml` mounts one `deepseek-balance` row that enables both halves (the node half registers the `deepseekBalance` Remote namespace and the `deepseek-balance` settings section; the browser half is served automatically for any enabled Loader entry declaring `dsh.client`).

Install into a profile (for example the shipped web profile):

```sh
dsh plugin --profile web add @deepseek-ai/dsh-deepseek-balance
```

For a local checkout build, install the package directory instead, then restart the profile:

```sh
dsh plugin --profile web add D:\path\to\packages\extensions\deepseek-balance
```

The profile's `dsh.profile.bundles` gains the package automatically because it declares `dsh.bundle.patch`.

### What the sidebar widget shows

A `sidebar.footer.action` seat shows the primary currency total (e.g. `¥110.00`) with an availability dot and a refresh icon. Opening the popover lists every currency the API reports — total, granted, and topped-up balance with a proportion bar — plus the fetch time, a manual refresh action, and the auto-refresh switch + interval. The dot is green when `is_available` is true, amber when the balance is low, and red when the last read failed; a failed read keeps the last good snapshot and shows the Host's error message with a retry action.

### What the settings card shows

The **Plugin configuration** tab in Settings renders a card for the `deepseek-balance` namespace: the credential reference (`apiKeyEnv`, default `DEEPSEEK_API_KEY`), the API origin, the auto-refresh switch, the refresh interval, the cache TTL, the request timeout, the key status (configured / missing), and a live balance preview. Fields write immediately through the revision-fenced settings scope; overridden fields carry a chip and a restore-default action. The same toggle and interval can be changed from the popover — both write the same settings document.

### Boundaries to plan around

Balance reads are real network calls: the Host caches snapshots for `cacheTtlMs` (30 s by default) and dedupes concurrent callers, but a profile without a credential for `apiKeyEnv` shows the missing-key state until one is stored (the web Models page writes credentials). The endpoint follows `baseURL`; deployments behind a gateway set `baseURL` to their DeepSeek-compatible origin.

<a id="configuration"></a>
## Configuration

All fields are optional; each doubles as a `deepseek-balance:` section in the user settings document.

| Key | Default | Meaning |
|---|---|---|
| `apiKeyEnv` | `DEEPSEEK_API_KEY` | Credential reference (environment-variable name) resolved per request through `ctx.credentials`. |
| `baseURL` | `https://api.deepseek.com` | API origin; `/user/balance` is appended. |
| `autoRefresh` | `true` | Whether the browser widget auto-refreshes. |
| `refreshIntervalMs` | `600000` | Auto-refresh interval (1 s … 24 h). |
| `cacheTtlMs` | `30000` | Host snapshot cache TTL; `0` disables the cache. |
| `timeoutMs` | `10000` | Per-request HTTP timeout. |

<a id="understand-the-implementation"></a>
## Understand the implementation

### Design philosophy

One fact is read once and rendered twice. The Host owns the only network call — the widget and the settings card never fetch — and both browser surfaces subscribe to a single `BalanceWidgetController` observable, so a refresh from the badge and one from the card always agree, and a settings edit reschedules the same timer. The Remote namespace is stateless by design: three zero-argument reads with a short TTL cache and in-flight dedup, discovered by the Gateway's SRC fallback from live `@Remote` markers, so no Typert generation pass is required to ship the bundle. The browser mounts the matching hand-built contribution (`BALANCE_REMOTE`, strict zod codecs) through `ctx.remote.$mount`, following the same shape the generator would emit.

### Source map

| File | Role |
|---|---|
| `src/index.ts` | Host plugin: `BalanceController` (`getBalance` / `refreshBalance` / `getOptions`), config + settings section, credential resolution. |
| `src/types.ts` | Wire types and `RemoteErrorDetailsMap` merge (`deepseek-balance/missing-credential`, `deepseek-balance/api-error`). |
| `src/client/index.ts` | Browser entry: mount the contribution, register the widget and the card. |
| `src/client/controller.ts` | Shared observable: load pipeline, auto-refresh timer, scope writes. |
| `src/client/BalanceWidget.tsx` | Sidebar footer action: badge + refresh + popover panel. |
| `src/client/BalanceSettingsCard.tsx` | Plugin-configuration card with live preview. |
| `cordis.patch.yml` | Profile bundle patch mounting the `deepseek-balance` row. |

<a id="model-experience"></a>
## Model Experience

None, as this package only reads a user account fact through a Remote namespace and renders it; no system prompt, tool schema, or session context is contributed to the model. Its host requests are independent of any model request.

#### KV Cache effect

Independent model request — the balance HTTP call is unrelated to any conversation, so it never participates in provider KV cache reuse, and no package-owned change can invalidate an existing cached prefix.
## Known Limitations and Deferred Work

- **Credential-dependent** — without a usable value for `apiKeyEnv` the widget shows the missing-key state; storing the key through the credentials service (the web Models page) is the only supported path, and no ambient `process.env` fallback is implemented (the base profile always mounts `credentials-local`, which layers the environment itself).
- **Single endpoint** — only the official `GET /user/balance` shape is parsed; other provider gateways must be wire-compatible. A non-2xx response renders the Host error rather than guessing.
- **No push updates** — balance changes arrive on the widget's refresh cadence (manual or auto); the Host never pushes a balance event. The `deepseek-balance/*` failure codes are consumed by this package's own surfaces only.
