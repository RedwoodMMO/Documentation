---
slug: 4_1_1-released
title: Version 4.1.1 Released
authors: [mike]
tags: [release, news]
---

## Bug Fixes

- Fix Redis memory leak (**impacts all prior versions and is important for production environments**)
- Add better recovery and logging in Redwood services if Redis fails
- Removed the Kubernetes Dashboard (an undocumented, opt-in dependency) since it was discontinued
- Important Redwood spawn errors now show up as editor error alerts in PIE for better visibility
- Fixed persistence of stack count for `UGameplayEffects`
- Fixed a crash caused when placing a `URedwoodAbilitySystemComponent` on an `AAIController`
- Fixed issues with synchronization of world/proxy and zone data

## Minor Features

- Added Redwood editor settings (e.g. `Use Backend in PIE`) in the PIE play menu for easy accessibility
