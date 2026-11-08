---
sidebar_position: 7
sidebar_label: Text Chat and Email
---

# Text Chat and Email Config

## Text Chat

Defined in `default/chat/text.yaml`. Redwood's [text chat](../../features/social/text-chat.md) uses an [ejabberd](https://www.ejabberd.im/) XMPP server. In Kubernetes, `yarn deploy` installs it in every enabled cluster. Locally, run it in Docker with `yarn deploy:chat <env>` alongside the Dev Initiator, using an environment that inherits from `simple-chat`.

| Key | Default | Type | Read by | What it does |
| --- | --- | --- | --- | --- |
| `chat.text.enabled` | `false` | bool | Director services, `yarn deploy` | Master switch. When `false`, every chat operation is skipped and the chat credentials request fails with `Text chat not enabled`. The `kubernetes` and `simple-chat` environments enable it. |
| `chat.text.host` | `"chat.localhost"` | string | Director services, deployment | The XMPP domain. Player addresses are `<player-id>@<host>`, and group chat rooms live on `conference.<host>`. The Unreal **RedwoodChat** plugin's server address setting must match this host, and it must resolve on the player's machine (add `chat.localhost` to your hosts file for local development). |
| `chat.text.image` | `"redwoodmmo/ejabberd:25.10"` | string | deployment | ejabberd Docker image. |
| `chat.text.max-offline-messages` | `500` | int | deployment | Messages kept per user while they're offline. |
| `chat.text.max-users-per-room` | `1000` | int | deployment | Maximum users in one room (global, realm, guild, and so on). |
| `chat.text.room-types.guild.enabled` | `true` | bool | Director services | Create a room per guild and manage membership automatically. |
| `chat.text.room-types.party.enabled` | `true` | bool | Director services | Party rooms. In 5.x the backend doesn't create party rooms yet, so this has no effect. |
| `chat.text.room-types.realm.enabled` | `true` | bool | Director services | A room per realm. |
| `chat.text.room-types.proxy.enabled` | `true` | bool | Director services | A room per proxy (world/match), created and destroyed with the proxy's servers. |
| `chat.text.room-types.shard.enabled` | `true` | bool | Director services | A room per shard. |
| `chat.text.room-types.team.enabled` | `false` | bool | | Team rooms aren't implemented yet. |
| `chat.text.room-types.custom.enabled` | `false` | bool | Director Frontend | Let players create named custom rooms; anyone who knows the name can join. |
| `chat.text.connection.dashboard.external.host` | `"${chat.text.host}"` | string | deployment | Ingress host for ejabberd's web admin (port 1880). Log in with credentials from `yarn cli get-text-chat-credentials -a`. |
| `chat.text.connection.api.internal.host` | `"text-chat-http.default.svc.cluster.local"` | string | Director services | Host for ejabberd's HTTP API. `simple-chat` sets `${chat.text.host}`. |
| `chat.text.connection.api.internal.port` | `5282` | int | Director services, deployment | ejabberd HTTP API port. |
| `chat.text.connection.mod_rest.port` | `5285` | int | Director services, deployment | ejabberd `mod_rest` port (used for blocking). Note the underscore in the key name. In 5.x this port isn't exposed by the Kubernetes Service, so blocking through chat only works with `yarn deploy:chat`. |
| `chat.text.connection.xmpp.external.port` | `30222` | int | deployment | The Kubernetes NodePort players connect to (must be within 30000 to 32767). ejabberd itself always listens on 5222, which is what `yarn deploy:chat` exposes directly (`simple-chat` sets 5222). Make sure the RedwoodChat plugin connects to the right port for your environment. |
| `chat.text.connection.xmpp.external.starttls.enabled` | `false` | bool | deployment | Enable **and require** STARTTLS for XMPP connections. Requires certificates to be set up for ejabberd. |
| `chat.text.connection.xmpp.external.starttls.verify-certificates` | `false` | bool | deployment | Verify TLS certificates when STARTTLS is enabled. |

## Email

Defined in `default/email/`. Email is only used for [account verification](../../features/authentication/local.md) when `auth.local.account-type` is `email` and `auth.local.account-verification` is `true`. See [Transactional Email](../../features/transactional-email/overview.md).

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `email.provider` | `"none"` | `"none"`, `"sendgrid"`, or `"zeptomail"` | Which email service to use. |
| `email.templates.verify-email` | `""` | string | The provider's template ID for the verification email. If empty, registration fails with `Failed to send account verification email` and the log mentions this key. The template receives `verify_email_url` (`http(s)://<director external host>:<port>/verify-email/<code>`). |
| `email.contact.name` | `"Company"` | string | Sender details passed to the template (`Sender_Name`, `Sender_Address`, `Sender_City`, `Sender_State`, `Sender_Zip`), which SendGrid uses for its required footer. |
| `email.contact.address` | `"1234 Address St"` | string | |
| `email.contact.city` | `"City"` | string | |
| `email.contact.state` | `"State"` | string | |
| `email.contact.zip` | `"12345"` | string | |
| `email.email-addresses.no-reply.name` | `"Company"` | string | "From" name. |
| `email.email-addresses.no-reply.address` | `"no-reply@website.com"` | string | "From" address. It must be verified with your provider. |
| `email.sendgrid.api-key` | `""` | string | SendGrid API key. |
| `email.zeptomail.api.url` | `"api.zeptomail.com/"` | string | ZeptoMail API URL. |
| `email.zeptomail.api.key` | `""` | string | ZeptoMail API key. |

:::warning
In 5.x the email API keys are read without secret resolution, so `secret|...` references don't work for them. Keep them in a config environment that isn't committed publicly.
:::
