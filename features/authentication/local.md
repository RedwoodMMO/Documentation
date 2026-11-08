---
sidebar_position: 2
sidebar_label: Username/Password (Local)
---

# Basic Username/Password Authentication

The `local` provider is a standard username/password system. Players call a register function with the Director Frontend, providing the username and password. The provider creates a unique salt for the user and generates a hash using [PBKDF2](https://en.wikipedia.org/wiki/PBKDF2). Both the salt and the hash are stored in the database. By default, we use the [currently recommended number of iterations](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2) (`210000`) for PBKDF2-HMAC-SHA512.

:::info
When using the Dev Initiator in local development (SQLite), the username/email field is case sensitive, however when using PostgreSQL (e.g. in Kubernetes, locally or remotely) the username/email is case insensitive. The registered username keeps its case in the database, but subsequent logins do not need to match the case in the database, and registering the same name with a different case will not succeed.
:::

:::warning
`local` should be secure enough to be used in production as of the time of writing (Jan 2026), but please consider the security risks and potentially change [the default hash iterations and length config variables](#configuration).
:::

## Configuration

|Variable|Description|
|-|-|
|`auth.local.account-type`|A string enum that can be `username` (default) or `email`. If `email` is selected, the server validates that a valid email address is provided (`Invalid email address` otherwise).|
|`auth.local.account-verification`|A boolean set to `false` by default; if set to `true`, new accounts must verify their email address before logging in. Redwood sends the verification email with your configured [transactional email provider](../transactional-email/overview.md). Only works with the `email` account type.|
|`auth.local.hash.iterations`|The number of iterations to use for the PBKDF2 hashing algorithm; defaults to `210000`; only consider decreasing this in development environments for speed.|
|`auth.local.hash.length`|The length of the hash using the SHA algorithm. Defaults to `512`.|
|`director.development.auto-verify-email`|Defaults to `true`. When `environment.development` is `true` (e.g. with the Dev Initiator), new accounts are automatically verified about a second after registering, so you can test the verification flow without sending emails.|

`local` must be in [`auth.allowed-providers`](./overview.md#how-to-specify-which-provider-is-used) for players to register (it is by default).

## Unreal

Use **Register** and **Login** (or `URedwoodClientGameSubsystem::Register` and `Login`) with the Provider `local`. The full flow, including **Remember Me** and **Attempt Auto-Login**, is in [Building the Main Menu](../../getting-started/building-the-main-menu.md#2-log-in-or-register).

## Email Verification Flow

When `account-verification` is enabled:

1. The player registers. **Register** reports `MustVerifyAccount`, and Redwood emails the player a link to `<director frontend>/verify-email/<code>`.
1. The player clicks the link, which shows "Email verified" in their browser.
1. If the game is still running and connected, the same **Register** node fires again with `Success`.
1. The game calls **Login**. (Neither the registration nor the verification logs the player in.)

If the player closes the game before verifying, they verify later and then log in normally. You can stop waiting for the verification with **Cancel Waiting for Account Verification**.

:::caution Known issue (5.0.0)
Logging in to an account that hasn't been verified yet returns the error `Must verify email`, but the plugin only recognizes `Must verify account`. **Login** therefore reports `Error` with the message `Must verify email` instead of `MustVerifyAccount` (and clears any remembered login). Check for that message if you want to show a "please verify your email" prompt.
:::
