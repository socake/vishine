---
title: "每个 PR 一套独立环境：Preview Environment 落地"
date: 2026-05-28T10:00:00+08:00
categories: ["实战手册"]
tags: ["Kubernetes", "CI/CD", "GitOps", "ArgoCD"]
summary: "用 ArgoCD ApplicationSet 的 PR generator 为每个 Pull Request 动态拉起一套独立预览环境，并自动回收。"
toc: true
---

测试同学问"这个 PR 能在哪看效果"是日常高频问题。与其手动部署，不如让每个 PR 自动获得一套独立环境，合并或关闭后自动销毁。

## 为什么要 Preview Environment

共享 staging 的痛点很明确：

- 多个 PR 互相覆盖，测出来的 bug 不知道是谁引入的
- 前端、产品、QA 排队等同一个环境
- 数据库被某次实验性迁移搞脏，全员阻塞

> 核心思想：环境应该像分支一样廉价、可丢弃。每个 PR 一套 namespace 级隔离环境，是性价比最高的方案。

## ApplicationSet + PR Generator

ArgoCD 的 ApplicationSet 配合 SCM/PR generator 可以监听仓库的 open PR 列表，动态生成 Application：

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: preview-envs
  namespace: argocd
spec:
  generators:
    - pullRequest:
        github:
          owner: acme
          repo: web
          tokenRef:
            secretName: github-token
            key: token
        requeueAfterSeconds: 60
  template:
    metadata:
      name: "preview-pr-{{number}}"
    spec:
      project: previews
      source:
        repoURL: https://github.com/acme/web.git
        targetRevision: "{{head_sha}}"
        path: deploy/overlays/preview
        helm:
          parameters:
            - name: image.tag
              value: "{{head_sha}}"
            - name: ingress.host
              value: "pr-{{number}}.preview.acme.dev"
      destination:
        server: https://kubernetes.default.svc
        namespace: "preview-pr-{{number}}"
      syncPolicy:
        automated:
          prune: true
        syncOptions:
          - CreateNamespace=true
```

### 域名规则

统一用 `pr-<number>.preview.acme.dev` 这种可预测的泛域名，配一张 `*.preview.acme.dev` 的通配证书：

1. DNS 加一条 `*.preview.acme.dev` 指向 ingress LB
2. cert-manager 申请通配证书，避免每个 PR 单独签发
3. ingress host 模板里用 PR number 拼接，保证可读、不冲突

## 销毁与回收

PR generator 的杀手锏是自动清理：PR 关闭后对应的 Application 从 generator 结果里消失，`prune: true` 会连带删除 namespace 内所有资源。

需要额外注意几点：

- PVC 默认不会被 prune，要在 Helm chart 里给它们打 `argocd.argoproj.io/sync-options: Delete=true`
- 长时间不活跃的 PR 也要回收，可以加一个 CronJob 扫描 `lastUpdated` 超过 7 天的 namespace
- 数据库用 namespace 内的临时实例，不要连共享库

## 成本控制

```bash
# 给预览 namespace 统一打标签，方便成本归集
kubectl label ns preview-pr-128 cost-center=preview env=ephemeral

# 配合 ResourceQuota 限制单个 PR 的资源上限
kubectl apply -f preview-quota.yaml -n preview-pr-128
```

落地清单：

1. 所有预览 namespace 限定在低优先级 PriorityClass，让生产可抢占
2. 节点池开 Spot 实例承载预览负载
3. 给 ResourceQuota 卡死 CPU/内存，防止某个 PR 把集群吃满
4. 非工作时间用 KEDA 或定时缩容把副本数降到 0

预览环境本质是"用工程化换沟通成本"，跑顺之后整个团队的协作摩擦会肉眼可见地下降。
