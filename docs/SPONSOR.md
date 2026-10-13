# 赞助卡片

在正文中使用单标签 `{{< sponsor >}}`，读取宿主的 `params.sponsor`。组件负责等高卡片、品牌标识、方形图片窗口、原图链接和窄屏布局；收款账户、图片与文案由宿主维护。无需 JavaScript，不创建支付订单，也不自动收款。

## 配置与覆盖

```toml
[params.sponsor]
  title = "请我喝杯咖啡"
  desc = "感谢你的支持。"
  wechat = "/img/sponsor/wechat-qr.svg"
  wechatOriginal = "/img/sponsor/wechat.png"
  alipay = "/img/sponsor/alipay-qr.svg"
  alipayOriginal = "/img/sponsor/alipay.jpg"
```

图片放在宿主 `static/img/sponsor/`。以上文件名仅是示例，必须使用自己的收款码；不要复制主题作者的收款账户。`wechat`、`alipay` 可直接使用 PNG、JPEG、WebP 或自有 SVG，也可用 HTTPS 图片 URL。

| 参数 | 默认与限制 |
| --- | --- |
| `title` / `desc` | 可选纯文本；shortcode 参数优先于站点配置，最后使用 i18n 默认文案。空值仍回退。 |
| `wechat` / `alipay` | 可选图片 URL；两者至少一个有效才有卡片。未配置的渠道不渲染；两者均未配置时整个模块不渲染。 |
| `wechatOriginal` / `alipayOriginal` | 可选原始收款海报 URL；默认链接到相应展示图。用于保留可保存的 PNG/JPEG 原图。 |

```markdown
{{< sponsor title="支持作者" wechat="/img/my-qr.png" wechatOriginal="/img/my-poster.png" >}}
```

所有参数都可写在 shortcode。单独覆盖某渠道的展示图时，原图默认改为该展示图，**不会继承站点配置中另一个账户的原图**；如要保留海报，显式同时传入对应 Original 参数。未覆盖的另一渠道仍读取站点配置。旧的四参数写法继续有效。

这是单标签组件，不接受正文或嵌套的 shortcode；可在文章、关于页和赞助页重复调用。没有固定 DOM ID。站点本地路径通过 Hugo `relURL` 处理，支持部署到子目录。URL 和图片内容不在构建时校验；文件不存在会显示图片替代文本，原图链接仍保留，发布前须检查实际资源。

## 图片准备

推荐展示图只保留二维码与中心头像，并在四周保留至少四个模块宽的纯白静区。两张图使用相同的方形画布和相近的二维码占比。主题会完整缩放图片，不用 `object-fit: cover` 裁掉码点；因此旧的长海报能继续显示，但其中的二维码仍可能大小不一，需由宿主准备方形展示图。

本仓库作者的示例使用 SVG 显示窗口：把原始 PNG/JPEG 的字节嵌入 SVG，在固定窗口内显示二维码区域，外围补白。原图不重编码，不重新生成码点或头像；保留原海报作为链接目标。SVG 中不得加入脚本或远程依赖。更换收款海报时应重新确定窗口范围，并实际解码核对账户；旧坐标不能套用到新图。

GitHub README 使用同一对方形 SVG，声明相同的 `width` / `height` 并放在两列表格中。不能依赖 GitHub 过滤掉的自定义 CSS 来修复对齐。

## 布局与验收

桌面双列等高，单渠道居中；540px 及以下上下排列。暖纸、纯白和暗色共用主题表面变量，二维码窗口始终纯白。原图链接可用 Tab 聚焦、Enter 打开、浏览器返回；手机可打开原始海报后保存，再到对应支付 App 识别。组件不假定浏览器支持直接唤起支付 App。

源码与实际效果见教程 16；成品组合见示例站 `/sponsor/`。验收包括桌面与 320/390px、三种配色、单码/无码/旧海报兼容、键盘和原图返回，以及从实际页面截图识别二维码，核对与原图解码结果一致。构建成功不能代替扫码与视觉检查。
