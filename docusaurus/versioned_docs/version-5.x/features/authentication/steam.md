---
sidebar_position: 3
sidebar_label: Steam
---

# Steam Authentication

The `steam` provider uses the Steamworks API to authenticate users automatically when the game launches from Steam. If you distribute your game through Steam, this provider allows for a painless onboarding experience: there's no username or password, and the player's Redwood account is tied to their Steam account.

How it works:

1. The `RedwoodSteam` plugin asks the Steam client for a Web API auth ticket (for the identity `redwood`)
1. The plugin logs in to the Director with the provider `steam` and the ticket
1. The Director verifies the ticket with Steam's `AuthenticateUserTicket` API using your publisher key, rejects VAC-banned and publisher-banned accounts, and logs the player in (creating their account on first login)

The player's Redwood username is their SteamID64, and their nickname is set to their Steam persona name (refreshed on every login).

## Configuration

|Variable|Description|
|-|-|
|`auth.allowed-providers`|Must include `steam`|
|`auth.steam.api-key`|The Steamworks [Web API publisher authentication key](https://partner.steamgames.com/doc/webapi_overview/auth#create_publisher_key). This can be used with the [secrets](../secrets/overview.md) system.|
|`auth.steam.app-id`|The Steamworks AppID for your game.|

For example, in `config/node/your-game/auth.yaml`:

```yaml
allowed-providers:
  - "steam"

steam:
  api-key: "secret|steam_api_key"
  app-id: 480
```

## Setup

1. Create a Steamworks Web API **publisher** key (not a user key) following [Steam's documentation](https://partner.steamgames.com/doc/webapi_overview/auth#create_publisher_key)
1. Update the above [configuration](#configuration)
1. Enable the `RedwoodSteam` plugin by manually adding it to your `.uproject` file or via `Edit > Plugins`
1. Update your UE project's `Config/DefaultEngine.ini` to enable the Steam online subsystem, making sure to disable Steam networking:

    ``` ini
    [OnlineSubsystemSteam]
    bEnabled=True
    bUseSteamNetworking=false
    SteamDevAppId=<your-app-id>
    ```

    :::warning
    There are no other configuration changes you need. `SteamAuth` is automatically handled by the `RedwoodSteam` plugin. **DO NOT** change the NetDriver as other guides on setting up Steam with Unreal suggest; Redwood game servers are reached by IP address with the normal IP net driver. You also don't need to set `DefaultPlatformService=Steam`.
    :::

    :::note
    Non-Shipping builds need `SteamDevAppId`: the Steam online subsystem writes a `steam_appid.txt` file from it when the game launches (and deletes it when the game closes), which lets you test without launching through the Steam client. Shipping builds don't do this and expect to be launched by Steam; following Valve's guidance, don't ship a `steam_appid.txt` with your game. Read more in the official [Unreal documentation](https://dev.epicgames.com/documentation/unreal-engine/online-subsystem-steam-interface-in-unreal-engine#steamappid).
    :::

1. Update your project to use `LoginWithSteam` instead of the normal `Login`. It has the same `FRedwoodAuthUpdate` output as `Login`, so the rest of your [login flow](../../getting-started/building-the-main-menu.md#2-log-in-or-register) stays the same. Add the `RedwoodSteam` module to your `.Build.cs` file, include `RedwoodClientGameSubsystem.h`, `RedwoodClientInterface.h`, and `RedwoodSteamClientInterface.h`, and call:

    ``` c++
    URedwoodClientInterface* ClientInterface =
      GetGameInstance()->GetSubsystem<URedwoodClientGameSubsystem>()->GetClientInterface();

    URedwoodSteamClientInterface::LoginWithSteam(
      ClientInterface,
      FRedwoodAuthUpdateDelegate::CreateWeakLambda(
        this, [this](const FRedwoodAuthUpdate& Update) {
          if (Update.Type == ERedwoodAuthUpdateType::Success) {
            // continue to the realm
          }
        }));
    ```

    `GetClientInterface()` returns `nullptr` when [running without the backend](../../getting-started/running-without-backend.md) in PIE, so only call this when the backend is in use.

The Steam client must be running and logged in on the player's machine. Steam login doesn't use **Remember Me** (there's nothing to remember; the player is logged in again from Steam each launch).

:::caution Known issue (5.0.0)
If the plugin can't get a ticket from Steam (e.g. the Steam client isn't running, the player isn't logged in to Steam, or the Steam online subsystem isn't enabled), it only logs an error (`LogRedwoodSteam`) and the `LoginWithSteam` callback never fires. Add your own timeout to your login UI.
:::
