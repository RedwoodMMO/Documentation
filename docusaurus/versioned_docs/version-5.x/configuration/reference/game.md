---
sidebar_position: 6
sidebar_label: Game
---

# Game Config

Defined in `default/game.yaml`. These settings are global (shared by every realm) and describe your game's modes, zones, maps, shards, and guild rules. The Realm services read `game.*` and pass the relevant parts to each game server's Sidecar; guild settings are read by the Director.

For how profiles connect to your Unreal Data Assets, see [Game Modes and Maps](../game-modes-and-maps.md).

## Players

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `game.players.allow-nickname-change` | `true` | bool | Allow players to change their displayed nickname (which defaults to their username or provider display name, e.g. their Steam name). When `false`, the request fails with `Nickname change is not allowed`. |

## Shard Names

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `game.shard-names` | `["Alpha", "Bravo", …, "Zulu"]` (26 names) | string[] | Names given to [shards](../../features/game-servers/sharding.md), in order. A new shard takes the first name not already used in that zone. When every name is in use, no more shards are created, so **the length of this list is the maximum number of shards per zone**. The first name is the zone's main shard: it's never pruned for being empty and is restarted if it stops. This is a list, so your value replaces the default. |

The shard name appears in the game server's `Channel` (e.g. `main:Alpha`) and in `URedwoodServerGameSubsystem::ShardName` and `FRedwoodServerDetails::ShardName` in Unreal.

## Profiles

`game.profiles` is a list of **game profiles**, one per game mode. Every proxy (lobby, match, or persistent world) is created from a profile; the profile's `id` is the proxy's mode ID. Your Unreal project needs a `URedwoodGameModeAsset` whose **Redwood Id** equals each profile `id`, and a `URedwoodMapAsset` for each map name used in `zones`.

:::warning
`game.profiles` is a list, so it **replaces** the default list (which contains a single `match` profile). Your `game.yaml` must include every profile your game uses.
:::

