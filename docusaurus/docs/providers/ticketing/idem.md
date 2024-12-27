---
sidebar_position: 4
---

# Idem

The `idem` provider uses [Idem](https://idem.gg), a matchmaking service provider that you can use as an quick and easy alternative to configuring [Open Match](./open-match.md). Idem has a great free tier for your first 100,000 players matched, great for development and playtesting.

<div class="center">
  <a href="https://www.idem.gg/getting-started" target="_blank"><button>Create a free Idem account</button></a>
</div><br />

Switching to Idem can be done by modifying the corresponding [Realm Instance Config](../../configuration/realm-instance-config.md) to use the `idem` Ticketing provider. Below is the default configuration:

``` yaml
ticketing:
  matchmaking:
    idem:
      # The current integration of Idem only supports a single ticketing profile
      # (or "Game Mode" in Idem) per realm. This should match the "id" field
      # of the profile in `game.ticketing-profiles` you'd like to use. Note that
      # the integration expects Idem to use the same ID for the corresponding Game Mode/ID.
      ticketing-profile-id: "match"

      # Idem will not compute the best region based on ping numbers like OpenMatch;
      # instead Idem expects an array of feasible regions. The max-player-ping variable
      # will filter the regions prior to adding the player to Idem.
      max-player-ping: 300

      # You shouldn't need to modify these variables unless they change. The
      # details are found at https://api.idem.gg/websocket/#servers
      endpoints:
        authentication:
          host: "https://cognito-idp.eu-central-1.amazonaws.com"
          client-id: "3b7bo4gjuqsjuer6eatjsgo58u"
        service: "ws-int.idem.gg"

      credentials:
        username: ""
        password: ""
```

Here is an example of the censored bare minimum needed to be changed to support the Shooter Template's `elimination` game mode:

``` yaml
ticketing:
  matchmaking:
    provider: "idem-match"

    idem:
      ticketing-profile-id: "elimination"

      credentials:
        username: "idem-*****"
        password: "************"
```

:::warning
The `ticketing.matchmaking.max-wait-until-make-shallow-match-ms` config variable is ignored for the `idem-match` Ticketing provider as the details of when a match is created is completely managed by Idem.
:::
