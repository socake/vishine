---
title: "CI/CD 流水线模板化：别再复制粘贴 YAML"
date: 2026-04-08T10:00:00+08:00
categories: ["实战手册"]
tags: ["CI/CD", "GitLab", "GitHub Actions", "DRY"]
summary: "用 GitLab include/extends/!reference 和 GitHub reusable workflows 把流水线 YAML 收进模板仓库统一治理。"
toc: true
---

几十个仓库各自维护一份几乎一样的 `.gitlab-ci.yml`，改一个构建参数要 PR 几十次——这是典型的反模式。流水线也是代码，同样要 DRY。

## 复制粘贴的代价

最初每个项目独立写流水线，问题很快暴露：

- 安全扫描规则更新了，要手动同步到所有仓库
- 新人照着旧模板抄，把过时的写法越传越广
- 各仓库行为细微不一致，排查 CI 问题先得搞清这个仓库到底用的哪版

> 流水线配置一旦超过三个仓库共用，就该抽模板了。判断标准很简单：你是否在多个文件里维护同一段逻辑。

## GitLab：三件套

### include 复用整段配置

把通用 job 放进模板仓库，业务仓库 include 进来：

```yaml
include:
  - project: 'platform/ci-templates'
    ref: v2.3.0
    file: '/templates/build.yml'
  - project: 'platform/ci-templates'
    ref: v2.3.0
    file: '/templates/security.yml'

build:
  extends: .build-node
  variables:
    NODE_VERSION: "20"
```

### extends 做继承

模板里定义带 `.` 前缀的隐藏 job 作为基类，业务仓库 extends 后覆盖局部字段：

```yaml
.build-node:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths: [node_modules/]
```

### !reference 精确复用片段

当你只想复用某个 job 的 `script` 数组而非整个 job，`!reference` 比 extends 更外科手术：

```yaml
deploy:
  script:
    - !reference [.login, script]
    - kubectl apply -f k8s/
```

## GitHub Actions：reusable workflows

GitHub 这边对应能力是可复用工作流。模板仓库里定义 `workflow_call` 触发的工作流：

```yaml
# platform/.github/workflows/node-ci.yml
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: "20"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
      - run: npm ci && npm run build
```

业务仓库一行调用：

```yaml
jobs:
  ci:
    uses: acme/platform/.github/workflows/node-ci.yml@v2.3.0
    with:
      node-version: "20"
```

## 版本化治理

模板仓库一旦被几十个项目依赖，就要像对待 API 一样管它：

1. 所有引用都用 tag（`@v2.3.0`），禁止用 `main`，避免上游一动全员爆炸
2. 遵循语义化版本，破坏性变更升大版本并写迁移说明
3. 模板仓库自己也要有 CI：lint YAML、跑示例项目验证
4. 用 `latest` 浮动 tag 给愿意吃螃蟹的仓库做灰度
5. 重大变更走废弃期，先告警提示再移除旧入口

收口到模板仓库之后，"全公司升级 Node 构建镜像"从几十个 PR 变成一个 PR + 打个 tag，这就是模板化的复利。
