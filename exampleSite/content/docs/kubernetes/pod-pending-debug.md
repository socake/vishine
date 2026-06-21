---
title: "Pod 一直 Pending？六步定位法"
date: 2026-06-10T10:00:00+08:00
categories: ["Kubernetes"]
tags: ["Kubernetes", "排障", "调度", "资源"]
summary: "Pod 卡在 Pending 多半是调度不上，按六个方向逐一排查。"
toc: true
---

`kubectl get pod` 看到一个 Pod 长时间 `Pending`，说明调度器没找到合适节点。原因就那么几类，按下面六步走基本能定位。

## 第一步：先看 describe

所有线索都在事件里：

```bash
kubectl describe pod mypod -n myns
```

翻到底部的 `Events`，调度失败会有一行 `FailedScheduling`，后面括号列出每个节点被拒的原因，比如 `Insufficient cpu`、`node(s) had taint`、`didn't match node selector`。这一步定方向，后面五步是验证。

## 第二步：资源不足

最常见。请求的 CPU/内存超过节点可分配量：

```bash
kubectl describe node <node> | grep -A5 "Allocated resources"
```

> 注意是 `requests` 而非 `limits` 决定调度。requests 写大了，哪怕节点实际很空闲，调度器也认为放不下。

确认手段：把 `resources.requests` 调小，或给集群加节点 / 开 Cluster Autoscaler。

## 第三步：nodeSelector 与 affinity

Pod 指定了标签但没有节点匹配：

```bash
kubectl get nodes --show-labels
```

逐一核对：

- `nodeSelector` 里的 label 节点上是否真的有
- `nodeAffinity` 的 `required` 规则是硬约束，不满足直接调度失败
- `podAntiAffinity` 可能因为同类 Pod 已占满拓扑域而无处可放

## 第四步：污点与容忍

节点带 taint，Pod 没对应 toleration 就调不上去：

```bash
kubectl describe node <node> | grep Taints
```

常见的有 master 节点的 `node-role.kubernetes.io/control-plane:NoSchedule`，以及节点异常时自动打的 `node.kubernetes.io/not-ready`。要么给 Pod 加 toleration，要么换节点。

## 第五步：PVC 未绑定

Pod 挂了 PVC，但 PVC 还是 `Pending`，Pod 也跟着卡住：

```bash
kubectl get pvc -n myns
kubectl describe pvc mypvc -n myns
```

常见原因：

1. 没有匹配的 StorageClass，或写错了名字
2. StorageClass 是 `WaitForFirstConsumer`，要等 Pod 调度时才创建卷（这种通常正常）
3. 静态供给下没有满足容量/访问模式的 PV

## 第六步：资源配额（Quota）

命名空间设了 ResourceQuota，配额用尽后新 Pod 直接被拒：

```bash
kubectl get resourcequota -n myns
kubectl describe resourcequota -n myns
```

`Used` 接近 `Hard` 就是它了。要么清理旧负载，要么调高配额。

## 小结

排查顺序固定：**describe 看事件 → 资源 → 标签亲和 → 污点 → 存储 → 配额**。九成的 Pending 都落在这六类里，事件信息是最快的突破口。
