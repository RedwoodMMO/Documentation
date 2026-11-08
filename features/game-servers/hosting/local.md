---
sidebar_position: 2
sidebar_label: Local
---

# Local Provider

`local` is the default game server provider, since it's the easiest way to run game servers locally without any other dependencies. It's what you use with the [Dev Initiator](../../../getting-started/running-with-backend.md).

When the backend needs a new game server, the `local` provider starts a [sidecar](../../../architecture/overview.md#sidecar) inside the Dev Initiator process and launches your project in dedicated server mode, using uncooked content through the editor executable:

``` bash
<game-servers.local.unreal.path>/<game-servers.local.unreal.executable> <game-servers.local.project> -server -port=<game port> -SidecarPort=<sidecar port> -pieviaconsole <game-servers.local.arguments>
```

With the default values, that's something like:

``` bash
../Engine/Binaries/Win64/UnrealEditor.exe C:\Path\To\MyGame\MyGame.uproject -server -port=7001 -SidecarPort=7000 -pieviaconsole
```

The server starts on your project's **Server Default Map**, connects to its sidecar, and then loads the map and game mode the backend asks for. While using uncooked content isn't ideal in every case, it works for most development purposes, and it means you don't need to package anything.

We recommend using the `local` provider for quick iteration and testing; you'll likely use it most during development and switch to others when you start testing more production-like environments.

:::warning
The `local` provider is only supported alongside the Dev Initiator; it's a development tool and should not be used in any production/staging/demo environment.
:::

:::note
Since the servers use your project's uncooked content, you can't save changes to assets they've loaded while they're running. Stop the servers (e.g. with `yarn cli stop-proxy`, see the [CLI](../../cli.md)) before editing those assets.
:::

## Configuration

You can find the default configuration in `RedwoodBackend/config/node/default/realm/instances/redwoodBase.yaml` under the `game-servers.local` variables. Here's an overview of what's available in the [Realm Instance Config](../../../configuration/realm-instance-config.md):

- `game-servers.local.unreal.path` is the folder containing the executable to run. Relative paths are relative to the `RedwoodBackend` folder.
- `game-servers.local.unreal.executable` is the name of the executable. We separated this from the path so you can keep the path the same but change the executable (e.g. to run a different build configuration).
- `game-servers.local.project` is the path to the `.uproject` file; you must [customize](../../../configuration/overview.md#customization) this to point to your project. Relative paths are relative to the `RedwoodBackend` folder.
- `game-servers.local.arguments` is a string of extra arguments, added **in addition** to `-server -port=XXXX -SidecarPort=YYYY -pieviaconsole` (which are always passed). The string is split on spaces, so arguments can't contain spaces, even in quotes. `-log` is a handy one: it opens a log window for each server.
- `game-servers.local.log-to-terminal` prints the game server's output in the Dev Initiator's terminal when `true` (default `false`).

The backend checks that the executable and project exist when it starts a server. If either is wrong, starting the server fails with `Executable not found at path ...` or `Project not found at path ...`.

Every variable is described in the [realm config reference](../../../configuration/reference/realm.md).

### Ports

The ports aren't configurable for the `local` provider. Each game server gets two free ports (one for its sidecar and one for the game) from the range `7000` to `7099`, picked in order as servers start. Make sure nothing else on your machine needs those ports, and allow them through your firewall if you want other machines on your network to connect.

:::info
You can also use the `local` provider with a packaged/cooked version of your game by changing the `game-servers.local.unreal.path` and `executable` variables to the packaged server and setting `project` to an empty string. For example:

``` yaml
game-servers:
  local:
    unreal:
      path: "C:\\Path\\To\\MyGame\\builds\\WindowsServer\\MyGame\\Binaries\\Win64"
      executable: "MyGameServer.exe"
    project: ""
```
:::

## Dev Debug Provider

The `dev-debug` provider is a variation for debugging your **server** code in the editor. Instead of launching a server process, the backend's sidecar waits for you to start the server yourself in Play-In-Editor, so you can set breakpoints in the server's Blueprints and C++ just like any other PIE session.

To use it:

1. In your config environment's `realm/instances/default.yaml`, set:

    ```yaml
    game-servers:
      provider: "dev-debug"
    ```

    `environment.development` must also be `true` (the default for non-Kubernetes environments); the realm refuses the provider's development logins otherwise.

1. Make sure your realm already has characters to play as (e.g. create them from your main menu with the `local` provider first, and set `environment.clean-db-on-dev-initiator-start` to `false` so they're kept).
1. Start the Dev Initiator, and create and start a proxy for the profile you want to debug (e.g. with `yarn cli create-proxy`, see the [CLI](../../cli.md)). Because there's no process to start, the sidecar listens on the fixed sidecar port in `sidecar.connection.ports` (`3020` by default), which is also the port a PIE server connects to by default.
1. In the editor, open the map the profile uses, turn on **Use Backend in PIE**, set the PIE **Net Mode** to **Play As Client** (which runs a dedicated server in the editor), and press Play.

PIE clients are matched to the realm's existing characters by their PIE index (the first client gets the first character, sorted by name, and so on), and the server reports itself as a development zone and shard.

:::note
Only one server can be debugged this way at a time, since the ports are fixed, and this workflow is less battle-tested than the `local` provider. Use the `local` provider for everything else.
:::
