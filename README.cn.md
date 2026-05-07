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
