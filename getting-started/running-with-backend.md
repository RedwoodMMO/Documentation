---
sidebar_position: 7
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Running with the Backend

Time to see it all work together: we'll start the backend locally, log in from Play-In-Editor, and get into a server that the backend started for us.

## Launching the Backend

Locally, the whole backend runs in a single process called the **Dev Initiator**. It starts the Director, each deployed realm's services, ticketing, and an in-memory Redis stub, and it creates local SQLite databases. Game servers are started on demand with your Unreal editor executable.

<Tabs>
  <TabItem value="standard" label="Standard License" default>
    Open a terminal in the `RedwoodBackend` directory and run the below command after replacing `<your-config-env>` with the name of the config environment you created in [Installing](./installing.md#initial-configuration):

    ```bash
    ./dev-initiator-win.exe <your-config-env>
    ```

    macOS and Linux users can use `./dev-initiator-mac` and `./dev-initiator-lin` instead, respectively. Always run it from the `RedwoodBackend` directory, since it looks for the `config` folder and the installed dependencies relative to where you run it.
  </TabItem>
  <TabItem value="custom" label="Custom License">
    In the `RedwoodBackend` directory, run:

    ```bash
    yarn dev <your-config-env>
    ```

    **For example**: `yarn dev project-name`.
  </TabItem>
</Tabs>

Several logs will print to the console as the backend initializes; wait until you see `All services ready`.

:::warning Your local data is wiped on every start
By default, the Dev Initiator deletes the local databases each time it starts (`environment.clean-db-on-dev-initiator-start: true`), so accounts, characters, and servers don't survive a restart. This keeps development predictable, but if you'd rather keep your data, add this to your config environment's `_index.yaml`:

```yaml
environment:
  clean-db-on-dev-initiator-start: false
```

The databases are the `director-dev.db` and `realm-default-dev.db` files in the `RedwoodBackend` directory.
:::

If the Dev Initiator exits right away with an error about the config environment, double check the name you passed matches your folder (and that the folder is in `config/node` or one of your `extraDirs`). You can't run it with the `default` environment.

## Your First Login

1. Make sure **Use Backend in PIE** is enabled ([Setting Up Unreal](./setting-up-unreal.md#editor-preferences)).
1. Open your title map.
1. In the **Play** button's dropdown, set **Net Mode** to **Play Standalone**. Your title map runs as a normal client; the backend starts the actual servers.
1. Press **Play**.
1. Your menu should connect to the Director. If it's stuck connecting, see [Troubleshooting](#troubleshooting).
1. Register an account. Any username and password works locally; we use `test` and `test` for quick iteration. Then log in.
1. Connect to the realm and create a character.

You can watch all of this happen in the Dev Initiator's console.

:::tip Testing with multiple players
Set **Number of Players** in the Play dropdown to open several PIE windows; each one is a separate client that can log in as a different account. You can also launch extra clients outside the editor with **Standalone Game** mode, which always uses the backend.
:::

## Getting into a Server

How you get into a server depends on the kind of game you configured in your [`game.yaml`](./installing.md#initial-configuration).

<Tabs>
  <TabItem value="match" label="Match-based game" default>
    Use your play screen to either:

    - **Join Matchmaking** with your profile ID (e.g. `deathmatch`). With `min-players-for-matchmaking: 1`, a match is made with just you after `max-wait-until-make-shallow-match-ms`.
    - **Create Proxy** with `bJoinSession` enabled to host a lobby, or **List Proxies** and **Join Proxy with Single Instance** to join one another client created.

    The backend then starts a game server for the match by running your project with `UnrealEditor.exe -server`. The server boots into your idle server map, Redwood tells it which map and game mode to load, and once it's ready your client travels there automatically.

    **Note:** the first server start can take a while (shaders, asset compilation, and an uncooked editor process). If your ticket goes stale or you see a timeout, increase `ticket-stale-time-ms` and `game-servers.ready-timeout-seconds` in your realm instance config and restart the Dev Initiator. Cooked servers on [Kubernetes](../deploying-to-kubernetes/prerequisites.md) start much faster, especially with Agones keeping warm servers ready.
  </TabItem>
  <TabItem value="persistent" label="Persistent world">
    Persistent worlds are expected to already be running before players join, so you need to create the world's [GameServerProxy](../architecture/game-servers.md#gameserverproxy) first. There are two ways to do that.

    **Option 1: Let the realm create it on boot (recommended for local development).** Add this to your `realm/instances/default.yaml`:

    ```yaml
    default-proxy:
      create-on-first-boot:
        enabled: true
        name: "World"
      profile-id: "overworld" # your persistent profile's id
      start-on-boot: true
    ```

    When the realm starts, it creates a proxy named `World` if one doesn't exist yet and starts its servers (after `start-proxies-on-boot-delay-seconds`, 15 seconds by default). Since the Dev Initiator wipes the database on every start, the world is recreated fresh each time. See [Default Proxy](../features/realms.md#default-proxy) for the other options.

    **Option 2: Use the CLI.** With the Dev Initiator running, open another terminal in the `RedwoodBackend` directory and run:

    ```bash
    yarn cli create-proxy overworld World --env project-name --start-on-boot --proxy-ends
    ```

    The first argument is the profile ID and the second is the proxy's name. The [CLI](../features/cli.md) logs in as the backend's admin user, which is created automatically. `--start-on-boot` starts the proxy right away (and on future boots, if you keep your data), and `--proxy-ends` ends the proxy when its servers stop so you get a clean world next time. Wait for `Proxy created successfully: <proxy-id>`.

    Either way, the backend starts one server per zone (each zone runs its own `UnrealEditor.exe -server` process, using roughly 1 to 2 GB of RAM each with uncooked content). Then use **List Proxies** to find the proxy's ID and **Join Queue** with that ID and the zone to enter (e.g. `town`). You'll be admitted and travel to the zone's server.

    To stop the world's servers (e.g. so you can edit assets they have loaded), run:

    ```bash
    yarn cli stop-proxy World --name --env project-name
    ```

    `--name` tells the CLI the argument is the proxy's name rather than its ID. If you created the proxy with `--proxy-ends`, stopping its servers also ends the proxy, so you'll create a new one next time. Otherwise (including the default proxy from Option 1, which doesn't end by default), start it again with `yarn cli start-proxy World --name --env project-name`.
  </TabItem>
</Tabs>

When you're in, you're playing on a dedicated server that Redwood started, authenticated against, and loaded your character on. 🎉

:::info
The servers run your **uncooked** content through the editor executable, which locks the assets they've loaded. Stop the servers (or let the match end) before saving changes to assets they're using.
:::

## Where to Find Logs

| What | Where |
| --- | --- |
| Backend (Director, realm, ticketing, and sidecars) | The Dev Initiator's console. Set `logging.level` to `debug` or `trace` in your config environment for more detail, or enable `logging.log-file`. |
| Game servers | `YourProject/Saved/Logs/YourProject*.log` (search for `LogRedwood`). Add `-log` to `game-servers.local.arguments` to open a log window per server, or set `game-servers.local.log-to-terminal: true` to print server output in the Dev Initiator's console. |
| Game client | The Output Log in the editor (filter by `LogRedwood`) |

## Troubleshooting

**The menu is stuck connecting to the Director**

- Make sure the Dev Initiator is running and printed `All services ready`. If you pressed Play before it finished, the client retries on its own, but the retry delay grows each time; restart PIE if you don't want to wait.
- Make sure nothing else is using port `3001` (the Director Frontend) on your machine.
- Make sure the **Director Uri** in **Project Settings > Plugins > Redwood** is `ws://localhost:3001` or `ws://director.localhost:3001`, and if you're using the latter, that your [hosts file](./installing.md#configure-hosts-file) has `director.localhost`.
- Make sure **Use Backend in PIE** is enabled. Without it, Redwood doesn't connect at all (it pretends to succeed).

**Logging in works but connecting to the realm hangs**

- Make sure nothing else is using port `3011` (the Realm Frontend).
- Make sure your hosts file has `realm-default.localhost`.

**Matchmaking or joining never gets you into a server**

- Check the Dev Initiator's console for errors. `Executable not found at path` or `Project not found at path` means the `game-servers.local` paths in your realm instance config are wrong.
- Make sure your hosts file has `realm-default-backend.localhost`; the game server's sidecar uses it to connect to the realm.
- Check the game server's log. If it never finishes starting, the most common causes are a missing [Asset Manager](./setting-up-unreal.md#asset-manager) entry, a profile `id` or map ID in `game.yaml` that doesn't match a Data Asset's **Redwood Id** (`Invalid ModeId or MapId`), or a slow first start (increase `game-servers.ready-timeout-seconds`).
- If your ticket goes stale before the server is ready, increase `ticketing.matchmaking.ticket-stale-time-ms`.

**You get kicked right after joining**

- `Could not load player character data` means a `URedwoodCharacterComponent` is looking for data variables that don't exist. See [Saving Player Data](./saving-player-data.md).
- `Sidecar is not connected` means the server's **Servers Auto Connect to Sidecar** setting is off.

There's a longer list of symptoms and fixes on the [Troubleshooting](../support/troubleshooting.md) page.

:::success
You're using Redwood to start your servers and route clients into them! Next, let's **[save the player's character data](./saving-player-data.md)**.
:::
