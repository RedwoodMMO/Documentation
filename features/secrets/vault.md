---
sidebar_position: 3
sidebar_label: Vault
---

# Vault Secrets Provider

The `vault` provider uses HashiCorp's self-hosted [Vault](https://developer.hashicorp.com/vault) service. Redwood does not deploy a Vault instance for you.

## Configuration

|Variable|Default Value|Description|
|-|-|-|
|`secrets.provider`|`none`|Set to `vault` to use this provider|
|`secrets.vault.endpoint`|`http://127.0.0.1:8200`|The URL endpoint of your Vault server|
|`secrets.vault.namespace`||The namespace of your secrets; leave empty if you're not using Vault namespaces|
|`secrets.vault.path-prefix`||Prefix for secrets (e.g. `myproject/`)|
|`secrets.vault.kv-engine`|`v2`|`v1` or `v2`|
|`secrets.vault.engine-name`|`secret`|The name of the KV engine in Vault|

Each Redwood secret reference (`secret|my_secret`) is read from the path `<engine-name>/<path-prefix><name>` (with `data/` added for the `v2` engine). **The secret must contain a key named `value`**; that's the value Redwood uses.

In addition to the above non-sensitive configuration, you need to specify the authentication details for Vault. You can do this by setting the `VAULT_ROLE_ID` and `VAULT_SECRET_ID` environment variables before running Redwood commands. When you [deploy to Kubernetes](../../deploying-to-kubernetes/prerequisites.md), these environment variables are copied into the backend pods.

Redwood uses the `AppRole` authentication method. You can see instructions on setting up a new AppRole [in the Vault docs](https://developer.hashicorp.com/vault/docs/auth/approle).
