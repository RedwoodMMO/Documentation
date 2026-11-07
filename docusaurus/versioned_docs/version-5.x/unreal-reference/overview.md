---
sidebar_position: 1
sidebar_label: Overview
---

# Unreal Plugin Reference

This section is the complete reference for the Redwood Unreal plugins: every class, component, setting, function, and data structure you're expected to use. If you're integrating Redwood for the first time, start with the [Getting Started](../getting-started/overview.md) guide, which walks through the same pieces in order; come back here when you need the exact name, type, or default of something.

Everything here describes the **5.0.0** plugins. C++ names are used throughout; Blueprint nodes have the same names with spaces (e.g. `MarkMetadataDirty` is the **Mark Metadata Dirty** node) unless noted otherwise.

## The Plugins

The plugins are distributed as **source only** (there are no prebuilt binaries), so your project must be able to compile C++. See [Installing](../getting-started/installing.md#unreal-plugins) for how to download them. Put the whole repository (including the `ThirdParty` folder) in your project's `Plugins` folder.

| Plugin | Version | Modules (type / loading phase) | Depends on | Purpose |
| --- | --- | --- | --- | --- |
| `RedwoodCore` (shown as **Redwood MMO Framework**) | 5.0.0 | `Redwood` (Runtime / PreDefault), `RedwoodEditor` (Editor / PostDefault), `RedwoodTests` (Editor / Default) | `SocketIOClient`, `GameplayMessageRouter`, `LatencyChecker` | Everything core: backend connections, auth, characters, servers, persistence, sync, social |
| `RedwoodChat` | 5.0.0 | `RedwoodChat` (Runtime / PreDefault), `RedwoodXMPP` (Runtime / PreDefault) | `RedwoodCore` | [Text chat](../features/social/text-chat.md) over XMPP |
| `RedwoodSteam` | 5.0.0 | `RedwoodSteam` (Runtime / PreDefault) | `OnlineSubsystem`, `OnlineSubsystemSteam`, `RedwoodCore` | [Steam authentication](../features/authentication/steam.md) |
| `RedwoodEOS` | 5.0.0 | `RedwoodEOS` (Runtime / PreDefault) | `OnlineSubsystem`, `OnlineSubsystemEOS`, `RedwoodCore` | [Epic Account Services authentication](../features/authentication/epic.md) |
| `RedwoodGAS` | 5.0.0 | `RedwoodGAS` (Runtime / PreDefault) | `RedwoodCore`, `GameplayAbilities` | [Gameplay Ability System persistence](../features/data/game/gas.md) |
| `ThirdParty/SocketIOClient` (Redwood fork of getnamo's plugin) | 2.7.9 | `SocketIOClient`, `SIOJson`, `SocketIOLib`, `CoreUtility` (Runtime / PreDefault), `SIOJEditorPlugin` (Editor) | none | Websocket transport and the `USIOJsonObject` JSON type |
| `ThirdParty/LatencyChecker` | 1.0 | `LatencyChecker` (Runtime / Default) | none | Region ping measurement |
| `ThirdParty/GameplayMessageRouter` (from Epic's Lyra sample) | 1.0 | `GameplayMessageRuntime` (Runtime), `GameplayMessageNodes` (UncookedOnly) | `GameplayTagsEditor` | Local, in-process message bus Redwood uses for a few events |

:::warning
Redwood needs **its fork** of SocketIOClient (it adds functions like `TryGetStringField` that Redwood uses). If your project already has the Marketplace/Fab version of SocketIOClient, or its own copy of GameplayMessageRouter (e.g. a Lyra-based project), you'll have two plugins with the same name. Keep only one copy: Redwood's SocketIOClient, and either GameplayMessageRouter (they're the same code).
:::

### Supported Engines and Platforms

- **Unreal Engine 5.4 and newer.** None of the Redwood plugins have engine-version-specific behavior you need to care about.
- **Win64, Linux, and Mac.** `RedwoodCore` depends on `LatencyChecker` (Win64, Mac, Linux, LinuxArm64) and `SocketIOClient` (Win64, Linux, Mac, Android, iOS), so the platforms they share are the ones `RedwoodCore` builds for. Dedicated servers are typically packaged for Linux.

### Build.cs Module Names

You only need to change your `Build.cs` if you reference Redwood types from C++. Blueprint-only use needs no changes (but the plugins still have to compile, so your project needs to be a C++ project).

| If you use this from C++ | Add to `PublicDependencyModuleNames` |
| --- | --- |
| RedwoodCore | `"Redwood"`. We also recommend explicitly listing the modules whose types you include directly: `"SIOJson"` (for `USIOJsonObject`), `"GameplayMessageRuntime"` and `"GameplayTags"` (to broadcast or listen to [Redwood gameplay messages](./game-framework.md#gameplay-messages)), and `"Json"`/`"JsonUtilities"` if you use `FJsonObject`/`FJsonObjectConverter`. |
| RedwoodChat | `"Redwood"`, `"RedwoodChat"`, and **`"RedwoodXMPP"`** (the public chat subsystem header includes XMPP headers, so you need it even though you won't use it directly) |
| RedwoodSteam | `"Redwood"`, `"RedwoodSteam"` (plus `"OnlineSubsystem"` if you call the online subsystem yourself) |
| RedwoodEOS | `"Redwood"`, `"RedwoodEOS"` (plus `"OnlineSubsystem"` if you call the online subsystem yourself) |
| RedwoodGAS | `"Redwood"`, `"RedwoodGAS"`, `"GameplayAbilities"`, `"GameplayTags"`, `"GameplayTasks"` |

For example:

```csharp
PublicDependencyModuleNames.AddRange(new string[] {
  "Core", "CoreUObject", "Engine", "InputCore",
  "Redwood", "SIOJson"
});
```

:::note
The Data Asset classes `URedwoodGameModeAsset`, `URedwoodMapAsset`, and `URedwoodSyncItemAsset` aren't exported from the `Redwood` module, so you can't reference them from your own C++ code (you can still create and use them in the editor and from Blueprints).
:::

## Client vs. Server

Redwood code runs in both your game clients and your dedicated servers, and it's useful to know which parts run where:

| Runs on | Class | What it does |
| --- | --- | --- |
| Clients | [`URedwoodClientGameSubsystem`](./client-subsystem.md) | Everything a player does outside of a game server: connect to the Director and Realm, log in, manage characters, join servers, social features. Exposed to Blueprints through [async nodes](./blueprint-async-nodes.md). |
| Servers | [`URedwoodServerGameSubsystem`](./game-framework.md#uredwoodservergamesubsystem) | Talks to the sidecar that runs next to each game server: receives which map/mode to load, authenticates joining players, saves data, syncs items, and transfers players between zones. |
| Both | [`URedwoodCommonGameSubsystem`](./game-framework.md#uredwoodcommongamesubsystem) | Shared helpers, most importantly `ShouldUseBackend`. |

The server-side logic is gated by **net mode**:

- `URedwoodServerGameSubsystem` only initializes when the game instance starts as a **dedicated server** or **listen server** (checked once, when the game instance initializes).
- The Redwood game mode classes only change engine behavior when the world is a dedicated or listen server. In **Standalone** they behave like the normal `AGameModeBase`/`AGameMode`.
- `URedwoodSyncComponent` only registers on **dedicated servers**.

Whether Redwood talks to the backend at all is decided by `URedwoodCommonGameSubsystem::ShouldUseBackend`: packaged builds always use the backend, and in the editor it depends on the **Use Backend in PIE** [editor setting](./settings.md#editor-preferences). When it's off, Redwood runs in [no-backend mode](./persistence-and-sync.md#no-backend-mode) and stores data in JSON files instead.

## Class Map

Every user-facing class, and where it's documented:

| Class | Kind | Where it goes | Documented in |
| --- | --- | --- | --- |
| `URedwoodSettings` | Developer settings | Project Settings > Plugins > Redwood | [Settings](./settings.md#project-settings) |
| `URedwoodEditorSettings` | Developer settings | Editor Preferences > Plugins > Redwood | [Settings](./settings.md#editor-preferences) |
| `URedwoodClientGameSubsystem` | Game instance subsystem | Clients | [Client Subsystem](./client-subsystem.md) |
| `URedwoodClientInterface` | UObject | Clients (used internally by the client subsystem) | [Client Subsystem](./client-subsystem.md) |
| `URedwoodServerGameSubsystem` | Game instance subsystem | Servers | [Game Framework](./game-framework.md#uredwoodservergamesubsystem) |
| `URedwoodCommonGameSubsystem` | Game instance subsystem | Both | [Game Framework](./game-framework.md#uredwoodcommongamesubsystem) |
| `ARedwoodGameModeBase` / `ARedwoodGameMode` | Game mode | Parent of every server game mode | [Game Framework](./game-framework.md#game-modes) |
| `URedwoodGameStateComponent` | Actor component | Your `AGameStateBase` class | [Game Framework](./game-framework.md#uredwoodgamestatecomponent) |
| `URedwoodPlayerStateComponent` | Actor component | Your `APlayerState` class | [Game Framework](./game-framework.md#uredwoodplayerstatecomponent) |
| `ARedwoodPlayerState` | Player state (deprecated) | | [Game Framework](./game-framework.md#aredwoodplayerstate-deprecated) |
| `URedwoodCharacterComponent` | Actor component | Your pawn (or player state) | [Persistence and Sync](./persistence-and-sync.md#uredwoodcharactercomponent) |
| `IRedwoodPersistenceComponentInterface` | C++ interface | Your own components | [Persistence and Sync](./persistence-and-sync.md#iredwoodpersistencecomponentinterface) |
| `URedwoodSyncComponent` | Actor component | Any synced/persisted actor, or the game state | [Persistence and Sync](./persistence-and-sync.md#uredwoodsynccomponent) |
| `URedwoodGameModeAsset` | Primary Data Asset | One per backend game profile | [Persistence and Sync](./persistence-and-sync.md#uredwoodgamemodeasset) |
| `URedwoodMapAsset` | Primary Data Asset | One per map used by a profile | [Persistence and Sync](./persistence-and-sync.md#uredwoodmapasset) |
| `URedwoodSyncItemAsset` | Primary Data Asset | One per sync item type | [Persistence and Sync](./persistence-and-sync.md#uredwoodsyncitemasset) |
| `ARedwoodZoneSpawn` | Actor | Placed in levels | [Zones and Interactables](./zones-and-interactables.md#aredwoodzonespawn) |
| `B_PortalSpline` / `B_PortalComponent` | Blueprint actors (plugin content) | Placed on zone boundaries | [Zones and Interactables](./zones-and-interactables.md#portal-content) |
| `ARedwoodInteractable`, `ARedwoodInteractableProxied`, `URedwoodInteractComponent`, `ARedwoodProxy` | Actors / component | Interactable objects and your pawn | [Zones and Interactables](./zones-and-interactables.md#interactables) |
| `ARedwoodClientExecCommand` | Actor | Spawned by `CallExecCommandOnAllClients` | [Zones and Interactables](./zones-and-interactables.md#running-console-commands-on-all-clients) |
| `URedwoodSaveGame` | Save game | Written by the client subsystem for "remember me" | [Client Subsystem](./client-subsystem.md) |
| Structs and enums (`FRedwood*`, `ERedwood*`) | Types | | [Types](./types.md) |
| `URedwoodClientChatSubsystem`, `URedwoodChatSettings` | Subsystem / settings | Clients | [Optional Plugins](./optional-plugins.md#redwoodchat) |
| `URedwoodSteamClientInterface` | Static helpers + async node | Clients | [Optional Plugins](./optional-plugins.md#redwoodsteam) |
| `URedwoodEOSClientInterface` | Static helpers + async node | Clients | [Optional Plugins](./optional-plugins.md#redwoodeos) |
| `URedwoodAbilitySystemComponent` | Ability system component | Your pawn or player state | [Optional Plugins](./optional-plugins.md#redwoodgas) |
| `USIOJsonObject`, `USIOJsonValue`, `USIOJLibrary` | JSON helpers | Anywhere | [Optional Plugins](./optional-plugins.md#socketioclient-json-helpers) |

:::info Renamed classes
If you're upgrading an older project, you may see old names in your assets. `DefaultRedwoodCore.ini` contains `[CoreRedirects]` so these load correctly: for example `RedwoodTitleInterface` is now `RedwoodClientInterface`, `RedwoodTitleGameSubsystem` is now `RedwoodClientGameSubsystem`, `RedwoodGameSubsystem` is now `RedwoodServerGameSubsystem`, `RedwoodPersistenceComponent` is now `RedwoodSyncComponent`, and `RedwoodPersistentItemAsset` is now `RedwoodSyncItemAsset`. "Server" in older function and struct names generally became "Proxy" (e.g. `CreateServer` is now `CreateProxy`).
:::
