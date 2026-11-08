# Sync Items

Sync Items are Actors with a **Redwood Sync Component** (`URedwoodSyncComponent`) whose transform and data are synchronized between game servers. The synchronization is server-to-server through the [sidecar](../architecture/overview.md#sidecar) and Redis; clients don't receive sync state directly, they just see the Actor through normal Unreal replication from the server they're connected to.

Not every Actor should be a Sync Item. This isn't full, robust server meshing, but rather a tool to use as needed.

Some examples of Sync Items are:
- A Battle Royale circle/"play zone"
- A supply airdrop that's visible from neighboring zones
- A limited-supply resource (to prevent cross-shard farming)
- A player-built structure near a zone boundary
- You could theoretically sync player characters and vehicles (so you can see them across zone boundaries), but this isn't tested and you might need to do a bit of work to support it. Need extra support implementing this? Reach out for a [custom license](https://redwoodmmo.com/#pricing).

Sync Items can also be **persisted** to the database (we call these [Persistent Items](#persistent-items)) so they're restored when a zone's server starts again. [World Data](./data/game/world-data.md) and [Zone Data](./data/game/zone-data.md) are built on the same component.

:::warning
Cross-server sync is disabled when using the [Edgegap](./game-servers/hosting/edgegap.md) game server provider, but you can still use the [persistence feature](#persistent-items).
:::

## Setup

### Backend

Sync Items are always synchronized between the shards of the same zone. To also see a zone's items from **other** zones, configure the receiving zone in your [game profile](../configuration/game-modes-and-maps.md#profiles):

```yaml
profiles:
  - id: "overworld"
    zones:
      variableCasing: "original"
      town:
        maps:
          - "overworld"
      wilds:
        maps:
          - "overworld"
        # wilds servers also spawn copies of town's Sync Items
        syncItemsFromZones:
          - "town"
      cave:
        maps:
          - "cave"
        # or subscribe to every zone:
        # syncItemsFromAllZones: true
```

Note the camelCase field names; zones use `variableCasing: "original"` so zone names aren't transformed, which means fields inside zones are written exactly as Redwood reads them.

Items received from another zone are spawned as copies on the receiving server. Only the server for the zone that owns an item (its `ZoneName`) sends updates for it; copies just receive them.

### Unreal

The steps below use a community chest as an example: a chest players can see from any shard, whose contents are shared.

1. **Register the asset type.** Make sure the Asset Manager scans `RedwoodSyncItemAsset` (see [Setting Up Unreal](../getting-started/setting-up-unreal.md#asset-manager)). Redwood uses these assets to know which Actor class to spawn when an item arrives from another server or is loaded from the database.

1. **Create the data struct** (e.g. `S_CommunityChestData`). It must have an integer variable named `SchemaVersion` with a non-negative default (`0` to start). Add any other serializable variables you want synchronized.

1. **Create the Actor** that represents the item in the world (e.g. `B_CommunityChest`) and enable **Replicates** on it so clients can see it.

1. **Add a Redwood Sync Component** to the Actor (it can have any name) and set its defaults in the Details panel:

    | Property | What to set |
    | --- | --- |
    | **Store Data in Actor** | Leave enabled so the data variable lives on the Actor. If you disable it, create a subclass of `URedwoodSyncComponent` and put the variable there instead. |
    | **Redwood Id** | Leave empty on the class. Each instance gets a unique ID automatically when it's registered (see [design-time items](#design-time-persistent-items) for the exception). |
    | **Zone Name** | Leave empty on the class. It's set to the server's zone automatically. |
    | **Persist Changes** | Enable to make it a [Persistent Item](#persistent-items) |
    | **Data Variable Name** | `Data` by default; the name of the struct variable on the Actor |
    | **Latest Data Schema Version** | `0` to start; see [migrations](./data/game/player-data.md#changing-the-structures) |
    | **Movement Sync Interval Seconds** | `-1` (the default) syncs the transform only when you call `MarkMovementDirty()`. `0` syncs it every frame. |

1. **Add the data variable** to the Actor: a variable named `Data` (or whatever you set as **Data Variable Name**) of your struct type. If clients need to see the data, enable replication on the variable.

1. **Create the Data Asset.** In the Content Browser, **Right Click > Miscellaneous > Data Asset** and pick `RedwoodSyncItemAsset` (e.g. `DA_CommunityChest`). Set:
    - **Redwood Type Id** to a unique identifier for this kind of item (e.g. `community-chest`). The ID `proxy` is reserved for [World Data](./data/game/world-data.md).
    - **Actor Class** to your Actor class (e.g. `B_CommunityChest`). It must be the exact class (not a parent class) of the Actors you spawn.

    You don't need to reference this Data Asset anywhere else; Redwood finds it through the Asset Manager.

### Spawning and updating

Sync Items only do anything on **dedicated servers**. Spawn your Actor on the server like any other Actor; its Sync Component registers it with Redwood on the next tick and broadcasts its **Initially Spawned** event. Other servers subscribed to its zone spawn a copy.

When your server code changes the item, mark it dirty on the Sync Component:

| Function | What it syncs |
| --- | --- |
| `MarkDataDirty()` | The data struct |
| `MarkMovementDirty()` | The Actor's transform |
| `MarkAllDirty()` | Both |

On other servers, the component's **Data Updated** event fires whenever new data is applied to the copy (and after its initial load), which is a good place to update visuals.

:::caution Known issue (5.0.0)
Setting **Movement Sync Interval Seconds** to a positive number doesn't sync on that interval; it behaves like syncing every frame for that many seconds after each `MarkMovementDirty()` call. Use `-1` with manual `MarkMovementDirty()` calls, or `0`, until this is fixed.
:::

:::caution Known issue (5.0.0)
Destroying a Sync Item doesn't remove the copies of it on other servers, and items that leave a subscribed zone aren't removed either. If you destroy Sync Items at runtime, also replicate that decision through the item's data (e.g. a `bRemoved` flag the copies react to in **Data Updated**).
:::

## Sync Frequency

Redwood checks all Sync Items each tick to see if their movement or data has been marked dirty. The only exception is when you set **Movement Sync Interval Seconds** to `0`, which syncs the transform automatically.

All dirty sync information is batched together in a single message to the [sidecar](../architecture/overview.md#sidecar), which relays it to Redis (which the other sidecars subscribe to).

Subscribed servers receive each item change as soon as possible, but there will be _some_ latency. There's currently no clock synchronization/rewind behavior built into the system.

:::note
[Persistent Items](#persistent-items) are saved to the database separately, in a batch every [`DatabasePersistenceInterval`](./data/game/player-data.md#saving) seconds.
:::

## Traveling Between Zones

Currently, there's no mechanism for moving a Sync Item to a different zone.

## Persistent Items

Sync Items can optionally be saved to the database. Persistent Items are loaded from the database when a shard in the corresponding zone starts, and Redwood respawns them (using the Data Asset's **Actor Class**) with their saved transform and data.

Not every Sync Item should be persisted; if the state doesn't need to survive a server restart, don't use this option.

Some examples of Persistent Items are:
- Player bases/UGC that is persisted in the open world area
- A persistent ferry between areas on the map that players can upgrade
- Community storage chests
- Anything that persists in the world, but requires a more modular approach than using [World Data](./data/game/world-data.md)

### Enabling Persistence

In the Sync Component on your Actor, check **Persist Changes** in the Details panel (`bPersistChanges` in C++).

New items are saved once when they're first registered, and after that whenever you mark their movement or data dirty.

:::caution Known issue (5.0.0)
Destroying a Persistent Item doesn't remove it from the database, so it's respawned the next time the zone's server starts. Until this is fixed, mark removed items in their data and destroy them again in **Data Updated**, or keep the item and hide it.
:::

### Design-time Persistent Items

You can place Sync Items in the Level Editor at design time, but if a placed item should be persisted, you need to give that instance a fixed identity:

1. Place your Actor (e.g. `B_CommunityChest`) into the level
1. Select the Actor instance in the Outliner or the viewport
1. In the Details panel, select its Redwood Sync Component
1. Set **Redwood Id** to something unique for this instance (e.g. `community-chest-town-blacksmith`)
1. Set **Zone Name** to the name of the zone this item is located in (e.g. `town`); Redwood can't automatically determine this for placed Actors

When the zone's server starts, Redwood loads the saved state for that ID and applies it to the placed Actor before registering it, so the saved values win over the placed ones. Without a fixed **Redwood Id**, every server start would create a brand new item (and respawn the previously saved one alongside it).

### Data Persistence

Data persistence (loading, saving, and migrations when your struct changes) works the same way as [player data](./data/game/player-data.md#data-persistence), including the same `DatabasePersistenceInterval` and the same migration functions. Call `MarkDataDirty()` on the Sync Component when you need to save the data to the database.

More details on every property and function are in the [Unreal Plugin Reference](../unreal-reference/persistence-and-sync.md).
