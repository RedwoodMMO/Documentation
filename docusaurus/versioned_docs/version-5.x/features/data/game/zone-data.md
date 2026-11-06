---
sidebar_position: 3
---

# Zone Data

Each zone in a `GameServerProxy` can have its own persistent data that's not shared with other zones in the proxy.

## Unreal Setup

Setting up Zone Data is simple:

1. Add a `URedwoodSyncComponent` to your `AGameState` class.
1. Set the value of its `URedwoodSyncComponent::RedwoodId` variable to `zone`.
1. Set the value of its `URedwoodSyncComponent::bPersistChanges` variable to `true`.
1. You can change `URedwoodSyncComponent::DataVariableName` to match the name of the struct variable that should store the Zone Data.

If you want to persist changes to the struct to the database, call the matching `URedwoodSyncComponent::MarkDataDirty()` function.
