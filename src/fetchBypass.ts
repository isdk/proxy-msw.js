// 记录原始的全局 fetch
const pureFetch = globalThis.fetch;

/**
 * 逃逸请求函数：确保请求不会被拦截器再次捕获。
 *
 * 在 MSW 拦截请求时，我们需要一个“旁路”机制来真正发起网络请求，
 * 否则会陷入无限拦截循环。此函数通过调用捕获到的原始 `fetch` 来实现。
 *
 * @param input - 请求信息或 URL
 * @param init - 可选的请求初始化参数
 * @returns 网络响应 Promise
 */
export async function fetchBypass(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // 如果 pureFetch 存在，直接调用它，它是最原始的网卡级 fetch
  if (typeof pureFetch === 'function') {
    return pureFetch(input, init);
  }
  // 备选方案：如果初始化时没有抓到，尝试使用 undici (Node 20 原生底层)
  return fetch(input, init);
};
