---
sidebar_label: CLI
---

# CLI (Command Line Interface)

Redwood comes with a CLI for administrative tasks like creating admin accounts, starting persistent worlds, and putting a realm into maintenance. You'll need [Node.js and Yarn](../getting-started/prerequisites.md#nodejs) installed and the backend dependencies installed (`yarn` in the `RedwoodBackend` folder); this is the same for Standard and Custom licenses (there's no separate CLI executable).

Run commands from the `RedwoodBackend` folder:

```bash
yarn cli <command> [arguments] [options]
```

You can list the commands with `yarn cli --help` and see a command's options with `yarn cli <command> --help`, but the help text is sparse, so this page is the full reference.

## How the CLI Connects

Except for `get-config`, the CLI doesn't touch the database directly. It connects over Socket.IO to the **running** backend, exactly like a game client does:

1. It connects to the Director Frontend at `director.frontend.connection.external` (by default `ws://director.localhost:3001`)
1. For realm commands, it asks the Director for the realm list and then connects to the realm's frontend (by default `ws://realm-default.localhost:3011`)

That means:

- **The backend must be running** (the Dev Initiator or a Kubernetes deployment) for any command other than `get-config`.
- **The hostnames must resolve on the machine running the CLI.** For local development, that's the `director.localhost` and `realm-default.localhost` entries in your [hosts file](../getting-started/installing.md#configure-hosts-file). For a remote deployment, the config env you pass must have the public hostnames.

## Choosing the Config Environment

Every command except `get-config` takes `-e, --env <env>`, the [config environment](../configuration/overview.md) to read. The env determines which Director to connect to and which admin credentials to use. **It defaults to `default`**, so you'll almost always want to pass it:

```bash
yarn cli list-proxies --env project-name
```

:::warning
If you've changed `admin.default-user.password` in your config env but forget `--env`, the CLI uses the `default` env's `admin`/`admin` credentials and login fails. Similarly, pointing `--env` at your production env makes the CLI act on production.
:::

## Default Admin User

Commands that require admin privileges log in as the **Default Admin User** configured with `admin.default-user.username` and `admin.default-user.password` (by default `admin`/`admin`). The Director Backend creates this user if it doesn't exist **and re-syncs its password every time it starts** (in both the Dev Initiator and Kubernetes), so changing the password in config and restarting is all you need to do.

:::danger
Change the password of the Default Admin User before deploying to production! Create `admin/_index.yaml` in your config env (e.g. `config/node/your-game/admin/_index.yaml`):

```yaml
default-user:
  password: "new password" # This can be a secret in the secrets provider
```

Production-like environments (anything inheriting from `staging` or `production`) refuse to deploy while this is still the default value; see `environment.check-for-default-secrets` in the [environment config reference](../configuration/reference/environment.md).
:::

