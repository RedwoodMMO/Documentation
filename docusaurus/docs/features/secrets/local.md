---
sidebar_position: 2
sidebar_label: Local
---

# Local Secrets Provider

The `local` provider uses a file on disk with a simple INI-style key-value format to store secrets. This is useful for development and in some production environments as you don't need to host a separate service for the secrets.

:::warning
You can use the Local provider in production, but we recommend considering to use a more robust and tolerant secrets service. These services give you other features like that are useful for teams and larger projects:
- Access control
- Versioning
- Archiving
:::

## Configuration

|Variable|Default Value|Description|
|-|-|-|
|`secrets.vault.endpoint`|`http://127.0.0.1:8200`|This is the path to the file, relative to the backend root directory.|

## File Format

The file should have a simple `key=value` format. Values are interpreted as strings and **should not** be wrapped in quotes. It's recommended for keys to use `_` instead of `-` as word separators.

For example:

``` ini
my_secret=my_value
secret_two=My value with spaces
```

:::warning
Keys and values will have trailing/leading whitespace automatically removed. Please let us know if this impacts you.
:::
