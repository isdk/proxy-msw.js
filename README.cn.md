# @isdk/proxy-msw

[@isdk/proxy](https://github.com/isdk/proxy.js) 的 MSW (Mock Service Worker) 适配器。

此包提供了一个拦截器，可将 `@isdk/proxy` 的高性能缓存引擎无缝集成到基于 MSW 的开发流程中。

## 核心特性

- **🔌 无缝 MSW 集成**：利用 `@mswjs/interceptors` 全局捕获网络请求。
- **⚡ 强悍性能**：继承自 `@isdk/proxy` 的 L1/L2 混合缓存、元数据驻留及 SWR 特性。
- **🛡️ 无冲突设计**：内置 `fetchBypass` 机制，有效避免无限拦截循环。
- **🛠️ 灵活配置**：支持针对不同域名的 Header、Cookie 及 Query 参数自定义缓存规则。

## 安装

```bash
pnpm add @isdk/proxy-msw @isdk/proxy
```

## 快速开始

```typescript
import { createMswCacheInterceptor } from '@isdk/proxy-msw';

const interceptor = await createMswCacheInterceptor({
  storagePath: './.cache', // 可选：默认为系统临时目录
  default: { staleIfError: true },
  sites: {
    'api.github.com': {
      // 仅包含 q 参数作为指纹，排除授权头
      query: { include: ['q'] },
      headers: { exclude: ['authorization'] }
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
  default: { staleIfError: true },
  activeCacheWrites: sharedCacheWrites
});
mswInterceptor.start();

// 应用内其他使用 fetchWithCache 的拦截器
const fetchWithCache = createFetchWithCache(sharedCacheWrites);
// 现在两个拦截器共享同一个追踪器，实现应用范围内的请求合并
```

## API 参考

### `createMswCacheInterceptor(config)`

创建一个基于 MSW 的智能缓存拦截器。

#### 参数

- `config` (`ProxyConfig & { activeCacheWrites?: Map<string, Promise<void>> }`): 配置对象。
  - `storagePath` (`string`, 可选): 缓存存储目录路径。默认为系统临时目录。
  - `default` (`object`, 可选): 应用于所有站点的默认缓存规则。
  - `sites` (`object`, 可选): 针对特定域名的缓存规则。
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
5. 使用专门的“旁路 fetch”执行真实网络请求，确保不会再次触发拦截器。

## 同级依赖 (Peer Dependencies)

此包需要同时安装 `@isdk/proxy` 核心库。

## 许可证

MIT
