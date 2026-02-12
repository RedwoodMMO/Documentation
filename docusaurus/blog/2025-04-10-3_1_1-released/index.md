---
slug: 3_1_1-released
title: Version 3.1.1 Released
authors: [mike]
tags: [release, news]
---

Quick patch release to fix a few minor issues!

## Bug Fixes

- [Plugins] Fixes a compiler error related to a missing include in `RedwoodGameStateComponent.cpp`
- [Backend/Plugins] Fixes issue with characters spawning in the wrong location based on old zone transfer transform
- [Backend] Prevent characters from opening multiple matchmaking/queuing tickets; subsequent Join calls will be ignored if a ticket is open
- [Backend] Fix issue where `endedAt` columns for the various game server tables were not being populated when the server instance and/or proxy stopped
- [Backend] Fixes issue with deploying the `match-function` service to Kubernetes

<!-- truncate -->
