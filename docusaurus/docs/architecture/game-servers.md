---
sidebar_position: 2
---

# Game Servers

To provide as flexible of a system for managing game servers, Redwood introduces several terms and database tables/models.

## GameServerProxy

`GameServerProxy` is an abstract representation of virtual world. When you want to "list the available games" or create a session, you are interfacing with the `GameServerProxy` most likely. This database table/model stores any associated world data, game mode/map details, and access configuration (e.g. public/private and password).

A `GameServerProxy` can only have 1 active [`GameServerCollection`](#gameservercollection) at a time, but that collection may shutdown and a new one started later so the `GameServerProxy` does have access to all prior collections.

GameServerProxies don't always need to have active game servers running to be listed as an available world to join; if someone requests to join it and there is no active `GameServerCollection`, Redwood will start one with all the detail stored in the `GameServerProxy` database entry.

## GameServerCollection

`GameServerCollection` is a collection contains 1 or more `GameServerInstance` references. It represents the entire backing `GameServerProxy` for a duration of time, including all of the zones and shards. The `GameServerCollection` can be stopped/archived, which stops the associated server instances, but the associated `GameServerProxy` doesn't necessary stop/end unless it's configured to do so. A `GameServerCollection` isn't started again after it's stopped; a new one is created instead.

## GameServerInstance

`GameServerInstance` is a direct representation of a running game server instance/executable. It serves a single shard for a single zone (collectively identified in the instance's `channel` database field). It has the associated connection URI stored in the `connection` field (after it has become available post startup). It also has a `providerId` field which stores the ID for the associated backing game server provider (e.g. [Agones](../providers/game-server-hosting/agones.md) or [Hathora](../providers/game-server-hosting/hathora.md)). For example, if you're using Hathora, the `providerId` is the associated [Room](https://hathora.dev/docs/concepts/hathora-entities#room) ID.

## GameServerContainer

`GameServerContainer` is not often used directly, but it represents a virtual container (typically a Docker Container running on a Virtual Machine). Currently, only 1 `GameServerInstance` can run in a single `GameServerContainer` for Unreal games, but it's possible to add support multiple instances in a single container by using Unreal's [`FForkProcess`](https://dev.epicgames.com/community/learning/knowledge-base/Eox6/unreal-engine-tech-note-the-fforkprocess-class-for-managing-forking-dedicated-servers-in-linux). After forking, each of those OS process would have their own port and Unreal game server, but running in the same virtual container. Redwood doesn't have any examples currently of this, but it's theoretically possible. `GameServerContainer` also has a `providerId` field which stores the ID for hte associated backing game server provider. For example, if you're using Hathora, the `providerId` is the associated [Process](https://hathora.dev/docs/concepts/hathora-entities#process) ID.
