---
sidebar_position: 2
---

# Matchmaking

Matchmaking is part of the [Ticketing System](../providers/ticketing/overview.md) and used for all match-based games and sometimes used for instanced dungeons in persistent games (think WoW dungeons and raids).

Matchmaking by default tries to match players by balancing "full matches" (i.e. as many players in the same match up to the maximum defined in the [game profile](../configuration/game-modes-and-maps.md#profiles)) with latency. You can further customize matchmaking to assess skill/level and other attributes.

Redwood has [multiple different providers](../providers/ticketing/overview.md) that can used to server as the matchmaker, including some that you self-host as well as third party services.

Matchmaking is enabled by default, and it can be disabled by setting [`ticketing.matchmaking.enabled: false`](../providers/ticketing/overview#which-should-i-use-in-production).
