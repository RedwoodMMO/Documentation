---
sidebar_position: 4
---

# Zones

All [`GameServerProxies`](../architecture/game-servers.md#gameserverproxy) define 1 or more zones. Technically speaking, zones are abstract ideas; each zone consists of a set of shards. Usually zones can be different maps or different areas in a single map.

Zones are defined as part of the [game profile](../configuration/game-modes-and-maps.md#profiles).

Transferring between zones can be initiated by the game server by calling the `realm:servers:transfer-zone:game-server-to-sidecar` API call, specifying the player character ID, zone name to transfer the player to, and where in the zone to spawn the player. The last component can either be a name of a spawn actor (Spawn Name) or either the spawn name within the zone or a modified transform which contains the location/rotation of the character and the control rotation of the camera.

The Unreal plugin provides two static functions to facilitate this API call, `URedwoodServerGameSubsystem::TravelPlayerToZoneSpawnName` and `URedwoodServerGameSubsystem::TravelPlayerToZoneTransform` which you can call from C++ or BP as long as it's called from the game server. Clients that call this function just won't get a response due to not being able to connect to the [sidecar](../architecture/overview.md#sidecar).

The Unreal plugin also provides two actors, `B_PortalComponent` and `B_PortalSpline` which call the `TravelPlayerToZoneTransform` function when a player's character passes through it. It's recommended to use these if you want to transfer zones when players reach a physical threshold/barrier. If you want to transfer players abstractly, you may want to call `TravelPlayerToZoneSpawnName` yourself; this is useful in fast travel systems for example.

:::info
There are great examples of both the portals and a fast travel system in the **RPG Template**; we highly recommend checking those out!
:::
