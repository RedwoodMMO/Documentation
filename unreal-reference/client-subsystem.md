---
sidebar_position: 3
sidebar_label: Client Game Subsystem
---

# Client Game Subsystem

`URedwoodClientGameSubsystem` is the API your game client uses to talk to the Redwood backend: connecting, logging in, picking a realm and character, joining servers, and all of the social features. It's a `UGameInstanceSubsystem`, so there's exactly one per game instance and it **survives map travel**. Your Director and Realm connections, login state, selected character, cached party, and region pings all stay alive while the player is in a match and are still there when they return to the main menu.

If you're building your first main menu, start with [Building the Main Menu](../getting-started/building-the-main-menu.md), which walks through the happy path. This page is the complete reference.

## Getting the Subsystem

**Blueprint:** use the **Get RedwoodClientGameSubsystem** node (available anywhere you have a game instance context, such as widgets, player controllers, and game instances).

**C++:** add `Redwood` to your module's `PublicDependencyModuleNames`, then:

```cpp
#include "RedwoodClientGameSubsystem.h"

URedwoodClientGameSubsystem* Redwood =
  GetGameInstance()->GetSubsystem<URedwoodClientGameSubsystem>();
```

## How the API Is Shaped

- **Blueprint** callers use the [async action nodes](./blueprint-async-nodes.md) for every request/response operation (they have an output exec pin that fires when the backend answers). Simple getters and fire-and-forget calls (e.g. **Is Logged In**, **Set Selected Character**, **Logout**) are regular `UFUNCTION`s on the subsystem.
- **C++** callers call the subsystem functions directly. Each takes a non-dynamic delegate as its last parameter, e.g. `FRedwoodErrorOutputDelegate::CreateLambda(...)`. These C++ functions are not `UFUNCTION`s.
- **Errors** are always reported as a string. An **empty error string means success**. Output structs have an `Error` field; auth and ticketing updates use `Message`.
- Every request checks that the relevant socket (Director or Realm) is connected first, and if not, calls back immediately with `"Not connected to Director."` or `"Not connected to Realm."`.
- **There are no client-side timeouts.** Requests use Socket.IO acknowledgements. If the backend never answers (for example, the feature is disabled in the backend config so the route isn't registered, like guilds with `game.guilds.enabled: false`, or the connection drops mid-request), the callback and its Blueprint node never fire. Add your own timeout UI where it matters.
- Callbacks run on the game thread.

:::tip
In C++, capture `this` with a `TWeakObjectPtr` (or check validity) inside your lambdas. Callbacks can arrive after the widget or actor that made the request was destroyed, and the subsystem's delegates don't unbind themselves.
:::

### Why Not `URedwoodClientInterface`?

`URedwoodClientInterface` is the object that actually owns the Socket.IO connections; the subsystem creates it and forwards to it. **Use the subsystem instead of the interface** because:

1. The interface is only created when the backend is in use. With **Use Backend in PIE** turned off, `GetClientInterface()` returns `nullptr`, while every subsystem function returns sensible stubbed results (see [No-Backend Mode](#no-backend-mode)).
2. The interface's delegates aren't `UPROPERTY`s, so Blueprint can't bind them. The subsystem re-broadcasts them as `BlueprintAssignable` events.
3. The subsystem implements `bAutoConnectToServers` (automatically traveling to a server when the backend assigns one). The interface only broadcasts the request.

A few things are only available on the interface (C++ only, via `Redwood->GetClientInterface()`), which is the one reason to reach for it:

| Interface member | What it's for |
| --- | --- |
| `GetCharacterId()` | The currently selected character's ID. There's no Blueprint getter, so Blueprint games should remember the selected character ID themselves. |
| `GetCharacterName()` | The selected character's name (only if it was in the last `ListCharacters` result) |
| `GetRealmId()` | The connected realm's ID |
| `OnRealmConnectionReestablished` | Fires after the realm connection automatically re-authenticates following an outage |
| `OnRequestToStitchServer` | Fires (with an `FURL`) instead of `OnRequestToJoinServer` when the backend asks the client to "stitch" to a server during a zone transfer |
| `GetConnectionURL()` | The server connection as an `FURL` instead of a console command |
| `GetDirectorConnection()`, `GetRealmConnection()` | The raw `TSharedPtr<FSocketIONative>` sockets |

:::caution Known issue (5.0.0)
Nothing in RedwoodCore binds `OnRequestToStitchServer`, so when the backend sends a stitch request (`shouldStitch: true`) the client doesn't travel unless your game binds `GetClientInterface()->OnRequestToStitchServer` itself.
:::

## Events

Bind these on the subsystem (Blueprint: drag off the subsystem and search for the event name, or use **Bind Event to ...**; C++: `AddDynamic`).

| Event | Signature | When it fires |
| --- | --- | --- |
| `OnDirectorConnectionLost` | no params | Once per outage, when an established Director connection drops. `IsLoggedIn()` becomes `false` at this point. |
| `OnDirectorConnectionReestablished` | no params | After the Director socket reconnects **and** the automatic re-login succeeds |
| `OnRealmConnectionLost` | no params | Once per outage, when an established Realm connection drops. The client automatically reconnects and re-authenticates in the background. |
| `OnRequestToJoinServer` | `(FString ConsoleCommand)` | When the backend assigns this client a server, **only if** `bAutoConnectToServers` is `false` in the [project settings](./settings.md). Execute the command (optionally appending your own `?key=value` options) to travel. |
| `OnPingsReceived` | no params | After each round of region pings completes. Use it to know when `GetRegions()` has data. |
| `OnPartyInvited` | `(FRedwoodPartyInvite Invite)` | Another player invited this player to their party |
| `OnPartyUpdated` | `(FRedwoodParty Party)` | The player's party changed in any way (members, leader, loot type, data) |
| `OnPartyKicked` | no params | The player was kicked from their party |
| `OnPartyEmoteReceived` | `(const FString& PlayerId, const FString& Emote)` | A party member sent an emote with `SendEmoteToParty` |

There are no push events for friends, guilds, alliances, or realm contacts; use the list functions to refresh those. Ticketing progress is delivered to the delegate you pass to the join call, not to a subsystem event. Text chat events live in the [RedwoodChat plugin](./optional-plugins.md).

## Connection and Lifecycle

### `InitializeDirectorConnection`

```cpp
void InitializeDirectorConnection(FRedwoodSocketConnectedDelegate OnDirectorConnected);
```

**Blueprint:** **Initialize Director Connection** → `On Output (FRedwoodSocketConnected Details)`

Connects to the Director Frontend at the `DirectorUri` [project setting](./settings.md#project-settings) (default `ws://localhost:3001`, optionally overridden by a `redwood.json` file). Call it **once per game session**, usually from your title screen.

- Calls back with an empty `Error` once connected.
- If the connection later drops, the socket reconnects automatically and **logs the player back in automatically** using their auth token. `OnDirectorConnectionLost` and `OnDirectorConnectionReestablished` bracket the outage.
- Reconnect backoff starts at 5 seconds and grows by 1.5x per attempt up to 25 seconds, retrying forever.

:::caution Known issue (5.0.0)
The callback only fires on **success**. If the Director is unreachable, the socket keeps retrying forever and the callback (and Blueprint node) never fires. Show a "Connecting..." state with your own timeout.

Calling this function a second time creates a new socket without closing the old one. Keep your own "director initialized" flag (for example on your game instance) rather than relying on `IsDirectorConnected()`, which is `false` while the socket is reconnecting.
:::

### `IsDirectorConnected`

```cpp
UFUNCTION(BlueprintPure) bool IsDirectorConnected();
```

`true` when the Director socket exists and is currently connected. `false` during a reconnect outage.

### `GetConnectionConsoleCommand`

```cpp
UFUNCTION(BlueprintCallable) FString GetConnectionConsoleCommand();
```

Returns the console command for the most recent server assignment, in the form:

```
open <ip>:<port>?RedwoodAuth=1?CharacterId=<selected-character-id>?PlayerId=<player-id>?Token=<one-time-token>
```

(The order of the `?` options isn't guaranteed.) The game server's Redwood game mode validates `RedwoodAuth`, `PlayerId`, `CharacterId`, and `Token` when the player logs in; see [Game Framework](./game-framework.md). Returns an empty string (and logs an error) if there's no assignment yet or no character is selected. Returns an empty string in no-backend mode.

### How Server Travel Works

1. When a matchmaking ticket finds a match, a queue admits the player, a [Join Proxy with Single Instance](#joinproxywithsingleinstance) succeeds, or a [Create Proxy](#createproxy) with `bJoinSession` finishes, the Realm pushes a server assignment (`realm:servers:connect-to-instance`) with the server's `ip:port` and a one-time token. Party members included in the leader's ticket get the same push.
2. If `bAutoConnectToServers` is `true` (the default), the subsystem immediately executes the `open ...` command above.
3. If it's `false`, the subsystem broadcasts `OnRequestToJoinServer(ConsoleCommand)` and your game decides when to execute it (e.g. after a "Match found!" animation).

When the player leaves the server (or the server ends), they return to your game's default/menu map like any Unreal client disconnect. The subsystem's state is intact, so your menu should check `IsDirectorConnected()`, `IsLoggedIn()`, and `IsRealmConnected()` and skip the steps that are already done.

## Authentication

See [Authentication](../features/authentication/overview.md) for configuring the providers in the backend.

### `Login`

```cpp
void Login(
  const FString& Username,
  const FString& PasswordOrToken,
  const FString& Provider,   // "local", "jwt", ...
  bool bRememberMe,
  FRedwoodAuthUpdateDelegate OnUpdate);
```

**Blueprint:** **Login** (Username, Password, bRememberMe, Provider = `"local"`) → `On Update (FRedwoodAuthUpdate)`

Logs in with a username (or email, depending on `auth.local.account-type`) and password. The provider must be in the backend's `auth.allowed-providers`.

- `Type == Success`: the player is logged in. If `bRememberMe` is `true`, the username and auth token are written to the `RedwoodSaveGame` save slot (user index 0) for [Attempt Auto-Login](#attemptautologin); if it's `false`, any previously remembered credentials are cleared.
- `Type == MustVerifyAccount`: the account needs [email verification](../features/authentication/local.md). The node stays alive and fires again with `Success` once the player clicks the link.
- `Type == Error`: `Message` has the reason (e.g. `Invalid username or password`). Remembered credentials are cleared.

For [JWT authentication](../features/authentication/jwt.md), call Login with `Provider = "jwt"`, any non-empty `Username`, and the JWT as the `Password`.

:::caution Known issue (5.0.0)
Logging into an account that hasn't verified its email returns `Type == Error` with `Message == "Must verify email"` instead of `MustVerifyAccount`. Check for that message if you use email verification.
:::

### `Register`

```cpp
void Register(const FString& Username, const FString& Password, FRedwoodAuthUpdateDelegate OnUpdate);
```

**Blueprint:** **Register** (Username, Password) → `On Update (FRedwoodAuthUpdate)`

Creates a local account. Fails if `local` isn't in `auth.allowed-providers` (`"Registration is disabled; please login with the supported authentication providers"`), if the username is taken (`"User already registered"`), or if it's not a valid email when `auth.local.account-type` is `email`.

- `MustVerifyAccount` means a verification email was sent. The node stays alive and fires `Success` after the player verifies.
- **A successful registration does not log the player in.** Call `Login` with the same credentials afterwards (also after the verification `Success`).

### `AttemptAutoLogin`

```cpp
void AttemptAutoLogin(FRedwoodAuthUpdateDelegate OnUpdate);
```

**Blueprint:** **Attempt Auto-Login** → `On Update (FRedwoodAuthUpdate)`

Reads the `RedwoodSaveGame` slot and, if it has a saved username and auth token, logs in with them. Returns `Type == Error` with `"No saved credentials found."` if nothing was remembered. Requires a Director connection. Call this right after connecting to skip the login form for returning players.

:::note
The auth token is stored in plain text in the platform's save game location.
:::

### `LoginWithDiscord` and `LoginWithTwitch`

```cpp
void LoginWithDiscord(bool bRememberMe, FRedwoodAuthUpdateDelegate OnUpdate);
void LoginWithTwitch(bool bRememberMe, FRedwoodAuthUpdateDelegate OnUpdate);
```

**Blueprint:** **Login with Discord** / **Login with Twitch** (bRememberMe) → `On Update`

Opens the system browser to the provider's OAuth page, then waits (up to 5 minutes on the backend) for the player to finish. The provider must be enabled in `auth.allowed-providers` and configured as described in [Discord](../features/authentication/discord.md) and [Twitch](../features/authentication/twitch.md). If the backend returns a redirect URL that doesn't belong to the Director, the login is canceled with `"Login canceled: server returned an unexpected redirect URL."`.

Steam and Epic logins come from the [RedwoodSteam and RedwoodEOS plugins](./optional-plugins.md).

### `Logout`

```cpp
UFUNCTION(BlueprintCallable) void Logout();
```

Only does something if `IsLoggedIn()`. Tells the Director and Realm the player logged out, disconnects the Realm socket, clears the player ID and auth token, and clears remembered credentials. The Director socket stays connected, so you can show the login form again right away. After logging back in, connect to a realm again.

### Other Auth Functions

| Function | Blueprint | Description |
| --- | --- | --- |
| `bool IsLoggedIn()` | Pure | `true` when the player has a player ID, an auth token, and an authenticated Director connection. Goes `false` during a Director outage and back to `true` after the automatic re-login. |
| `FString GetPlayerId()` | Pure | The player's `PlayerIdentity` ID |
| `FString GetNickname()` | Pure | The player's display name from the login response |
| `void CancelWaitingForAccountVerification()` | Callable | Stops listening for the account-verified notification (use when the player backs out of the "check your email" screen) |

## Realms

See [Realms](../features/realms.md) for what realms are and how to configure them.

### `ListRealms`

```cpp
void ListRealms(FRedwoodListRealmsOutputDelegate OnOutput);
```

**Blueprint:** **List Realms** → `On Output (FRedwoodListRealmsOutput)`

Returns every realm with `listed: true` in its realm instance config. Show them to the player, or pick one automatically.

### `InitializeRealmConnection`

```cpp
void InitializeRealmConnection(FRedwoodRealm InRealm, FRedwoodSocketConnectedDelegate OnRealmConnected);
```

**Blueprint:** **Initialize Realm Connection** (Realm) → `On Output (FRedwoodSocketConnected)`

Connects to a realm. Requires the player to be logged in (`"Not connected or authenticated to Director."` otherwise). The client asks the Director for a realm token, connects to the realm's `Uri`, and authenticates with the token. An empty `Error` means connected and authenticated. Errors include `"Realm not found"` and `"Realm is in maintenance: <message>"`.

A player can only be connected to one realm at a time. Once connected, the Realm sends its list of regions and the client starts [pinging them](#getregions).

If the realm connection drops, the client reconnects and re-authenticates automatically. Note that the backend removes a player from matchmaking queues and from their party when their realm connection drops.

:::caution Known issue (5.0.0)
Like the Director connection, the callback only fires on success; an unreachable realm retries forever. Calling it again while already connected creates a second socket, and the backend treats the new connection as replacing the old one (removing the player from their party and any ticket). Check `IsRealmConnected()` first.
:::

### `InitializeConnectionForFirstRealm`

```cpp
void InitializeConnectionForFirstRealm(FRedwoodSocketConnectedDelegate OnRealmConnected);
```

**Blueprint:** **Initialize Connection For First Realm** → `On Output (FRedwoodSocketConnected)`

Shortcut for single-realm games: lists the realms and connects to the first one. Returns `"No realms found."` if there are none.

### `IsRealmConnected`

```cpp
UFUNCTION(BlueprintPure) bool IsRealmConnected(FRedwoodRealm& OutRealm);
bool IsRealmConnected();
```

`true` when the realm socket is connected. The Blueprint version also outputs the connected `FRedwoodRealm`.

### `GetRegions`

```cpp
UFUNCTION(BlueprintCallable) TMap<FString, float> GetRegions();
```

Returns each region name (the keys you pass to `JoinMatchmaking`) mapped to the best round-trip time measured in the latest ping round. Which regions exist depends on the realm's [game server provider](../features/game-servers/hosting/overview.md): `local` has a single region named `Local`; `agones` has one region per realm, named by `deployment.kubernetes.instances.<id>.region.name` for the realm's Kubernetes cluster; `edgegap` has one region per Edgegap location beacon (named by city). The client pings each region `PingAttempts` times every `PingFrequency` seconds (see [settings](./settings.md#project-settings)) and keeps the minimum. Regions that have never answered a ping aren't in the map yet. Bind `OnPingsReceived` to know when values arrive.

:::caution Known issue (5.0.0)
The values are in **seconds**, not milliseconds (e.g. `0.035` for 35 ms).
:::

## Characters

Characters (`PlayerCharacter` in the database) belong to a realm, so these functions require a realm connection. See [Player Data](../features/data/game/player-data.md) for what each data field is for.

| Function | Blueprint node | Description |
| --- | --- | --- |
| `ListCharacters(FRedwoodListCharactersOutputDelegate)` | **List Characters** | The player's non-archived characters in this realm |
| `ListArchivedCharacters(FRedwoodListCharactersOutputDelegate)` | **List Archived Characters** | The player's archived characters (see `realm.instances.<key>.characters.archival-period-days`) |
| `CreateCharacter(FString Name, USIOJsonObject* CharacterCreatorData, FRedwoodGetCharacterOutputDelegate)` | **Create Character** | Creates a character and returns it. Does **not** select it. |
| `GetCharacterData(FString CharacterIdOrName, FRedwoodGetCharacterOutputDelegate)` | **Get Character Data** | Gets a character by ID or name. Full data is only returned for the player's own characters. |
| `SetCharacterData(FString CharacterId, FString Name, USIOJsonObject* CharacterCreatorData, FRedwoodGetCharacterOutputDelegate)` | **Set Character Data** | Changes the name and/or character creator data. Pass an empty `Name` or a null object to leave that field unchanged. |
| `SetCharacterArchived(FString CharacterId, bool bArchived, FRedwoodErrorOutputDelegate)` | **Set Character Archived** | Archives ("soft deletes") or restores a character |
| `SetSelectedCharacter(FString CharacterId)` | Callable function | Selects the character the player will play |

Notes:

- `CreateCharacter` requires a non-null `CharacterCreatorData` (`"Character creator data is required."`). Convert your character creator struct with **Struct To Json Object** (Blueprint) or `USIOJConvert::ToJsonObject` (C++); an empty object from **Construct Json Object** works if you don't have creator data. See [Types](./types.md#working-with-usiojsonobject).
- Clients can only change the name and `characterCreatorData`. Everything else (metadata, inventory, progress, data, ability system) is written by game servers, so players can't cheat it. Whether players can change creator data after creation is controlled by `realm.instances.<key>.characters.players-can-update-character-creator-data` (`always`, `initial`, or `never`).
- **Call `SetSelectedCharacter` before** joining matchmaking, queues, or proxies, creating a proxy with `bJoinSession`, using parties, or using realm contacts. Those calls fail with messages like `"Please select a character before joining matchmaking."` otherwise. The selection is stored locally and sent along with the server join so the game server loads the right character. There's no Blueprint getter for the selected character, so keep the ID yourself. It's safe to call again when the player returns to the menu.

## Servers (Proxies)

In Redwood, the thing a player "joins" is a [GameServerProxy](../architecture/game-servers.md#gameserverproxy): a persistent handle for a lobby, match, or world that may have one or more running game servers behind it. See [Ticketing](../features/ticketing/overview.md) and [Game Servers](../architecture/game-servers.md).

### `ListProxies`

```cpp
void ListProxies(TArray<FString> PrivateProxyReferences, FRedwoodListProxiesOutputDelegate OnOutput);
```

**Blueprint:** **List Proxies** (PrivateProxyReferences) → `On Output (FRedwoodListProxiesOutput)`

Returns the active proxies that are public, owned by this player, or whose ID or short code is in `PrivateProxyReferences` (useful for a "favorite private servers" list). Use it for a server browser.

### `CreateProxy`

```cpp
void CreateProxy(bool bJoinSession, FRedwoodCreateProxyInput Parameters, FRedwoodCreateProxyOutputDelegate OnOutput);
```

**Blueprint:** **Create Proxy** (bJoinSession, Parameters) → `On Output (FRedwoodCreateProxyOutput)`

Creates a proxy (for example, a player-hosted lobby) from a [game profile](../configuration/game-modes-and-maps.md#profiles). See [`FRedwoodCreateProxyInput`](./types.md#servers) for the parameters.

- With `bJoinSession = true`, a character must be selected, and the player automatically travels to the server once it's ready.
- With `bJoinSession = false`, use the returned `ProxyReference` with `JoinProxyWithSingleInstance` or `JoinQueue` later.
- Errors: `"Server creation by players is disabled for this realm."` (`realm.instances.<key>.game-servers.allow-player-creation: false`, admins are exempt), `"Invalid modeId"` (no profile with that ID), `"Proxy with same name already exists"`, and `"Only admins can start servers on boot"`.

### `JoinProxyWithSingleInstance`

```cpp
void JoinProxyWithSingleInstance(FString ProxyReference, FString Password, FRedwoodJoinServerOutputDelegate OnOutput);
```

**Blueprint:** **Join Proxy with Single Instance** (ProxyReference, Password) → `On Output (FRedwoodJoinServerOutput)`

Joins a proxy that has a single game server (e.g. a lobby or match). `ProxyReference` is the proxy's ID or short code. Starts the server if it isn't running. On success the player travels automatically. For multi-zone or sharded worlds, use [`JoinQueue`](#joinqueue) instead.

### `StopProxy`

```cpp
void StopProxy(FString ServerProxyId, FRedwoodErrorOutputDelegate OnOutput);
```

**Blueprint:** **Stop Proxy** (ServerProxyId) → `On Output (FString Error)`

Stops the proxy's game servers. Only the proxy's owner or an admin can do this.

## Ticketing and Regions

All three join functions report progress through a single `FRedwoodTicketingUpdate` delegate, which may fire several times:

1. `Type == JoinResponse`: the backend answered the request. An **empty** `Message` means the ticket was accepted; a non-empty `Message` means it was rejected and no more updates will come.
2. `Type == Update`: status text from the backend (zero or more times).
3. Either `Type == TicketError` (the ticket failed; `Message` has the reason) **or** the player is assigned a server and [travels](#how-server-travel-works). No final update is sent on success.

Only one ticket can be active at a time. Starting a new join replaces the previous delegate. See [Ticketing](../features/ticketing/overview.md).

### `JoinMatchmaking`

```cpp
void JoinMatchmaking(FString ProfileId, TArray<FString> InRegions, FRedwoodTicketingUpdateDelegate OnUpdate);
```

**Blueprint:** **Join Matchmaking** (ProfileId, Regions) → `On Update (FRedwoodTicketingUpdate)`

Starts matchmaking for the [game profile](../configuration/game-modes-and-maps.md#profiles) `ProfileId` (the profile needs `matchmaking-zone-name`). `InRegions` are the region names (keys of `GetRegions()`) the player is willing to play in; their measured pings are sent along automatically. Requires a selected character.

:::caution Known issue (5.0.0)
The request waits until **every** region has a ping result, retrying every 2 seconds. If a region never answers pings, the request is never sent and the delegate never fires. Wait for `OnPingsReceived` before enabling your matchmaking button.
:::

### `JoinQueue`

```cpp
void JoinQueue(FString ProxyId, FString ZoneName, bool bTransferWholeParty, FRedwoodTicketingUpdateDelegate OnUpdate);
```

**Blueprint:** **Join Queue** (ProxyId, ZoneName, bTransferWholeParty) → `On Update (FRedwoodTicketingUpdate)`

Queues to join a specific proxy (e.g. a persistent world) in the given zone. `ZoneName` must be one of the zone names in the proxy's [game profile](../configuration/game-modes-and-maps.md#profiles); it isn't filled in for you. If it's empty or doesn't exist, the backend logs an error and the ticket never completes. `bTransferWholeParty` brings the player's party along; only the party leader can do this (`"Only the party leader can start queuing; leave the party to join solo"`). Requires a selected character. See [Queuing](../features/ticketing/queuing.md).

:::caution Known issue (5.0.0)
Calling Join Queue before the realm connection exists crashes the client. Make sure `IsRealmConnected()` is `true` first.
:::

### `JoinCustom`

```cpp
void JoinCustom(bool bTransferWholeParty, TArray<FString> InRegions, FRedwoodTicketingUpdateDelegate OnUpdate);
```

**Blueprint:** **Join Custom** (bTransferWholeParty, Regions) → `On Update`

Starts a ticket handled by your own [custom ticketing logic](../features/ticketing/custom.md) in the backend. Requires a selected character, and waits for pings like `JoinMatchmaking`.

### `LeaveTicketing`

```cpp
void LeaveTicketing(FRedwoodErrorOutputDelegate OnOutput);
```

**Blueprint:** **Leave Ticketing** → `On Output (FString Error)`

Cancels the player's current matchmaking, queue, or custom ticket.

## Parties

Parties are realm-scoped and require a selected character for most calls. See [Parties](../features/social/parties.md).

| Function | Blueprint | Description |
| --- | --- | --- |
| `FRedwoodParty GetCachedParty()` | Pure | The last known party. `bValid == false` means the player isn't in a party. Updated by `GetOrCreateParty`, `LeaveParty`, and the party events. |
| `GetOrCreateParty(bool bCreateIfNotInParty, FRedwoodGetPartyOutputDelegate)` | **Get or Create Party** | Gets the player's party, creating one if `bCreateIfNotInParty` is `true`. Without creation and not in a party, succeeds with `Party.bValid == false`. |
| `LeaveParty(FRedwoodErrorOutputDelegate)` | **Leave Party** | Leaves the current party |
| `InviteToParty(FString TargetPlayerId, FRedwoodErrorOutputDelegate)` | **Invite to Party** | Invites a player (by **player** ID, not character ID) |
| `ListPartyInvites(FRedwoodListPartyInvitesOutputDelegate)` | **List Party Invites** | Pending invites for this player |
| `RespondToPartyInvite(FString PartyId, bool bAccept, FRedwoodGetPartyOutputDelegate)` | **Respond to Party Invite** | Accepts or declines. Pass `FRedwoodPartyInvite.Id` (the party's ID). |
| `PromoteToPartyLeader(FString TargetPlayerId, FRedwoodErrorOutputDelegate)` | **Promote to Party Leader** | Leader only |
| `KickFromParty(FString TargetPlayerId, FRedwoodErrorOutputDelegate)` | **Kick from Party** | Leader only |
| `SetPartyData(FString LootType, USIOJsonObject* PartyData, FRedwoodGetPartyOutputDelegate)` | **Respond to Party Invite** (see below) | Sets the party's free-form loot type string and/or custom JSON data. Empty/null values are left unchanged. |
| `SendEmoteToParty(FString Emote)` | Callable function | Sends a free-form emote string to party members (received via `OnPartyEmoteReceived`) |

:::caution Known issue (5.0.0)
The Set Party Data async node is mislabeled **Respond to Party Invite** in the Blueprint palette, so two nodes share that name. The Set Party Data one has `Loot Type` and `Party Data` inputs.
:::

## Friends and Player Search

Friends are Director-scoped (shared across realms) and use **player** IDs. See [Friends](../features/social/friends.md).

| Function | Blueprint node | Description |
| --- | --- | --- |
| `SearchForPlayers(FString UsernameOrNickname, bool bIncludePartialMatches, FRedwoodListPlayersOutputDelegate)` | **Search For Players** | Finds players by username or nickname |
| `SearchForPlayerById(FString TargetPlayerId, FRedwoodPlayerOutputDelegate)` | (C++ only) | Looks up one player by ID |
| `ListFriends(ERedwoodFriendListType Filter, FRedwoodListPlayersOutputDelegate)` | **List Friends** | Lists friends; `FRedwoodPlayer` includes online/playing state |
| `RequestFriend(FString OtherPlayerId, FRedwoodErrorOutputDelegate)` | **Request Friend** | Sends a friend request |
| `RemoveFriend(FString OtherPlayerId, FRedwoodErrorOutputDelegate)` | **Remove Friend** | Removes a friend |
| `RespondToFriendRequest(FString OtherPlayerId, bool bAccept, FRedwoodErrorOutputDelegate)` | **Respond To Friend Request** | Accepts or declines a request |
| `SetPlayerBlocked(FString OtherPlayerId, bool bBlocked, FRedwoodErrorOutputDelegate)` | **Set Player Blocked** | Blocks or unblocks a player |

:::caution Known issue (5.0.0)
`ListFriends` only works with the `All` filter; the other filters are rejected by the backend. List `All` and filter on each player's `FriendshipState` yourself.
:::

## Realm Contacts

Realm contacts are a per-character contact/block list scoped to the realm, using **character** IDs. Requires a selected character. See [Realm Contacts](../features/social/realm-contacts.md).

| Function | Blueprint node | Description |
| --- | --- | --- |
| `ListRealmContacts(FRedwoodListRealmContactsOutputDelegate)` | **List Realm Contacts** | Contacts and blocked contacts for the selected character |
| `AddRealmContact(FString OtherCharacterId, bool bBlocked, FRedwoodErrorOutputDelegate)` | **Add Realm Contact** | Adds (or blocks) a character |
| `RemoveRealmContact(FString OtherCharacterId, FRedwoodErrorOutputDelegate)` | **Remove Realm Contact** | Removes a contact |

:::caution Known issue (5.0.0)
`AddRealmContact` doesn't send the `description` field the backend requires, so it fails validation.
:::

## Guilds and Alliances

Guilds are stored in the Director. By default they're shared across realms and use **player** IDs; if `game.guilds.scoped-to-realm` is `true`, membership is per character, the player must be connected to a realm, and `TargetPlayerId` parameters accept a **character ID or character name**. If `game.guilds.enabled` is `false`, these calls never get a response. See [Guilds and Alliances](../features/social/guilds-alliances.md).

### Guilds

| Function | Blueprint node | Description |
| --- | --- | --- |
| `ListGuilds(bool bOnlyPlayersGuilds, FRedwoodListGuildsOutputDelegate)` | **List Guilds** | All listed guilds, or only the player's |
| `SearchForGuilds(FString SearchText, bool bIncludePartialMatches, FRedwoodListGuildsOutputDelegate)` | **Search for Guilds** | Searches by name/tag |
| `GetGuild(FString GuildId, FRedwoodGetGuildOutputDelegate)` | **Get Guild** | One guild plus the player's membership state and alliances |
| `GetSelectedGuild(FRedwoodGetGuildOutputDelegate)` | **Get Selected Guild** | The guild whose tag the player displays |
| `SetSelectedGuild(FString GuildId, FRedwoodErrorOutputDelegate)` | **Set Selected Guild** | Sets the displayed guild |
| `JoinGuild(FString GuildId, FRedwoodErrorOutputDelegate)` | **Join Guild** | Joins a public guild or accepts an invite |
| `InviteToGuild(FString GuildId, FString TargetPlayerId, FRedwoodErrorOutputDelegate)` | **Invite To Guild** | Invites a player (permission depends on the guild's invite type) |
| `LeaveGuild(FString GuildId, FRedwoodErrorOutputDelegate)` | **Leave Guild** | Leaves a guild |
| `ListGuildMembers(FString GuildId, ERedwoodGuildAndAllianceMemberState State, FRedwoodListGuildMembersOutputDelegate)` | **List Guild Members** | Members in a given state (e.g. `Member`, `Invited`, `Banned`, `Admin`) |
| `CreateGuild(FString GuildName, FString GuildTag, ERedwoodGuildInviteType InviteType, bool bListed, bool bMembershipPublic, FRedwoodCreateGuildOutputDelegate)` | **Create Guild** | Creates a guild (if `game.guilds.allow-guild-creation`) and returns its ID |
| `UpdateGuild(FString GuildId, FString GuildName, FString GuildTag, ERedwoodGuildInviteType InviteType, bool bListed, bool bMembershipPublic, FRedwoodErrorOutputDelegate)` | **Update Guild** | Guild admins only. All fields are sent. |
| `KickPlayerFromGuild(FString GuildId, FString TargetPlayerId, FRedwoodErrorOutputDelegate)` | **Kick Player From Guild** | Guild admins only |
| `BanPlayerFromGuild(...)` | **Ban Player From Guild** | Guild admins only |
| `UnbanPlayerFromGuild(...)` | **Unban Player From Guild** | Guild admins only |
| `PromotePlayerToGuildAdmin(...)` | **Promote Player To Guild Admin** | Guild admins only |
| `DemotePlayerFromGuildAdmin(...)` | **Demote Player From Guild Admin** | Guild admins only |

### Alliances

| Function | Blueprint node | Description |
| --- | --- | --- |
| `ListAlliances(FString GuildIdFilter, FRedwoodListAlliancesOutputDelegate)` | **List Alliances** | All alliances, or those related to one guild (then `GuildStates` is filled) |
| `SearchForAlliances(FString SearchText, bool bIncludePartialMatches, FRedwoodListAlliancesOutputDelegate)` | **Search for Alliances** | Searches by name |
| `CanAdminAlliance(FString AllianceId, FRedwoodErrorOutputDelegate)` | **Can Admin Alliance** | Empty error means the player can administer the alliance |
| `CreateAlliance(FString AllianceName, FString GuildId, bool bInviteOnly, FRedwoodCreateAllianceOutputDelegate)` | **Create Alliance** | Creates an alliance owned by the guild (if `game.guilds.alliances.allow-alliance-creation`) |
| `UpdateAlliance(FString AllianceId, FString AllianceName, bool bInviteOnly, FRedwoodErrorOutputDelegate)` | **Update Alliance** | Alliance admins only |
| `KickGuildFromAlliance(FString AllianceId, FString GuildId, FRedwoodErrorOutputDelegate)` | **Kick Guild From Alliance** | Alliance admins only |
| `BanGuildFromAlliance(FString AllianceId, FString GuildId, FRedwoodErrorOutputDelegate)` | **Ban Guild From Alliance** | Alliance admins only |
| `UnbanGuildFromAlliance(FString AllianceId, FString GuildId, FRedwoodErrorOutputDelegate)` | **Unban Guild From Alliance** | Alliance admins only |
| `ListAllianceGuilds(FString AllianceId, ERedwoodGuildAndAllianceMemberState State, FRedwoodListAllianceGuildsOutputDelegate)` | **List Alliance Guilds** | Guilds in a given state |
| `JoinAlliance(FString AllianceId, FString GuildId, FRedwoodErrorOutputDelegate)` | **Join Alliance** | Joins an open alliance or accepts an invite on behalf of a guild |
| `LeaveAlliance(FString AllianceId, FString GuildId, FRedwoodErrorOutputDelegate)` | **Leave Alliance** | |
| `InviteGuildToAlliance(FString AllianceId, FString GuildId, FRedwoodErrorOutputDelegate)` | **Invite Guild To Alliance** | |

:::caution Known issue (5.0.0)
`BanGuildFromAlliance` sends the wrong field name and fails backend validation. The **Unban Guild From Alliance** Blueprint node passes its two IDs in swapped order (the C++ function works).
:::

## Global Data

[Global data](../features/data/game/global-data.md) is admin-authored JSON that every player can read.

| Function | Blueprint node | Description |
| --- | --- | --- |
| `GetDirectorGlobalData(FRedwoodGetGlobalDataOutputDelegate)` | **Get Director Global Data** | The latest Director-wide global data |
| `GetRealmGlobalData(FRedwoodGetGlobalDataOutputDelegate)` | **Get Realm Global Data** | The latest global data for the connected realm |

:::caution Known issue (5.0.0)
Both functions send their request without its payload, so the backend never responds and the callback never fires (in no-backend mode they also never call back).
:::

## No-Backend Mode

When **Use Backend in PIE** is off (the default; see [Editor Preferences](./settings.md#editor-preferences)) and you're playing in PIE, the subsystem doesn't connect to anything and returns stubbed results so your menus still work. Standalone and packaged games always use the backend. See [Running without the Backend](../getting-started/running-without-backend.md) for the workflow.

| Area | Behavior with the backend disabled |
| --- | --- |
| `InitializeDirectorConnection`, `InitializeRealmConnection`, `InitializeConnectionForFirstRealm` | Succeed immediately |
| `IsDirectorConnected`, `IsLoggedIn`, `IsRealmConnected` | `true` |
| `Login`, `AttemptAutoLogin`, `LoginWithDiscord`, `LoginWithTwitch` | Succeed immediately with any input |
| `Register` | Error: just log in with any credentials instead |
| `GetNickname` / `GetPlayerId` | `"PIE Player"` / empty |
| `ListRealms` | One fake realm named `Local PIE Realm` |
| `GetRegions` | A single `Local` region with a ping of `0` |
| `ListCharacters`, `CreateCharacter`, `GetCharacterData`, `SetCharacterData` | Read/write JSON files in `YourProject/Saved/Persistence/Characters/<id>.json`, with IDs `000`, `001`, and so on. `GetCharacterData` only accepts the ID. |
| `ListProxies` | Empty list |
| Ticketing, proxies, parties, friends, contacts, guilds | Return an error string |
| `GetCachedParty` | Invalid party |
| `GetConnectionConsoleCommand` | Empty string |

You can check the mode yourself with `URedwoodCommonGameSubsystem::ShouldUseBackend(World)` (Blueprint: **Should Use Backend**).
