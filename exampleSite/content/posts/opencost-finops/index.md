---
title: "OpenCost FinOps：Kubernetes 成本可视化实战"
date: 2026-04-10T10:00:00+08:00
categories: ["FinOps"]
tags: ["FinOps", "OpenCost", "Kubernetes", "成本优化"]
summary: "用 OpenCost 把 K8s 的算力成本拆到 namespace / workload 粒度，让降本有据可依。"
toc: true
---

降本不能拍脑袋。OpenCost 把 K8s 的 CPU / 内存 / 存储 / 网络成本拆到 namespace、workload、label 粒度，是 FinOps 的事实基础。

## 部署要点

- 接入云厂商账单 API 拿到真实单价
- 按 label 归集成本到团队 / 业务线
- 配合 Karpenter 做闲置回收

成本可视化之后，下一步才是 rightsizing 和弹性策略。
