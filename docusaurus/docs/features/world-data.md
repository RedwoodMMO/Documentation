---
sidebar_position: 7
---

# World Data

World data is used to specify any persistence to a [`GameServerProxy`](../architecture/game-servers.md#gameserverproxy) so that when it gets started again via another [`GameServerCollection`](../architecture/game-servers.md#gameservercollection) it will load that data. This is useful for any data that's associated with the world that isn't specifically related to some persistent actor (use a [Persistent Item](./persistent-items.md) for that instead).

For example, world data could be long-term scoring between different guilds or the current time of day (though the latter could be implemented using a persistent item too). However, if you want to have a player-created building to persist, that should be defined using a [Persistent Item](./persistent-items.md). Ultimately, the difference comes down to: if you want the data to initiate the spawning of an actor, use a persistent item, otherwise use world data in the proxy.

If the data is ephemeral (meaning it should reset for new shards), you don't need persistence, and you should not be using World Data for that type of data.

## Synchronization Across Shards

Currently Persistent Items don't have any synchronization across shards. When a shard is started, all of it's active Persistent Items will be initialized with the latest information in the database. If another shard changes that Persistent Item's data, existing shards will not receive this change.

We're aware this makes Persistent Items not super useful when considering sharding, and we'll be adding real-time synchronization soon.

## Traveling Between Zones

Currently, there's no mechanism for moving a Persistent Item to a different zone. We'll be adding support for this soon.

## Unreal Setup

Setting up World Data is very similar to the setup for a new [Persistent Item type](./persistent-items.md#unreal-setup), including the Data Asset, some Actor steps, struct, replication, and data persistence. Read the below differences first before you follow the Persistent Item docs :

- The `RedwoodTypeId` in your Data Asset should be set to `proxy`
- The `ActorClass` in your Data Asset should be left blank
- The Actor class you will be adding the `URedwoodPersistenceComponent` to is your `AGameState` class; create one if you don't have one already and make sure you update your Game Mode class to reference it
- The `RedwoodId` variable for the `URedwoodPersistenceComponent` should be set to `proxy`

:::note
You need to use the same World Data struct for all zones in a Proxy since the World Data is shared across all zones.
:::
