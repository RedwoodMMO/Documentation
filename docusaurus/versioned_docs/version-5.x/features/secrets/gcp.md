---
sidebar_position: 6
sidebar_label: GCP Secret Manager
---

# GCP Secret Manager Provider

The `gcp-secret-manager` provider uses [Google Cloud Secret Manager](https://cloud.google.com/security/products/secret-manager).

## Configuration

|Variable|Default Value|Description|
|-|-|-|
|`secrets.gcp-secret-manager.project-id`|`your-project-id`|The Google Cloud project ID for your Secret Manager instance.|
|`secrets.gcp-secret-manager.credentials-file`|`gcp-credentials.json`|The relative path from the root of the backend directory to look for a JSON file that [Google Cloud generates for you](https://developers.google.com/workspace/guides/create-credentials#create_credentials_for_a_service_account) containing credential details.|
