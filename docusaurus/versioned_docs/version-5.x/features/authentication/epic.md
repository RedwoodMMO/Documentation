---
sidebar_position: 4
sidebar_label: Epic
---

# Epic Account Services Authentication

The `epic` provider uses the Epic Game Account Services (which is a subservice of Epic Online Services). You do not need to use any other part of EOS to use this provider. This provider can be used to manually prompt the user to login with Epic or to automatically login with Epic if they launched the game via the Epic Games Launcher.

## Configuration

There's no specific configuration for this provider.

## Setup

I'd love to give you instructions on how to set up

1. Sign in to the [Epic Dev Portal](https://dev.epicgames.com/portal)
1. Create or select an organization
1. Under the **Dashboard** for that organization, click **+ Create Product**

    ![Create Product button is in the main view to the side of Your Products](/img/eas-create-product.jpg)

1. Under the dashboard for the _product_, click **Product Settings**

    ![Product Settings button is in the sidebar view when viewing the product](/img/eas-product-settings.jpg)

1. Click on the **Clients** tab

    ![Product Settings Clients tab](/img/eas-clients-tab.jpg)

1. Scroll down and click **Add new client**

1. Give it a Client Name (e.g. `YourGame Game Client`)

1. Under Client Policy dropdown, click **Create a new client policy**

1. Give the policy a name (e.g. `YourGame Client Policy`)

1. Select `GameClient` for the **Client policy type**

1. Click **Add new client policy**

1. You should be back in the **Add new client** modal; make sure the new client policy is selected in the dropdown

1. You can leave **Trusted Server** IP allow list empty

1. You can leave the **Redirect URL** empty

1. Click **Add new client** to save the changes

1. Edit the client you just created

    ![Edit the secret by clicking the ...](/img/eas-edit-client.jpg)

1. Go to the **Product Settings** page and copy the **Product ID**, **Client ID**, **Client Secret**, **Sandbox ID**, and **Deployment ID** and paste the values as a new **Artifact** in the **online Subsystem EOS** section in UE's **Project Settings**.

    ![Client ID and secret](/img/eas-client-id-secret.jpg)

    ![Unreal Engine Project Settings for Online Subsystem EOS](/img/eas-config-unreal.jpg)

1. The Artifact should also have a name (like your game name), the `Product ID`

1. Click **Epic Account Services** in the sidebar

    ![Epic Account Services button is in the sidebar view when viewing the product](/img/eas-click-eas.jpg)

1. Click **+ Create Application**

    ![Create Application button is in the main view to the side of Applications](/img/eas-create-application.jpg)

1. I'm not going to go into every detail here, but note that under **Permissions** you only need **Basic Profile** enabled (it's required anyway). **Linked Clients** should have the dropdown selected for the client you just created.

1. Click **Save changes**

1. Enable the `RedwoodEOS` plugin by manually adding it to your `.uproject` file or via `Edit > Plugins`
1. Prior to calling the Redwood backend function to login, you'll need to ensure the player is logged in with EOS first. The plugin provides a few options for you (both BP and C++):
    - `Login EOS Dev Auth Tool` or `URedwoodEOSClientInterface::LoginEOS_DevAuthTool`
        - As part of the EOS SDK download found under your organization **Dashboard** via **Downloads & Release notes** (historically in `SDK/Tools` after unzipping), there is a developer authentication tool. You start it up, pick a port (defaults to `6300`), then click **Login** to add a credential. You then login with a real Epic Games account and then are prompted for a credential name. Redwood defaults to using `Context_1`, but you can use something else. While this application is running, calling this function will automatically authenticate you with EOS.
    - `Login EOS Prompt Account Portal` or `URedwoodEOSClientInterface::LoginEOS_PromptAccountPortal`
        - This is the most cross-platform supported method. Calling this function will open the browser to login with Epic Games.
    - `Login EOS Epic Games Launcher` or `URedwoodEOSClientInterface::LoginEOS_PromptAccountPortal`
        - This only works if you are launching the game via the Epic Games Launcher in production.
    - You can "auto login" without calling any of these functions for packaged games by following the official [docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/online-subsystem-eos-plugin-in-unreal-engine#auto-login-with-oss-eos).

    :::note
    I've sometimes noticed these functions not behaving as I'd expect (e.g. returning false even though the auth was successful) for the initial auth; subsequent auths would succeed. If you're seeing similar behavior and this is blocking you (e.g. in a non-development scenario), reach out.
    :::
1. Update your project to use the `Login with EOS` function instead of the normal `Login` function.
    - This function has the same auth update callback/delegate as the normal `Login` function.
    - You can use the `Login with EOS` latent Blueprint node that uses `RedwoodClientGameSubsystem`
    - You can also use the C++ function:
        1. Add the `RedwoodEOS` module to your `.Build.cs` file
        1. Include `RedwoodClientInterface.h`, `RedwoodClientGameSubsystem.h`, and `RedwoodEOSClientInterface`
        1. Get a reference to the active Redwood Client interface:
            ``` c++
            URedwoodClientInterface *ClientInterface = GetGameInstance()->GetSubsystem<URedwoodClientGameSubsystem>()->GetClientInterface();
            ```
        1. Call `LoginWithEOS`; be sure to replace `OnUpdate` below as applicable to handle the auth callback:
            ``` c++
            URedwoodEOSClientInterface::LoginWithEOS(ClientInterface, FRedwoodAuthUpdateDelegate OnUpdate);
            ```
1. Update your UE project's `Config/DefaultEngine.ini` to enable the EOS online subsystem, but making sure that you don't enable the EOS networking settings found in other EOS setup guides. Here is what a basic config may look like (as of Jan 2026):

    ``` ini
    [/Script/OnlineSubsystemEOS.EOSSettings]
    CacheDir=CacheDir
    DefaultArtifactName=GameName
    RTCBackgroundMode=
    TickBudgetInMilliseconds=0
    bEnableOverlay=False
    bEnableSocialOverlay=False
    bEnableEditorOverlay=False
    bPreferPersistentAuth=False
    TitleStorageReadChunkLength=0
    +Artifacts=(ArtifactName="GameName",ClientId="***",ClientSecret="***",ProductId="***",SandboxId="***",DeploymentId="***",ClientEncryptionKey="")
    -AuthScopeFlags=BasicProfile
    -AuthScopeFlags=FriendsList
    -AuthScopeFlags=Presence
    bUseEAS=True
    bUseEOSConnect=False
    bMirrorStatsToEOS=False
    bMirrorAchievementsToEOS=False
    bUseEOSSessions=False
    bMirrorPresenceToEAS=False
    SteamTokenType=Session

    [OnlineSubsystemEOS]
    bEnabled=true

    [OnlineSubsystem]
    DefaultPlatformService=EOS
    ```

    :::warning
    **DO NOT** change the NetDriver that you might find in other guides on setting up Steam with Unreal.
    :::
