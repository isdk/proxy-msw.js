[**@isdk/proxy-msw**](../README.md)

***

[@isdk/proxy-msw](../globals.md) / createMswCacheInterceptor

# Function: createMswCacheInterceptor()

> **createMswCacheInterceptor**(`config`): `Promise`\<\{ `activeCacheWrites`: `Map`\<`string`, `Promise`\<`void`\>\>; `cache`: `SmartCache`; `dispose`: () => `void`; `start`: () => `void`; \}\>

Defined in: [createMswCacheInterceptor.ts:58](https://github.com/isdk/proxy-msw.js/blob/1f9bd51e625693eae73f2eb8f7876a01d8490d34/src/createMswCacheInterceptor.ts#L58)

基于 MSW (Mock Service Worker) Interceptors 的智能缓存拦截器。

此函数是 `@isdk/proxy` 核心功能的 MSW 适配器。它利用 MSW 的拦截能力，
自动为匹配的外部 HTTP 请求应用多级缓存、SWR 和请求合并策略。

## Parameters

### config

`ProxyConfig` & `object`

代理配置对象，包含存储路径和站点级缓存规则

## Returns

`Promise`\<\{ `activeCacheWrites`: `Map`\<`string`, `Promise`\<`void`\>\>; `cache`: `SmartCache`; `dispose`: () => `void`; `start`: () => `void`; \}\>

包含以下方法的对象：
 - `start()`: 启动拦截器，开始监听并处理请求
 - `dispose()`: 销毁拦截器，停止监听并释放资源
 - `cache`: 内部使用的 `SmartCache` 实例，可用于手动管理缓存
 - `activeCacheWrites`: 当前使用的并发追踪器 Map，可传递给其他实例以实现请求合并

## Example

```typescript
// 示例 1: 基本用法（自动创建内部 Map）
const interceptor = await createMswCacheInterceptor({
  storagePath: './.cache',
  default: { staleIfError: true }
});
interceptor.start();

// 示例 2: 与应用内其他使用 fetchWithCache 的实例共享 activeCacheWrites
// 每个 createMswCacheInterceptor 都会创建一套独立、隔离的拦截器环境（以防止 MSW 监听器泄漏）。
// 如果你希望跨拦截器或跨直接调用实现【全局请求防击穿合并】，请显式共享同一个 activeCacheWrites Map。
import { createFetchWithCache } from '@isdk/proxy';

const sharedCacheWrites = new Map();

// MSW 拦截器
const mswInterceptor = await createMswCacheInterceptor({
  storagePath: './.cache',
  default: { staleIfError: true },
  activeCacheWrites: sharedCacheWrites
});
mswInterceptor.start();

// 应用内直接调用的底层逻辑
const fetchWithCache = createFetchWithCache(sharedCacheWrites);
// 现在即使是从底层直接发起，还是通过全局 fetch 拦截，都会共享合并状态。
```
