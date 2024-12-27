---
sidebar_position: 3
sidebar_label: Steam
---

# Steam Authentication

The `steam` provider uses the Steamworks API to authenticate users automatically when the game launches from Steam. If you distribute your game through Steam, this provider allows for a painless onboarding experience.

## Configuration

|Variable|Description|
|-|-|
|`auth.steam.api-key`|The Steamworks [Web API publisher authentication key](https://partner.steamgames.com/doc/webapi_overview/auth#create_publisher_key).|
|`auth.steam.app-id`|The Steamworks AppID for your game.|

## Setup

1. Create a Steamworks Web API **publisher** key (not a user key) following [Steam's documentation](https://partner.steamgames.com/doc/webapi_overview/auth#create_publisher_key)
1. Update the above [configuration](#configuration)
1. Enable the `RedwoodSteam` plugin by manually adding it to your `.uproject` file or via `Edit > Plugins`
1. Update your project to use the `Login with Steam` function instead of the normal `Login` function. You can use the provided Blueprint node.
    - This function has the same auth update callback/delegate as the normal `Login` function.
    - You can also use the C++ function: `static void URedwoodSteamTitleInterface::LoginWithSteam(URedwoodTitleInterface *TitleInterface, FRedwoodAuthUpdateDelegate OnUpdate)` by including `RedwoodTitleInterface.h` and adding the `RedwoodSteam` module to your `.Build.cs` file.
1. Update your UE project's `Config/Default.engine` to enable the Steam online subsystem, but making sure to disable Steam networking:

    ``` ini
    [OnlineSubsystemSteam]
    bEnabled=True
    bUseSteamNetworking=false
    SteamDevAppId=<your-app-id>
    ```

    :::warning
    There are no other configuration changes you need. `SteamAuth` is automatically handled by the `RedwoodSteam` plugin. **DO NOT** change the NetDriver that you might find in other guides on setting up Steam with Unreal.
    :::

    :::note
    Like all Steam games, you'll need to ensure that in `Shipping` builds that a `steam_appid.txt` is distributed with your game. Non-Shipping builds create this text file using `SteamDevAppId` when the game launches (and deletes it when the game closes). Read more in the official [Unreal documentation](https://dev.epicgames.com/documentation/unreal-engine/online-subsystem-steam-interface-in-unreal-engine#steamappid).
    :::
