---
sidebar_position: 6
---

# Game Framework

These are the server-side classes that hook Redwood into Unreal's game framework: the game modes, the server subsystem, and the game state and player state components. For step-by-step setup, see [Setting Up Unreal](../getting-started/setting-up-unreal.md).

## Game Modes

Every game mode the backend can load **must** inherit from one of these:

| Class | Parent | Use when your game mode would otherwise inherit from |
| --- | --- | --- |
| `ARedwoodGameModeBase` | `AGameModeBase` | `AGameModeBase` |
| `ARedwoodGameMode` | `AGameMode` | `AGameMode` (match states: waiting to start, in progress, ended) |

Both have identical Redwood behavior. Both are `Blueprintable`, so create a Blueprint child (or C++ subclass) and use it like any other game mode.

### Properties

| Property | Type | Default | Meaning |
| --- | --- | --- | --- |
| `DatabasePersistenceInterval` | `float` | `0.5` | Seconds between batched saves of character data, world data, zone data, and persistent items. `0` or less disables periodic saves (data is still saved when a player leaves). Read once in `InitGame`; changing it at runtime has no effect. See [Saving](./persistence-and-sync.md#saving). |
| `PostBeginPlayDelay` | `float` | `0.2` | Seconds between retries, after `BeginPlay`, while waiting for the server subsystem before running the initial data load. You shouldn't need to change this. |

Both are `EditAnywhere` and `BlueprintReadOnly`, so set them in **Class Defaults** (or your C++ constructor).

### What Redwood Changes

Redwood only changes behavior when the world is running as a **dedicated or listen server**. In Standalone, these classes behave exactly like their engine parents.

| Function | Redwood behavior |
| --- | --- |
| `InitGame` | Calls `Super`, then opens a connection to the sidecar for player authentication (when using the backend). |
| `Login` | Calls `Super`, then [authenticates the player](#player-authentication). Players that fail are kicked. In [no-backend mode](./persistence-and-sync.md#no-backend-mode), assigns a character from disk instead. |
| `PostLogin` | Calls `Super`, then records that post-login ran. |
| `PlayerCanRestart` | Returns `false` until the player's authentication and character load finished, so pawns don't spawn before their data is ready. Then defers to `Super`. |
| `SpawnDefaultPawnAtTransform` | Replaces the spawn transform using [spawn selection](#spawn-selection), then calls `Super`. |
| `FinishRestartPlayer` | Replaces the engine version: possesses the pawn, restores the saved control rotation (if any), calls `SetPlayerDefaults`, and fires the **On Restart Player** event. |
| Logout | When a player leaves, Redwood force-saves their character data, tells the sidecar they left, and broadcasts the [`Redwood.Player.Left`](#gameplay-messages) message. |

You still override all the normal game mode events (e.g. **Event Handle Starting New Player**, **On Post Login**) in your own class. Redwood doesn't add any new events to override.

:::note
When the backend loads a map, it adds `?game=<your game mode class>` to the URL, so the game mode always comes from the [`URedwoodGameModeAsset`](./persistence-and-sync.md#uredwoodgamemodeasset), not from World Settings or the global default.
:::

### Spawn Selection

When a pawn spawns on a server, Redwood picks its transform in this order:

1. If the character has a saved last location **in the current zone**, use it. This is either a saved transform, or a saved spawn name (set by [`TravelPlayerToZoneSpawnName`](./zones-and-interactables.md#zone-transfers)) that maps to an [`ARedwoodZoneSpawn`](./zones-and-interactables.md#aredwoodzonespawn).
2. Otherwise, the `ARedwoodZoneSpawn` in the current zone whose `SpawnName` is `default`.
3. Otherwise, the first `ARedwoodZoneSpawn` in the current zone (with an editor notification).
4. Otherwise, the engine's normal choice (PlayerStart).

The current zone is `URedwoodServerGameSubsystem::ZoneName`. In PIE without the backend it's empty, unless you set the [Fallback Zone Name](./settings.md#editor-preferences) editor setting.

### Can't Inherit from the Redwood Game Modes?

All of Redwood's game mode logic lives in an internal `URedwoodGameModeComponent`, but that component can't be added from Blueprints, and `URedwoodGameModeAsset` only accepts subclasses of `ARedwoodGameModeBase` or `ARedwoodGameMode`. So the answer is to **change the parent class**:

- **Blueprint game modes:** open the Blueprint, choose **File > Reparent Blueprint**, and pick `RedwoodGameModeBase` or `RedwoodGameMode`.
- **C++ game modes:** change the base class (e.g. `class AMyGameMode : public ARedwoodGameModeBase`).
- **Game modes from another framework or plugin** (e.g. Lyra's `AModularGameModeBase`): change that framework's base class to inherit from the Redwood class. For Lyra, that means editing the `ModularGameplayActors` plugin so `AModularGameModeBase` inherits from `ARedwoodGameModeBase` and `AModularGameMode` from `ARedwoodGameMode`.

:::tip
Frameworks that try to pick a map or experience on their own when a dedicated server starts (Lyra's `ALyraGameMode::TryDedicatedServerLogin` is one example) need to be told to wait: a Redwood server should idle on its **Server Default Map** until the backend tells it what to load. Pass anything the framework needs (like an experience name) through the game profile's [`data`](../configuration/game-modes-and-maps.md#profiles), which arrives as URL options.
:::

## Player Authentication

Players can't just connect to a Redwood game server; they need a one-time token that the backend issues when it assigns them to that server. The client subsystem adds it to the join URL for you (see [Client join URL options](./settings.md#client-join-url-options)).

On the server, in `Login`:

1. Redwood reads `RedwoodAuth`, `PlayerId`, `CharacterId`, and `Token` from the URL options. If they're missing, the player is rejected with "Invalid authentication request: missing RedwoodAuth option".
2. It asks the sidecar to verify the token with the Realm. Tokens are single use.
3. On success, it fills `URedwoodPlayerStateComponent::RedwoodPlayer` and `RedwoodCharacter`, sets the player state's unique net id to `<PlayerId>:<CharacterId>`, marks the player as ready, and starts the player (spawning the pawn).
4. On failure, the player is kicked with the error message.

If the player state has no `URedwoodPlayerStateComponent`, the player stays connected but no character data is loaded.

:::info PIE with the backend
In PIE, clients don't go through the backend's join flow, so they have no token. When the backend is in use from PIE, Redwood sends development credentials instead (`development_<N>`, where `N` is the player's join index). The Realm only accepts these when the realm uses the `dev-debug` [game server provider](../features/game-servers/hosting/overview.md) and `environment.development` is `true`; it then assigns the N-th character in the realm (ordered by name). Most of the time it's simpler to use [no-backend mode](./persistence-and-sync.md#no-backend-mode) in PIE, or the Dev Initiator with Standalone clients.
:::

## `URedwoodServerGameSubsystem`

A `UGameInstanceSubsystem` that does the server's half of the work. It only initializes on dedicated or listen servers (checked when the game instance starts; a standalone game that later runs `open map?listen` doesn't get it).

### Startup Sequence

1. The server process starts on your **Server Default Map**.
2. The subsystem loads every `URedwoodGameModeAsset`, `URedwoodMapAsset`, and `URedwoodSyncItemAsset` through the Asset Manager. If the game mode or map asset types aren't registered with the Asset Manager, it logs an error and stops here.
3. If `bServersAutoConnectToSidecar` is on and the backend is in use, it connects to the sidecar at `ws://127.0.0.1:<SidecarPort>` and starts reporting its state.
4. Once the sidecar sees the server is up, it sends the details of what to run: proxy, zone, shard, map, mode, and so on. The subsystem stores them (see below) and runs `open <map>?game=<mode>?...` (see [Map URL options](./settings.md#map-url-options-set-by-the-server)).
5. On the new map, the game mode loads the zone's world data, zone data, and persistent items, then starts the periodic save and sync loops.
6. The server reports `WaitingForPlayers` or `Started`, and the backend starts sending players.

The state reported to the backend is `Started` for `ARedwoodGameModeBase` subclasses. For `ARedwoodGameMode` subclasses it follows the match state: `WaitingForPlayers` before the match starts, `Started` while in progress, and `Ended` after `HasMatchEnded()`.

### Properties

All are `BlueprintReadOnly` (category **Redwood**) and filled in when the backend tells the server what to load. They're empty on the Server Default Map and in no-backend mode.

| Property | Type | Meaning |
| --- | --- | --- |
| `RealmName` | `FString` | Name of the realm |
| `ProxyId` | `FString` | ID of the [GameServerProxy](../architecture/game-servers.md#gameserverproxy) (the lobby/world) |
| `InstanceId` | `FString` | ID of this [GameServerInstance](../architecture/game-servers.md#gameserverinstance) |
| `Name` | `FString` | Name of the proxy |
| `MapId` | `FString` | `RedwoodId` of the loaded `URedwoodMapAsset` |
| `ModeId` | `FString` | `RedwoodId` of the loaded `URedwoodGameModeAsset` (the game profile `id`) |
| `ZoneName` | `FString` | The [zone](../features/game-servers/zones.md) this server runs |
| `ShardName` | `FString` | The [shard](../features/game-servers/sharding.md) name, from the `game.shard-names` config (`Alpha`, `Bravo`, ...) |
| `Channel` | `FString` | `<ZoneName>:<ShardName>` |
| `bContinuousPlay` | `bool` | Whether the proxy uses continuous play |
| `Password` | `FString` | Proxy password, if any |
| `ShortCode` | `FString` | Proxy short code, if any |
| `MaxPlayers` | `int32` | Max players per shard |
| `OwnerPlayerId` | `FString` | Player who created the proxy, if any |
| `ParentProxyId` | `FString` | Parent proxy (e.g. the overworld an instanced dungeon returns to), if any |
| `RequestId` | `FString` | Internal load request id |
| `SidecarUri` | `FString` | The sidecar address it connected to |

Clients don't have this subsystem; use [`URedwoodGameStateComponent`](#uredwoodgamestatecomponent) to get the realm, proxy, instance, zone, and shard on clients.

### Functions

All `BlueprintCallable`, category **Redwood**, server only.

| Function | Meaning |
| --- | --- |
| `TravelPlayerToZoneTransform(PlayerController, InZoneName, InTransform, OptionalProxyId = "", bShouldStitch = false)` | Move a player to another zone (or another proxy) at a transform. See [Zone Transfers](./zones-and-interactables.md#zone-transfers). |
| `TravelPlayerToZoneSpawnName(PlayerController, InZoneName, InSpawnName = "default", OptionalProxyId = "")` | Move a player to another zone at a named [`ARedwoodZoneSpawn`](./zones-and-interactables.md#aredwoodzonespawn). |
| `FlushPlayerCharacterData(PlayerArray, bForce)` | Immediately save the character data of the given player states instead of waiting for the next interval. |
| `CallExecCommandOnAllClients(Command)` | Run a console command on every client. See [Running Console Commands on All Clients](./zones-and-interactables.md#running-console-commands-on-all-clients). |
| `RequestEngineExit(bForce)` | Shut down the server process. The sidecar notices and cleans up. |

Server-side blob storage is available through the **Put Blob**, **Get Blob**, **Put SaveGame**, and **Get SaveGame** async nodes, which take this subsystem as their target. See [Blob Storage](../features/data/storage/blob-storage.md).

:::caution Known issue (5.0.0)
The blob and SaveGame functions crash when called without the backend (for example in PIE with Use Backend in PIE off). Check `ShouldUseBackend` first.
:::

### Shutting Down Intentionally

If your server decides to end itself (e.g. after a match), broadcast the [`Redwood.Shutdown.Instance`](#gameplay-messages) gameplay message first so the backend sees the server as `Stopping` rather than crashed, then call `RequestEngineExit`. Redwood doesn't broadcast this message itself.

## `URedwoodCommonGameSubsystem`

Shared by clients and servers. The only Blueprint-exposed member is:

| Function | Meaning |
| --- | --- |
| `ShouldUseBackend(World)` (BlueprintPure, static) | `true` in packaged builds and for any non-PIE world. In PIE, returns the [Use Backend in PIE](./settings.md#editor-preferences) setting. Use this to skip backend-only calls (like blob storage) when running without the backend. |

The rest of its functions are C++ helpers that Redwood uses internally (JSON parsing, saving characters to disk in no-backend mode, and the struct serialization that the [character and sync components](./persistence-and-sync.md) use).

## `URedwoodGameStateComponent`

Add this to your **game state** class (any `AGameStateBase`). It replicates the server's details so clients know where they are.

| Member | Type | Meaning |
| --- | --- | --- |
| `GetServerDetails()` | `FRedwoodServerDetails` (BlueprintPure) | The realm name, proxy id, instance id, zone name, and shard name of the server. |
| `OnServerDetailsChanged` | Event (no parameters, BlueprintAssignable) | Fires on clients when the replicated details arrive. It doesn't fire on the server. |

`FRedwoodServerDetails` has `RealmName`, `ProxyId`, `InstanceId`, `ZoneName`, and `ShardName` (all `FString`). The values are captured once in `BeginPlay`. This is the easiest way for clients to show which shard they're on, or to get the ids for [text chat rooms](../features/social/text-chat.md).

## `URedwoodPlayerStateComponent`

Add this to your **player state** class. It's required for authentication-gated spawning, character data, spawn locations, and zone transfers.

| Member | Type | Default | Meaning |
| --- | --- | --- | --- |
| `RedwoodPlayer` | `FRedwoodPlayerData` | | The player's identity data (id, nickname, selected guild, player data). **Server only**, not replicated. |
| `RedwoodCharacter` | `FRedwoodCharacterBackend` | | The character's full backend data as raw `USIOJsonObject` fields. **Server only**, not replicated. |
| `bFollowPawn` | `bool` | `false` | Every tick, move the player state actor to its pawn's location and rotation. Useful when player states need spatial relevancy (e.g. World Partition or distance-based relevancy). |
| `bServerReady` | `bool` | `false` | `true` once authentication finished and the character loaded. |
| `bClientReady` | `bool` | `false` | Set by `SetClientReady`. Redwood doesn't read it; it's available for your own logic. |
| `MarkCharacterDataDirty()` | | | Save the whole `RedwoodCharacter` struct on the next flush. Only use this if you're **not** using [`URedwoodCharacterComponent`](./persistence-and-sync.md#uredwoodcharactercomponent); mixing the two isn't supported. |
| `IsCharacterDataDirty()` | `bool` | | |
| `SetClientReady()` | Server RPC | | |
| `SetServerReady()` | | | Called by Redwood after authentication. |
| `SetRedwoodPlayer(Player)` / `SetRedwoodCharacter(Character)` | | | Called by Redwood; they broadcast the events below. |
| `GetSpawnData(OutTransform, OutControlRotation)` | `bool` | | The saved spawn location for the current zone, if any. Used by [spawn selection](#spawn-selection). |
| `OnRedwoodCharacterUpdated` | Event | | Fires on the **server** when the character data is set (on join). |
| `OnRedwoodPlayerUpdated` | Event | | Fires on the **server** when the player data is set (on join, and when the backend pushes a change). |
| `OnTransferring` | Event | | Intended to fire on the owning client when a [zone transfer](./zones-and-interactables.md#zone-transfers) starts, so you can show a loading screen. |

:::caution Known issue (5.0.0)
`URedwoodPlayerStateComponent` doesn't replicate by default, but `SetClientReady` and `OnTransferring` rely on RPCs that only work on replicated components. If you use either, tick **Component Replicates** on the component in your player state.
:::

The player state component must be on an `APlayerState`; Redwood logs an error otherwise.

### `ARedwoodPlayerState` (deprecated)

An `APlayerState` subclass that wraps a `URedwoodPlayerStateComponent`. It still works but logs a deprecation warning and will be removed. Add `URedwoodPlayerStateComponent` to your own player state instead.

## Gameplay Messages

Redwood uses the [GameplayMessageRouter](./optional-plugins.md#gameplaymessagerouter) plugin for a few local (not replicated) events. The tags are defined natively, so you don't need to add them to a gameplay tags ini.

| Tag | Payload | Who broadcasts it | Who listens |
| --- | --- | --- | --- |
| `Redwood.Player.Left` | `FRedwoodPlayerLeft { PlayerController }` | Redwood, on the server, when a player logs out | Your game (e.g. to clean up per-player state) |
| `Redwood.Player.Interaction` | `FRedwoodPlayerInteraction { Pawn, CharacterComponent }` | **Your game**, on the server, when a player presses "interact" | Every [`ARedwoodInteractable`](./zones-and-interactables.md#interactables) |
| `Redwood.Shutdown.Instance` | `FRedwoodReason { Reason }` | **Your game**, before shutting the server down on purpose | `URedwoodServerGameSubsystem` (reports `Stopping` to the backend) |
| `Redwood.Player.InventoryChanged` | `FRedwoodPlayerInventoryChanged { PlayerStateComponent }` | Nothing in Redwood | Available for your own use |

In Blueprints, use **Broadcast Message** and **Listen for Gameplay Messages**. In C++, use `UGameplayMessageSubsystem::Get(this).BroadcastMessage(Tag, Payload)` and `RegisterListener` (add `GameplayMessageRuntime` and `GameplayTags` to your `Build.cs`).
