---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Hathora

[Hathora](https://hathora.dev) is Redwood's preferred on-demand hosting solution for various reasons:
- The onboarding experience is fairly painless (and Redwood makes it dead-simple)
- The team is very developer friendly
- They listen to their big and small customers alike and continue to push new features/fixes based on that feedback
- Decent **free tier** that you can use in early development and smaller playtests; easily scales into priced pro tiers
- They have several edge regions across the globe, giving you lower latency reach to your players without paying for several regional clusters

Redwood provides a first-class integration with Hathora by using the `hathora` provider. This integration focuses on the [Room](https://hathora.dev/api#tag/RoomV2) API, and will later add support to automatically create Hathora Deployments via the Redwood deployment scripts. Redwood doesn't use Hathora's Lobby Service and instead provides a custom lobby solution that works with any hosting provider.

<div class="center">
  <a href="https://console.hathora.dev/login" target="_blank"><button>Start using Hathora for Free</button></a>
</div><br />

:::note
During Hathora account creation by clicking the link above, you'll be prompted with a `Login` button. Press that and then you'll have an option to `Sign Up`.
:::

## Preparing the Game Server

Follow the steps to prepare the game server for [Agones](./agones.md#preparing-the-game-server), which should put the packaged dedicated server folder in `dist/LinuxServer` (unless you configured to use a different name than `LinuxServer`).

Then run the command from the `RedwoodBackend` directory:

``` bash
yarn package:hathora <config-environment-name>
```

This will create a tarball `redwood-hathora-{timestamp}.tar.gz` in the `RedwoodBackend` directory. You can then upload this tarball as a Deployment on the Hathora Console:

![Click on Deploy new version to upload the tarball to Hathora](/img/hathora-new-deployment.jpg)

## Configuration

To use Hathora, you'll need to add [config overrides](../../configuration/overview.md#customization) for the [Realm Instance Config](../../configuration/realm-instance-config.md) `game-servers.hathora.*` variables.

### Hathora Credentials

`game-servers.hathora.credentials` stores how Redwood can access the Hathora API:

#### app-id and app-secret

You can retrieve the `app-id` and `app-secret` variables after you [create a Hathora application](https://hathora.dev/docs/guides/deploy-hathora#create-an-application). The easiest method to retrieve these is to login via the [Hathora webapp console](https://console.hathora.dev/overview), select the target application, and press the copy-to-clipboard icons for the `AppId` and `AppSecret` fields to use for `app-id` and `app-secret` respectively.

![Select the target application from console.hathora.dev/overview](/img/hathora-console-application-list.jpg)

![Copy the AppId and AppSecret from the application details page](/img/hathora-application-keys.jpg)

#### dev-token

You can generate a Hathora Developer Token by following their guide [here](https://hathora.dev/docs/guides/generate-developer-token); this is used for the `dev-token` config variable.

### Region Blacklist

By default, Redwood will list all Hathora cloud regions as available regions for servers to be created with lobbies or matchmaking. You can optionally specify a list of strings in the `game-servers.hathora.regions.blacklist` Realm Instance Config variable if you want to omit one or more regions from showing up (perhaps you only want to have 1-2 regions in the US for low CCUs). Below is an example where the `Los_Angeles` region would be omitted:

``` yaml
regions:
  blacklist:
    - "Los_Angeles"
```

## Using Hathora Game Servers in Development

:::warning
Similar to deploying to Kubernetes, you need to be able to [package dedicated servers](../../deploying-to-kubernetes/prerequisites.md#compile-unreal-from-source) before you can use Hathora.
:::

In development it's easier to use the `local` and `agones` providers with the Dev Initiator and Kubernetes respectively, but it's likely more cost effective for you to use the `hathora` provider in cloud/production environments until player demand reaches a point where `agones` and self hosting your game server nodes becomes more cost effective.

This guide shows you how to use the `hathora` provider with the Dev Initiator for testing viability and integration.

### Install ngrok

[**ngrok**](https://ngrok.com/) is a free service that gives you a public endpoint that forwards to a port on your local machine. We'll be using it so the game servers on Hathora will be able to talk to the backend services in the Dev Initiator.

1. Signup for a free account at https://dashboard.ngrok.com/signup
1. Login and follow the **Connect** instructions on https://dashboard.ngrok.com/get-started/setup.

    :::note
    You can choose which ever **Installation** method you want in the instructions as long as the `ngrok` executable is on your PATH.
    :::

    :::note
    For now you don't need to follow the **Secure your endpoint** steps, but you can if you want for extra security. This guide will assume you didn't.
    :::

1. Open a terminal and run `ngrok http 3010`. This will open a tunnel that the Realm Backend service will use.
1. You should see something like the below, noting the **Forwarding** line:

    ```
    ngrok                                                                                                   (Ctrl+C to quit)
    Policy Management Examples http://ngrok.com/apigwexamples
    Session Status                online
    Account                       Mike Seese (Plan: Free)
    Update                        update available (version 3.14.0, Ctrl-U to update)
    Version                       3.3.2
    Latency                       -
    Web Interface                 http://127.0.0.1:4040
    Forwarding                    https://***.ngrok-free.app -> http://localhost:3010

    Connections                   ttl     opn     rt1     rt5     p50     p90
                                  0       0       0.00    0.00    0.00    0.00
    ```

### Create a Hathora App

1. Create a Hathora account at https://console.hathora.dev/ and complete the email verification step

    :::note
    You may be prompted with just a **Login** button. Press that, and it will route you to a login form which has a **Sign Up** tab.
    :::

1. You may need to refresh the page after email verification or navigate to your Hathora Console dashboard at https://console.hathora.dev/applications
1. Press **Create Application**, pick a name, and submit:

    ![Hathora Create Application](/img/hathora-create-application.jpg)

1. Note the `AppId` and `AppSecret` fields as you'll need them in the [config step](#create-a-new-config-environment) below:

    ![Hathora Application Keys](/img/hathora-application-keys.jpg)

1. Create an API Dev Token by following [Hathora's guide](https://hathora.dev/docs/guides/generate-developer-token).

### Create a New Config Environment

Instead of modifying the config environment you created for your project (i.e. `project-name`), we're going to create a new one so you can be more modular which your environments.

1. Create a folder in the `RedwoodBackend/config/node` folder with your config environment name (i.e. `RedwoodBackend/config/node/project-name-hathora`).
1. Create a `_config.json` file in your config environment (i.e. `RedwoodBackend/config/node/project-name-hathora/_config.json`) to specify the parent config environment with the name you used before:

    ``` json
    {
      "parentNames": ["project-name"]
    }
    ```

1. Create a `realm/instances/default.yaml` file (i.e. `RedwoodBackend/config/node/project-name-hathora/realm/instances/default.yml`):

    ``` yaml
    backend:
      connection:
        external:
          host: "***.ngrok-free.app" # Copy the public **Forwarding** address from the `ngrok` terminal without the `https://`
          port: "443" # Keep this at 443, not 3010
          tls: true

    game-servers:
      provider: "hathora"

      hathora:
        credentials:
          app-id: "app-***" # This is the AppId from Step 4 of Create a Hathora App
          app-secret: "secret-***" # This is the AppSecret from Step 4 of Create a Hathora App
          dev-token: "***" # This is the API Dev Token from Step 5 of Create a Hathora App
    ```

    :::warning
    For now, you can paste the `app-secret` and `dev-token` variables directly in the configuration as instructed, but these are sensitive secrets which should later be stored with our [**Secrets system**](../secrets/overview.md).
    :::

### Packaging and Deploying the Server Image

1. Package the UE project for Linux with the Server target:

    ![Match package Linux server](/img/match-package-linux-server.jpg)

    :::info
    If you haven't set up the Linux cross compilation toolchains for Unreal, reference the [toolchain table on UE docs](https://dev.epicgames.com/documentation/unreal-engine/linux-development-requirements-for-unreal-engine#versionhistory) and download and install the `Cross-Compile Toolchain` for the respective UE version (Redwood prebuilt binaries are only 5.4 currently). You may need to restart Unreal Editor for the changes to take effect.
    :::

1. Copy the `LinuxServer` that's created in the folder you chose in the prior step and paste it in the `RedwoodBackend/dist` folder (create the `dist` folder if it doesn't exist).

    :::note
    You can rename `dist/LinuxServer` by changing the `realm.instances.<your-instance>.game-servers.local-dir` config variable (i.e. `local-dir: "LinuxServer-DifferentName"`).
    :::

1. Create the Hathora Deployment tarball using the config environment name you [created above for the Hathora config](#create-a-new-config-environment):

    ``` bash
    yarn package:hathora project-name-hathora
    ```

1. This will create a tarball `redwood-hathora-{timestamp}.tar.gz` in the `RedwoodBackend` directory. You can then upload this tarball as a Deployment on the Hathora Console:

    ![Hathora no deployments](/img/hathora-no-deployments.jpg)

1. After selecting your tarball from the previous step, press **Build Application**. This may take several minutes to upload and build the image.
1. Select the **Tiny** instance profile, `1` for the **Number of rooms per process**, and press **Next**.

    :::note
    You can use a larger instance profile, which may be desired in production, but the match template should run fine on the smallest 0.5 CPU/1GB RAM **Tiny** setting.
    :::

    ![Hathora deployment size](/img/hathora-deployment-size.jpg)

1. Set the `default` port to `7777` and select `UDP` for the **Transport type**. You can leave **Environment variables** empty and **Idle timeout** set to **Enabled**. Press **Deploy Application**.

    ![Hathora deployment config](/img/hathora-deployment-config.jpg)

### Test Hathora Deployment

Run the backend like you did in the [getting started section](../../getting-started/running-with-backend.md#launching-the-backend).

You can now start a match like you did in the [getting started section](../../getting-started/running-with-backend.md#running-the-game).

:::warning
  In some scenarios you can test with the Hathora servers while running PIE, but you may have issues actually connecting the client to the server. You'll be in the loading screen about to connect to the server but then get kicked back to the main menu. Check the **Output Log** to see if you received a warning/error (search for `checksum mismatch`):

  ```
  LogNetPackageMap: Warning: GetObjectFromNetGUID: Network checksum mismatch.
  ```

  In these cases, you'll need to package a Windows Client instead of PIE:

  ![Match package Windows client](/img/match-package-windows-client.jpg)

  :::danger
    If you are unable to connect to your local Dev Initiator from the packaged Windows client, it's likely because you didn't press the **Set as Default** button when changing the `Director Uri` setting in the **Project Settings** (because the guide did not instruct you to).

    When you package the game, it uses what's defined in the `Config/DefaultGame.ini` (or the default) instead of what is listed in the **Project Settings** window. When you tested PIE in the [getting started section](../../getting-started/running-with-backend.md#running-the-game), Unreal was just using a temporary change of the variable.

    You have two options:
      - Go back to the **Project Settings > Redwood** and press **Set as Default** to save the change to add the `:3001` port
      - Add a `redwood.json` file in the packaged build at `WindowsClient/YourProjectName/redwood.json` with the below contents. Make sure to restart the game client after making this change. The `redwood.json` file comes in handy if you need to point a pre-packaged client to a different Redwood Backend instance (e.g. running Redwood at an internet-less conference but using the latest production client).

          ``` json
          {
            "directorUri": "ws://director.localhost:3001"
          }
          ```
:::
