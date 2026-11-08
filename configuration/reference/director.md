---
sidebar_position: 4
sidebar_label: Director
---

# Director Config

Defined in `default/director.yaml`. The [Director](../../architecture/overview.md#director) handles player identities, authentication, friends, guilds, and the list of realms. It's made of three services: the **Director Frontend** (game clients), the **Director Backend** (realms connect here), and the **Director Gateway** (routes calls from the Director down to realms).

## Development

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `director.development.auto-verify-email` | `true` | bool | When `environment.development` is also `true`, accounts that require email verification are verified automatically after one second, so you can test [account verification](../../features/authentication/local.md) without an email provider. |
| `director.development.db-file` | `"director-dev.db"` | string | The SQLite database file used when `persistence.database.provider` is `sqlite`, relative to the `RedwoodBackend` folder. |

## Database

Only used when `persistence.database.provider` is `postgresql`.

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `director.persistence.database.runtime-access.host` | `"127.0.0.1"` | string | | How the running Director services reach PostgreSQL. In Kubernetes this is usually an in-cluster service or a private network address for a managed database. The `kubernetes` environment sets `postgresql.persistence.svc.cluster.local`. |
| `director.persistence.database.runtime-access.port` | `5432` | int | | |
| `director.persistence.database.runtime-access.database` | `"redwood"` | string | | |
| `director.persistence.database.runtime-access.schema` | `"director"` | string | | The Director and realms can share one database with separate schemas. |
| `director.persistence.database.runtime-access.user` | `"redwood"` | string | | |
| `director.persistence.database.runtime-access.password` | `"redwood"` | string | yes | |
| `director.persistence.database.deployment-access.host` | `"localhost"` | string | | How the machine running `yarn deploy` reaches the database to run migrations. Usually a public endpoint for a managed database. |
| `director.persistence.database.deployment-access.port` | `-1` | int | | `-1` is a special value: `yarn deploy` port-forwards to the in-cluster PostgreSQL (`deployment.kubernetes.instances.<id>.dependencies.postgresql.useExternalDb: false`) and uses the forwarded port. Set a real port for an external database. |
| `director.persistence.database.deployment-access.database` / `.schema` / `.user` | `${...runtime-access...}` | string | | Default to the runtime values. |
| `director.persistence.database.deployment-access.password` | `${director.persistence.database.runtime-access.password}` | string | yes | |

## Connections

Each service has an `internal` connection (how other Redwood services reach it, and the port it listens on) and an `external` connection (the public hostname). Servers listen on all network interfaces; `internal.host` is only the address other services dial.

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `director.frontend.connection.internal.host` | `"127.0.0.1"` | string | Host other services use to reach the Director Frontend. `kubernetes`: `frontend.director.svc.cluster.local`. |
| `director.frontend.connection.internal.port` | `3001` | int | Port the Director Frontend listens on. |
| `director.frontend.connection.external.host` | `"director.localhost"` | string | Public hostname for **game clients**. Also used to build OAuth redirect and email verification URLs, by the [CLI](../../features/cli.md) to connect, and for the Kubernetes ingress and DNS record. Your Unreal project's **Director Uri** setting must point here (e.g. `ws://director.localhost:3001` locally). |
| `director.frontend.connection.external.port` | `3001` | int | Public port. `kubernetes`: `80` (behind the ingress). |
| `director.frontend.connection.external.tls` | `false` | bool | Use `https`/`wss` in URLs built from this connection. Can differ from `socketio.tls.enabled` when TLS is terminated in front of the service (e.g. Cloudflare). |
| `director.backend.connection.internal.host` | `"127.0.0.1"` | string | Host realms use to reach the Director Backend. `kubernetes`: `backend.director.svc.cluster.local`. |
| `director.backend.connection.internal.port` | `3000` | int | Port the Director Backend listens on. |
| `director.backend.connection.external.host` / `.port` / `.tls` | `"director-backend.localhost"` / `3000` / `false` | | Only used to create an ingress rule and DNS record in Kubernetes; nothing connects to it at runtime in 5.x. You don't need a hosts entry for it locally. |
| `director.gateway.connection.internal.host` | `"127.0.0.1"` | string | Host the Director services use to reach the Director Gateway. `kubernetes`: `gateway.director.svc.cluster.local`. |
| `director.gateway.connection.internal.port` | `3002` | int | Port the Director Gateway listens on. |
| `director.gateway.connection.external.host` / `.port` / `.tls` | `"director-gateway.localhost"` / `3002` / `false` | | Ingress rule only (no DNS record is created). Not needed locally. |

## Gateway

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `director.gateway.secret` | `"change-me"` | string | yes | Shared secret the Director Frontend and Backend use to authenticate with the Director Gateway. Change it for any deployed environment. |

## Challenges

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `director.challenges.timeout` | `60000` | int (ms) | How long a service-to-service authentication challenge stays valid. |
| `director.challenges.prune-interval` | `60000` | int (ms) | How often expired challenges are cleaned up. |

## Kubernetes Deployment

These are only used by `yarn deploy`. See [Deploying to Kubernetes](../../deploying-to-kubernetes/prerequisites.md).

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `director.image-tag` | `"latest"` | string | Docker image tag for all three Director services. |
| `director.k8s.id` | `"k8s-default"` | string | The [cluster](./deployment.md#kubernetes-clusters) whose PostgreSQL setting (in-cluster or external) decides how migrations run. Must be an enabled cluster. Note that the Director is always deployed to the **first enabled cluster**. |
| `director.backend.deployment.image` | `"${docker.image-prefix}-dev"` | string | Image for the Director Backend. Images ending in `-dev` are built from `config/docker/redwood-dev` and run the TypeScript source; other names are built from `config/docker/redwood-prod` with the precompiled `core-runner` binary. `standard` and `staging`: `${docker.image-prefix}-core-runner`. |
| `director.backend.deployment.command` | `["/bin/bash", "-lc", "yarn postinstall && yarn start --debug director-backend"]` | string[] or null | Container command. `null` uses the image's entrypoint. `standard` and `staging`: `["/app/app", "director-backend"]`. |
| `director.backend.deployment.replicas` | `1` | int | Number of pods. |
| `director.backend.deployment.debug-port` | `10100` | int | Port of the extra `backend-debug` Service created when `deployment.redwood.debug` is `true`. The Node inspector port is fixed in the package scripts, so leave this at its default. |
| `director.frontend.deployment.image` / `.command` / `.replicas` / `.debug-port` | as above with `director-frontend`, `1`, `10101` | | Same as the backend, for the Director Frontend. |
| `director.gateway.deployment.image` / `.command` | as above with `realm-director-gateway director` | | Same, for the Director Gateway. `staging`: `["/app/app", "director-gateway"]`. The `standard` environment doesn't override these, so set them yourself to the `core-runner` image and `["/app/app", "director-gateway"]` if you deploy with a Standard License. |
| `director.gateway.deployment.replicas` | `1` | int | Ignored; the gateway always runs one replica. |
| `director.gateway.deployment.debug-port` | `10111` | int | Debug Service port (fixed inspector port). |
