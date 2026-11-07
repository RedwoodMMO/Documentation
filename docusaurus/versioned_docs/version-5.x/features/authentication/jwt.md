---
sidebar_position: 7
sidebar_label: JWT
---

# JSON Web Token Authentication

The `jwt` provider lets you use your own authentication system: your service issues a [JSON Web Token](https://auth0.com/docs/secure/tokens/json-web-tokens), and Redwood verifies it with the secret used to sign it. The player's Redwood account is linked to the value of a claim in the token (the `sub` claim by default), so the same user always gets the same account.

## Configuration

|Variable|Description|
|-|-|
|`auth.allowed-providers`|Must include `jwt`|
|`auth.jwt.secret`|A string specifying the secret used to sign the JWT. This can be used with the [secrets](../secrets/overview.md) system.|
|`auth.jwt.claim-fields.provider-id`|A string specifying the name of the claim that should be used as the provider ID (the unique ID of the user in your system). Defaults to `sub`.|

## Unreal

There's no dedicated node for this provider. Use the normal **Login** node (`URedwoodClientGameSubsystem::Login`) with:

| Input | Value |
| --- | --- |
| **Username** | The value of the token's provider ID claim (e.g. its `sub`); it must match exactly |
| **Password** (`PasswordOrToken` in C++) | The JWT |
| **Provider** | `jwt` |

If the token is invalid, its signature doesn't match `auth.jwt.secret`, or the username doesn't match the claim, **Login** reports an `Error` with `Invalid JWT login details`. On a player's first login, Redwood creates their account with the claim value as both their username and nickname.
