# Interactables

The Unreal plugin comes with a few classes that capture our best practices for interactables. Interactables in a game can be many things:

- Loot on the ground
- A door to open
- A merchant's storefront
- A fast travel board
- A dungeon entrance

You don't have to use these classes; they're a convenience. Their main benefit is that the interaction RPC lives in one place (a component on the player's pawn), so you don't end up adding a new Server RPC to your character class for every kind of thing players can interact with.

## How It Works

1. Each interactable (`ARedwoodInteractable`) has a sphere collision that defines how close a player needs to be.
1. The player's pawn has a `URedwoodInteractComponent`. On the owning client, it watches for overlaps with interactables and tells you when an interaction is available (so you can show a "Press F to interact" prompt).
1. When the player presses your interact input, you call `RPC_Interact()` on the component. On the server, the component picks one of the overlapping interactables and calls its `OnInteract` function.
1. Your interactable's `OnInteract` does whatever it does, **on the server**.

## Setup

### The player's pawn

1. Create a subclass of `URedwoodInteractComponent` (e.g. `UMyInteractComponent`). The base class can't be added directly; a subclass also lets you override its events.
1. Add it to your player's Pawn or Character class.
1. Make sure the pawn's **root component is a shape component** (for an `ACharacter`, the capsule already is). The component listens for overlaps on the root component.
1. Make sure the pawn has a [`URedwoodCharacterComponent`](../getting-started/saving-player-data.md). `OnInteract` passes it along so your interactables can read and modify the character's data, and interactions are ignored if it's missing.
1. In your interact component subclass, override:
    - `OnInteractionAvailability(bool bAvailable)`: called on the owning client when the player starts or stops being able to interact with something. Show or hide your prompt here.
    - `PickInteractable` (optional): choose which interactable to use when several overlap (e.g. the one under the reticle). The default picks the first one, in no particular order.
1. Bind your interact input action (e.g. `F`) to call `RPC_Interact()` on the component.

You can also call `GetInteractables()` or `CanInteract()` on the component to check what's in range.

### An interactable

1. Create a subclass of `ARedwoodInteractable` (e.g. `ADoor`).
1. Adjust the radius of its **Sphere Component** to set the interaction range, and add whatever meshes you need.
1. Override `OnInteract`. It receives the interacting Pawn and its `URedwoodCharacterComponent` and runs only on the server.
1. Place it in your level.

Set **Auto Interact** (`bAutoInteract`) to `true` if the interaction should trigger as soon as the player walks into range (e.g. picking up coins or walking into a portal) instead of waiting for input.

## Examples

### A world counter

A shrine that counts how many times players have prayed at it, shared across every shard and zone in the world, using [World Data](./data/game/world-data.md):

1. Set up World Data with a struct that has an integer `PrayerCount` field.
1. Create `B_Shrine` inheriting from `ARedwoodInteractable`.
1. In **On Interact**: get the Game State, cast it to your Game State class, increment `Data.PrayerCount`, then call **Mark Data Dirty** on the Game State's Redwood Sync Component.

Every other shard receives the new value automatically (bind the sync component's **Data Updated** event if you want to react to it).

### Fast travel

1. Create `B_FastTravel` inheriting from `ARedwoodInteractable`, with instance-editable `TargetZone` and `TargetSpawnName` variables.
1. In **On Interact**: get the pawn's controller (cast to **Player Controller**), get the **Redwood Server Game Subsystem**, and call **Travel Player to Zone Spawn Name** with the controller, `TargetZone`, and `TargetSpawnName`.
1. Place a [Zone Spawn](./game-servers/zones.md#unreal-setup) with that spawn name at the destination.

See [Zones](./game-servers/zones.md#transferring-zones) for more about traveling between zones.

## Interactables with Their Own RPCs

Some interactions need more back and forth than a single call. A bank is a great example:

1. The player walks up to the bank
1. The player sees a prompt to interact with it ([via `URedwoodInteractComponent`](#the-players-pawn))
1. The player sees a UI widget to access the bank
1. The player moves items in and out of the bank (more RPCs)

`ARedwoodInteractableProxied` handles this. When a player interacts with it, it spawns an actor of its `ProxyClass` (a subclass of `ARedwoodProxy`) on the server, owned by the interacting pawn. The proxy actor is replicated **only to that player** (`bOnlyRelevantToOwner = true`), and because the player owns it, it can have its own Server and Client RPCs. Its `Interactable` property points back at the interactable that spawned it.

That way, the bank's logic lives in the bank's proxy class instead of being coupled to your character class.

To make a bank:

1. Create `B_BankProxy` inheriting from `ARedwoodProxy`.
    - In **Begin Play**, if it's not running on the server (e.g. **Has Authority** is false), create and show your bank widget. The proxy only replicates to the interacting player, so the only client that runs this is theirs.
    - Add Server RPCs for the bank actions (e.g. `Server_Deposit`, `Server_Withdraw`) that modify the character's `NonequippedInventory` (or wherever your bank items live) and call the matching **Mark ... Dirty** on the character component.
    - Add a Server RPC to close the bank that destroys the proxy actor. Redwood doesn't destroy proxies for you.
1. Create `B_Bank` inheriting from `ARedwoodInteractableProxied` and set its **Proxy Class** to `B_BankProxy`.
1. Have your widget call the proxy's RPCs.

The same pattern works for merchants, crafting stations, or a dungeon entrance that asks the player to confirm before calling **Join Matchmaking** from the client (see [Instanced Dungeons](./instanced-dungeons.md)).

## Class Reference

| Class | Purpose |
| --- | --- |
| `ARedwoodInteractable` | A replicated actor with a **Sphere Component** for its range, **Auto Interact**, and the overridable **On Interact** event (server only) |
| `ARedwoodInteractableProxied` | An interactable that spawns its **Proxy Class** for the interacting player |
| `ARedwoodProxy` | A replicated actor that's only relevant to its owner, with an `Interactable` property pointing at the interactable that spawned it |
| `URedwoodInteractComponent` | The pawn component: `OnInteractionAvailability`, `PickInteractable`, `GetInteractables`, `CanInteract`, and `RPC_Interact` |

The full details are in the [Unreal Plugin Reference](../unreal-reference/zones-and-interactables.md).
