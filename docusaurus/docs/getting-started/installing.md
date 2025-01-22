---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Installing

Redwood consists of two main components: Unreal plugins and the NodeJS backend. We'll go over how to integrate both of these into your development environment.

## Gameplay Template Projects

<details>
    <summary>Follow these steps if you'd like to get started with an Unreal project that is already integrated with Redwood.</summary>

    From the [**Downloads page**](https://license.redwoodmmo.com/downloads) in the Redwood License Manager (assuming you [registered for an account](./getting-access.md#registering)), you'll find links to one of our Gameplay Template projects:

    - **Match**: this is the Lyra project integrated with Redwood, perfect for match-based games
    - **RPG**: this is a simple RPG project with zones, sharding, inventory, and instanced dungeons, perfect for persistent games
    - **Blank**: this has very little content and is the smallest in size and most basic match-based integration

    Once you've chosen a project to get started with, unzip the contents into your Unreal Engine's `Templates` folder (i.e. `C:\Program Files\Epic Games\UE_5.4\Templates`). You should see now a folder with `TP_RW_Match`, `TP_RW_RPG`, or `TP_RW_Blank` in the `Templates` folder depending on which template you downloaded.

    Start the Unreal Editor, and select on the `GAMES` section to find the template (`Redwood - Match`, `Redwood - RPG` or `Redwood - Blank`) to create a new project from. Specify your Project Location and Project Name before clicking **Create**.

    ![Unreal Project Browser](/img/unreal-project-browser.jpg)
</details>

## Unreal Plugins

:::info
If you created a project using one of our [Gameplay Templates](#gameplay-template-projects), you can skip this step as the plugins are already added at `Plugins/RedwoodPlugins`.
:::

You can download the UE plugins by either:

- [Using git to clone the repository](https://github.com/RedwoodMMO/RedwoodPlugins#using-git)
- [Downloading the `RedwoodPlugins-*.zip` file from the latest release](https://github.com/RedwoodMMO/RedwoodPlugins/releases/latest)

You'll want to place the contents of the RedwoodPlugins repo in your `Plugins` folder of your project or in your `Engine/Plugins` folder. For example `C:\Path\To\Project\Plugins\RedwoodPlugins\` or `C:\Path\To\UnrealSource\Engine\Plugins\RedwoodPlugins\`.

## NodeJS Backend

You can download the latest version of the Unreal backend from the [Downloads page](https://license.redwoodmmo.com/downloads) in the Redwood License Manager (assuming you [registered for an account](./getting-access.md#registering)). If you have full source code access, you can download the full source from the [GitHub repo](https://github.com/RedwoodMMO/Backend).

We recommend extracting the ZIP into a folder named `RedwoodBackend` as that's what is referenced in the docs frequently, but the name of the backend's root folder can be anything.

You can place the `RedwoodBackend` folder anywhere; we recommend either the root of your Unreal project folder or engine source folder.

## Setup

### Backend Dependencies

<details>
    <summary>**If you're using the Backend source code, have a persistent world game, or using the RPG template, you'll need to install NodeJS and dependencies**</summary>

    Follow the instructions [**here**](../deploying-to-kubernetes/prerequisites.md#nodejs) to install NodeJS and Yarn. You don't need the other dependencies listed on that page yet.

    In the `RedwoodBackend` directory, run the below command to install the dependencies:

    ```bash
    yarn
    ```
</details>

### Configure Hosts File

Redwood uses fictional hostnames to ensure routing happens properly during development. You need to modify your machine's `hosts` file to make it so these will route to your development machine.

This will require local admin privileges; you may need to request your IT sysadmin to help you. [Here's a useful guide](https://www.hostinger.com/tutorials/how-to-edit-hosts-file) on how locate and edit your `hosts` file with admin privileges. Add these lines to your file and save it:

```
127.0.0.1 director.localhost
127.0.0.1 director-backend.localhost
127.0.0.1 realm-default.localhost
127.0.0.1 realm-default-backend.localhost
```

### Initial Configuration

As with any new Redwood project, you should create a new [config environment](../configuration/overview.md#customization); we recommend a lowercase, snake (your_name) or kebab (your-name) case name. We'll be using the name `project-name` for this guide for the base environment and build on it as we introduce more environments.

1. Create a folder in the `RedwoodBackend/config/node` folder with your config environment name (i.e. `RedwoodBackend/config/node/project-name`).

    :::note
    If you want to put this folder somewhere else (i.e. to be co-located with your UE project `YourProjectFolder/Config/Backend/project-name`), you need to create/modify the `RedwoodBackend/config-settings.json` file and add the `extraDirs` array field:

    ``` json
    {
      // ... any existing fields
      "extraDirs": [
        "C:\\path\\to\\YourProject\\Config\\Backend"
      ]
    }
    ```
    :::

1. Create a `_config.json` file in your config environment (i.e. `RedwoodBackend/config/node/project-name/_config.json`) to specify the parent config environment:

    <Tabs>
      <TabItem value="standard" label="Standard License" default>
        ```json
        {
          "parentNames": ["standard"]
        }
        ```
      </TabItem>
      <TabItem value="custom" label="Custom License">
        ```json
        {
          "parentNames": ["default"]
        }
        ```
      </TabItem>
    </Tabs>

1. Create a `game.yaml` file (i.e. `RedwoodBackend/config/node/project-name/game.yaml`) to define the different game modes. You can find examples that work out of the box with the gameplay templates. You can read more about [how these work in tandem with Unreal](../configuration/game-modes-and-maps.md) if you're starting a project from scratch.

    <Tabs>
      <TabItem value="match" label="Match Template" default>
        ``` yaml
        profiles:
          - id: "elimination"

            zones:
              main:
                maps:
                  - "expanse"

            max-players-per-shard: 16

            matchmaking-zone-name: "main"
            min-players-for-matchmaking: 1

            data:
              Experience: "B_ShooterGame_Elimination"

          - id: "control"

            zones:
              main:
                maps:
                  - "convolution"

            max-players-per-shard: 16

            matchmaking-zone-name: "main"
            min-players-for-matchmaking: 1

            data:
              Experience: "B_LyraShooterGame_ControlPoints"
        ```
      </TabItem>
      <TabItem value="rpg" label="RPG Template">
        ```yaml
        profiles:
          - id: "overworld"

            zones:
              variableCasing: "original"
              village:
                maps:
                  - "overworld"
              outskirts:
                maps:
                  - "overworld"
              mountain-pass:
                maps:
                  - "overworld"
              forest:
                maps:
                  - "overworld"
              mine:
                maps:
                  - "mine"

            max-players-per-shard: 16

            num-players-to-add-shard: 50
            # num-minutes-to-destroy-empty-shard: 5
            collection-ends-when-any-instance-ends: false

            data:

          - id: "instanced-dungeon"

            zones:
              variableCasing: "original"
              main:
                maps:
                  - "dungeon"

            max-players-per-shard: 16

            matchmaking-zone-name: "main"
            min-players-for-matchmaking: 1

            data:
        ```
      </TabItem>
      <TabItem value="blank" label="Blank Template">
        ```yaml
        profiles:
          - id: "match"

            zones:
              main:
                maps:
                  - "match"

            max-players-per-shard: 6

            matchmaking-zone-name: "main"

            min-players-for-matchmaking: 1
        ```
      </TabItem>
    </Tabs>

1. Create a `realm/instances/default.yaml` file (i.e. `RedwoodBackend/config/node/project-name/realm/instances/default.yaml`)
1. Generate two UUIDs for realm authentication for the next step. You can do this with an [online generator](https://www.uuidgenerator.net/version4).

    :::note
    If you've [installed NodeJS & Yarn](../deploying-to-kubernetes/prerequisites#nodejs) and Redwood dependencies by running `yarn` in the `RedwoodBackend` directory, you can run `yarn id` in the `RedwoodBackend` directory to generate a UUID.
    :::

1. Set the contents of your `realm/instances/default.yaml` to the below; you can use this for any template project. In this config, we're:

    - Specifying new realm auth parameters. The secret shouldn't be shared externally to the studio, and doesn't support the [secrets system](../providers/secrets/overview.md) yet, so you're safe to commit this value in the meantime but otherwise treat it like a secret.
    - Specifying the path to the Unreal Engine binaries folder and executable (change based on your version/OS. **Note:** our templates currently only work on 5.4+)
    - Specifying the path to the UE project file
    - Some updated matchmaking parameters:
        - Changing `max-wait-until-make-shallow-match-ms` to a smaller value for faster testing
        - Lyra sometimes takes longer than the default 60s `ticket-stale-time-ms` value, so we made it longer so matchmaking tickets don't go stale before the server finishes starting.

    ``` yaml
    auth:
      id: "your-first-generated-uuid-here"
      secret: "your-second-generated-uuid-here"

    game-servers:
      ready-timeout-seconds: 120

      local:
        unreal:
          path: "C:\\Program Files\\Epic Games\\UE_5.4\\Engine\\Binaries\\Win64"
          executable: "UnrealEditor.exe"

        project: "C:\\path\\to\\YourProject\\YourProject.uproject"

    ticketing:
      matchmaking:
        max-wait-until-make-shallow-match-ms: 15000
        ticket-stale-time-ms: 120000
    ```

    :::note
    Notice that for Windows paths, you need to use double backslashes (`\\`) instead of single backslashes (`\`).
    :::