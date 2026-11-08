# 集王聖教序習字 · 十八法一天一课

Harry 的个人书法学习站：以《怀仁集王羲之书圣教序》为核心，按「总纲 + 十八法」一天一课，读 · 析 · 临 · 复，配全帖 30 页点字浏览、单字详情、逐字精讲视频与打卡进度。

- `index.html` — 当前版本（v2，课程 / 字帖 / 我的 三个页签）
- `v1.html` — 第一版（今日 / 全帖 / 十八法 / 视频 / 进度）
- `app2/`、`app/` — 两个版本的页面源码（JSX，来自 Genspark 项目，原样保留）
- `dist/` — 部署时由源码预编译出的脚本（React 18 正式版 + 每个版本一个数据包、一个应用包，文件名带内容哈希）
- `sw.js` — Service Worker：缓存页面壳与拓本图，第二次打开不再下载，离线也能开
- `data/` — 课程、十八法、释文、单字切分坐标（boxes）、视频清单
- `assets/rubbing/` 拓本 30 页（`thumb/` 为字帖页缩略条用的小图）· `assets/crops/` 1903 个单字切图（部署时按切字坐标从拓本切出，米字格 / 单字详情只下载这几 KB，不再拉整页）· `assets/book/` 《书法入门十八法》书页

纯静态站，无后端；学习进度只存在浏览器 localStorage。运行时不依赖任何第三方脚本 CDN（React 随站点一起发布，JSX 在部署时预编译）；字体用系统宋体（Songti SC / TC 等，不再加载 Google Fonts）；视频为 B 站嵌入。拓本 / 书页 JPG 为渐进式编码（无损转换）。

来源：Genspark Designer 项目「书法学习网站规划与设计请求」。更新方式：从该项目拉取最新文件，`圣教序习字 v2.html` → `index.html`、`圣教序习字.html` → `v1.html`，其余目录整体同步，再依次运行部署脚本 `patch-mobile/apply.py`（手机壳 / 米字格补丁）和 `patch-mobile/build/build.js`（预编译 + Service Worker + 单字切图 + 缩略图 + 渐进式图片）后推送，地址不变。

本站仅供个人学习，`robots.txt` 与 `noindex` 已禁止搜索引擎收录。
