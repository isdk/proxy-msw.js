import { BatchInterceptor } from '@mswjs/interceptors';
import { ClientRequestInterceptor } from '@mswjs/interceptors/ClientRequest';
import { XMLHttpRequestInterceptor } from '@mswjs/interceptors/XMLHttpRequest';
import { FetchInterceptor } from '@mswjs/interceptors/fetch';
import { createFetchWithCache, ProxyConfig, SmartCache, getSiteConfig } from '@isdk/proxy';
import { fetchBypass } from './fetchBypass';

// 全局后备的 activeCacheWrites。
// 当用户未显式提供并发追踪器时使用，确保在不传入特定 map 的情况下，
// 单次执行环境内的默认合并策略能正常工作。
const defaultActiveCacheWrites = new Map<string, Promise<void>>();

/**
 * 基于 MSW (Mock Service Worker) Interceptors 的智能缓存拦截器。
 *
 * 此函数是 `@isdk/proxy` 核心功能的 MSW 适配器。它利用 MSW 的拦截能力，
 * 自动为匹配的外部 HTTP 请求应用多级缓存、SWR 和请求合并策略。
 *
 * @param config - 代理配置对象，包含存储路径和站点级缓存规则
 * @param config.activeCacheWrites - 可选。并发追踪器 Map，用于追踪正在进行的缓存写入操作。
 *                                  如果不提供，将自动创建一个新的内部 Map。
 *                                  在多个实例间共享同一个 Map 可以实现应用范围内的请求合并。
 * @returns 包含以下方法的对象：
 *  - `start()`: 启动拦截器，开始监听并处理请求
 *  - `dispose()`: 销毁拦截器，停止监听并释放资源
 *  - `cache`: 内部使用的 `SmartCache` 实例，可用于手动管理缓存
 *  - `activeCacheWrites`: 当前使用的并发追踪器 Map，可传递给其他实例以实现请求合并
 *
 * @example
 * ```typescript
 * // 示例 1: 基本用法（自动创建内部 Map）
 * const interceptor = await createMswCacheInterceptor({
 *   storagePath: './.cache',
 *   default: { staleIfError: true }
 * });
 * interceptor.start();
 *
 * // 示例 2: 与应用内其他使用 fetchWithCache 的实例共享 activeCacheWrites
 * // 每个 createMswCacheInterceptor 都会创建一套独立、隔离的拦截器环境（以防止 MSW 监听器泄漏）。
 * // 如果你希望跨拦截器或跨直接调用实现【全局请求防击穿合并】，请显式共享同一个 activeCacheWrites Map。
 * import { createFetchWithCache } from '@isdk/proxy';
 *
 * const sharedCacheWrites = new Map();
 *
 * // MSW 拦截器
 * const mswInterceptor = await createMswCacheInterceptor({
 *   storagePath: './.cache',
 *   default: { staleIfError: true },
 *   activeCacheWrites: sharedCacheWrites
 * });
 * mswInterceptor.start();
 *
 * // 应用内直接调用的底层逻辑
 * const fetchWithCache = createFetchWithCache(sharedCacheWrites);
 * // 现在即使是从底层直接发起，还是通过全局 fetch 拦截，都会共享合并状态。
 * ```
 */
export const createMswCacheInterceptor = async (config: ProxyConfig & { activeCacheWrites?: Map<string, Promise<void>> }) => {
  const activeCacheWrites = config.activeCacheWrites || defaultActiveCacheWrites;
  const fetchWithCache = createFetchWithCache(activeCacheWrites);

  const cache = new SmartCache({
    storagePath: config.storagePath,
  });

  // 【警告】绝不可使用 MSW 提供的全局单例 (如 @mswjs/interceptors/presets/node)
  // 当创建多个 BatchInterceptor 时，如果使用 presets/node 中的单例数组，
  // BatchInterceptor.on('request') 会将监听器直接绑定到这些单例身上。
  // 而在调用 dispose() 时，只会清理 BatchInterceptor 自身的 Emitter，不会清理单例上的监听器！
  // 这会导致严重的“事件监听器泄漏 (Event Listener Leak)”，在多次实例化或测试时，
  // 统一个 fetch 请求会被重复拦截并多次执行回调，从而引发诸如:
  // `InterceptorError: Failed to respond ... the request has already been handled (2)` 的错误，
  // 甚至导致底层的 fetchBypass 被无意义地重复触发两次以上，严重影响性能并打破并发防击穿的预期。
  // 因此，每次实例化必须【全新 new】属于自己的底层拦截器对象。
  const interceptor = new BatchInterceptor({
    name: 'SmartProxyEngine',
    interceptors: [
      new ClientRequestInterceptor(),
      new XMLHttpRequestInterceptor(),
      new FetchInterceptor(),
    ],
  });

  interceptor.on('request', async (context) => {
    const { request, controller } = context;
    // 使用 getSiteConfig 获取匹配的站点配置，未匹配时返回 ProxyConfig 自身作为默认值
    const siteConfig = getSiteConfig(request.url, config);

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
    /** 获取并发追踪器 Map，可传递给其他实例以实现请求合并 */
    activeCacheWrites,
  };
};
