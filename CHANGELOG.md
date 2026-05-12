# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.2.0](https://github.com/isdk/proxy-msw.js/compare/v0.1.1...v0.2.0) (2026-05-12)


### ⚠ BREAKING CHANGES

* - Remove deprecated 'default' config property
- Update ProxyFieldConfig syntax: { include: ['x'] } -> { x: true }
- Use getSiteConfig() for site-specific configuration lookup

- Upgrade tsconfig to ESNext/bundler module resolution
- Update README with new API format and X-Proxy-Cache header documentation

### Refactor

* adapt to @isdk/proxy v0.2 breaking changes ([ba0196f](https://github.com/isdk/proxy-msw.js/commit/ba0196fc838812c7b21879d85f1dc4fca45b20fa))

## 0.1.1 (2026-05-08)


### Features

* add optional activeCacheWrites param for request deduplication ([c56f9eb](https://github.com/isdk/proxy-msw.js/commit/c56f9eb30ef465cc888c2c09d0daa4ebdeb225dc))

# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.
