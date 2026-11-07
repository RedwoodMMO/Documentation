---
sidebar_position: 7
---

# Persistence and Sync

These are the components and Data Assets that load, save, and synchronize game data. For the concepts behind them, see [Player Data](../features/data/game/player-data.md), [World Data](../features/data/game/world-data.md), [Zone Data](../features/data/game/zone-data.md), and [Sync Items](../features/sync-items.md).

## The Data Contract

The character, sync, and (custom) ability system persistence all follow the same rules for turning your variables into JSON in the database:

1. **Each field is a struct variable** with a specific name (e.g. `Metadata`) on the target object. The target is the actor the component is attached to when `bStoreDataInActor` is `true` (the default), or the component itself when it's `false` (in which case you add the variables to a Blueprint or C++ subclass of the component). Blueprint structs and C++ `USTRUCT`s both work.
2. **Each struct must have an integer field named `SchemaVersion`** (`Integer` in Blueprints, `int32` in C++), whose default value matches the component's `Latest<Field>SchemaVersion` (both start at `0`, and it must never be negative). It's stored as `schemaVersion` in the JSON.
3. **Only serializable fields are saved.** Pointers/object references are skipped. In JSON, field names start with a lowercase letter (`Health` becomes `health`).
4. **Redwood doesn't replicate your variables.** Mark them replicated yourself if clients need them.
5. **Redwood doesn't detect changes.** Call the matching `Mark<Field>Dirty` function when you change a value you want saved.

### Loading Rules

When data arrives from the backend for a field:

| Stored JSON | What happens |
| --- | --- |
| `null` | Nothing. |
| `{}` (empty, e.g. a brand new character) | Treated as **creation**: your struct keeps its default values, Redwood calls `<VariableName>_Creation()` if you defined it, and the field is marked dirty so the defaults are saved. |
| Has a `schemaVersion` equal to `Latest<Field>SchemaVersion` | Deserialized into your struct. |
| Has an older `schemaVersion` | Deserialized, then each `<VariableName>_Migrate_v<N>` function you defined runs in order, from the stored version up to the latest. |
| Has a newer `schemaVersion` than the latest | Error ("from a future schema"). |
| Not empty but no `schemaVersion` | Error. |

For the character component, an error while loading **kicks the player** ("Could not load player character data"). For sync components, it logs an error.

### Creation and Migration Functions

Define these as functions on the same target as the variables (usually your actor):

| Function | Signature | Called when |
| --- | --- | --- |
| `<VariableName>_Creation` | No inputs, no outputs | The stored JSON is empty (first time), after defaults are applied. Use it to compute initial values (e.g. `Metadata_Creation` sets starting gold based on character creator choices). |
| `<VariableName>_Migrate_v<N>` | Inputs: (1) a struct of the field's type, (2) a `USIOJsonObject*` with the raw stored JSON. Output: a struct of the field's type (named `ReturnValue`). | Upgrading stored data from schema version `N` to `N + 1`. The input struct is Redwood's best attempt at reading the old JSON into the current struct; the raw JSON lets you read fields that were renamed or removed. |

For example, if you renamed `Metadata.Coins` to `Metadata.Gold`:

1. Increase `LatestMetadataSchemaVersion` to `1` on the component, and the default `SchemaVersion` in your struct to `1`.
2. Add `Metadata_Migrate_v0(Metadata, RawJson) -> ReturnValue` that copies `RawJson`'s `coins` number field into `Gold` and returns the struct.

You don't need a migration function for every version change; if a version doesn't need any conversion (e.g. you only added a field with a sensible default), skip it.

:::caution Known issue (5.0.0)
Migration copies structs shallowly, which can corrupt memory for structs that contain strings, arrays, or maps. Test migrations carefully before relying on them in production.
:::

## `URedwoodCharacterComponent`

