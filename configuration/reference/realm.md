---
sidebar_position: 5
sidebar_label: Realms
---

# Realm Config

Realm configuration comes from two places:

- `default/realm/_index.yaml`: settings shared by **every** realm (`realm.challenges`, `realm.sidecar-auth`, and `realm.deployment`).
- `default/realm/instances/`: one entry per realm, `realm.instances.<key>`. Every entry inherits from the `redwoodBase.yaml` template (see [The `redwoodBase` template](./index.md#the-redwoodbase-template)), and `default.yaml` defines the `default` realm. Each realm runs its own Realm Frontend, Realm Backend, Realm Gateway, and Ticketing services.

For a friendlier walkthrough, see [Realm Instance Config](../realm-instance-config.md) and [Realms](../../features/realms.md).

:::tip
To customize the `default` realm, create `realm/instances/default.yaml` in your environment with just the keys you want to change. To add a realm, create `realm/instances/<new-key>.yaml` with at least `key`, `name`, and `deployed: true`. To disable the `default` realm, set `deployed: false` in your `realm/instances/default.yaml`.
:::

## Shared Realm Settings (`realm.*`)

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `realm.challenges.timeout` | `60000` | int (ms) | How long an authentication challenge between the Realm Frontend and Realm Backend stays valid. |
| `realm.challenges.prune-interval` | `60000` | int (ms) | How often expired challenges are cleaned up. |
| `realm.sidecar-auth.rotation-interval-ms` | `300000` | int (ms) | How often the Realm Backend rotates each connected Sidecar's bearer token. The previous token stays valid until the next rotation to cover reconnects. |
| `realm.sidecar-auth.session-expiry-ms` | `900000` | int (ms) | Sliding expiry for a Sidecar's token, refreshed on every rotation. A Sidecar that's silent for longer can't re-authenticate and its game server must be reallocated. |
| `realm.deployment.<service>.image` | `"${docker.image-prefix}-dev"` | string | Kubernetes image for each realm service. `<service>` is `backend`, `frontend`, `gateway`, `ticketing-director`, `ticketing-worker`, or `match-function`. The `standard` and `staging` environments switch these to `${docker.image-prefix}-core-runner` (and `-match-function` for the match function). The image tag comes from the realm's `image-tag`. |
| `realm.deployment.<service>.command` | `["/bin/bash", "-lc", "yarn postinstall && yarn start --debug <service>"]` | string[] or null | Container command. `standard`/`staging` use `["/app/app", "<service>"]` (e.g. `realm-backend`, `ticketing-worker`); `null` uses the image entrypoint (the match function in `standard`/`staging`). The `standard` environment doesn't override `gateway`; set it to the `core-runner` image with `["/app/app", "realm-gateway"]` if you deploy with a Standard License. |

## Realm Instances (`realm.instances.<key>.*`)

All keys below are relative to `realm.instances.<key>`. Defaults come from `redwoodBase.yaml`.

### Basic details

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `key` | `""` (`default` realm: `"default"`) | string | Unique identifier for the realm. Use the same value as the file name. It's used in Redis keys, the default hostnames (`realm-<key>.localhost` and `realm-<key>-backend.localhost`), the SQLite file name, and the Kubernetes namespace. Use lowercase letters, numbers, and dashes. |
| `name` | `""` (`default` realm: `"Default"`) | string | Display name shown to players in the realm list. Also used by the CLI's `--realm` option, and in the Kubernetes ingress name, so avoid spaces and special characters if you deploy. |
| `deployed` | `false` (`default` realm: `true`) | bool | Whether this realm runs at all (in the Dev Initiator and in `yarn deploy`). |
| `listed` | `true` | bool | Whether the realm appears in the Director's realm list (`ListRealms`). Applied by `yarn deploy` only; the Dev Initiator lists every realm. |
| `image-tag` | `"latest"` | string | Docker image tag for this realm's services in Kubernetes. |
| `development.db-file` | `"realm-${../key}-dev.db"` | string | SQLite database file used when `persistence.database.provider` is `sqlite`, relative to the `RedwoodBackend` folder. |

### Auth

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `auth.id` | `"00000000-0000-0000-0000-000000000000"` | string | | The realm's ID, used when the realm authenticates with the Director. |
| `auth.secret` | `"0000…"` (43 zeros) | string | yes, but see the [known issue](./secrets-and-persistence.md) with `yarn deploy` | The realm's secret for that authentication. |

The Dev Initiator replaces the placeholder values with generated ones, so you don't need to set them for local development. For Kubernetes, generate a pair with `yarn id` (it prints a UUID and a random secret) and set both. `yarn deploy` registers the realm with the Director using these values.

### Kubernetes

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `k8s.id` | `"k8s-default"` | string | Which [cluster](./deployment.md#kubernetes-clusters) to deploy the realm to. Must match an enabled `deployment.kubernetes.instances.<id>`. Also used to look up the region name and ping address for Agones realms. |
| `k8s.namespace` | `"realm-${../key}"` | string | Namespace for all of the realm's resources. If the realm uses Agones, also add this namespace to `deployment.dependencies.agones.values.gameservers.namespaces`. |

### Database

Only used when `persistence.database.provider` is `postgresql`. Each realm has its own schema.

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `persistence.database.runtime-access.host` | `"127.0.0.1"` | string | | How realm services reach PostgreSQL. `kubernetes`: `postgresql.persistence.svc.cluster.local`. |
| `persistence.database.runtime-access.port` | `5432` | int | | |
| `persistence.database.runtime-access.database` | `"redwood"` | string | | |
| `persistence.database.runtime-access.schema` | `"realm"` | string | | Give each realm a different schema (or database) if they share a server. |
| `persistence.database.runtime-access.user` | `"redwood"` | string | | |
| `persistence.database.runtime-access.password` | `"redwood"` | string | yes | |
| `persistence.database.deployment-access.*` | host `"localhost"`, port `-1`, the rest `${../runtime-access.*}` | | password: yes | How `yarn deploy` reaches the database for migrations. Port `-1` means "port-forward to the in-cluster PostgreSQL". See the [Director equivalents](./director.md#database). |

### Blob storage

Blob storage holds files the game server saves with the [Blob Storage](../../features/data/storage/blob-storage.md) API.

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `persistence.blobs.provider` | `"stub"` | `"none"`, `"stub"`, or `"s3"` | | `stub` stores files on the local disk (development). `s3` uses any S3-compatible store. `none` disables blob storage (requests fail with `Blobs are not enabled`). `kubernetes`: `s3` (SeaweedFS in the cluster). |
| `persistence.blobs.max-key-bytes` | `255` | int | | Maximum blob key length. Keys must also match `^[A-Za-z0-9_\-./]+$`. |
| `persistence.blobs.max-blob-bytes` | `10485760` (10 MiB) | int | | Maximum size of a single blob upload. |
| `persistence.blobs.stub.base-dir` | `"./blobs/"` | string | | Folder for `stub` blobs, absolute or relative to the working directory. |
| `persistence.blobs.s3.bucket` | `"mybucket"` | string | | S3 bucket name. |
| `persistence.blobs.s3.base-dir` | `"/redwood/realm/${../../../key}/blobs/"` | string | | **Unused in 5.x**; blobs are stored at the bucket root. Use a separate bucket per realm. |
| `persistence.blobs.s3.connection.endpoint` | `"http://seaweedfs-s3.persistence.svc.cluster.local:8333"` | string | | S3 endpoint URL (passed to the AWS SDK `S3Client`). |
| `persistence.blobs.s3.connection.region` | `"us-east-1"` | string | | |
| `persistence.blobs.s3.connection.force-path-style` | `true` | bool | | Use path-style URLs (required for SeaweedFS and many S3-compatible stores). |
| `persistence.blobs.s3.connection.credentials.access-key-id` | the in-cluster SeaweedFS backend key | string | yes | Leave both credentials empty for unauthenticated (anonymous) requests. |
| `persistence.blobs.s3.connection.credentials.secret-access-key` | the in-cluster SeaweedFS backend secret | string | yes | |

### Gateway

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `gateway.enabled` | `true` | bool | Run this realm's Realm Gateway, which lets the Director reach players and servers in the realm. Leave it on. |
| `gateway.debug-port` | `10111` | int | Kubernetes debug Service port (fixed inspector port). |

### Realm Backend and Frontend

The **Realm Frontend** is what game clients connect to after picking a realm. The **Realm Backend** is what game server Sidecars connect to.

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `backend.replicas` | `1` | int | Number of Realm Backend pods in Kubernetes. |
| `backend.debug-port` | `10102` | int | Kubernetes debug Service port. |
| `backend.connection.internal.host` | `"127.0.0.1"` | string | Host other realm services use. `kubernetes`: `backend.<namespace>.svc.cluster.local`. |
| `backend.connection.internal.port` | `3010` | int | Port the Realm Backend listens on. |
| `backend.connection.external.host` | `"realm-${../../../key}-backend.localhost"` | string | Hostname **game server Sidecars** use to reach the Realm Backend. Must be a hostname, not an IP. With Agones in the same cluster, this can be the internal service name (the `kubernetes` environment does this, so no ingress or DNS record is created). With Edgegap, it must be publicly reachable; for a local backend, use a tunnel (e.g. ngrok). |
| `backend.connection.external.port` | `3010` | int | |
| `backend.connection.external.tls` | `false` | bool | Use `wss://` in the URL given to Sidecars. |
| `frontend.replicas` | `1` | int | Number of Realm Frontend pods. |
| `frontend.debug-port` | `10103` | int | Kubernetes debug Service port. |
| `frontend.connection.internal.host` | `"127.0.0.1"` | string | `kubernetes`: `frontend.<namespace>.svc.cluster.local`. |
| `frontend.connection.internal.port` | `3011` | int | Port the Realm Frontend listens on. |
| `frontend.connection.external.host` | `"realm-${../../../key}.localhost"` | string | Hostname **game clients** use to connect to this realm. It becomes the realm's URL in the realm list. Must be a hostname, not an IP. |
| `frontend.connection.external.port` | `3011` | int | `kubernetes`: `80`. |
| `frontend.connection.external.tls` | `false` | bool | Use `wss://` for the realm's URL in Kubernetes deployments. (The Dev Initiator always registers `ws://`.) |

### Game servers

See [Game Server Hosting](../../features/game-servers/hosting/overview.md) for an overview of the providers.

#### Game server provider

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `game-servers.provider` | `"local"` | string | How game servers are started. `kubernetes`: `agones`. Can be overridden per profile or zone in [`game.profiles`](./game.md#per-profile-and-per-zone-game-server-overrides). |

| Provider | What it does |
| --- | --- |
| `local` | Runs your project with the Unreal editor executable in `-server` mode (uncooked content) for every game server. The Sidecar runs inside the backend process. See [Local hosting](../../features/game-servers/hosting/local.md). |
| `agones` | Allocates packaged Linux servers from an Agones Fleet in the realm's Kubernetes cluster. See [Agones](../../features/game-servers/hosting/agones.md). |
| `edgegap` | Deploys packaged servers through the Edgegap API. Cross-server [sync](../../features/sync-items.md) is disabled for Edgegap; persistence still works. See [Edgegap](../../features/game-servers/hosting/edgegap.md). |
| `dev-debug` | Starts no process. The Sidecar listens on `sidecar.connection.ports.sidecar` (`3020`) and expects you to run the server yourself, e.g. in PIE with **Play as Client** and **Use Backend in PIE** enabled, so you can debug server code with the editor. Requires `environment.development: true`; players are matched to existing characters by index. |
| `stub` | Starts a fake game server written in TypeScript, inside the backend. Used by Redwood's automated tests; it also speeds up internal timers drastically. |

#### General

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `game-servers.ready-timeout-seconds` | `180` | int | How long to wait for a game server to start and load its map before giving up with `Start server request timed out`. Uncooked `local` servers can be slow; we use `300` in development. |
| `game-servers.repeat-state-interval-seconds` | `5` | number | The Sidecar re-sends the game server's state to the Realm Backend at this interval even if it hasn't changed, so a missed update can't leave stale state. `0` disables (not recommended). |
| `game-servers.allow-player-creation` | `true` | bool | Allow non-admin players to create their own proxies (e.g. lobbies) with `CreateProxy`. When `false`, they get `Server creation by players is disabled for this realm.` |
| `game-servers.shard-prune-interval` | `5000` | int (ms) | How often the Realm Backend checks for stopped or empty [shards](../../features/game-servers/sharding.md). |
| `game-servers.host-override` | `null` | string or null | Replace the host in the game server address sent to clients. Useful to let other machines on your LAN join servers in a local Kubernetes cluster. |
| `game-servers.local-dir` | `"LinuxServer"` | string | Kubernetes only: the folder under `RedwoodBackend/dist/game-servers/` containing your packaged Linux server, used to build the game server Docker image. Not used by the `local` provider. |
| `game-servers.image-name` | `"${docker.image-prefix}-game-server"` | string | Kubernetes only: game server image name. |
| `game-servers.image-tag` | `"latest"` | string | Kubernetes only: game server image tag. |
| `game-servers.build` | `true` | bool | Kubernetes only: build the game server image during `yarn deploy`/`yarn docker`. |

#### `local` provider

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `game-servers.local.unreal.path` | `"../Engine/Binaries/Win64"` | string | Folder containing the editor executable, absolute or relative to the `RedwoodBackend` folder. On macOS, point inside the app bundle: `.../UnrealEditor.app/Contents/MacOS`. Checked when a server is started (`Executable not found at path ...`). Also used by `dev-debug`. |
| `game-servers.local.unreal.executable` | `"UnrealEditor.exe"` | string | Executable name (`UnrealEditor` on macOS and Linux). |
| `game-servers.local.project` | `"C:\\Path\\To\\MyGame.uproject"` | string | Path to your `.uproject`. **You must change this** (`Project not found at path ...`). |
| `game-servers.local.arguments` | `""` | string | Extra arguments for the server process, e.g. `"-log"` to open a log window per server. Split on single spaces (no quoting). |
| `game-servers.local.log-to-terminal` | `false` | bool | Pipe each server's stdout and stderr into the backend's terminal. |

The `local` provider launches: `<path>/<executable> <project> -server -port=<game port> -SidecarPort=<sidecar port> -pieviaconsole <arguments>`. Both ports are picked from the range **7000 to 7099** (the first server gets Sidecar `7000` and game `7001`). No map is passed on the command line; the server boots into your project's **Server Default Map** and then the Sidecar tells it which map to load.

#### `agones` provider

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `game-servers.agones.arguments` | `""` | string | Extra arguments for the packaged server process. **Also used by the `edgegap` provider.** |
| `game-servers.agones.allocation-timeout-seconds` | `60` | int | How many times (one second apart) to retry allocating a game server from the Fleet before giving up. Allocation fails when the Fleet is at its maximum or no nodes are available; consider a larger `bufferSize`. |
| `game-servers.agones.fleet.name` | `"game-server-fleet"` | string | Fleet name. |
| `game-servers.agones.fleet.eviction-safe` | `"Never"` | `"Always"`, `"OnUpgrade"`, or `"Never"` | Agones eviction policy for game server pods. |
| `game-servers.agones.fleet.game-server-container-details.resources` | requests `500Mi`/`90m`, limits `1Gi`/`500m` | object | Kubernetes resource requests and limits for the game server container. |
| `game-servers.agones.fleet.autoscaler.policy` | `Buffer` with `bufferSize: 1`, `minReplicas: 0`, `maxReplicas: 10` | object | Agones FleetAutoscaler policy, passed through as-is. |
| `game-servers.agones.fleet.autoscaler.sync` | `FixedInterval` every `1` second | object | Agones FleetAutoscaler sync settings. |
| `game-servers.agones.fleet.nodeSelectorKey` | `""` | string | Unused in 5.x. |

:::note
Keys inside these pass-through objects are camelCased by the config system, so write them the way Agones and Kubernetes spell them (e.g. `bufferSize`, `minReplicas`).
:::

#### `edgegap` provider

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `game-servers.edgegap.credentials.api-token` | `""` | string | yes | Your Edgegap API token. |
| `game-servers.edgegap.application` | `""` | string | | Your Edgegap application name. |
| `game-servers.edgegap.version` | `""` | string | | The application version slug to deploy. |

### Parties

See [Parties](../../features/social/parties.md).

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `parties.enabled` | `true` | bool | Enable parties. Also makes ticketing party-aware (only the leader can queue, and the whole party transfers together). |
| `parties.max-size` | `4` | int | Maximum party members (`Party is full`). |
| `parties.max-invites` | `3` | int | Maximum pending invites a player can have. |
| `parties.included-character-fields` | `["characterCreatorData", "metadata"]` | string[] | Character fields included for each member in party updates. Valid: `characterCreatorData`, `metadata`, `equippedInventory`, `nonequippedInventory`, `progress`, `data`, `abilitySystem`. |

### Ticketing

See [Ticketing](../../features/ticketing/overview.md), [Queuing](../../features/ticketing/queuing.md), and [Matchmaking](../../features/ticketing/matchmaking/simple-match.md).

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `ticketing.process-interval` | `5000` | int (ms) | How often Ticketing processes queued tickets. |
| `ticketing.replicas` | `1` | int | Number of Ticketing worker pods in Kubernetes (the ticketing director always runs one). |
| `ticketing.debug-port` | `10107` | int | Kubernetes debug Service port. |
| `ticketing.queue.enabled` | `true` | bool | Enable [queuing](../../features/ticketing/queuing.md) (joining a specific proxy, zone transfers). |
| `ticketing.matchmaking.enabled` | `true` | bool | Enable matchmaking. |
| `ticketing.matchmaking.provider` | `"simple-match"` | `"simple-match"` or `"open-match"` | `simple-match` runs inside Ticketing and is great for development and smaller games. `open-match` uses [Open Match](../../features/ticketing/matchmaking/open-match.md) in Kubernetes plus Redwood's match function service. `kubernetes`: `open-match`. |
| `ticketing.matchmaking.ticket-stale-time-ms` | `60000` | int (ms) | A matchmaking ticket that hasn't found a match in this time goes stale; the client needs to retry. Uncooked servers can take longer than a minute to start, so we use `120000` in development. |
| `ticketing.matchmaking.max-match-age-ms` | `30000` | int (ms) | Maximum age of a proposed match. Keep it below Open Match's `pendingReleaseTimeout` (`1m` by default). |
| `ticketing.matchmaking.max-wait-until-make-shallow-match-ms` | `45000` | int (ms) | How long the oldest ticket waits before a match smaller than `max-players-per-shard` (but at least `min-players-for-matchmaking`) is made. Lower it while testing alone. |
| `ticketing.matchmaking.open-match.frontend.endpoint` | `"http://open-match-frontend.open-match.svc.cluster.local:51504"` | string | Open Match frontend API. |
| `ticketing.matchmaking.open-match.backend.endpoint` | `"http://open-match-backend.open-match.svc.cluster.local:51505"` | string | Open Match backend API. |
| `ticketing.matchmaking.open-match.query.endpoint` | `"http://open-match-query.open-match.svc.cluster.local:51503"` | string | Open Match query API. |
| `ticketing.matchmaking.open-match.match-function.host` | `"http://match-function.${../../../../k8s.namespace}.svc.cluster.local"` | string | Where Open Match reaches Redwood's match function service. |
| `ticketing.matchmaking.open-match.match-function.port` | `4000` | int | Match function port. |
| `ticketing.matchmaking.open-match.match-function.name` | `"default"` | string | Which match function to run: `packages/match-function/src/match-functions/<name>.ts`. Add your own file to customize matchmaking. |
| `ticketing.matchmaking.open-match.match-function.replicas` | `1` | int | Match function pods. |
| `ticketing.matchmaking.open-match.match-function.debug-port` | `10106` | int | Kubernetes debug Service port. |
| `ticketing.matchmaking.open-match.match-function.scoring-weights.age` | `1` | number | How much the default match function favors older tickets. Equal numbers mean equal preference. |
| `ticketing.matchmaking.open-match.match-function.scoring-weights.ping` | `1` | number | How much it favors lower ping. |
| `ticketing.matchmaking.open-match.match-function.scoring-weights.players` | `1` | number | How much it favors fuller matches. |

### Default proxy

See [Default Proxy](../../features/realms.md#default-proxy). A proxy is a persistent "server" entry players can join (see [Game Servers](../../architecture/game-servers.md#gameserverproxy)).

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `start-proxies-on-boot-delay-seconds` | `15` | number | Seconds after the Realm Backend boots before it starts proxies marked "start on boot" and creates the default proxy. |
| `default-proxy.create-on-first-boot.enabled` | `false` | bool | Create the default proxy automatically if no proxy with `create-on-first-boot.name` exists yet. |
| `default-proxy.create-on-first-boot.name` | `"Default Proxy"` | string | Name of the auto-created proxy. |
| `default-proxy.profile-id` | `""` | string | **Required** to create a default proxy: the [game profile](./game.md#profiles) `id` to use. Otherwise creation fails with `Invalid profileId`. |
| `default-proxy.map-id` | `null` | string or null | Force a specific map; `null` picks randomly from each zone's `maps`. |
| `default-proxy.region` | `null` | string or null | Region name to host it in (`Local` for the `local` provider, the cluster's `region.name` for Agones). `null` picks the first region. |
| `default-proxy.public` | `true` | bool | List the proxy for everyone in `ListProxies`. |
| `default-proxy.password` | `null` | string or null | Password required to join. |
| `default-proxy.proxy-ends-when-collection-ends` | `false` | bool | End the proxy when its servers stop, instead of keeping it around to restart later. |
| `default-proxy.continuous-play` | `false` | bool | Passed to the game server's load details as `continuousPlay` for your game logic to use. |
| `default-proxy.start-on-boot` | `false` | bool | Start the proxy's servers every time the Realm Backend boots. |

### Characters

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `characters.archival-period-days` | `1` | number | Days an archived character is kept before it's deleted (checked hourly). `0` deletes characters as soon as they're archived. `-1` never deletes them. |
| `characters.players-can-update-character-creator-data` | `"always"` | `"always"`, `"initial"`, or `"never"` | Whether clients can set `characterCreatorData`. `always`: on create and with `SetCharacterData`. `initial`: only when creating the character. `never`: not even on create (set it from your game server instead). Disallowed data is dropped with a warning in the log. |

:::warning
With `archival-period-days: 0`, un-archiving a character in 5.x also deletes it. Use a value of at least `1` if your game lets players restore archived characters.
:::
