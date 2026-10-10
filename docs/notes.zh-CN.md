# 个人笔记

顶部导航的「笔记」入口为 `/notes/`。笔记独立于博客文章，支持 PDF 和 Markdown，复用 Fuwari 的卡片、主题色、深浅色模式、Markdown 渲染、公式和代码块。

## 上传 PDF

在 `/admin/` → PDF 学习笔记 → 新建笔记中填写标题和分类路径，使用「PDF 笔记」上传文件，然后保存。后台只接受 PDF，PDF 为必填，不需要编写 Markdown 正文。默认公开；开启「隐藏为草稿」后不显示笔记页面。PDF 保存到 `public/uploads/notes`，网页提供内嵌预览、在新窗口阅读和下载。手机或浏览器不支持内嵌 PDF 时，使用打开或下载按钮。

手动编写笔记时，在 frontmatter 中增加 `pdf: /uploads/notes/文件名.pdf`，并确保对应文件已放入 `public/uploads/notes`。可填写外部 http(s) PDF 链接；外部网站的嵌入限制可能导致预览不可用。

## 新增笔记

在 `src/content/notes/` 中创建 `.md` 文件，例如 `semester-1/calculus/derivatives.md`：

```markdown
---
title: 导数与微分
description: 导数定义与常见求导公式
category: [大一上学期, 高等数学, 第二章]
order: 3
updated: 2026-10-06
draft: false
---

## 导数定义

在这里写正文。
```

- `category` 是从上到下的分类名称数组，至少一级，支持继续增加层级。名称中的斜杠会作为普通文字处理。
- 分类树从公开笔记自动生成，不需要手动配置导航。同名父分类会合并；没有公开笔记的分类不会显示。
- `order` 越小越靠前，默认值为 0。同级笔记按 `order`、标题排序；分类按已排序笔记首次出现的顺序排列，可通过笔记的 `order` 调整。
- `description`、`updated` 可省略；`draft: true` 的笔记不会生成正文页、显示在目录或进入搜索索引。
- 文件夹用于整理源文件；网站分类以 `category` 为准。上述文件生成 `/notes/semester-1/calculus/derivatives/`。
- 文件名 `index.md` 与笔记入口冲突，请使用其他文件名。建议采用英文小写文件名，移动文件会改变网址。
- Markdown 中的相对链接按网页网址解析，跨笔记链接请使用生成后的 `/notes/.../` 路径；项目部署到子路径时请包含该子路径。

项目提供三篇带「示例」标记的笔记，可直接删除或改写。正文的「学习目录 · 继续阅读」默认收起，打开后会自动展开当前笔记所属的分类。

## GitHub 存储方式

当前推荐：把笔记与博客代码放在同一仓库的 `src/content/notes/` 中。提交修改后，按已有部署流程重新构建；无需数据库，也无需在浏览器里访问 GitHub API。笔记内容仍是通用 Markdown，之后可以迁移。

如果笔记需要独立管理，可创建专门的 `notes` 仓库，在网站构建前 checkout 该仓库并把 Markdown 复制到 `src/content/notes/`。也可以使用 Git submodule，但需要在本地和 CI 中递归拉取。独立仓库更新时，需要额外触发博客的部署。当前实现读取本地目录，尚未配置外部仓库同步。

私有仓库也能作为构建时的数据源，需要在 CI 中配置访问权限；网站生成并公开部署后，已发布笔记仍可被访问。`draft` 用于发布控制，不应当作敏感信息的保密手段。图片建议放在 `public/notes/` 并通过 `/notes/图片名.png` 引用。

GitHub Pages 可从仓库中的源文件发布静态网站，Astro 项目需先构建再部署 `dist/`。如果使用 `用户名.github.io/仓库名/`，需配置 Astro 的 `site` 和 `base`；当前构建优先读取 SITE_URL 或 Cloudflare Pages 提供的 CF_PAGES_URL，本地默认 localhost；参考：[GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。

## 参考项目

以下 star 数为本次查询的 GitHub 页面近似值，会变化。

| 项目 | Stars | 适合的场景 |
| --- | ---: | --- |
| [VitePress](https://github.com/vuejs/vitepress) | 18.4k | 课程笔记、文档站；可折叠的多级侧栏 |
| [Quartz](https://github.com/jackyzha0/quartz) | 13.3k | 个人知识库、数字花园；目录树和关联阅读 |
| [Material for MkDocs](https://github.com/squidfunk/mkdocs-material) | 27.5k | Markdown 文档与课程资料站 |
| [Docsify](https://github.com/docsifyjs/docsify) | 31.5k | 较轻量的 Markdown 文档站 |

本实现参考 [VitePress 的折叠目录](https://vitepress.dev/reference/default-theme-sidebar) 和 [Quartz 的 Explorer](https://quartz.jzhao.xyz/features/explorer) 的组织方式，用现有 Astro 组件实现递归分类。未引入这些项目的运行时或替换 Fuwari 主题。只需要多级分类时，继续扩展当前博客能减少维护两套主题和构建流程的成本。

## 验证与预览

```sh
pnpm check
pnpm build
pnpm dev
```

打开开发服务器的 `/notes/`，展开学期、课程、章节，再点击笔记标题即可阅读。生产构建后，现有 Pagefind 会索引笔记正文。