You can create more admin accounts with [`create-admin`](#create-admin), but the CLI itself always uses `admin.default-user` for admin commands.

### Passwords and prompts

Commands that take a password read it, in order, from the `-p, --password` option, then the `RW_PASSWORD` environment variable, and otherwise prompt for it interactively. Some commands also prompt for other choices (e.g. which region or realm).

### Choosing a realm

If the backend only has one realm, it's always used. If there are several, pass `-r, --realm <name>` with the realm's **display name** (its `name`, e.g. `Default`), or the CLI will prompt you to pick one.

:::note
Admin logins are subject to the same [rate limits](../configuration/reference/auth.md) as players (by default 10 logins per username per 5 minutes). Running the CLI in a tight loop can trip it ("Too many login attempts; try again later").
:::

## Commands

| Command | What it does | Requires admin |
| --- | --- | --- |
| [`create-user`](#create-user) | Register a `local` account | No (yes with `--admin`) |
| [`create-admin`](#create-admin) | Register an admin account | Admin secret |
| [`create-proxy`](#create-proxy) | Create (and optionally start) a GameServerProxy | Yes |
| [`create-default-proxy`](#create-default-proxy) | Create a proxy from the realm's `default-proxy` config | Yes |
| [`start-proxy`](#start-proxy) | Start a stopped proxy | Yes |
| [`stop-proxy`](#stop-proxy) | Stop (or end) a proxy | Yes |
| [`list-proxies`](#list-proxies) | List the realm's proxies | Yes |
| [`get-config`](#get-config) | Print the merged config for an env | No (local only) |
| [`update-realm-maintenance`](#update-realm-maintenance) | Schedule maintenance for a realm | Yes |
| [`end-realm-maintenance`](#end-realm-maintenance) | Clear a realm's maintenance | Yes |
| [`get-text-chat-credentials`](#get-text-chat-credentials) | Print a user's XMPP credentials | Logs in as that user |

### create-user

```bash
yarn cli create-user <username> [-p <password>] [-a] [-e <env>]
```

Registers a `local` (username/password) account, the same as a player registering from the game.

| Option | Meaning |
| --- | --- |
| `-p, --password <password>` | The account's password (otherwise `RW_PASSWORD` or a prompt) |
| `-a, --admin` | Create an admin account (same as [`create-admin`](#create-admin)) |
| `-e, --env <env>` | Config environment |

Plain registration follows the same rules as players: it uses `auth.local.account-type` (so the username must be an email address if that's set to `email`), and it's rejected if `local` isn't in `auth.allowed-providers`.

### create-admin

```bash
yarn cli create-admin <username> [-p <password>] [-e <env>]
```

Shorthand for `create-user --admin`. Admin registration doesn't log in as anyone; instead it proves it's allowed to create admins by answering a challenge with `auth.admin.secret` **from the env you pass**, which must match the secret the running backend uses. Admin registration works even if `local` isn't in `auth.allowed-providers`, so you can always create admin accounts.

Admin accounts can log in to the game like any other account and get admin privileges in the API (e.g. starting proxies on boot, creating guilds when player creation is disabled, or managing [global data](./data/game/global-data.md)).

### create-proxy

```bash
yarn cli create-proxy <profile> <name> [options]
```

Creates a [GameServerProxy](../architecture/game-servers.md#gameserverproxy) using a [game profile](../configuration/game-modes-and-maps.md#profiles). This is how you create persistent worlds, since players don't create those themselves.

| Argument / option | Meaning |
| --- | --- |
| `<profile>` | The game profile `id` from `game.profiles` |
| `<name>` | The proxy's name (must be unique among active proxies) |
| `-s, --start-on-boot` | Start the proxy now **and** every time the backend starts (after `start-proxies-on-boot-delay-seconds`) as long as it hasn't ended |
| `--proxy-ends` | End the proxy when its GameServerCollection ends (all of its servers stop) |
| `-c, --continuous-play` | Keep the servers running between matches |
| `--password <password>` | Require a password to join |
| `-p, --public` | Make the proxy public (see the known issue below) |
| `-r, --realm <name>` | Realm display name |
| `-e, --env <env>` | Config environment |

If the realm has more than one region, the CLI prompts you to pick one. When it finishes, it prints the new proxy's ID:

```
[05:47:18.119] INFO (70364): Proxy created successfully: cm1ol7o270001xhxi5z3d7fw2
```

For example, to start a persistent `overworld` world while developing:

```bash
yarn cli create-proxy overworld overworld --env project-name --start-on-boot --proxy-ends
```

`--proxy-ends` is handy in development so you get a fresh world each time the servers stop, but you usually wouldn't use it for production worlds, which should survive their servers restarting (e.g. during a game server upgrade).

:::caution Known issue (5.0.0)
`--public` has no effect: proxies created with the CLI are always public.
:::

:::note
With the Dev Initiator, `environment.clean-db-on-dev-initiator-start` is `true` by default, which wipes the databases (including proxies) each time it starts, so you'll need to create your proxies again after restarting it. Set it to `false` in your config env to keep them (and their `--start-on-boot` behavior) between runs.
:::

### create-default-proxy

```bash
yarn cli create-default-proxy <name> [-r <realm>] [-e <env>]
```

Creates a proxy using the realm's [`default-proxy`](./realms.md#default-proxy) settings instead of command-line options. `default-proxy.profile-id` must be set in the realm instance config, otherwise this fails with `Invalid profileId`. It also fails if a proxy with the same name already exists.

### start-proxy

```bash
yarn cli start-proxy <proxy-id> [-n] [-p <proxy-password>] [-r <realm>] [-e <env>]
```

Starts a proxy that isn't running (e.g. one you stopped with `stop-proxy`).

| Option | Meaning |
| --- | --- |
| `-n, --name` | Treat the argument as the proxy's **name** instead of its ID (this is a flag; the name is still the positional argument) |
| `-p, --password <password>` | The proxy's password, if it has one |

If starting times out, the CLI suggests increasing `game-servers.ready-timeout-seconds` in the realm instance config.

### stop-proxy

```bash
yarn cli stop-proxy <proxy-id> [-n] [--end] [-r <realm>] [-e <env>]
```

Stops the proxy's servers. Without `--end`, the proxy itself is kept (and will start again on boot if it was created with `--start-on-boot`, unless it was created with `--proxy-ends`).

| Option | Meaning |
| --- | --- |
| `-n, --name` | Treat the argument as the proxy's name instead of its ID |
| `--end` | Also end the proxy so it can't be started again |

For example, both of these stop the proxy created above:

```bash
yarn cli stop-proxy overworld --name --env project-name
yarn cli stop-proxy cm1ol7o270001xhxi5z3d7fw2 --env project-name
```

### list-proxies

```bash
yarn cli list-proxies [-r <realm>] [-e <env>]
```

Prints the ID, name, profile, region, whether it's public, and whether it's running for each proxy.

:::caution Known issue (5.0.0)
`list-proxies` ignores `--env` and `--realm` and always uses the `default` env. Until this is fixed it only works against a backend that the `default` env can reach with the default admin credentials. It also reports having zero proxies as an error.
:::

### get-config

```bash
yarn cli get-config <env> [-k <key>] [-s] [-o <file>]
```

Prints the fully merged configuration for a config environment (after inheritance), or a single key. This is the easiest way to check what the backend will actually see. It doesn't need the backend to be running.

| Option | Meaning |
| --- | --- |
| `<env>` | The config environment (note: positional, not `--env`) |
| `-k, --key <key>` | Print only this key (e.g. `game.profiles` or `realm.instances.default.game-servers`) |
| `-s, --secrets` | Resolve [secrets](./secrets/overview.md) instead of printing the `secret\|...` references |
| `-o, --output <file>` | Write to a file instead of the console. The path is relative to `packages/cli`, so prefer an absolute path. |

```bash
yarn cli get-config project-name -k realm.instances.default.game-servers.local
```

### update-realm-maintenance

```bash
yarn cli update-realm-maintenance [-e <env>]
```

Interactively schedules [maintenance](./realms.md#maintenance) for a realm. It prompts for the realm, a message to show players, a start time (defaults to now), and an end time, and shows the realm's current maintenance status before asking you to confirm.

### end-realm-maintenance

```bash
yarn cli end-realm-maintenance [-e <env>]
```

Clears a realm's maintenance window. It always prompts for the realm, even if there's only one.

### get-text-chat-credentials

```bash
yarn cli get-text-chat-credentials [username] [-p <password>] [-a] [-e <env>]
```

Also available as `yarn cli xmpp-credentials`. Logs in as a player and prints their XMPP JID (their player ID) and XMPP password, which you can use to log in to the [text chat](./social/text-chat.md) server's web admin. With `-a, --admin`, it uses `admin.default-user` instead of asking for a username and password.
