# Sharding

Every [zone](./zones.md) is composed of shards. Technically a shard is a [`GameServerInstance`](../../architecture/game-servers.md#gameserverinstance); every `GameServerInstance` is a shard, even if there will never be more than 1 shard for that zone. For example, match-based games/profiles will only have 1 zone and 1 shard for that zone; remember the "zone" is the abstract configuration which makes the "shard" the actual running `GameServerInstance`.

:::note
Check out Raph Koster's [article](https://www.raphkoster.com/2009/01/08/database-sharding-came-from-uo/) that describes the origin of the term `shard` in MMOs in Ultima Online as a lore element to back up their use of multiple parallel servers representing similar worlds:

> ...that the evil wizard Mondain had attempted to gain control over Sosaria by trapping its essence in a crystal. When the Stranger at the end of Ultima I defeated Mondain and shattered the crystal, the crystal shards each held a refracted copy of Sosaria.
:::

The process of sharding, sometimes referenced in the backend/config as instancing, is determining when a zone needs a new shard started or have one of the shards shutdown. The total maximum number of shards is defined by the number of [configurable shard names](../../configuration/game-modes-and-maps.md#shard-names--max-shards-per-zone) that can be used. The [game profile](../../configuration/game-modes-and-maps.md#profiles) must specify the `num-players-to-add-shard` variable to enable sharding for that profile. This number is like a soft-cap, and many times isn't your total number of players per shard (which is specified by profile's `max-players-per-shard` variable). When the number of connected players reaches `num-players-to-add-shard` a new shard will be started if there's an unused shard name for that zone. Conversely you can optionally set the profile's `num-minutes-to-destroy-empty-shard` variable if you want shards to get shutdown if they're empty for the specified time (and prevent idle/wasted server costs).

:::info
The reason why we separated `num-players-to-add-shard` and `max-players-per-shard`, recommending that the former as a lesser soft-cap, is to allow members in the same party to still be able to follow their other party members into a soft-capped shard. It also allows players to manually switch their shard. This flexibility can prevent player frustration, but you may need to implement incentives for players in a soft-capped shard that's getting close to a hard-capped shard to switch shards to prevent queue times.
:::

Empty-shard checks run every `game-servers.shard-prune-interval` milliseconds (`5000` by default) in the [Realm Instance Config](../../configuration/reference/realm.md). The first shard of each zone (the first name in `game.shard-names`, `Alpha` by default) is the zone's main shard; it's never stopped for being empty, and it's restarted if it stops responding.

When a player queues into a zone (with **Join Queue**, or when [transferring zones](./zones.md#transferring-zones)), Redwood picks the shard for them, preferring the one where your party is in or the least populated shard that has room. The underlying `realm:ticketing:join:queue` API also accepts an optional shard name to queue for a specific shard, but the Unreal plugin's `URedwoodClientGameSubsystem::JoinQueue` doesn't currently expose it.

On the server, you can check which shard you're running with the `ShardName` property on the `URedwoodServerGameSubsystem` (e.g. `Alpha`). On clients, use the `URedwoodGameStateComponent`'s `GetServerDetails()`.
