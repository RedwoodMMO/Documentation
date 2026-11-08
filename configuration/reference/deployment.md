---
sidebar_position: 9
sidebar_label: Deployment
---

# Deployment Config

Defined in `default/deployment/` and `default/docker.yaml`. These keys are only read by the deployment scripts (`yarn deploy`, `yarn docker`, `yarn check-secrets`, and `yarn deploy:chat`), never by the running services (with two exceptions noted below). See [Deploying to Kubernetes](../../deploying-to-kubernetes/prerequisites.md) for the walkthrough.

## Cloud

Defined in `default/deployment/_index.yaml`.

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `deployment.cloud` | `"local"` | `"local"` or `"custom"` | `local` deploys to the cluster in your `~/.kube/config`, which must be Rancher Desktop or Docker Desktop (current context `rancher-desktop` or `docker-desktop`), with Traefik disabled, and with exactly one enabled cluster. `custom` deploys to each enabled cluster using its `kubeconfig` value. |

## Pulumi

Defined in `default/deployment/pulumi.yaml`. Redwood uses [Pulumi](https://www.pulumi.com/) to create Kubernetes resources and keeps its state in a Pulumi backend.

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `deployment.pulumi.local-mode` | `true` | bool | | Store state on your machine (`file://~`) instead of `url`. Also skips the Pulumi keys in the default-secrets check. |
| `deployment.pulumi.url` | `"https://api.pulumi.com"` | string | | Backend URL, the same as `pulumi login <url>`: Pulumi Cloud, `file://<path>`, `s3://`, `gs://`, or `azblob://`. Ignored in local mode. |
| `deployment.pulumi.access-token` | `""` | string | yes | Pulumi Cloud access token (personal or organization). Ignored in local mode or for `file://` URLs. |
| `deployment.pulumi.allow-insecure` | `false` | bool | | Pass `--insecure` to `pulumi login`. |
| `deployment.pulumi.encryption.provider` | `"default"` | string | | Unused in 5.x; the backend's default secrets provider is always used. |
| `deployment.pulumi.encryption.passphrase` | `""` | string | yes | Exported as `PULUMI_CONFIG_PASSPHRASE`, which file-based and cloud storage backends use to encrypt secrets in the state. |
| `deployment.pulumi.org` | `"organization"` | string | | Pulumi Cloud organization (passed as `--default-org`). Ignored for file and cloud storage backends, and when left as `"organization"`. |
| `deployment.pulumi.project` | `"project"` | string | | Pulumi project name. |
| `deployment.pulumi.stack` | `"dev"` | string | | Pulumi stack name. Use a different stack per environment (e.g. `staging`, `production`). |

## DNS

Defined in `default/deployment/dns.yaml`.

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `deployment.dns.provider` | `"none"` | `"none"` or `"cloudflare"` | | When `cloudflare`, `yarn deploy` creates A records pointing at the cluster's ingress for the Director Frontend, the Director Backend, each realm's Frontend, and each realm's Backend (unless the backend host is an in-cluster `svc.cluster` name). An existing record with the same name but a different value is **replaced**. The zone is taken from the last two labels of each host, so multi-part TLDs like `.co.uk` aren't supported. |
| `deployment.dns.cloudflare.proxied` | `true` | bool | | Proxy the records through Cloudflare. If you do, set `tls: true` on the matching `external` connections. |
| `deployment.dns.cloudflare.credentials.account-id` | `""` | string | | Your Cloudflare account ID. |
| `deployment.dns.cloudflare.credentials.token` | `""` | string | yes | A Cloudflare API token that can edit DNS for your zones. |

## Redwood Services

Defined in `default/deployment/redwood.yaml` (`variableCasing: "original"`).

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `deployment.redwood.nodeSelector` | `null` | object or null | Kubernetes `nodeSelector` for every Redwood microservice Deployment (not Helm charts, text chat, or game servers). E.g. `{ "pool": "backend" }`. |
| `deployment.redwood.debug` | `true` | bool | Create an extra `<service>-debug` Service per microservice exposing its Node inspector port (`*.debug-port`) so you can attach a debugger. `staging`: `false`. |
| `deployment.redwood.config-dir` | `"config/node"` | string | Where the generated config is mounted inside each container. Must match the image: `config/node` for `-dev` images, `config` for `core-runner` images (the `standard` and `staging` environments set `config`). |
| `deployment.redwood.prisma.sync-type` | `"db push"` | string | Unused in 5.x; `yarn deploy` always runs `prisma migrate deploy`. |

:::note
`yarn deploy` writes the **entire resolved config** of the environment into each service's ConfigMap. Prefer the secrets system for sensitive values so they don't end up in plain text there.
:::

## Kubernetes Clusters

Defined in `default/deployment/kubernetes/instances/`. Like realms, every entry inherits from `redwoodBase.yaml`, and `k8s-default.yaml` defines the default cluster. Keys below are relative to `deployment.kubernetes.instances.<id>`.

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `id` | `""` (`k8s-default`) | string | | The cluster's ID. **Must equal its file name** (realms find their region with `deployment.kubernetes.instances.<realm k8s.id>`). Referenced by `director.k8s.id` and `realm.instances.<key>.k8s.id`. |
| `enabled` | `false` (`k8s-default`: `true`) | bool | | Deploy to this cluster. |
| `kubeconfig` | `null` | string or null | yes | The **contents** of a kubeconfig file (not a path). Required for `deployment.cloud: custom`; ignored for `local`. |
| `region.name` | `"Local"` | string | | Region name shown to players and used for matchmaking, for realms using Agones in this cluster. **Read by the running realm services.** |
| `region.ping` | `"127.0.0.1"` | string | | Host or IP that clients ping to measure latency to this region. Must be publicly reachable for real clusters. **Read by the running realm services.** |
| `region.provider-id` | `"local"` | string | | Unused in 5.x. |
| `dependencies.ingress.values` | `null` | object | | Helm values merged over `deployment.dependencies.ingress.values` for this cluster. The ingress controller is always installed. |
| `dependencies.grafana.enabled` | `false` | bool | | Install the Grafana agent operator and Kubernetes monitoring charts. |
| `dependencies.grafana.agentOperatorValues` | `null` | object | | Per-cluster Helm values for `grafana-agent-operator`. |
| `dependencies.grafana.k8sMonitoringValues` | `null` | object | | Per-cluster Helm values for `grafana-k8s-monitoring`. |
| `dependencies.metricsServer.enabled` | `false` (`production`: `true`) | bool | | Install `metrics-server` (Rancher Desktop already has one). |
| `dependencies.metricsServer.values` | `null` | object | | Per-cluster Helm values. |
| `dependencies.openMatch.enabled` | `true` | bool | | Install Open Match. Only installed when `redis.enabled` is also true. Required for realms using `ticketing.matchmaking.provider: open-match`. |
| `dependencies.openMatch.values` | `null` | object | | Per-cluster Helm values. |
| `dependencies.postgresql.useExternalDb` | `false` (`production`: `true`) | bool | | `false` installs PostgreSQL in the cluster (without persistent storage; development only) and runs migrations through a port-forward. `true` uses your managed database via the `deployment-access` settings. The cluster named by `director.k8s.id` decides this for migrations. |
| `dependencies.postgresql.externalDbId` | `""` | string | | Unused in 5.x. |
| `dependencies.postgresql.values` | `null` | object | | Per-cluster Helm values. |
| `dependencies.redis.enabled` | `true` | bool | | Install Redis in the cluster. **Required**: Redwood's deployment expects the in-cluster Redis. |
| `dependencies.redis.values` | `null` | object | | Per-cluster Helm values. |
| `dependencies.seaweedfs.enabled` | `true` | bool | | Install SeaweedFS for S3-compatible [blob storage](./realm.md#blob-storage). |
| `dependencies.seaweedfs.auth.admin.accessKey` / `.secretKey` | `"seaweedfs-admin"` | string | yes | Credentials for SeaweedFS's admin identity. |
| `dependencies.seaweedfs.auth.backend.accessKey` / `.secretKey` | `"seaweedfs-backend"` | string | yes | Credentials for the identity realms use (the realm `persistence.blobs.s3.connection.credentials` default to the `k8s-default` cluster's values). |
| `dependencies.seaweedfs.values` | `null` | object | | Per-cluster Helm values. |
| `dependencies.agones.values` | `null` | object | | Per-cluster Helm values for Agones, which is installed when any realm on the cluster uses the `agones` provider. |
| `pools.backend` / `pools.game-servers` | `true` | bool | | Unused in 5.x. |

## Helm Dependencies

Defined in `default/deployment/dependencies/` (`variableCasing: "original"`, so Helm values keep their chart spelling). Every chart has the same fields:

| Field | What it does |
| --- | --- |
| `repo` | Helm repository URL. |
| `version` | Chart version. |
| `chart` | Chart name, also used as the Helm release name. Don't rename it; Redwood looks up some releases by this name. |
| `namespace` | Namespace for the release. |
| `createNamespace` | Create the namespace if missing. |
| `wait` | Wait for the release to be ready. |
| `values` | Helm values for every cluster, deep-merged with each cluster's `dependencies.<chart>.values`. Processed for secret references. |

| Key | Chart and version | Namespace | Installed when | Notable defaults |
| --- | --- | --- | --- | --- |
| `deployment.dependencies.ingress` | `ingress-nginx` `4.13.3` | `default` | always | Long proxy read/write timeouts (3600 s) for websockets. |
| `deployment.dependencies.grafana-agent-operator` | `grafana-agent-operator` `0.3.8` | `observability` | `grafana.enabled` | |
| `deployment.dependencies.grafana-k8s-monitoring` | `grafana-k8s-monitoring` `0.2.11` | `observability` | `grafana.enabled` | Placeholder Prometheus, Loki, and OpenCost settings you must fill in. |
| `deployment.dependencies.metrics-server` | `metrics-server` `3.13.0` | `metrics-server` | `metricsServer.enabled` | |
| `deployment.dependencies.open-match` | `open-match` `1.8.1` (from `cdn.incanta.games`) | `open-match` | `redis.enabled` and `openMatch.enabled` | Uses the in-cluster Redis (the hostname embeds `persistence.redis.password`, so it can't be a secret reference). `pendingReleaseTimeout: "1m"` should stay above `ticketing.matchmaking.max-match-age-ms`. |
| `deployment.dependencies.postgresql` | `postgresql` `12.12.10` (Bitnami, PostgreSQL 15) | `persistence` | `useExternalDb: false` | No persistent volume. `values.auth.postgresPassword` and `values.auth.password` (secrets supported) default to `"password"` and `"redwood"`. |
| `deployment.dependencies.redis` | `redis` `20.13.4` (Bitnami) | `persistence` | `redis.enabled` | `maxmemory 400mb` with `noeviction`, 512Mi memory limit, no replicas or persistence. The password always comes from `persistence.redis.password`. |
| `deployment.dependencies.seaweedfs` | `seaweedfs` `4.0.399` | `persistence` | `seaweedfs.enabled` | S3 API with auth enabled. |
| `deployment.dependencies.agones` | `agones` `1.53.0` | `agones-system` | a realm on the cluster uses `agones` | `values.gameservers.namespaces` is `["realm-default"]`. **Add every Agones realm's `k8s.namespace` to this list** (it's a list, so copy the whole value). |

## Docker

Defined in `default/docker.yaml`.

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `docker.build-in-pulumi` | `true` | bool | | Build images as part of `yarn deploy`. `staging`: `false`; we recommend building and pushing images with `yarn docker <env>` or CI and setting the `image-tag` values instead. |
| `docker.use-buildkit` | `true` | bool | | Use BuildKit for builds inside `yarn deploy` (`yarn docker` always does). |
| `docker.push-images` | `false` | bool | | Push images built by `yarn deploy` to the registry. (`yarn docker` pushes unless you pass `--skip-push`.) |
| `docker.registry.url` | `"yourcr.com/container-registry"` | string | | Your container registry, without a trailing slash. **Leaving the placeholder value** means "no registry": images must already exist in the local cluster's Docker (Rancher Desktop or Docker Desktop) and are never pulled. Any other value creates an image pull Secret in each namespace and always pulls. |
| `docker.registry.secret-name` | `"redwood-container-registry-secret"` | string | | Name of the image pull Secret. |
| `docker.registry.auth.username` | `"yourcr-username"` | string | | Registry username. |
| `docker.registry.auth.password` | `"yourcr-password"` | string | yes | Registry password or token. |
| `docker.image-prefix` | `"${docker.registry.url}/redwood"` | string | | Prefix for every Redwood image name (`<prefix>-dev`, `<prefix>-core-runner`, `<prefix>-match-function`, `<prefix>-game-server`). |
