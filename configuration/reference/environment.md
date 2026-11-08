---
sidebar_position: 2
sidebar_label: Environment and Services
---

# Environment and Service Config

This page covers the general-purpose files in `config/node/default`: `_index.yaml` (`environment.*`), `admin/`, `logging.yaml`, `socketio.yaml`, `probe-server.yaml`, `sidecar.yaml`, and `tests.yaml`.

Service abbreviations used below: **Director Frontend** (game clients connect here), **Director Backend**, **Realm Frontend**, **Realm Backend**, **Ticketing**, **Sidecar** (runs next to each game server), and **Dev Initiator** (runs everything in one process locally).

## `environment`

Defined in `default/_index.yaml`.

| Key | Default | Type | Read by | What it does |
| --- | --- | --- | --- | --- |
| `environment.development` | `true` | bool | Director Frontend, Director Backend, Realm Backend | Marks the environment as a development environment. It (1) allows `director.development.auto-verify-email` and (2) allows the fake player authentication used by the `dev-debug` [game server provider](./realm.md#game-server-provider) (rejected when this is `false`). The `staging` and `production` environments set it to `false`. |
| `environment.mock-api` | `false` | bool | Director Frontend, Realm Frontend | Returns canned `mock-*` responses for login, registration, OAuth, realms, characters, and servers so the Unreal plugin's automated tests can run without real logic. **Never enable this outside of tests.** |
| `environment.clean-db-on-dev-initiator-start` | `true` | bool | Dev Initiator | When the database provider is `sqlite`, deletes the Director and Realm database files every time the Dev Initiator starts, so **every start begins with no accounts, characters, or proxies**. Set it to `false` to keep your local data between runs. Has no effect in Kubernetes. |
| `environment.test.enabled` | `false` | bool | all services | Only suppresses the "Fully connected to Redis." log line. Used by the `test` environment. |
| `environment.test.standard` | `false` | bool | test harness | Makes Redwood's automated tests run the packaged Dev Initiator binary. Internal. |
| `environment.check-for-default-secrets.enabled` | `false` | bool | `yarn deploy` | When `true`, `yarn deploy` refuses to deploy if any key in `keys` still has its placeholder value from `default`. The check only runs during `yarn deploy` and `yarn check-secrets <env>` (which always runs it), never at service start or in the Dev Initiator. `staging` and `production` enable it. |
| `environment.check-for-default-secrets.keys` | 23 keys | string[] | `yarn deploy` | The keys to check. Keys whose default is `""` or `null` are skipped automatically, as are keys for features you aren't using (e.g. Cloudflare keys when `deployment.dns.provider` isn't `cloudflare`). Keys containing `.redwoodBase.` are checked for every realm or cluster. This is a list, so overriding it replaces the built-in list. |

:::note
In 5.x the default-secrets check skips the Steam, JWT, Discord, and Twitch keys even when those providers are enabled (it reads the provider list from the `default` environment). Double check those secrets yourself before deploying.
:::

## `admin`

Defined in `default/admin/_index.yaml`.

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `admin.default-user.username` | `"admin"` | string | | The default admin account. On **every** Director Backend start, it's created if missing (with the Admin role and a local username/password login), and its password is re-hashed if it changed. If text chat is enabled, it's also registered as an XMPP admin. The [CLI](../../features/cli.md) logs in as this user for admin commands. |
| `admin.default-user.password` | `"admin"` | string | yes | The default admin's password. Change it for anything deployed; it's in the default-secrets check list. |

## `logging`

Defined in `default/logging.yaml`. Read by every service.

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `logging.level` | `"info"` | string | Minimum level printed to stdout. Levels from lowest to highest: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. Redwood also has a custom `log` level above `fatal` that always prints (used for things like the version banner). `silent` disables stdout logging. |
| `logging.prettify.enabled` | `true` | bool | Pretty-print logs with [pino-pretty](https://github.com/pinojs/pino-pretty). When `false`, stdout gets one JSON object per line, which is better for production log collectors and faster. |
| `logging.prettify.colorize` | `true` | bool | pino-pretty option. |
| `logging.prettify.colorizeObjects` | `true` | bool | pino-pretty option. |
| `logging.prettify.crlf` | `true` | bool | pino-pretty option (use CRLF line endings). |
| `logging.prettify.levelFirst` | `false` | bool | pino-pretty option. |
| `logging.prettify.messageFormat` | `false` | bool or string | pino-pretty option. |
| `logging.prettify.translateTime` | `"HH:MM:ss.l"` | string | pino-pretty option (timestamp format). |
| `logging.prettify.ignore` | `["hostname"]` | string[] | Fields to hide; joined with commas for pino-pretty. |
| `logging.prettify.include` | `[]` | string[] | Fields to show; empty means pino-pretty's default. |
| `logging.prettify.hideObject` | `false` | bool | pino-pretty option. |
| `logging.prettify.singleLine` | `false` | bool | pino-pretty option. |
| `logging.log-file.enabled` | `false` | bool | Also write JSON logs to a file. |
| `logging.log-file.level` | `"trace"` | string | Minimum level written to the file. |
| `logging.log-file.path` | `"logs/redwood-backend.log"` | string | File path, absolute or relative to the process working directory (usually the `RedwoodBackend` folder). On start, an existing file is renamed to `<name>-yyyy.MM.dd-HH.mm.ss<ext>`. |
| `logging.log-file.max-archived-files` | `10` | int | How many renamed log files to keep; `-1` keeps all of them. |

The `prettify.*` keys are already written in camelCase because they're passed straight to pino-pretty. To read a JSON log file in a pretty format, run `npx pino-pretty < logs/redwood-backend.log` (the `yarn log` command mentioned in the YAML comment doesn't exist in 5.x).

