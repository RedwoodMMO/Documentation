---
sidebar_position: 9
---

# Optional Plugins and Helpers

This page is the API reference for the optional Redwood plugins (Chat, Steam, EOS, and GAS) and for the third-party helpers you'll touch while using Redwood. Feature guides with setup steps live under [Features](../features/index.md).

## RedwoodChat

Client-side text chat over XMPP, backed by the ejabberd server the backend deploys. Read [Text Chat](../features/social/text-chat.md) first for the backend setup and the overall design.

**Modules:** `RedwoodChat`, `RedwoodXMPP`. C++ users need both in `Build.cs` (plus `Redwood`).

### Settings

**Project Settings > Plugins > Redwood Chat** (`URedwoodChatSettings`), saved in `Config/DefaultProjectSettings.ini` under `[/Script/RedwoodChat.RedwoodChatSettings]`.

| Property | Type | Default | Meaning |
| --- | --- | --- | --- |
| `XmppServerUri` | `FString` | `chat.localhost` | Hostname of the chat server. It's also used as the XMPP domain, so it **must exactly equal** the backend's `chat.text.host` config. Can be overridden by `xmppServerUri` in [`redwood.json`](./settings.md#redwoodjson). |

The client connects on port **5222**, which isn't configurable in 5.0.0.

:::caution Known issue (5.0.0)
The backend's Kubernetes default exposes XMPP on port `30222` (`chat.text.connection.xmpp.external.port`), but the client always uses `5222`. For Kubernetes deployments, expose the chat server on `5222` (e.g. with a load balancer) or set the external port to `5222` if your cluster allows it.
:::

The `RedwoodXMPP` module reads `[XMPP] bEnabled` from `Engine.ini` (default `true`). This is the same section Epic's XMPP module uses, so setting it to `false` to disable Epic's XMPP also disables Redwood chat.

### `URedwoodClientChatSubsystem`

A `UGameInstanceSubsystem` used on clients. Functions do nothing (silently) if chat isn't connected.

| Function | Meaning |
| --- | --- |
| **Initialize Chat Connection** (async node; C++ `InitializeChatConnection(OnOutput)`) | Connects to the chat server. Requires the player to be logged in **and a character to be selected** (call `SetSelectedCharacter` first), and `chat.text.enabled` on the backend. `OnOutput(Error)` fires with an empty string on success. Can only be called once per game instance. |
| `IsConnected()` | `true` when both chat connections (player and character) are logged in. |
| `JoinRoom(Type, Id)` | Join a room the backend created for you. See the room table below. Don't use it for `Custom`, `Nearby`, or `Direct`. |
| `JoinCustomRoom(Id, Password, bJoinAsCharacter)` | Join a custom room by name, as the character or the player identity. |
| `LeaveRoom(Type, Id)` | Leave a room. |
| `SendMessageToRoom(Type, Id, Message)` | Send a message to a room you've joined. |
| `SendNearbyMessage(ShardId, Message, Location)` | Send a message with a world location to the shard room. Receivers get `Type = Nearby` and the location, and should filter by distance themselves. |
| `SendMessageToPlayer(TargetPlayerId, Message)` | Direct message to a player identity. |
| `SendMessageToCharacter(TargetCharacterId, Message)` | Direct message to a character (needs the character **id**, not the name). |
| **Create Custom Room** (async node; C++ `CreateCustomRoom(Id, Password, OnOutput)`) | Create a custom room (requires `chat.text.room-types.custom.enabled`). Doesn't join it; call `JoinCustomRoom` afterwards. Possible errors: "Text chat room already exists", "Text chat room creation is disabled", and "Failed to create text chat room". |

| Event | Parameters | Fires when |
| --- | --- | --- |
| `OnJoinPrivateRoom` | `RoomIdentity` | A room join succeeded (failures are only logged). |
| `OnRoomChatReceived` | `RoomIdentity`, `Sender`, `Timestamp`, `Message`, `Location` | A message arrives in any joined room, including your own messages echoed back. |
| `OnPlayerPrivateChatReceived` | `Sender`, `Timestamp`, `Message` | A direct message to the player identity arrives (including messages received while offline, delivered on login). |
| `OnCharacterPrivateChatReceived` | `Sender`, `Timestamp`, `Message` | A direct message to the character arrives. |

Timestamps are UTC.

**Room ids.** Rooms are named `<type>|<id>`. Get the ids on the client from [`URedwoodGameStateComponent::GetServerDetails()`](./game-framework.md#uredwoodgamestatecomponent) or the guild APIs:

| Type | Id to pass | Where to get it |
| --- | --- | --- |
| `Guild` | Guild id | Guild APIs on the [client subsystem](./client-subsystem.md) |
| `Realm` | Realm name | `GetServerDetails().RealmName` |
| `Proxy` | Proxy id | `GetServerDetails().ProxyId` |
| `Shard` | Instance id | `GetServerDetails().InstanceId` (also receives `Nearby` messages) |
| `Custom` | Room name | Use `JoinCustomRoom` |

**Types** (`Types/RedwoodTypesChat.h`):

| Type | Fields / values |
| --- | --- |
| `ERedwoodChatRoomType` | `Guild`, `Party`, `Realm`, `Proxy`, `Shard`, `Team`, `Nearby`, `Custom`, `Direct`, `Unknown` |
| `FRedwoodChatIdentity` | `PlayerId`, `Nickname` |
| `FRedwoodChatRoomIdentity` | `CompleteRoomId` (e.g. `shard\|abc123`), `Type`, `RedwoodId` (the part after `\|`), `Name` (currently always empty) |

:::caution Known issue (5.0.0)
- **Initialize Chat Connection** doesn't report success, and incoming message events don't fire, because of a bug in how the character login completes.
- Calling **Create Custom Room** before **Initialize Chat Connection** crashes.
- Party rooms are never created by the backend, and realm rooms are created under the realm name but membership is granted under the realm id, so `Party` and `Realm` rooms don't work.
- Characters created before chat was enabled have no chat account, so chat can't initialize for them.
:::

## RedwoodSteam

Turns a Steam session into a Redwood login (provider `steam`). Setup is in [Steam authentication](../features/authentication/steam.md).

**Module:** `RedwoodSteam`. The plugin handles the Steam auth packet handler component itself (adds it for clients and removes it on servers), so don't add any `[PacketHandlerComponents]` lines yourself.

| Member | Meaning |
| --- | --- |
| **Login with Steam** (async node, category **Redwood**; input `Target`: the `URedwoodClientGameSubsystem`; output `OnUpdate(FRedwoodAuthUpdate)`) | Gets a Steam Web API ticket for the identity `redwood` and logs in with it. Same update flow as the normal login (`Success`, `MustVerifyAccount`, `Error`). |
| `URedwoodSteamClientInterface::LoginWithSteam(ClientInterface, OnUpdate)` (static, C++) | The same, from C++. Pass the client subsystem's client interface. |

The player's Redwood username is their SteamID64, and their nickname is updated to their Steam persona name on every login.

:::caution Known issue (5.0.0)
If Steam isn't running, the user isn't logged into Steam, or getting the ticket fails, `OnUpdate` never fires. Add your own timeout in your login UI.
:::

## RedwoodEOS

Turns an Epic Account Services login into a Redwood login (provider `epic`). Setup is in [Epic authentication](../features/authentication/epic.md).

**Module:** `RedwoodEOS`.

| Member | Meaning |
| --- | --- |
| `LoginEOS_DevAuthTool(Endpoint = "localhost:6300", CredentialName = "Context_1")` | Static, BlueprintCallable (**Login EOS Dev Auth Tool**). Starts an EOS login with the Developer Authentication Tool. |
| `LoginEOS_PromptAccountPortal()` | Static, BlueprintCallable (**Login EOS Prompt Account Portal**). Starts an EOS login through the account portal (browser/overlay). |
| `LoginEOS_EpicGamesLauncher()` | Static, BlueprintCallable (**Login EOS Epic Games Launcher**). Starts an EOS login with an exchange code from the launcher. |
| **Login with EOS** (async node, category **Redwood\|EOS**; input `Target`: the `URedwoodClientGameSubsystem`; output `OnUpdate(FRedwoodAuthUpdate)`) | Once the player is logged into EOS, logs into Redwood with their EAS token. Fails immediately with an error if they aren't logged into EOS yet. |
| `URedwoodEOSClientInterface::LoginWithEOS(ClientInterface, OnUpdate)` (static, C++) | The same, from C++. |

The `LoginEOS_*` functions return `true` when the EOS login **started**, not when it finished. Wait for the online subsystem's identity `OnLoginComplete` delegate (or poll the login status) before calling **Login with EOS**.

The player's Redwood username is their Epic account id, and their nickname is updated to their Epic display name on every login.

:::caution Known issue (5.0.0)
- `LoginEOS_EpicGamesLauncher` passes an empty exchange code, so launcher logins likely fail. Use the online subsystem's `AutoLogin` (which reads the launcher's command-line arguments) instead.
- If getting the EAS token fails, `OnUpdate` never fires. Add your own timeout.
:::

## RedwoodGAS

Persists Gameplay Ability System state (granted abilities, active effects, and attribute values) into the character's `abilitySystem` field. Setup and behavior are in [Gameplay Ability System](../features/data/game/gas.md).

**Modules:** `RedwoodGAS` (plus `GameplayAbilities`, `GameplayTags`, `GameplayTasks` for typical GAS C++).

### `URedwoodAbilitySystemComponent`

A `UAbilitySystemComponent` subclass (and an [`IRedwoodPersistenceComponentInterface`](./persistence-and-sync.md#iredwoodpersistencecomponentinterface)) for your **pawn** or **player state**. A player state owner must also have a `URedwoodPlayerStateComponent`. Loading and saving only happen on the server.

| Member | Type | Default | Meaning |
| --- | --- | --- | --- |
| `UpdateIntervals` | `int32` | `0` | Intended to save only every N persistence intervals. `0` saves at every interval when dirty. |
| `AbilityInclusionMode` | `ERedwoodASCInclusionMode` | `Blacklist` | Whether `AbilityInclusionArray` lists abilities to skip (`Blacklist`) or the only abilities to save (`Whitelist`) |
| `AbilityInclusionArray` | `TArray<TSubclassOf<UGameplayAbility>>` | empty | Exact classes (subclasses don't match) |
| `EffectInclusionMode` | `ERedwoodASCInclusionMode` | `Blacklist` | Same, for effects |
| `EffectInclusionArray` | `TArray<TSubclassOf<UGameplayEffect>>` | empty | |
| `AttributeInclusionMode` | `ERedwoodASCInclusionMode` | `Blacklist` | Same, for attributes |
| `AttributeInclusionArray` | `TArray<FGameplayAttribute>` | empty | |
| `MarkDirty()` | | | Save on the next interval. Called automatically when effects are applied, removed, or change stack count, and when abilities are given or removed. **Not** called for attribute changes. |
| `IsDirty()` | `bool` | | |

Inclusion lists only apply when saving.

:::warning
This component doesn't replicate by default. Call `SetIsReplicated(true)` and set a replication mode (e.g. `EGameplayEffectReplicationMode::Mixed`) in your owner's constructor, as you would with any ability system component. Don't enable `URedwoodCharacterComponent::bUseAbilitySystem` at the same time; both write the same field.
:::

Two Gameplay Effect components change how effects are restored after the player was offline:

| GE component | Editor name | Effect |
| --- | --- | --- |
| `URedwoodKeepRemainingTimeGameplayEffectComponent` | **Redwood: Keep Remaining Time** | Restore the effect with the same remaining duration it had when saved, as if no time passed. |
| `URedwoodSkipOfflinePeriodsGameplayEffectComponent` | **Redwood: Skip Offline Periods** | Don't run the periodic executions that would have happened while the player was offline. |

:::caution Known issue (5.0.0)
- `UpdateIntervals` doesn't throttle saves for a component that's dirty at every interval.
- Renaming or deleting an ability or effect class that's stored in saved data can crash the server on load. Add `[CoreRedirects]` when renaming.
- Restoring effects changes `bExecutePeriodicEffectOnApplication` on the effect's class defaults.
:::

## SocketIOClient JSON Helpers

Redwood uses a fork of the SocketIOClient plugin for its websocket connections. The part you'll use is its JSON type: many Redwood fields are `USIOJsonObject*` (e.g. the character data fields in `FRedwoodCharacterBackend`, character creator data, and party/proxy data).

**Module:** `SIOJson`.

### `USIOJsonObject`

A Blueprint-friendly wrapper around Unreal's `FJsonObject` (category **SIOJ\|Json**).

| Function | Meaning |
| --- | --- |
| `ConstructJsonObject(WorldContext)` | **Construct Json Object**: create an empty object |
| `GetRootObject()` / `SetRootObject(FJsonObject)` | C++ access to the underlying `TSharedPtr<FJsonObject>` |
| `EncodeJson()` / `EncodeJsonToSingleString()` / `DecodeJson(String)` | Serialize to and parse from a string |
| `HasField`, `RemoveField`, `GetFieldNames` | |
| `Get/Set/TryGet` + `StringField`, `NumberField`, `BoolField`, `ObjectField` | Read and write fields. `TryGet*` returns whether the field existed. |
| `Get/Set` + `ArrayField`, `StringArrayField`, `NumberArrayField`, `BoolArrayField`, `ObjectArrayField` | Arrays |
| `MergeJsonObject(Other, bOverwrite)` | Copy fields from another object |

:::note
Number fields use `float` in the `USIOJsonObject` API so they work in Blueprints, which means integers larger than about 16 million lose precision. In C++, use `GetRootObject()->GetNumberField(...)` (a `double`) for large numbers.
:::

### Converting Structs

| Need | Blueprint | C++ |
| --- | --- | --- |
| Struct to JSON object | **Struct To Json Object** (wildcard struct input) | `USIOJConvert::ToJsonObject(FMyStruct::StaticStruct(), &MyStruct)` returns a `TSharedPtr<FJsonObject>`; wrap it with `NewObject<USIOJsonObject>()` and `SetRootObject` |
| JSON object to struct | **Json Object To Struct** (returns whether all properties were filled) | `USIOJConvert::JsonObjectToUStruct(Json->GetRootObject(), FMyStruct::StaticStruct(), &MyStruct)` |
| Struct to/from a file | **Save Struct To Json File**, **Load Json File To Struct** | `USIOJConvert::ToJsonFile`, `JsonFileToUStruct` |

`USIOJLibrary::StructToJsonObject` is a Blueprint-only (custom thunk) function; don't call it from C++. Field names are converted to start with a lowercase letter (`PlayerName` becomes `playerName`), and Blueprint struct field names drop their generated suffixes. Reading back is case-insensitive.

## LatencyChecker

Measures ping to each region so the backend can choose the best region for [matchmaking](../features/ticketing/overview.md). The client subsystem runs it for you using the `PingAttempts`, `PingTimeout`, and `PingFrequency` [settings](./settings.md#project-settings): `ws://`/`wss://` region ping addresses use websocket pings, anything else uses ICMP. You rarely need it directly, but its Blueprint functions (category **Latency**) are available: **Ping Host (ICMP)**, **Ping Host (HTTP)**, and **Ping Host (WebSockets)**, each returning the round-trip time in seconds.

## GameplayMessageRouter

Epic's local message bus (from the Lyra sample). Messages are keyed by gameplay tag with a struct payload, and they stay in the process that sent them (they don't replicate). Redwood uses it for the events listed in [Gameplay Messages](./game-framework.md#gameplay-messages). In Blueprints, use **Broadcast Message** and **Listen for Gameplay Messages**; in C++, `UGameplayMessageSubsystem` (module `GameplayMessageRuntime`).
