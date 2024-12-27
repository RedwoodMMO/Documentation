---
sidebar_position: 6
---

# Interactables

The Unreal plugin comes with a few classes to provide best-practices when it comes to interactables. Interactables in a game can be many things:

- Loot on the ground
- A door to open
- A merchant's storefront
- A fast travel board

:::info
The **RPG Template** has some great examples of various types of interactables (loot, bank, merchant, fast travel, zone transfers, and queuing for instanced dungeons).
:::

## Unreal Classes

### `ARedwoodInteractable`

This is a standard interactable. This class comes with an adjustable sphere collision which the [`URedwoodInteractComponent`](#uredwoodinteractcomponent) component uses to determine when to show the interaction widget. This class waits until it's `OnInteraction` function is called (which the interact component calls when the interact input action happens for this actor). You can override this function in BP or C++; note that this function will be executed only on the server.

### `URedwoodInteractComponent`

This is an actor component that should get attached to the player character's actor. You should create a child class that inherits from this one and override the following functions:

- `OnInteractionAvailability` gets called on the client with a bool parameter that tells you whether or not the player can interact with anything. Useful for showing a widget (e.g. "Press F to Interact")
- `PickInteractable` can optionally be overridden to determine which interactable to interact with if there's multiple options (e.g. using the reticle); the default behavior is to just pick the first in the array, which can be any order
- Add your own event/function to handle input and call `RPC_Interact()` yourself to trigger an interaction

### `ARedwoodInteractableProxied`

If your interactable needs to have some subsequent RPC methods, inherit from this class. A great example of this is accessing a bank:
1. Player goes up to the bank
1. Player sees a prompt to interact with it [via URedwoodInteractComponent](#uredwoodinteractcomponent)
1. Player sees a UI widget to access the bank
1. Player wants to shift items in the bank (via RPC methods)

The `ARedwoodInteractableProxied` class, which inherits `ARedwoodInteractable`, handles this by spawning a new, replicating actor that inherits from [`ARedwoodProxy`](#aredwoodproxy) on the server. That proxy actor is set to be only relevant to the owner and sets the owner to the player's character actor.

By doing this, you can have RPC logic that's specific to this interactable without coupling that logic in the player character's class or another actor component attached to it.

In the `ARedwoodInteractableProxied` inherited class, make sure to set the `ProxyClass` variable that points to the corresponding class that inherits from `ARedwoodProxy`.

### `ARedwoodProxy`

This class inherits from `AActor` and only alters the replication settings for the actor by setting `bOnlyRelevantToOwner = false`. You need to inherit from this class to add the various RPCs for your associated [`ARedwoodInteractableProxied`](#aredwoodinteractableproxied) actor.
