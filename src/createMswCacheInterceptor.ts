import { BatchInterceptor } from '@mswjs/interceptors';
import nodeInterceptors from '@mswjs/interceptors/presets/node';
import { createFetchWithCache, ProxyConfig, SmartCache } from '@isdk/proxy';
import { fetchBypass } from './fetchBypass';

const fetchWithCache = createFetchWithCache()

/**
 * 基于 MSW (Mock Service Worker) Interceptors 的智能缓存拦截器。
 *
 * 此函数是 `@isdk/proxy` 核心功能的 MSW 适配器。它利用 MSW 的拦截能力，
 * 自动为匹配的外部 HTTP 请求应用多级缓存、SWR 和请求合并策略。
 *
 * @param config - 代理配置对象，包含存储路径和站点级缓存规则
 * @returns 包含以下方法的对象：
 *  - `start()`: 启动拦截器，开始监听并处理请求
 *  - `dispose()`: 销毁拦截器，停止监听并释放资源
 *  - `cache`: 内部使用的 `SmartCache` 实例，可用于手动管理缓存
 *
 * @example
 * ```typescript
 * const interceptor = await createMswCacheInterceptor({
 *   storagePath: './.cache',
 *   default: { staleIfError: true }
 * });
 * interceptor.start();
 * ```
 */
export const createMswCacheInterceptor = async (config: ProxyConfig) => {
  const cache = new SmartCache({
    storagePath: config.storagePath,
  });

  const interceptor = new BatchInterceptor({
    name: 'SmartProxyEngine',
    interceptors: nodeInterceptors,
  });

  interceptor.on('request', async (context) => {
    const { request, controller } = context;
    const url = new URL(request.url);
    const siteConfig = config.sites[url.hostname] || config.default;

    try {
      const response = await fetchWithCache(request, fetchBypass, {
        cache,
        config: siteConfig,
        // 默认开启后台更新以提升响应速度
        backgroundUpdate: true,
      });

      controller.respondWith(response);
    } catch (err) {
      // fetchWithCache 内部已处理错误降级，如果仍然抛错，说明彻底无法获取
      console.error(`[SmartProxy] Failed to handle ${request.url}:`, err);
    }
  });

  return {
    /** 启动拦截器并应用策略 */
    start: () => interceptor.apply(),
    /** 销毁拦截器并停止工作 */
    dispose: () => interceptor.dispose(),
    /** 获取底层 SmartCache 实例 */
    cache,
  };
};
