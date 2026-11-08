---
sidebar_position: 1
sidebar_label: Overview
---

# Config Reference

This section documents **every configuration variable** in the Redwood 5.x backend: its default value, what it actually does in the code, which service reads it, and whether it can be stored in a [secrets provider](../../features/secrets/overview.md). The defaults live in `RedwoodBackend/config/node/default`; you override them in your own [config environment](../overview.md#customization).

If you're new to the config system, read the [Configuration Overview](../overview.md) first. This page covers the handful of rules you need to read the reference tables correctly.

## Reading the Tables

### Key paths

Every variable is written as a dotted path, e.g. `realm.instances.default.game-servers.local.project`. Each segment comes from a folder, a YAML file name, or a nested object:

| Path segment | Comes from |
| --- | --- |
| `realm` | the `realm/` folder |
| `instances` | the `realm/instances/` folder |
| `default` | the `realm/instances/default.yaml` file |
| `game-servers.local.project` | nested objects inside `default.yaml` |

Contents of `_index.yaml` (or `index.yaml`) files belong to the folder itself and don't add a segment. For example, `realm/_index.yaml` defines `realm.challenges.timeout`.

### Kebab-case and camelCase

You write keys in kebab-case (`ready-timeout-seconds`). After all files are merged, the config system converts every key to camelCase (`readyTimeoutSeconds`) unless the object, or one of its parents, sets `variableCasing`:

| `variableCasing` value | Effect |
| --- | --- |
| *(not set)* or `"camel"` | Keys are converted to camelCase (the default) |
| `"original"` | Keys stay exactly as written; no camelCase copy is made |
| `"both"` | Both spellings are kept |

The setting is inherited by every child object. Redwood uses `"original"` in a few places where the keys are names rather than variables: `game.profiles[].zones` (so a zone named `mountain-pass` stays `mountain-pass`), `deployment.redwood`, and `deployment.dependencies` (so Helm values keep their chart-native names).

:::warning
Inside an `original` subtree, kebab-case is **not** converted for you. That's why fields inside a zone must be written in camelCase (`syncItemsFromZones`, not `sync-items-from-zones`). Also, don't spell the same key both ways in different environments (e.g. `foo-bar` in one and `fooBar` in another); when both exist in one object after merging, the kebab-case one is dropped with a console error.
:::

The code reads keys with either spelling (`config.get("game-servers.ready-timeout-seconds")` works against both a converted and an `original` subtree), so the tables below use the kebab-case spelling you write in YAML.

### Referencing other variables

A string value can reference another key with `${path.to.key}`. References are resolved against the final merged tree, after camelCase conversion, so they always see your overrides.

- **Absolute** references start from the root: `${docker.registry.url}`.
- **Relative** references start with `.` or `..` and are resolved from the object that *contains* the value. For example, `realm.instances.default.development.db-file` is `"realm-${../key}-dev.db"`: the containing object is `realm.instances.default.development`, so `../key` is `realm.instances.default.key`.

A reference to a missing key throws an error at startup (`Could not find value for key ...`). A reference to a `null` value is left as the literal `${...}` text.

### Lists replace

Objects deep-merge across environments, but **lists (arrays) replace** the inherited value entirely. If you want to add one item to `auth.allowed-providers` or `game.shard-names`, copy the whole list into your environment.

### The `redwoodBase` template

Two folders use a special `_index.yaml` key, `incantaConfigBase: "redwoodBase"`:

- `realm/instances/` (one entry per [realm](../realm-instance-config.md))
- `deployment/kubernetes/instances/` (one entry per Kubernetes cluster)

In those folders, `redwoodBase.yaml` is a **template**: after all environments are merged, it's merged underneath every sibling entry. That's why `realm/instances/default.yaml` only needs `key`, `name`, and `deployed`, and why you can add a realm by creating `realm/instances/my-realm.yaml` with just the values that differ. The `redwoodBase` entry itself stays in the tree with `deployed: false` (or `enabled: false`) so it's never deployed; don't set those to `true` in `redwoodBase`.

In the reference pages, realm keys are written as `realm.instances.<key>.…` and cluster keys as `deployment.kubernetes.instances.<id>.…`.

### Secrets

Values marked **Secret: yes** in the tables can be stored in your [secrets provider](../../features/secrets/overview.md) instead of in YAML:

```yaml
# The whole value comes from the secret named "admin_password"
admin:
  default-user:
    password: "secret|admin_password"
```

You can also embed a secret inside a larger string with parentheses, e.g. `"postgres://redwood:(secret|db_password)@db.example.com/redwood"`. A `${...}` reference to a value that is a secret keeps it a secret, which is how `deployment-access.password` inherits `runtime-access.password`.

:::warning
Secret references only work for keys the code reads with secret resolution (the ones marked in these tables). Anywhere else, the service sees the literal string `secret|...`.
:::

### Inspecting the merged config

When in doubt about what value a service will see, print the merged config for an environment:

```bash
yarn cli get-config <your-env>                 # everything
yarn cli get-config <your-env> -k game.profiles # one key
yarn cli get-config <your-env> -s              # resolve secrets too
```

## Pages

| Default file(s) | Top-level keys | Reference page |
| --- | --- | --- |
| `_index.yaml`, `logging.yaml`, `socketio.yaml`, `probe-server.yaml`, `sidecar.yaml`, `tests.yaml`, `admin/` | `environment`, `logging`, `socketio`, `probe-server`, `sidecar`, `tests`, `admin` | [Environment and Services](./environment.md) |
| `auth.yaml` | `auth` | [Authentication](./auth.md) |
| `director.yaml` | `director` | [Director](./director.md) |
| `realm/_index.yaml`, `realm/instances/*` | `realm` | [Realms](./realm.md) |
| `game.yaml` | `game` | [Game](./game.md) |
| `chat/text.yaml`, `email/*` | `chat.text`, `email` | [Text Chat and Email](./chat-and-email.md) |
| `secrets.yaml`, `persistence/*` | `secrets`, `persistence` | [Secrets and Persistence](./secrets-and-persistence.md) |
| `deployment/**`, `docker.yaml` | `deployment`, `docker` | [Deployment](./deployment.md) |
| `dashboard.yaml` | `dashboard` | Unused in 5.x (see below) |

## Built-in Environments

These environments ship in `config/node` alongside `default`. You normally inherit from them rather than edit them.

| Environment | Parents | What it changes |
| --- | --- | --- |
| `default` | (none) | Every key and its default. Always loaded first. |
| `standard` | `default` | Points Kubernetes deployments at the precompiled `core-runner` and `match-function` images that ship with the Standard License, and sets `deployment.redwood.config-dir: "config"`. Inherit from this if you have a Standard License. |
| `kubernetes` | `default` | Switches to PostgreSQL, real Redis, S3 blob storage (SeaweedFS), Agones game servers, Open Match matchmaking, text chat, probes, and in-cluster hostnames. See [Deploying Locally](../../deploying-to-kubernetes/deploying-locally.md). |
| `staging` | `kubernetes` | Production-like: `environment.development: false`, the default-secrets check on, debug services off, Docker images built outside Pulumi, and the `core-runner` images. |
| `production` | `staging` | Also enables the metrics server and expects an external (managed) PostgreSQL database. |
| `simple-chat` | `default` | Enables text chat for use with the Dev Initiator plus `yarn deploy:chat`. See [Text Chat](../../features/social/text-chat.md). |
| `test`, `test-mocks`, `test-memurai`, `test-standard` | | Used by Redwood's automated tests. |

## Keys That Exist but Are Unused in 5.x

These keys are defined in the default config but nothing in the 5.x code reads them (or the value has no effect). You can ignore them; changing them does nothing.

| Key | Why it's unused |
| --- | --- |
| `dashboard.*` (the whole `dashboard.yaml` file) | The admin dashboard package isn't part of 5.x. |
| `persistence.redis.replicas.host` / `.port` | The services always connect to `persistence.redis.master`. |
| `realm.instances.<key>.persistence.blobs.s3.base-dir` | S3 object keys are written at the bucket root without this prefix. If several realms share a bucket, give each realm its own bucket. |
| `sidecar.development.allow-reset` | Not read. |
| `deployment.pulumi.encryption.provider` | Never passed to Pulumi; the Pulumi backend's default secrets provider is always used. (`deployment.pulumi.encryption.passphrase` *is* used.) |
| `deployment.redwood.prisma.sync-type` | `yarn deploy` always runs `prisma migrate deploy`; the Dev Initiator always runs `prisma db push`. |
| `deployment.kubernetes.instances.<id>.pools.backend` / `.game-servers` | Not read. |
| `deployment.kubernetes.instances.<id>.dependencies.postgresql.externalDbId` | Not read. |
| `deployment.kubernetes.instances.<id>.region.provider-id` | Passed along but never used; only `region.name` and `region.ping` matter. |
| `realm.instances.<key>.game-servers.agones.fleet.nodeSelectorKey` | The code that would use it is commented out; Fleets get no node selector. |
| `director.gateway.deployment.replicas` | The Director gateway always runs exactly 1 replica. |
| `realm.instances.<key>.listed` | Only applied by `yarn deploy` (when it registers realms with the Director). The Dev Initiator always lists every realm. |

A few keys only matter in one deployment style; those are called out on their pages (for example, `game-servers.local.*` only applies to the `local` provider).

## Undocumented Keys Read by the Code

These keys aren't in the default YAML files, but the 5.x code reads them if you define them. They're documented on their respective pages:

- `game.profiles[].collection-ends-when-any-shard-ends` ([Game](./game.md#profiles))
- `game.profiles[].game-servers` and `game.profiles[].zones.<zone>.gameServers` ([Game](./game.md#per-profile-and-per-zone-game-server-overrides))
- The `stub` and `dev-debug` values for `game-servers.provider` ([Realms](./realm.md#game-server-provider))

Environment variables that affect the backend: `NODE_CONFIG_ENV` (default config environment), `NODE_CONFIG_DIR` (config folder), `NODE_CONFIG_SKIP_ENV_WARNING`, `RW_PASSWORD` (password for [CLI](../../features/cli.md) commands), and the credential variables used by the [secrets providers](../../features/secrets/overview.md).
