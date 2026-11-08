---
sidebar_position: 8
---

# Zones and Interactables

These classes deal with where players spawn, moving players between [zones](../features/game-servers/zones.md) and proxies, and the optional interactable framework. For the concepts, see [Zones](../features/game-servers/zones.md), [Sharding](../features/game-servers/sharding.md), and [Instanced Dungeons](../features/instanced-dungeons.md).

## `ARedwoodZoneSpawn`

An actor you place in your levels to mark spawn points for a zone. It shows as a billboard with a red arrow in the editor.

| Property / function | Type | Default | Meaning |
| --- | --- | --- | --- |
| `ZoneName` | `FString` | empty | The zone this spawn belongs to. Must match a zone key in the game profile's `zones` (e.g. `town`, or `main` for single-zone profiles). |
| `SpawnName` | `FString` | `default` | Name used by `TravelPlayerToZoneSpawnName`. Each zone should have one spawn named `default`, used when a player has no saved location in that zone. |
| `SpawnRadius` | `float` | `0` | Randomly offset the spawn position within this radius. |
| `bRandomizeRotation` | `bool` | `false` | Use a random yaw. |
| `GetSpawnTransform()` | `FTransform` | | The transform a player would spawn at. Redwood traces down (and then from 1000 units above) against `WorldStatic` to find the ground, then adds 100 units of height. |

A single map can contain spawns for several zones (for example, when the same overworld map is used by the `town` and `wilds` zones). Only spawns whose `ZoneName` matches the server's zone are used. See [Spawn Selection](./game-framework.md#spawn-selection) for the full order of precedence.

:::tip
A zone can have more than one named spawn, for example `default`, `from-cave`, and `from-dungeon`, so players returning from different places appear in the right spot.
:::

## Zone Transfers

Zone transfers move a connected player from their current server to a server for another zone (or another proxy). They're functions on `URedwoodServerGameSubsystem`, so call them **on the server** (get the subsystem from the game instance).

| Function | Parameters | Meaning |
| --- | --- | --- |
| `TravelPlayerToZoneSpawnName` | `PlayerController`, `InZoneName`, `InSpawnName = "default"`, `OptionalProxyId = ""` | Send the player to the `ARedwoodZoneSpawn` named `InSpawnName` in zone `InZoneName`. |
| `TravelPlayerToZoneTransform` | `PlayerController`, `InZoneName`, `InTransform`, `OptionalProxyId = ""`, `bShouldStitch = false` | Send the player to zone `InZoneName` at `InTransform` (location and rotation; the player's control rotation is kept). Use this for seamless boundaries, so the player appears at the same spot on the other side. Leave `bShouldStitch` as `false` (it's for an unreleased feature). |

`OptionalProxyId` targets a different proxy (for example a specific instanced dungeon, or the parent overworld). Leave it empty to stay in the current proxy.

What happens:

