# Shirone 扩展功能配置

沿用本站后台、个人数据和字体；UI 配置在 `src/ui-config.ts`，收藏数据在 `src/data/site-extras.json`。官方参考：[文档](https://docs.shirone.mysqil.com/)、[演示](https://shirone.akatsuki.codes/)、[源码](https://github.com/LyraVoid/Shirone)。

## 评论

`comments.enable` 默认关闭。`provider` 可选 `giscus`、`twikoo`、`none`。Giscus 填写 `repo`、`repoId`、`category`、`categoryId`；Twikoo 填写 `twikooEnvId`，可更改 HTTPS `twikooScriptUrl`。两者均在读者点击「加载评论」后请求服务。文章 frontmatter 的 `comment: false` 可单独关闭。实际可用性取决于你自己的服务配置。

## 音乐

`music.provider` 支持 `local`（后台音乐数据）、`custom`（配置中的 `tracks`）、`meting`、`mixed`（合并本地、自定义和远程）。曲目需要 `title`、`source`，可选 `id`、`artist`、`cover`；空 ID 自动补齐。合并时按 ID 和音源去重。

```ts
music: {
  enable: true,
  provider: "mixed",
  tracks: [],
  meting: {
    server: "netease", type: "playlist", id: "你的歌单编号",
    api: "", // 留空采用参考主题的默认 Meting API
    preload: "none", // metadata 可在播放器进入视口时预取歌单
  },
  defaultVolume: 0.7,
  defaultMode: "sequence",
}
```

自定义 Meting API 支持 `:server`、`:type`、`:id`、`:r` 占位符，需允许浏览器跨域请求并返回曲目 JSON。默认点击才加载远程歌单，不自动播放；远程失败时混合模式仍能播放本地曲目。支持顺序/单曲循环/随机、进度、音量、列表，音量保存在浏览器。关闭音乐或没有可用配置时不显示播放器。

## 相册

后台相册支持独立详情页、分类、网格/瀑布流、2–4 列、隐藏、密码及照片元数据。照片可填写 `title`、`description`、`date`、`location`、`camera`、`lens`、`settings`、`tags`、`width`、`height`、`thumbnail`。大图支持前后切换、方向键、手机左右滑动、缩放、全屏与原图链接。

也可在 `public/images/albums/相册ID/` 放置 `info.json`、`cover.jpg` 或 `cover.webp` 及照片。封面是必需项。本地照片自动扫描，`标题_标签1_标签2.jpg` 自动提取标签；存在同名 WebP 时优先 WebP。`info.json` 的示例：

```json
{"title":"旅行","date":"2026-10-11","layout":"masonry","columns":3,"location":"香港","tags":["旅行"],"hidden":false}
```

外部相册增加 `mode: "external"`、HTTPS `cover` 与 `photos` 数组。后台相册和目录相册的 ID 必须唯一。设置密码后，照片清单与描述加密输出，正确解锁才生成图库；空密码的 `encrypted: true` 会使构建失败。`hidden` 仅隐藏列表入口，仍可通过详情 URL 访问。

**密码保护不加密公开图片文件，也不保护 GitHub 源文件。** `public/` 中的图片仍是公开资源，源数据中的原文与密码也仍在源码仓库。需要保护原始内容时应使用私有仓库和受控附件服务。

## 系列和固定链接

后台「文章系列」对应 `src/content/series/*.md`，支持标题、描述、状态、默认分类和 Markdown 总览。文章可增加：

```yaml
series: my-series
seriesOrder: 2
comment: true
alias: old-name
permalink: stories/my-article
```

系列页及文章内导航按 `seriesOrder`、发布日期排序；未填写文章分类时继承系列默认分类。系列入口在侧栏和更多菜单。

`alias` 生成 `/posts/old-name/`；`permalink` 生成根目录自定义 URL，优先级更高。旧 `/posts/原slug/` 保留访问，首页、归档、系列、订阅、分享及后台发布状态使用规范地址。路径冲突、系统保留目录、文件名、查询参数、路径穿越会使构建失败。

`uiConfig.permalink.enable` 可启用全局模板，默认关闭。支持 `%year%`、`%monthnum%`、`%day%`、`%hour%`、`%minute%`、`%second%`（UTC），以及 `%post_id%`、`%postname%`、`%raw_postname%`、`%category%`。序号按发布时间升序计算；显式 `permalink` 优先于模板。

## 动态与快捷操作

后台动态支持草稿、置顶、日期、地点、心情、标签、Markdown 和图片；公开动态按置顶及日期排序。站点罗盘、设备、技能、游戏、时间线共用原后台，无参考作者的个人内容。

手机悬浮按钮提供首页、文章目录、评论和回到顶部；隐藏评论和加密标题不会产生可见入口。桌面右键菜单提供复制选中文字、复制链接、回到顶部及新标签打开链接，支持键盘导航。按住 Shift 保留浏览器菜单；输入框与正在打开的弹窗保留原交互。

## 适配范围

已迁入参考主题的外观、显示偏好、文章扩展、系列、动态/收藏/相册、评论和音乐能力。按要求以本站笔记/项目替代友链/番剧，保留本站 GitHub OAuth、Decap、PDF 和源码附件功能。保留 Astro 5 / Svelte 5 与现有依赖规格，未改造成 Shirone 的 npm 主题安装器或其独立内容仓库架构。原十种语言资源保留，新扩展的后台和交互文案使用中文。

历史 `deploy-v0.1.0` Release 保留；最新功能在两个仓库的 `main` 分支，部署工具继续可用。
