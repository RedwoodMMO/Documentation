---
sidebar_position: 7
---

# Integrating an Existing Project

:::note
We're using C++ class names below, but you can do this in BP with the equivalent nodes.
:::

This is a thorough integration guide for the basic set of Redwood features. We don't cover everything (e.g. social features), but this should get you to a point where you can place players into servers and have data synchronized.

## Basic Setup

- Enable the `RedwoodCore` plugin (or `Redwood MMO Framework` as listed in the **Plugins** menu)
- If you're using C++, you'll need to add the `Redwood` module to your `PublicDependencyModuleNames`
- All of the server `AGameMode(Base)` classes in your game should inherit from [`ARedwoodGameModeBase`](https://github.com/RedwoodMMO/RedwoodPlugins/blob/main/RedwoodCore/Source/Redwood/Public/RedwoodGameModeBase.h) or [`ARedwoodGameMode`](https://github.com/RedwoodMMO/RedwoodPlugins/blob/main/RedwoodCore/Source/Redwood/Public/RedwoodGameMode.h) respectively.
    - NOTE: You will not use `ARedwoodGameModeComponent.h`; this is a common class we use to keep common logic
- All of the server `AGameState(Base)` classes should add [`URedwoodGameStateComponent`](https://github.com/RedwoodMMO/RedwoodPlugins/blob/main/RedwoodCore/Source/Redwood/Public/RedwoodGameStateComponent.h) as a default component
- All of the server `APlayerState` classes should attach the Actor Component [`URedwoodPlayerStateComponent`](https://github.com/RedwoodMMO/RedwoodPlugins/blob/main/RedwoodCore/Source/Redwood/Public/RedwoodPlayerStateComponent.h)

## Player Character Data

:::info
We chose the `APawn` class as the ideal place to have character data since network relevancy for open world games is tied closely to character proximity. If you need character data to transfer between one possessed pawn to another, reach out!
:::

If you're using Redwood's [semi-automated synced player data for the character](https://redwoodmmo.com/docs/features/data/game/player-data) (recommended), all of the server `APawn` classes should add [`URedwoodCharacterComponent`](https://github.com/RedwoodMMO/RedwoodPlugins/blob/main/RedwoodCore/Source/Redwood/Public/RedwoodCharacterComponent.h) as a default component (yes, this works for any `APawn` or child class, including and `ACharacter`)

By default, this component expects your `APawn` class to have `UPROPERTY` (ignore this if you're using BP) variables, whose types can be arbitrary `USTRUCT` (ignore this if you're using BP) structs:
    - `CharacterCreatorData`
    - `Metadata`
    - `EquippedInventory`
    - `NonequippedInventory`
    - `Progress`
    - `Data`

These variables replicated by default, you will need to configure that yourself. See the [docs](https://redwoodmmo.com/docs/features/data/game/player-data#playercharacter) about our recommended replication settings for each.

You may disable these by setting `URedwoodCharacterComponent::bUse<default-variable-name>` (e.g. `bUseCharacterCreatorData`) to `false`.

You may change the name of your class variable by changing `URedwoodCharacterComponent::<default-variable-name>VariableName` (e.g. `CharacterCreatorDataVariableName`).

The struct definition for each type must be serializable; any non-serializable fields (e.g. pointers/"object references") will be ignored by persistence.

Every time you want Redwood to save modified values of the above variables to the database, you'll need to call `URedwoodCharacterComponent::Mark<default-variable-name>Dirty` (e.g. `MarkCharacterCreatorDataDirty`). Redwood doesn't automatically detect changes. Redwood also batches these saves and doesn't immediately save the value; the batched save call happens `every 0.5 seconds` by default. You can change this value by setting `ARedwoodGameMode(Base)::DatabasePersistenceInterval` to the number of seconds to wait per batched call (under your `Class Defaults` for your respective Game Mode class in BP if you inherited from the Redwood class). See extra notes about the interval [here](https://redwoodmmo.com/docs/features/data/game/player-data#saving).

## Persistent Data and Cross-server Synchronization for any Actor

If you have any non-Pawn actors that need persistence using Redwood's [semi-automated synced data aka Sync Item](https://redwoodmmo.com/docs/features/sync-items) (recommended).

- Similar to the `URedwoodCharacterComponent` above, you'll add the [`URedwoodSyncComponent](https://github.com/RedwoodMMO/RedwoodPlugins/blob/main/RedwoodCore/Source/Redwood/Public/RedwoodSyncComponent.h) as a default component to all the actors that need this features
- Instead of all the fields like in `URedwoodCharacterComponent` above, you only need to define a variable for the variable:
    - `Data`
- You may disable it with `URedwoodSyncComponent::bUseData` (though I'm not sure why you would) or change the expected name with `URedwoodSyncComponent::DataVariableName`
- You need to set `URedwoodSyncComponent::bPersistChanges` to `true` to have the data persisted to the database for each instance of this actor (we coin these specific Sync Items as Persistent Items in the docs). The default value is `false` which is used to sync the data across shards/zones as configured at runtime, but not to consider it as a persisted (aka save to the database) instance
- Similarly, you'll need to call `URedwoodSyncComponent::MarkDataDirty` to persist the changes to `Data`; this happens at the same ``ARedwoodGameMode(Base)::DatabasePersistenceInterval` setting described above for the `URedwoodCharacterComponent`
- You can instantiate Persistent Items at design-time (aka placing them in the Level Editor) or at run-time (aka spawning the actor from the server). If you're doing it at design-time, you'll need to manually set `URedwoodSyncComponent::RedwoodId` and `URedwoodSyncComponent::ZoneName` for each instance to ensure things are persisted properly. You can read more about this [here](https://redwoodmmo.com/docs/features/sync-items#design-time-persistent-items) or see an example in the **RPG Template** as the single fence near the village spawn point is a design-time Persistent Item (aka it reloads its last position from the database if the servers get rebooted)
- For every Sync Item type (regardless if it's persisted), you need to create a new Data Asset that inherits from `URedwoodSyncItemAsset`
    - Set **Redwood Type Id** to a unique value (e.g. `community-chest` or `house-small` or `mob-boars`)
    - Set **Actor Class** to the class that you added the `URedwoodSyncComponent` to
    - You don't need to reference this Data Asset anywhere else; Redwood handles the rest (other than the Asset Manager section below)

## Blob Storage

The alternative persistence method to the above recommended methods is [Blob & Document Storage](https://redwoodmmo.com/docs/features/data/storage/blob-storage). This feature was originally added to support large documents/pictures, but you can use it to save arbitrary files (e.g. CSV, JSON, SaveGame). You'll have to manually call the load/save functions and deal with the serialization, but definitely an option.

## World Data

In your `AGameState(Base)`class, add `URedwoodSyncComponent` as a default component to enable [world data](https://redwoodmmo.com/docs/features/data/game/world-data)
- This data is synchronized across all zones/shards in the [proxy](https://redwoodmmo.com/docs/architecture/game-servers#gameserverproxy)
- Set `URedwoodSyncComponent::bPersistChanges` to `true`
- Set `RedwoodId` to `proxy`
- Add a class variable to your `AGameState(Base)` class with the name `Data` of type `USTRUCT` (following the other notes above about `URedwoodSyncComponent`)
- Create a Data Asset that inherits from `URedwoodSyncItemAsset`
    - Set **Redwood Type Id** to `proxy`
    - Set the **Actor Class** to your `AGameState(Base)` class

In **Project Settings > Game > Asset Manager** you will need to add three elements to the `Primary Asset Types to Scan`:
- Game modes
    - **Primary Asset Type**: `RedwoodGameModeAsset`
    - **Asset Base Class**: `RedwoodGameModeAsset` (or `URedwoodGameModeAsset` if you're configuring this directly in the INI file)
    - **Has Blueprint Classes**: `false`
    - **Is Editor Only**: `false`
    - **Rules > Cook Rule**: `Always Cook`
    - Set **Directories** and **Specific Assets** as you see fit; I generally have mine all under some common root folder and add that to **Directories**
- Game maps
    - **Primary Asset Type**: `RedwoodMapAsset`
    - **Asset Base Class**: `RedwoodMapAsset` (or `URedwoodMapAsset` if you're configuring this directly in the INI file)
    - **Has Blueprint Classes**: `false`
    - **Is Editor Only**: `false`
    - **Rules > Cook Rule**: `Always Cook`
    - Set **Directories** and **Specific Assets** as you see fit; I generally have mine all under some common root folder and add that to **Directories**
- Sync items
    - **Primary Asset Type**: `RedwoodSyncItemAsset`
    - **Asset Base Class**: `RedwoodSyncItemAsset` (or `URedwoodSyncItemAsset` if you're configuring this directly in the INI file)
    - **Has Blueprint Classes**: `false`
    - **Is Editor Only**: `false`
    - **Rules > Cook Rule**: `Always Cook`
    - Set **Directories** and **Specific Assets** as you see fit; I generally have mine all under some common root folder and add that to **Directories**

## Backend Config

For every server game mode and map that the Redwood system will know about in the [game profiles](https://redwoodmmo.com/docs/configuration/game-modes-and-maps#profiles), you'll need to create a Data Asset inheriting from `URedwoodGameModeAsset` and `URedwoodMapAsset` respectively
- For `URedwoodGameModeAsset`:
    - **Redwood Id** should be set to some unique identifier that will be used in the game profile `id` field (e.g. `instanced-dungeon` or `elimination`)
    - **Show in Front End** isn't used by Redwood itself, but it's a convenience flag for you to filter what's displayed to users in a title menu/front end screen (e.g. when selecting a mode for a private server)
    - **Display Name**, **Display Description**, and **Display Icon** are all other convenience fields for you but not used by Redwood; they can be left blank
    - **Game Mode Type** should be set to `Game Mode Base` or `Game Mode` depending on which type of parent class for the respective game mode class
    - **Game Mode [Base] Class** will show in the Data Asset editor based on **Game Mode Type** allowing you to select the corresponding game mode class
- For `URedwoodMapAsset`:
    - **Redwood Id** should be set to some unique identifier that will be used in the game profile's zone's `maps` field (e.g. `mine-shaft` or `red-blue-map`)
    - **Map Name** is a convenience field for you to display to the user as you see fit and is not used by Redwood
    - **Map Id** should point to the Unreal map/level asset

- You will need to configure your [Realm Instance Config](https://redwoodmmo.com/docs/configuration/realm-instance-config) and [game profiles](https://redwoodmmo.com/docs/configuration/game-modes-and-maps#profiles) in the backend's config env for your project. You can see examples for our template projects [here](https://redwoodmmo.com/docs/getting-started/installing#initial-configuration).

## Main Menu / Game Frontend

The title screen/main menu/game frontend will have several Redwood integration points. There's a decent example in the **RPG Template** at `Content/UI/W_MainMenu`, but here's the general flow:

1. C++ users should not use `URedwoodClientInterface` directly, use `URedwoodClientGameSubsystem` as it provides extra wrappers for backend-less scenarios
1. C++ users will need to reference [`RedwoodPlugins/RedwoodCore/Source/Redwood/Public/RedwoodClientGameSubsystem.h`](https://github.com/RedwoodMMO/RedwoodPlugins/blob/main/RedwoodCore/Source/Redwood/Public/RedwoodClientGameSubsystem.h) and the various C++ struct types found in [`RedwoodPlugins/RedwoodCore/Source/Redwood/Public/Types/](https://github.com/RedwoodMMO/RedwoodPlugins/tree/main/RedwoodCore/Source/Redwood/Public/Types) as we'll not provide complete function & struct signatures in these instructions. We also don't have a reference docs site; "the code is the documentation", sorry!
1. Check if the player is logged in `URedwoodClientGameSubsystem::IsLoggedIn()` and/or is connected to a [realm](https://redwoodmmo.com/docs/architecture/overview#realms) to determine what logic skip for players returning to the main menu. We will continue along as if these both were returned `false`
1. Call `URedwoodClientGameSubsystem::InitializeDirectorConnection`
1. On success, show login/register widgets
1. On player login, call `URedwoodClientGameSubsystem::Login`; on player register call `URedwoodClientGameSubsystem::Register`
    - If you're using Steam to authenticate, see the [docs](https://redwoodmmo.com/docs/features/authentication/steam)
1. Both login and register functions will call the passed in delegate (or `On Update` exec pin for BP) with a `FRedwoodAuthUpdate` struct multiple times based on the authentication flow. The `FRedwoodAuthUpdate::Type` is a `ERedwoodAuthUpdateType` enum with options for `Success`, `MustVerifyAccount` (if you [enable email verification](https://redwoodmmo.com/docs/features/authentication/local#configuration)), `Error`, or `Unknown`, with an accompanying `FRedwoodAuthUpdate::Message` (which is blank on `Success`)
1. Once logged in, you'll want to call `URedwoodClientGameSubsystem::ListRealms` which returns an array of `FRedwoodRealm` structs (by default, there will only be 1); these can be either shown to the user to select or you can auto select
1. Once a realm is picked, call `URedwoodClientGameSubsystem::InitiateRealmConnection` with the corresponding `FRedwoodRealm` struct. You can only be connected to 1 realm at a time
1. You can list the player's characters in the connected realm with `URedwoodClientGameSubsystem::ListCharacters`
1. Players can create characters in connected realm by calling `URedwoodClientGameSubsystem::CreateCharacter` with a `Name` for the character a `USIOJsonObject*` object reference for the `CharacterCreatorData` field
    - `USIOJsonObject` comes from the a [forked version of the third-party `SocketIOClient` plugin](https://github.com/RedwoodMMO/SocketIOClient-Unreal/) which is included in the `RedwoodPlugins`. It is a BP-friendly wrapper around the Unreal built-in `FJsonObject` class. We're aware UE now has some BP support for JSON objects but older versions did not.
    - To create this object, you can pass your `CharacterCreatorData` struct variable into the `Struct to Json Object` function in BP or call the static function [`USIOJLibrary::StructToJsonObject`](https://github.com/RedwoodMMO/SocketIOClient-Unreal/blob/redwood/Source/SIOJson/Public/SIOJLibrary.h#L119) in C++
    - **Note:** Malicious users can reverse engineer this network method and set whatever data they want for `CharacterCreatorData`, which is why you should not put important fields like Level/XP/Unlocks in this struct
1. Players can update the character data (`Name` and `CharacterCreatorData`) by calling `URedwoodClientGameSubsystem::SetCharacterData` with the character's ID returned in the struct from `ListCharacters` or `CreateCharacter`
    - In the future, we'll provide a flag that allows you to disable this function in the backend in case you want players to only update their characters from replicated server functionality
1. You can call `URedwoodClientGameSubsystem::GetCharacter` if you know the Redwood ID for the character
1. When the player has selected a character to join a server with, call `URedwoodClientGameSubsystem::SetSelectedCharacter` with the character's ID returned in the struct from `ListCharacters` or `CreateCharacter`
1. Players can join a server 4 different ways. We're using the term "Server" below loosely (I know, bad terminology, but this seemed like the best dev experience), but these actually are [GameServerProxies](https://redwoodmmo.com/docs/architecture/game-servers#gameserverproxy) which _can_ have an active [GameServerCollection](https://redwoodmmo.com/docs/architecture/game-servers#gameservercollection) which consist of one or more [GameServerInstances](https://redwoodmmo.com/docs/architecture/game-servers#gameserverinstance)
    - Creating a GameServerProxy
        - There is an example of this in the **Match Template** with Lyra's Create Lobby logic; the **RPG Template** doesn't have an example of this flow
        - Calling `URedwoodClientGameSubsystem::CreateProxy` and setting the first argument `bJoinSession` to `true` will automatically join the proxy after it's created
        - If you leave `bJoinSession` to `false`, you can call `URedwoodClientGameSubsystem::JoinQueue` with the `ProxyReference` field in the returned struct
    - Joining a GameServerProxy
        - You can find available proxies with `URedwoodClientGameSubsystem::ListProxies`
        - Join the proxy by calling `URedwoodClientGameSubsystem::JoinQueue`
    - Matchmaking
        - Call `URedwoodClientGameSubsystem::JoinMatchmaking` where the `ProfileId` is the matching [game profiles `id`](https://redwoodmmo.com/docs/configuration/game-modes-and-maps#profiles) and `Regions` is an array of the regions the player would like to be assessed for (ping times are automatically assessed and sent to the matchmaker). You can get the available regions with `URedwoodClientGameSubsystem::GetRegions` which returns a `TMap<FString, float>`; the keys of this map are what is passed to `JoinMatchmaking`.
    - Both `JoinQueue` and `JoinMatchmaking` will have a similar flow to the `Login` function where the backend will call the delegate when there's an `JoinResponse`, `Update`, `TicketError`, or `Unknown` value on the supplied `FRedwoodTicketingUpdate::Type` and accompanying `Message` field
1. The Redwood plugin is told by the backend to join a server when any of the above succeed and it automatically runs the `open <ip-address>:<port>?<args>` command, including an automatic authentication handshake via an ephemeral token so the receiving game server can verify the joining player is meant to be there.

## Miscellaneous

- When the player joins a server with a valid auth token (handled for you automatically), the associated character data is automatically fetched from the backend. The `URedwoodPlayerStateComponent` Actor Component that should be attached to your `APlayerState` class has a BP-bindable delegate `OnRedwoodCharacterUpdated` which is triggered on the server only whenever the character data is updated from the backend (currently just on connection)
- The `URedwoodCharacterComponent` automatically listens for the associated `URedwoodPlayerStateComponent::OnRedwoodCharacterUpdated` on the server and sets your struct data automatically. `URedwoodCharacterComponent` then calls `URedwoodCharacterComponent::OnRedwoodCharacterUpdated` on the server. In Redwood version `4.0+`, this event will triggered on clients as well via a multicast message. In the meantime, clients can get notified of it change by using a Rep Notify of the various data structs.
- You don't need to use the set of classes we provided for interactables, but they contain some of our own best practices to prevent too much coupling due to putting RPCs in other places automatically. See the [docs](https://redwoodmmo.com/docs/features/interactables) for details.
- Don't forget to [install the prerequisites](https://redwoodmmo.com/docs/getting-started/prerequisites) and do the [setup](https://redwoodmmo.com/docs/getting-started/installing#setup)