1. Redwood marks the player as transferring and asks the sidecar to transfer them.
2. The Realm saves the destination as the character's last location, starts (or finds) a server for the target zone, and tells the player's client to connect to it.
3. The client travels automatically (or fires `OnRequestToJoinServer` if `bAutoConnectToServers` is off).
4. When the player leaves the old server, their data is saved, without overwriting the new location.
5. On the new server, [spawn selection](./game-framework.md#spawn-selection) uses the saved location.

If the transfer fails, the player is kicked with the error message. Zone transfers require the backend; in no-backend mode they log an error.

:::note
Only players transfer. Moving [sync items](../features/sync-items.md) between zones isn't supported.
:::

## Portal Content

RedwoodCore includes Blueprint content in `/RedwoodCore/Zones/Portal/` (enable **Show Plugin Content** in the Content Browser) for seamless zone boundaries in a map shared by two zones.

| Asset | What it is |
| --- | --- |
| `B_PortalSpline` | An actor with a spline. On the server, it builds a wall of `B_PortalComponent` segments along the spline. Set `RedSideZone` and `GreenSideZone` to the zone names on each side, and `BoxSize`/`BoxWidth` to size the segments. |
| `B_PortalComponent` | One segment: trigger boxes and visual walls for each side. When a player's character leaves a box toward the other zone, it calls `TravelPlayerToZoneTransform` with the player's current position, so they continue walking from the same spot on the other zone's server. It ignores transfers to the zone the server already runs. |
| `M_PortalGate`, `MI_PortalGate*` | Materials that show the wall as an entrance or exit depending on which zone the server runs. |

To use it:

1. Make sure the map is used by both zones in your [game profile](../configuration/game-modes-and-maps.md#profiles) (e.g. `town` and `wilds` both list the `overworld` map).
2. Place a `B_PortalSpline` along the boundary and shape the spline.
3. Set `RedSideZone` and `GreenSideZone` to the two zone names.
4. Set [`syncItemsFromZones`](../configuration/game-modes-and-maps.md#profiles) on each zone if players should see items from across the boundary.

These are Blueprints, so you can duplicate and modify them (for example, to change the look or add a loading screen).

## Interactables

An optional framework for things players interact with (pickups, doors, NPCs, zone transfer triggers). It keeps the server RPC in one place (on the player's pawn) instead of on every interactable. You don't have to use it.

### `ARedwoodInteractable`

A replicated actor with a `SphereComponent` (collision profile `OverlapOnlyPawn`) that defines the interaction area.

| Member | Type | Default | Meaning |
| --- | --- | --- | --- |
| `SphereComponent` | `USphereComponent*` | | The interaction area. Resize it in your subclass. |
| `bAutoInteract` | `bool` (replicated) | `false` | Interact automatically when a pawn with a `URedwoodInteractComponent` overlaps it (e.g. walking into a coin). |
| `OnInteract(Pawn, CharacterComponent)` | BlueprintNativeEvent | | Override this. Called **on the server** when a player interacts. `CharacterComponent` is the pawn's `URedwoodCharacterComponent`, so you can change and `Mark...Dirty` their data. |

Interactables also respond to the [`Redwood.Player.Interaction`](./game-framework.md#gameplay-messages) gameplay message: if the message's pawn overlaps the sphere and has a character component, `OnInteract` is called.

### `ARedwoodInteractableProxied`

A subclass whose `OnInteract` spawns an actor of `ProxyClass` (a subclass of `ARedwoodProxy`) owned by the interacting pawn, and sets its `Interactable` to this actor. Use it when an interaction opens per-player state, like a merchant or bank UI, that only that player should see.

| Member | Type | Meaning |
| --- | --- | --- |
| `ProxyClass` | `TSubclassOf<ARedwoodProxy>` | The actor to spawn for the interacting player |

### `ARedwoodProxy`

A replicated actor that's only relevant to its owner (`bOnlyRelevantToOwner = true`). Its `Interactable` property (replicated, read only) points back at the interactable that spawned it. Put the per-player logic and RPCs for an interaction here. (This is unrelated to the backend's GameServerProxy.)

### `URedwoodInteractComponent`

A replicated component for the player's **pawn**. The pawn's root component must be a shape component (e.g. an `ACharacter` capsule). It isn't directly spawnable, so create a Blueprint subclass of it and add that to your pawn.

| Member | Meaning |
| --- | --- |
| `OnInteractionAvailability(bAvailable)` | BlueprintNativeEvent, called on the locally controlled client when an interactable comes into or out of range. Use it to show an "interact" prompt. |
| `GetInteractables()` | The `ARedwoodInteractable` actors currently overlapping the pawn. |
| `CanInteract()` | Whether any interactable is in range. |
| `RPC_Interact()` | Server RPC. Call it from your input handling on the client; the server picks an interactable with `PickInteractable` and calls its `OnInteract`. The pawn needs a `URedwoodCharacterComponent`. |
| `PickInteractable(Interactables)` | BlueprintNativeEvent that chooses which interactable to use when several overlap. Defaults to the first one. Override it to pick the closest, for example. |

A typical setup:

1. Create `B_InteractComponent` (child of `URedwoodInteractComponent`) and add it to your character.
2. In your character, on the interact input action, call `RPC_Interact` on the component.
3. Create interactables as children of `ARedwoodInteractable` and implement **On Interact**.

For example, a zone transfer trigger is an interactable whose **On Interact** calls `TravelPlayerToZoneSpawnName` with the pawn's controller. Because **On Interact** runs on the server, interactions that need a client API call (like joining matchmaking for an instanced dungeon) should use an `ARedwoodInteractableProxied` and make the call from a client RPC or replicated event on the spawned `ARedwoodProxy`.

:::caution Known issue (5.0.0)
`URedwoodInteractComponent` binds its overlap events in `BeginPlay` only if the pawn is locally controlled at that moment. If your pawn is possessed after `BeginPlay` on clients, the availability events may not fire.
:::

## Running Console Commands on All Clients

`URedwoodServerGameSubsystem::CallExecCommandOnAllClients(Command)` (server only) spawns an always-relevant, replicated `ARedwoodClientExecCommand` actor. Each client runs `Command` as a console command when the actor replicates to it.

:::caution Known issue (5.0.0)
These actors are never destroyed, so players who join later also run every previous command, and the actors accumulate. Use it sparingly.
:::
