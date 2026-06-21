---
title: "彻底搞懂 liveness / readiness / startup 探针"
date: 2026-06-02T10:00:00+08:00
categories: ["Kubernetes"]
tags: ["Kubernetes", "健康检查", "探针", "可用性"]
summary: "三种探针各管一摊，配错参数会引发滚动重启甚至服务雪崩。"
toc: true
---

K8s 的三种探针经常被混用，结果不是该重启的不重启，就是健康的实例被反复杀掉。先把职责分清。

## 三种探针各管什么

- **liveness（存活）**：判断容器是不是“卡死了”。失败 → 重启容器。
- **readiness（就绪）**：判断容器能不能接流量。失败 → 从 Service Endpoints 摘除，但不重启。
- **startup（启动）**：判断慢启动应用是否已完成初始化。成功前，liveness 和 readiness 都暂停。

> 一句话记忆：liveness 决定“要不要杀”，readiness 决定“要不要发流量”，startup 给慢启动的应用一段保护期。

## 一个完整配置

```yaml
spec:
  containers:
    - name: web
      image: myorg/web:1.4
      startupProbe:
        httpGet:
          path: /healthz
          port: 8080
        failureThreshold: 30
        periodSeconds: 5          # 最长容忍 30*5=150s 启动
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
        periodSeconds: 5
        failureThreshold: 3
      livenessProbe:
        httpGet:
          path: /healthz
          port: 8080
        periodSeconds: 10
        failureThreshold: 3
        timeoutSeconds: 2
```

## 关键参数

| 参数 | 含义 |
|------|------|
| `initialDelaySeconds` | 容器启动后多久开始探测 |
| `periodSeconds` | 探测间隔 |
| `timeoutSeconds` | 单次探测超时 |
| `failureThreshold` | 连续失败几次才判定失败 |
| `successThreshold` | 连续成功几次才判定恢复（readiness 可设 >1）|

## 误用一：liveness 探到依赖

最危险的反模式：让 liveness 去检查数据库、下游服务这类外部依赖。

后果是雪崩：数据库抖动 → 所有 Pod 的 liveness 同时失败 → 全部被重启 → 重启风暴让数据库更扛不住。**liveness 只检查进程自身是否卡死，依赖检查交给 readiness。**

## 误用二：startup 给得太短

慢启动应用（JVM 预热、加载大模型）没配 startupProbe，或 `failureThreshold × periodSeconds` 小于真实启动时间，会在启动期被 liveness 当成“卡死”反复杀掉，永远起不来。

## 误用三：探测太激进

`timeoutSeconds` 设成 1 秒、`periodSeconds` 设成 1 秒，应用稍有 GC 抖动就被误判。合理做法：

1. liveness 宽松，给足容错，避免误杀
2. readiness 可以稍敏感，快速摘流量
3. 健康检查接口要轻量，别在里面查库、算复杂逻辑
