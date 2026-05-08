**@isdk/proxy-msw**

***

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

## Shared Cache Writes Tracker

By sharing the `activeCacheWrites` Map between the MSW interceptor and other interceptors using `fetchWithCache` from `@isdk/proxy`, you can achieve application-wide request deduplication.

**Note**: Avoid creating multiple `MswCacheInterceptor` instances as they will inject into fetch and node HTTP modules multiple times. Instead, share the tracker with other interceptors in your application that use the underlying `fetchWithCache`.

```typescript
import { createMswCacheInterceptor } from '@isdk/proxy-msw';
import { createFetchWithCache } from '@isdk/proxy';

// Create a shared cache writes tracker
const sharedCacheWrites = new Map();

// MSW interceptor
const mswInterceptor = await createMswCacheInterceptor({
  storagePath: './.cache',
  default: { staleIfError: true },
  activeCacheWrites: sharedCacheWrites
});
mswInterceptor.start();

// Other interceptors in your app using fetchWithCache
const fetchWithCache = createFetchWithCache(sharedCacheWrites);
// Now both interceptors share the same tracker for application-wide request deduplication
```

## API Reference

### `createMswCacheInterceptor(config)`

Creates an MSW-based cache interceptor with intelligent caching capabilities.

#### Parameters

- `config` (`ProxyConfig & { activeCacheWrites?: Map<string, Promise<void>> }`): Configuration object.
  - `storagePath` (`string`, optional): Path to the cache storage directory. Defaults to system temp directory.
  - `default` (`object`, optional): Default cache rules applied to all sites.
  - `sites` (`object`, optional): Domain-specific cache rules.
  - `activeCacheWrites` (`Map<string, Promise<void>>`, optional): Concurrent tracker Map for tracking ongoing cache write operations. If not provided, a new internal Map will be created automatically. Sharing the same Map across multiple interceptors enables application-wide request deduplication.

#### Returns

Returns a promise that resolves to an object with the following properties:

- `start(): void` - Starts the interceptor and begins listening for requests.
- `dispose(): void` - Destroys the interceptor and stops listening. Releases all resources.
- `cache` (`SmartCache`) - The underlying `SmartCache` instance, which can be used for manual cache management.
- `activeCacheWrites` (`Map<string, Promise<void>>`) - The concurrent tracker Map currently in use. Can be passed to other interceptors to enable request deduplication.

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
