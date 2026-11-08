---
sidebar_position: 4
sidebar_label: AWS Secrets Manager
---

# AWS Secrets Manager Provider

The `aws-secrets-manager` provider uses [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/). Each Redwood secret reference (`secret|my_secret`) is looked up as a Secrets Manager secret ID, using its current (`AWSCURRENT`) version.

## Configuration

|Variable|Default Value|Description|
|-|-|-|
|`secrets.provider`|`none`|Set to `aws-secrets-manager` to use this provider|
|`secrets.aws-kms.region`|`us-east-1`|The AWS region where you have Secrets Manager set up|

For example, in `config/node/your-game/secrets.yaml`:

```yaml
provider: "aws-secrets-manager"

aws-kms:
  region: "us-west-2"
```

:::note
The provider is named `aws-secrets-manager`, but its settings live under `secrets.aws-kms`.
:::

In addition to the above non-sensitive configuration, you need to provide AWS credentials. The provider uses the standard AWS SDK credential chain, so you can set the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables (or use any other method the AWS SDK supports) before running Redwood commands. When you [deploy to Kubernetes](../../deploying-to-kubernetes/prerequisites.md), these environment variables are copied into the backend pods.
