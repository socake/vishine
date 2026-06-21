---
title: "09 · 部署到 GitHub Pages：完整 Actions workflow"
slug: "09-deploy"
weight: 41
date: 2026-06-21
categories: ["部署"]
tags: ["部署", "GitHub Pages", "GitHub Actions", "CI/CD", "baseURL"]
summary: "用 GitHub Actions 自动构建并发布到 GitHub Pages：先理清 baseURL 子路径，给一份可直接用的完整 workflow，再讲开启 Pages 与排坑。"
toc: true
---

{{< lead >}}
push 一下就自动构建上线。本章给一份可直接复制的 GitHub Actions workflow，外加 GitHub「项目站点」子路径部署的关键配置 —— 这是新手最容易踩坑的地方。
{{< /lead >}}

## 一、先理清 baseURL

**baseURL** 是站点最终的网址前缀，会被拼进所有链接、CSS/JS 引用、封面图路径。GitHub Pages 有两种部署形态，写法不同：

| 形态 | 网址 | baseURL |
| --- | --- | --- |
| 用户/组织站点 | `https://<用户名>.github.io/` | `https://<用户名>.github.io/` |
| **项目站点** | `https://<用户名>.github.io/<仓库名>/` | `https://<用户名>.github.io/<仓库名>/` |

{{< callout type="warn" >}}
**项目站点是「子路径」部署**，`baseURL` 末尾的 `/<仓库名>/` 不能漏。漏了会导致 CSS / JS / 封面图全部 404（路径少了仓库名前缀）—— 表现就是「上线后页面只剩裸文字、样式全丢」。好在下面的 workflow 会自动算出正确的 baseURL，你不用手写。
{{< /callout >}}

## 二、GitHub Actions workflow

**GitHub Actions** 是 GitHub 内置的自动化（CI/CD）系统：你在仓库里放一个 yaml 文件描述「代码一推上来就执行哪些步骤」，它就会在云端帮你跑。

在仓库根目录建文件 `.github/workflows/deploy.yml`：

```yaml
name: Deploy Hugo site to Pages

on:
  push:
    branches: [main]      # 推到 main 分支就触发
  workflow_dispatch:      # 也允许在网页上手动触发

# 授予 workflow 部署 Pages 所需的权限
permissions:
  contents: read
  pages: write
  id-token: write

# 同一时间只跑一个部署，避免互相覆盖
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      HUGO_VERSION: 0.146.0
    steps:
      - name: 安装 Hugo CLI（extended 版）
        run: |
          wget -O hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb
          sudo dpkg -i hugo.deb

      - name: 拉取代码
        uses: actions/checkout@v4
        with:
          submodules: recursive   # ★ 主题作为 submodule 时必需，否则拉不到主题
          fetch-depth: 0

      - name: 配置 Pages
        id: pages
        uses: actions/configure-pages@v5

      - name: 用 Hugo 构建
        env:
          HUGO_ENVIRONMENT: production
        run: |
          hugo \
            --minify \
            --baseURL "${{ steps.pages.outputs.base_url }}/"

      - name: 上传产物
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: 部署到 GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

{{< callout type="info" >}}
这份 workflow 的三个关键点：

- `hugo_extended_...deb` —— 必须装 **extended** 版（和本地一致，见 [01 章](../01-environment/)）。
- `submodules: recursive` —— 主题是 submodule 时不加，会拉不到主题，构建出空站。
- `--baseURL "${{ steps.pages.outputs.base_url }}/"` —— 让 `configure-pages` 自动算出正确的 baseURL（含子路径），省得手写、也不会写错。
{{< /callout >}}

## 三、开启 Pages

GitHub 仓库 → **Settings → Pages → Build and deployment → Source**，选 **GitHub Actions**（不是「Deploy from a branch」）。之后每次 push 到 `main` 就自动构建并发布。

## 四、本地模拟生产构建

workflow 里的 `hugo --minify` 在生产模式下会自动把 CSS/JS 合并、压缩、加指纹（fingerprint），并注入 SRI 完整性校验。想在本地预演：

```bash
hugo --minify
# 产物在 public/ 目录，可用任意静态服务器预览
```

{{< callout type="tip" >}}
**用 `--themesDir` 构建多站点**：如果你像本教程仓库一样，把站点目录和主题放在同级（主题在上一层），可以用
`hugo --source 你的站点目录 --themesDir ..` 指定去哪找主题。日常单站点则不需要。
{{< /callout >}}

## 五、排坑速查

| 现象 | 排查 |
| --- | --- |
| 上线后样式全丢、图 404 | 项目站点 `baseURL` 漏了 `/<仓库名>/`，或 Source 没选 GitHub Actions |
| 构建出空站 / 没主题 | workflow 漏了 `submodules: recursive` |
| 构建报「资源处理」错误 | 装的不是 Hugo **extended** 版 |
| Mermaid 不显示 | 确认 `static/js/mermaid.min.js` 存在、子路径 baseURL 正确 |
| ⌘K 搜索打开却搜不到 | `[outputs] home` 漏了 `"JSON"`（见 [03 章](../03-configuration/)） |

{{< callout type="info" >}}
站点上线了！最后一章 **[10 · 进阶技巧与排坑](../10-advanced/)** 汇总最容易踩的坑和省心写法，建议收藏。
{{< /callout >}}
