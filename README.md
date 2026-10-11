# Fuwari Deploy · deploy-v0.1.0

最新 Shirone 界面请使用仓库 `main`：克隆仓库或下载 [最新源码 ZIP](https://github.com/lyosumic/Fuwari-deploy/archive/refs/heads/main.zip)，解压后双击 `deploy.cmd`。旧 `deploy-v0.1.0` Release 保留为历史快照。

## Shirone 界面与功能

现已加入 Shirone 风格与作者功能，保留原后台、PDF 笔记、项目附件与字体。胶囊导航顺序为主页、笔记、项目、归档、动态、相册、更多；模板指南已删除。

双侧栏、统计与日历、9 种 Material HCT 配色、背景纹理、列表/网格、分享海报、置顶/加密、MDX/Mermaid 和 Markdown 扩展现已接入。动态、相册、罗盘、时间线、设备、技能、游戏与音乐可在原后台编辑；新模块初始为空，不复制参考作者个人数据。

完整功能、配置和版权说明见 [Shirone 迁移说明](docs/shirone-migration.zh-CN.md)。

- 开源项目：[LyraVoid/Shirone](https://github.com/LyraVoid/Shirone)
- 官方文档：[docs.shirone.mysqil.com](https://docs.shirone.mysqil.com/)
- 演示网站：[shirone.akatsuki.codes](https://shirone.akatsuki.codes/)


基于现有 Fuwari / Astro 博客整理的源码与一键部署工具。文章、笔记、项目、个人简介、标签库、图片及主题配置保留；原版 README 见 [docs/README.upstream.md](docs/README.upstream.md)。

## 可行性与部署方式

可以一键部署。Astro 生成 `dist/` 静态网站；Cloudflare Workers 同时托管静态文件及后台 `/auth/*` GitHub OAuth 服务。阅读文章、搜索、RSS、笔记与项目展示不需要数据库。

“一键”指**首次配置完成后，双击即可安装依赖、构建和部署**。首次仍需 Node.js 22+、网络、Cloudflare 账号授权与网站地址。后台登录额外需要 OAuth App 和 Secret；未配置时也能部署静态页面。软件不接管原 `my-blog` Worker 或原自定义域名。

## Windows 使用

1. 在 [Release](https://github.com/lyosumic/Fuwari-deploy/releases/tag/deploy-v0.1.0) 下载 `deploy-v0.1.0-windows.zip`，解压到可写目录。包含完整源码和脚本，**无需 Git，不是独立 EXE**。
2. 安装 [Node.js 22 LTS 或更新版本](https://nodejs.org/)，保留 npm；双击 `deploy.cmd`。
3. 首次填写新 Worker 名称（默认 `fuwari-deploy`）、HTTPS 根网站地址、后台写入仓库（默认 `lyosumic/Fuwari-deploy`）、可选 GitHub OAuth Client ID。
4. 工具安装固定版 pnpm、按原锁文件安装依赖、构建和检查资源，然后通过 Wrangler 打开浏览器授权并部署。控制台显示实际 Worker 地址。
5. 后续双击复用配置。更改设置执行 `node tools/deploy.mjs --configure`。

第一次先在 Cloudflare 控制台确认账号的 workers.dev 子域名，网址填 `https://<Worker名称>.<账号子域名>.workers.dev/`。自定义域名需在 Worker → Settings → Domains & Routes 绑定后重新配置并部署。工具不自动改 DNS、已有路由或域名绑定。**填写现有 Worker 名称会更新该 Worker，请先用新名称。**

部署参数保存到 Git 忽略的 `.deploy.local.json`；生成配置放入 `.deploy/wrangler.json`。工具不修改原 `wrangler.jsonc`、`src/config.ts` 或后台源配置；仅替换生成的 `dist/admin/config.yml` 中仓库，后台保存会提交到该仓库，OAuth 服务也检查同一仓库的写权限。

## 命令行 / macOS / Linux

```sh
node tools/deploy.mjs --help
node tools/deploy.mjs --configure
node tools/deploy.mjs --check
node tools/deploy.mjs --dry-run
```

`--check` 只验证部署参数；`--dry-run` 安装、构建、检查资源并执行 Wrangler 打包预演，不登录或上传。真实部署每次重新构建。pnpm 固定 `9.14.4`，Wrangler 固定 `4.149.0`，不全局安装。Linux/macOS 需可在 PATH 找到 npm。

## GitHub Actions 一键部署

在仓库 Settings → Environments 创建 `cloudflare` 环境，添加：

| 类型 | 名称 | 内容 |
| --- | --- | --- |
| Secret | `CLOUDFLARE_API_TOKEN` | 针对目标账号具有 Workers 编辑权限的 API Token |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号 ID |
| Variable | `DEPLOY_WORKER_NAME` | 新 Worker 名称，如 `fuwari-deploy` |
| Variable | `SITE_URL` | 最终 HTTPS 根网址，必填 |
| Variable | `GITHUB_CLIENT_ID` | 可选 OAuth Client ID |

打开 Actions → **One-click Cloudflare deploy** → **Run workflow**。后台仓库自动取当前仓库。工作流只手动触发，代码推送不会部署；不会替代原 `My-Blog` 仓库的部署设置。

## 后台 GitHub 登录

1. 在 [GitHub OAuth Apps](https://github.com/settings/developers) 配置自己的应用。Homepage URL 填部署网址，Authorization callback URL 填 `https://你的域名/auth/callback`。
2. 将 Client ID 填入本地配置或 Actions 变量并重新部署。
3. 在**新 Worker** 的 Settings → Variables and Secrets 添加 Secret `GITHUB_CLIENT_SECRET`，填该应用的 Secret，并应用/部署变更。或运行 `npx --yes wrangler@4.149.0 secret put GITHUB_CLIENT_SECRET --config .deploy/wrangler.json`。
4. 访问 `/admin/` 登录，授权账号需具有配置仓库的写权限。

密钥不要写入源码、README、部署配置或聊天。旧站点公开配置保留在源码中，工具通过独立生成配置选择新目标。原 `docs/cloudflare.zh-CN.md` 是旧生产站记录；新部署以本文为准。

## 源码与个人内容

| 路径 | 用途 |
| --- | --- |
| `src/content/posts/` | 文章及文章图片 |
| `src/content/notes/`、`src/content/projects/` | 笔记和项目 |
| `src/data/`、`src/config.ts` | 个人简介、标签库、主题 |
| `src/assets/`、`public/` | 图片、附件、后台资源 |
| `server/` | 静态资源代理、OAuth |
| `tools/`、`deploy.cmd` | 部署程序与 Windows 启动器 |
| `.github/workflows/deploy.yml` | 手动部署工作流 |
| `docs/` | 原有说明及交付记录 |

依赖版本与锁文件保留。依赖目录、缓存、构建产物、本地密钥、旧仓库副本、开发截图不上传。目标仓库是公开的，保留的源内容（包括草稿）可被下载；网站页面仍按原有草稿规则隐藏。

## 开发和验证

```sh
npx --yes --package=pnpm@9.14.4 pnpm install --frozen-lockfile
npx --yes --package=pnpm@9.14.4 pnpm dev
node tools/test-deploy.mjs
npx --yes --package=pnpm@9.14.4 pnpm test:auth
npx --yes --package=pnpm@9.14.4 pnpm test:admin
npx --yes --package=pnpm@9.14.4 pnpm test:utilities
npx --yes --package=pnpm@9.14.4 pnpm check
npx --yes --package=pnpm@9.14.4 pnpm build
npx --yes --package=pnpm@9.14.4 pnpm test:publishing
```

实际验证结果和未完成事项见 [交付记录](docs/delivery-status.zh-CN.md)。预演通过不代表真实账号部署或 OAuth 登录已验证。

## 限制与排错

- 单个静态文件限 25 MiB；按 Cloudflare 免费计划检查最多 20,000 个文件。超限中止，不删除或压缩个人附件。
- 安装失败检查网络；锁文件不匹配会中止，不自动修改依赖。
- 地址与真实域名不一致时重新配置、部署，否则 RSS、站点地图和 OAuth 校验会不正确。
- Actions 需 Token 和账号 ID；本地未提供 Token 时使用 Wrangler 浏览器授权。
- 后台提交内容后需再次运行部署工作流更新新网站；工具不修改已有生产站自动部署。

参考：[静态资源](https://developers.cloudflare.com/workers/static-assets/)、[平台限制](https://developers.cloudflare.com/workers/platform/limits/)、[Wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/)、[Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)。

## 许可

主题和部署代码沿用 [MIT License](LICENSE)。文章、笔记、项目附件和图片保留原作者及资源授权，代码 MIT 许可不自动授予个人内容使用权。站点当前文章许可配置为 CC BY-NC-SA 4.0，具体以作者声明为准。

### 扩展功能配置

现已支持 Giscus/Twikoo、本地/自定义/Meting/混合音乐、加密相册、目录相册、文章系列、别名/固定链接，以及手机快捷目录和桌面右键菜单。使用方法与密码保护边界见 [扩展功能配置](docs/shirone-features.zh-CN.md)。原后台、PDF 笔记、项目附件与字体继续保留。
