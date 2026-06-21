# vishine

> A knowledge-portal Hugo theme for technical blogging — built for long-term writing on DevOps, cloud-native, and AI engineering.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Hugo extended ≥ 0.146](https://img.shields.io/badge/Hugo-extended%20%E2%89%A5%200.146-ff4088?logo=hugo&logoColor=white)](https://gohugo.io/)
[![中文优先](https://img.shields.io/badge/lang-中文优先-d22128.svg)](#)
[![forked from Blowfish](https://img.shields.io/badge/forked%20from-Blowfish-1d3f8a.svg)](https://blowfish.page/)

**[Live Demo](https://socake.github.io/vishine/)** · **[Tutorial Site](https://socake.github.io/vishine/tutorial/)** · **[Usage Docs](docs/USAGE.md)** · **[Getting Started](docs/GETTING-STARTED.md)**

🌐 [中文](README.md) · **English** · [日本語](README.ja.md)

---

## Why another theme?

I've been writing a technical blog for years and have piled up more than two hundred posts of hard-won, in-the-trenches notes. For a long time I used [Blowfish](https://blowfish.page/) — a great theme, but something always felt just slightly off:

What I wanted wasn't a "list of blog posts" but a **knowledge portal** that could orchestrate **blog posts, hands-on playbooks, roadmaps, docs, and resources** all in one place. I wanted content to be color-coded by section automatically, so readers can tell at a glance whether they're looking at a battle-tested incident report or a learning roadmap. I wanted every post — even one without an image — to get a presentable cover instead of a row of dull gray placeholder boxes. And I wanted the Chinese reading experience to flow just a little better — letter spacing, line height, code blocks, the table-of-contents tree — every detail worthy of words you actually put effort into.

So vishine was born. Standing on the shoulders of Blowfish, it adds a color-coded section system, a bento-style portal homepage, a pure-Hugo-native automatic cover generator, a ⌘K command-palette search, and more. At its core, it turns "the blog I personally want to use every day" into a theme anyone can pick up and use.

If you're serious about writing a technical blog too, I hope it helps.

---

## Screenshots

### 🖥 Desktop

| Home (bento portal) | Article + TOC tree | Image-left, text-right list |
| :---: | :---: | :---: |
| ![Home](docs/images/screenshot-home.png) | ![Article](docs/images/screenshot-article.png) | ![List](docs/images/screenshot-list.png) |
| **⌘K Command Palette** | **Dark Scheme** | **Warm Paper Scheme** |
| ![Command Palette](docs/images/screenshot-cmdk.png) | ![Dark](docs/images/screenshot-dark.png) | ![Paper](docs/images/screenshot-paper.png) |
| **Shortcodes Showcase** | **Auto Covers (4 layouts)** | **Tutorial Site** |
| ![shortcodes](docs/images/screenshot-shortcodes.png) | ![Covers](docs/images/screenshot-covers.png) | ![Tutorial](docs/images/screenshot-tutorial.png) |

### 📱 Mobile

| Home | Article | Sponsor | Drawer Menu |
| :---: | :---: | :---: | :---: |
| ![Mobile Home](docs/images/screenshot-m-home.png) | ![Mobile Article](docs/images/screenshot-m-article.png) | ![Mobile Sponsor](docs/images/screenshot-m-sponsor.png) | ![Drawer Menu](docs/images/screenshot-mobile.png) |

---

## Features

**Visuals & Color**
- Three switchable color schemes: warm paper `paper` / clean white `clean` / `dark`, toggled globally via CSS tokens, persisted in `localStorage`, applied inline before render — no flash.
- Color coding across five sections: content is colored by section (blog / playbook / roadmap / ops docs / resources), categories can map to section colors, all configured in one place (`data/sections.toml`).
- Bento-style knowledge-portal homepage: a modular card grid that arranges the latest content from each section into a portal you can scan in one glance.

**Content Presentation**
- Image-left, text-right feed list: instant category / tag filtering plus load-more.
- Automatic cover generator: when a post has no image, a cover is generated from "title + category" with 4 layouts (orbit / grid / diagonal / arc) rotated by hash and tinted with the section color — **pure Hugo native, zero external dependencies**; `[params.cover]` lets you tune the style, lock a layout, or turn it off.

**Interaction & Navigation**
- ⌘K command-palette search: site-wide search across titles / summaries / categories / tags.
- Collapsible table-of-contents tree + reading progress bar, with scrollspy highlighting.
- Multi-level dropdown menus in the top bar: `identifier` parent items + `parent` child items.
- Responsive & accessible: mobile drawer navigation, `prefers-reduced-motion` support, keyboard reachable.

**Writing Power**
- Self-hosted Mermaid: rendered automatically from ` ```mermaid ` fences, recoloring with the scheme, **no CDN dependency**, usable on intranets / offline.
- Blowfish-compatible shortcodes: `badge` / `lead` / `callout` / `typeit` / `timeline` / `sponsor`.
- One-click copy on code blocks, automatic `figure` wrapping for images with click-to-zoom, and auto-scaling for extra-wide bitmaps.
- Multilingual i18n: UI strings ship in **26 languages** (Chinese / English / Japanese / Korean / French / German / Spanish / Portuguese / Russian / Arabic / Traditional Chinese…), switchable from the top bar with one click and extensible further.

---

## Two Example Sites

| Site | What it is | URL |
| --- | --- | --- |
| **Finished Demo** | A complete blog filled with sample posts, showing what the theme really looks like | [socake.github.io/vishine](https://socake.github.io/vishine/) |
| **Tutorial Site** | A full hands-on tutorial rendered with the theme itself, from installing Hugo to going live | [socake.github.io/vishine/tutorial](https://socake.github.io/vishine/tutorial/) |

If you're new, start with the **Tutorial Site** — it walks you step by step through getting the theme up and running.

---

## Quick Start

### 1. Install the theme

```bash
# Option A: Git submodule (recommended, easier to update later)
git submodule add https://github.com/socake/vishine.git themes/vishine

# Option B: clone directly
git clone https://github.com/socake/vishine.git themes/vishine
```

### 2. Minimal working `hugo.toml`

> The blocks marked ⚠ will **break things if omitted** — copy them verbatim. For the full annotated version, see [`exampleSite/hugo.toml`](exampleSite/hugo.toml).

```toml
baseURL = "https://example.org/"
title   = "我的博客"
theme   = "vishine"
defaultContentLanguage = "zh-cn"   # ⚠ Chinese-first theme, be sure to set this
enableEmoji = true

[pagination]
  pagerSize = 8

# ⚠ Required: taxonomies. Section color mapping, filtering, and homepage stats all depend on it
[taxonomies]
  tag = "tags"
  category = "categories"

# ⚠⚠ Easiest trap: omit JSON and the /index.json for ⌘K search 404s, search silently fails
[outputs]
  home = ["HTML", "RSS", "JSON"]

# ⚠ Required: render hooks depend on these goldmark / highlight settings
[markup]
  [markup.goldmark.renderer]
    unsafe = true            # ⚠ shortcodes emit inline HTML, this is required
  [markup.goldmark.parser]
    autoHeadingID = true
    [markup.goldmark.parser.attribute]
      title = true
      block = true
  [markup.highlight]
    noClasses = false
  [markup.tableOfContents]
    startLevel = 2
    endLevel = 3

[menu]
  [[menu.main]]
    name = "博客"
    pageRef = "/posts"
    weight = 10

[params]
  author = "你的名字"
  defaultScheme = "clean"   # paper / clean / dark
```

### 3. Run it

```bash
hugo server -D
```

Open `http://localhost:1313/` in your browser. Stuck somewhere? The [Tutorial Site](https://socake.github.io/vishine/tutorial/) has more detailed step-by-step instructions with screenshots.

---

## Configuration at a Glance

> The following is only a quick overview; the full explanation of every option lives in [`docs/USAGE.md`](docs/USAGE.md) and the [Tutorial Site](https://socake.github.io/vishine/tutorial/).

### Section color coding

The theme presets five section colors (`blog` / `play` / `road` / `docs` / `res`, plus an `ai` red). Map **category names** to section classes to drive the color of cards / tags / auto covers, configured in your own site's `data/sections.toml`:

```toml
[categories]
  "Kubernetes" = "docs"
  "云原生"      = "play"
  "FinOps"     = "road"
  "大模型"      = "res"
  "故障复盘"    = "ai"
```

Categories with no match automatically fall back to the section color of their parent section, with `blog` as the final fallback.

### Automatic covers

When a post has no `featured.*` asset and no `cover` in frontmatter, a cover is generated automatically:

```toml
[params.cover]
  auto  = true        # false = off, rely solely on featured images
  style = "auto"      # auto (hash-rotated 4 layouts) | orbit | grid | diagonal | arc
  # ignoreFeatured = false   # true = force auto covers even when a featured image exists (handy when migrating styles)
```

### Multi-level dropdown menus

Parent items use `identifier`, child items attach via `parent` to form a dropdown:

```toml
[[menu.main]]
  name = "运维"
  identifier = "ops"
  weight = 40
[[menu.main]]
  name = "Kubernetes"
  parent = "ops"
  pageRef = "/docs/kubernetes"
  weight = 41
```

---

## Built-in Shortcodes

| Shortcode | Usage | Description |
| --- | --- | --- |
| `badge` | `{{< badge >}}content{{< /badge >}}` | Inline mini badge |
| `lead` | `{{< lead >}}intro{{< /lead >}}` | Lead paragraph at the start of a post |
| `callout` | `{{< callout type="warn\|info\|tip" >}}…{{< /callout >}}` | Callout box (defaults to `info`) |
| `typeit` | `{{< typeit >}}text{{< /typeit >}}` | Eye-catching pull-quote block |
| `timeline` | one line per `node \| stage \| keyword` | Vertical timeline / roadmap |
| `sponsor` | `{{< sponsor >}}` | Sponsor / tip jar section (payment QR codes configured via `params.sponsor`) |

Write `mermaid` diagrams in a ` ```mermaid ` fence — they render automatically, recolor with the scheme, and are self-hosted with no CDN dependency.

---

## Documentation Index

| Document | Contents |
| --- | --- |
| [Tutorial Site](https://socake.github.io/vishine/tutorial/) | Step-by-step illustrated tutorial (from installing Hugo to going live, best for beginners) |
| [`docs/GETTING-STARTED.md`](docs/GETTING-STARTED.md) | Quick guide from zero to live |
| [`docs/USAGE.md`](docs/USAGE.md) | Detailed usage docs (option-by-option config, writing, troubleshooting, FAQ) |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Design system (color tokens, section colors, components, layout) |
| [`docs/INTERACTION.md`](docs/INTERACTION.md) | Interaction guidelines |
| [`docs/MARKDOWN.md`](docs/MARKDOWN.md) | Markdown rendering conventions |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contribution guide |

---

## Sponsor

vishine is something I've been tinkering together bit by bit in my spare time, and the docs and demo site are an ongoing work too. If it saved you some time, or you simply appreciate the effort behind it, feel free to buy me a coffee ☕

<table>
  <tr>
    <td align="center"><img src="docs/images/sponsor-wechat.png" width="220" alt="WeChat sponsor"><br><b>WeChat</b></td>
    <td align="center"><img src="docs/images/sponsor-alipay.jpg" width="220" alt="Alipay sponsor"><br><b>Alipay</b></td>
  </tr>
</table>

Every bit of your support becomes the motivation to keep maintaining it and keep writing the docs.

---

## Star History

If this project is useful to you, a Star is the most direct encouragement you can give ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=socake/vishine&type=Date)](https://star-history.com/#socake/vishine&Date)

---

## Acknowledgements

vishine is a fork of **[Blowfish](https://github.com/nunocoracao/blowfish)** (© Nuno Coração, MIT), retaining the original author's attribution. Thanks to Blowfish for the solid foundation and excellent shortcode design — without it, there would be no vishine.

---

## License

This theme is released under the **[MIT License](./LICENSE)**, copyright © 2024-2026 Xinghui (Wenzhuo Huang).

> What's open-sourced is the **theme** itself; `exampleSite/` and the tutorial site are for demonstration only and contain **no** real blog posts.

---

Crafted with love by **Xinghui (Wenzhuo Huang)** · [github.com/socake/vishine](https://github.com/socake/vishine)
