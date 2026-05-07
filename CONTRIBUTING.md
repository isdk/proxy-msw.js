# Contributing to @isdk/proxy-msw

First off, thank you for considering contributing to `@isdk/proxy-msw`! This package serves as the official [MSW (Mock Service Worker)](https://mswjs.io/) adapter for the [@isdk/proxy](https://github.com/isdk/proxy.js) caching engine.

---

## 🛠 Development Setup

This package is part of the `@isdk/proxy` ecosystem. It relies on the core library as a peer dependency.

### Prerequisites

- **Node.js**: >= 20.11.1
- **pnpm**: Latest version recommended

### Steps

1. **Clone the repository**:

   ```bash
   git clone https://github.com/isdk/proxy.js.git
   cd proxy/proxy-msw
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Run tests**:

   ```bash
   pnpm test
   ```

4. **Build the project**:

   ```bash
   pnpm run build
   ```

---

## 🏗 Architecture Overview

The adapter is intentionally lightweight. Its main responsibilities are:

- **Interception**: Using `@mswjs/interceptors` to hook into Node.js/Browser network requests.
- **Orchestration**: Passing intercepted requests to `@isdk/proxy`'s `fetchWithCache` function.
- **Bypassing**: Implementing the `fetchBypass` mechanism to ensure that the actual network fetch doesn't get caught in an infinite interception loop.

---

## 🧪 Testing Standards

We follow the **"test-near-code"** pattern using **Vitest**.

- **Location**: Test files should be in `src/*.spec.ts`.
- **Key Verification**:
  - Ensure MSW correctly captures the request.
  - Verify that the `x-proxy-cache` header is correctly propagated from the core library.
  - **No Side Effects**: Always use `os.tmpdir()` for `storagePath` in tests to avoid polluting the workspace.
  - **Cleanup**: Use `afterAll` hooks to remove temporary test directories.

---

## 📝 Coding Guidelines

- **Simplicity**: Since this is an adapter, keep the logic focused on "bridging" rather than implementing complex caching logic (which belongs in the core).
- **TSDoc**: Document all exported functions and types. Explain MSW-specific nuances (like why `fetchBypass` is needed).
- **Peer Dependencies**: Ensure any new features don't break compatibility with the current version of `@isdk/proxy`.

---

## 🚀 Pull Request Process

1. **Branching**: Use `feat/` or `fix/` prefixes.
2. **Documentation**: Update `README.md` and `README.cn.md` if you change the API.
3. **Quality Check**: Run `pnpm run lint` and `pnpm test` before submitting.
4. **Link Core Changes**: If your PR requires changes in the `@isdk/proxy` core, please link both PRs and explain the dependency.

Thank you for helping make the MSW integration better!
