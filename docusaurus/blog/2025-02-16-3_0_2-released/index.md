---
slug: 3_0_2-released
title: Version 3.0.2 Released
authors: [mike]
tags: [release, news]
---

Quick patch release to fix a few minor issues!

## Bug Fixes

- [RPG Template] If you downloaded 3.0.1, there were 2 lines of code in `Source/ProjectNameClient.Target.cs` and `Source/ProjectNameServer.Target.cs` that would prevent you from opening it up in a non-source version of UE. You can ignore this is you don't have this issue.
- [Backend (Dev Initiator)] Fixed an error about not finding the "prisma" executable, introduced in `3.0.0`

## New Features

- [Backend (Dev Initiator)] When running with the Dev Initiator, UE servers will now use a deterministic set of ports `7000-7099` (inclusive) which makes it easier to make firewall and port forwarding rules
