---
sidebar_position: 6
---

# Building the Main Menu

The title screen (or main menu, or frontend; whatever your game calls it) is where most of the client-side Redwood integration lives. This page walks through the full flow:

1. [Connect to the Director](#1-connect-to-the-director)
1. [Log in or register](#2-log-in-or-register)
1. [Connect to a realm](#3-connect-to-a-realm)
1. [Pick or create a character](#4-pick-or-create-a-character)
1. [Join a server](#5-join-a-server)

We'll also cover [returning to the menu after a match](#returning-to-the-menu) and [handling lost connections](#handling-lost-connections).

You don't need a fancy UI to get started. A widget with a few text boxes and buttons is plenty to test the whole loop; you can make it pretty later.

:::note
The examples on this page are in C++. Every function used here is also available in Blueprints under the same name (request/response functions are async nodes that take the subsystem as their **Target**); see the [Blueprint async nodes reference](../unreal-reference/blueprint-async-nodes.md).
:::

## The Client Subsystem

Everything on this page goes through the **Redwood Client Game Subsystem** (`URedwoodClientGameSubsystem`). It's a Game Instance Subsystem, so there's exactly one, it exists as soon as the game starts, and it **survives map travel**. Your login, realm connection, and selected character stay intact when the player goes into a match and comes back.

```cpp
#include "RedwoodClientGameSubsystem.h"

// The examples below keep it in a member variable named Redwood
// (UPROPERTY() URedwoodClientGameSubsystem* Redwood;)
Redwood = GetGameInstance()->GetSubsystem<URedwoodClientGameSubsystem>();
```

Most operations take a delegate that's called when the backend responds, e.g. `FRedwoodListRealmsOutputDelegate::CreateLambda(...)`. Callbacks run on the game thread. Use `CreateWeakLambda(this, ...)` (or capture a `TWeakObjectPtr`) in real code, since a response can arrive after a widget is destroyed.

Use `URedwoodClientGameSubsystem` rather than `URedwoodClientInterface`. The interface is the raw implementation; the subsystem wraps it with the no-backend stubs used by [Running without the Backend](./running-without-backend.md), exposes the events to Blueprints, and handles automatically traveling to servers.

**Errors are reported as strings.** Almost every response struct has an `Error` field (or a `Message` field for auth and ticketing updates). An empty string means success.

The full list of functions and events is in the [Client Game Subsystem reference](../unreal-reference/client-subsystem.md).

## 1. Connect to the Director

The [Director](../architecture/overview.md#director) handles accounts and the list of realms. Connect once when the game starts (e.g. in your title widget's `NativeConstruct` or your Game Instance's `Init`) with `InitializeDirectorConnection`. It connects to the **Director Uri** from [Project Settings](./setting-up-unreal.md#project-settings).

```cpp
Redwood->InitializeDirectorConnection(
  FRedwoodSocketConnectedDelegate::CreateWeakLambda(
    this, [this](const FRedwoodSocketConnected& Result) {
      // Connected; enable the login and register buttons
    }));
```

A few important behaviors:

- **Only call it once per game session.** Each call creates a new connection without closing the old one. Keep a flag (on your Game Instance is a good spot) so you don't call it again when the player comes back to the menu.
- **The callback only fires on success.** If the Director can't be reached, Redwood keeps retrying in the background (with a delay that grows from 5 to 25 seconds) and the callback simply doesn't fire yet. Show a "Connecting..." state, and add your own timeout if you want to show an error after a while.
- You can check the current state any time with `IsDirectorConnected()`.

:::tip
If you're stuck on "Connecting...", make sure the backend is running (and finished starting; look for `All services ready`), nothing else is using port `3001`, and your **Director Uri** matches the backend. See [Running with the Backend](./running-with-backend.md#troubleshooting).
:::

## 2. Log in or Register

### Remembered logins

Before showing a login form, try `AttemptAutoLogin`. If the player previously logged in with `bRememberMe`, Redwood saved their credentials in a `RedwoodSaveGame` save slot, and this logs them in without asking. If there's nothing saved, it reports an `Error` with the message `No saved credentials found.`, and you show the form.

### Username and password

Call `Login` with the username, password, provider (`local` for username/password accounts), and the **Remember Me** choice. Call `Register` to create an account.

Both report progress through a `FRedwoodAuthUpdate` struct with a `Type` and a `Message`:

| `Type` | Meaning |
| --- | --- |
| `Success` | Done. `Message` is empty. |
| `MustVerifyAccount` | The account must be verified by email first (only when [email verification](../features/authentication/local.md#configuration) is enabled). The same callback fires again with `Success` once the player clicks the link in their email. |
| `Error` | Something went wrong; show `Message` to the player (e.g. `Invalid username or password`). |

```cpp
Redwood->Login(Username, Password, TEXT("local"), bRememberMe,
  FRedwoodAuthUpdateDelegate::CreateWeakLambda(
    this, [this](const FRedwoodAuthUpdate& Update) {
      switch (Update.Type) {
        case ERedwoodAuthUpdateType::Success:
          ConnectToRealm();
          break;
        case ERedwoodAuthUpdateType::MustVerifyAccount:
          ShowMessage(TEXT("Check your email to verify your account"));
          break;
        default:
          ShowMessage(Update.Message);
          break;
      }
    }));
```

:::warning Registering doesn't log in
A successful `Register` creates the account but doesn't log the player in. Call `Login` with the same credentials afterwards. The same goes for the second `Success` after email verification. If the player backs out while waiting for verification, call `CancelWaitingForAccountVerification()`.
:::

By default, accounts use usernames. You can switch to email addresses, require verification, or turn on other providers in the [authentication config](../features/authentication/local.md).

### Other login providers

Redwood supports several other providers. Each needs the provider added to the backend's `auth.allowed-providers` list:

| Provider | How to log in | Docs |
| --- | --- | --- |
| Steam | `URedwoodSteamClientInterface::LoginWithSteam` from the `RedwoodSteam` plugin | [Steam](../features/authentication/steam.md) |
| Epic Online Services | `URedwoodEOSClientInterface::LoginWithEOS` from the `RedwoodEOS` plugin | [Epic](../features/authentication/epic.md) |
| Discord | `LoginWithDiscord` (opens the player's browser) | [Discord](../features/authentication/discord.md) |
| Twitch | `LoginWithTwitch` (opens the player's browser) | [Twitch](../features/authentication/twitch.md) |
| Your own JWTs | `Login` with provider `jwt` and the token as the password | [JWT](../features/authentication/jwt.md) |

### Logging out

`Logout()` logs the player out, disconnects from the realm, and forgets any remembered login.

## 3. Connect to a Realm

Players' characters and game servers live in a [realm](../features/realms.md). Most games have a single realm; some MMOs have several (e.g. per region or per ruleset).

- `ListRealms` returns the realms the Director lists (`FRedwoodRealm` structs with an `Id`, a `Name`, and its `Uri`). Show them to the player, or just take the first one.
- `InitializeRealmConnection` connects to the chosen realm. When its callback fires with an empty `Error`, the player is connected and authenticated with the realm.
- `InitializeConnectionForFirstRealm` does both in one step, which is perfect for single-realm games.

```cpp
Redwood->InitializeConnectionForFirstRealm(
  FRedwoodSocketConnectedDelegate::CreateWeakLambda(
    this, [this](const FRedwoodSocketConnected& Result) {
      if (Result.Error.IsEmpty()) { ShowCharacterSelect(); }
      else { ShowMessage(Result.Error); }
    }));
```

A player can only be connected to one realm at a time. Like the Director connection, only connect once; if you call it again while connected, the backend treats it as a new session and removes the player from their party and any matchmaking ticket.

Once connected, the realm sends the client its list of regions and Redwood starts measuring ping to each of them in the background (used for [matchmaking](#matchmaking)).

## 4. Pick or Create a Character

Players can have several characters per realm. Every game server session is played as a specific character, even if your game doesn't show characters to the player (in that case, just create one automatically).

- `ListCharacters` returns the player's characters in the connected realm (`FRedwoodCharacterBackend` structs).
- `CreateCharacter` creates one with a name and Character Creator Data.
- `SetSelectedCharacter` chooses which character will be used for joining servers. **You must select a character before matchmaking, queuing, or joining a lobby.**

**Character Creator Data** is a JSON object (`USIOJsonObject`) with whatever your character creator produces: body type, colors, class, and so on. Define a struct for it (it must have an integer `SchemaVersion` field, see [Saving Player Data](./saving-player-data.md)), then convert it:

```cpp
#include "SIOJConvert.h"
#include "SIOJsonObject.h"

FMyCharacterCreatorData CreatorData; // your USTRUCT
USIOJsonObject* CreatorJson = NewObject<USIOJsonObject>();
CreatorJson->SetRootObject(USIOJConvert::ToJsonObject(
  FMyCharacterCreatorData::StaticStruct(), &CreatorData));

Redwood->CreateCharacter(TEXT("Hero"), CreatorJson,
  FRedwoodGetCharacterOutputDelegate::CreateWeakLambda(
    this, [this](const FRedwoodGetCharacterOutput& Output) {
      if (Output.Error.IsEmpty()) {
        Redwood->SetSelectedCharacter(Output.Character.Id);
      }
    }));
```

If your game doesn't have a character creator, pass an empty `NewObject<USIOJsonObject>()`. The JSON object can't be `nullptr`.

:::warning
Players can set their own Character Creator Data (a determined player can reverse engineer the network call and send anything), so don't put anything that should be server-authoritative in it, like level, experience, or unlocks. Those belong in the server-written fields described in [Saving Player Data](./saving-player-data.md).
:::

Other character functions:

| Function | What it does |
| --- | --- |
| `GetCharacterData` | Fetch one character by ID or name |
| `SetCharacterData` | Change a character's name and/or Character Creator Data (can be disabled with the realm's `characters.players-can-update-character-creator-data` setting) |
| `SetCharacterArchived` | Soft-delete (or restore) a character; archived characters are deleted after the realm's [`characters.archival-period-days`](../configuration/realm-instance-config.md#characters) |
| `ListArchivedCharacters` | List soft-deleted characters so players can restore them |

## 5. Join a Server

Players get into a game server in one of four ways. In all of them, the backend eventually tells the client which server to connect to, and Redwood **automatically travels there** (running `open <ip>:<port>?RedwoodAuth=1?...` with a one-time token the server verifies). Your menu just needs to start the request and show its progress.

:::note Terminology
What players think of as a "server" or "lobby" is a [GameServerProxy](../architecture/game-servers.md#gameserverproxy) in Redwood: a persistent record of a game session. A proxy can have one or more actual Unreal server processes running behind it (one per [zone](../features/game-servers/zones.md) and [shard](../features/game-servers/sharding.md)).
:::

### Matchmaking

`JoinMatchmaking` puts the player (and their party, if they lead one) into [matchmaking](../features/ticketing/overview.md) for a game profile.

- **Profile Id** is a profile `id` from `game.yaml` that has `matchmaking-zone-name` set.
- **Regions** are the region names the player is willing to play in. Use the keys from `GetRegions()`, which returns a map of region name to the measured ping (in seconds). Wait until the first pings have come in (`OnPingsReceived` fires) before joining.

Ticketing functions report progress through `FRedwoodTicketingUpdate`:

| `Type` | Meaning |
| --- | --- |
| `JoinResponse` | The backend's answer to the request. An empty `Message` means the player is now searching; a non-empty `Message` is the reason they couldn't join. |
| `Update` | A status message while searching (e.g. how many players are in the queue) |
| `TicketError` | The ticket failed (e.g. it went stale before a match was found); `Message` says why |

```cpp
TArray<FString> Regions;
Redwood->GetRegions().GetKeys(Regions);

Redwood->JoinMatchmaking(TEXT("deathmatch"), Regions,
  FRedwoodTicketingUpdateDelegate::CreateWeakLambda(
    this, [this](const FRedwoodTicketingUpdate& Update) {
      if (Update.Type == ERedwoodTicketingUpdateType::JoinResponse &&
          Update.Message.IsEmpty()) {
        ShowSearching(); // with a Cancel button that calls LeaveTicketing
      } else if (!Update.Message.IsEmpty()) {
        ShowMessage(Update.Message);
      }
    }));
```

When a match is found, the client travels to the server automatically. To cancel, call `LeaveTicketing`.

### Hosting a lobby

`CreateProxy` creates a new game session that other players can find and join. Fill out a `FRedwoodCreateProxyInput`:

| Field | Meaning |
| --- | --- |
| `Name` | Display name; must be unique among active proxies |
| `Region` | One of the region names from `GetRegions()` |
| `ModeId` | A profile `id` from `game.yaml` |
| `MapId` | Optional; a specific map from the profile (otherwise one is picked at random from the profile's zone) |
| `bPublic` | Whether it shows up in `ListProxies` for everyone |
| `Password` | Optional password to join |
| `ShortCode` | Optional short code players can use to join (e.g. for private lobbies) |
| `bProxyEndsWhenCollectionEnds` | End the proxy when its servers stop (`true` by default, which is what you want for a match) |
| `bContinuousPlay` | Keep the servers running between matches |
| `Data` | Optional JSON passed to the server |

Pass `true` for `CreateProxy`'s first argument, `bJoinSession`, to join the server as soon as it's ready. Players can only create proxies if the realm's `game-servers.allow-player-creation` setting is `true` (the default).

### Browsing and joining

`ListProxies` returns the realm's active public proxies (plus any private ones whose ID or short code you pass in `PrivateProxyReferences`). Each `FRedwoodGameServerProxy` has its name, mode, map, region, player count, and whether it has a password.

`JoinProxyWithSingleInstance` joins one by ID or short code (with its password, if it has one). As the name suggests, this is for proxies that only run one server (a single zone and shard), which is the case for lobbies and matches. If the proxy's server isn't running, Redwood starts it first.

### Queuing into a persistent world

For persistent worlds (with multiple zones and shards), use `JoinQueue` with the proxy's ID and the zone to enter. Redwood picks the best shard, admits players as space opens up, and travels them there. You can find the proxy's ID with `ListProxies`. See [Queuing](../features/ticketing/queuing.md).

Persistent worlds usually aren't created by players; you'll create them with the [CLI](../features/cli.md) or the realm's [default proxy](../features/realms.md#default-proxy) settings. We'll do that in [Running with the Backend](./running-with-backend.md).

## Returning to the Menu

When a match ends or the server shuts down, the player is disconnected from the game server and Unreal loads your **Game Default Map**. Because the client subsystem survives travel, the player is still connected to the Director and realm, still logged in, and still has their character selected. Your menu should check the current state and skip steps that are already done:

| Check | If true |
| --- | --- |
| Your own "Director initialized" flag | Don't call `InitializeDirectorConnection` again |
| `IsLoggedIn()` | Skip the login screen |
| `IsRealmConnected(Realm)` | Skip realm selection |
| Your own saved character ID | Call `SetSelectedCharacter` again (it's cheap) and go straight to the play screen |

The subsystem doesn't expose the selected character, so keep track of it yourself (e.g. in your Game Instance or a save game).

## Handling Lost Connections

Redwood reconnects automatically. While it does, you'll probably want to show the player something. Bind these delegates on the subsystem with `AddDynamic`:

| Event | When it fires |
| --- | --- |
| `OnDirectorConnectionLost` | The Director connection dropped. `IsLoggedIn()` is `false` until it's restored. |
| `OnDirectorConnectionReestablished` | Redwood reconnected and logged the player back in |
| `OnRealmConnectionLost` | The realm connection dropped; Redwood reconnects and re-authenticates automatically. The backend removes a disconnected player from their party and matchmaking. |
| `OnRequestToJoinServer` | Only if **Auto Connect to Servers** is off: the backend assigned a server. Run the provided console command when you're ready (e.g. after showing a loading screen). |

Parties have their own events (`OnPartyInvited`, `OnPartyUpdated`, `OnPartyKicked`, and `OnPartyEmoteReceived`); see [Parties](../features/social/parties.md).

## Putting It Together

Here's the whole flow in one place, including returning from a match:

```cpp
void UMyTitleWidget::NativeConstruct()
{
  Super::NativeConstruct();

  Redwood = GetGameInstance()->GetSubsystem<URedwoodClientGameSubsystem>();
  Redwood->OnDirectorConnectionLost.AddDynamic(this, &UMyTitleWidget::HandleDirectorLost);
  Redwood->OnDirectorConnectionReestablished.AddDynamic(this, &UMyTitleWidget::HandleDirectorBack);

  UMyGameInstance* GI = GetGameInstance<UMyGameInstance>();
  if (!GI->bDirectorInitialized)
  {
    GI->bDirectorInitialized = true;
    Redwood->InitializeDirectorConnection(FRedwoodSocketConnectedDelegate::CreateWeakLambda(
      this, [this](const FRedwoodSocketConnected&) { ContinueToLogin(); }));
  }
  else if (Redwood->IsDirectorConnected())
  {
    ContinueToLogin();
  }
  // otherwise HandleDirectorBack will call ContinueToLogin()
}

void UMyTitleWidget::ContinueToLogin()
{
  if (Redwood->IsLoggedIn()) { ContinueToRealm(); return; }

  Redwood->AttemptAutoLogin(FRedwoodAuthUpdateDelegate::CreateWeakLambda(
    this, [this](const FRedwoodAuthUpdate& Update) {
      if (Update.Type == ERedwoodAuthUpdateType::Success) { ContinueToRealm(); }
      else { ShowLoginForm(); } // its buttons call Redwood->Login / Redwood->Register
    }));
}

void UMyTitleWidget::ContinueToRealm()
{
  FRedwoodRealm CurrentRealm;
  if (Redwood->IsRealmConnected(CurrentRealm)) { ContinueToCharacters(); return; }

  Redwood->InitializeConnectionForFirstRealm(FRedwoodSocketConnectedDelegate::CreateWeakLambda(
    this, [this](const FRedwoodSocketConnected& Result) {
      if (Result.Error.IsEmpty()) { ContinueToCharacters(); }
      else { ShowMessage(Result.Error); }
    }));
}

void UMyTitleWidget::ContinueToCharacters()
{
  Redwood->ListCharacters(FRedwoodListCharactersOutputDelegate::CreateWeakLambda(
    this, [this](const FRedwoodListCharactersOutput& Output) {
      if (!Output.Error.IsEmpty()) { ShowMessage(Output.Error); return; }
      // Shows your character list (and creator if it's empty). Picking one calls
      // SetSelectedCharacter, then shows the play screen: JoinMatchmaking,
      // CreateProxy, ListProxies + JoinProxyWithSingleInstance, or JoinQueue.
      ShowCharacterSelect(Output.Characters);
    }));
}
```

:::success
That's the whole client flow! Next, let's **[run it against the backend](./running-with-backend.md)**.
:::
