---
sidebar_position: 4
---

# Zones

All [`GameServerProxies`](../architecture/game-servers.md#gameserverproxy) define 1 or more zones. Technically speaking, zones are abstract ideas; each zone consists of a set of shards. Usually zones can be different maps or different areas in a single map.

Zones are defined as part of the [game profile](../configuration/game-modes-and-maps.md#profiles).

## Unreal Setup

For every zone, you need to add `ARedwoodZoneSpawn` actors to the map to specify where players should spawn in at. In the Details panel in the Level Editor, you can override the `ZoneName` to match (case-sensitive) the name of the zone in your game profile (e.g. `mountain-pass` or `mine` from the RPG Template). Most zones should have have 1 `ARedwoodZoneSpawn` with the `default` `SpawnName`, but you can have more advanced logic here.

:::info
In the `mine` zone in the RPG Template, there are two zone spawns, one for when you enter via the Mountain Pass and one for when you return from the instanced dungeon.
:::

## Transferring Zones

The Unreal plugin provides two static functions to facilitate this API call, `URedwoodServerGameSubsystem::TravelPlayerToZoneSpawnName` and `URedwoodServerGameSubsystem::TravelPlayerToZoneTransform` which you can call from C++ or BP as long **as it's called from the game server**. You can call these functions at any point (e.g. when a boss battle finishes, on overlap with a collision component, player reaches a certain level, etc.).

### Zone Boundaries

You can implement zone boundaries however you'd like. The Unreal plugin comes with an example spline boundary system that's used in the RPG Template. The `B_PortalComponent` blueprint in the Redwood plugin's Content folder is a simple box that will transfer players when they leave the other side.

For example, given this pictogram:

```
       |B_PortalComponent|
Zone A [ --1-- ] [ --2-- ] Zone B
```

A player traveling from Zone A to Zone B will not be transferred until the player _leaves_ the overlap box labeled `2`. Vice versa, a player traveling from Zone B to Zone A won't be transferred until they _leave_ overlap box labeled `1`. This means that players to transfer at the same point, but this is by design to prevent players from being constantly transferred between zones when they're on the boundary because they won't be immediately considered to transfer back until they travel back a bit.

The plugin also has a `B_PortalSpline` actor which is a spline tool for placing many instance of `B_PortalComponent`.

:::tip
There are great examples of everything here (including portals, fast travel, and specific spawn locations) in the **RPG Template**; we **highly** recommend checking those out!
:::
