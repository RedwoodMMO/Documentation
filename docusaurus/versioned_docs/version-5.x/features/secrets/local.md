---
sidebar_position: 2
sidebar_label: Local
---

# Local Secrets Provider

The `local` provider uses a file on disk with a simple INI-style key-value format to store secrets. This is useful for development and in some production environments as you don't need to host a separate service for the secrets.

:::warning
You can use the Local provider in production, but we recommend considering a more robust and tolerant secrets service. These services give you other features that are useful for teams and larger projects:
- Access control
- Versioning
- Archiving
:::

## Configuration

|Variable|Default Value|Description|
|-|-|-|
|`secrets.provider`|`none`|Set to `local` to use this provider|
|`secrets.local.file-path`|`.secrets`|The path to the secrets file. Relative paths are relative to the process's working directory, which is the `RedwoodBackend` folder when you run the Dev Initiator, CLI, or deployment scripts.|

For example, in `config/node/your-game/secrets.yaml`:

```yaml
provider: "local"

local:
  file-path: ".secrets"
```

:::tip
Don't commit the secrets file to source control. The whole point is to keep these values out of your repository.
:::

When you [deploy to Kubernetes](../../deploying-to-kubernetes/prerequisites.md), the deployment scripts copy this file into a Kubernetes Secret and mount it in the backend pods for you.

## File Format

The file should have a simple `key=value` format, one secret per line. Each line is split at the first `=`, so values can contain `=` characters. Values are interpreted as strings and **should not** be wrapped in quotes. We recommend using `_` instead of `-` as the word separator in keys.

For example:

``` ini
my_secret=my_value
secret_two=My value with spaces
```

Then reference them in your config with `secret|my_secret` (see the [overview](./overview.md#referencing-a-secret)).

:::warning
Keys and values have leading and trailing whitespace automatically removed. A key with an empty value is treated as missing (`No secret found with name ...`). Please let us know if this impacts you.
:::
