---
sidebar_position: 7
---

# World Data

World Data is used to specify any data that is synchronized to all shards in all zones and persistence to the database, associated with a [`GameServerProxy`](../architecture/game-servers.md#gameserverproxy) so that when it gets started again via another [`GameServerCollection`](../architecture/game-servers.md#gameservercollection) it will load that data. This is useful for any data that's associated with the world that isn't specifically related to some synced/persisted actor (use a [Syn Item](./sync-items.md) for that instead).

For example, world data could be long-term scoring between different guilds or the current time of day (though the latter could be implemented using a persistent item too). However, if you want to have a player-created building to persist, that should be defined using a [Persisted Sync Item](./sync-items.md#persistent-items). Ultimately, the difference comes down to: if you want the data to initiate the spawning of an actor, use a sync item, otherwise use world data in the proxy.

## Synchronization Across Shards

World Data is automatically synchronized to all shards in all zones starting in Version 3.0. That's it; nothing more to it.

## Unreal Setup

:::info
We recommend checking out the `B_GameState` Blueprint class in the **RPG Template** as an example of how this is set up. You can see an example of how the World Data is modified in the `B_WorldCounter` Blueprint class, which we've placed by each Fast Travel location in the template as a campfire. Interacting with this campfire will increase a counter that you can see synced to all shards via a print string log.
:::

Setting up World Data is very similar to the setup for a new [Sync Item Type](./sync-items.md#unreal), including the Data Asset, some Actor steps, struct, replication, and data persistence. Read the below differences first before you follow the Sync Item docs:

- The `RedwoodTypeId` in your Data Asset should be set to `proxy`
- The `ActorClass` in your Data Asset should be set to your `AGameState` class
- The Actor class you will be adding the `URedwoodSyncComponent` to is your `AGameState` class; create one if you don't have one already and make sure you update your Game Mode class to reference it
- The `RedwoodId` variable for the `URedwoodSyncComponent` should be set to `proxy`
- The `PersistChanges` variable for the `URedwoodSyncComponent` should be enabled

:::note
You need to use the same World Data struct for all zones in a Proxy since the World Data is shared across all zones.
:::
