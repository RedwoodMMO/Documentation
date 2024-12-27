---
sidebar_position: 2
sidebar_label: HCP Vault
---

# HCP Vault Secrets Provider

The `hcp-vault` provider uses HashiCorp's managed Vault service (not the self-hosted, open source Vault project). HCP Vault provides a free tier that can definitely work in development with fair pricing for production cases. Redwood tries to limit the number of API requests with [caching](./overview.md#caching) to reduce costs and optimize performance.

## Configuration

|Variable|Description|
|-|-|
|`hcp-vault.organization-id`|A string of the Organization ID to use. You can find this by going to https://portal.cloud.hashicorp.com/orgs, selecting the organization, and copying the UUID in the URL (`.../orgs/<org-id>`)|
|`hcp-vault.project-id`|A string of the Project ID to use. From the organization page retrieved above, select `Projects` on the side panel and pick a project. The Project ID is the last part in the id (`.../projects/<project-id>`)|
|`hcp-vault.app-name`|A string of the App Name to use. Navigate to `https://portal.cloud.hashicorp.com/services/secrets/apps?project_id=<project-id>` (replacing `<project-id>`) and use the `Name` field for this config variable|

In addition to the above non-sensitive configuration, you need to store the authentication details for HCP Vault. You need to set the `HCP_CLIENT_ID` AND `HCP_CLIENT_SECRET` environment variables. Here's how to generate these:

1. Go to `https://portal.cloud.hashicorp.com/access/service-principals?org_id=<org-id>&project_id=<project-id>` (replacing `<org-id>` and `<project-id>`)
1. Click the `Create service principal` button if there isn't an existing service principal you'd like to use
1. Under `Select service`, choose `Secrets` and under `Select role(s)` choose `Vault Secrets APp Secret Reader` **only**
1. Click Save/Submit
1. In the created service principal, select `Keys` in the side panel
1. Click the `Generate key` button
1. Copy the Client ID and Client Secret and add them to your environment as `HCP_CLIENT_ID` and `HCP_CLIENT_SECRET` respectively before running the backend (we'll be making this easier to do in the next update)
