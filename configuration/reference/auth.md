---
sidebar_position: 3
sidebar_label: Authentication
---

# Authentication Config

Defined in `default/auth.yaml`. All of these keys are read by the **Director Frontend**, the service game clients log in through. See the [Authentication](../../features/authentication/overview.md) docs for how each provider works end to end.

## Providers

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `auth.allowed-providers` | `["local"]` | string[] | | Which login providers are enabled. Valid values: `local`, `steam`, `epic`, `discord`, `twitch`, `jwt`. Discord and Twitch only register their OAuth callback routes when listed. A login request for an unlisted provider fails with `Invalid provider`. Registration (`Register` in the Unreal plugin) only works when `local` is listed; otherwise it fails with `Registration is disabled; please login with the supported authentication providers`. This is a list, so your value replaces the default. |

:::note
A login request can include `bypassProviderCheck: true` to log in with a `local` username and password even when `local` isn't in `allowed-providers`. The CLI uses this for the admin user, and the Unreal plugin uses it to silently re-authenticate with a stored token after reconnecting. Registration can't bypass the check (except through the admin challenge below), so removing `local` still prevents players from creating username/password accounts.
:::

## Local (username/email and password)

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `auth.local.account-type` | `"username"` | `"username"` or `"email"` | `username` accepts `^[a-zA-Z0-9_]+$`; `email` requires a valid email address. Lookups are case-insensitive on PostgreSQL and case-sensitive on SQLite. |
| `auth.local.account-verification` | `false` | bool | Only applies to `email` accounts. Registration sends a verification email through the [email provider](./chat-and-email.md#email) and returns `Must verify account`; login returns `Must verify email` until the player clicks the link. In development, `director.development.auto-verify-email` can skip the email. |
| `auth.local.hash.iterations` | `210000` | int | PBKDF2-SHA512 iterations for password hashes. **The iteration count isn't stored with each hash**, so changing it invalidates every existing local password (the default admin is re-hashed on boot, players are not). Pick a value before launch and leave it. |
| `auth.local.hash.length` | `512` | int | PBKDF2 key length in bytes. Same caveat as `iterations`. |

## Steam

See [Steam authentication](../../features/authentication/steam.md).

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `auth.steam.api-key` | `""` | string | yes | Your Steamworks **publisher** Web API key. Used to verify the client's session ticket (`ISteamUserAuth/AuthenticateUserTicket`, identity `redwood`) and fetch the player's persona name. |
| `auth.steam.app-id` | `0` | int | | Your Steam App ID. |

## Epic Online Services

Epic login has **no config keys** besides adding `epic` to `auth.allowed-providers`. The Director verifies the EOS ID token against Epic's public keys (cached for 24 hours), using the `sub` claim as the player's provider ID and `dn` as their display name. See [Epic authentication](../../features/authentication/epic.md).

## Discord and Twitch

See [Discord](../../features/authentication/discord.md) and [Twitch](../../features/authentication/twitch.md).

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `auth.discord.client.id` | `"your-client-id"` | string | | OAuth application client ID. |
| `auth.discord.client.secret` | `"your-client-secret"` | string | yes | OAuth application client secret. |
| `auth.twitch.client.id` | `"your-client-id"` | string | | OAuth application client ID. |
| `auth.twitch.client.secret` | `"your-client-secret"` | string | yes | OAuth application client secret. |

The OAuth redirect URL is built from `director.frontend.connection.external`: `http(s)://<host>:<port>/oauth2/callback/discord` (or `/twitch`). For Twitch only, a host of `director.localhost` is rewritten to `localhost`, so the local development redirect for Twitch is `http://localhost:3001/oauth2/callback/twitch`.

## JWT

See [JWT authentication](../../features/authentication/jwt.md).

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `auth.jwt.secret` | `"jwt-secret"` | string | yes | Shared HMAC secret used to verify tokens (symmetric algorithms only, e.g. HS256). |
| `auth.jwt.claim-fields.provider-id` | `"sub"` | string | | The claim holding the player's ID in your system. It must equal the username the client sends with the token. |

## Admin Challenge

| Key | Default | Type | Secret | What it does |
| --- | --- | --- | --- | --- |
| `auth.admin.secret` | `"secret"` | string | yes | Shared secret for creating admin accounts through a challenge/response (used by `yarn cli create-admin` and `create-user --admin`). The CLI reads this from the environment you pass with `-e`, so it must match the running backend's value. Change it for anything deployed. |

## Rate Limits

`auth.rate-limit.*` protects login and authentication endpoints from brute-force and flooding. Limits are fixed-window counters stored in Redis, per client IP (and per username for player login). If Redis is unreachable, the limits **fail open** (requests are allowed). Rejected requests get `Too many login attempts; try again later` or `Too many requests; try again later`.

| Key | Default | Applies to |
| --- | --- | --- |
| `auth.rate-limit.player-login.per-ip-max` | `30` | Username/password logins (Director Frontend) |
| `auth.rate-limit.player-login.per-ip-window-ms` | `300000` (5 min) | |
| `auth.rate-limit.player-login.per-username-max` | `10` | Same, per username (scripts that repeatedly log in as the admin can hit this) |
| `auth.rate-limit.player-login.per-username-window-ms` | `300000` (5 min) | |
| `auth.rate-limit.player-register.per-ip-max` | `10` | Account registration |
| `auth.rate-limit.player-register.per-ip-window-ms` | `3600000` (1 hour) | |
| `auth.rate-limit.oauth-init.per-ip-max` | `20` | Starting a Discord/Twitch login |
| `auth.rate-limit.oauth-init.per-ip-window-ms` | `300000` (5 min) | |
| `auth.rate-limit.oauth-finalize.per-ip-max` | `20` | Finishing a Discord/Twitch login |
| `auth.rate-limit.oauth-finalize.per-ip-window-ms` | `300000` (5 min) | |
| `auth.rate-limit.challenge.per-ip-max` | `60` | Service-to-service and admin auth challenges (Director Frontend, Director Backend, Realm Backend) |
| `auth.rate-limit.challenge.per-ip-window-ms` | `60000` (1 min) | |
| `auth.rate-limit.authenticate.per-ip-max` | `30` | Answering those challenges (each costs a PBKDF2 hash) |
| `auth.rate-limit.authenticate.per-ip-window-ms` | `60000` (1 min) | |

If many players share one IP (e.g. a LAN event or a playtest behind one NAT), raise the `per-ip-max` values.
