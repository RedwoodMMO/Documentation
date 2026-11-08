---
sidebar_position: 7
sidebar_label: JWT
---

# JSON Web Token Authentication

The `jwt` provider will accept any [JSON Web Token](https://auth0.com/docs/secure/tokens/json-web-tokens) as the `PasswordOrToken` argument in the `URedwoodClientGameSubsystem::Login` function. Make sure you set `Provider` argument to `jwt` so the backend knows how to process it.

## Configuration

|Variable|Description|
|-|-|
|`auth.jwt.secret`|A string specifying the secret used to sign the JWT. This can be used with the [secrets](../secrets/overview.md) system.|
|`auth.jwt.claim-fields.provider-id`|A string specifying the name of the claim that should be used as the provider ID. Defaults to `sub`.|
