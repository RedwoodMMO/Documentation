---
sidebar_position: 6
sidebar_label: Twitch
---

# Twitch Authentication

The `twitch` provider uses [Twitch's support](https://dev.twitch.tv/docs/authentication/) for [OAuth 2.0](https://oauth.net/2/) authorization. You can use this provider in both development and production environments. You should note that this provider will open an external browser for the user to authenticate and authorize your Twitch application.

:::info
There currently is no support to view Twitch subscription or bits data. This integration is simply just the basis for verifying authentication via Twitch.
:::

## Configuration

|Variable|Description|
|-|-|
|`auth.twitch.client.id`|The **Client ID** on the Developer Console page for your Twitch app.|
|`auth.twitch.client.secret`|The **Client Secret** on the Developer Console page for your Twitch app. This can be used with the [secrets](../secrets/overview.md) system.|

## Setup

1. Create a Twitch Application at https://dev.twitch.tv/console
1. Click on **Manage** for your application from the Developer Console Dashboard or go to `https://dev.twitch.tv/console/apps/YOUR_APP_ID`
1. Click **New Secret** under the **Client Secret** to regenerate a secret; put this and the Client ID both in the corresponding [Redwood configuration](#configuration)
1. Still on the OAuth2 page, under **Redirects** add the below URLs:
    - `http://director.localhost:3001/oauth2/callback/twitch` (used for the Dev Initiator)
    - `http://director.localhost:80/oauth2/callback/twitch` (used for local Kubernetes deployments)
    - Whatever you use for the production Director Frontend external connection config. For example, `https://demos-director-frontend.redwoodmmo.com:443/oauth2/callback/twitch`
1. Update your project to use the `URedwoodClientGameSubsystem::LoginWithTwitch` function instead of the normal `Login` function. The `bRememberMe` argument works the same way as the `Login` function works by storing a one time authentication token in a SaveGame locally.