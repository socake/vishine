---
title: "Bash 严格模式：set -euo pipefail 救命指南"
date: 2026-03-08T10:00:00+08:00
categories: ["Shell"]
tags: ["Shell", "Bash", "脚本", "健壮性"]
summary: "一行 set -euo pipefail 让脚本出错即停，避免带病运行酿成事故。"
toc: true
---

默认的 Bash 太宽容了：命令失败照样往下跑，变量打错当空字符串处理。生产脚本带着这些“宽容”运行，迟早出事。开头加上严格模式。

## 三件套

```bash
#!/usr/bin/env bash
set -euo pipefail
```

逐个拆解：

- **`-e`**：任一命令返回非零就立即退出，不再带病往下执行
- **`-u`**：用到未定义变量直接报错，挡住拼写错误和漏传参数
- **`-o pipefail`**：管道里任一环节失败，整条管道就算失败

## 没有 -e 会怎样

```bash
cd /data/backup        # 目录不存在，cd 失败
rm -rf *               # 但脚本继续执行，在当前目录删文件！
```

`cd` 失败后若没 `-e`，`rm -rf *` 会在错误的目录里执行，这是经典的删库事故。加了 `-e`，脚本会停在 `cd` 那一步。

## pipefail 的价值

```bash
# 没有 pipefail：$? 只看最后一个命令 grep，curl 失败被忽略
curl -s https://api.example.com | grep "ok"

# 有了 pipefail：curl 失败 → 整条管道失败 → 脚本退出
```

> 数据处理脚本里这点尤其重要：上游 `curl`/`tar` 失败却被下游 `grep` 掩盖，会导致处理空数据还以为成功。

## -u 与“故意为空”的变量

开了 `-u`，引用可能未设置的变量要给默认值，否则脚本会因合法的空值而中止：

```bash
echo "部署到 ${ENV:-dev}"        # ENV 没设就用 dev
for f in "${FILES[@]:-}"; do     # 空数组也安全
  echo "$f"
done
```

## 配 trap 做清理

`-e` 会让脚本在中途退出，用 `trap` 保证临时资源被清理：

```bash
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT     # 无论正常退出还是出错都执行

cp config.yaml "$tmpdir/"
process "$tmpdir"
```

## 几点补充

1. `set -x` 调试时打开，打印每条执行的命令
2. 已知某条命令允许失败，显式写 `cmd || true`
3. 用 `shellcheck` 静态检查脚本，能提前发现一大半问题

把这几行当成脚本模板的固定开头，能挡掉绝大多数低级却致命的错误。
