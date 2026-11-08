---
sidebar_position: 4
sidebar_label: Blueprint Async Nodes
---

# Blueprint Async Nodes

Every request/response operation on the [Client Game Subsystem](./client-subsystem.md) is exposed to Blueprint as an **async action node**. Each node takes the subsystem as its `Target` input (use **Get RedwoodClientGameSubsystem**), sends the request, and fires its output exec pin when the backend answers. All nodes are in the **Redwood** category of the Blueprint palette.

How to read the tables below:

- **Inputs** are listed in pin order, after `Target`.
- **Output** is the output exec pin's name and the struct (or string) it carries. Break the struct to get its fields; see [Types](./types.md).
- An empty `Error` string (or empty `Message` for auth/ticketing updates) means success.
- Most nodes fire **once**. The exceptions are the auth nodes that can report `MustVerifyAccount` and the ticketing nodes, which can fire several times.
- **C++ function** is the [subsystem function](./client-subsystem.md) the node wraps; read its section for full behavior notes.

:::note
Some functions are regular Blueprint functions on the subsystem rather than async nodes because they return immediately: **Is Director Connected**, **Is Logged In**, **Get Player Id**, **Get Nickname**, **Logout**, **Cancel Waiting For Account Verification**, **Is Realm Connected**, **Get Regions**, **Set Selected Character**, **Get Cached Party**, **Send Emote To Party**, and **Get Connection Console Command**. The subsystem's events (e.g. **On Party Updated**) are listed on the [Client Game Subsystem](./client-subsystem.md#events) page.
:::

## Connection, Auth, and Realms

| Node | Inputs | Output | C++ function | Notes |
| --- | --- | --- | --- | --- |
| **Initialize Director Connection** | none | `On Output (FRedwoodSocketConnected Details)` | `InitializeDirectorConnection` | Only fires on success; call once per session |
| **Register** | `Username`, `Password` | `On Update (FRedwoodAuthUpdate)` | `Register` | Fires again with `Success` after email verification. Doesn't log in. |
| **Login** | `Username`, `Password`, `bRememberMe`, `Provider` (default `"local"`) | `On Update (FRedwoodAuthUpdate)` | `Login` | Fires again with `Success` after email verification |
| **Attempt Auto-Login** | none | `On Update (FRedwoodAuthUpdate)` | `AttemptAutoLogin` | Uses credentials saved by a Remember Me login |
| **Login with Discord** | `bRememberMe` | `On Update (FRedwoodAuthUpdate)` | `LoginWithDiscord` | Opens the system browser |
| **Login with Twitch** | `bRememberMe` | `On Update (FRedwoodAuthUpdate)` | `LoginWithTwitch` | Opens the system browser |
| **List Realms** | none | `On Output (FRedwoodListRealmsOutput)` | `ListRealms` | |
| **Initialize Realm Connection** | `Realm` (`FRedwoodRealm`) | `On Output (FRedwoodSocketConnected)` | `InitializeRealmConnection` | Only fires on success |
| **Initialize Connection For First Realm** | none | `On Output (FRedwoodSocketConnected)` | `InitializeConnectionForFirstRealm` | Lists realms and connects to the first |

**Login with Steam** and **Login with EOS** come from the [optional plugins](./optional-plugins.md).

## Characters

| Node | Inputs | Output | C++ function | Notes |
| --- | --- | --- | --- | --- |
| **List Characters** | none | `On Output (FRedwoodListCharactersOutput)` | `ListCharacters` | Non-archived characters |
| **List Archived Characters** | none | `On Output (FRedwoodListCharactersOutput)` | `ListArchivedCharacters` | |
| **Create Character** | `Name`, `Character Creator Data` (`USIOJsonObject`) | `On Output (FRedwoodGetCharacterOutput)` | `CreateCharacter` | Creator data must not be `None`. Doesn't select the new character. |
| **Get Character Data** | `Character Id Or Name` | `On Output (FRedwoodGetCharacterOutput)` | `GetCharacterData` | |
| **Set Character Data** | `Character Id`, `Name`, `Character Creator Data` | `On Output (FRedwoodGetCharacterOutput)` | `SetCharacterData` | Empty name or `None` data leaves that field unchanged |
| **Set Character Archived** | `Character Id`, `bArchived` | `On Output (FString Error)` | `SetCharacterArchived` | |

