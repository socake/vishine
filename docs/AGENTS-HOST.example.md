# 博客侧 Agent 入口模板

将下面内容合并进**宿主博客根目录**的 AGENTS.md。先确认主题位置，替换路径；保留宿主已有指令。不要假设 Agent 会自动读取 themes 子目录的 AGENTS.md。

```markdown
# 博客维护约定

本仓库负责内容、图片、自有图表文件与站点配置；公共页面和组件由 vishine 主题提供。

开始任何呈现或组件工作前：
1. 查看本仓库 git status、hugo.toml 的 theme、模块或 themesDir 配置，确定本次构建真正使用的主题目录。
2. 读取该主题的 AGENTS.md 和 docs/COMPONENTS.md；按任务再读参数文档。
3. 优先使用 Markdown、front matter、主题参数及现有 shortcode；不在文章中添加公共组件的 style/script 或复制模板。
4. 如果现有能力不足，在主题中实现公共能力，并补配置契约、可运行示例和必要验证。站点只添加调用。
5. 不改写文章事实、命令和 URL 来迁就视觉；迁移保留锚点与重定向。
6. 本地构建并检查真实文章；保留未提交修改。提交、推送和部署必须获得用户授权。

默认 submodule 位置：themes/vishine/。
若通过 --themesDir 使用外部工作副本，以实际启动命令为准，不要同时修改两份主题。
发布前确认仓库内 submodule 已指向验收过的主题提交，不能仅凭外部副本预览成功就认为线上会生效。

图表与阅读导航：
- 简单流程用 Mermaid；独立 SVG、照片和截图用 Markdown 图片。
- 已有可信的 HTML 图表时，先读主题 docs/HTML-EMBED.md，文件放 static/diagrams/，正文使用 html-embed；不默认转成位图，也不复制 iframe/CSS/JS 到文章。
- html-embed 的 src 只接受本地 .html，title 必填；支持 Archify 嵌入约定才用 mode="archify"。优先用 fit="width" 适应正文，minWidth 供“放大细节”切换；旧调用只写 minWidth 仍保留宽度下限。普通 page 模式用 height 控制高度。
- 嵌入文件可运行同源脚本，必须是自己维护并信任的文件。检查真实文章的文字大小、底部裁切、键盘滚动、配色和完整图表入口。
- 本页目录、栏目浏览和上下章导航使用主题 docs/THEME-APIS.md 的 article / readingNav 配置；栏目浏览在悬浮目录和手机目录抽屉内切换，不另造一套栏目树。
```

如果只写普通文章，读取组件目录后可直接写 Markdown；无需改主题实现。主题开发规则和博客编辑规则各有范围，发生冲突时先依据用户任务和实际目录确认责任。
