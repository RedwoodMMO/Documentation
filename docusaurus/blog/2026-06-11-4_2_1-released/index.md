---
slug: 4_2_1-released
title: Version 4.2.1 Released
authors: [mike]
tags: [release, news]
---

## Breaking Changes

We normally don't release breaking changes without bumping the major version, but due to some upcoming changes to Redwood, we're making an exception due to the low impact.

- The `FRedwoodPlayerInventoryChanged` struct now uses `URedwoodPlayerStateComponent` instead of `ARedwoodPlayerState`
- Deploying to `staging` or `production` like environments will now fail if you have not changed default secret config vars. You can test whether or not it'll fail (and which variables need to be changed) with the new `yarn check-secrets <config-env>` command. This is to help prevent you from shipping vulnerable secrets.

## Bug Fixes

- We've implemented an extensive suite of security fixes after doing a large audit of Redwood systems
- More config variables can now be used in the secrets system (search for `This can be a secret in the secrets provider` in `config/node/default` for all instances)
- Updated dependencies for CVE vulnerabilities
- Fixed sync items
- Fixed zone data
- Fixed bugs related to using the Queue provider with `AGameMode`
- Fixed issues with the `local` secrets provider
- Fixed regex for private IP detection (primarily impacted with some environments like Azure)
