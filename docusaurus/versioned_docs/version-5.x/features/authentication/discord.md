---
sidebar_position: 5
sidebar_label: Discord
---

# Discord Authentication

The `discord` provider uses [Discord's support](https://discord.com/developers/docs/topics/oauth2) for [OAuth 2.0](https://oauth.net/2/) authorization. You can use this provider in both development and production environments. You should note that this provider will open an external browser for the user to authenticate and authorize your Discord application.

:::info
There currently is no support to view Discord guild/server membership data or roles. This integration is simply just the basis for verifying authentication via Discord.
:::

## Configuration

|Variable|Description|
|-|-|
|`auth.discord.client.id`|The **Client ID** on the OAuth2 page of your Discord app.|
|`auth.discord.client.secret`|The **Client Secret** on the OAuth2 page of your Discord app. This can be used with the [secrets](../secrets/overview.md) system.|

## Setup

1. Create a Discord Application at https://discord.com/developers/applications
1. Go to the OAuth2 page at `https://discord.com/developers/applications/YOUR_APP_ID/oauth2`
1. Click **Reset Secret** under the **Client Secret** to regenerate a secret; put this and the Client ID both in the corresponding [Redwood configuration](#configuration)
1. Still on the OAuth2 page, under **Redirects** add the below URLs:
    - `http://director.localhost:3001/oauth2/callback/discord` (used for the Dev Initiator)
    - `http://director.localhost:80/oauth2/callback/discord` (used for local Kubernetes deployments)
    - Whatever you use for the production Director Frontend external connection config. For example, `https://demos-director-frontend.redwoodmmo.com:443/oauth2/callback/discord`
1. Update your project to use the `URedwoodClientGameSubsystem::LoginWithDiscord` function instead of the normal `Login` function. The `bRememberMe` argument works the same way as the `Login` function works by storing a one time authentication token in a SaveGame locally.