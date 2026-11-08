---
sidebar_position: 3
---

# Zone Data

Each [zone](../../game-servers/zones.md) in a `GameServerProxy` can have its own persistent data that's not shared with other zones in the proxy (unlike [World Data](./world-data.md), which every zone shares). It's stored per proxy and zone, and loaded whenever a server for that zone starts.

For example, zone data could track which of a zone's bosses have been defeated, or the state of a zone-specific event.

## Unreal Setup

Zone Data works just like [World Data](./world-data.md#unreal-setup), with a different reserved ID:

1. Make sure the Asset Manager scans `RedwoodSyncItemAsset` and that you have a `RedwoodSyncItemAsset` Data Asset whose **Actor Class** is your Game State class (the same one you'd create for World Data).
1. Add a Redwood Sync Component (`URedwoodSyncComponent`) to your `AGameState` class.
1. Set its **Redwood Id** to `zone`.
1. Enable its **Persist Changes** (`bPersistChanges`).
1. Add a struct variable for the zone data (with an integer `SchemaVersion` field) and set the component's **Data Variable Name** to that variable's name.

Your Game State can have both a `proxy` Sync Component (World Data) and a `zone` Sync Component (Zone Data); just give them different **Data Variable Name**s (e.g. `WorldData` and `ZoneData`).

To save changes to the struct, call **Mark Data Dirty** (`MarkDataDirty()`) on the `zone` Sync Component on the server. Zone Data is saved at the [`DatabasePersistenceInterval`](./player-data.md#saving) along with the rest of the zone's persistent data.

:::caution Known issue (5.0.0)
Zone Data is saved and loaded correctly, but live updates aren't applied to the zone's other shards while they're running; each shard only picks up the latest saved Zone Data when it starts. If several shards of a zone need to see changes immediately, use [World Data](./world-data.md) or a [Sync Item](../../sync-items.md) instead.
:::
