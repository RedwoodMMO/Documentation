---
slug: 5_0_0-released
title: Version 5.0.0 Released
authors: [mike]
tags: [release, news]
---

![This is not the v5.0 you were looking for meme](/img/not-the-v5.jpg)

We have been promising a large v5.0 for awhile now. That is still coming, but is now versioned as v6.0 since we needed to do this substantial breaking change release in the meantime. v6.0 still coming soon™️!

Version 5.0.0 is a backend-only release. It bumps the major version because of two breaking changes: we upgraded the backend to Node.js 24 and we removed the obsolete Hathora game server provider. The Unreal plugins and templates are unchanged from 4.2.3, so you only need to update your `RedwoodBackend` directory.

<!-- truncate -->

## Breaking Changes

- **Node.js 24 is now required.** We upgraded the backend from Node.js 20 to Node.js 24 to address a recent [Node.js CVE](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases). If you use NVM, run `nvm install 24` and `nvm use 24` before installing dependencies. Your CI runners and any custom Docker images that build the backend will need the same upgrade.
- **The `hathora` game server provider was removed.** Hathora sunset their gaming services earlier this year, and the provider stopped functioning on May 5, 2026. If any of your [realm instance configs](/docs/configuration/realm-instance-config) still set `game-servers.provider` to `hathora`, see the [game server hosting overview](/docs/features/game-servers/hosting/overview) for other options.

## Bug Fixes

- Fixed building Docker images with Pulumi, which was breaking local Kubernetes deployments
- Fixed all `Moderate`, `High`, and `Critical` security vulnerabilities reported in our dependencies

:::warning
This will be the last release that includes the Unreal gameplay templates; we have also shutdown the Unreal live demos. Part of the v6.0 development effort is to be engine agnostic and make it easier for me to maintain Redwood. The Unreal plugins and Unreal-native experience in Redwood will still be a priority for Redwood, but honestly keeping blueprints and UMG templates up to date is a lot of work on my end that isn't translating into respective value-add for Redwood's most prominent users.

I'm sorry if this impacts you, but you can still use the templates from this release going forward, but it's up to you to implement the gameplay integration.

In brighter news, part of v6.0 will include a lot more high quality documentation and making it easier for AI to help you integrate and troubleshoot Redwood to fit your exact game. We will release a new web-based MMO live demo and example repo to ensure all the features work while making it easier and quicker for me to test and maintain features.
:::
