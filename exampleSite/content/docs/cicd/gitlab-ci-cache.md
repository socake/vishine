---
title: "GitLab CI 缓存与构建提速"
date: 2026-03-15T10:00:00+08:00
categories: ["CI/CD"]
tags: ["CI/CD", "GitLab", "缓存", "构建优化"]
summary: "分清 cache 与 artifacts，配好 key 与依赖缓存，把流水线提速一大截。"
toc: true
---

流水线越跑越慢，多半是每个 job 都在重新拉依赖、重新编译。GitLab CI 的缓存机制用对了，构建时间能砍掉一半以上。

## cache 与 artifacts 的根本区别

两者都跨 job 传文件，但语义完全不同：

- **cache**：加速用，存可重建的内容（依赖、编译中间产物）。丢了无所谓，重新生成即可。
- **artifacts**：交付用，存 job 产出（二进制、测试报告、覆盖率）。下游 stage 默认自动下载。

> 一句话：cache 是“省时间”，artifacts 是“传结果”。别拿 artifacts 当缓存用，会把 artifact 存储撑爆。

## key 策略决定命中率

key 相同才共享缓存。常见写法：

```yaml
build:
  stage: build
  cache:
    key:
      files:
        - go.sum          # go.sum 不变就复用缓存
    paths:
      - .go/pkg/mod/
  script:
    - go build ./...
```

几种 key 用法：

1. `key: ${CI_COMMIT_REF_SLUG}` —— 按分支隔离缓存
2. `key: { files: [package-lock.json] }` —— 锁文件不变才命中，依赖一变自动失效
3. 固定字符串 key —— 全局共享，适合稳定的基础依赖

## 依赖缓存示例

不同语言缓存的目录不一样，关键是把包管理器的下载目录指到工作区内（Runner 只能缓存项目目录下的路径）：

```yaml
variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.pip-cache"
cache:
  key:
    files: [requirements.txt]
  paths:
    - .pip-cache/
```

Node 缓存 `.npm/`、Maven 用 `-Dmaven.repo.local=.m2/repository` 同理。

## Docker layer 缓存

在 CI 里 `docker build` 默认从零开始，没有本地层缓存。用 BuildKit 的 registry 缓存：

```yaml
script:
  - export DOCKER_BUILDKIT=1
  - docker build
      --cache-from $CI_REGISTRY_IMAGE:cache
      --build-arg BUILDKIT_INLINE_CACHE=1
      -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
  - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

`--cache-from` 让构建复用上次推到 registry 的层，未改动的层直接跳过。

## 并行 job 提速

同一 stage 内的 job 并行执行，把互不依赖的任务拆开：

- lint、单元测试、安全扫描放进同一 stage 并行跑
- 用 `parallel: 5` 把大测试集分片
- 用 `needs:` 打破 stage 顺序，让 job 一旦依赖就绪立刻开跑，不必等整个上游 stage

合理拆分后，原本串行 20 分钟的流水线常能压到 8 分钟以内。
