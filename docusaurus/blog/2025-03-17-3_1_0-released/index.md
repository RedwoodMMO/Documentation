---
slug: 3_1_0-released
title: Version 3.1.0 Released
authors: [mike]
tags: [release, news]
---

import FriendsVideo from '@site/static/img/friends.mp4';

<video alt="Version 3.1 adds Friends" width="100%" autoPlay loop muted playsInline controls>
  <source src={FriendsVideo} type="video/mp4" />
</video>


## New Features

- We now have a [Friends system](/docs/features/social/friends)! You can search for players by username or nickname, request, respond, block, and get the connection/online status of friends; the RPG Template comes with an example widget (activated via the crate interactable in-game)
- Redwood now creates an [admin user by default](/docs/features/cli#default-admin-user) via configuration which is automatically used by the CLI tools
- You can create normal, non-admin users from the CLI
- You can configure a [default proxy](/docs/features/realms#default-proxy) for a realm and use the new `create-default-proxy` CLI command, which optionally can be automatically started when the backend boots up
- There's a new `SetCharacterArchived` function in the UE plugin and example in the RPG template for (un)archiving characters; eventually archived characters will be deleted from the DB after the [configured archival period](/docs/configuration/realm-instance-config#characters)
- All [Realm Instance Configs](/docs/configuration/realm-instance-config) will now inherit from `config/node/default/realm/instances/redwoodBase.yaml` which makes [creating multiple realms](/docs/features/realms#adding-more-realms) much easier now
- We've improved the organization of the docs and continue to regularly add more documentation

<!-- truncate -->

## Bug Fixes

- [UE Plugins] When players create a character, [initial struct data can be can configured](/docs/features/data/game/player-data#initial-data) for non-`characterCreatorData` fields
- [UE Plugins] When clients reconnect to the backend sockets via the plugin, it will automatically reauthenticate the player so future API calls won't fail
- [Backend] The backend now auto restarts the first shard if it hasn't updated in awhile (if it unexpectedly crashes)
- [Backend] The backend won't destroy empty shards if they'd just be recreated immediately after based on the current players and config
- We've added logic to actually restart proxies when the Realm Backend starts if they're marked `startOnBoot`
