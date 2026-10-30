---
title: 交互式知识讲解
weight: 17
slug: 17-interactive
coverLabel: INTERACTIVE
---

本页的图解共享同一套声明式协议、状态与事件引擎。可以调整参数、选择节点或逐步播放；静态说明始终可展开阅读。

## 使用入口

配置既可放在文章目录，也可引用主题 assets 中的共享配置。

```markdown
{{</* interactive src="knowledge-examples/math.yaml" */>}}
```

共享配置可以覆盖已声明状态的初值：

```markdown
{{</* interactive src="knowledge-examples/math.yaml" params=`{"a":2}` */>}}
```

## GPU 并行策略

{{< interactive src="knowledge-examples/gpu.yaml" >}}

## Ring AllReduce

{{< interactive src="knowledge-examples/ring.yaml" >}}

## Pod 调度

{{< interactive src="knowledge-examples/kubernetes.yaml" >}}

## TCP 三次握手

{{< interactive src="knowledge-examples/tcp.yaml" >}}

## 二次函数

{{< interactive src="knowledge-examples/math.yaml" >}}

## 英语句子

{{< interactive src="knowledge-examples/english.yaml" >}}


## 组件组合

{{< interactive src="knowledge-examples/gallery.json" >}}

## 新领域仅新增配置

{{< interactive src="knowledge-examples/resistor.json" >}}