## Servers (Proxies) and Ticketing

| Node | Inputs | Output | C++ function | Notes |
| --- | --- | --- | --- | --- |
| **List Proxies** | `Private Proxy References` (array of IDs or short codes) | `On Output (FRedwoodListProxiesOutput)` | `ListProxies` | |
| **Create Proxy** | `bJoinSession`, `Parameters` (`FRedwoodCreateProxyInput`) | `On Output (FRedwoodCreateProxyOutput)` | `CreateProxy` | With `bJoinSession`, the player travels automatically when ready |
| **Join Proxy with Single Instance** | `Proxy Reference`, `Password` | `On Output (FRedwoodJoinServerOutput)` | `JoinProxyWithSingleInstance` | Travel is automatic on success |
| **Stop Proxy** | `Server Proxy Id` | `On Output (FString Error)` | `StopProxy` | Owner or admin only |
| **Join Matchmaking** | `Profile Id`, `Regions` (array of region names) | `On Update (FRedwoodTicketingUpdate Update)` | `JoinMatchmaking` | Fires multiple times; see below |
| **Join Queue** | `Proxy Id`, `Zone Name`, `bTransferWholeParty` | `On Update (FRedwoodTicketingUpdate)` | `JoinQueue` | Fires multiple times. Requires a realm connection. |
| **Join Custom** | `bTransferWholeParty`, `Regions` | `On Update (FRedwoodTicketingUpdate)` | `JoinCustom` | Fires multiple times |
| **Leave Ticketing** | none | `On Output (FString Error)` | `LeaveTicketing` | Cancels the current ticket |