Persists and loads the [PlayerCharacter](../features/data/game/player-data.md#playercharacter) fields. Add it to your **pawn** class (any `APawn`, including `ACharacter`). It's replicated.

### Properties

All are in the **Redwood** category of the Details panel.

| Property | Type | Default | Meaning |
| --- | --- | --- | --- |
| `bStoreDataInActor` | `bool` | `true` | Variables live on the owning actor (`true`) or on the component (`false`, use a subclass of the component). |
| `bUseCharacterCreatorData` | `bool` | **`true`** | Load and save `characterCreatorData` |
| `CharacterCreatorDataVariableName` | `FString` | `CharacterCreatorData` | |
| `LatestCharacterCreatorDataSchemaVersion` | `int32` | `0` | |
| `bUseMetadata` | `bool` | **`true`** | Load and save `metadata` |
| `MetadataVariableName` | `FString` | `Metadata` | |
| `LatestMetadataSchemaVersion` | `int32` | `0` | |
| `bUseEquippedInventory` | `bool` | **`true`** | Load and save `equippedInventory` |
| `EquippedInventoryVariableName` | `FString` | `EquippedInventory` | |
| `LatestEquippedInventorySchemaVersion` | `int32` | `0` | |
| `bUseNonequippedInventory` | `bool` | **`true`** | Load and save `nonequippedInventory` |
| `NonequippedInventoryVariableName` | `FString` | `NonequippedInventory` | |
| `LatestNonequippedInventorySchemaVersion` | `int32` | `0` | |
| `bUseProgress` | `bool` | `false` | Load and save `progress` |
| `ProgressVariableName` | `FString` | `Progress` | |
| `LatestProgressSchemaVersion` | `int32` | `0` | |
| `bUseData` | `bool` | **`true`** | Load and save `data` |
| `DataVariableName` | `FString` | `Data` | |
| `LatestDataSchemaVersion` | `int32` | `0` | |
| `bUseAbilitySystem` | `bool` | `false` | Load and save `abilitySystem` with your own struct. **Only for custom ability systems.** If you use GAS, use [`URedwoodAbilitySystemComponent`](./optional-plugins.md#redwoodgas) instead and leave this off. |
| `AbilitySystemVariableName` | `FString` | `AbilitySystem` | |
| `LatestAbilitySystemSchemaVersion` | `int32` | `0` | |
| `bUsePlayerData` | `bool` | `false` | **Load only:** copy the player identity's data (shared across all characters) into a struct variable. Game servers can't save player data. |
| `PlayerDataVariableName` | `FString` | `PlayerData` | |
| `LatestPlayerDataSchemaVersion` | `int32` | `0` | |

:::warning
Five fields are enabled by default: `CharacterCreatorData`, `Metadata`, `EquippedInventory`, `NonequippedInventory`, and `Data`. If the component is on your pawn but any of those variables is missing (or isn't a struct with `SchemaVersion`), **players are kicked when they join**. Either create all five variables or untick the `bUse*` flags you don't need.
:::

Read-only replicated properties, filled in by Redwood:

| Property | Type | Replication | Meaning |
| --- | --- | --- | --- |
| `RedwoodPlayerId` | `FString` | Everyone | The player identity id |
| `RedwoodPlayerNickname` | `FString` | Everyone | The player's nickname |
| `RedwoodNameTag` | `FString` | Everyone | Tag of the player's selected guild, or empty |
| `RedwoodCharacterId` | `FString` | Everyone | The character id |
| `RedwoodCharacterName` | `FString` | Everyone | The character name |
| `bSelectedGuildValid` | `bool` | Owner only | Whether `SelectedGuild` is set |
| `SelectedGuild` | `FRedwoodGuildInfo` | Owner only | The player's selected guild |

### Functions and Events

| Member | Meaning |
| --- | --- |
| `MarkCharacterCreatorDataDirty`, `MarkMetadataDirty`, `MarkEquippedInventoryDirty`, `MarkNonequippedInventoryDirty`, `MarkProgressDirty`, `MarkDataDirty`, `MarkAbilitySystemDirty` | Save that field on the next flush. Server only (`BlueprintAuthorityOnly`). Does nothing if the matching `bUse*` flag is off. |
| `MarkPlayerDataDirty` | Has no effect on persistence (player data is load-only on game servers). |
| `Is<Field>Dirty` | Whether that field is waiting to be saved. |
| `OnRedwoodCharacterUpdated` | Fires after character data has been applied to your variables, on the server and (via multicast) on all clients. Use it as a "data changed" signal; the variables themselves still need replication to reach clients. |
| `OnRedwoodPlayerUpdated` | Same, for player data (nickname, guild). |

### Display Name

Redwood sets the player state's player name automatically to `[<GuildTag>] <Nickname>` (or just `<Nickname>`). You can customize it by adding a function named `FormatPlayerName` to the owning actor that has no inputs and returns an `FString` (`ReturnValue`).

:::caution Known issue (5.0.0)
The `FormatPlayerName` hook reads its result after the memory is released, so the returned name can be garbage. Avoid it for now and set the player name yourself in **On Redwood Character Updated** if you need a custom format.
:::

### Where It Can Live

- **On a pawn (recommended).** When the pawn is possessed, the component finds the controller's player state, listens to its `URedwoodPlayerStateComponent`, and applies the data.
- **On a player state.** It listens to the `URedwoodPlayerStateComponent` on the same player state, which must exist. Use this if character data must survive pawn changes.

:::caution Known issue (5.0.0)
On a player state, leaving `bStoreDataInActor` set to `true` crashes the server when data loads. On a player state, set `bStoreDataInActor` to `false` and add the variables to a subclass of `URedwoodCharacterComponent`.
:::

Redwood saves character components found on both the player state and the currently possessed pawn.

## Saving

The game mode's `DatabasePersistenceInterval` (default `0.5` seconds) controls how often dirty data is sent to the backend in one batch:

- Character fields that were marked dirty
- The character's last location (zone, transform, and control rotation)
- Data from components implementing [`IRedwoodPersistenceComponentInterface`](#iredwoodpersistencecomponentinterface) (e.g. GAS)
- World data, zone data, and persistent items that changed

A player's character is always saved when they leave the server, regardless of dirty flags. Choose the interval as the most data (in seconds) you're willing to lose if a server crashes. To save immediately, call `URedwoodServerGameSubsystem::FlushPlayerCharacterData`.

:::caution Known issue (5.0.0)
Because the last location is included every time, every connected player is written to the database at each interval even if nothing else changed. For larger player counts, increase `DatabasePersistenceInterval` (a few seconds is usually plenty).
:::

The Realm only accepts saves for characters that are currently assigned to that server, and it replaces the character's `redwoodData` (which holds the last location) on each save.

## `IRedwoodPersistenceComponentInterface`

A C++-only interface for components that want to add their own data to the character save. Implement it on any `UActorComponent` on the player state or pawn:

```cpp
// Return true if you added data that should be saved
virtual bool AddPersistedData(TSharedPtr<FJsonObject> JsonObject, bool bForce) = 0;
```

`JsonObject` is the character object being saved; add your field (e.g. `abilitySystem`) to it. `bForce` is `true` when the player is leaving. Loading is up to you: bind `URedwoodPlayerStateComponent::OnRedwoodCharacterUpdated` and read `RedwoodCharacter`. [`URedwoodAbilitySystemComponent`](./optional-plugins.md#redwoodgas) is a complete example.

## `URedwoodSyncComponent`

Makes an actor a [Sync Item](../features/sync-items.md): its transform and a data struct are synchronized between servers, and optionally persisted. It only runs on **dedicated servers** (not listen servers, not clients); clients see synced actors through normal actor replication.

| Property | Type | Default | Meaning |
| --- | --- | --- | --- |
| `bStoreDataInActor` | `bool` | `true` | Data struct on the owning actor or on the component |
| `bPersistChanges` | `bool` | `false` | Save to the database (a "persistent item"), not just sync between servers |
| `RedwoodId` | `FString` | empty | Unique id of this item. Leave empty for items spawned at runtime (a GUID is assigned). Set it for items placed in a level. On the game state, set it to `proxy` for [world data](../features/data/game/world-data.md) or `zone` for [zone data](../features/data/game/zone-data.md). |
| `ZoneName` | `FString` | empty | The zone that owns the item. Filled in automatically for items spawned at runtime. Set it for persistent items placed in a level. |
| `DataVariableName` | `FString` | `Data` | Name of the data struct variable |
| `LatestDataSchemaVersion` | `int32` | `0` | See [The Data Contract](#the-data-contract) |
| `bUseData` | `bool` | `true` | Currently has no effect (data is always synced). |
| `MovementSyncIntervalSeconds` | `float` | `-1` | `< 0`: only sync the transform when you call `MarkMovementDirty`. `0`: sync every frame. `> 0`: intended to sync every N seconds. |
| `RedwoodTypeId` | `FString` (read only) | | Filled in from the `URedwoodSyncItemAsset` whose `ActorClass` is exactly this actor's class |

:::caution Known issue (5.0.0)
`MovementSyncIntervalSeconds` values greater than `0` behave backwards: the transform syncs every frame for N seconds after each `MarkMovementDirty` call, rather than once every N seconds. Use `-1` with `MarkMovementDirty`, or `0`.
:::

| Function / event | Meaning |
| --- | --- |
| `MarkMovementDirty()` | Sync the transform on the next tick (and persist it on the next save if `bPersistChanges`). |
| `MarkDataDirty()` | Sync the data struct on the next tick (and persist it on the next save if `bPersistChanges`). |
| `MarkAllDirty()` | Both of the above. |
| `IsMovementDirty(bForPersistence)` / `IsDataDirty(bForPersistence)` | Whether a sync (`false`) or save (`true`) is pending. |
| `ClearDirtyFlags(bForPersistence)` | Clear the sync or save flags. |
| `SkipInitialSave()` / `ShouldDoInitialSave()` | New items are saved once even if nothing is dirty. Redwood skips this for items it spawned from the database or from another server. |
| `DataUpdated` (event) | Fires when data from the database or another server was applied. Use it to update visuals. |
| `InitiallySpawned` (event) | Fires on the server that created the item, one tick after `BeginPlay`. |

Dirty sync data is sent to the sidecar in one batch every tick, and other servers receive each change as soon as possible (there's no clock synchronization or rollback). Persistent changes are saved separately at the `DatabasePersistenceInterval`.

### Placed vs. Spawned Items

| Case | Set up |
| --- | --- |
| Spawned at runtime by the server | Leave `RedwoodId` and `ZoneName` empty. Create a `URedwoodSyncItemAsset` for the class. Tick `bPersistChanges` if it should survive restarts. |
| Placed in a level and persisted | Give the placed instance a fixed, unique `RedwoodId` (e.g. `chest-town-blacksmith`) and set `ZoneName` to the zone it's in. Otherwise a new id is created every boot and you'll get duplicates. |
| World data | `URedwoodSyncComponent` on the **game state**, `RedwoodId = proxy`, `bPersistChanges = true`. Shared by every zone of the proxy and synced live between them. |
| Zone data | `URedwoodSyncComponent` on the **game state**, `RedwoodId = zone`, `bPersistChanges = true`. Stored per proxy and zone. |

:::warning
Always set `RedwoodId` to `proxy` or `zone` explicitly on game state sync components. Leaving it empty doesn't work, because an id is generated before world data is loaded.
:::

Items from other zones are only received if the zone's game profile config says so (`syncItemsFromAllZones` or `syncItemsFromZones`, see [Game Modes and Maps](../configuration/game-modes-and-maps.md#profiles)). Shards of the same zone always sync with each other.

:::caution Known issue (5.0.0)
- Destroying a persistent item doesn't mark it destroyed in the database, so it comes back the next time the zone starts.
- Copies of items received from other servers aren't removed when the original is destroyed.
- Zone data is saved and loaded correctly, but live changes aren't applied on other shards of the same zone until they reload.
- On packaged servers, spawning a sync item whose class isn't loaded yet can fail ("Failed to spawn SyncItemComponent of type ..."). Make sure the class is loaded (e.g. referenced by something in the map) until this is fixed.
:::

## `URedwoodSyncItemAsset`

A Primary Data Asset (type `RedwoodSyncItemAsset`) that tells Redwood which actor class to spawn for a sync item type. Create one for every actor class that has a `URedwoodSyncComponent` (except the game state). It must be scanned by the [Asset Manager](./settings.md#asset-manager).

| Property | Type | Meaning |
| --- | --- | --- |
| `RedwoodTypeId` | `FString` | Unique type id stored with each item (e.g. `community-chest`). `proxy` is reserved for world data. |
| `ActorClass` | `TSoftClassPtr<AActor>` | The class to spawn. It must be exactly the class the sync component is on (subclasses need their own asset). |

## `URedwoodGameModeAsset`

A Primary Data Asset (type `RedwoodGameModeAsset`) that connects a backend [game profile](../configuration/game-modes-and-maps.md#profiles) to a game mode class. Create one per profile. It must be scanned by the [Asset Manager](./settings.md#asset-manager).

| Property | Type | Default | Used by Redwood? | Meaning |
| --- | --- | --- | --- | --- |
| `RedwoodId` | `FString` | | **Yes** | Must equal the game profile `id` in `game.yaml`. Lowercase, no spaces, unique. |
| `GameModeType` | `ERedwoodGameModeType` | `GameModeBase` | **Yes** | `GameModeBase` or `GameMode`, depending on which Redwood class your game mode inherits from |
| `GameModeBaseClass` | `TSubclassOf<ARedwoodGameModeBase>` | | **Yes** | Shown when `GameModeType` is `GameModeBase` |
| `GameModeClass` | `TSubclassOf<ARedwoodGameMode>` | | **Yes** | Shown when `GameModeType` is `GameMode` |
| `bShowInFrontEnd` | `bool` | | No | For your own menus (e.g. which modes players can pick for a private lobby) |
| `DisplayName` | `FText` | | No | For your own menus |
| `DisplayDescription` | `FText` | | No | For your own menus |
| `DisplayIcon` | `UTexture2D*` | | No | For your own menus |

## `URedwoodMapAsset`

A Primary Data Asset (type `RedwoodMapAsset`) that connects a map name used in the backend config to an Unreal level. Create one per map. It must be scanned by the [Asset Manager](./settings.md#asset-manager).

| Property | Type | Used by Redwood? | Meaning |
| --- | --- | --- | --- |
| `RedwoodId` | `FString` | **Yes** | Must equal a map name in a profile zone's `maps` list in `game.yaml`. Lowercase, no spaces, unique. |
| `MapId` | `FPrimaryAssetId` (type `Map`) | **Yes** | The level to load. The server opens it by its short name (e.g. `L_Arena`), so the level must be cooked in packaged builds. |
| `MapName` | `FText` | No | For your own menus |

## No-Backend Mode

When [Use Backend in PIE](./settings.md#editor-preferences) is off, PIE runs without the backend and Redwood stores data on disk in `Saved/Persistence/`:

```
YourProject/Saved/Persistence/
  Characters/
    000.json      <- created by Create Character with no backend
    001.json
  Maps/
    <MapName>.json  <- world data, zone data, persistent items for that map
```

| Feature | Behavior |
| --- | --- |
| Login, register | Always succeed with any input. Only one player identity exists. |
| Creating characters | **Create Character** writes `Saved/Persistence/Characters/<NNN>.json` (`000`, `001`, ...). Do this in **Play Standalone**, once per client you want to test with. |
| Assigning characters | When PIE client N joins the server (`N` = join order, starting at `0`), it gets the N-th file in `Characters/`. If there isn't one, it's rejected with "No character found for this player index N". |
| Saving characters | All enabled fields are written back to the character's JSON file at each interval. |
| Spawn location | Zone spawns for the [Fallback Zone Name](./settings.md#editor-preferences), otherwise PlayerStart. |
| World and zone data | Loaded from and saved to `Maps/<MapName>.json`. |
| Server details (`ZoneName`, `ProxyId`, ...) | Empty. |
| Matchmaking, queuing, proxies, social features | Not available (stubbed or error). |
| Cross-server sync, zone transfers | Not available. |
| Blob and SaveGame storage | Not available (see the known issue in [Game Framework](./game-framework.md#functions)). |

:::caution Known issue (5.0.0)
In no-backend mode, persistent items and the character's last location are saved but not loaded back.
:::

To reset your local data, delete the `Saved/Persistence` folder.
