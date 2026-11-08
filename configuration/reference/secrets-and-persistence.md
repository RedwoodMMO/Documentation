---
sidebar_position: 8
sidebar_label: Secrets and Persistence
---

# Secrets and Persistence Config

## Secrets

Defined in `default/secrets.yaml`. See [Secrets](../../features/secrets/overview.md) for setup guides per provider, and [Secrets](./index.md#secrets) on the reference overview for the `secret|name` syntax.

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `secrets.provider` | `"none"` | string | Where secret references are looked up: `none`, `local`, `vault`, `aws-secrets-manager`, `azure-key-vault`, or `gcp-secret-manager`. With `none`, values are used as written (a secret reference stays a literal string). `hcp-vault` was removed because HashiCorp discontinued the service. |
| `secrets.cache-duration-seconds` | `1800` | int | How long a fetched secret is reused before it's fetched again. Rotated secrets are picked up on the next fetch; there's no other reload. |

### Local file

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `secrets.local.file-path` | `".secrets"` | string | A text file with one `name=value` per line, relative to the working directory (the `RedwoodBackend` folder). In Kubernetes, `yarn deploy` copies this file into a Kubernetes Secret and mounts it in each pod. Fine for development; we don't recommend it for production. |

### HashiCorp Vault

Authenticates with AppRole using the `VAULT_ROLE_ID` and `VAULT_SECRET_ID` environment variables (copied into pods by `yarn deploy`). Each secret must have a field named `value`.

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `secrets.vault.endpoint` | `"http://127.0.0.1:8200"` | string | Vault server URL. |
| `secrets.vault.namespace` | `""` | string | Vault namespace; leave empty if you don't use namespaces. |
| `secrets.vault.path-prefix` | `""` | string | Prefix added to every secret name (e.g. `"myproject/"`). |
| `secrets.vault.kv-engine` | `"v2"` | `"v1"` or `"v2"` | KV secrets engine version. |
| `secrets.vault.engine-name` | `"secret"` | string | Mount name of the KV engine. |

### AWS Secrets Manager

Credentials come from the standard AWS environment (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, copied into pods by `yarn deploy`). The secret name is used as the `SecretId`.

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `secrets.aws-kms.region` | `"us-east-1"` | string | AWS region of your Secrets Manager. The settings live under `aws-kms` even though the provider is named `aws-secrets-manager`. |

```yaml
# secrets.yaml in your config environment
provider: "aws-secrets-manager"
aws-kms:
  region: "us-west-2"
```

### Azure Key Vault

Credentials come from the `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` environment variables (copied into pods by `yarn deploy`).

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `secrets.azure-key-vault.endpoint` | `"https://yourvault.vault.azure.net/"` | string | Your Key Vault URL. |

### Google Cloud Secret Manager

Reads `projects/<project-id>/secrets/<name>/versions/latest`.

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `secrets.gcp-secret-manager.project-id` | `"your-project-id"` | string | Your GCP project ID. |
| `secrets.gcp-secret-manager.credentials-file` | `"gcp-credentials.json"` | string | Service account JSON key file, relative to the `RedwoodBackend` folder. Used to set `GOOGLE_APPLICATION_CREDENTIALS` if it isn't already set. `yarn deploy` mounts it in each pod. |

### Which keys support secrets

These keys are read with secret resolution and can use `secret|name` (everything else is read as plain text):

- `admin.default-user.password`
- `auth.steam.api-key`, `auth.jwt.secret`, `auth.discord.client.secret`, `auth.twitch.client.secret`, `auth.admin.secret`
- `director.gateway.secret`
- `director.persistence.database.runtime-access.*` and `deployment-access.*`
- `persistence.redis.password`
- `realm.instances.<key>.auth.secret`
- `realm.instances.<key>.persistence.database.runtime-access.*` and `deployment-access.*`
- `realm.instances.<key>.persistence.blobs.s3.connection.*` (including the credentials)
- `realm.instances.<key>.game-servers.edgegap.credentials.api-token`
- `docker.registry.auth.password`
- `deployment.pulumi.access-token`, `deployment.pulumi.encryption.passphrase`
- `deployment.dns.cloudflare.credentials.token`
- `deployment.kubernetes.instances.<id>.kubeconfig`
- `deployment.kubernetes.instances.<id>.dependencies.seaweedfs.auth.*`
- `deployment.dependencies.<chart>.values.*` (Helm values are processed for secrets as a whole), e.g. `deployment.dependencies.postgresql.values.auth.password`
- `tests.artillery.key`

Not supported: `email.sendgrid.api-key` and `email.zeptomail.api.key`. Also, a secret can't be embedded inside a value that's built with `${...}` concatenation (like the Open Match Redis hostname, which includes `persistence.redis.password`).

:::caution Known issue (5.0.0)
`yarn deploy` registers each realm with the Director using `realm.instances.<key>.auth.secret` **without** resolving secrets, so a `secret|name` value is stored literally in the Director database while the realm services resolve the real value, and the realm can't authenticate. Keep the realm `auth.secret` as a plain value in your config environment for now.
:::

## Persistence

Defined in `default/persistence/`. See [Database](../../features/data/storage/database.md) and [Redis](../../features/data/storage/redis.md).

### Database

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `persistence.database.provider` | `"sqlite"` | `"sqlite"` or `"postgresql"` | `sqlite` stores each database in a file in the `RedwoodBackend` folder (`director.development.db-file` and `realm.instances.<key>.development.db-file`) and is only meant for the Dev Initiator. `postgresql` uses the `persistence.database.*` connection settings under `director` and each realm instance. The `kubernetes` environment sets `postgresql`. |

### Redis

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `persistence.redis.provider` | `"stub"` | `"stub"`, `"memurai"`, or `"redis"` | | `stub` is a small in-process implementation that only works when every service runs in one process (the Dev Initiator). `memurai` makes the Dev Initiator start [Memurai](https://www.memurai.com/) (a Windows Redis-compatible server) on `master.port` and connect to it. `redis` connects to an existing Redis server. The `kubernetes` environment sets `redis`. |
| `persistence.redis.memurai.path` | `"memurai.exe"` | string | | Path to the Memurai executable (or just the name if it's on your `PATH`). |
| `persistence.redis.password` | `""` | string | yes | Redis password; empty means no authentication. In Kubernetes, `yarn deploy` also uses it to configure the in-cluster Redis. The `kubernetes` environment sets `"password"`; change it for anything deployed. |
| `persistence.redis.master.host` | `"127.0.0.1"` | string | | Redis host. `kubernetes`: `redis-master.persistence.svc.cluster.local`. |
| `persistence.redis.master.port` | `16379` | int | | Redis port. `kubernetes`: `6379`. |
| `persistence.redis.replicas.host` / `.port` | `"127.0.0.1"` / `16379` | | | Unused in 5.x (all connections go to `master`). |
| `persistence.redis.jobs.auto-remove.completed.immediately` | `true` | bool | | Remove completed BullMQ jobs immediately. When `true`, `age-hours` and `count` are ignored. |
| `persistence.redis.jobs.auto-remove.completed.age-hours` | `720` | int | | Keep completed jobs up to this many hours. |
| `persistence.redis.jobs.auto-remove.completed.count` | `100` | int | | Keep up to this many completed jobs. |
| `persistence.redis.jobs.auto-remove.failed.immediately` | `false` | bool | | Same, for failed jobs (kept by default so you can inspect them). |
| `persistence.redis.jobs.auto-remove.failed.age-hours` | `720` | int | | |
| `persistence.redis.jobs.auto-remove.failed.count` | `100` | int | | |

Job retention is per job key. Keeping too many jobs grows Redis memory over time, so keep the limits reasonable in production.
