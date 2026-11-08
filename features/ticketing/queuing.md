---
sidebar_position: 3
---

# Queuing

Queuing is a simple FIFO (First-In-First-Out) queuing system used for most persistent games. It was designed with RPGs in mind, where a world may have a limited number of servers with capacity limits. Players ask to join a specific zone of a specific [GameServerProxy](../../architecture/game-servers.md#gameserverproxy) (e.g. the `town` zone of the `overworld` proxy), and the queue admits them as soon as there's room.

## How players are placed

When a player calls **Join Queue** with a proxy ID and zone name, Redwood picks a shard (an Unreal server for that zone) for them:

1. If [sharding](../game-servers/sharding.md) is disabled for the profile (no `num-players-to-add-shard`), the zone's only shard is used.
1. If the player is in a [party](../social/parties.md) and other members are already on a shard of that zone with enough room, that shard is used, so parties stay together.
1. Otherwise, Redwood picks a shard that's below the `num-players-to-add-shard` threshold, or the least populated shard.

If the shard is running and has room under `max-players-per-shard`, the player is admitted immediately and travels there. Otherwise they wait in the queue (and receive `Update` messages) until a spot opens up or a new shard starts. If the player is a party leader and `bTransferWholeParty` is `true`, the whole party is queued together.

:::note
The proxy must already be running for players to queue into it; queuing doesn't create worlds. Persistent worlds are typically created by an admin with the [CLI](../cli.md#create-proxy) (often with `--start-on-boot`) or with the realm's [Default Proxy](../realms.md#default-proxy).
:::

Zone transfers (e.g. walking through a [portal](../game-servers/zones.md) into another zone) use the same queue behind the scenes.

## Configuration

The default [realm instance config](../../configuration/realm-instance-config.md) enables queuing. You can change this by setting the `ticketing.queue.enabled` variable in the realm instance config, though the system idles when it's unused.

Once enabled, the rest of the configuration is specific to the [game profile](../../configuration/game-modes-and-maps.md#profiles) (`max-players-per-shard`, `num-players-to-add-shard`, and `num-minutes-to-destroy-empty-shard`). See the [sharding documentation](../game-servers/sharding.md) for more details, as the queuing system works in conjunction with the sharding configuration.

## Unreal

Use **Join Queue** (`URedwoodClientGameSubsystem::JoinQueue(ProxyId, ZoneName, bTransferWholeParty, OnUpdate)`). You can get proxy IDs from **List Proxies** (the `Id` of each `FRedwoodGameServerProxy`) and zone names from the proxy's `Zones` array. See [Queuing into a persistent world](../../getting-started/building-the-main-menu.md#queuing-into-a-persistent-world) and the [ticketing overview](./overview.md#unreal) for how to handle the updates.
