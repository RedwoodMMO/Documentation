---
slug: 4_2_0-released
title: Version 4.2.0 Released
authors: [mike]
tags: [release, news]
---

:::warning
Hathora was acquired and is [sunsetting their games service](https://blog.hathora.dev/hathora-is-joining-fireworks-ai/) on May 5, 2026. We've added Edgegap as another on-demand game server hosting provider. Version 5.0 will remove the Hathora provider.
:::

## Features

- Better support for configuring Redwood in team environments
- [Edgegap](https://redwoodmultiplayer.com/docs/features/game-servers/hosting/edgegap) game server hosting provider added
- Added a `list-proxies` CLI command which shows not-ended proxies (proxies may be stopped but not ended)

<!-- truncate -->

## Bug Fixes

- The `stop-proxy` command will fail if the proxy is already stopped
- When the Redwood Chat plugin was enabled, the Redwood Core plugin settings in Project Settings were missing
- Fix C++ compiler error for Redwood Director/Realm global data
- Fix crash when trying to render Redwood Slate notifications on an uncooked server
- Update third parties to fix security vulnerabilities
