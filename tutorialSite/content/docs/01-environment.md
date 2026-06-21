---
title: "01 · 环境准备：装好 Hugo 与 Git"
slug: "01-environment"
weight: 21
date: 2026-06-21
categories: ["环境准备"]
tags: ["Hugo", "Git", "安装", "命令行"]
summary: "动手前先装两样东西：Hugo extended（生成网站的引擎）和 Git（版本管理 + 拉取主题）。本章给三大系统的安装命令并验证成功。"
toc: true
---

{{< lead >}}
搭站之前，先把两件工具装好：**Hugo**（把 Markdown 变成网站的引擎）和 **Git**（管理代码、顺便用来拉主题）。本章保证你装完、验证通过，再进入下一步。
{{< /lead >}}

## 一、先搞清楚两个名词

- **Hugo**：一个「静态网站生成器」。你写 Markdown（一种纯文本写作格式），Hugo 把它们 + 主题，编译成一堆现成的 HTML 网页。它快、不需要数据库，生成的就是普通文件，丢到任何服务器都能跑。
- **Git**：版本控制工具。记录你每次改了什么、能回退；同时我们会用它把 vishine 主题「拉」到本地。

{{< callout type="warn" >}}
**一定要装 Hugo 的 extended（扩展）版本，且版本 ≥ 0.146.0。**
vishine 用到了 Hugo 的资源处理管线（图片缩放、SVG 内联、CSS/JS 打包指纹）——这些只有 extended 版才有。装成普通版会在构建时直接报「资源处理」错误。
{{< /callout >}}

## 二、安装 Hugo extended

按你的操作系统三选一。

### macOS（用 Homebrew）

Homebrew 是 macOS 上最常用的「软件包管理器」（一条命令装软件的工具）。装好的就是 extended 版：

```bash
brew install hugo
```

### Windows（用 winget 或 Scoop）

```powershell
# 方式 A：系统自带的 winget
winget install Hugo.Hugo.Extended

# 方式 B：Scoop（需先装 scoop）
scoop install hugo-extended
```

{{< callout type="warn" >}}
Windows 上注意包名要带 **Extended**。`winget install Hugo.Hugo`（不带 Extended）装的是普通版，跑 vishine 会报错。
{{< /callout >}}

### Linux（推荐直接下官方 deb / 二进制）

发行版仓库里的 Hugo 往往太旧，建议从 GitHub Releases 装最新 extended：

```bash
# Debian / Ubuntu：下载官方 extended deb 包安装
HUGO_VERSION=0.146.0
wget -O hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb
sudo dpkg -i hugo.deb
```

## 三、验证 Hugo 装对了

这是最关键的一步。运行：

```bash
hugo version
```

你应该看到类似输出，**注意必须有 `extended` 字样**：

```text
hugo v0.146.0+extended linux/amd64 BuildDate=...
```

{{< callout type="tip" >}}
看到 `+extended` 且版本号 ≥ 0.146.0 就对了。如果没有 `extended`，回到上一步用「扩展版」的包名/命令重装。
{{< /callout >}}

## 四、安装并配置 Git

### 安装

```bash
# macOS
brew install git

# Windows（winget）
winget install Git.Git

# Debian / Ubuntu
sudo apt update && sudo apt install -y git
```

### 验证 + 首次配置

```bash
git --version              # 看到版本号即安装成功

# 第一次用 Git，告诉它你是谁（提交记录会署名）
git config --global user.name  "你的名字"
git config --global user.email "你的邮箱@example.com"
```

## 五、检查清单

进入下一章前，确认这三条都 ✅：

| 检查项 | 命令 | 期望 |
| --- | --- | --- |
| Hugo 是 extended | `hugo version` | 输出含 `+extended` |
| Hugo 版本够新 | `hugo version` | ≥ `0.146.0` |
| Git 可用 | `git --version` | 输出版本号 |

{{< callout type="info" >}}
两样都装好了？下一章 **[02 · 安装 vishine](../02-install/)** 教你新建站点、把主题拉进来，并第一次在本地把网站跑起来。
{{< /callout >}}
