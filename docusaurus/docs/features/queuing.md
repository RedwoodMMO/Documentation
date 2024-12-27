---
sidebar_position: 3
---

# Queuing

Queuing is part of the [Ticketing System](../providers/ticketing/overview.md) and used for most persistent games. Redwood will create queue for every single `GameServerInstance` once it reaches the associated [game profile max players per shard variable](../configuration/game-modes-and-maps.md#profiles), admitting players when someone else leaves.

Redwood only has [1 provider for queuing](../providers/ticketing/queue.md) which is integrated with the backend.

Queuing is enabled by default, and it can be disabled by setting [`ticketing.queue.enabled: false`](../providers/ticketing/overview#which-should-i-use-in-production).
