[**@isdk/proxy-msw**](../README.md)

***

[@isdk/proxy-msw](../globals.md) / fetchBypass

# Function: fetchBypass()

> **fetchBypass**(`input`, `init?`): `Promise`\<`Response`\>

Defined in: [fetchBypass.ts:14](https://github.com/isdk/proxy-msw.js/blob/1f9bd51e625693eae73f2eb8f7876a01d8490d34/src/fetchBypass.ts#L14)

逃逸请求函数：确保请求不会被拦截器再次捕获。

在 MSW 拦截请求时，我们需要一个“旁路”机制来真正发起网络请求，
否则会陷入无限拦截循环。此函数通过调用捕获到的原始 `fetch` 来实现。

## Parameters

### input

请求信息或 URL

`RequestInfo` | `URL`

### init?

`RequestInit`

可选的请求初始化参数

## Returns

`Promise`\<`Response`\>

网络响应 Promise
