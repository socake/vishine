---
title: "DevOps 工程师成长路径"
date: 2026-06-20T10:00:00+08:00
categories: ["路线图"]
tags: ["DevOps", "成长路径", "Kubernetes", "CI/CD"]
summary: "从 Linux 基础到平台工程，分三阶段的 DevOps 成长路线——每阶段给该掌握的技能点和值得动手的项目。"
toc: true
---

这是一条把"会用工具"打磨成"能扛系统"的成长路线。不追求面面俱到，而是每个阶段给出**该掌握的技能点**和**值得动手做的项目**，照着走能少踩很多坑。

> 路线图的价值不在于背清单，而在于知道下一步该往哪挖。卡住的时候回来看一眼，比盲目刷教程强。

## 阶段一 基础

打地基，重点是 Linux、网络和脚本能力，别急着上 K8s。

1. **Linux 系统**：进程、文件系统、权限、systemd、journald 日志排查
2. **网络基础**：TCP/IP、DNS、HTTP、TLS 握手、抓包（tcpdump / Wireshark）
3. **Shell 与脚本**：Bash 熟练，能写带错误处理的自动化脚本
4. **版本控制**：Git 分支模型、rebase、解决冲突、写清楚 commit message
5. **一门胶水语言**：Python 或 Go，能写小工具、调 API

推荐项目：

- 用 Bash + cron 写一套服务器巡检脚本，输出磁盘 / 内存 / 进程健康报告
- 手动在一台云主机上从零部署一个 Web 应用（Nginx + 后端 + 数据库）

## 阶段二 进阶

进入容器与编排世界，开始把"部署"变成"声明式 + 可复现"。

1. **容器**：Docker 镜像分层、多阶段构建、镜像瘦身、容器网络与存储
2. **Kubernetes**：Pod / Deployment / Service / Ingress、ConfigMap、探针、资源限制
3. **CI/CD**：GitHub Actions 或 GitLab CI，构建-测试-发布流水线
4. **IaC**：Terraform 管理云资源，理解状态文件与模块化
5. **可观测入门**：Prometheus 指标、Grafana 看板、日志聚合

推荐项目：

- 把阶段一的 Web 应用容器化，用 Helm Chart 部署到 K8s
- 搭一条完整流水线：push 代码自动构建镜像、跑测试、滚动发布到集群

## 阶段三 资深

从"把东西跑起来"到"对系统稳定性和效率负责"。

1. **GitOps**：Argo CD / Flux 做声明式持续交付，集群即代码
2. **深度可观测**：OpenTelemetry 全链路追踪、SLO / SLI、告警降噪
3. **服务网格**：Istio / Linkerd 的流量治理、熔断、灰度
4. **平台工程**：抽象内部开发者平台（IDP），降低团队心智负担
5. **稳定性工程**：混沌工程、容量规划、故障复盘文化

推荐项目：

- 用 Argo CD 把多环境（dev/staging/prod）发布全部 GitOps 化
- 给一个微服务系统接入 OpenTelemetry，定义 SLO 并配置基于错误预算的告警

> 资深的分水岭不是用了多少花哨技术，而是出事时能不能稳住，事后能不能让系统变得更不容易出事。
