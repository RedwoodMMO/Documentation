---
sidebar_position: 1
sidebar_label: Overview
---

# Authentication Providers

Redwood keeps identities for users in the database, but is flexible on how you authenticate those users.

- [**Local**](./local.md) - A basic username/password authentication provider with optional email verification
- [**Steam**](./steam.md) - Users automatically authenticate when they launch the game through Steam
- [**Epic**](./epic.md) - Users can automatically authenticate if they launch the game through Epic Games Launcher or manually authenticate through Epic
- [**Discord**](./discord.md) - Authenticate using Discord (opens Discord in another browser window)
- [**Twitch**](./twitch.md) - Authenticate using Twitch (opens Twitch in another browser window)
- [**JWT**](./jwt.md) - You can use your own JWTs (JSON Web Tokens) with this provider and Redwood will verify it's validity with the secret used to sign it

:::warning
There currently is no support for linking different authentication providers under a single `PlayerIdentity` (aka player account). For example, a user that logs in with Epic and then later logs in with Discord will have 2 different accounts. Supporting this is on the [roadmap](https://github.com/RedwoodMMO/Roadmap/issues/140).
:::

## How to specify which provider is used?

You can enable one or more authentication providers to be allowed to be used, which is helpful for cross-platform games.

The config variable `auth.allowed-providers` takes an array of string enums, which can be `local`, `steam`, `epic`, `discord`, `twitch`, or `jwt`. You can see the default defined as just `local` in `RedwoodBackend/config/node/default/auth.yaml`.

You can [override this variable](../../configuration/overview.md#customization) yourself in your own config environment.

:::tip
You can change your local providers for different config environments and somehow switch the game client UI. I like to use `local` for development and then use anything other than `local` for production.
:::
