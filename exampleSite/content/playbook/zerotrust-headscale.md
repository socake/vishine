---
title: "零信任 Mesh 网络：自建 Headscale"
date: 2026-04-22T10:00:00+08:00
categories: ["实战手册"]
tags: ["零信任", "Headscale", "Tailscale", "网络"]
summary: "用开源的 Headscale 自建 Tailscale control plane，靠 ACL 实现零信任访问控制和子网路由。"
toc: true
---

不想把全公司的网络拓扑托管给 Tailscale 的 SaaS，又想要它丝滑的 Mesh 体验？Headscale 就是答案：开源、自托管的 control plane，客户端直接用官方 Tailscale。

## Headscale 和 WireGuard、Tailscale 的关系

先理清三者：

- **WireGuard** 是内核态的加密隧道协议，负责"两个节点之间怎么加密传包"
- **Tailscale** 在 WireGuard 之上加了密钥分发、NAT 穿透、节点发现和一个 SaaS control plane
- **Headscale** 是 Tailscale control plane 的开源自托管实现，客户端仍用官方 Tailscale 二进制

> 数据面是 WireGuard 点对点直连，control plane 只负责协调密钥和路由，不经手你的业务流量。自建 control plane 不会让流量绕路。

## 起一个 control plane

```bash
# docker compose 起 headscale
docker run -d --name headscale \
  -v ./config:/etc/headscale \
  -p 8080:8080 \
  headscale/headscale:latest \
  serve

# 创建用户（namespace）
docker exec headscale headscale users create ops

# 生成预授权 key 给节点接入
docker exec headscale headscale preauthkeys create -u ops --reusable --expiration 24h
```

节点接入只要指向自建的 control plane：

```bash
tailscale up --login-server https://headscale.acme.dev --authkey <PREAUTH_KEY>
```

## ACL 策略：零信任的核心

零信任不是"连上就能访问一切"，而是默认拒绝、按需放行。Headscale 用和 Tailscale 一致的 ACL 语法：

```yaml
{
  "groups": {
    "group:ops": ["alice", "bob"],
    "group:dev": ["carol"]
  },
  "tagOwners": {
    "tag:prod-db": ["group:ops"]
  },
  "acls": [
    { "action": "accept", "src": ["group:ops"], "dst": ["tag:prod-db:5432"] },
    { "action": "accept", "src": ["group:dev"], "dst": ["tag:staging:*"] }
  ]
}
```

要点：

1. 默认 deny，ACL 里没写的一律不通
2. 用 tag 给服务器分类，而不是绑死 IP
3. 生产数据库只放行 ops 组，且限定端口
4. ACL 改动即时下发，不用重启节点

## 子网路由

不可能给每台老旧设备都装 Tailscale，子网路由让一个节点作为网关把整个内网段暴露进 Mesh：

```bash
# 在网关节点上宣告路由
tailscale up --login-server https://headscale.acme.dev \
  --advertise-routes=10.0.0.0/16

# 在 control plane 侧批准这条路由
docker exec headscale headscale routes enable -i 1
```

宣告的路由必须显式 enable，这一步是有意的人工闸门，防止任意节点擅自把大段网络注入 Mesh。

## 运维节点接入清单

- [ ] 节点用 tag 而非用户身份接入，避免和具体人绑定
- [ ] 预授权 key 设短过期 + 一次性，别长期复用
- [ ] 关键网关开启 `--advertise-routes` 后务必在 control plane 审批
- [ ] 定期 `headscale nodes list` 清理下线/废弃节点
- [ ] control plane 自身放在最小暴露面，只开 443/8080

跑顺之后，无论办公室、家里还是云上 VM，全在一张扁平加密网里，ACL 一处定义、处处生效，比一堆零散的安全组清爽太多。
