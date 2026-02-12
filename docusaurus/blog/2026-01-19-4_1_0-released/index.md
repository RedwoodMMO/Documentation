---
slug: 4_1_0-released
title: Version 4.1.0 Released
authors: [mike]
tags: [release, news]
---

## Major Features

- **Epic Games, Discord, Twitch, and JWT** [authentication providers](/docs/features/authentication/overview) added
- Text Chat now includes a [**`Realm` chat room**](/docs/features/social/text-chat#room-types) that spans all GameServerProxy's in the realm
- You can [**allow players to create custom chat rooms**](/docs/features/social/text-chat#custom-rooms)
- Source-code users can define a [**custom ticketing flow**](/docs/features/ticketing/custom)
- We introduced a [**"Realm contact"**](/docs/features/social/realm-contacts) so players can favorite other PlayerCharacters
- **[Guilds/alliances](/docs/features/social/guilds-alliances) can be opted-in to use scoped to realms** instead of the director
- You can now have [**zone-specific server game data**](/docs/features/data/game/zone-data)
- You can now have [**global director and realm data**](/docs/features/data/game/global-data)
- Introduced **`URedwoodPlayerStateComponent` which replaces `ARedwoodPlayerState`** to allow flexibility with other gameplay systems. `ARedwoodPlayerState` will continue to work until `v5.0.0`, but it is deprecated with a warning.

<!-- truncate -->

## Minor Features

- **[Text chat](/docs/features/social/text-chat) now has a mixed PlayerIdentity/PlayerCharacter system** which allows you to DM characters and realm-specific rooms will use the character ID
- Players can **add [friends](/docs/features/social/friends) with just a character name**
- `URedwoodPlayerStateComponent` can now save character data to the backend without `URedwoodCharacterComponent`

## Bug Fixes

- Miscellaneous security fixes
- Fixed an issue with the default shard not restarting if it failed
- Fixed GAS persistence issues with duplicating abilities and effects
- Fixed race conditions with `ARedwoodGameMode[Base]::Login`

## Breaking Changes

**Note:** Normally we would bump the version to a major version for breaking changes to follow Semver, but this minor breaking change seems not worth worrying everyone so we're keeping it at v4.

As applicable, we provided Core Redirects so you can open Blueprint classes that inherited from the old names, but C++ classes will not compile until you update the names yourself.

- `URedwoodClientChatSubsystem::OnPrivateChatReceived` was renamed to `URedwoodClientChatSubsystem::OnPlayerPrivateChatReceived`
