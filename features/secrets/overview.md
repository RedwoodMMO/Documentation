---
sidebar_position: 1
sidebar_label: Overview
---

# Secrets Providers

There are lots of "secrets" needed to configure Redwood properly. These include passwords, API keys, and other sensitive information. Redwood's config system integrates a secrets system so you can store these secrets somewhere else, while still committing non-sensitive references to version control.

- **None** - Does nothing with the configured secret references, returning them as-is
- [**Local**](./local.md) - Secrets are stored in a local file on disk
- [**Vault**](./vault.md) - Secrets are stored in a self-hosted HashiCorp Vault instance
- [**AWS Secrets Manager**](./aws.md) - Secrets are stored in [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [**Azure Key Vault**](./azure.md) - Secrets are stored in [Azure Key Vault](https://azure.microsoft.com/products/key-vault)
- [**GCP Secret Manager**](./gcp.md) - Secrets are stored in [Google Cloud Secret Manager](https://cloud.google.com/security/products/secret-manager)

:::warning
We no longer support HashiCorp's managed HCP Vault Secrets SaaS since the service was [sunset on June 30, 2025](https://developer.hashicorp.com/hcp/docs/vault-secrets/end-of-sale-announcement). Setting the provider to `hcp-vault` throws an error.
:::

## How to specify which provider is used?

The config variable `secrets.provider` takes a string enum, which can be `none`, `local`, `vault`, `aws-secrets-manager`, `azure-key-vault`, or `gcp-secret-manager`. The default (in `config/node/default/secrets.yaml`) is `none`.

You can [override this variable](../../configuration/overview.md#customization) in your own config environment, for example in `config/node/your-game/secrets.yaml`:

```yaml
provider: "local"
```

See the [secrets config reference](../../configuration/reference/secrets-and-persistence.md) for every variable.

## Caching

Secrets can be requested several times, especially during backend initialization. For performance (and sometimes cost) reasons, the secrets system caches each secret value in memory for a certain duration before fetching it again.

You can change the cache duration with `secrets.cache-duration-seconds`, which defaults to `1800` (30 minutes). There's no hot reload; a rotated secret is picked up the next time its cached value expires.

## How to leverage the secrets system

### Referencing a secret

Secret references use the syntax `secret|<secret_name>`. If the value of a field that supports secrets doesn't have the `secret|` prefix, it's used as a plaintext value. For example:

``` yaml
docker:
  registry:
    auth:
      password: "secret|do_registry_password"
```

You can also embed one or more secrets inside a larger string by wrapping each reference in parentheses, `(secret|<secret_name>)`:

```yaml
some-connection-string: "postgres://redwood:(secret|db_password)@db.example.com:5432/redwood"
```

If a config value references another value with `${...}` and that value is a secret reference, the reference is carried along, so it's resolved as a secret too. For example, the default `director.persistence.database.deployment-access.password` is `${director.persistence.database.runtime-access.password}`, so setting only the `runtime-access` password to a secret reference covers both.

:::note
All secrets are processed as strings. You'll need to do further parsing if you need them to be a different type.
:::

### Which variables support secrets?

To keep things fast and reduce API calls, not every variable supports secrets; secret references are only resolved where the backend reads the value with the secrets system. In the default config files (`config/node/default/**/*.yaml`), these variables are marked with the comment `# This can be a secret in the secrets provider`. As of 5.0, that includes:

| Area | Variables |
| --- | --- |
| Admin | `admin.default-user.password` |
| Auth | `auth.admin.secret`, `auth.jwt.secret`, `auth.steam.api-key`, `auth.discord.client.secret`, `auth.twitch.client.secret` |
| Director | `director.persistence.database.runtime-access.password`, `director.persistence.database.deployment-access.password`, `director.gateway.secret` |
| Realms | `realm.instances.<key>.auth.secret` (but see this [known issue](../../configuration/reference/secrets-and-persistence.md) with `yarn deploy`), `...persistence.database.runtime-access.password`, `...persistence.database.deployment-access.password`, `...persistence.blobs.s3.connection.credentials.access-key-id`, `...secret-access-key`, `...game-servers.edgegap.credentials.api-token` |
| Redis | `persistence.redis.password` |
| Deployment | `docker.registry.auth.password`, `deployment.dns.cloudflare.credentials.token`, `deployment.pulumi.access-token`, `deployment.pulumi.encryption.passphrase`, `deployment.kubernetes.instances.<id>.kubeconfig`, the in-cluster PostgreSQL passwords, and the SeaweedFS keys |
| Tests | `tests.artillery.key` |

:::warning
The email provider API keys (`email.sendgrid.api-key` and `email.zeptomail.api.key`) **don't** support secrets in 5.0; they're used as plaintext.
:::

### Adding secrets support to a variable

If you have source access, you can add secrets support for a variable by changing the corresponding TypeScript code that reads it:

``` diff
- config.get<string>("docker.registry.auth.password"); // note that this is a synchronous function
+ await config.getWithSecrets<string>("docker.registry.auth.password"); // note this is an asynchronous function
```

You can fetch secrets for an entire object too, and all the child fields with the `secret|` prefix will be resolved:

``` ts
interface Auth {
  notSecret: string;
  key: string;
  secret: string;
}

const bothKeyAndSecretCanBeSecrets = await config.getWithSecrets<Auth>("my-auth-key");
```

## Secrets in Kubernetes

When you [deploy to Kubernetes](../../deploying-to-kubernetes/prerequisites.md), the deployment scripts make the provider's credentials available to the backend pods for you:

| Provider | What the deployment does |
| --- | --- |
| `local` | Copies your secrets file into a Kubernetes Secret and mounts it in each pod |
| `vault`, `aws-secrets-manager`, `azure-key-vault` | Copies the provider's authentication environment variables (from the machine running the deployment) into the pods |
| `gcp-secret-manager` | Mounts the credentials file in each pod |

## Checking for Placeholder Secrets

Production-like environments (anything inheriting from `staging`, which includes `production`) have `environment.check-for-default-secrets.enabled` set to `true`. When it's on, `yarn deploy` refuses to deploy while any of the listed secret variables still resolves to the placeholder value shipped in `config/node/default` (e.g. the `admin` admin password or the all-zeros realm secret). You can run the same check yourself with:

```bash
yarn check-secrets <your-config-env>
```

See the [environment config reference](../../configuration/reference/environment.md) for the list of checked keys.
