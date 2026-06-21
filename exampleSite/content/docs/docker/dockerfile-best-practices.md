---
title: "Dockerfile 最佳实践：更小更快更安全"
date: 2026-04-22T10:00:00+08:00
categories: ["Docker"]
tags: ["Docker", "镜像优化", "多阶段构建", "安全"]
summary: "用多阶段构建、层缓存、非 root 与 distroless 把镜像做小做安全。"
toc: true
---

一个 Go 服务的镜像，写得随意能到 900MB，写得讲究只要 15MB。差距全在 Dockerfile 的几个细节上。

## 多阶段构建

把编译环境和运行环境分开，最终镜像只留二进制：

```dockerfile
# 构建阶段
FROM golang:1.22 AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/server ./cmd/server

# 运行阶段
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/server /server
USER nonroot:nonroot
ENTRYPOINT ["/server"]
```

## 善用层缓存

Docker 按指令逐层缓存，**变动频率低的放上面**。先 copy 依赖清单再下载，最后才 copy 源码：

1. `COPY go.mod go.sum` → 依赖没变就命中缓存
2. `RUN go mod download` → 直接复用
3. `COPY . .` → 只有这层因代码改动失效

如果把 `COPY . .` 放在 `go mod download` 前面，每改一行代码都要重新拉全部依赖。

## .dockerignore 不能省

没有它，`COPY . .` 会把 `.git`、`node_modules`、本地日志全塞进构建上下文：

```
.git
node_modules
*.log
dist/
.env
```

> 构建上下文越小，`docker build` 发送给 daemon 的数据越少，构建越快，也避免把密钥误打进镜像。

## 用非 root 用户

容器里默认 root，一旦逃逸风险很大。显式建一个普通用户：

```dockerfile
RUN addgroup --system app && adduser --system --ingroup app app
USER app
```

distroless 的 `nonroot` 变体已经内置了非 root 用户，直接 `USER nonroot` 即可。

## distroless 与镜像选择

按需求从轻到重：

- `scratch`：空镜像，只放静态二进制，最小但没 shell
- `distroless/static`：带 CA 证书、tzdata，无 shell、无包管理器
- `alpine`：有 shell 方便调试，但 musl libc 偶尔有兼容坑
- `debian-slim`：兼容性最好，体积最大

无 shell 意味着攻击面小，但也无法 `docker exec` 进去 debug，调试期可临时换 alpine。

## 镜像扫描

构建完顺手扫一遍已知漏洞：

```bash
trivy image myorg/server:latest
docker scout cves myorg/server:latest
```

把扫描放进 CI，发现 HIGH/CRITICAL 漏洞就让流水线失败，比上线后再补救划算得多。
