---
title: 批量数据体积：最小交互写作示例
draft: true
toc: true
---

这是作者起步模板。复制为文章包的`index.md`，并将同目录的`parameter-lab.yaml`复制到文章包的`diagrams/parameter-lab.yaml`。正式写作时按主题、读者和事实改写。

## 先确定模型

此例只计算“每批数量 × 单项体积”，单位为MiB，不把它等同于实际网络流量或GPU显存需求。

## 试着改变数量

先保持单项体积为4 MiB，将数量从8改成16。总量应从32 MiB变为64 MiB。

{{< interactive src="diagrams/parameter-lab.yaml" >}}

## 解释观察结果

在线性模型里，数量翻倍会使理想总量翻倍。判断实际开销时，还需要另外考虑压缩、协议头、对齐及应用自身的数据结构。
