# Zones

All [`GameServerProxies`](../../architecture/game-servers.md#gameserverproxy) define one or more zones. Technically speaking, zones are abstract ideas; each zone consists of a set of [shards](./sharding.md) (the actual running Unreal servers). Zones can be different maps, or different areas of a single map.

Match-based games usually only need one zone (we call it `main` in our examples). Persistent worlds use zones to split a big world (or several maps) across multiple servers, and Redwood moves players between those servers as they travel.

## Defining Zones

Zones are defined per [game profile](../../configuration/game-modes-and-maps.md#profiles) in your config environment's `game.yaml`:

```yaml
profiles:
  - id: "overworld"

    zones:
      # Keep zone names exactly as written (no camelCase conversion).
      # Fields inside zones must then be written in camelCase.
      variableCasing: "original"

      town:
        maps:
          - "overworld"
      wilds:
        maps:
          - "overworld"
        # Show Sync Items that live in the town zone on wilds servers too
        syncItemsFromZones:
          - "town"
      cave:
        maps:
          - "cave"

    max-players-per-shard: 50
    num-players-to-add-shard: 40
    collection-ends-when-any-shard-ends: false
```

Each zone lists the [Map Asset](../../getting-started/setting-up-unreal.md#map-assets) IDs it can load (if there's more than one, Redwood picks one at random). The zone's key (`town`, `wilds`, `cave`) is the **zone name** you'll use everywhere else: in Zone Spawns, in travel calls, and in the realm's queue requests. Zone names are case-sensitive.

When a GameServerProxy for this profile starts, Redwood starts one shard per zone. In the example above, that's three Unreal servers: two that load the `overworld` map (one for `town`, one for `wilds`) and one that loads `cave`.

Every field for profiles and zones is listed in the [game config reference](../../configuration/reference/game.md).

### One map or many?

Both work, and you can mix them:

- **Separate maps per zone** (e.g. `cave` above) is the simplest. Each zone's server only loads its own level, and players move between zones through explicit transitions (doors, portals, loading screens).
- **One map shared by several zones** (e.g. `town` and `wilds` both load `overworld`) lets you split a large open world into regions. Every zone's server loads the whole map, but players only exist on the server for the zone they're in. You decide where the boundaries are and transfer players when they cross them (see [Zone Boundaries](#zone-boundaries)). Use `syncItemsFromZones` or `syncItemsFromAllZones` so [Sync Items](../sync-items.md) near the boundary are visible from the neighboring zone.

On the server, you can always check which zone (and shard) you're running with the `ZoneName` and `ShardName` properties on the **Redwood Server Game Subsystem** (`URedwoodServerGameSubsystem`). On clients, use the `URedwoodGameStateComponent`'s `GetServerDetails()`.

## Unreal Setup

For every zone, place one or more **Redwood Zone Spawn** (`ARedwoodZoneSpawn`) actors in the zone's map to tell Redwood where players should appear when they enter the zone. In the Details panel, set:

| Property | Default | Meaning |
| --- | --- | --- |
| **Zone Name** | empty | The zone name from your profile (case-sensitive, e.g. `town`) |
| **Spawn Name** | `default` | The name of this entry point. Every zone should have one spawn named `default`; add more with other names for specific entrances (e.g. `from-cave`). |
| **Spawn Radius** | `0` | Randomly offset players within this radius so they don't stack on top of each other |
| **Randomize Rotation** | `false` | Give each player a random yaw |

Redwood traces down from the spawn to find the ground (and adds a little height), so you don't need to place it exactly on the floor.

When a player joins a zone's server, Redwood spawns them:

1. At their last saved location, if it was in this zone
1. Otherwise at the Zone Spawn they were sent to (if they arrived through [`TravelPlayerToZoneSpawnName`](#transferring-zones))
1. Otherwise at the zone's `default` Zone Spawn (or the first Zone Spawn for the zone, if none are named `default`)
1. Otherwise using Unreal's normal Player Start logic

For example, a `cave` zone might have a `default` spawn at the cave entrance and a `from-dungeon` spawn next to an [instanced dungeon](../instanced-dungeons.md) portal, so players coming back from the dungeon don't have to walk all the way back.

See [Setting Up Unreal](../../getting-started/setting-up-unreal.md#zone-spawns) and the [zones reference](../../unreal-reference/zones-and-interactables.md) for more details.

## Transferring Zones

To move a player to another zone, call one of these functions on the **Redwood Server Game Subsystem** (`URedwoodServerGameSubsystem`) **on the game server**:

| Function | Parameters | Where the player ends up |
| --- | --- | --- |
| `TravelPlayerToZoneSpawnName` | `PlayerController`, `InZoneName`, `InSpawnName` (default `default`), `OptionalProxyId` | At the target zone's Zone Spawn with that **Spawn Name** |
| `TravelPlayerToZoneTransform` | `PlayerController`, `InZoneName`, `InTransform`, `OptionalProxyId`, `bShouldStitch` | At an exact location in the target zone (handy for seamless boundaries in a shared map, where the player should appear exactly where they crossed) |

Leave `OptionalProxyId` empty to travel within the same GameServerProxy, or pass another proxy's ID to send the player to a different world (e.g. back to the overworld from an [instanced dungeon](../instanced-dungeons.md)). Leave `bShouldStitch` set to `false`; it's for a work-in-progress feature.

You can call these at any point: when the player overlaps a trigger, interacts with a fast travel board, finishes a boss fight, reaches a certain level, and so on.

Here's what happens when you call one:

1. Redwood marks the player as transferring and fires `OnTransferring` on their `URedwoodPlayerStateComponent` on the owning client, so you can show a loading screen (this requires **Component Replicates** to be enabled on the component).
1. The backend saves the player's destination, finds (or starts) the best shard for the target zone, and tells the client to connect to it.
1. The client travels to the new server automatically (or fires `OnRequestToJoinServer` if you turned off **Auto Connect to Servers**).
1. The new server loads the player's character data and spawns them at the destination.

If something goes wrong (e.g. the target zone doesn't exist), the player is kicked with the error message.

### Example: a zone transition trigger

The simplest zone transition is a trigger volume that sends any player who walks into it to another zone.

Create an actor (e.g. `AZoneTransition`) with a box collision component and two instance-editable `FString` properties, `TargetZone` and `TargetSpawnName` (default `default`). When a pawn overlaps it on the server, it sends that pawn's player to the target zone:

```cpp
#include "RedwoodServerGameSubsystem.h"

void AZoneTransition::NotifyActorBeginOverlap(AActor* OtherActor)
{
  Super::NotifyActorBeginOverlap(OtherActor);

  if (!HasAuthority()) { return; }

  APawn* Pawn = Cast<APawn>(OtherActor);
  APlayerController* PlayerController = Pawn ? Cast<APlayerController>(Pawn->GetController()) : nullptr;
  if (!PlayerController) { return; }

  URedwoodServerGameSubsystem* Redwood =
    GetGameInstance()->GetSubsystem<URedwoodServerGameSubsystem>();
  Redwood->TravelPlayerToZoneSpawnName(PlayerController, TargetZone, TargetSpawnName, TEXT(""));
}
```

Zone transfers can only be started by the server, which is why it checks `HasAuthority()`. Place the actor in your level at the transition (e.g. the cave entrance in the `wilds` zone), set **Target Zone** to `cave`, and place a `default` Zone Spawn inside the cave map.

:::tip
A fast travel board works the same way: make an [interactable](../interactables.md) whose `OnInteract` calls `TravelPlayerToZoneSpawnName` with the destination's zone and spawn name.
:::

### Zone Boundaries

You can implement zone boundaries however you'd like, but the Redwood plugin comes with a ready-to-use boundary system for zones that share a map. You'll find it in the plugin's content folder under `/RedwoodCore/Zones/Portal` (enable **Settings > Show Plugin Content** in the Content Browser to see it):

- `B_PortalComponent` is an actor with two overlap boxes side by side (a "red side" and a "green side"), each belonging to one zone. When a player **leaves** the box on the far side of the boundary, it calls `TravelPlayerToZoneTransform` with the player's current transform, so they appear at exactly the same spot on the neighboring zone's server.
- `B_PortalSpline` is a spline actor that lines up `B_PortalComponent` segments along its spline, so you can draw a boundary of any shape.

To use it:

1. Drag `B_PortalSpline` into the shared map and edit its spline points along the boundary between two zones.
1. Set **Red Side Zone** and **Green Side Zone** to the zone names on each side (e.g. `town` and `wilds`).
1. Adjust the box size variables (e.g. **Box Size**) if your players move fast enough to skip through the boxes in a single frame.

Take this pictogram:

```
       |B_PortalComponent|
Zone A [ --1-- ] [ --2-- ] Zone B
```

A player traveling from Zone A to Zone B isn't transferred until they _leave_ the overlap box labeled `2`. Vice versa, a player traveling from Zone B to Zone A isn't transferred until they _leave_ the box labeled `1`. This means players don't transfer at exactly the same point in each direction, which is by design: a player standing right on the boundary won't be bounced back and forth between servers, because they have to travel back a bit before they're considered for a transfer back.

:::note
The portal assets are Blueprints, so open them in the editor if you want to see exactly how they work or customize them (we recommend duplicating them into your project rather than modifying the plugin's copies).
:::
