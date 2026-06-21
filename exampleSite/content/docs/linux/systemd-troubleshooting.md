---
title: "systemd 服务排障：从 failed 到 running"
date: 2026-05-18T10:00:00+08:00
categories: ["Linux"]
tags: ["Linux", "systemd", "排障", "日志"]
summary: "一套从查状态、看日志到定位退出码的 systemd 服务排障流程。"
toc: true
---

服务起不来时，先别急着重装。systemd 把状态、日志、依赖都记录得很清楚，按顺序看一遍基本能定位。

## 第一步：看状态

```bash
systemctl status myapp.service
```

重点看三行：

- `Active:` 是 `failed`、`activating` 还是 `inactive`
- `Main PID:` 后面括号里的退出原因，如 `(code=exited, status=1/FAILURE)`
- 末尾的 `Process:` 行，能看到具体哪条 ExecStart 失败

## 第二步：翻日志

`status` 只给最后几行，完整日志用 journalctl：

```bash
journalctl -u myapp.service -e          # 跳到最新
journalctl -u myapp.service --since "10 min ago"
journalctl -u myapp.service -b          # 仅本次启动后
journalctl -u myapp.service -p err      # 只看 error 级别
```

> 提示：加 `-f` 可以实时跟踪，配合 `systemctl restart` 一边重启一边看输出，定位启动期报错最快。

## 常见退出码对照

| status | 含义 | 排查方向 |
|--------|------|----------|
| 1 | 通用错误 | 看应用自身日志 |
| 126 | 命令不可执行 | 权限或不是可执行文件 |
| 127 | 命令未找到 | ExecStart 路径写错 |
| 203 | EXEC 失败 | 二进制不存在或解释器缺失 |
| 200/217 | 用户/组不存在 | User= 配置的账号没建 |

## Type 选错也会“假失败”

unit 文件里的 `Type=` 决定 systemd 怎么判断启动成功：

1. `simple`（默认）：fork 出主进程即认为成功，适合前台进程
2. `forking`：进程自行 daemon 化，必须配 `PIDFile=`
3. `notify`：进程通过 `sd_notify` 主动上报就绪
4. `oneshot`：跑完即退出，常配 `RemainAfterExit=yes`

把一个会自我 daemon 化的程序写成 `simple`，systemd 会以为它退出了，于是反复重启。

## Restart 策略

```ini
[Service]
Restart=on-failure
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=3
```

`Restart=always` 会把一个根本起不来的服务无限重启，刷满日志。排障期间建议先临时改成 `Restart=no`，让它停在失败现场。

## 依赖与排序

服务依赖没满足时，会卡在 `activating` 或被跳过：

- `Requires=` 强依赖，目标失败则本服务也失败
- `After=` 只管启动顺序，不代表依赖
- 用 `systemctl list-dependencies myapp.service` 看整棵依赖树

## coredump 兜底

进程被信号杀死（如 SIGSEGV）时，应用日志往往什么都没留下：

```bash
coredumpctl list
coredumpctl info myapp
coredumpctl gdb myapp      # 直接进 gdb 看栈
```

改完 unit 文件记得 `systemctl daemon-reload`，否则改动不生效——这是最容易踩的坑。
