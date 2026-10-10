# 线上内容管理

网站部署与独立 GitHub 登录配置见 [Cloudflare 说明](cloudflare.zh-CN.md)。网站和后台认证均使用 Cloudflare Workers。

管理后台位于 `/admin/`，基于 [Decap CMS](https://github.com/decaporg/decap-cms)，固定版本 3.16.3。使用 GitHub 后端，内容提交到 `lyosumic/My-Blog` 的 `main` 分支，登录账号必须有该仓库的写入权限。后台脚本从 jsDelivr 加载，需要网络连接。

## 当前实现与上线条件

本地代码已配置博客、PDF 笔记、项目代码、个人简介表单、Markdown 导入、标签显示映射和 Cloudflare 构建及认证服务。修改后应在 Git 仓库中提交并推送到 `main`。如果使用的是没有 `.git` 的下载副本，请先克隆主仓库，再将改动的代码文件合并过去。

如果 GitHub Desktop 管理的是另一个目录，先将本目录的更新复制过去，不要只推送旧副本。保留目标仓库的 `.git`，不要上传 `node_modules`、`dist` 或 `.astro`。

## Cloudflare 上线与后台登录

1. 在 Cloudflare Workers 连接 `lyosumic/My-Blog` 的 `main` 分支，构建命令为 `pnpm build`，部署命令为 `npx wrangler deploy`，静态产物为 `dist`，Node 22、pnpm 9.14.4。
2. GitHub OAuth App 的回调地址设为 `https://正式网站域名/auth/callback`。
3. 在 Worker 的 Runtime variables and secrets 配置 `ADMIN_ORIGIN`、`GITHUB_CLIENT_ID` 和加密的 `GITHUB_CLIENT_SECRET`，然后重新部署。
4. 从 `ADMIN_ORIGIN` 对应的网站打开 `/admin/`，使用有仓库写入权限的 GitHub 账号登录。

详细步骤、私有仓库授权和自定义域名切换见 [Cloudflare 说明](cloudflare.zh-CN.md)。密钥不要放入仓库或聊天。后台没有开放匿名写入、本地代理或公开测试后端。

## 管理内容

- **博客文章**：创建、编辑、删除，修改日期、摘要、封面、分类和标签。标签、分类均支持多选：点击历史名称选择或取消，输入新名称后按 Enter 或点击添加；可用中文/英文逗号批量添加。已选名称旁的 × 可移除。输入但未确认的名称会提示先添加，避免保存时遗漏。新建文章默认公开；打开「隐藏为草稿」后不会生成公开页面。CMS 的保存/发布按钮表示提交源文件，需要等 Cloudflare Workers 成功部署。
- **历史标签与分类库**：位于个人简介与设置中，保存在 `src/data/taxonomy.json`。包含网站之前使用过的名称，可增加、移除并保存；这个库在换浏览器时仍可使用，也可以保留已删除文章的名称。后台选项同时合并当前公开文章使用的名称，以及本浏览器已经保存过的名称；刚保存的新名称可以立即复用，部署后其他浏览器也能从公开文章中获取。点击「刷新选项」读取最新部署。草稿的专属名称不会被写入公开的选项接口。
- **PDF 学习笔记**：创建、编辑、删除；填写标题和分类，在「PDF 笔记」中上传或选择 PDF（建议 20MB 以内），然后保存。PDF 为必填，非 PDF 文件无法保存；表单不再提供 Markdown 正文编辑框。网站显示预览、在新窗口阅读与下载按钮。已有 Markdown 笔记仍可阅读；通过后台再次保存时需补充 PDF，原有正文会保留。在「分类路径」中按学期、课程、章节顺序填写，层级由数组顺序决定，与源文件夹不同。
- **项目代码**：创建、编辑、删除；支持上传 zip、tar、gz、tgz、7z 源码压缩包（建议 20MB 以内）、仓库地址、演示地址、封面、技术栈、项目状态与排序。README 可通过 Markdown 正文导入，也可用代码块展示片段。源码保存在 `public/uploads/projects`，项目元数据保存在 `src/content/projects`。详见 [项目说明](projects.zh-CN.md)。
- **导入 Markdown**：在正文区域选择 `.md` 文件，导入正文并显示文件中的标题、分类、标签提示。请在上方表单手动填写或确认对应字段；导入不会自动保存，也不会同步本机图片路径。大小限制为 2MB。
- **图片与附件**：在媒体库上传。文件保存在 `public/uploads`，网页引用地址为 `/uploads/文件名`。PDF 表单默认保存到 `public/uploads/notes`，项目默认保存到 `public/uploads/projects`。本机图片需要单独上传并更新正文路径。PDF 保持原始文件格式，不转换成 Markdown。公开 PDF 的文字不会由 Pagefind 自动提取；笔记标题、摘要和补充说明可以搜索。
- **个人简介与头像**：编辑 `src/data/profile.json`，网站配置读取此文件。保留现有昵称、简介、头像和三个外部链接，也可以通过后台修改。
- **关于页面**：编辑 `src/content/spec/about.md`，支持 Markdown。
- **标签批量显示设置**：编辑 `src/data/tags.json`。填写原标签和新标签后，所有文章的显示、归档筛选和标签统计会使用新名称；新名称留空时隐藏这个标签。它保留 Markdown 中的原始标签，可以移除规则恢复原来的显示。规则只作用一次、不链式替换，每个原标签只能出现一次。

新文章使用 `tags: [Astro, 学习]`、`category: [开发, 笔记]`。旧文章的 `category: 开发`、空字符串或 null 均继续兼容，编辑保存时转为数组。一篇文章会进入每个已选择分类的列表，各分类中的重复名称只统计一次；没有分类时进入未分类。

如果需要永久修改文章源文件中的标签，请逐篇编辑博客的「标签」字段。删除博客、笔记和项目会提交 Markdown 文件删除，可通过 GitHub 的提交历史恢复；当前没有独立回收站。删除条目不会自动删除引用的附件，若希望 PDF 或源码不再能通过旧链接访问，请同时在媒体库删除对应文件并等部署完成。所有 `public` 附件都会公开发布，包括草稿引用的附件。

## 保存后网站没有显示

已在当前代码中确认并修复两处问题：

1. 原先后台的博客和笔记默认 `draft: true`，正式构建会过滤掉这些条目。现在新建内容默认公开，但已有草稿不会被擅自改为公开。请编辑未显示的帖子，关闭「隐藏为草稿」并保存。
2. 当前 Astro 版本在栏目删除到没有文件时可能残留内容缓存。生产构建已改为 `astro build --force`，每次从 Git 中的最新源文件重新生成内容。

后台左下角的「发布状态与使用帮助」会显示网站最近构建时间（香港时间）、公开内容数量、草稿数量以及 Cloudflare Workers 提交号和分支。保存后会提示内容正在等待部署，保存草稿则明确提示不会显示。点击「刷新网站状态」，并通过「公开内容清单」核对标题和网址。

如果关闭草稿后仍未出现，请按顺序核对：

1. GitHub 的 `main` 分支中是否确实有该 Markdown 文件，路径是否是 `src/content/posts`、`src/content/notes` 或 `src/content/projects`。
2. Cloudflare Workers 最近的 **Production deployment** 是否成功，关联的提交号是否与 GitHub 最新提交一致；失败时查看日志中的字段/附件错误。构建时间更新并不保证它包含某条提交，请核对提交号。
3. Cloudflare Workers 是否连接同一个仓库，Production branch 是否为 `main`；Root directory 留空、Build command 为 `pnpm build`、Build output directory 为 `dist`。使用其他目录布局时，Root directory 应指向实际含 `package.json` 的项目目录。
4. 是否暂停自动构建或锁定了旧部署；必要时重新触发生产部署并清除 Cloudflare Workers 构建缓存。
5. 部署成功后重新加载网页。站内导航使用 Swup 缓存，已经打开的浏览器标签页可能继续保留旧内容。

`/content-status.json` 是本次静态构建的公开内容清单，不是直接读取 GitHub 或 Cloudflare Workers API 的实时日志。它不会列出草稿标题或正文。附件丢失时构建会报出对应路径，避免生成坏的下载链接。[Cloudflare Workers 的生产分支与部署说明](https://developers.cloudflare.com/pages/configuration/branch-build-controls/)

Decap 的嵌套目录功能仍属于 beta，本后台不提供移动目录的表单，避免移动已有内容导致地址或相对资源改变。[官方嵌套目录说明](https://decapcms.org/docs/collection-nested/)

## 验证与使用流程

```sh
node scripts/test-auth.mjs
node scripts/test-admin.mjs
node scripts/test-utilities.mjs
node scripts/test-publishing.mjs
pnpm check
pnpm build
```

`test-publishing` 会创建临时博客、PDF-only 笔记和项目，验证新增、修改、删除、草稿隐藏、RSS/归档、附件输出、特殊标题/分类、缺失封面和空博客首页，结束后恢复原始内容、清理测试文件并重新生成正式页面。请不要和开发服务器或其他构建同时运行。测试最后的构建不生成搜索索引，部署前请执行完整的 `pnpm build`。

部署后先创建测试草稿，确认 GitHub 中出现提交；再关闭草稿并保存，等待 Cloudflare Workers 部署完成，确认公开页面更新。未访问账号授权与部署日志前，本地验证不能证明线上 GitHub 写入和 Cloudflare Workers 部署已成功。

今后通过后台编辑后，本地副本不会自动更新；继续在本机修改代码前，先从 GitHub 拉取最新提交。

## 后台设计

工作台提供博客、PDF 笔记和项目的快捷创建入口，统一浅灰背景、紫色操作按钮、卡片导航与表单间距；发布状态帮助收在右下角，保存后自动展开。窄屏使用纵向快捷卡片。参考 [Tabler](https://github.com/tabler/tabler) 和 [TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard) 的布局与视觉层次，样式为本项目编写，没有新增框架依赖。后台保留 Decap CMS 的登录、校验、媒体库与 GitHub 提交功能。

`public/admin/admin.css` 中的 Decap 组件选择器对应固定版本 3.16.3，升级 CMS 时需重新验证列表、编辑器与移动端布局。