| Key (per profile) | Default | Type | Required | What it does |
| --- | --- | --- | --- | --- |
| `id` | `"match"` | string | yes | Unique identifier for the profile. Used as the game mode's **Redwood Id** in Unreal, as `ProfileId` for matchmaking, as the CLI's `create-proxy <profile>` argument, and in `default-proxy.profile-id`. Requests with an unknown mode ID fail with `Invalid modeId`. |
| `zones` | one zone `main` with map `match` | object | yes | The zones that make up a proxy of this profile, keyed by zone name. Every zone runs on its own game server (or several, with sharding). See [Zones](#zones). |
| `max-players-per-shard` | `6` | int | yes | Maximum players on a single game server (shard). Also the full match size for matchmaking, and sent to the server as `MaxPlayers`. |
| `num-players-to-add-shard` | not set | int or null | | When every shard of a zone has at least this many players, another shard is started for that zone. Not set, `null`, or `0` disables sharding. |
| `num-minutes-to-destroy-empty-shard` | not set | int or null | | Stop extra (non-main) shards that stay empty this many minutes. Only applies when sharding is enabled. Checked every `game-servers.shard-prune-interval`. |
| `collection-ends-when-any-shard-ends` | not set (treated as `false`; proxies players create get `true`) | bool | | When `true`, if any game server of the proxy stops, all of the proxy's servers stop. Use `false` for persistent worlds so one zone crashing doesn't take down the others; `true` suits single-zone matches. |
| `matchmaking-zone-name` | `"main"` | string | for matchmaking | Enables [matchmaking](../../features/ticketing/matchmaking/simple-match.md) for this profile. Matchmaking creates a single-zone proxy, so this names which of the `zones` to use. Profiles without it are ignored by matchmaking. |
| `min-players-for-matchmaking` | `1` | int | for matchmaking | Smallest match the matchmaker will make, once the oldest ticket has waited `ticketing.matchmaking.max-wait-until-make-shallow-match-ms`. |
| `parent-profile-id` | not set | string | | Makes proxies of this profile children of the active proxy of another profile (e.g. an instanced dungeon whose parent is the overworld). The parent's proxy ID is passed to the game server as `ParentProxyId`, so your server logic can send players back to it. Assumes the realm has one active proxy for the parent profile; if none is found, an error is logged and the proxy starts without a parent. |
| `data` | `{ key: "value" }` | object | | String key/value pairs sent to the game server and added to the map URL as `?key=value` options (read them in Unreal with `UGameplayStatics::ParseOption` or `World->URL.GetOption`). Non-string values are dropped. Keys are camelCased by the config system, so `my-key` becomes `myKey`. |
| `game-servers` | not set | object | | Override the realm's [game server provider](./realm.md#game-server-provider) for this profile. See [below](#per-profile-and-per-zone-game-server-overrides). |

### Zones

Zones live under each profile's `zones` object. We recommend setting `variableCasing: "original"` inside `zones` so zone names keep their exact spelling (otherwise `mountain-pass` becomes `mountainPass`). Because of that setting, **fields inside a zone must be written in camelCase**.

```yaml
profiles:
  - id: "overworld"
    zones:
      variableCasing: "original"
      town:
        maps:
          - "overworld"
        syncItemsFromZones:
          - "wilds"
      wilds:
        maps:
          - "overworld"
```

| Key (per zone) | Default | Type | What it does |
| --- | --- | --- | --- |
| `maps` | (required) | string[] | Map IDs for this zone, each matching the **Redwood Id** of a `URedwoodMapAsset`. One is picked at random when a server starts (unless a specific map was requested). Several zones can use the same map; Redwood tells each server which zone it is, and [zone spawns](../../features/game-servers/zones.md) and portals do the rest. |
| `syncItemsFromAllZones` | not set | bool | Receive [sync items](../../features/sync-items.md) from every other zone of the proxy. |
| `syncItemsFromZones` | not set | string[] | Receive sync items from the listed zones. Sync between shards of the same zone always happens. |
| `gameServers` | not set | object | Override the game server provider for this zone. See below. |

### Per-profile and per-zone game server overrides

You can run some profiles or zones on a different [game server provider](./realm.md#game-server-provider) than the realm's default (for example, Agones for the persistent world and Edgegap for latency-sensitive matches). The zone override wins over the profile override, which wins over the realm's `game-servers` settings. Only `provider` and the `edgegap` settings (`application`, `version`, and `credentials.api-token`) can be overridden; anything you leave out falls back to the realm's value. Keep the API token in the realm's `game-servers.edgegap.credentials.api-token` when you can, since that key supports the secrets system.

```yaml
profiles:
  - id: "arena"
    # Profile level: normal (kebab-case) spelling
    game-servers:
      provider: "edgegap"
      edgegap:
        application: "my-game-arena"
        version: "v1"
    zones:
      variableCasing: "original"
      main:
        maps:
          - "arena"
        # Zone level: camelCase spelling (because of variableCasing: original)
        # gameServers:
        #   provider: "agones"
```

### Profile examples

A match-based game:

```yaml
profiles:
  - id: "deathmatch"
    zones:
      variableCasing: "original"
      main:
        maps:
          - "arena"
          - "warehouse"
    max-players-per-shard: 16
    matchmaking-zone-name: "main"
    min-players-for-matchmaking: 2
    collection-ends-when-any-shard-ends: true
    data:
      ScoreLimit: "25"
```

A persistent world with a dungeon players matchmake into:

```yaml
profiles:
  - id: "overworld"
    zones:
      variableCasing: "original"
      town:
        maps:
          - "overworld"
      wilds:
        maps:
          - "overworld"
      cave:
        maps:
          - "cave"
    max-players-per-shard: 50
    num-players-to-add-shard: 40
    num-minutes-to-destroy-empty-shard: 5
    collection-ends-when-any-shard-ends: false

  - id: "dungeon"
    zones:
      variableCasing: "original"
      main:
        maps:
          - "dungeon"
    max-players-per-shard: 5
    matchmaking-zone-name: "main"
    min-players-for-matchmaking: 1
    parent-profile-id: "overworld"
```

## Guilds and Alliances

Read by the Director Frontend. See [Guilds and Alliances](../../features/social/guilds-alliances.md).

| Key | Default | Type | What it does |
| --- | --- | --- | --- |
| `game.guilds.enabled` | `true` | bool | Enable all guild (and alliance) features. |
| `game.guilds.scoped-to-realm` | `false` | bool | `false`: guilds are global across realms and membership is per player identity. `true`: guilds are unique per realm and membership is per player character. Data is stored in the Director database either way. |
| `game.guilds.allow-guild-creation` | `true` | bool | Let players create guilds. When `false`, only admin accounts can create guilds (through the same API, e.g. from a tool you build that logs in as an admin). |
| `game.guilds.max-guilds-per-player` | `1` | int | Maximum guilds a player can be a member of. |
| `game.guilds.tags.allow.casing.force` | `"upper"` | `false`, `"upper"`, or `"lower"` | Convert guild tags to this case before validating. |
| `game.guilds.tags.allow.casing.lower` | `false` | bool | Allow lowercase letters (ignored when forced to `upper`). |
| `game.guilds.tags.allow.casing.upper` | `false` | bool | Allow uppercase letters (ignored when forced to `lower`). |
| `game.guilds.tags.allow.numbers` | `true` | bool | Allow digits in tags. |
| `game.guilds.tags.allow.special` | `["_"]` | `false` or string[] | Extra characters allowed in tags, or `false` for none. Avoid `]`, `\`, `^`, and `-`, which have special meaning in the validation pattern. |
| `game.guilds.tags.length.min` | `2` | int | Minimum tag length (at least 1). |
| `game.guilds.tags.length.max` | `4` | int | Maximum tag length (at most 10, and at least `min`). |
| `game.guilds.alliances.enabled` | `true` | bool | Enable alliances. |
| `game.guilds.alliances.allow-alliance-creation` | `true` | bool | Let guilds create alliances. When `false`, alliance creation and updates are admin-only (useful for fixed factions). |
| `game.guilds.alliances.max-alliances-per-guild` | `1` | int | Maximum alliances a guild can belong to. |
