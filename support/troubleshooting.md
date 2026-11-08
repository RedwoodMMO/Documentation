---
sidebar_position: 2
---

# Troubleshooting

This page collects the problems people run into most often, organized by symptom. If you don't find your issue here, ask in our [Discord server](https://discord.gg/Gj23MHhCQR) (see [How to get Support](./how-to-get-support.md)).

## Where to Find Logs

| What | Where |
| --- | --- |
| Backend (Dev Initiator) | The terminal running the Dev Initiator. To also write to a file, set `logging.log-file.enabled: true` (default path `logs/redwood-backend.log`); see the [environment config reference](../configuration/reference/environment.md). |
| Backend (Kubernetes) | The pod logs, e.g. `kubectl logs -n director <pod>` or `kubectl logs -n realm-default <pod>` |
| Game client | `YourProject/Saved/Logs/YourProject.log` (in PIE, the editor's Output Log). Redwood logs under the `LogRedwood` category. |
| Local game servers | `YourProject/Saved/Logs/YourProject_*.log` (each server started by the backend writes its own log; search for `LogRedwood`). Add `-log` to the realm's `game-servers.local.arguments` to open a log window per server, or set `game-servers.local.log-to-terminal: true` to print them in the Dev Initiator terminal. |
| Game servers in Kubernetes | The game server pod logs in the realm's namespace; the sidecar and Unreal server output share the same pod |

The optional plugins use their own categories: `LogRedwoodChat` (and `LogXmpp`), `LogRedwoodSteam`, and so on. The editor module uses `LogRedwoodEditor`.

## Backend Won't Start

### `Config environment X does not exist`

The Dev Initiator (and the CLI and deploy scripts) couldn't find a folder with that name in `config/node` or any of the `extraDirs` folders listed in `RedwoodBackend/config-settings.json`. Check the spelling, and that `extraDirs` lists the **parent** folder of your config environment. See [Initial Configuration](../getting-started/installing.md#initial-configuration).

### The Dev Initiator says I need to provide a config environment

You can't run the Dev Initiator with only the `default` environment. Pass your own environment: `yarn dev <your-env>` (Custom License) or `./dev-initiator-win <your-env>` (Standard License), from the `RedwoodBackend` folder. See [Launching the Backend](../getting-started/running-with-backend.md#launching-the-backend).

### `Node.js and Yarn are required` or `Could not find the prisma dependency`

The Dev Initiator uses Node.js tooling to create the local databases, even the precompiled Standard License version. Install [Node.js v24](../getting-started/prerequisites.md#nodejs), then run `corepack enable` and `yarn` in the `RedwoodBackend` folder (see [Backend Dependencies](../getting-started/installing.md#backend-dependencies)).

### `ERROR: Cannot find config environment "..."` but the backend starts anyway

One of the environments listed in a `_config.json` file's `parentNames` doesn't exist. The config system logs this error and **keeps going without that parent**, so values you expected to be inherited silently fall back to the defaults. Fix the name in `parentNames`.

:::tip
To see exactly what configuration a process will use, print the merged config for an environment: `yarn cli get-config <env>` (or a single value with `-k`, e.g. `yarn cli get-config <env> -k realm.instances.default.game-servers`).
:::

### Port already in use

The Dev Initiator uses ports `3000` to `3002` (Director), `3010` and `3011` (the `default` realm), and `7000` to `7099` for local game servers and their sidecars. Stop whatever else is using those ports, or change the `connection.internal.port` values in your config environment (and the client's **Director Uri** if you change the Director Frontend's port).

## Client Can't Connect

### Stuck on "Connecting..." (the Director connection never completes)

The **Initialize Director Connection** node only fires once it succeeds; until then Redwood keeps retrying in the background. Check:

- The backend is running and has printed `All services ready`
- The **Director Uri** in **Project Settings > Plugins > Redwood** matches the backend (`ws://localhost:3001` or `ws://director.localhost:3001` for the Dev Initiator, `ws://director.localhost` for local Kubernetes)
- If you use a `*.localhost` hostname, it's in your [`hosts` file](../getting-started/installing.md#configure-hosts-file)
- A packaged build doesn't have a stale `redwood.json` next to it overriding the Director Uri
- Nothing else is bound to port `3001` and no firewall prompt was dismissed

The `LogRedwood` log will say `Unable to establish initial connection to Director at ...` with the address it's trying.

### Login works, but connecting to the realm hangs

The client connects to the realm at the realm's `frontend.connection.external` address (`realm-default.localhost:3011` by default). Make sure `realm-default.localhost` is in your `hosts` file and nothing else uses port `3011`. The log will say `Unable to establish initial connection to Realm at ...`.

### Every Redwood call does nothing (or returns fake data) in PIE

**Use Backend in PIE** is off (it's off by default). Turn it on in **Editor Preferences > Plugins > Redwood** or the Play button's **Redwood Options** menu. With it off, Redwood is in [no-backend mode](../getting-started/running-without-backend.md) on purpose.

### `Too many login attempts; try again later`

The backend rate limits logins and registrations per IP and per username (e.g. 10 login attempts per username every 5 minutes). Wait for the window to pass, or raise the limits in `auth.rate-limit` for development; see the [auth config reference](../configuration/reference/auth.md). Scripts that call the CLI in a loop can trip this too.

### `Must verify email` when logging in

The account has [email verification](../features/authentication/local.md) pending. In development, `director.development.auto-verify-email` (on by default) verifies accounts automatically.

## Servers Don't Start

### `Executable not found at path ...` or `Project not found at path ...`

The `local` game server provider couldn't find your editor executable or `.uproject`. Fix `game-servers.local.unreal.path`, `game-servers.local.unreal.executable`, and `game-servers.local.project` in your realm instance config (remember to double your backslashes on Windows; relative paths are relative to the `RedwoodBackend` folder). On macOS, point at the binary inside `UnrealEditor.app/Contents/MacOS`. See [Initial Configuration](../getting-started/installing.md#initial-configuration).

### `Start server request timed out`

The server process started, but it didn't report that it was ready within `game-servers.ready-timeout-seconds` (180 seconds by default). Check the game server's log for `LogRedwood` errors. The common causes are:

- **The Asset Manager isn't scanning the Redwood Data Asset types.** The server logs `Failed to load RedwoodGameModeAsset or RedwoodMapAsset asset types; not initializing RedwoodServerGameSubsystem` and never connects to its sidecar. Add the types as described in [Asset Manager](../getting-started/setting-up-unreal.md#asset-manager).
- **The game profile's mode or map ID doesn't match a Data Asset.** The sidecar logs `Error loading map: Invalid ModeId or MapId`. Every profile `id` needs a `RedwoodGameModeAsset` with that **Redwood Id**, and every map in the profile's zones needs a `RedwoodMapAsset`. See [Game Mode and Map Assets](../getting-started/setting-up-unreal.md#game-mode-and-map-assets).
- **Uncooked servers are just slow to start.** The first launch of an editor-based server can take minutes while shaders and assets load. Raise `ready-timeout-seconds` (we use `300` for local development).
- **The server crashed or exited.** The backend logs `Game server process exited with code ...`. Check the server log.
- **`Servers Auto Connect to Sidecar` is off** in the Redwood project settings. Turn it back on.

### Packaged servers fail to load a map

Cooking the Map Data Assets doesn't cook the levels they point to. Add every gameplay map (and your idle server map) to the maps to package; see [Packaging](../deploying-to-kubernetes/packaging.md#packaging-maps).

### `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING` in the Realm Backend (Kubernetes)

A realm deployed to Kubernetes is still using the `local` game server provider. Set `realm.instances.<realm>.game-servers.provider` to `agones` (or `edgegap`) in your Kubernetes config environment. The provided `kubernetes` environment does this for the `default` realm, but not for realms you add, and an override in a config environment that's read later (like your base environment) can switch it back. See [Deploying Locally](../deploying-to-kubernetes/deploying-locally.md#redwood-configuration).

## Players Get Kicked When Joining

The kick reason appears in the client's log and the server's log.

| Kick reason | Cause | Fix |
| --- | --- | --- |
| `Could not load player character data` | The Pawn (or Player State) has a `URedwoodCharacterComponent` with a `bUse*` flag enabled but no matching struct variable, the variable isn't a struct, or the struct has no `SchemaVersion` integer | Add the variables or disable the flags you don't use; see [Saving Player Data](../getting-started/saving-player-data.md) |
| `Invalid authentication request: missing RedwoodAuth option` | The client joined the server directly (e.g. typing `open` yourself or PIE "Play as Client") instead of being sent there by the backend | Join through the backend (matchmaking, queues, or proxies) so the client gets a join token. To debug a server in PIE with the backend, use the `dev-debug` game server provider (see [Hosting](../features/game-servers/hosting/overview.md)). |
| `Sidecar is not connected` | The server isn't connected to its sidecar, usually because **Servers Auto Connect to Sidecar** is off or the server wasn't started by the backend | Leave the setting on and let the backend start servers |
| `No character found for this player index N` | No-backend PIE couldn't find a saved character for this PIE client | Create a character for each PIE client first; see [Running without the Backend](../getting-started/running-without-backend.md) |
| A token or authentication error from the backend | The one-time join token was already used or expired (e.g. reconnecting with an old `open` command) | Rejoin through the backend to get a new token |

## Matchmaking and Queues

### My matchmaking ticket keeps going stale

Tickets that don't find a match within `ticketing.matchmaking.ticket-stale-time-ms` (60 seconds by default) fail with a `TicketError`. While developing by yourself, lower `min-players-for-matchmaking` to `1` in your game profile and lower `max-wait-until-make-shallow-match-ms`, and raise `ticket-stale-time-ms` if your uncooked servers take a long time to start. See [Initial Configuration](../getting-started/installing.md#initial-configuration).

### Join Matchmaking never responds

The client waits until it has measured ping to **every** region before sending the request. If a region's `ping` address is unreachable, the request never goes out. Check the `region` settings of your Kubernetes instances (see [Deploying Remotely](../deploying-to-kubernetes/deploying-remotely.md#redwood-configuration)) and the `LogRedwood` output for `Not enough ping averages`.

### A feature's calls never respond

If a feature is disabled in the backend config (e.g. `game.guilds.enabled: false` or `realm.instances.<realm>.parties.enabled: false`), its API isn't registered and the client's requests never get a response. Check the feature is enabled in your config environment.

## Deploying

### `yarn deploy` refuses to deploy and lists config variables

Your environment inherits from `staging` or `production`, which enable the default secrets check, and some secrets still have their placeholder values. Set real values for the listed variables; see [Default Secrets Check](../deploying-to-kubernetes/deploying-remotely.md#default-secrets-check). You can run the check by itself with `yarn check-secrets <env>`.

### `Game server directory "..." does not exist` or `does not contain a '.sh' script file`

The deploy scripts couldn't find your packaged Linux server. Copy the contents of the packaged `LinuxServer` folder to `RedwoodBackend/dist/game-servers/<game-servers.local-dir>`; see [Copying the Server to the Backend](../deploying-to-kubernetes/packaging.md#copying-the-server-to-the-backend).

### Pulumi preview/up operations return nothing but the stack

This can happen when multiple versions of the NPM package `@pulumi/pulumi` are installed (e.g. after upgrading it, the old version can stay in `yarn.lock` because it's still satisfied). Deduplicate the lockfile and reinstall:

```bash
yarn dedupe @pulumi/pulumi
yarn
```

### The deploy was interrupted and now the stack is locked

Run `yarn deploy <env> --cancel` to cancel the in-progress update, then deploy again. See [Modifying a Deployment](../deploying-to-kubernetes/modifying-a-deployment.md).
