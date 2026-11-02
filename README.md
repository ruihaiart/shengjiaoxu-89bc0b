# 集王聖教序習字 · 十八法一天一课

Harry 的个人书法学习站：以《怀仁集王羲之书圣教序》为核心，按「总纲 + 十八法」一天一课，读 · 析 · 临 · 复，配全帖 30 页点字浏览、单字详情、逐字精讲视频与打卡进度。

- `index.html` — 当前版本（v2，课程 / 字帖 / 我的 三个页签）
- `v1.html` — 第一版（今日 / 全帖 / 十八法 / 视频 / 进度）
- `app2/`、`app/` — 两个版本的页面代码（浏览器内由 Babel 编译 JSX）
- `data/` — 课程、十八法、释文、单字切分坐标（boxes）、视频清单
- `assets/rubbing/` 拓本 30 页 · `assets/book/` 《书法入门十八法》书页

纯静态站，无后端；学习进度只存在浏览器 localStorage。依赖 unpkg（React 18 + Babel standalone）与 Google Fonts；视频为 B 站嵌入。

来源：Genspark Designer 项目「书法学习网站规划与设计请求」。更新方式：从该项目拉取最新文件，`圣教序习字 v2.html` → `index.html`、`圣教序习字.html` → `v1.html`，其余目录整体同步后推送，地址不变。

本站仅供个人学习，`robots.txt` 与 `noindex` 已禁止搜索引擎收录。
