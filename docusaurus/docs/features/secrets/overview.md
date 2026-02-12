---
sidebar_position: 1
sidebar_label: Overview
---

# Secrets Providers

There are lots of "secrets" that are generated to configure Redwood properly. These include passwords, API keys, and other sensitive information. Redwood's config system integrates a secrets system for you to store these secrets somewhere else, while allowing you to add non-sensitive references to version control.

- **None** - Does nothing with the configured secret references, returning them as-is
- [**Local**](./local.md) - Secrets are stored in a local file on disk
- [**Vault**](./vault.md) - Secrets are stored in a self-hosted HashiCorp Vault instance
- [**AWS Secrets Manager**](./aws.md) - Secrets are stored in [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [**Azure Key Vault**](./azure.md) - Secrets are stored in [Azure Key Vault](https://azure.microsoft.com/products/key-vault)
- [**GCP Secret Manager**](./gcp.md) - Secrets are stored in [Google Cloud Secret Manager](https://cloud.google.com/security/products/secret-manager)

:::warning
We no longer support HashiCorp's managed HCP Vault Secrets SaaS since it the service was [sunset on June 30, 2025.](https://developer.hashicorp.com/hcp/docs/vault-secrets/end-of-sale-announcement).
:::

## How to specify which provider is used?

The config variable `secrets.provider` takes a string enum, which can be `none`,`local`,`vault`,`aws-secrets-manager`,`azure-key-vault`,or `gcp-secret-manager`. You can see the default defined as `none` in `RedwoodBackend/config/node/default/secrets.yaml`.

You can [override this variable](../../configuration/overview.md#customization) yourself in your own config environment.

## Caching

Secrets can sometimes be requested several times, especially during the backend initialization. For performance and sometimes cost reasons, the secret system implements a caching mechanism to store secret values in RAM reuse secret values for a certain duration before refreshing the cached value.

You can change the cache duration by changing the `secrets.cache-duration-seconds` value, which defaults to `1800` (or 30 minutes).

## How to leverage the secrets system

Secret references use the syntax `secret|<secret_name_reference>`. If the value of field that supports secrets doesn't have the `secret|` prefix, it won't be processed like a secret and the plaintext value will be used. For example:

``` yaml
docker:
  registry-auth:
    password: "secret|do_registry_password"
```

To optimize performance and reduce API calls, not all variables support secrets. If a variable supports it, you can see that it has the comment `# This can be a secret in the secrets provider` in the associated default value in `RedwoodBackend/config/node/default/**/*.yaml`.

You can add secrets support for a variable in each of the corresponding TypeScript code references:

``` diff
- config.get<string>("docker.registry-auth.password"); // note that this is a synchronous function
+ await config.getWithSecrets<string>("docker.registry-auth.password"); // note this is an asynchronous function
```

You can fetch secrets on an entire object too, and all the child fields with the `secret|` prefix will be assessed:

``` ts
interface Auth {
  notSecret: string;
  key: string;
  secret: string;
}

const bothKeyAndSecretCanBeSecrets = await config.getWithSecrets<Auth>("my-auth-key");
```

:::note
All secrets are processed as strings. You will need to further processing/parsing if you need them to be in a different type.
:::
