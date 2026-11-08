---
sidebar_position: 5
sidebar_label: Discord
---

# Discord Authentication

The `discord` provider uses [Discord's support](https://discord.com/developers/docs/topics/oauth2) for [OAuth 2.0](https://oauth.net/2/) authorization. You can use this provider in both development and production environments. Note that this provider opens the player's web browser for them to authenticate and authorize your Discord application.

:::info
There currently is no support to view Discord guild/server membership data or roles. This integration is simply the basis for verifying authentication via Discord.
:::

## Configuration

|Variable|Description|
|-|-|
|`auth.allowed-providers`|Must include `discord`|
|`auth.discord.client.id`|The **Client ID** on the OAuth2 page of your Discord app.|
|`auth.discord.client.secret`|The **Client Secret** on the OAuth2 page of your Discord app. This can be used with the [secrets](../secrets/overview.md) system.|

## Setup

1. Create a Discord Application at https://discord.com/developers/applications
1. Go to the OAuth2 page at `https://discord.com/developers/applications/YOUR_APP_ID/oauth2`
1. Click **Reset Secret** under the **Client Secret** to regenerate a secret; put this and the Client ID both in the corresponding [Redwood configuration](#configuration)
1. Still on the OAuth2 page, under **Redirects** add the below URLs. Redwood builds the redirect URL from the Director Frontend's external connection config (`director.frontend.connection.external`), so these must match it exactly:
    - `http://director.localhost:3001/oauth2/callback/discord` (used for the Dev Initiator)
    - `http://director.localhost:80/oauth2/callback/discord` (used for local Kubernetes deployments)
    - Whatever you use for the production Director Frontend external connection config, for example `https://director.yourgame.com:443/oauth2/callback/discord`
1. Update your project to use **Login with Discord** (`URedwoodClientGameSubsystem::LoginWithDiscord(bRememberMe, OnUpdate)`) instead of the normal **Login**. It opens the player's browser to Discord and fires `Success` once they authorize your app. The `bRememberMe` argument works the same way as with **Login**, saving a token locally so **Attempt Auto-Login** works next time.

:::warning
For security, the plugin refuses to open a redirect URL that doesn't match the Director it's connected to (`Login canceled: server returned an unexpected redirect URL.`). With the Dev Initiator, that means your project's **Director Uri** setting must use the same host as the redirect, i.e. `ws://director.localhost:3001` (not `ws://localhost:3001`).
:::
