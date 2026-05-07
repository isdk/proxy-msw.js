# @isdk/proxy-msw

MSW (Mock Service Worker) adapter for [@isdk/proxy](https://github.com/isdk/proxy.js).

This package provides an interceptor that seamlessly integrates the high-performance caching engine of `@isdk/proxy` into your MSW-based workflow.

## Key Features

- **🔌 Seamless MSW Integration**: Use `@mswjs/interceptors` to capture network requests globally.
- **⚡ Performance Powered by @isdk/proxy**: Benefit from L1/L2 hybrid caching, Metadata residency, and SWR.
- **🛡️ Conflict-Free**: Built-in `fetchBypass` mechanism to avoid infinite interception loops.
- **🛠️ Flexible Configuration**: Domain-specific cache rules for headers, cookies, and query parameters.

## Installation

```bash
pnpm add @isdk/proxy-msw @isdk/proxy
```

## Quick Start

```typescript
import { createMswCacheInterceptor } from '@isdk/proxy-msw';

const interceptor = await createMswCacheInterceptor({
  storagePath: './.cache', // Optional: defaults to system temp dir
  default: { staleIfError: true },
  sites: {
    'api.github.com': {
      query: { include: ['q'] },
      headers: { exclude: ['authorization'] }
    }
  }
});

// Start intercepting requests
interceptor.start();

// When done
// interceptor.dispose();
```

## How It Works

This adapter wraps the core `fetchWithCache` from `@isdk/proxy`. When a request is intercepted by MSW:

1. It computes a unique cache key via `@isdk/proxy`.
2. It checks for cached data in memory or disk.
3. If valid, it returns the cached response immediately.
4. If stale but allowed, it returns stale data and updates in the background.
5. It uses a dedicated "bypass fetch" to perform the actual network request without re-triggering the interceptor.

## Peer Dependencies

This package requires `@isdk/proxy` to be installed as a sibling dependency.

## License

MIT
