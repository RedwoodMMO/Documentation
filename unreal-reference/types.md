---
sidebar_position: 5
sidebar_label: Types
---

# Types

These are the structs, enums, and delegate types used by the [Client Game Subsystem](./client-subsystem.md) and the [Blueprint async nodes](./blueprint-async-nodes.md). All structs are `USTRUCT(BlueprintType)` with `BlueprintReadWrite` fields, so you can break and make them in Blueprint. They live in `RedwoodCore/Source/Redwood/Public/Types/`; including `Types/RedwoodTypes.h` includes all of them.

Conventions:

- Every `...Output` struct has an `Error` string. **Empty means success.**
- Each output struct has a matching C++ delegate typedef, named by replacing `Output` with `OutputDelegate` (e.g. `FRedwoodListRealmsOutput` and `FRedwoodListRealmsOutputDelegate`), which is a `TDelegate<void(const FRedwoodListRealmsOutput&)>`. Create one with `CreateLambda`, `CreateUObject`, and so on.
- Free-form JSON (character data, party data, proxy data, global data) is a `USIOJsonObject*`. See [Working with `USIOJsonObject`](#working-with-usiojsonobject).
- Timestamps are `FDateTime` in UTC.

## Common

| Type | Fields / signature | Notes |
| --- | --- | --- |
| `FRedwoodSocketConnected` | `FString Error` | Result of a Director or Realm connection |
| `FRedwoodSocketConnectedDelegate` | `TDelegate<void(const FRedwoodSocketConnected&)>` | |
| `FRedwoodErrorOutputDelegate` | `TDelegate<void(const FString&)>` | Used by requests that only report success or failure. The Blueprint output pin carries `FString Error`. |
| `FRedwoodDelegate` / `FRedwoodDynamicDelegate` | no parameters | Used by events like `OnDirectorConnectionLost` |

The macros `RW_ENUM_TO_STRING(EnumValue)` and `RW_STRING_TO_ENUM(EnumType, String)` convert enums to and from their value names (C++ only).

## Auth

| Type | Fields | Notes |
| --- | --- | --- |
| `ERedwoodAuthUpdateType` | `Success`, `MustVerifyAccount`, `Error`, `Unknown` | |
| `FRedwoodAuthUpdate` | `ERedwoodAuthUpdateType Type` (default `Unknown`), `FString Message` | `Message` holds the error text; it's empty on `Success` |
| `FRedwoodAuthUpdateDelegate` | `TDelegate<void(const FRedwoodAuthUpdate&)>` | |

## Realms

| Type | Fields | Notes |
| --- | --- | --- |
| `FRedwoodRealm` | `FString Id`, `FDateTime CreatedAt`, `FDateTime UpdatedAt`, `FString Name`, `FString Uri`, `bool bListed`, `FString Secret` | `Name` is the realm instance config's `name`. `Uri` is the Realm Frontend websocket URI. `Secret` is always empty on the client. |
| `FRedwoodListRealmsOutput` | `FString Error`, `TArray<FRedwoodRealm> Realms` | |

## Characters

| Type | Fields | Notes |
| --- | --- | --- |
| `FRedwoodCharacterBackend` | `FString Id`, `FDateTime CreatedAt`, `FDateTime UpdatedAt`, `bool bArchived`, `FDateTime ArchivedAt`, `FString PlayerId`, `FString Name`, `USIOJsonObject* CharacterCreatorData`, `USIOJsonObject* Metadata`, `USIOJsonObject* EquippedInventory`, `USIOJsonObject* NonequippedInventory`, `USIOJsonObject* Progress`, `USIOJsonObject* Data`, `USIOJsonObject* AbilitySystem`, `USIOJsonObject* RedwoodData` | A `PlayerCharacter`. `CharacterCreatorData` is the only data field clients can write; the rest are written by game servers. `RedwoodData` is internal to Redwood (e.g. the last location used for zone travel); don't modify it. See [Player Data](../features/data/game/player-data.md#playercharacter). |
| `FRedwoodListCharactersOutput` | `FString Error`, `TArray<FRedwoodCharacterBackend> Characters` | |
| `FRedwoodGetCharacterOutput` | `FString Error`, `FRedwoodCharacterBackend Character` | |

## Players and Friends

| Type | Fields | Notes |
| --- | --- | --- |
| `ERedwoodFriendListType` | `All`, `Active`, `PendingAll`, `PendingReceived`, `PendingSent`, `Blocked`, `Inactive`, `Unknown` | The filter for `ListFriends` and the `FriendshipState` of a player |
| `FRedwoodServerDetails` | `FString RealmName`, `FString ProxyId`, `FString InstanceId`, `FString ZoneName`, `FString ShardName` | Describes a game server. Also returned by `URedwoodGameStateComponent::GetServerDetails()` on clients connected to a server. |
| `FRedwoodPlayerOnlineStateRealm` | everything in `FRedwoodServerDetails`, plus `FString CharacterId` | Where a friend is playing. `InstanceId` isn't filled in for friends. |
| `FRedwoodPlayer` | `FString PlayerId`, `FString Nickname`, `ERedwoodFriendListType FriendshipState`, `bool bOnline`, `bool bPlaying`, `FRedwoodPlayerOnlineStateRealm OnlineStateRealm` | `bOnline` means connected to the Director; `bPlaying` means also playing in a realm (then `OnlineStateRealm` is filled) |
| `FRedwoodListPlayersOutput` | `FString Error`, `TArray<FRedwoodPlayer> Players` | Output of `SearchForPlayers` and `ListFriends` |
| `FRedwoodPlayerOutput` | `FString Error`, `FRedwoodPlayer Player` | Output of `SearchForPlayerById` |
| `FRedwoodPlayerData` | `FString Id`, `FString Nickname`, `bool bSelectedGuildValid`, `FRedwoodGuildInfo SelectedGuild`, `USIOJsonObject* Data` | The `PlayerIdentity` as seen by game servers (`URedwoodPlayerStateComponent::RedwoodPlayer`) |

:::note
Older versions used `FRedwoodFriend` and `FRedwoodListFriendsOutput`; they redirect to `FRedwoodPlayer` and `FRedwoodListPlayersOutput`.
:::

## Realm Contacts

| Type | Fields | Notes |
| --- | --- | --- |
| `FRedwoodRealmContact` | `FString CharacterId`, `FString CharacterName`, `FString Description` | |
| `FRedwoodListRealmContactsOutput` | `FString Error`, `TArray<FRedwoodRealmContact> Contacts`, `TArray<FRedwoodRealmContact> BlockedContacts` | |

## Servers

| Type | Fields | Notes |
| --- | --- | --- |
| `FRedwoodGameServerProxy` | `Id`, `CreatedAt`, `UpdatedAt`, `EndedAt`, `bEnded`, `Name`, `ModeId`, `MapId`, `bContinuousPlay`, `Password`, `ShortCode`, `MaxPlayersPerShard`, `Data` (`USIOJsonObject*`), `OwnerPlayerId`, `Region`, `bStartOnBoot`, `TArray<FString> Zones`, `NumPlayersToAddShard` (`-1` = no sharding), `NumMinutesToDestroyEmptyShard` (`-1` = never), `bPublic`, `bProxyEndsWhenCollectionEnds`, `bCollectionEndsWhenAnyShardEnds`, `bHasPassword`, `CurrentPlayers`, `ActiveCollectionId` | A [GameServerProxy](../architecture/game-servers.md#gameserverproxy) as returned by `ListProxies`. `ModeId` is the game profile ID. `ActiveCollectionId` is empty when no servers are running. |
| `FRedwoodGameServerInstance` | `Id`, `CreatedAt`, `UpdatedAt`, `ProviderId`, `StartedAt`, `EndedAt`, `bEnded`, `Connection`, `Channel`, `ZoneName`, `ShardName`, `ContainerId`, `CollectionId` | A single game server ([GameServerInstance](../architecture/game-servers.md#gameserverinstance)). `Channel` is `<zone>:<shard>`. Mostly used server side. |
| `FRedwoodCreateProxyInput` | see below | Input to `CreateProxy` |
| `FRedwoodListProxiesOutput` | `FString Error`, `TArray<FRedwoodGameServerProxy> Proxies` | |
| `FRedwoodCreateProxyOutput` | `FString Error`, `FString ProxyReference` | `ProxyReference` is the new proxy's ID |
| `FRedwoodJoinServerOutput` | `FString Error`, `FString ConnectionUri`, `FString Token` | Informational; the client travels automatically from the backend's push |
| `FRedwoodConnectToServerDynamicDelegate` | `(FString ConsoleCommand)` | Signature of `OnRequestToJoinServer` |
| `FRedwoodStitchToServerDynamicDelegate` | `(FURL URL)` | Signature of the interface-only `OnRequestToStitchServer` |

### `FRedwoodCreateProxyInput`

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `Name` | `FString` | | Display name; must be unique among active proxies in the realm |
| `Region` | `FString` | | Region name (a key from `GetRegions()`) |
| `ModeId` | `FString` | | The [game profile](../configuration/game-modes-and-maps.md#profiles) `id` |
| `MapId` | `FString` | empty | Optional map ID (a `URedwoodMapAsset` Redwood ID); empty picks from the profile's zone maps |
| `bPublic` | `bool` | `false` | Whether it shows up in other players' `ListProxies` |
| `bProxyEndsWhenCollectionEnds` | `bool` | **`true`** | End the proxy entirely when its game servers end (typical for lobbies and matches). Set `false` for worlds that should survive server restarts. |
| `bContinuousPlay` | `bool` | `false` | Passed to the game server as `continuousPlay`; for games that keep cycling matches on the same server |
| `Password` | `FString` | empty | Optional join password |
| `ShortCode` | `FString` | empty | Optional short code players can use to join (also usable as a `ProxyReference`) |
| `Data` | `USIOJsonObject*` | null | Optional custom data stored with the proxy |
| `bStartOnBoot` | `bool` | `false` | Restart this proxy whenever the backend boots. **Admins only.** |

## Ticketing

| Type | Fields | Notes |
| --- | --- | --- |
| `ERedwoodTicketingUpdateType` | `JoinResponse`, `Update`, `TicketError`, `Unknown` | `JoinResponse` with an empty `Message` means the ticket was accepted |
| `FRedwoodTicketingUpdate` | `ERedwoodTicketingUpdateType Type`, `FString Message` | |
| `FRedwoodTicketingUpdateDelegate` | `TDelegate<void(const FRedwoodTicketingUpdate&)>` | |

## Parties

| Type | Fields | Notes |
| --- | --- | --- |
| `FRedwoodPartyInvite` | `FString Id`, `FString FromPlayerId`, `FString FromPlayerName` | `Id` is the inviting party's ID; pass it to `RespondToPartyInvite` |
| `FRedwoodPartyMemberCharacter` | `FString Id`, `FString Name`, `CharacterCreatorData`, `Metadata`, `EquippedInventory`, `NonequippedInventory`, `Progress`, `Data`, `AbilitySystem` (all `USIOJsonObject*`) | Only the fields listed in `realm.instances.<key>.parties.included-character-fields` are filled (by default `characterCreatorData` and `metadata`) |
| `FRedwoodPartyMember` | `FString PlayerId`, `FString Nickname`, `bool bInstanceIdValid`, `FString InstanceId`, `FRedwoodPartyMemberCharacter Character` | `InstanceId` is the game server the member is currently on, if any |
| `FRedwoodParty` | `bool bValid`, `FString Id`, `FString LootType`, `USIOJsonObject* Data`, `FString LeaderId`, `TArray<FRedwoodPartyMember> Members` | `bValid == false` means "not in a party" |
| `FRedwoodGetPartyOutput` | `FString Error`, `FRedwoodParty Party` | |
| `FRedwoodListPartyInvitesOutput` | `FString Error`, `TArray<FRedwoodPartyInvite> Invites` | |
| Event signatures | `FRedwoodPartyInvitedDynamicDelegate(FRedwoodPartyInvite Invite)`, `FRedwoodPartyUpdatedDynamicDelegate(FRedwoodParty Party)`, `FRedwoodPartyEmoteReceivedDynamicDelegate(const FString& PlayerId, const FString& Emote)` | |

:::caution Known issue (5.0.0)
`FRedwoodPartyMemberCharacter::AbilitySystem` is always null, even when `abilitySystem` is in `included-character-fields`.
:::

## Guilds and Alliances

| Type | Fields | Notes |
| --- | --- | --- |
| `ERedwoodGuildInviteType` | `Public` (anyone can join), `Admin` (only guild admins can invite), `Member` (any member can invite), `Unknown` | |
| `ERedwoodGuildAndAllianceMemberState` | `None`, `Invited`, `Member`, `Banned`, `Admin`, `Unknown` | A player's state in a guild, or a guild's state in an alliance |
| `FRedwoodGuild` | `Id`, `CreatedAt`, `UpdatedAt`, `Name`, `Tag`, `ERedwoodGuildInviteType InviteType`, `bool bListed`, `bool bMembershipPublic` | `bListed`: appears in lists and searches. `bMembershipPublic`: non-members can see the member list. |
| `FRedwoodGuildAllianceMembership` | `AllianceId`, `AllianceName`, `ERedwoodGuildAndAllianceMemberState GuildState` | |
| `FRedwoodGuildInfo` | `FRedwoodGuild Guild`, `ERedwoodGuildAndAllianceMemberState PlayerState`, `TArray<FRedwoodGuildAllianceMembership> Alliances` | `PlayerState` is the current player's state in that guild |
| `FRedwoodListGuildsOutput` | `FString Error`, `TArray<FRedwoodGuildInfo> Guilds` | |
| `FRedwoodGetGuildOutput` | `FString Error`, `FRedwoodGuildInfo Guild` | |
| `FRedwoodGuildPlayer` | `FString Id`, `FString Name` | `Name` is the nickname, or the character name when guilds are realm-scoped |
| `FRedwoodGuildPlayerMembership` | `FRedwoodGuildPlayer Player`, `ERedwoodGuildAndAllianceMemberState PlayerState` | |
| `FRedwoodListGuildMembersOutput` | `FString Error`, `TArray<FRedwoodGuildPlayerMembership> Members` | |
| `FRedwoodCreateGuildOutput` | `FString Error`, `FString GuildId` | |
| `FRedwoodAlliance` | `Id`, `CreatedAt`, `UpdatedAt`, `Name`, `bool bInviteOnly` | |
| `FRedwoodListAlliancesOutput` | `FString Error`, `TArray<FRedwoodAlliance> Alliances`, `TArray<ERedwoodGuildAndAllianceMemberState> GuildStates` | `GuildStates` is only filled when a guild filter is used, and lines up index by index with `Alliances` |
| `FRedwoodCreateAllianceOutput` | `FString Error`, `FString AllianceId` | |
| `FRedwoodAllianceGuildMembership` | `FRedwoodGuild Guild`, `ERedwoodGuildAndAllianceMemberState GuildState` | |
| `FRedwoodListAllianceGuildsOutput` | `FString Error`, `TArray<FRedwoodAllianceGuildMembership> Guilds` | |

## Global Data, Blobs, and SaveGames

| Type | Fields | Notes |
| --- | --- | --- |
| `FRedwoodGetGlobalDataOutput` | `FString Error`, `int32 Id` (default `-1`), `USIOJsonObject* Data` | |
| `FRedwoodGetBlobOutput` | `FString Error`, `TArray<uint8> Blob` | Server only |
| `FRedwoodGetSaveGameOutput` | `FString Error`, `USaveGame* SaveGame` | Server only |

## Sync and Server Internals

These are used by the game server side of the plugin. You'll rarely touch them directly; see [Persistence and Sync](./persistence-and-sync.md).

| Type | Fields |
| --- | --- |
| `FRedwoodSyncItemState` | `FString Id` (the item's Redwood ID), `FString TypeId` (its `URedwoodSyncItemAsset` type ID), `bool bDestroyed`, `FString ZoneName` (the zone that owns it) |
| `FRedwoodSyncItemMovement` | `FTransform Transform` |
| `FRedwoodSyncItem` | `FRedwoodSyncItemState State`, `FRedwoodSyncItemMovement Movement`, `USIOJsonObject* Data` |
| `FRedwoodInitialLoadData` | `USIOJsonObject* Data` (world data), `USIOJsonObject* ZoneData` (zone data), `TArray<FRedwoodSyncItem> Items` (persisted sync items), loaded by a game server when it starts a zone |

## Save Game

`URedwoodSaveGame` (`RedwoodSaveGame.h`) is the `USaveGame` the client uses for **Remember Me**. It's stored in the slot named `RedwoodSaveGame`, user index 0, and has two fields: `FString Username` and `FString AuthToken`. Redwood writes it on every login and logout; you don't need to use it directly.

## Working with `USIOJsonObject`

`USIOJsonObject` comes from the `SIOJson` module of the bundled SocketIOClient plugin. It's a Blueprint-friendly wrapper around Unreal's `FJsonObject`. C++ users who touch it need `SIOJson` in their `Build.cs` dependencies.

**Blueprint:**

| Node | Use |
| --- | --- |
| **Construct Json Object** | Creates an empty object |
| **Struct To Json Object** | Converts any struct (wildcard input) to a JSON object; use this for `CreateCharacter`'s creator data |
| **Json Object To Struct** | Fills a struct from a JSON object; returns `true` if every property was found |
| **Get/Set String Field**, **Get/Set Number Field**, **Get/Set Bool Field**, **Get/Set Object Field**, and the array variants | Read and write individual fields |
| **Encode Json** / **Decode Json** | Convert to and from a JSON string |

**C++:**

```cpp
#include "SIOJsonObject.h"
#include "SIOJConvert.h"

// Struct -> USIOJsonObject
FMyCreatorData Creator;
USIOJsonObject* Json = NewObject<USIOJsonObject>();
Json->SetRootObject(USIOJConvert::ToJsonObject(FMyCreatorData::StaticStruct(), &Creator));

// USIOJsonObject -> struct
FMyCreatorData Parsed;
USIOJConvert::JsonObjectToUStruct(Json->GetRootObject(), FMyCreatorData::StaticStruct(), &Parsed);
```

`USIOJLibrary::StructToJsonObject` is a Blueprint-only custom thunk; don't call it from C++.

Things to know:

- Field names are converted with Unreal's JSON conventions: the first letter is lowercased (a `SchemaVersion` property is stored as `schemaVersion`), and reading back is case-insensitive.
- Blueprint struct field names are stored without their GUID suffixes, and Blueprint enums are stored as their display names.
- The UObject number API uses `float`, so integers above 16,777,216 lose precision. In C++, use `GetRootObject()->GetNumberField(...)` (a `double`) for large numbers.
