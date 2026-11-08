---
sidebar_position: 2
---

# Settings and Project Configuration

This page covers every Redwood setting in the editor, the files they're saved in, the command-line arguments and URL options Redwood reads, and the engine/project configuration a Redwood project needs.

## Project Settings

**Project Settings > Plugins > Redwood** (`URedwoodSettings`, module `Redwood`).

These are saved in `Config/DefaultProjectSettings.ini` under the `[/Script/Redwood.RedwoodSettings]` section (the class uses the `ProjectSettings` config name, not `Game`).

| Property | Type | Default | Used by | Meaning |
| --- | --- | --- | --- | --- |
| `bServersAutoConnectToSidecar` | `bool` | `true` | Server | Dedicated/listen servers connect to the [sidecar](../architecture/overview.md#sidecar) when the game instance starts. Leave this on. If it's off, nothing connects to the sidecar and every joining player is kicked with "Sidecar is not connected". |
| `DirectorUri` | `FString` | `ws://localhost:3001` | Client | The full websocket URI of the Director Frontend that clients connect to. Use `ws://` for plain connections and `wss://` for TLS. Can be overridden at runtime by [`redwood.json`](#redwoodjson). |
| `bRedwoodJsonEnabled` | `bool` | `true` | Client | Allow a `redwood.json` file to override settings at runtime. Set this to `false` for builds that must never be redirected to another backend. |
| `PublicSigningKey` | `FString` | empty | Client | Optional base64 Ed25519 public key (32 bytes, 44 characters). When set, a `redwood.json` override is only honored if it's correctly signed. Leave empty to trust the file as-is (fine for development). |
| `bAutoConnectToServers` | `bool` | `true` | Client | When the backend assigns the player a server (lobby, matchmaking, queue, party follow, or zone transfer), automatically run the `open <address>?<options>` command. If `false`, the `OnRequestToJoinServer` delegate fires instead and your game decides when to travel (see [Client Subsystem](./client-subsystem.md)). |
| `PingAttempts` | `int32` | `3` | Client | Number of pings per region per round; the lowest round-trip time is used. |
| `PingTimeout` | `float` | `3.0` | Client | Seconds before a single ping attempt times out. |
| `PingFrequency` | `float` | `10.0` | Client | Seconds between ping rounds. |

Example:

```ini
[/Script/Redwood.RedwoodSettings]
bServersAutoConnectToSidecar=True
DirectorUri="ws://localhost:3001"
bAutoConnectToServers=True
PingAttempts=3
PingTimeout=3.000000
PingFrequency=10.000000
```

:::tip
The default `ws://localhost:3001` works with the [Dev Initiator](../getting-started/running-with-backend.md) out of the box. For deployed environments, set `DirectorUri` to your public Director Frontend address (the `director.frontend.connection.external` [config](../configuration/reference/director.md) of that environment), for example `wss://director.yourgame.com`. Many projects keep the development value in the project and ship a `redwood.json` per environment instead.
:::

### redwood.json

If `bRedwoodJsonEnabled` is `true`, Redwood looks for a `redwood.json` file in the project directory (`FPaths::ProjectDir()`; in a packaged game that's the folder that contains `Binaries` and `Content`) and uses it to override settings. The file is re-read every time the Director URI is needed.

```json
{
  "directorUri": "wss://director.yourgame.com",
  "xmppServerUri": "chat.yourgame.com"
}
```

| Field | Overrides |
| --- | --- |
| `directorUri` | `URedwoodSettings::DirectorUri` |
| `xmppServerUri` | `URedwoodChatSettings::XmppServerUri` (only if you use [RedwoodChat](./optional-plugins.md#redwoodchat)) |

If `PublicSigningKey` is set, the file must also contain a `signature` field: an Ed25519 signature over the canonical JSON of the object without the `signature` field (keys sorted, no whitespace, integers written without `.0`). A missing or invalid signature means the override is ignored and an error is logged. The backend includes a `yarn sign-redwood-json` script to produce these signatures.

:::caution Known issue (5.0.0)
The `xmppServerUri` override is read even when `bRedwoodJsonEnabled` is `false`, and it isn't checked against `PublicSigningKey`.
:::

## Editor Preferences

**Editor Preferences > Plugins > Redwood** (`URedwoodEditorSettings`, module `RedwoodEditor`). Both settings are also in the **Play** button dropdown under **Redwood Options**.

These are per-user settings saved in `EditorPerProjectUserSettings` under `[/Script/RedwoodEditor.RedwoodEditorSettings]`. To give your whole team a default, put the section in `Config/DefaultEditorPerProjectUserSettings.ini`.

| Property | Type | Default | Meaning |
| --- | --- | --- | --- |
| `bUseBackendInPIE` | `bool` | `false` | **Use Backend in PIE.** When `false`, Play In Editor runs without the backend: client API calls return local stubs, and characters, world data, and persistent items are stored as JSON files in `Saved/Persistence`. See [No-Backend Mode](./persistence-and-sync.md#no-backend-mode) and [Running without the Backend](../getting-started/running-without-backend.md). When `true`, PIE clients talk to the real backend. |
| `FallbackZoneName` | `FString` | empty | **Fallback Zone Name.** When not using the backend in PIE there's no zone assigned to the server, so Redwood uses this zone name to pick an [`ARedwoodZoneSpawn`](./zones-and-interactables.md#aredwoodzonespawn). Empty means normal engine spawning (PlayerStart). |

```ini
[/Script/RedwoodEditor.RedwoodEditorSettings]
bUseBackendInPIE=False
FallbackZoneName="town"
```

:::note
`URedwoodCommonGameSubsystem::ShouldUseBackend` returns `true` in packaged builds and for any non-PIE world (including **Standalone Game** launched from the editor). `bUseBackendInPIE` only affects PIE worlds.
:::

## Optional Plugin Settings

| Plugin | Where | ini section (in `Config/DefaultProjectSettings.ini`) | Settings |
| --- | --- | --- | --- |
| RedwoodChat | Project Settings > Plugins > Redwood Chat | `[/Script/RedwoodChat.RedwoodChatSettings]` | `XmppServerUri` (`FString`, default `chat.localhost`). Must equal the backend's `chat.text.host`. See [Optional Plugins](./optional-plugins.md#redwoodchat). |
| RedwoodSteam | none (uses the engine's `[OnlineSubsystemSteam]` config) | | See [Steam authentication](../features/authentication/steam.md). |
| RedwoodEOS | none (uses the engine's `[/Script/OnlineSubsystemEOS.EOSSettings]` config) | | See [Epic authentication](../features/authentication/epic.md). |

`Config/DefaultRedwoodCore.ini` and `Config/DefaultRedwoodChat.ini` inside the plugins only contain `[CoreRedirects]` for renamed classes; you don't need to change them.

## Command Line and URL Options

### Game server command line

The backend starts your game server process; you don't normally pass these yourself.

| Argument | Read by | Default | Meaning |
| --- | --- | --- | --- |
| `-SidecarPort=<port>` | `URedwoodServerGameSubsystem` | `3020` | Port of the sidecar. The server always connects to `ws://127.0.0.1:<port>` (the sidecar runs on the same machine/pod). |
| `-port=<port>` | Engine | `7777` | The game port clients connect to. |
| `-server` | Engine | | Runs the editor executable as a dedicated server (used by the `local` provider). |
| `-pieviaconsole` | Engine | | Added by the `local` provider so uncooked servers started through the editor executable behave like PIE-launched servers. |

What each [game server provider](../features/game-servers/hosting/overview.md) passes:

| Provider | Command line |
| --- | --- |
| `local` | `<UnrealEditor executable> <your .uproject> -server -port=<game port> -SidecarPort=<sidecar port> -pieviaconsole <game-servers.local.arguments>`. Both ports are picked from the 7000 to 7099 range. No map is passed: the server starts on your **Server Default Map** and then loads the real map when the backend tells it to. |
| `agones`, `edgegap` | Your packaged server binary with `<game-servers.agones.arguments>`. No ports are passed, so the engine default port `7777` and sidecar port `3020` are used. |
| `dev-debug` | Nothing is launched; you start the server yourself (for example PIE as a listen/dedicated server), using sidecar port `3020` and game port `7777`. |

### Map URL options set by the server

When the backend tells the server which map to load, Redwood runs `open <MapName>?<options>`. Your game mode can read these with the normal `UGameplayStatics::ParseOption` / **Parse Option** on the options string in `InitGame`, or from `GetWorld()->URL`.

| Option | Value |
| --- | --- |
| `game` | Path of the game mode class from the matching [`URedwoodGameModeAsset`](./persistence-and-sync.md#uredwoodgamemodeasset) (forces that game mode) |
| `requestId`, `mapId`, `modeId` | Internal ids Redwood uses to confirm the map finished loading |
| `name` | Name of the proxy (lobby/world) |
| `continuousPlay` | `0` or `1` |
| `password` | Proxy password, if any |
| `shortCode` | Proxy short code, if any |
| `maxPlayers` | Max players per shard from the game profile |
| `ownerPlayerId` | Player who created the proxy, if a player created it |
| every key in the game profile's `data` | Its value. Only **string** values are passed; other types are dropped. See [Game Modes and Maps](../configuration/game-modes-and-maps.md#profiles). |

:::caution Known issue (5.0.0)
Option values aren't URL-encoded, so proxy names, passwords, or `data` values containing `?`, `=`, or spaces can break URL parsing. Stick to simple values.
:::

### Client join URL options

When a client joins a game server, Redwood runs `open <address>?RedwoodAuth=1?CharacterId=<id>?PlayerId=<id>?Token=<token>`. The game mode reads `RedwoodAuth`, `PlayerId`, `CharacterId`, and `Token` in `Login` to [authenticate the player](./game-framework.md#player-authentication). If you set `bAutoConnectToServers = false`, get this command from the client subsystem and you can append your own `?key=value` options before running it.

## Engine and Project Configuration

This is the configuration a Redwood project needs outside of the Redwood settings. [Setting Up Unreal](../getting-started/setting-up-unreal.md) walks through it step by step.

| What | Required? | Why |
| --- | --- | --- |
| `RedwoodCore` plugin enabled | **Required** | |
| Asset Manager scans `RedwoodGameModeAsset` and `RedwoodMapAsset` | **Required** | The server loads these at startup to know which game mode and map each backend id refers to. If either type isn't registered, the server logs an error and never connects to the sidecar. |
| Asset Manager scans `RedwoodSyncItemAsset` | Required if you use [sync items](../features/sync-items.md) | Needed to spawn synced and persisted items. |
| A **Server Default Map** that's an empty/light level | **Strongly recommended** | Servers boot into it, report that they're ready, and then load the real map. A heavy default map slows down every server start. |
| A **Game Default Map** with your login/main menu | Recommended | Where clients start. |
| Every map referenced by a `URedwoodMapAsset` is cooked | **Required** for packaged builds | The server opens maps by name, and nothing in Redwood forces them to be cooked. Add them to **Maps to Cook** (or use a `Map` primary asset type with **Always Cook**). |
| A `Server` target (`<Project>Server.Target.cs`) | **Required** for packaged dedicated servers | Standard Unreal requirement (needs a source-built engine). |
| A `Client` target | Recommended | Lets you package a client without server code. |
| Net driver changes | **None** | Redwood uses the default IP net driver; don't switch to Steam or EOS sockets. |
| A custom Game Instance | Not needed | Redwood uses subsystems, so any Game Instance works. |
| A global default game mode | Not needed | The backend picks the game mode through `URedwoodGameModeAsset`. |

### Asset Manager

Project Settings > Game > Asset Manager saves these in `Config/DefaultGame.ini`. The **Primary Asset Type** must be exactly the class name. Change `Directories` to wherever you keep your Redwood Data Assets.

```ini
[/Script/Engine.AssetManagerSettings]
+PrimaryAssetTypesToScan=(PrimaryAssetType="RedwoodGameModeAsset",AssetBaseClass="/Script/Redwood.RedwoodGameModeAsset",bHasBlueprintClasses=False,bIsEditorOnly=False,Directories=((Path="/Game/Redwood")),SpecificAssets=,Rules=(Priority=-1,ChunkId=-1,bApplyRecursively=True,CookRule=AlwaysCook))
+PrimaryAssetTypesToScan=(PrimaryAssetType="RedwoodMapAsset",AssetBaseClass="/Script/Redwood.RedwoodMapAsset",bHasBlueprintClasses=False,bIsEditorOnly=False,Directories=((Path="/Game/Redwood")),SpecificAssets=,Rules=(Priority=-1,ChunkId=-1,bApplyRecursively=True,CookRule=AlwaysCook))
+PrimaryAssetTypesToScan=(PrimaryAssetType="RedwoodSyncItemAsset",AssetBaseClass="/Script/Redwood.RedwoodSyncItemAsset",bHasBlueprintClasses=False,bIsEditorOnly=False,Directories=((Path="/Game/Redwood")),SpecificAssets=,Rules=(Priority=-1,ChunkId=-1,bApplyRecursively=True,CookRule=AlwaysCook))
```

The `MapId` picker on `URedwoodMapAsset` lists assets of the `Map` primary asset type. The engine's default `Map` entry (scanning `/Game/Maps`) is enough; if your maps live elsewhere, add their folder to that entry. It can stay editor-only.

:::note
Older projects may have a `RedwoodPersistentItemAsset` entry. That class no longer exists; replace it with the `RedwoodSyncItemAsset` entry above.
:::

### Maps

```ini
[/Script/EngineSettings.GameMapsSettings]
GameDefaultMap=/Game/Maps/L_MainMenu.L_MainMenu
ServerDefaultMap=/Game/Maps/L_Empty.L_Empty

[/Script/UnrealEd.ProjectPackagingSettings]
+MapsToCook=(FilePath="/Game/Maps/L_MainMenu")
+MapsToCook=(FilePath="/Game/Maps/L_Empty")
+MapsToCook=(FilePath="/Game/Maps/L_Arena")
```

### Targets

A typical Redwood project has four target files in `Source/`:

| File | `Type` |
| --- | --- |
| `YourGame.Target.cs` | `TargetType.Game` |
| `YourGameClient.Target.cs` | `TargetType.Client` |
| `YourGameServer.Target.cs` | `TargetType.Server` |
| `YourGameEditor.Target.cs` | `TargetType.Editor` |

```csharp
using UnrealBuildTool;

public class YourGameServerTarget : TargetRules
{
  public YourGameServerTarget(TargetInfo Target) : base(Target)
  {
    Type = TargetType.Server;
    DefaultBuildSettings = BuildSettingsVersion.Latest;
    IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
    ExtraModuleNames.Add("YourGame");
  }
}
```

:::tip
While debugging the plugins, you can add `DisableOptimizeCodeForModules = new string[] { "Redwood", "SocketIOClient", "SIOJson", "SocketIOLib" };` to your Editor target's constructor so the Redwood code is easier to step through.
:::
