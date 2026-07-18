---
slug: 4_2_2-released
title: Version 4.2.2 Released
authors: [mike]
tags: [release, news]
---

## Bug Fixes

- **IMPORTANT:** Fix very old bug where the wrong schema version is being used for `URedwoodCharacterComponent`'s `PlayerData` and `CharacterCreatorData`
- Prevent stale/unhydrated URedwoodCharacterComponent from persisting empty data
- Fix compiler errors for 5.8