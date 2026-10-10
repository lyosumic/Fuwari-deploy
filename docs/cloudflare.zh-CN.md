# Cloudflare Workers 部署与独立 GitHub 登录

当前正式网站是 https://060926.xyz/，Cloudflare Worker 名为 `my-blog`，关联 `lyosumic/My-Blog` 的 `main` 分支。网站静态页面与 GitHub 登录服务由同一个 Worker 提供，均不再依赖 Netlify。

## 已配置的部署

| 设置 | 值 |
| --- | --- |
| 项目 | `my-blog` |
| 生产分支 | `main` |
| 根目录 | `/`（仓库根目录） |
| 构建命令 | `pnpm run build` |
| 部署命令 | `npx wrangler deploy` |
| 静态产物 | `dist` |
| 构建变量 SITE_URL | `https://060926.xyz/` |

`wrangler.jsonc` 指定静态资源绑定 ASSETS、登录入口 `server/worker.js` 和当前正式域名。只让 `/auth` 和 `/auth/*` 优先运行 Worker；普通页面、搜索和附件继续静态托管，无需 Astro 服务端适配器。

构建状态读取 Workers 的 WORKERS_CI_COMMIT_SHA、WORKERS_CI_BRANCH；同时支持 Pages 的构建变量。本地构建默认 localhost，有自定义网址时使用 SITE_URL。

## GitHub OAuth

复用现有的 [My Blog OAuth App](https://github.com/settings/applications/3908944)，设置：

- Homepage URL：`https://060926.xyz/`
- Redirect URI：`https://060926.xyz/auth/callback`
- Client ID：已配置在 wrangler.jsonc 中，是公开标识，不是密钥。
- 授权范围：当前博客仓库为私有仓库，wrangler.jsonc 的 GITHUB_OAUTH_SCOPE 与后台 config.yml 的 auth_scope 已设为 repo。公开仓库才使用 public_repo。

**还需在 Cloudflare 填写 GITHUB_CLIENT_SECRET。** GitHub 不会再次显示已有 Client Secret。请在 OAuth App 点击 Generate a new client secret（可能需要本人验证），将新生成的值直接填入 Cloudflare `my-blog` → Settings → Runtime variables and secrets：

| Type | Name | Value |
| --- | --- | --- |
| Secret | `GITHUB_CLIENT_SECRET` | GitHub 新生成的 Client Secret |

保存并部署。不要把密钥发到聊天或写入仓库。wrangler.jsonc 的 keep_vars 保留控制台变量；Secret 不写入代码，也不会进入静态构建。

ADMIN_ORIGIN 与 GITHUB_CLIENT_ID 已由仓库配置，无需再次手动输入。若以后改域名，同时更新 ADMIN_ORIGIN、构建变量 SITE_URL 和 GitHub App 的 Homepage URL、Redirect URI。

## 后台与验证

从 https://060926.xyz/admin/ 打开后台并重新登录。初始化脚本会使用当前网站 origin 发起授权，YAML 中 localhost.invalid 是防止漏初始化时回退到旧平台的占位地址，无需替换。

服务检查 HTTPS 域名、十分钟有效的登录状态、HttpOnly Cookie 和 GitHub 仓库写入权限，再按 Decap 弹窗协议返回登录结果。回调响应不缓存，Token 只返回发起登录的同域名后台。其他域名与预览部署拒绝正式登录。

运行 `pnpm test:auth`、`pnpm test:admin`、`pnpm test:utilities`、`pnpm check`、`pnpm build` 检查本地代码。OAuth 测试模拟 GitHub，不代替线上账号授权。

上线后检查后台登录、保存草稿、GitHub main 分支提交、Cloudflare 自动部署、公开文章、搜索、RSS、PDF 和项目附件。发布清单 /content-status.json 显示构建时间与提交号。

如果登录提示尚未配置，检查 Runtime secret 后重新部署；如果提示状态过期，重新从后台发起登录；没有写入权限时核对 GitHub 账号与授权范围。

新登录与发布流程验证成功后再停用旧 Netlify 站点，处理旧订阅并移除不再使用的旧授权。自己的域名已由 Cloudflare 托管；旧平台赠送的子域名无法迁移。

参考：[Workers 部署 Astro](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)、[静态资源绑定](https://developers.cloudflare.com/workers/static-assets/binding/)、[Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)、[Decap 认证配置](https://decapcms.org/docs/backends-overview/)。
