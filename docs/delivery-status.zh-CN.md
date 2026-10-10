# deploy-v0.1.0 交付记录

日期：2026-10-10（Asia/Hong_Kong）。

## 已完成

- 在独立 `deploy-source` 目录整理源码；原网站目录及 `repository-sync` 的 `My-Blog` 仓库不改动。
- 保留文章、笔记、项目、简介、标签库、图片及附件。依赖声明和 `pnpm-lock.yaml` 不变；只新增部署与部署测试命令。
- 排除依赖、缓存、构建产物、开发截图、密钥和旧仓库副本。
- 实现 Windows 双击启动器、跨平台 Node 部署工具、GitHub Actions 手动部署入口。
- 支持首次配置、固定工具版本、冻结锁文件安装、自动构建、静态资源限制检查、部署预演和失败中止。
- 后台生成配置及 OAuth 权限检查统一指向选择的 GitHub 仓库，个人源内容不改。
- 编写中文 README，保留上游 README 与 MIT 许可。
- 发布副本仅格式化导航组件以通过原有 Biome 检查，原目录不变。

## 验证

- 原始 `src` 和 `public` 共 129 个文件最初复制时逐字节一致；之后只在副本格式化 `Navbar.astro`，个人内容文件不变。
- 按原锁文件全新安装 1,109 个依赖包成功；锁文件保持一致。
- Astro check：69 个文件，0 errors / 0 warnings / 0 hints。
- Astro build：13 个页面成功；Pagefind：9 个索引页面。
- 静态资源：214 个文件，单文件与数量均未超免费计划限制。
- 部署配置、URL/路径输入、超限附件、失败退出测试通过。
- 后台、工具与 OAuth 回归测试通过，包括新后台仓库的权限检查。
- Biome CI 通过，保留一个非阻断的字符串模板风格提示。
- Windows `deploy.cmd --help` 执行成功，退出码 0；采用 CRLF，并在 Git 中禁用该文件的行尾转换。

## 仍需用户首次配置及线上验证

- 本地部署：在双击工具中填写新 Worker 与真实网站地址，并完成 Cloudflare 授权。
- Actions 部署：设置 `cloudflare` 环境的 Token、账号 ID 和部署变量，再点 Run workflow。
- 后台登录：设置自己的 GitHub OAuth App、Client ID、回调 URL，以及 Cloudflare 的 `GITHUB_CLIENT_SECRET`。
- 自定义域名：自行在 Cloudflare 新 Worker 绑定；未修改原站 DNS 或路由。
- 真实 Cloudflare 上传与真实 OAuth 登录未在本次代替用户执行；本地预演不代表线上验证。
- 后台提交后需再次点击部署；本次未改旧生产站的自动部署。

## 本地继续工作的位置

发布源码位于原工作区下的 `deploy-source/`，Release 产物位于 `release-assets/`。原内容位于工作区根目录；不要把 `deploy-source` 再复制进源码仓库。

用量检查：本次过程中最近一次记录，5 小时额度剩余约 55%，每周约 11%。百分比是账户共享额度快照，不是本项目独立预算。
