---
sidebar_position: 1
---

# Player Data

:::tip
If you're integrating Redwood for the first time, start with the step-by-step [Saving Player Data](../../../getting-started/saving-player-data.md) guide. This page goes deeper into how the data is stored, saved, and migrated.
:::

## Database Storage

Understanding how the database stores the data will help you decide what data should be stored in which field. Once you have a general understanding, the Redwood Unreal plugin abstracts most of the process away from you.

### PlayerIdentity

Each player has one `PlayerIdentity` entry stored in the [Director](../../../architecture/overview.md#director) database. This is the first entry point, usually via [authentication](../../authentication/overview.md). It holds the player's account details (nickname, role, linked providers) and a `data` JSON field that's shared across all of the player's characters in every realm.

The `URedwoodCharacterComponent` can load the PlayerIdentity `data` into a struct (see the `PlayerData` variable in [Unreal Setup](#unreal-setup)), but there's currently no API for game servers or clients to write it; it's intended for data you manage from your own backend code or tools.

### PlayerCharacter

Each player can have one or more `PlayerCharacter` entries stored in each of the [Realm](../../../architecture/overview.md#realms) databases. A `PlayerCharacter` can only be used for games running in its realm.

Each `PlayerCharacter` has a `name` to be displayed in game. Redwood automatically calls `APlayerState::SetPlayerName()` with the player's nickname (prefixed with their selected guild's tag, if they have one).

Each `PlayerCharacter` has the following JSON fields. Redwood doesn't fill the data for any of these (except `redwoodData`); it's up to you to define the structure of these objects. See how to do this [in Unreal](#unreal-setup).

#### `characterCreatorData`

This stores any data from your character creator. Depending on the realm's [`characters.players-can-update-character-creator-data`](../../../configuration/reference/realm.md) setting (`always` by default, or `initial` or `never`), players can set this JSON object directly with client API calls, so you should not use it for any data that needs an authoritative check (i.e. level, experience, gear).

This is typically replicated to all players (so they know how to visualize the player's character).

#### `metadata`

This stores any metadata for the character managed by the server (e.g. level, health, equipped gear). Any data that isn't inventory that all players should know about should be stored here.

This is typically replicated to all players (so they know how to visualize the character's gear or show a health bar in the nameplate).

#### `equippedInventory`

This stores any of the inventory that the character **is carrying**. For example, if your game dropped all the inventory on death, it would use this object. It's up to you if you want visually equipped gear to be in both `equippedInventory` and `metadata` or only `metadata`.

This is typically **not** replicated to other players. If you replicate this to other players, they could create a mod that shows the inventory for each of the players they see.

#### `nonequippedInventory`

This stores any of the inventory that the character **is not carrying**. The primary concept of this object would be what the character has in the "bank". Localized/specific storage containers (i.e. chests) would likely have their own inventory and access permissions, stored in a [Persistent Item](../../sync-items.md#persistent-items) instead.

This is typically **not** replicated to other players, for the same reason as `equippedInventory`.

#### `progress`

This stores any data related to the progress of the character; some examples include:
- Achievements
- Quests
- NPC relationships
- Skill trees
- Unlocked gear, skins, and game modes

There are no recommendations whether this is replicated or not.

:::info
This field is disabled by default in the `URedwoodCharacterComponent` and must explicitly be enabled by setting `bUseProgress` to `true` (in C++ or the component's Details panel).
:::

#### `abilitySystem`

This stores any data related to abilities. It can be used either by the `URedwoodCharacterComponent` with your own struct (for a custom ability system; disabled by default via `bUseAbilitySystem`) or by the built-in [Gameplay Ability System (GAS) integration](./gas.md).

#### `data`

This stores any other game data for the character that shouldn't be replicated to other players. This could be quest data, bookmarked locations, character-specific settings, etc.

This is typically **not** replicated to other players.

#### `redwoodData`

This stores data used by Redwood itself, such as the character's last location (zone, transform, or spawn name) used when [transferring zones](../../game-servers/zones.md) and reconnecting. Altering this object can break other systems.

## Unreal Setup

The recommended setup uses the `URedwoodCharacterComponent`, which maps each field above to a struct variable:

1. Your game mode inherits from `ARedwoodGameModeBase` or `ARedwoodGameMode`, and your Player State has a `URedwoodPlayerStateComponent` (see [Setting Up Unreal](../../../getting-started/setting-up-unreal.md#game-framework-classes)).
1. Your Pawn class has a `URedwoodCharacterComponent`.
1. Create a struct for each field you use (Blueprint structs or `USTRUCT`s with `UPROPERTY` fields). **Each struct must have an integer property named `SchemaVersion`** with a non-negative default (start with `0`). You can use the same struct type for multiple fields.
1. On the Pawn, create a variable of the matching struct type for each enabled field:

    | Field | Variable name | `bUse` flag | Enabled by default |
    | --- | --- | --- | --- |
    | `characterCreatorData` | `CharacterCreatorData` | `bUseCharacterCreatorData` | Yes |
    | `metadata` | `Metadata` | `bUseMetadata` | Yes |
    | `equippedInventory` | `EquippedInventory` | `bUseEquippedInventory` | Yes |
    | `nonequippedInventory` | `NonequippedInventory` | `bUseNonequippedInventory` | Yes |
    | `progress` | `Progress` | `bUseProgress` | No |
    | `data` | `Data` | `bUseData` | Yes |
    | `abilitySystem` | `AbilitySystem` | `bUseAbilitySystem` | No |
    | PlayerIdentity `data` | `PlayerData` | `bUsePlayerData` | No (load only) |

    You can change the expected names with the component's `<Field>VariableName` properties (e.g. `CharacterCreatorDataVariableName`). Untick the `bUse` flag for any field you don't use.

    :::warning
    If an enabled field's variable is missing, isn't a struct, or its struct has no `SchemaVersion`, the player is kicked when they join ("Could not load player character data").
    :::

1. Optionally, set `bStoreDataInActor` to `false` and put the variables on a subclass of `URedwoodCharacterComponent` instead of the Pawn. Migration and creation functions (below) then go on the component too.
1. **Don't forget:** enable replication on each variable that clients need. Redwood doesn't do this for you.

    :::warning
    We **highly recommend** setting `EquippedInventory`, `NonequippedInventory`, and `Data` to the **Replication Condition** `Owner Only` (`COND_OwnerOnly` in C++). These fields are separate from the others so you can partition what other players can see.
    :::

:::note Not using the character component
While using the `URedwoodCharacterComponent` is **definitely recommended**, it's not required and may get in the way of integrating some existing systems (especially those that heavily use SaveGames for persisting character data).

The raw character data is available on the server in `URedwoodPlayerStateComponent::RedwoodCharacter` (not replicated). You'll get `USIOJsonObject` objects for the various data fields, and you'll need to deserialize them yourself (e.g. with **Json Object to Struct**). Call `URedwoodPlayerStateComponent::MarkCharacterDataDirty()` to save _all_ of the fields in that struct. **Don't mix this approach with the `URedwoodCharacterComponent`**; the behavior is undefined.

C++ components can also implement `IRedwoodPersistenceComponentInterface` to add their own fields to the save payload (this is how the [GAS integration](./gas.md) works).
:::

## Data Persistence

### Loading

When a player joins a server, Redwood fetches their character from the backend and the `URedwoodCharacterComponent` automatically copies each enabled field into your struct variables, on the server. If clients aren't seeing something, make sure the variable is replicated. To react to the data on clients (e.g. to update the character's appearance), either use a RepNotify on the variable or bind the component's **On Redwood Character Updated** event (`OnRedwoodCharacterUpdated`), which fires on the server after the data is applied and is multicast to clients.

### Saving

Instead of saving data to the database every time it changes, Redwood periodically checks whether any data has been marked dirty and saves it. By default this happens every 0.5 seconds; you can change it with the `DatabasePersistenceInterval` property on your Redwood game mode (in Class Defaults or the C++ constructor). A shorter interval means more traffic between the Unreal server, the sidecar, the Realm Backend, and the database; a longer one means more data could be lost if a server crashes.

:::note
When choosing a `DatabasePersistenceInterval`, choose the largest number of seconds you're willing to potentially lose data in the event of an Unreal game server crash. Dirty player data is **automatically saved when they disconnect from a game server**, so if your server _never_ crashed, `DatabasePersistenceInterval` could theoretically be very large, or `0` to disable the interval completely.

Redwood also saves each player's current location on every interval so they can rejoin where they left off, which means every connected player is written to the database each interval. With many players per server, consider an interval of a few seconds.
:::

You **must manually mark data as dirty** by calling one of the `URedwoodCharacterComponent::Mark<Field>Dirty()` functions (e.g. `MarkEquippedInventoryDirty()`) on the server. Changes that aren't marked dirty aren't saved, even when the player disconnects.

To force an immediate save (e.g. right before a risky operation), call `FlushPlayerCharacterData` on the `URedwoodServerGameSubsystem` with the Player States to save.

### Initial Data

Players create a `PlayerCharacter` from the main menu, before they're connected to a game server, by calling `URedwoodClientGameSubsystem::CreateCharacter` with the character's `name` and `characterCreatorData`. The [other fields](#playercharacter) are set to empty objects (with no `schemaVersion`).

However, most games want to give these other fields some initial data; for example, you may want all characters to start with `xp` and `level` fields in `metadata` set to `0` and `1`. You can't store these in `characterCreatorData` because players could exploit it, and Redwood was designed so that the backend doesn't need to understand the schema of your game data.

:::info
In most cases, [`URedwoodSyncComponent`](../../sync-items.md#persistent-items) instances are spawned by the server and their `Data` structs are initialized during spawning with the default values. The `_Creation` functions aren't called in that case.
:::

Instead, Redwood initializes the other fields the first time the `PlayerCharacter` joins any game server. The server sees that a field is empty (no `schemaVersion`), so it initializes it:
1. The default values of your struct are used (BP or C++).
1. Redwood calls the `<VariableName>_Creation` function _if it exists_. This optional function has **no inputs or outputs**, and is useful if you need extra logic when creating new characters (e.g. starting gear based on the class chosen in the character creator). You can access and modify the matching member variable inside it. Like the [migration functions](#changing-the-structures), it goes on the Actor that has the `URedwoodCharacterComponent` (or on your component subclass if `bStoreDataInActor` is `false`).
1. The field is marked dirty, so the initial values are saved.

:::note
A creation function can exist for each variable (`Metadata_Creation`, `EquippedInventory_Creation`, `NonequippedInventory_Creation`, `Data_Creation`, etc.), and each is called during that first connection.
:::

### Changing the Structures

When adding, removing, or changing variables in your structs, Redwood provides a mechanism for migrating saved data from one `SchemaVersion` to the next. The classic example is renaming a variable (e.g. `VariableA` to `VariableB`): Redwood can't know that the data saved in `VariableA` for existing players should now be in `VariableB`.

Migration functions are defined on your character class with the name `<VariableName>_Migrate_v<OldSchemaVersion>`. For example, to migrate `Metadata` from schema version 0 to 1 (you always migrate one version at a time), add a `Metadata_Migrate_v0` function.

Migration functions go on the Actor the `URedwoodCharacterComponent` or `URedwoodSyncComponent` is attached to, unless you set `bStoreDataInActor` to `false`, in which case they (like the data) go on the component.

Each migration function has 2 inputs and 1 output.

The inputs, in this order:
1. A variable of your struct type. Redwood provides the saved data deserialized into this struct (or the output of the previous migration function).
1. A `USIOJsonObject*` with the raw JSON from the database (useful for reading fields that no longer exist in the struct)

The output is your struct type (in Blueprints, a single output named `ReturnValue`), which is passed to the next migration function.

:::warning
When you change the structures for a live game that won't have a database wipe, increase the matching `Latest<VariableName>SchemaVersion` property on the component (e.g. `LatestMetadataSchemaVersion`) and the default `SchemaVersion` in the struct. This should always be an always-increasing **non-negative** integer (starting at `0`). Data saved with a schema version newer than the latest one is rejected.
:::

:::info
You don't need a migration function for every `SchemaVersion` change; if one doesn't exist, the struct's defaults are used for anything that can't be deserialized.
:::

:::caution Known issue (5.0.0)
Migration function results are copied with a shallow memory copy, which can cause crashes for structs that contain strings, arrays, or maps. Test migrations carefully before relying on them with live data.
:::
