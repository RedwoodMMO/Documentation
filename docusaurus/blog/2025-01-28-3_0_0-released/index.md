---
slug: 3_0_0-released
title: Version 3.0.0 Released
authors: [mike]
tags: [release, news]
---

![Version 3.0 adds zone/shard synchronization](/img/version-3-sync.gif)

## New Features

- We now have a cross-server synchronization system with the use of [Sync Items](/docs/features/sync-items) (formally known as Persistent Items; you can still persist Sync Items)
- We upgraded our database ORM Prisma to add support for `cuid2` IDs, and changed the defaults to use `cuid2` for ID generation which brings more secure IDs (though we weren't using them in an unsecure way before)
- We've released a [public mirror of the documentation](https://github.com/redwoodMMO/documentation/) so if something catastrophic happens that would result in this website going down, you'll still have access to the full documentation
- We've enabled Standard Licenses to package the [Match Function](/docs/architecture/overview#match-function) when using [Open Match](/docs/providers/ticketing/open-match)
- We made the process for customizing the Match Function more modular so you create a new class instead of modify the one provided in the source (which would cause merge conflicts)
- We changed the [example of the World Data](/docs/features/world-data#unreal-setup) in the RPG Template
- Standard Licenses [can now use the Dev Initiator on macOS and Linux](/docs/getting-started/running-with-backend#launching-the-backend)

<!-- truncate -->

## Bug Fixes

- Dev Initiator shouldn't fail if there are spaces in an ancestor directory
- Fixed issue with the default Match Function causing the wrong regions from being selected based on latency
- Fixed inconsistent behavior with Pawn Rotation and Control Rotation when crossing zone boundaries
- Fixed various issues with how persistent sync items are initialized
  - **NOTE:** You need to specify a new `Zone Name` on persisted sync items _placed in the Level Editor at design-time_. See the [docs](/docs/features/sync-items#design-time-persistent-items) for more details.
- Fixed issue where the Shooter Template Frontend was connecting like it was a game server (you don't need to change anything on your end; the fix is in the RedwoodPlugins, not in any of the Content)

## Breaking Changes

As applicable, we provided Core Redirects so you can open Blueprint classes that inherited from the old names, but C++ classes will not compile until you update the names yourself.

- `URedwoodPersistentComponent` was renamed to `URedwoodSyncComponent`
- `URedwoodPersistentItemAsset` was renamed to `URedwoodSyncItemAsset`
- `URedwoodSyncComponent` does not persist by default
- We moved the Sync Component Data variable name and latest schema version variables to the `URedwoodSyncComponent` instead of the `URedwoodSyncItemAsset`
- `URedwoodTitleGameModeBase` has been removed
- `URedwoodPlayerController` has been removed
- `FileSDK` plugin is no longer included in the RPG template
- We removed the `Run Dev.bat` Windows launch script for the Dev Initiator, [favoring running from a terminal](/docs/getting-started/running-with-backend#launching-the-backend)
- We renamed `dev-initiator.exe` to `dev-initiator-win.exe`

## Analytics / EULA Changes

By using version 3.0 and later, you now agree to [changes to the EULA](https://redwoodmmo.com/eula#16-analytics) for a minimal amount of data to be tracked. You can use prior versions of Redwood without these analytics. We'll always let you know that a version has an updated EULA.

:::note
These analytics are not a form of [DRM](https://en.wikipedia.org/wiki/Digital_rights_management); while we highly discourage you from preventing these analytics from being tracked, your backend won't break if they can't be tracked. We believe in playing fair in hope that you will too.
:::

Here is an excerpt of the EULA of what data is sent back to us starting in 3.0.0:

- The name of your configuration environment
- Whether it's a development or production environment
- The URL to the Director Frontend service (this does not expose it to the public; just reports the actual URL)
- The number of PlayerIdentity rows in the Director database
- The number of Realm rows in the Director database
- The version of Redwood you're using
- The game server provider(s) you're using
