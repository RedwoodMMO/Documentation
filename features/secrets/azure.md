---
sidebar_position: 5
sidebar_label: Azure Key Vault
---

# Azure Key Vault Provider

The `azure-key-vault` provider uses [Azure Key Vault](https://azure.microsoft.com/products/key-vault).

## Configuration

|Variable|Default Value|Description|
|-|-|-|
|`secrets.provider`|`none`|Set to `azure-key-vault` to use this provider|
|`secrets.azure-key-vault.endpoint`|`https://yourvault.vault.azure.net/`|The endpoint to your Key Vault instance.|

Each Redwood secret reference (`secret|my_secret`) is looked up as a Key Vault secret with that name. Key Vault secret names can only contain letters, numbers, and dashes, so name your references accordingly.

In addition to the above non-sensitive configuration, you need to specify the authentication details for Key Vault. You can do this by setting the `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` environment variables before running Redwood commands. When you [deploy to Kubernetes](../../deploying-to-kubernetes/prerequisites.md), these environment variables are copied into the backend pods.

