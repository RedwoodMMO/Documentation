---
sidebar_position: 4
sidebar_label: AWS Secrets Manager
---

# AWS Secrets Manager Provider

The `aws-secrets-manager` provider uses [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/).

## Configuration

|Variable|Default Value|Description|
|-|-|-|
|`secrets.aws-secrets-manager.region`|`us-east-1`|The region where you have Secrets Manager set up.|

In addition to the above non-sensitive configuration, you need to specify the authentication details for Secrets Manager. You can do this by setting the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables before running Redwood commands.