import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { createMswCacheInterceptor } from './createMswCacheInterceptor';
import * as transport from './fetchBypass';
import { ProxyConfig } from '@isdk/proxy';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

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
    vi.restoreAllMocks();
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
    const mockResponse = new Response('intercepted', {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600'
      }
    });
    const bypassSpy = vi.spyOn(transport, 'fetchBypass').mockResolvedValue(mockResponse);

    const proxy = await createMswCacheInterceptor(config);
    proxy.start();

    try {
      // 第一次请求：穿透到 bypassSpy
      const res = await fetch('https://example.com/data');
      expect(await res.text()).toBe('intercepted');
      expect(bypassSpy).toHaveBeenCalledTimes(1);

      // 第二次请求：应该命中缓存
      const res2 = await fetch('https://example.com/data');
      const text2 = await res2.text();
      expect(text2).toBe('intercepted');
      expect(res2.headers.get('x-proxy-cache')).toBe('HIT');

      // 验证网络出口依然只被调用了一次
      expect(bypassSpy).toHaveBeenCalledTimes(1);
    } finally {
      proxy.dispose();
    }
  });
});
