---
sidebar_position: 2
---

# World Data

World Data is data that's synchronized to every shard in every zone of a [`GameServerProxy`](../../../architecture/game-servers.md#gameserverproxy) and persisted to the database with that proxy, so when the proxy is started again with a new [`GameServerCollection`](../../../architecture/game-servers.md#gameservercollection), it loads that data back. This is useful for any data associated with the world as a whole that isn't specifically tied to a synced/persisted actor (use a [Sync Item](../../sync-items.md) for that instead).

For example, World Data could be long-term scoring between factions, a world event's progress, or the current time of day. However, if you want a player-created building to persist, that should be a [Persistent Item](../../sync-items.md#persistent-items). Ultimately, the difference comes down to: if the data should cause an actor to be spawned, use a Sync Item; otherwise use World Data.

If the data should be separate for each zone, use [Zone Data](./zone-data.md) instead.

## Synchronization Across Shards

World Data is automatically synchronized to all shards in all zones of the proxy. When one server marks it dirty, every other server of the proxy receives the update; there's nothing else to configure.

## Unreal Setup

World Data is a special [Sync Item](../../sync-items.md) that lives on your Game State and has the reserved ID `proxy`.

1. **Register the asset type.** Make sure the Asset Manager scans `RedwoodSyncItemAsset` (see [Setting Up Unreal](../../../getting-started/setting-up-unreal.md#asset-manager)).

1. **Create the data struct** (e.g. a `USTRUCT` named `FWorldData`). It must have an `int32` property named `SchemaVersion` with a default of `0`. Add whatever fields your world needs (e.g. `PrayerCount`).

1. **Add a Redwood Sync Component** (`URedwoodSyncComponent`) to your Game State class (create a Game State class if you don't have one, and set it on your Redwood game mode). In its Details panel:
    - Set **Redwood Id** to `proxy`. Don't leave it empty; an empty ID is replaced with a random one.
    - Enable **Persist Changes** (`bPersistChanges`).
    - Leave **Store Data in Actor** enabled and **Data Variable Name** as `Data` (or change it to your variable's name).

1. **Add the data variable** to your Game State: a `UPROPERTY` named `Data` of your struct type. Make it `Replicated` if clients need to see it (e.g. to show the time of day).

1. **Create the Data Asset.** In the Content Browser, **Right Click > Miscellaneous > Data Asset**, pick `RedwoodSyncItemAsset` (e.g. `DA_WorldData`), and set:
    - **Redwood Type Id** to `proxy`
    - **Actor Class** to your Game State class

:::note
Every zone in a proxy shares the same World Data, so all of the zones' servers must use a Game State with the same World Data struct.
:::

## Changing World Data

World Data can only be changed on the server. Modify the Game State's `Data` variable, then call `MarkDataDirty()` on its `URedwoodSyncComponent`. Redwood sends the change to every other server in the proxy right away, and saves it to the database at the next [`DatabasePersistenceInterval`](./player-data.md#saving).

To react to changes from other servers (and to the initial load when the server starts), bind the Sync Component's `DataUpdated` event.

For example, a shrine that counts prayers across the whole world. Add an integer `PrayerCount` field to your World Data struct, then give your Game State a function that your shrine [interactable](../../interactables.md) (`ARedwoodInteractable`) calls from its `OnInteract` event:

```cpp
#include "RedwoodSyncComponent.h"

void AMyGameState::AddPrayer()
{
  check(HasAuthority());
  Data.PrayerCount++;

  URedwoodSyncComponent* Sync = FindComponentByClass<URedwoodSyncComponent>();
  Sync->MarkDataDirty();
}
```

Bind the Sync Component's `DataUpdated` event on the Game State and log `Data.PrayerCount`. Join two different shards or zones of the same proxy and you'll see the count go up on both.

Changes to the struct definition over time are handled with the same [migration functions](./player-data.md#changing-the-structures) as player data (defined on the Game State).
