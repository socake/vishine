---
title: "部署到 GitHub Pages"
weight: 70
categories: ["实战手册"]
tags: ["部署", "GitHub Pages", "GitHub Actions", "CI/CD"]
summary: "用 GitHub Actions 自动构建并发布到 GitHub Pages，含完整 workflow、baseURL 子路径处理与排坑。"
toc: true
---

{{< lead >}}
push 一下就自动构建上线。这篇给一份可直接用的 GitHub Actions workflow，外加 GitHub Project Pages「子路径」的关键配置。
{{< /lead >}}

## 一、先理清 baseURL

GitHub Pages 有两种部署形态，`baseURL` 写法不同：

| 形态 | 网址 | baseURL |
| --- | --- | --- |
| User/Org Pages | `https://<user>.github.io/` | `https://<user>.github.io/` |
| **Project Pages** | `https://<user>.github.io/<repo>/` | `https://<user>.github.io/<repo>/` |

{{< callout type="warn" >}}
**Project Pages 是子路径部署**，`baseURL` 末尾的 `/<repo>/` 不能漏。漏了会导致 CSS / JS / 封面图全部 404（路径少了仓库名前缀）。vishine 的资源都走 Hugo pipeline，会自动带上正确前缀。
{{< /callout >}}

## 二、GitHub Actions workflow

在仓库建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy Hugo site to Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      HUGO_VERSION: 0.146.0
    steps:
      - name: Install Hugo CLI (extended)
        run: |
          wget -O hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb
          sudo dpkg -i hugo.deb

      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive   # 主题作为 submodule 时必需
          fetch-depth: 0

      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v5

      - name: Build with Hugo
        env:
          HUGO_ENVIRONMENT: production
        run: |
          hugo \
            --minify \
            --baseURL "${{ steps.pages.outputs.base_url }}/"

      - name: Upload artifact
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
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

{{< callout type="info" >}}
关键三点：
- `hugo_extended_...deb` —— 必须装 **extended** 版。
- `submodules: recursive` —— 主题是 submodule 时不加会 checkout 不到主题，构建出空站。
- `--baseURL "${{ steps.pages.outputs.base_url }}/"` —— 让 `configure-pages` 自动算出正确的 baseURL（含子路径），省得手写。
{{< /callout >}}

## 三、开启 Pages

GitHub 仓库 → **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**（不是「Deploy from a branch」）。之后每次 push 到 `main` 就自动构建发布。

## 四、生产构建说明

workflow 里的 `hugo --minify` 在生产模式下会自动：

- CSS / JS **concat + minify + 指纹**（fingerprint）；
- 注入 **SRI integrity** 完整性校验。

本地想模拟生产构建：

```bash
hugo --minify
# 产物在 public/，可用任意静态服务器预览
```

## 五、排坑速查

| 现象 | 排查 |
| --- | --- |
| 上线后样式全丢、图 404 | Project Pages 的 `baseURL` 漏了 `/<repo>/`，或 Source 没选 GitHub Actions |
| 构建出空站 / 没主题 | workflow 漏了 `submodules: recursive` |
| 构建报资源处理错误 | 装的不是 Hugo **extended** |
| Mermaid 不显示 | 确认 `static/js/mermaid.min.js` 存在、子路径 baseURL 正确 |
| Google Fonts 国内加载慢 | `params.googleFonts = false` 回退系统字体 |

{{< callout type="tip" >}}
读完这篇，整套指南就走通了：[安装](../installation/) → [配色](../color-schemes/) → [封面](../auto-cover/) → [shortcodes](../shortcodes/) → [图表](../diagrams/) → [菜单](../menus/) → 部署上线。
{{< /callout >}}
