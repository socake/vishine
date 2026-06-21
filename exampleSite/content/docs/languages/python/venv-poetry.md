---
title: "Python 依赖管理：venv / pip-tools / Poetry 怎么选"
date: 2026-04-08T10:00:00+08:00
categories: ["Python"]
tags: ["Python", "依赖管理", "Poetry", "venv"]
summary: "三种主流方案各有适用场景，按项目规模和可复现性需求来选。"
toc: true
---

Python 依赖管理工具一堆，新人最容易在这卡住。其实就三类思路：原生隔离、锁定编译、一体化管理。

## 三种方案速览

| 方案 | 隔离环境 | 锁定版本 | 适合场景 |
|------|----------|----------|----------|
| venv + pip | ✅ | ❌（需手动 freeze）| 简单脚本、临时环境 |
| pip-tools | ✅（配 venv）| ✅ requirements.lock | 已有 requirements 流程的项目 |
| Poetry | ✅（自动）| ✅ poetry.lock | 库开发、需要发布到 PyPI |

## venv：标准库自带

最轻量，无需安装额外工具：

```bash
python -m venv .venv
source .venv/bin/activate
pip install requests
pip freeze > requirements.txt
```

问题在于 `pip freeze` 把直接依赖和间接依赖混在一起，且不区分“我要的”和“被带进来的”，时间一长难以维护。

## pip-tools：分离声明与锁定

只手写顶层依赖，由工具编译出带哈希的完整锁文件：

```bash
pip install pip-tools
# requirements.in 里只写: requests, flask
pip-compile requirements.in        # 生成 requirements.txt（含全部传递依赖）
pip-sync requirements.txt          # 让环境与锁文件完全一致
```

> `requirements.in` 是你的意图，`requirements.txt` 是可复现的结果。升级依赖只需改 `.in` 再重新 compile。

## Poetry：一体化

依赖、虚拟环境、打包发布一把抓，配置集中在 `pyproject.toml`：

```bash
poetry init
poetry add requests              # 自动写入 pyproject.toml 并更新 poetry.lock
poetry add --group dev pytest    # 区分开发依赖
poetry install                   # 按 lock 文件还原环境
poetry run pytest                # 在虚拟环境里执行命令
```

`poetry.lock` 保证团队和 CI 装到完全一致的版本。要发布到 PyPI 时 `poetry build && poetry publish` 一步到位。

## 怎么选

- 写个一次性脚本：**venv + pip** 足够，别上重型工具
- 部署应用、已有 requirements 习惯：**pip-tools**，改造成本最低，可复现性强
- 开发要发布的库、想要现代化工作流：**Poetry**，体验最完整

无论选哪种，**锁文件一定要提交进 git**，这是可复现构建的前提。
