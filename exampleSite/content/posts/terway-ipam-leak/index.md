---
title: "故障排查实录：Terway CRD IPAM IP 泄漏导致 Pod 无法调度"
date: 2026-04-06T10:00:00+08:00
categories: ["故障复盘"]
tags: ["故障复盘", "Terway", "CNI", "Kubernetes", "网络"]
summary: "一次 Pod 大面积 Pending 的根因排查：Terway CRD 模式下 IP 没被回收，最终耗尽。"
toc: true
---

某天 Pod 大面积 `Pending`，事件里全是 `failed to allocate IP`。排查顺序：日志 → CRD → IPAM 池。

## 根因

Terway CRD 模式下，Pod 删除后对应的 `PodENI` / IP 没有被及时回收，IP 池被泄漏的记录占满，新 Pod 拿不到 IP。

## 处置

1. 对账：列出 IPAM 已分配 vs 实际存活 Pod
2. 清理：回收孤儿 IP 记录
3. 根治：升级 Terway 修复回收逻辑 + 加 IP 池水位告警