The three ticketing nodes report a `JoinResponse` first (empty `Message` = ticket accepted, otherwise rejected), then any number of `Update`s, and finish with either a `TicketError` or the player traveling to the server. See [Ticketing and Regions](./client-subsystem.md#ticketing-and-regions).

:::note
Older versions of Redwood named these nodes **List Servers**, **Create Server**, **Join Server Instance**, and **Stop Server**. Redirects in the plugin upgrade existing Blueprints automatically.
:::

## Parties

| Node | Inputs | Output | C++ function | Notes |
| --- | --- | --- | --- | --- |
| **Get or Create Party** | `bCreateIfNotInParty` (default `false`) | `On Output (FRedwoodGetPartyOutput)` | `GetOrCreateParty` | `Party.bValid == false` means not in a party |
| **Leave Party** | none | `On Output (FString Error)` | `LeaveParty` | |
| **Invite to Party** | `Target Player Id` | `On Output (FString Error)` | `InviteToParty` | Player ID, not character ID |
| **List Party Invites** | none | `On Output (FRedwoodListPartyInvitesOutput)` | `ListPartyInvites` | |
| **Respond to Party Invite** | `Party Id`, `bAccept` | `On Output (FRedwoodGetPartyOutput)` | `RespondToPartyInvite` | Use the invite's `Id` |
| **Promote to Party Leader** | `Target Player Id` | `On Output (FString Error)` | `PromoteToPartyLeader` | |
| **Kick from Party** | `Target Player Id` | `On Output (FString Error)` | `KickFromParty` | |
| **Respond to Party Invite** (Set Party Data) | `Loot Type`, `Party Data` (`USIOJsonObject`, optional) | `On Output (FRedwoodGetPartyOutput)` | `SetPartyData` | See the known issue below |

:::caution Known issue (5.0.0)
The Set Party Data node is mislabeled **Respond to Party Invite** in the palette. You can tell the two apart by their inputs: the Set Party Data node has `Loot Type` and `Party Data`.
:::

## Friends and Player Search

| Node | Inputs | Output | C++ function |
| --- | --- | --- | --- |
| **Search For Players** | `Username Or Nickname`, `bIncludePartialMatches` | `On Output (FRedwoodListPlayersOutput)` | `SearchForPlayers` |
| **List Friends** | `Filter` (`ERedwoodFriendListType`) | `On Output (FRedwoodListPlayersOutput)` | `ListFriends` |
| **Request Friend** | `Other Player Id` | `On Output (FString Error)` | `RequestFriend` |
| **Remove Friend** | `Other Player Id` | `On Output (FString Error)` | `RemoveFriend` |
| **Respond To Friend Request** | `Other Player Id`, `bAccept` | `On Output (FString Error)` | `RespondToFriendRequest` |
| **Set Player Blocked** | `Other Player Id`, `bBlocked` | `On Output (FString Error)` | `SetPlayerBlocked` |

`SearchForPlayerById` has no Blueprint node (C++ only).

:::caution Known issue (5.0.0)
**List Friends** only works with the `All` filter. Filter the results on each player's `Friendship State` yourself.
:::

## Realm Contacts

| Node | Inputs | Output | C++ function |
| --- | --- | --- | --- |
| **List Realm Contacts** | none | `On Output (FRedwoodListRealmContactsOutput)` | `ListRealmContacts` |
| **Add Realm Contact** | `Other Character Id`, `bBlocked` | `On Output (FString Error)` | `AddRealmContact` |
| **Remove Realm Contact** | `Other Character Id` | `On Output (FString Error)` | `RemoveRealmContact` |

:::caution Known issue (5.0.0)
**Add Realm Contact** fails backend validation because it doesn't send a description.
:::

## Guilds

| Node | Inputs | Output | C++ function |
| --- | --- | --- | --- |
| **List Guilds** | `bOnlyPlayersGuilds` | `On Output (FRedwoodListGuildsOutput)` | `ListGuilds` |
| **Search for Guilds** | `Search Text`, `bIncludePartialMatches` | `On Output (FRedwoodListGuildsOutput)` | `SearchForGuilds` |
| **Get Guild** | `Guild Id` | `On Output (FRedwoodGetGuildOutput)` | `GetGuild` |
| **Get Selected Guild** | none | `On Output (FRedwoodGetGuildOutput)` | `GetSelectedGuild` |
| **Set Selected Guild** | `Guild Id` | `On Output (FString Error)` | `SetSelectedGuild` |
| **Join Guild** | `Guild Id` | `On Output (FString Error)` | `JoinGuild` |
| **Invite To Guild** | `Guild Id`, `Target Player Id` | `On Output (FString Error)` | `InviteToGuild` |
| **Leave Guild** | `Guild Id` | `On Output (FString Error)` | `LeaveGuild` |
| **List Guild Members** | `Guild Id`, `State` (`ERedwoodGuildAndAllianceMemberState`) | `On Output (FRedwoodListGuildMembersOutput)` | `ListGuildMembers` |
| **Create Guild** | `Guild Name`, `Guild Tag`, `Invite Type`, `bListed`, `bMembershipPublic` | `On Output (FRedwoodCreateGuildOutput)` | `CreateGuild` |
| **Update Guild** | `Guild Id`, `Guild Name`, `Guild Tag`, `Invite Type`, `bListed`, `bMembershipPublic` | `On Output (FString Error)` | `UpdateGuild` |
| **Kick Player From Guild** | `Guild Id`, `Target Player Id` | `On Output (FString Error)` | `KickPlayerFromGuild` |
| **Ban Player From Guild** | `Guild Id`, `Target Player Id` | `On Output (FString Error)` | `BanPlayerFromGuild` |
| **Unban Player From Guild** | `Guild Id`, `Target Player Id` | `On Output (FString Error)` | `UnbanPlayerFromGuild` |
| **Promote Player To Guild Admin** | `Guild Id`, `Target Player Id` | `On Output (FString Error)` | `PromotePlayerToGuildAdmin` |
| **Demote Player From Guild Admin** | `Guild Id`, `Target Player Id` | `On Output (FString Error)` | `DemotePlayerFromGuildAdmin` |

When guilds are [scoped to the realm](../features/social/guilds-alliances.md), `Target Player Id` accepts a character ID or character name.

## Alliances

| Node | Inputs | Output | C++ function |
| --- | --- | --- | --- |
| **List Alliances** | `Guild Id Filter` | `On Output (FRedwoodListAlliancesOutput)` | `ListAlliances` |
| **Search for Alliances** | `Search Text`, `bIncludePartialMatches` | `On Output (FRedwoodListAlliancesOutput)` | `SearchForAlliances` |
| **Can Admin Alliance** | `Alliance Id` | `On Output (FString Error)` | `CanAdminAlliance` |
| **Create Alliance** | `Alliance Name`, `Guild Id`, `bInviteOnly` | `On Output (FRedwoodCreateAllianceOutput)` | `CreateAlliance` |
| **Update Alliance** | `Alliance Id`, `Alliance Name`, `bInviteOnly` | `On Output (FString Error)` | `UpdateAlliance` |
| **Kick Guild From Alliance** | `Alliance Id`, `Guild Id` | `On Output (FString Error)` | `KickGuildFromAlliance` |
| **Ban Guild From Alliance** | `Alliance Id`, `Guild Id` | `On Output (FString Error)` | `BanGuildFromAlliance` |
| **Unban Guild From Alliance** | `Guild Id`, `Alliance Id` (note the order) | `On Output (FString Error)` | `UnbanGuildFromAlliance` |
| **List Alliance Guilds** | `Alliance Id`, `State` | `On Output (FRedwoodListAllianceGuildsOutput)` | `ListAllianceGuilds` |
| **Join Alliance** | `Alliance Id`, `Guild Id` | `On Output (FString Error)` | `JoinAlliance` |
| **Leave Alliance** | `Alliance Id`, `Guild Id` | `On Output (FString Error)` | `LeaveAlliance` |
| **Invite Guild To Alliance** | `Alliance Id`, `Guild Id` | `On Output (FString Error)` | `InviteGuildToAlliance` |

:::caution Known issue (5.0.0)
**Ban Guild From Alliance** fails backend validation. **Unban Guild From Alliance** passes its two IDs to the backend in swapped order; until that's fixed, connect the alliance ID to the `Guild Id` pin and the guild ID to the `Alliance Id` pin.
:::

## Global Data

| Node | Inputs | Output | C++ function |
| --- | --- | --- | --- |
| **Get Director Global Data** | none | `On Output (FRedwoodGetGlobalDataOutput)` | `GetDirectorGlobalData` |
| **Get Realm Global Data** | none | `On Output (FRedwoodGetGlobalDataOutput)` | `GetRealmGlobalData` |

:::caution Known issue (5.0.0)
Neither node ever fires its output in 5.0.0 (the request is sent without its payload, so the backend doesn't respond).
:::

## Server-Only Nodes: Blobs and SaveGames

These four nodes live in the same folder but **only work on game servers**. Their `Target` is the `URedwoodServerGameSubsystem` (use **Get RedwoodServerGameSubsystem**), and they go through the game server's sidecar, so clients can't call them. See [Blob Storage](../features/data/storage/blob-storage.md).

| Node | Inputs | Output | Notes |
| --- | --- | --- | --- |
| **Put Blob** | `Key`, `Blob` (byte array) | `On Output (FString Error)` | Stores raw bytes under a key. Limited by `realm.instances.<key>.persistence.blobs.max-key-bytes` and `max-blob-bytes`. |
| **Get Blob** | `Key` | `On Output (FRedwoodGetBlobOutput)` | |
| **Put SaveGame** | `Key`, `Save Game` (`USaveGame`) | `On Output (FString Error)` | Serializes the SaveGame and stores it as a blob |
| **Get SaveGame** | `Key` | `On Output (FRedwoodGetSaveGameOutput)` | Loads and deserializes a SaveGame stored with Put SaveGame |
