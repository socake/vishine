---
title: "Go context 的几个坑：取消、超时与传值"
date: 2026-05-06T10:00:00+08:00
categories: ["Go"]
tags: ["Go", "context", "并发", "最佳实践"]
summary: "context 用错会泄漏 goroutine、超时不生效、传值变成隐式依赖。"
toc: true
---

`context` 几乎贯穿所有 Go 服务端代码，但用错的地方也最多。这里列几个高频坑。

## 坑一：忘了 cancel，goroutine 泄漏

`WithCancel`、`WithTimeout` 都返回 `cancel`，**无论是否提前结束都必须调用**，否则计时器和派生的 context 不会被回收：

```go
ctx, cancel := context.WithTimeout(parent, 3*time.Second)
defer cancel() // 一定要 defer，哪怕正常返回也要释放

resp, err := http.DefaultClient.Do(req.WithContext(ctx))
```

`go vet` 会对漏掉的 cancel 报 `lostcancel`，CI 里务必开着。

## 坑二：超时不生效，因为没向下传

context 的取消是协作式的——你必须把它传给真正阻塞的调用，它才有意义：

```go
// 错误：起了 ctx 却没人用
ctx, cancel := context.WithTimeout(parent, time.Second)
defer cancel()
data, _ := db.Query("SELECT ...") // 没传 ctx，超时形同虚设

// 正确
data, _ := db.QueryContext(ctx, "SELECT ...")
```

> 凡是可能阻塞的库函数，几乎都有带 `Context` 后缀的版本，优先用它。

## 坑三：把 context 存进结构体

context 应当**显式作为函数第一个参数逐层传递**，而不是塞进 struct 字段：

```go
// 反模式
type Server struct {
    ctx context.Context // 不要这样
}

// 推荐
func (s *Server) Handle(ctx context.Context, req *Req) error { ... }
```

存进结构体会让生命周期变得模糊，一个长生命周期对象持有了一个早该取消的 context。

## 坑四：用 WithValue 传业务参数

`context.WithValue` 只适合传**请求作用域的元数据**（trace ID、用户身份），不该用来传函数本该显式接收的业务参数：

```go
// 可以：横切关注点
ctx = context.WithValue(ctx, traceIDKey{}, "abc-123")

// 不要：本该当参数传的东西
ctx = context.WithValue(ctx, "userID", 42) // 隐式依赖，类型不安全
```

key 要用自定义私有类型而非裸字符串，避免跨包冲突。

## 坑五：检查取消的姿势

长循环里要主动检查取消信号，否则 cancel 了也停不下来：

```go
for {
    select {
    case <-ctx.Done():
        return ctx.Err() // 返回 context.Canceled 或 DeadlineExceeded
    case job := <-jobs:
        process(job)
    }
}
```

记住几条铁律：

1. context 永远是第一个参数，命名为 `ctx`
2. 不要传 `nil` context，不确定时用 `context.TODO()`
3. cancel 必须被调用，用 `defer` 保证