## `socketio`

Defined in `default/socketio.yaml`. Read by every service.

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `socketio.tls.enabled` | `false` | bool | Serve every Socket.IO server over HTTPS/WSS using the files below, and use `wss://` for internal connections. If TLS is terminated by something in front of the services (like Cloudflare or an ingress), leave this `false` and set `tls: true` on the relevant `*.connection.external` objects instead; those only change the scheme in URLs handed to clients. |
| `socketio.tls.keyFile` | `null` | string | Path to the PEM private key, relative to the working directory. Note the camelCase key name. |
| `socketio.tls.certFile` | `null` | string | Path to the PEM certificate. |

All Redwood servers accept websocket connections only. An HTTP `GET /` returns the name of the service, which is handy for checking a hostname routes where you expect.

## `probe-server`

Defined in `default/probe-server.yaml`. Each service (and the Sidecar) can run a tiny HTTP server for Kubernetes health probes.

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `probe-server.enabled` | `false` | bool | Start the probe server. The `kubernetes` environment enables it. **Keep it disabled for the Dev Initiator**: every service runs in one process, so the second service fails to bind the port. Kubernetes deployments always add probes to their pods, so deploying from an environment that doesn't enable this makes pods fail their startup probe and restart. |
| `probe-server.port` | `9797` | int | Port for the probe endpoints, also used for the probe definitions in the generated Kubernetes Deployments and Agones Fleets. |
| `probe-server.probes.startup.path` | `"/startup"` | string | Startup probe path. All probe endpoints return 200 once the server is up. |
| `probe-server.probes.liveness.path` | `"/liveness"` | string | Liveness probe path. |
| `probe-server.probes.readiness.path` | `"/readiness"` | string | Readiness probe path. |
| `probe-server.probes.<probe>.initial-delay-seconds` | `0` | int | Kubernetes probe setting for Redwood microservice pods. |
| `probe-server.probes.<probe>.period-seconds` | `10` | int | Kubernetes probe setting. |
| `probe-server.probes.<probe>.timeout-seconds` | `1` | int | Kubernetes probe setting. |
| `probe-server.probes.<probe>.success-threshold` | `1` | int | Kubernetes probe setting. |
| `probe-server.probes.<probe>.failure-threshold` | startup `30`, liveness `3`, readiness `90` | int | Kubernetes probe setting. With a 10 second period, startup allows 5 minutes and readiness 15 minutes. |

The timing settings apply to the Redwood microservice Deployments only. Agones game server pods use Kubernetes' default timings.

## `sidecar`

Defined in `default/sidecar.yaml`. The Sidecar runs next to every game server and relays between Unreal and the Realm Backend. Most of its configuration is sent to it by the Realm Backend when it authenticates.

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `sidecar.connection.ports.sidecar` | `3020` | int | The port the Sidecar listens on when the game server isn't told otherwise. Used inside Agones and Edgegap containers and by the `dev-debug` provider. The Unreal server connects to `ws://127.0.0.1:<port>` (it reads `-SidecarPort=` from its command line and falls back to `3020`). **Not used by the `local` provider**, which picks ports from 7000 to 7099. |
| `sidecar.connection.ports.game` | `7777` | int | The game server's port for Agones (the Fleet's container port) and the `dev-debug` provider. Not used by the `local` provider. |
| `sidecar.connection.host` | `"127.0.0.1"` | string | Only used by the `stub` test game server to reach its Sidecar. |
| `sidecar.agones.health-check.period` | `5` | number (seconds) | Must match the Agones GameServer health check period (Agones' default is 5). |
| `sidecar.agones.health-check.frequency-per-period` | `2` | number | How many Agones health pings to send per period. At least 1; decimals are fine. |
| `sidecar.development.allow-reset` | `true` | bool | Unused in 5.x. |

:::note
Game server Docker images bake in the `environment`, `auth.local.hash`, `probe-server`, `logging`, `socketio`, and `sidecar` values from the config environment used to **build** the image. Rebuild the game server image after changing them.
:::

## `tests`

Defined in `default/tests.yaml`.

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `tests.artillery.key` | `""` | string | yes | Artillery Cloud key used by Redwood's internal load tests. You don't need it. |
