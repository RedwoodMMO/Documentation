---
sidebar_position: 6
sidebar_label: GCP Secret Manager
---

# GCP Secret Manager Provider

The `gcp-secret-manager` provider uses [Google Cloud Secret Manager](https://cloud.google.com/security/products/secret-manager). Each Redwood secret reference (`secret|my_secret`) reads the `latest` version of the secret with that name in your project.

## Configuration

|Variable|Default Value|Description|
|-|-|-|
|`secrets.provider`|`none`|Set to `gcp-secret-manager` to use this provider|
|`secrets.gcp-secret-manager.project-id`|`your-project-id`|The Google Cloud project ID for your Secret Manager instance.|
|`secrets.gcp-secret-manager.credentials-file`|`gcp-credentials.json`|The path (relative to the `RedwoodBackend` folder) to a service account JSON key file that [Google Cloud generates for you](https://developers.google.com/workspace/guides/create-credentials#create_credentials_for_a_service_account).|

If the `GOOGLE_APPLICATION_CREDENTIALS` environment variable is already set, it takes precedence over `credentials-file`.

When you [deploy to Kubernetes](../../deploying-to-kubernetes/prerequisites.md), the credentials file is mounted in the backend pods for you.
