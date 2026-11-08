---
sidebar_position: 6
sidebar_label: Twitch
---

# Twitch Authentication

The `twitch` provider uses [Twitch's support](https://dev.twitch.tv/docs/authentication/) for [OAuth 2.0](https://oauth.net/2/) authorization. You can use this provider in both development and production environments. Note that this provider opens the player's web browser for them to authenticate and authorize your Twitch application.

:::info
There currently is no support to view Twitch subscription or bits data. This integration is simply the basis for verifying authentication via Twitch.
:::

## Configuration

|Variable|Description|
|-|-|
|`auth.allowed-providers`|Must include `twitch`|
|`auth.twitch.client.id`|The **Client ID** on the Developer Console page for your Twitch app.|
|`auth.twitch.client.secret`|The **Client Secret** on the Developer Console page for your Twitch app. This can be used with the [secrets](../secrets/overview.md) system.|

## Setup

1. Create a Twitch Application at https://dev.twitch.tv/console
1. Click on **Manage** for your application from the Developer Console Dashboard or go to `https://dev.twitch.tv/console/apps/YOUR_APP_ID`
1. Click **New Secret** under the **Client Secret** to regenerate a secret; put this and the Client ID both in the corresponding [Redwood configuration](#configuration)
1. Under **OAuth Redirect URLs**, add the below URLs. Redwood builds the redirect URL from the Director Frontend's external connection config (`director.frontend.connection.external`), except that Twitch only allows plain `http` redirects to `localhost`, so Redwood swaps `director.localhost` for `localhost`:
    - `http://localhost:3001/oauth2/callback/twitch` (used for the Dev Initiator)
    - `http://localhost:80/oauth2/callback/twitch` (used for local Kubernetes deployments)
    - Whatever you use for the production Director Frontend external connection config, for example `https://director.yourgame.com:443/oauth2/callback/twitch`
1. Update your project to use **Login with Twitch** (`URedwoodClientGameSubsystem::LoginWithTwitch(bRememberMe, OnUpdate)`) instead of the normal **Login**. It opens the player's browser to Twitch and fires `Success` once they authorize your app. The `bRememberMe` argument works the same way as with **Login**, saving a token locally so **Attempt Auto-Login** works next time.

:::warning
For security, the plugin refuses to open a redirect URL that doesn't match the Director it's connected to (`Login canceled: server returned an unexpected redirect URL.`). Because of the `localhost` swap above, testing Twitch login with the Dev Initiator requires your project's **Director Uri** setting to be `ws://localhost:3001` (the plugin's default), not `ws://director.localhost:3001`.
:::
