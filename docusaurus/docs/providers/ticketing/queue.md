---
sidebar_position: 5
---

# Queue

The `queue` provider is a simple FIFO (First-In-First-Out) queuing system. It was designed for RPGs in mind that may have capacity limits to a limited number of servers. This system will let players into the server based on capacity and/or flow rates (i.e. perhaps the server has 100 free spots but only wants 1 player joining per second).

The queue provider can be used simultaneously with any of the matchmaking providers.

## Configuration

The default [realm instance config](../../configuration/realm-instance-config.md) enables the queue provider by default. You can change this by setting the `ticketing.queue.enabled` variable in the realm instance config.

Once enabled, the rest of the configuration is specific to the [game profile](../../configuration/game-modes-and-maps.md#profiles). See the [sharding documentation](../../features/sharding.md) for more details as the queuing system works in conjunction with the sharding configuration.
