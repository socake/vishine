---
title: "16 · 赞助卡片与二维码"
slug: "16-sponsor"
weight: 160
date: 2026-10-13
summary: "把方形二维码放进等高卡片，保留原图入口，适配手机与深浅配色。"
---

赞助区只需要配置图片并调用 shortcode。主题负责外观与链接，宿主维护自己的收款码。不要在正文复制整段 HTML，也不要复制示例站作者的收款账户。

## 站点配置

先把自己的图片放进 `static/img/sponsor/`。方形展示图保留完整码点、中心头像和四周白边；原始海报另存一份，供手机打开和保存。

```toml
[params.sponsor]
  title = "请我喝杯咖啡"
  desc = "感谢你的支持。"
  wechat = "/img/sponsor/wechat-qr.svg"
  wechatOriginal = "/img/sponsor/wechat.png"
  alipay = "/img/sponsor/alipay-qr.svg"
  alipayOriginal = "/img/sponsor/alipay.jpg"
```

原图参数可省略，届时链接指向展示图；只配置一个渠道时居中显示，没有图片则不渲染。现有 PNG/JPEG 长海报仍完整显示，不会被主题裁切；想让码点等大，应先准备方形展示图。

## 可复制页面

```markdown
---
title: 赞助支持
toc: false
article:
  showMeta: false
  showCover: false
  showNavigation: false
  showRelated: false
---

感谢你阅读和支持我的内容。

{{</* sponsor */>}}
```

## 实际效果

以下使用**不能付款的占位图**演示布局。复制调用前替换成自己的图片；占位图本身不含可扫描的二维码。

```markdown
{{</* sponsor title="支持作者" desc="以下仅为布局示例，请换成自己的收款码。" wechat="/img/sponsor-placeholder.svg" alipay="/img/sponsor-placeholder.svg" */>}}
```

{{< sponsor title="支持作者" desc="以下仅为布局示例，请换成自己的收款码。" wechat="/img/sponsor-placeholder.svg" alipay="/img/sponsor-placeholder.svg" >}}

## 原图与移动端

点击卡片底部“查看原图”，打开完整图片；浏览器返回后继续阅读。手机上可先保存原图，再用对应 App 识别。暖纸、纯白、暗色都保留白色二维码窗口，窄屏上下排列。两个链接均支持键盘操作。

页面级 `wechat` / `alipay` 参数覆盖站点图片时，原图默认也跟随该图片；如需链接到另一张原始海报，同时传入 `wechatOriginal` / `alipayOriginal`。完整参数、图片准备方法与限制见仓库 `docs/SPONSOR.md`。
