[**@isdk/proxy-msw**](../README.md)

***

[@isdk/proxy-msw](../globals.md) / createMswCacheInterceptor

# Function: createMswCacheInterceptor()

> **createMswCacheInterceptor**(`config`): `Promise`\<\{ `activeCacheWrites`: `Map`\<`string`, `Promise`\<`void`\>\>; `cache`: `SmartCache`; `dispose`: () => `void`; `start`: () => `void`; \}\>

Defined in: [createMswCacheInterceptor.ts:59](https://github.com/isdk/proxy-msw.js/blob/c56f9eb30ef465cc888c2c09d0daa4ebdeb225dc/src/createMswCacheInterceptor.ts#L59)

## Parameters

### config

`ProxyConfig` & `object`

## Returns

`Promise`\<\{ `activeCacheWrites`: `Map`\<`string`, `Promise`\<`void`\>\>; `cache`: `SmartCache`; `dispose`: () => `void`; `start`: () => `void`; \}\>
