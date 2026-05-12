# @isdk/proxy-msw

[@isdk/proxy](https://github.com/isdk/proxy.js) 的 MSW (Mock Service Worker) 适配器。

此包提供了一个拦截器，可将 `@isdk/proxy` 的高性能缓存引擎无缝集成到基于 MSW 的开发流程中。

## 核心特性

- **🔌 无缝 MSW 集成**：利用 `@mswjs/interceptors` 全局捕获网络请求。
- **⚡ 强悍性能**：继承自 `@isdk/proxy` 的 L1/L2 混合缓存、元数据驻留及 SWR 特性。
- **🛡️ 无冲突设计**：内置 `fetchBypass` 机制，有效避免无限拦截循环。
- **🛠️ 灵活配置**：支持针对不同域名的 Header、Cookie、Query 参数及请求体自定义缓存规则。

## 安装

```bash
pnpm add @isdk/proxy-msw @isdk/proxy
```

## 快速开始

```typescript
import { createMswCacheInterceptor } from '@isdk/proxy-msw';

const interceptor = await createMswCacheInterceptor({
  storagePath: './.cache', // 可选：默认为系统临时目录
  staleIfError: true, // 默认规则，应用于所有站点
  sites: {
    'api.github.com': {
      query: { q: true },      // 将 'q' 参数纳入缓存键
      headers: { authorization: false }  // 排除出缓存键
    }
  }
});

// 启动拦截
interceptor.start();

// 结束时销毁
// interceptor.dispose();
```

## 共享缓存写入追踪器

通过在 MSW 拦截器和应用内其他使用 `@isdk/proxy` 的 `fetchWithCache` 的拦截器之间共享 `activeCacheWrites` Map，您可以实现应用范围内的请求合并。

**注意**：避免创建多个 `MswCacheInterceptor` 实例，因为它们会多次注入 fetch 和 node HTTP 模块。正确的做法是在应用内其他使用底层 `fetchWithCache` 的拦截器间共享追踪器。

```typescript
import { createMswCacheInterceptor } from '@isdk/proxy-msw';
import { createFetchWithCache } from '@isdk/proxy';

// 创建一个共享的缓存写入追踪器
const sharedCacheWrites = new Map();

// MSW 拦截器
const mswInterceptor = await createMswCacheInterceptor({
  storagePath: './.cache',
  staleIfError: true,
  activeCacheWrites: sharedCacheWrites
});
mswInterceptor.start();

// 应用内其他使用 fetchWithCache 的拦截器
const fetchWithCache = createFetchWithCache(sharedCacheWrites);
// 现在两个拦截器共享同一个追踪器，实现应用范围内的请求合并
```

## 缓存状态标头

由 `@isdk/proxy` 处理并返回的所有 `Response`，其 Headers 中都会注入 `X-Proxy-Cache` 字段以便观测生命周期：

| 值 | 描述 |
|---|---|
| `HIT` | 完美命中，数据完全来自于 L1 内存或 L2 磁盘缓存。 |
| `MISS` | 缓存未命中（或主动绕过缓存），数据真实来自于源站请求。 |
| `STALE` | 命中过期缓存（已通过 SWR 机制在后台发起了静默网络更新）。 |
| `STALE_IF_ERROR` | 源站请求失败（网络断开或报错），系统作为兜底强制返回了过期的旧缓存。 |

```typescript
const response = await fetch('https://api.github.com/users');
console.log(response.headers.get('X-Proxy-Cache')); // 如果已缓存则为 'HIT'
```

## API 参考

### `createMswCacheInterceptor(config)`

创建一个基于 MSW 的智能缓存拦截器。

#### 参数

- `config` (`ProxyConfig & { activeCacheWrites?: Map<string, Promise<void>> }`): 配置对象。
  - 有关 `ProxyConfig` 和 `ProxyCacheRule` 的详细类型定义，请参阅 [@isdk/proxy](https://github.com/isdk/proxy.js) 文档。
  - `activeCacheWrites` (`Map<string, Promise<void>>`, 可选): 并发追踪器 Map，用于追踪正在进行的缓存写入操作。如果不提供，将自动创建一个新的内部 Map。在多个拦截器间共享同一个 Map 可以实现应用范围内的请求合并。

#### 返回值

返回一个 Promise，解析为包含以下属性的对象：

- `start(): void` - 启动拦截器，开始监听请求。
- `dispose(): void` - 销毁拦截器并停止工作。释放所有资源。
- `cache` (`SmartCache`) - 底层 `SmartCache` 实例，可用于手动管理缓存。
- `activeCacheWrites` (`Map<string, Promise<void>>`) - 当前使用的并发追踪器 Map。可传递给其他拦截器以实现请求合并。

## 工作原理

此适配器封装了 `@isdk/proxy` 的核心 `fetchWithCache` 函数。当 MSW 拦截到请求时：

1. 通过 `@isdk/proxy` 计算唯一的缓存键。
2. 检查内存或磁盘中是否存在缓存。
3. 若缓存有效，立即返回响应。
4. 若缓存过期但允许 SWR，则返回旧数据并在后台异步更新。
5. 使用专门的"旁路 fetch"执行真实网络请求，确保不会再次触发拦截器。

## 同级依赖 (Peer Dependencies)

此包需要同时安装 `@isdk/proxy` 核心库。

## 许可证

MIT
