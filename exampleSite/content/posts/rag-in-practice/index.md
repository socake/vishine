---
title: "RAG 实战：从能跑到好用的工程化要点"
date: 2026-06-05T10:00:00+08:00
categories: ["RAG"]
tags: ["RAG", "向量数据库", "Embedding", "检索增强", "LLM"]
summary: "RAG demo 谁都能跑通，难的是召回准、不胡说。讲清切分、检索、重排和评估的工程细节。"
toc: true
---

RAG 的 demo 一晚上能写完，但上线后用户一问就"答非所问"。问题几乎都出在检索这一环，而不是生成。

## 完整流程

1. **切分（chunking）**：把文档切成可检索的片段
2. **embedding**：把 chunk 和 query 编码成向量
3. **检索（retrieval）**：向量库里找最相似的若干片段
4. **重排（rerank）**：用更强的模型对召回结果精排
5. **生成（generation）**：把片段拼进 prompt 交给 LLM

> 一句话：检索决定上限，生成决定下限。召回不到正确片段，再强的模型也只能编。

## chunk 策略

切分粒度直接影响召回质量：

- 太大：一个 chunk 混入多个主题，向量被"平均"掉，相似度失真
- 太小：语义不完整，上下文丢失
- 实践：**按语义边界切**（标题、段落），并加 10%-20% 的重叠（overlap）防止句子被腰斩

```python
def chunk_text(text, size=500, overlap=80):
    chunks, start = [], 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start = end - overlap  # 保留重叠
    return chunks
```

## 向量库选型

| 向量库 | 适用场景 |
| --- | --- |
| pgvector | 已有 Postgres，数据量中小，省一套中间件 |
| Milvus | 亿级向量，高并发，要分布式 |
| Qdrant | 中量级，过滤检索和 payload 能力强，部署轻 |

数据量不大、团队已经在用 PG，直接 pgvector 最省心；上了千万级再考虑 Milvus。

## 混合检索 + rerank

纯向量检索对**关键词精确匹配**（型号、编号、专有名词）很弱，要混合：

```python
# 向量召回 + BM25 关键词召回，结果合并去重
dense_hits = vector_store.search(query_emb, top_k=20)
sparse_hits = bm25.search(query, top_k=20)
candidates = merge_dedup(dense_hits, sparse_hits)

# 用 cross-encoder rerank 精排，取 top 5 进 prompt
ranked = reranker.rerank(query, candidates)[:5]
```

rerank 用 cross-encoder（query 和 doc 一起进模型），比向量的 cosine 相似准得多，是性价比最高的一步优化。

## 评估

别凭感觉说"变好了"，建一个评估集（问题 + 标准答案 + 应命中的 chunk）：

- **召回率 / 命中率**：正确 chunk 有没有进 top-k
- **答案质量**：用更强的 LLM 做 judge 打分，或人工抽检
- **幻觉率**：答案是否有 chunk 支撑，无依据即记为幻觉

每次调切分、换 embedding、改 rerank，都跑一遍评估集对比，才知道是真优化还是自我感动。
