---
sidebar_position: 2
---

# Game Servers

To provide as flexible a system as possible for managing game servers, Redwood introduces several terms and database tables/models. These are stored in each [Realm's](./overview.md#realms) database.

```
GameServerProxy (a "world", "lobby", or "match" players can find and join)
└── GameServerCollection (the servers currently backing the proxy; at most one active)
    ├── GameServerInstance (zone "town", shard "Alpha")
    ├── GameServerInstance (zone "town", shard "Bravo")
    └── GameServerInstance (zone "wilds", shard "Alpha")
```

## GameServerProxy

`GameServerProxy` is an abstract representation of a virtual world. When you want to "list the available games" or create a session, you are most likely interfacing with the `GameServerProxy`. This database table/model stores any associated world data, game mode/map details (the [game profile](../configuration/game-modes-and-maps.md#profiles) it was created from), and access configuration (e.g. public/private, password, and short code).

A `GameServerProxy` can only have 1 active [`GameServerCollection`](#gameservercollection) at a time, but that collection may shut down and a new one be started later, so the `GameServerProxy` does have access to all prior collections.

GameServerProxies don't always need to have active game servers running to be listed as an available world to join; if someone requests to join it and there is no active `GameServerCollection`, Redwood will start one with all the details stored in the `GameServerProxy` database entry. A proxy can also be configured to end when its collection ends (typical for matches and lobbies) or to persist forever (typical for persistent worlds), and to start automatically when the backend boots.

In the Unreal plugin, proxies are what **List Proxies**, **Create Proxy**, and **Join Proxy with Single Instance** work with; see [Building the Main Menu](../getting-started/building-the-main-menu.md#5-join-a-server). Admins can also manage them with the [CLI](../features/cli.md).

## GameServerCollection

`GameServerCollection` is a collection that contains 1 or more `GameServerInstance` references. It represents the entire backing of a `GameServerProxy` for a duration of time, including all of the [zones](../features/game-servers/zones.md) and [shards](../features/game-servers/sharding.md). The `GameServerCollection` can be stopped/archived, which stops the associated server instances, but the associated `GameServerProxy` doesn't necessarily stop/end unless it's configured to do so. A `GameServerCollection` isn't started again after it's stopped; a new one is created instead.

## GameServerInstance

`GameServerInstance` is a direct representation of a running game server instance/executable. It serves a single shard for a single zone (collectively identified in the instance's `channel` database field, e.g. `town:Alpha`). It has the associated connection URI stored in the `connection` field (after it has become available post startup). It also has a `providerId` field which stores the ID from the backing [game server provider](../features/game-servers/hosting/overview.md). For example, with [Agones](../features/game-servers/hosting/agones.md) the `providerId` is the name of the allocated Agones `GameServer`, and with [Edgegap](../features/game-servers/hosting/edgegap.md) it's the deployment's request ID.

Inside the Unreal server, the current instance's IDs and its zone and shard names are available on the `URedwoodServerGameSubsystem` (and replicated to clients through the `URedwoodGameStateComponent`); see the [game framework reference](../unreal-reference/game-framework.md).

## GameServerContainer

`GameServerContainer` is not often used directly, but it represents a virtual container (typically a Docker container running on a virtual machine). Currently, only 1 `GameServerInstance` can run in a single `GameServerContainer` for Unreal games, but it's possible to add support for multiple instances in a single container by using Unreal's [`FForkProcess`](https://dev.epicgames.com/community/learning/knowledge-base/Eox6/unreal-engine-tech-note-the-fforkprocess-class-for-managing-forking-dedicated-servers-in-linux). After forking, each of those OS processes would have their own port and Unreal game server, but run in the same virtual container. Redwood doesn't have any examples of this currently, but it's theoretically possible. `GameServerContainer` also has a `providerId` field which stores the ID from the backing game server provider (with the current providers, this is the same ID as its instance's `providerId`).
