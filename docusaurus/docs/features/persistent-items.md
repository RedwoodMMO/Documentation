---
sidebar_position: 8
---

# Persistent Items

Persistent Items are things that live in a [GameServerProxy](../architecture/game-servers.md#gameserverproxy) which have a persisted state. They have a world transform, belong to a [zone](./zones.md), and have a single data field in the database. Any Persistent Item that isn't marked as destroyed are automatically initialized in all [shards](./sharding.md) of their designated zone.

Not every Actor should be a Persistent Item; if the state doesn't need to be persisted (aka saved to the database and state restored when a shard boots up for a zone), you shouldn't use a Persistent Item.

Persistent Items in the database will spawn a new Actor

Some examples of Persistent Items are:
- Player bases/UGC that is persisted in the open world area
- A persistent ferry between areas on the map that players can upgrade
- Community storage chests
- Anything that persists in the world, but requires a more modular approach than using [world data](./world-data.md)

## Synchronization Across Shards

Currently Persistent Items don't have any synchronization across shards. When a shard is started, all of it's active Persistent Items will be initialized with the latest information in the database. If another shard changes that Persistent Item's data, existing shards will not receive this change.

We're aware this makes Persistent Items not super useful when considering sharding, and we'll be adding real-time synchronization soon.

## Traveling Between Zones

Currently, there's no mechanism for moving a Persistent Item to a different zone. We'll be adding support for this soon.

## Unreal Setup

We recommend checking out the `B_Fence` Blueprint class in the **RPG Template** as an example of how this is set up, but here are the steps to integrate Persistent Items into Unreal:

1. Create a new Data Asset that inherits from `URedwoodPersistentItemAsset` (i.e. `DA_CommunityChest`).

1. Create an Actor that will represent what's spawned in the world for this Persistent Item (i.e. `B_CommunityChest`).

1. Create a struct that will represent the structure of the data for the Persistent Item (i.e. `S_CommunityChestData`).

1. In the data asset you created (i.e. `DA_CommunityChest`), set the `RedwoodTypeId` string to some unique identifier for this type of persistent item (i.e. `community-chest`). Set the `ActorClass` to the Actor you created (i.e. `B_CommunityChest`).

    :::note
    The word `proxy` is a reserved `RedwoodTypeId` meant to be used to define the asset for [World Data](./world-data.md).
    :::

1. In your Actor (i.e. `B_CommunityChest`), attach an instance of the Actor Component `URedwoodPersistenceComponent`; it can have any name.

1. For the Actor Component you just created, change the "Default" values accordingly:

    - Set the `PersistentItem` to your Data Asset (i.e. `DA_CommunityChest`).
    - Leave the `RedwoodId` empty here in the class; this will be a unique identifier used for every instance of the Persistent Item type.

1. In your Actor (i.e. `B_CommunityChest`), add a variable with the name `Data` (unless you changed the name in the Data Asset) with the type being the struct you created (i.e. `S_CommunityChestData`).

1. **NOTE**: If you want the data to replicate, you must enable replication manually for your Actor and the `Data` variable.

1. In your struct (i.e. `S_CommunityChestData`), you need to add a variable named `SchemaVersion` of type `Integer`.

1. Add any other serializable variables to your struct that you'd like persisted to the database.

## Data Persistence

Read all about data how data persistence (loading, saving, migrations when your structure changes) in [player data docs](./player-data.md#data-persistence). Everything there is common (including the same `DatabasePersistenceInterval` variable being used and how migration functions work). You will call the `MarkDataDirty()` function on the `URedwoodPersistenceComponent` Actor Component attached to your Actor class when you need to save to the database.

## Runtime Persistent Items

Persistent Items can be created at runtime (i.e. players can trigger something to create the Persistent Item). You do this simply by spawning the Actor (i.e. `B_CommunityChest`) from the game server.

:::danger
Hey, so as we're writing these docs, we're noticing there may be a bug with how this works. Give it a shot, but if it doesn't work (i.e. the actors don't reappear with the persisted data when the proxy restarts), [please let us know](../support/how-to-get-support.md). We're releasing these docs Nov 22, 2024, but may not get around to a fix for a couple weeks. Thanks for understanding!
:::

## Design-time Persistent Items

You can also create persistent items at design time in the Level Editor.

1. Place your Actor (i.e. `B_CommunityChest`) into the level
1. Click on the Actor instance in the Outliner panel or in the viewport
1. In the Details panel click on the `URedwoodPersistenceComponent` Actor Component instance
1. Change the value of `RedwoodId` to something unique for this instance (i.e. `community-chest-village-blacksmith`)

:::danger
Hey, so as we're writing these docs, we're noticing there may be a bug with how you specify the zone for a Persistent Item. We're releasing these docs Nov 22, 2024, but may not get around to a fix for a couple weeks. Thanks for understanding!
:::
