---
title: "K8s 成本优化实战：Karpenter 弹性伸缩"
date: 2026-05-12T10:00:00+08:00
categories: ["实战手册"]
tags: ["Kubernetes", "Karpenter", "成本优化", "AWS"]
summary: "用 Karpenter 替代 Cluster Autoscaler，靠 Spot 实例、consolidation 和 bin-packing 把集群账单砍掉一半。"
toc: true
---

把一个跑着 Cluster Autoscaler 的 EKS 集群切到 Karpenter 之后，月度账单从一万二降到六千。这篇记录配置要点和踩坑。

## Karpenter 和 Cluster Autoscaler 的区别

Cluster Autoscaler 基于预先定义好的 ASG（节点组）扩缩，扩容时要先选组、再让云厂商起机器，粒度受限于你提前定义的实例规格。Karpenter 直接面向 Pod 的真实需求，实时计算"该起一台什么样的机器"，跳过 ASG。

> 一句话：Cluster Autoscaler 是在固定货架里挑商品，Karpenter 是按需现做。后者在异构负载下省得更多。

主要优势：

- 无需维护一堆 ASG / 节点组
- 秒级感知 pending pod，几十秒内拉起新节点
- 原生 bin-packing，挑最省的实例规格

## NodePool 与 EC2NodeClass

Karpenter 用两个 CRD：`NodePool` 描述调度约束，`EC2NodeClass` 描述底层 AWS 配置。

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64", "arm64"]
        - key: karpenter.k8s.aws/instance-category
          operator: In
          values: ["c", "m", "r"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 1m
  limits:
    cpu: "1000"
```

EC2NodeClass 部分指定 AMI、子网、安全组：

```yaml
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: default
spec:
  amiFamily: AL2023
  role: KarpenterNodeRole-prod
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: prod
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: prod
```

## Spot 实例怎么用才稳

把 `capacity-type` 同时放 spot 和 on-demand，Karpenter 会优先 spot，拿不到再回落 on-demand。但 Spot 会被回收，要做好准备：

1. 给无状态服务用 Spot，有状态服务（数据库、有 PVC 的）固定 on-demand
2. 实例规格池开得越宽，被同时回收的概率越低，别只挑一两种机型
3. 配 PodDisruptionBudget，让回收时不会一次性干掉全部副本
4. Karpenter 自带 Spot 中断处理，监听 EC2 中断事件提前优雅迁移

## consolidation 整理

`consolidationPolicy: WhenEmptyOrUnderutilized` 是省钱关键。Karpenter 会持续评估：能不能把几台低负载节点上的 Pod 挤到更少、更便宜的机器上，然后干掉空出来的节点。

```bash
# 观察 consolidation 行为
kubectl logs -n karpenter -l app.kubernetes.io/name=karpenter | grep -i consolidat

# 查看当前由 Karpenter 管理的节点
kubectl get nodeclaims
```

## bin-packing 注意事项

Karpenter 的 bin-packing 依赖准确的 resource requests。如果 requests 填得虚高，它会按虚高的值打包，节点利用率上不去。务必：

- 用 VPA 或历史监控校准 requests，别拍脑袋
- requests 和 limits 不要差太多，否则打包模型失真
- 关键负载加 topologySpreadConstraints，避免被打包到同一节点带来单点风险

切过来之后建议盯一周 consolidation 日志，确认没有把有状态负载反复搬来搬去，稳定了再放手。
