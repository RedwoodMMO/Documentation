---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Installing

Redwood consists of two main components: the Unreal plugins and the Node.js backend. On this page we'll download both, install the backend dependencies, configure your machine's `hosts` file, and create the first backend [config environment](../configuration/overview.md) for your game.

## Unreal Plugins

You can download the UE plugins by either:

- [Using git to clone the repository](https://github.com/RedwoodMMO/RedwoodPlugins#using-git) **recursively** (it uses submodules for the third-party plugins):

    ```bash
    git clone --recurse-submodules https://github.com/RedwoodMMO/RedwoodPlugins.git
    ```

- [Downloading the `RedwoodPlugins-x.y.z.zip` file from the latest release](https://github.com/RedwoodMMO/RedwoodPlugins/releases/latest)

:::danger
Don't use GitHub's green **Code > Download ZIP** button. It doesn't include the submodules or LFS files, and the plugins won't compile.
:::

Place the contents of the repository in your project's `Plugins` folder (e.g. `C:\Path\To\YourProject\Plugins\RedwoodPlugins\`) or in your engine's `Engine/Plugins` folder (e.g. `C:\Path\To\UnrealSource\Engine\Plugins\RedwoodPlugins\`). We recommend the project's `Plugins` folder so the plugin version is versioned with your game.

You'll find several plugins inside:

| Plugin | Required? | What it's for |
| --- | --- | --- |
| `RedwoodCore` (listed as **Redwood MMO Framework**) | **Yes** | Everything: connecting to the backend, authentication, characters, servers, persistence, social features |
| `ThirdParty/SocketIOClient` | **Yes** (dependency of `RedwoodCore`) | Websocket communication with the backend, and the `USIOJsonObject` JSON type used throughout the API |
| `ThirdParty/LatencyChecker` | **Yes** (dependency of `RedwoodCore`) | Measures ping to each region for matchmaking |
| `ThirdParty/GameplayMessageRouter` | **Yes** (dependency of `RedwoodCore`) | Engine-style message bus Redwood uses internally |
| `RedwoodChat` | Optional | [Text chat](../features/social/text-chat.md) |
| `RedwoodSteam` | Optional | [Steam authentication](../features/authentication/steam.md) |
| `RedwoodEOS` | Optional | [Epic Online Services authentication](../features/authentication/epic.md) |
| `RedwoodGAS` | Optional | Persisting [Gameplay Ability System](../features/data/game/gas.md) state |

You'll enable the plugins you need in [Setting Up Unreal](./setting-up-unreal.md); for now, just get the files in place.

## Node.js Backend

<Tabs>
  <TabItem value="standard" label="Standard License" default>
    Download the latest version of the backend (`RedwoodBackend-x.y.z.zip`) from the [Downloads page](https://license.redwoodmmo.com/downloads) in the Redwood License Manager (assuming you [registered for an account](./getting-access.md#registering)).

    The ZIP contains the precompiled Dev Initiator (`dev-initiator-win.exe`, `dev-initiator-lin`, and `dev-initiator-mac`), the Linux microservice binaries used for Kubernetes deployments, the default configuration, and the source for the CLI and deployment scripts.
  </TabItem>
  <TabItem value="custom" label="Custom License">
    Clone the full source from the [GitHub repo](https://github.com/RedwoodMMO/Backend).
  </TabItem>
</Tabs>

We recommend extracting the backend into a folder named `RedwoodBackend` as that's what the docs reference, but the name of the folder can be anything. You can place it anywhere; we usually put it next to (or inside) the Unreal project folder.

:::tip
Use the same version of the backend and the Unreal plugins. Redwood releases them in lockstep (e.g. backend `5.0.0` with plugins `5.0.0`), and there's no version handshake between them, so a mismatch shows up as confusing timeouts or validation errors rather than a clear message.
:::

## Setup

### Backend Dependencies

Follow the instructions [**here**](./prerequisites.md#nodejs) to install Node.js v24 if you haven't already.

In the `RedwoodBackend` directory, turn on `corepack`, the Node.js tool that provides Yarn:

```bash
corepack enable
```

Then make sure you can use the `yarn` executable (and that its version is at least 4):

```bash
yarn --version
4.10.3
```

Then install the dependencies:

```bash
yarn
```

This also generates the database clients and builds the TypeScript packages, so it may take a few minutes the first time. **This step is required for both Standard and Custom licenses**; the Dev Initiator uses the installed Prisma tooling to create your local databases.

### Configure Hosts File

Redwood uses fictional hostnames so routing works the same way in development as it does in production. You need to modify your machine's `hosts` file so these route to your development machine.

This requires local admin privileges; you may need to ask your IT sysadmin for help. [Here's a useful guide](https://www.hostinger.com/tutorials/how-to-edit-hosts-file) on how to locate and edit your `hosts` file with admin privileges. Add these lines and save:

```
127.0.0.1 director.localhost
127.0.0.1 realm-default.localhost
127.0.0.1 realm-default-backend.localhost
127.0.0.1 chat.localhost
```

Here's what each one is for:

| Hostname | Used by | Needed when |
| --- | --- | --- |
| `director.localhost` | The [CLI](../features/cli.md), OAuth redirects, and email verification links connecting to the Director Frontend (port `3001`) | Always |
| `realm-default.localhost` | Game clients and the CLI connecting to the `default` realm's Realm Frontend (port `3011`) | Always |
| `realm-default-backend.localhost` | Game server sidecars connecting to the `default` realm's Realm Backend (port `3010`) | Always |
| `chat.localhost` | The [text chat](../features/social/text-chat.md) server | Only if you use text chat |

:::note
Don't rely on your OS resolving `*.localhost` automatically. Browsers do, but Windows and macOS generally don't for other applications (including Node.js and Unreal).

If you add more realms, add `realm-<realm-key>.localhost` and `realm-<realm-key>-backend.localhost` for each of them.
:::

### Initial Configuration

:::warning
Any change to the backend configuration requires the backend to be restarted to take effect. This is the case regardless of how the backend is deployed (i.e. restarting the Dev Initiator process or the corresponding Kubernetes pods).
:::

Every Redwood project should have its own [config environment](../configuration/overview.md#customization): a folder of YAML files that only contains the values you want to change from the defaults. We recommend a lowercase kebab-case (`your-name`) name. We'll use `project-name` in this guide; you'll build more environments on top of it later (e.g. for [Kubernetes](../configuration/typical-struture.md)).

1. Create a folder in the `RedwoodBackend/config/node` folder with your config environment name (i.e. `RedwoodBackend/config/node/project-name`).

    :::note
    We prefer keeping the config environment in the game's repository rather than in the backend folder (e.g. `YourProject/Config/Backend/project-name`). To do that, create or modify the `RedwoodBackend/config-settings.json` file and add the `extraDirs` array field with the **parent** folder of your config environment:

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

        The `standard` environment points the Kubernetes deployment at the precompiled microservice images that come with the Standard License.
      </TabItem>
      <TabItem value="custom" label="Custom License">
        ```json
        {
          "parentNames": ["default"]
        }
        ```
      </TabItem>
    </Tabs>

1. Create a `realm/instances/default.yaml` file (i.e. `RedwoodBackend/config/node/project-name/realm/instances/default.yaml`). This overrides the settings for the `default` [realm](../features/realms.md) that ships with Redwood. Set its contents to the below, changing the paths for your machine:

    ``` yaml
    game-servers:
      # How long to wait for a game server to finish starting. Uncooked
      # servers launched through the editor can take a while, especially
      # the first time.
      ready-timeout-seconds: 300

      local:
        unreal:
          # The folder that contains the Unreal editor executable
          path: "C:\\Program Files\\Epic Games\\UE_5.4\\Engine\\Binaries\\Win64"
          executable: "UnrealEditor.exe"

        # Your game's .uproject file
        project: "C:\\path\\to\\YourProject\\YourProject.uproject"

        # Extra arguments for the game server process. -log opens a log
        # window for each server, which is handy while integrating.
        arguments: "-log"

    ticketing:
      matchmaking:
        # Make matches faster while testing by yourself
        max-wait-until-make-shallow-match-ms: 5000
        # Give uncooked servers enough time to start before tickets go stale
        ticket-stale-time-ms: 120000
    ```

    The `local` [game server provider](../features/game-servers/hosting/local.md) starts each game server by running your project with the editor executable in `-server` mode, using uncooked content. That's why the backend needs to know where both are.

    :::note
    Notice that for Windows paths, you need to use double backslashes (`\\`) instead of single backslashes (`\`). Relative paths are relative to the `RedwoodBackend` folder.
    :::

    :::warning
    If you're on **macOS**, the `game-servers.local.unreal` config must not point to the `UnrealEditor.app` bundle, but rather to the `UnrealEditor` binary hidden inside it:

    ``` yaml
    game-servers:
      local:
        unreal:
          path: "/path/to/UE/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS"
          executable: "UnrealEditor"
    ```
    :::

1. Create a `game.yaml` file (i.e. `RedwoodBackend/config/node/project-name/game.yaml`) to define your game's **profiles** (game modes, their zones, and which maps they use). Each profile `id` and map name here must match a Data Asset you'll create in Unreal in [Setting Up Unreal](./setting-up-unreal.md#game-mode-and-map-assets). Pick the example closest to your game; you can always come back and change it.

    <Tabs>
      <TabItem value="match" label="Match-based game" default>
        Players use matchmaking or lobbies to join short-lived matches.

        ``` yaml
        profiles:
          - id: "deathmatch" # matches the Redwood Id of a URedwoodGameModeAsset

            zones:
              # Keeps zone names exactly as written (no camelCase conversion);
              # fields inside zones must then be written in camelCase.
              variableCasing: "original"

              main:
                maps:
                  - "arena" # matches the Redwood Id of a URedwoodMapAsset

            max-players-per-shard: 16

            # Enables matchmaking for this profile using the "main" zone
            matchmaking-zone-name: "main"
            min-players-for-matchmaking: 1

            # Optional key/value pairs added to the map URL as ?key=value
            data:
        ```
      </TabItem>
      <TabItem value="persistent" label="Persistent world">
        A long-running world split into zones, with shards added as the population grows, plus an instanced dungeon players can matchmake into.

        ``` yaml
        profiles:
          - id: "overworld"

            zones:
              variableCasing: "original"
              town:
                maps:
                  - "overworld"
              wilds:
                maps:
                  - "overworld"
              cave:
                maps:
                  - "cave"

            max-players-per-shard: 50

            # Add another shard to a zone when each existing shard
            # in that zone has this many players
            num-players-to-add-shard: 40

            # Keep the other zones running if one zone's server stops
            collection-ends-when-any-shard-ends: false

          - id: "dungeon"

            zones:
              variableCasing: "original"
              main:
                maps:
                  - "dungeon"

            max-players-per-shard: 5

            matchmaking-zone-name: "main"
            min-players-for-matchmaking: 1

            # Players return to the overworld proxy when they leave
            parent-profile-id: "overworld"
        ```
      </TabItem>
    </Tabs>

    :::warning
    `game.profiles` is a list, and lists **replace** the default value rather than merge with it. Your `game.yaml` must contain every profile your game uses.
    :::

    Every field is documented in [Game Modes and Maps](../configuration/game-modes-and-maps.md#profiles) and the [Game config reference](../configuration/reference/game.md).

1. Optionally, verify the backend sees your environment the way you expect by printing the merged configuration:

    ```bash
    yarn cli get-config project-name -k game.profiles
    ```

    If you see the default `match` profile instead of yours, the environment wasn't found (double check the folder name and `extraDirs`).

:::info Realm credentials
Each realm authenticates with the Director using an `auth.id` and `auth.secret`. You don't need to set these for the Dev Initiator (it generates them if they're left as the placeholder values), but you'll need real values once you deploy. You can generate a pair any time by running `yarn id` in the `RedwoodBackend` directory:

```bash
yarn id
ID: 7f0c5e8e-...
Secret: hS3k...
```

and then setting them in your realm instance config:

```yaml
auth:
  id: "<the ID>"
  secret: "<the Secret>"
```

Treat the secret like a password. In 5.0.0, keep it as a plain value rather than a [secrets provider](../features/secrets/overview.md) reference; see the [known issue](../configuration/reference/secrets-and-persistence.md).
:::

:::success
The backend is installed and configured! Next, let's **[set up your Unreal project](./setting-up-unreal.md)**.
:::
