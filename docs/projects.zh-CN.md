# 项目代码

导航入口 `/projects/`，管理入口 `/admin/` → 项目代码。

新建项目填写名称、简介和创建日期，可以上传源码压缩包、导入 README.md，或填写 GitHub 等代码仓库地址。访客在项目详情页可以下载源码、打开仓库和演示，并阅读 README 中的代码块。代码上传后储存在 Git 仓库中，无需额外数据库。

附件使用 zip、tar、gz、tgz 或 7z，建议不超过 20MB。网页提供下载，不在服务器运行上传的代码。大项目用仓库链接更方便维护。

项目默认公开；「隐藏为草稿」只隐藏项目页面，不会隐藏已上传的 `public/uploads` 附件。只上传准备公开分享的代码。删除项目条目后，附件需在媒体库单独删除；源码与页面可通过 Git 历史恢复。

也可以手动在 `src/content/projects` 新建 Markdown 文件：

```markdown
---
title: 我的项目
description: 项目的简短介绍
published: 2026-10-06
draft: false
technologies: [Python, Astro]
status: active
repository: https://github.com/你的账号/仓库名
source: /uploads/projects/code.zip
order: 0
---

## 使用方式

在这里写 README 或代码片段。
```

`source` 需要先上传对应文件，不上传时省略该字段。`status` 可填 `active`（进行中）、`completed`（已完成）或 `archived`（已归档）。`updated`、`demo`、`image` 可选；排序先按 `order` 从小到大，再按创建日期从新到旧。保存后等待 Cloudflare Workers 完成生产部署。
