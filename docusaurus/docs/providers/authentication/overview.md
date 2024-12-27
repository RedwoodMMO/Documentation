---
sidebar_position: 1
sidebar_label: Overview
---

# Authentication Providers

Redwood keeps identities for users in the database, but is flexible on how you authenticate those users.

- [**Local**](./local.md) - A basic username/password authentication provider with optional email verification
- [**Steam**](./steam.md) - Users automatically authenticate when they launch the game through Steam

## How to specify which provider is used?

You can enable one or more authentication providers to be allowed to be used, which is helpful for cross-platform games.

The config variable `auth.allowed-providers` takes an array of string enums, which can be `local` or `steam`. You can see the default defined as just `local` in `RedwoodBackend/config/node/default/auth.yaml`.

You can [override this variable](../../configuration/overview.md#customization) yourself in your own config environment.
