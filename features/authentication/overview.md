---
sidebar_position: 1
sidebar_label: Overview
---

# Authentication Providers

Redwood keeps identities for users (a `PlayerIdentity`) in the Director database, but is flexible on how you authenticate those users.

- [**Local**](./local.md) - A basic username/password authentication provider with optional email verification
- [**Steam**](./steam.md) - Users automatically authenticate when they launch the game through Steam
- [**Epic**](./epic.md) - Users can automatically authenticate if they launch the game through Epic Games Launcher or manually authenticate through Epic
- [**Discord**](./discord.md) - Authenticate using Discord (opens Discord in the player's browser)
- [**Twitch**](./twitch.md) - Authenticate using Twitch (opens Twitch in the player's browser)
- [**JWT**](./jwt.md) - You can use your own JWTs (JSON Web Tokens) with this provider and Redwood will verify their validity with the secret used to sign them

:::warning
There currently is no support for linking different authentication providers under a single `PlayerIdentity` (aka player account). For example, a user that logs in with Epic and then later logs in with Discord will have 2 different accounts. Supporting this is on the [roadmap](https://github.com/RedwoodMMO/Roadmap/issues/140).
:::

## How to specify which provider is used?

You can enable one or more authentication providers, which is helpful for cross-platform games.

The config variable `auth.allowed-providers` takes an array of string enums, which can be `local`, `steam`, `epic`, `discord`, `twitch`, or `jwt`. The default (in `config/node/default/auth.yaml`) is just `local`. You can [override this variable](../../configuration/overview.md#customization) in your own config environment, for example in `config/node/your-game/auth.yaml`:

```yaml
allowed-providers:
  - "local"
  - "steam"
```

Remember that lists replace the default rather than merging with it, so include every provider you want. A login or registration with a provider that isn't in the list fails with `Invalid provider` (or `Registration is disabled; please login with the supported authentication providers` for registering a `local` account).

:::note
Redwood's own tooling (the [CLI](../cli.md), and the plugin when it automatically reconnects a logged-in player) can still log in to `local` accounts even when `local` isn't in the list. Registering new `local` accounts is still blocked.
:::

:::tip
You can change your allowed providers for different config environments and switch the game client UI accordingly. We like to use `local` for development and then use anything other than `local` for production.
:::

## Logging in from Unreal

Every provider ends up reporting progress through the same `FRedwoodAuthUpdate` struct (`Type` of `Success`, `MustVerifyAccount`, or `Error`, plus a `Message`), so the rest of your login UI is the same no matter which provider you use. See [Building the Main Menu](../../getting-started/building-the-main-menu.md#2-log-in-or-register) for the full login flow.

| Provider | Blueprint node | C++ |
| --- | --- | --- |
| `local` | **Login** / **Register** | `URedwoodClientGameSubsystem::Login` / `Register` |
| `steam` | **Login with Steam** (`RedwoodSteam` plugin) | `URedwoodSteamClientInterface::LoginWithSteam` |
| `epic` | **Login with EOS** (`RedwoodEOS` plugin) | `URedwoodEOSClientInterface::LoginWithEOS` |
| `discord` | **Login with Discord** | `URedwoodClientGameSubsystem::LoginWithDiscord` |
| `twitch` | **Login with Twitch** | `URedwoodClientGameSubsystem::LoginWithTwitch` |
| `jwt` | **Login** with Provider `jwt` | `URedwoodClientGameSubsystem::Login` |

When a player logs in with **Remember Me** enabled, the plugin saves their username and an auth token in a `RedwoodSaveGame` save slot, and **Attempt Auto-Login** uses it the next time the game starts.

## Rate Limits

The Director rate limits logins, registrations, OAuth flows, and service authentication challenges per IP address (and logins per username too) to slow down brute-force and flooding attempts. When a limit is hit, the request fails with `Too many login attempts; try again later` (or a similar message) until the window passes. The defaults are generous for players, but automated tests or scripts that log in repeatedly can trip them:

| Limit | Default |
| --- | --- |
| `auth.rate-limit.player-login` | 30 per IP and 10 per username, per 5 minutes |
| `auth.rate-limit.player-register` | 10 per IP per hour |
| `auth.rate-limit.oauth-init` / `oauth-finalize` | 20 per IP per 5 minutes each |
| `auth.rate-limit.challenge` / `authenticate` | 60 / 30 per IP per minute (used by realms, sidecars, and admin creation) |

The limits are stored in Redis and fail open if Redis is unavailable. See the [auth config reference](../../configuration/reference/auth.md) for every variable.
