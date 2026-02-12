---
sidebar_position: 3
---

# Queuing

Queuing is a simple FIFO (First-In-First-Out) queuing system and used for most persistent games. It was designed for RPGs in mind that may have capacity limits to a limited number of servers. This system will let players into the server based on capacity and/or flow rates (i.e. perhaps the server has 100 free spots but only wants 1 player joining per second).

## Configuration

The default [realm instance config](../../configuration/realm-instance-config.md) enables queueing by default. You can change this by setting the `ticketing.queue.enabled` variable in the realm instance config, though the system idles when it's unused.

Once enabled, the rest of the configuration is specific to the [game profile](../../configuration/game-modes-and-maps.md#profiles). See the [sharding documentation](../game-servers/sharding.md) for more details as the queuing system works in conjunction with the sharding configuration.
