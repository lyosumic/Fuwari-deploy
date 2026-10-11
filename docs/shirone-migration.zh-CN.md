# Shirone 界面与功能迁移

参考项目：[LyraVoid/Shirone](https://github.com/LyraVoid/Shirone)。

- 官方文档：https://docs.shirone.mysqil.com/
- 演示网站：https://shirone.akatsuki.codes/

本项目沿用原有 Astro 5 / Svelte 5 博客、Cloudflare Worker、GitHub OAuth 与 Decap 后台，在此基础上迁入 Shirone 的视觉语言和作者功能。正文仍使用 Roboto，代码仍使用 JetBrains Mono Variable；没有引入参考站的 Outfit 或悠哉圆体。头像、横幅、个人简介、标签库、文章、PDF 笔记和项目附件保持各自仓库原有内容。

## 导航和外观

保留固定悬浮胶囊顶栏，顺序为 **主页 → 笔记 → 项目 → 归档 → 动态 → 相册 → 更多**。友链与番剧不作为本项目页面，改用原有笔记和项目功能。更多菜单包含罗盘、时间线、设备、技能、游戏、关于与 GitHub。手机菜单包含同样的入口。

采用 Material 3 Expressive 圆角、语义色、首页标题横幅、波浪分层、双侧栏、文章卡片、分类导航、统计与可翻月日历。日历中有文章的日期链接到对应归档筛选。

显示设置包含 9 种真实 HCT 配色、MD3 2021 / M3E 2025、纯色/横幅背景、列表/网格、5 种纹理和减少动态效果。设置保存在浏览器；系统浅深色模式与 Swup 页面切换继续可用。

## 原有功能

- GitHub 登录与写权限校验、后台文章编辑、标签/多分类、历史库和个人资料编辑。
- Markdown / PDF 笔记分类树、预览、阅读、下载和 PDF-only 内容。
- 项目状态、技术栈、仓库/演示链接、README、代码展示和源码附件下载。
- 全文搜索、归档、RSS、站点地图、图片预览、公式和高亮代码。
- `Fuwari-deploy` 中的双击部署工具、冻结安装、生成配置、资源检查及手动 Actions 部署。

只移除了明确的模板指南：`posts/guide/index.md`、其配图和 `notes/guide/getting-started.md`。其他内容未按标题或分类批量删除。

## 新增作者与文章能力

- 置顶、更新日期提示、延伸阅读、复制链接、系统分享及二维码海报下载。
- 可选 Giscus 评论，只有启用、配置并点击加载后才请求第三方。
- MDX、Mermaid、折叠面板、选项卡、文件/代码树、步骤、字段组、缩写、高亮标记、剧透块、图片网格、音频朗读和视频组件。
- 密码保护：正文在构建时以 AES-GCM 加密，使用 PBKDF2 / SHA-256 派生密钥；明文不会写入公开页面和 RSS。缺失密码的加密标记会使构建失败。源码仓库仍包含原文和密码，适合私有源码仓库，不能用它保护公开仓库里的源文件或公开附件。
- 分类/标签索引页与 Atom 订阅。

文章可增加：

```yaml
pinned: true
encrypted: true
password: "自行设置"
passwordHint: "可选提示"
```

后台也提供这些字段，不要求批量改写旧文章。

## 动态、相册及收藏

新增数据文件 `src/data/site-extras.json`，初始为空，不包含参考作者的示例内容。后台「个人简介与设置 → 动态、相册与收藏」可编辑动态、相册、罗盘、时间线、设备、技能、游戏和音乐。

通用字段：`id`、`title`、`description`、`category`、`date`、`url`、`image`、`status`。动态/时间线支持 `content`，相册/动态支持 `images: [{src, alt}]`，技能支持 `level: 0..100`，音乐支持 `artist` 和 `source`。图片可用 `/uploads/...` 或 HTTPS 地址；外部链接只接受 HTTP(S)。

相册支持分类过滤和大图查看；时间线按记录展示；技能展示熟练度；音乐支持播放/暂停、上一首/下一首、进度、音量、顺序/循环/随机与播放列表，默认不自动播放。没有曲目时不渲染播放器或发出音频请求。

UI 配置在 `src/ui-config.ts`。Giscus 需填写 `comments` 的仓库、仓库 ID、分类和分类 ID；默认关闭。所有新模块与既有后台共用同一 GitHub 内容仓库。

## 开发与部署

```sh
npx --yes --package=pnpm@9.14.4 pnpm install --frozen-lockfile
npx --yes --package=pnpm@9.14.4 pnpm check
npx --yes --package=pnpm@9.14.4 pnpm build
npx --yes --package=pnpm@9.14.4 pnpm test:admin
npx --yes --package=pnpm@9.14.4 pnpm test:auth
npx --yes --package=pnpm@9.14.4 pnpm test:utilities
npx --yes --package=pnpm@9.14.4 pnpm test:publishing
```

保留原 Astro、Svelte、字体及原有依赖声明，新增 MDX、Material color utilities、Mermaid、QRCode 与文件树图标支持。Material 库在服务器构建时由 Vite 打包，避免其发布包中的扩展名兼容问题。

`My-Blog` 继续使用原生产 Worker 配置；`Fuwari-deploy` 继续按自己的 README 配置新 Worker 并双击部署。两者的个人内容不互相覆盖。旧 `deploy-v0.1.0` Release 是之前版本的历史快照，最新界面以仓库 `main` 为准。

## 版权

新增的 HCT 配色、密码保护与部分 Markdown 扩展来自 Shirone。版权与 MIT 许可见 [LICENSE-Shirone.txt](LICENSE-Shirone.txt)。原 Fuwari MIT 许可继续保留；个人内容与图片沿用其原授权。
