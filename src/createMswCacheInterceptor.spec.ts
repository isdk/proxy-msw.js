import { describe, it, expect, vi, MockedFunction, beforeAll, afterAll, beforeEach, Mock } from 'vitest';
import { createMswCacheInterceptor } from './createMswCacheInterceptor';
import { fetchBypass as _fetchBypass } from './fetchBypass';
import type { ProxyConfig } from '@isdk/proxy';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

vi.mock('./fetchBypass', () => {
  return {
    fetchBypass: vi.fn(),
  };
});

const fetchBypass = _fetchBypass as unknown as MockedFunction<typeof _fetchBypass>;

// 在测试文件顶部添加类型声明
describe('createMswCacheInterceptor', () => {
  const storagePath = path.join(os.tmpdir(), `isdk-proxy-msw-test-${Date.now()}`);

  const config: ProxyConfig = {
    storagePath,
    default: { staleIfError: true },
    sites: {
      'example.com': { staleIfError: true }
    }
  };

  beforeAll(async () => {
    await fs.rm(storagePath, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // 注意：不要使用 vi.restoreAllMocks()，因为它会恢复 vi.mock 创建的 mock，导致 mock 失效
    // 只需要重置 fetchBypass 的调用记录即可
    fetchBypass.mockReset();
  });

  afterAll(async () => {
    await fs.rm(storagePath, { recursive: true, force: true });
  });

  it('应该能成功创建并启动拦截器', async () => {
    const proxy = await createMswCacheInterceptor(config);
    expect(proxy.start).toBeTypeOf('function');
    expect(proxy.dispose).toBeTypeOf('function');
    proxy.dispose();
  });

  it('在拦截请求时应调用 fetchWithCache 并命中缓存', async () => {
    // 1. Mock 我们的网络出口 fetchBypass
    fetchBypass.mockImplementation(() => {
      return Promise.resolve(new Response('intercepted', {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=3600'
        }
      }));
    });

    const proxy = await createMswCacheInterceptor(config);
    proxy.start();

    try {
      // 第一次请求：穿透到 fetchBypass
      const res = await fetch('https://example.com/data');
      expect(await res.text()).toBe('intercepted');
      expect(fetchBypass).toHaveBeenCalledTimes(1);

      // 等待一小段时间，确保缓存写入完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 第二次请求：应该命中缓存
      const res2 = await fetch('https://example.com/data');
      const text2 = await res2.text();
      expect(text2).toBe('intercepted');
      expect(res2.headers.get('x-proxy-cache')).toBe('HIT');

      // 验证网络出口依然只被调用了一次
      expect(fetchBypass).toHaveBeenCalledTimes(1);
    } finally {
      proxy.dispose();
    }
  });

  it('在拦截请求时应调用 fetchWithCache with activeCacheWrites 并命中缓存', async () => {
    // 1. Mock 我们的网络出口 fetchBypass
    fetchBypass.mockImplementation(() => {
      return Promise.resolve(new Response('intercepted', {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=3600'
        }
      }));
    });
    const activeCacheWrites: any = new Map()

    const proxy = await createMswCacheInterceptor({...config, activeCacheWrites});
    proxy.start();

    try {
      // 第一次请求：穿透到 fetchBypass
      const res = await fetch('https://example.com/data2');
      expect(await res.text()).toBe('intercepted');
      expect(fetchBypass).toHaveBeenCalledTimes(1);

      // 等待一小段时间，确保缓存写入完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 第二次请求：应该命中缓存
      const res2 = await fetch('https://example.com/data2');
      const text2 = await res2.text();
      expect(text2).toBe('intercepted');
      expect(res2.headers.get('x-proxy-cache')).toBe('HIT');

      // 验证网络出口依然只被调用了一次
      expect(fetchBypass).toHaveBeenCalledTimes(1);
    } finally {
      proxy.dispose();
    }
  });

  it('应该支持传递 activeCacheWrites 参数', async () => {
    // 创建一个共享的 activeCacheWrites
    const sharedCacheWrites = new Map<string, Promise<void>>();

    // 创建拦截器并传入 activeCacheWrites
    const proxy = await createMswCacheInterceptor({
      ...config,
      activeCacheWrites: sharedCacheWrites
    });

    // 验证返回的 activeCacheWrites 与传入的是同一个实例
    expect(proxy.activeCacheWrites).toBe(sharedCacheWrites);

    proxy.dispose();
  });

  it('共享 activeCacheWrites 时应正确工作', async () => {
    // 创建一个共享的 activeCacheWrites
    const sharedCacheWrites = new Map<string, Promise<void>>();

    // Mock fetchBypass
    fetchBypass.mockImplementation(() => {
      return Promise.resolve(new Response('intercepted', {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=3600'
        }
      }));
    });

    // 创建两个拦截器，共享同一个 activeCacheWrites
    const proxy1 = await createMswCacheInterceptor({
      ...config,
      activeCacheWrites: sharedCacheWrites
    });

    const proxy2 = await createMswCacheInterceptor({
      ...config,
      activeCacheWrites: sharedCacheWrites
    });

    // 验证两个拦截器返回的是同一个 activeCacheWrites 实例
    expect(proxy1.activeCacheWrites).toBe(sharedCacheWrites);
    expect(proxy2.activeCacheWrites).toBe(sharedCacheWrites);

    // 清理
    proxy1.dispose();
    proxy2.dispose();
  });
});
