---
sidebar_position: 2
sidebar_label: Username/Password (Local)
---

# Basic Username/Password Authentication

The `local` provider is a standard username/password system. Players will call a register function with the Director Frontend, providing the username and password. The provider will create a unique salt for the user and generate a hash using [PBKDF2](https://en.wikipedia.org/wiki/PBKDF2). Both the salt and the hash are stored in the database. By default, we use the [currently recommended number of iterations](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2) (`210000`) for PBKDF2-HMAC-SHA512.

:::info
When using the Dev Initiator in local development, the username/email field is case sensitive, however when using Kubernetes (locally or remotely) the username/email is case insensitive. The registered username will keep it's case in the database, but subsequent logins do not need to match the case in the database; also registers with a different case will not succeed.
:::

## Configuration

|Variable|Description|
|-|-|
|`auth.local.account-type`|A string enum that can be `username` (default) or `email`. Server-side validation is used if `email` is selected to make sure a valid email is provided.|
|`auth.local.account-verification`|A boolean set to `false` by default; if set to `true`, the SendGrid integration will be used to send an email for verification. Only works with the `email` account type.|
|`auth.local.hash.iterations`|The number of iterations to use for the PBKDF2 hashing algorithm; defaults to `210000`; only consider decreasing this in development environments for speed.|
|`auth.local.hash.length`|The length of the hash using the SHA algorithm. Defaults to `512`.|
