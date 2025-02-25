---
sidebar_position: 1
---

# Player Data

## Database Storage

Understanding how the database stores the data will help you to know what data should be stored in which object. Once you have a general understanding, the Redwood Unreal plugin abstracts a lot of the process away from you.

### PlayerIdentity

Each player has 1 `PlayerIdentity` entry stored in the [Director](../architecture/overview.md#director) database. This is the first entry point usually via [authentication](../providers/authentication/overview.md). There's no game data stored for the player here.

### PlayerCharacter

Each player can have 1 or more `PlayerCharacter` entries stored in any of the [Realm](../architecture/overview.md#realms) databases. The `PlayerCharacter` can only be used for games that are running in the corresponding Realm.

Each `PlayerCharacter` has a `name` associated with it to be displayed in game. Redwood will automatically call `APlayerState::SetPlayerName()` using this name.

Each `PlayerCharacter` has the following JSON fields stored for it in the database. Note that Redwood doesn't fill the data for any of these (except `redwoodData`); it's up to you to define the structure of these objects. See how to do this [in Unreal](#unreal-setup).

#### `characterCreatorData`

This stores any data from your character creator. The player can change this JSON object directly with client API calls with the Realm Frontend, so you should not use it for any data that needs an authoritative check (i.e. level, experience, gear).

This is typically replicated to all players (so they know how to visualize the player's character).

#### `metadata`

This stores any metadata for the character managed by the server (e.g. level, health, equipped gear). Any data that isn't inventory that all players should know about should get stored in here.

This is typically replicated to all players (so they know how to visualize the player's character for gear or to show a health bar in the nameplate).

#### `equippedInventory`

This stores any of the inventory that the character **is carrying**. For example, if your game dropped all the inventory on death, it would use this object. It's up to you if you want visually equipped gear to be in both `equippedInventory` and `metadata` or only `metadata`.

This is typically **not** replicated to other players. If you replicate this to other players, they could create a mod that shows the inventory for each of the players they see.

#### `nonequippedInventory`

This stores any of the inventory that the character **is not carrying**. The primary concept of this object would be what the character has in the "bank". Localized/specific storage containers (i.e. chests) however would likely have their own inventory and access permissions, not stored in this variable.

This is typically **not** replicated to other players. If you replicate this to other players, they could create a mod that shows the inventory for each of the players they see.


#### `data`

This stores any other game data for the character that shouldn't be replicated to other players. This could be quest data, bookmarked locations, character-specific settings, etc.

This is typically **not** replicated to other players.

#### `redwoodData`

This stores data used by the Redwood system for other features (e.g. [zone transferring](./zones.md)). Altering this object can cause other systems to break.

## Unreal Setup

We recommend checking out the `B_Character` Blueprint class in the **RPG Template** as an example of how this is set up, but here are the steps to integrate the player character data into Unreal:

1. Create a Game Mode Base or Game Mode class that inherits from `ARedwoodGameModeBase` or `ARedwoodGameMode` respectively
1. Change your PlayerStateClass in the game mode class to `ARedwoodPlayerState` (or another class that inherits from `ARedwoodPlayerState`)
1. Your DefaultPawnClass in the game mode class needs to have an instance of the `URedwoodCharacterComponent` Actor Component attached during begin play
1. Create a new struct for [each of types](#playercharacter) of data (**except** `redwoodData`)
    - BP Structs are fine
    - C++ structs are also fine as long as they are defined with `USTRUCT` and `UPROPERTY` for each field you want to persist
    - **NOTE:** Each struct **must** have a property of type `Integer` or `int32` with the name `SchemaVersion`
    - You can have use the same struct for multiple variables if you want (e.g. using the same struct type for both `equippedInventory` and `nonequippedInventory`)
1. In the DefaultPawnClass that has the `URedwoodCharacterComponent` component, create a variable for [each of the types](#playercharacter) of data (**except** `redwoodData`) with the corresponding struct type
    - The name of the variable must be `CharacterCreatorData`, `Metadata`, `EquippedInventory`, `NonequippedInventory` , and `Data` respectively.
        :::info
        You can customize what these names are by changing them in the `Class Defaults`/C++ constructor (e.g. see `CharacterCreatorDataVariableName`)
        :::
    - Optionally you can create a child class of `URedwoodCharacterComponent` that disables the boolean `bStoreDataInActor` and store these variables in the Actor Component instead of the Pawn Actor.
1. **DON'T FORGET:** You must enable replication for each of the variables. Redwood doesn't do this automatically for you.
    :::warning
    We **highly recommend** that you set `EquippedInventory`, `NonequippedInventory`, and `Data` to have the **Replication Condition** `Owner Only` (or set `bOnlyRelevantToOwner = true` in C++). These fields were designed to be separate from the others so you can partition what can be seen by other players.
    :::

## Data Persistence

### Loading

If you followed all of the [steps](#unreal-setup), the Redwood plugin **automatically syncs the database fields to your Unreal Character class**. If you're not seeing something, make sure that you have replication enabled on your variables so the client gets it. You may also need to setup replication notify methods. You can checkout the **RPG Template** for a good example.

### Saving

Instead of saving data to the database every time it changes in Unreal, the Redwood plugin will periodically check to see if any of the data has been marked as dirty and should be saved. By default this happens at 2Hz or every 0.5 seconds, but it can be customized by changing the `DatabasePersistenceInterval` variable in your game mode class in the Class Defaults/C++ constructor. Making this interval longer will increase your network bandwidth between the Unreal server to the sidecar (which sends it to the Realm Backend, which finally saves it to the database).

:::note
When choosing a `DatabasePersistenceInterval`, choose the largest number of seconds you're willing to potentially lose data in the event of an Unreal game server crash. Player data is **automatically synced when they disconnect from an Unreal game server regardless if it's marked dirty**, so if your server *never* crashes theoretically `DatabasePersistenceInterval` could be a very large number or `0` to disable the interval complete.
:::

Currently you **must manually mark data as dirty** by calling one of the `URedwoodCharacterComponent::Mark<DataType>Dirty()` functions (e.g. `MarkEquippedInventoryDirty()`), which can be called in Blueprints or C++.

### Changing the Structures

When adding, removing, removing, or changing variables, Redwood provides a mechanism for you to add migration functions to upgrade structs from one `SchemaVersion` to the next. The best example for this is if you rename a variable (e.g. `VariableA` => `VariableB`). Redwood can't automatically know that the data in `VariableA` stored in the database for existing players should be renamed to `VariableB`.

Migration functions can be defined your character class with the name `<VariableName>_Migrate_v<OldSchemaVersion>`. For example, if you're migrating `Metadata` from schema version 0 to 1 (you always only migrate 1 version at a time), you would need to add a `Metadata_Migrate_v0` function.

Each migration function should have 2 input variables and 1 output variable.

The input variables must be in this order:
1. A variable of the type of the struct you're migrating; it's okay if that it resembles the new schema version. Redwood will provide this as the attempted deserialization for that schema version (or as the output of a previous migration function).
1. A variable of type `USIOJsonObject*` which contains the raw JSON from the database

The output variable should be of type of the struct you're migrating. This output variable will be used as an input for following migration functions.

:::warning
When you're changing the structures for a live game that won't have a database wipe, you need to change the associated `Latest<VariableName>SchemaVersion` variable in your character class via the Class Defaults/C++ constructor. This should always be an always-increasing integer.
:::

:::info
It's not required to define a migration function for every `SchemaVersion` change; migration will be assumed handled by the variable defaults.
:::