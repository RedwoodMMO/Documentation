---
sidebar_position: 8
---

# Sync Items

Sync Items are synchronized Actor Components (`URedwoodSyncComponent`) that can be attached to Actors to synchronize transform, state, and miscellaneous data. The synchronization is server-to-server via Redis; clients do not receive direct sync state from Redis but rather via UE replication of their connected server.

Not every Actor should be a Sync Item. This implementation isn't full, robust server meshing, but rather a tool to use as needed.

Some examples of Sync Items are:
- Various game state data (i.e. time of day, overall scores, etc)
- Battle Royale Circle/"Play Zone"
- Supply airdrop
- Limited-supply resource (to prevent cross-shard farming)
- You could theoretically sync player characters and vehicles (so you can see them across zone boundaries), but note this isn't tested and you might need to do a bit of work to support this. Need extra support implementing this? Reach out for a [custom license](https://redwoodmmo.com/#pricing).

## Setup

### Backend

You need to configure your [Game Profile](../configuration/game-modes-and-maps.md#profiles) to specify how a zone should subscribe to sync items from other zones; synchronization is only automatically enabled for these situations:
- Synchronizing between shards in the same zone
- [World Data](./world-data.md), which is just a Persistent Sync Item with the special `proxy` ID

### Unreal

:::info
We recommend checking out the `B_Fence` Blueprint class in the **RPG Template** as an example of how this is set up.
:::

1. Create a new Data Asset that inherits from `URedwoodSyncItemAsset` (i.e. `DA_CommunityChest`).

1. Create an Actor that will represent what's spawned in the world for this Sync Item (i.e. `B_CommunityChest`).

1. Create a struct that will represent the structure of the data for the Sync Item (i.e. `S_CommunityChestData`).

1. In the data asset you created (i.e. `DA_CommunityChest`), set the `RedwoodTypeId` string to some unique identifier for this type of persistent item (i.e. `community-chest`). Set the `ActorClass` to the Actor you created (i.e. `B_CommunityChest`).

    :::note
    The word `proxy` is a reserved `RedwoodTypeId` meant to be used to define the asset for [World Data](./world-data.md).
    :::

1. In your Actor (i.e. `B_CommunityChest`), attach an instance of the Actor Component `URedwoodSyncComponent`; it can have any name.

1. For the Actor Component you just created, change the "Default" values in the Details panel accordingly:

    - We recommend keeping `Store Data in Actor` enabled; if you disable this, you'll need to create a child class of `URedwoodSyncComponent` to add the data variable.
    - Leave the `Redwood Id` empty here in the class; this will be a unique identifier used for every instance of the Sync Item type.
    - By default you must manually call `MarkMovementDirty()` on the sync component to synchronize the transform, but you can change the value of `Movement Sync Interval Seconds` to a non-negative value to let Redwood automatically synchronize movement on some interval. Setting this to `0` will sync

1. In your Actor (i.e. `B_CommunityChest`), add a variable with the name `Data` (unless you changed the name in the Data Asset) with the type being the struct you created (i.e. `S_CommunityChestData`).

1. **NOTE**: If you want the data to replicate, you must enable replication manually for your Actor and the `Data` variable.

1. In your struct (i.e. `S_CommunityChestData`), you need to add a variable named `SchemaVersion` of type `Integer`.

1. Add any other serializable variables to your struct that you'd like synchronized.

## Sync Frequency

Redwood checks all Sync Items efficiently on tick to see if their state, movement, or data constructs are dirty. You can mark them dirty with the corresponding `URedwoodSyncComponent::Mark<...>Dirty()` functions. The only exception to this is if you set `Movement Sync Interval Seconds` to a non-negative value in the Sync Component as described above.

All dirty sync information is batched together in a single API call to the [sidecar](../architecture/overview.md#sidecar), which then relays that directly to Redis (which other sidecars subscribe to).

Subscribed sidecars will individually receive messages from the sidecar for each item change ASAP, but note there will be _some_ latency. There currently is no clock synchronization/rewind behavior built into the system.

:::note
[Persisted Sync Items](#persistent-items) are persisted separately in a separate batch API call at the [`DatabasePersistenceInterval`](./player-data.md#saving) interval.
:::

## Traveling Between Zones

Currently, there's no mechanism for moving a Sync Item to a different zone.

## Persistent Items

Sync Items can optionally be persisted to the database. Persisted Sync Items (sometimes called Persistent Items) are loaded from the database when a shard in the corresponding zone is started.

Not every Sync Item should be persisted; if the state doesn't need to be persisted (aka saved to the database and state restored when a shard boots up for a zone), you shouldn't use this option

Some examples of Persistent Items are:
- Player bases/UGC that is persisted in the open world area
- A persistent ferry between areas on the map that players can upgrade
- Community storage chests
- Anything that persists in the world, but requires a more modular approach than using [world data](./world-data.md)

### Enabling Persistence

In the `URedwoodSyncComponent` that you attach to the actor, check the `Persist Changes` box in the Details panel (`bPersistChanges` in C++).

### Design-time Persistent Items

All Sync Items can be placed in the Level Editor at design-time, but if you want that item to persist, you need to change some variables on the instance you place:

1. Place your Actor (i.e. `B_CommunityChest`) into the level
1. Click on the Actor instance in the Outliner panel or in the viewport
1. In the Details panel click on the `URedwoodSyncComponent` Actor Component instance (by default just called `RedwoodSync`)
1. Change the value of `Redwood Id` to something unique for this instance (i.e. `community-chest-village-blacksmith`)
1. Change the value of `Zone Name` to the name of the zone this item is located in (i.e. `village`); Redwood can't automatically determine this.

### Data Persistence

Read all about data how data persistence (loading, saving, migrations when your structure changes) in [player data docs](./player-data.md#data-persistence). Everything there is common (including the same `DatabasePersistenceInterval` variable being used and how migration functions work). You will call the `MarkDataDirty()` function on the `URedwoodPersistenceComponent` Actor Component attached to your Actor class when you need to save to the database.