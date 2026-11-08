# Instanced Dungeons

An instanced dungeon is just another [game profile](../configuration/game-modes-and-maps.md#profiles) that players join through [matchmaking](./ticketing/overview.md). The only big difference between a normal match and an instanced dungeon is what happens when it's over: in a match-based game the server disconnects the player and they're brought back to the main menu, but in an instanced dungeon the server sends the player back to a zone in the persistent world (the "overworld") they came from.

Redwood connects the two with the profile's `parent-profile-id` setting: when a dungeon server starts, Redwood finds the running overworld proxy and gives the dungeon server its ID, so the dungeon knows where to send players back to.

## Backend Setup

Add a profile for the dungeon next to your overworld profile in `game.yaml`:

```yaml
profiles:
  - id: "overworld"
    zones:
      variableCasing: "original"
      town:
        maps:
          - "overworld"
      cave:
        maps:
          - "cave"
    max-players-per-shard: 50
    num-players-to-add-shard: 40
    collection-ends-when-any-shard-ends: false

  - id: "dungeon"
    zones:
      variableCasing: "original"
      main:
        maps:
          - "dungeon"

    # A party-sized instance
    max-players-per-shard: 5

    # Enable matchmaking into the dungeon
    matchmaking-zone-name: "main"
    min-players-for-matchmaking: 1

    # Look up the active "overworld" proxy and pass its ID to dungeon servers
    parent-profile-id: "overworld"
```

A few notes:

- `parent-profile-id` assumes there's a single active proxy for the parent profile in the realm (which is the typical setup for a persistent world). If no active parent proxy is found when the dungeon starts, the backend logs an error and starts the dungeon without one.
- Matchmaking and queuing are both enabled by default (`ticketing.matchmaking.enabled` and `ticketing.queue.enabled` in the [realm instance config](../configuration/reference/realm.md)).
- `max-wait-until-make-shallow-match-ms` in the realm's `ticketing.matchmaking` config controls how long Redwood waits for more players before starting a dungeon with fewer than `max-players-per-shard`.

You'll also need a [Game Mode Asset](../getting-started/setting-up-unreal.md#game-mode-assets) with the **Redwood Id** `dungeon` and a [Map Asset](../getting-started/setting-up-unreal.md#map-assets) with the **Redwood Id** `dungeon`. The dungeon can use the same game mode class as your overworld.

## Entering the Dungeon

Entering a dungeon is a matchmaking request made **from the client**, usually from a widget shown when the player interacts with the dungeon entrance:

1. On the server, an [interactable](./interactables.md) at the dungeon entrance tells the owning client to show a "Enter dungeon?" widget (e.g. with a client RPC on an `ARedwoodProxy`, or by spawning the widget through an `ARedwoodInteractableProxied`).
1. On the client, the widget calls **Join Matchmaking** (`URedwoodClientGameSubsystem::JoinMatchmaking`) with the **Profile Id** `dungeon` and the regions from **Get Regions**. See [Building the Main Menu](../getting-started/building-the-main-menu.md#matchmaking) for how to handle the ticketing updates.
1. When the match is made, Redwood automatically moves the player (and their party, if the party leader started matchmaking) to the dungeon server.

The client stays connected to the realm the whole time it's on a game server, so all of the client subsystem functions work from inside the overworld.

## Returning to the Overworld

When the dungeon is done (the boss is defeated, the players leave through an exit portal, or a timer runs out), send each player back from the **dungeon server**:

1. Get the **Redwood Server Game Subsystem** (`URedwoodServerGameSubsystem`) and read its **Parent Proxy Id** (`ParentProxyId`), which is the overworld proxy's ID.
1. For each player, call **Travel Player to Zone Spawn Name** (`TravelPlayerToZoneSpawnName`) with:
    - the player's controller
    - the overworld zone to return to (e.g. `cave`)
    - a spawn name (e.g. `from-dungeon`)
    - **Optional Proxy Id** set to the **Parent Proxy Id**
1. In the overworld's `cave` map, place a [Zone Spawn](./game-servers/zones.md#unreal-setup) with **Zone Name** `cave` and **Spawn Name** `from-dungeon` next to the dungeon entrance.

```cpp
URedwoodServerGameSubsystem* Redwood =
  GetGameInstance()->GetSubsystem<URedwoodServerGameSubsystem>();

for (FConstPlayerControllerIterator It = GetWorld()->GetPlayerControllerIterator(); It; ++It)
{
  if (APlayerController* PlayerController = It->Get())
  {
    Redwood->TravelPlayerToZoneSpawnName(
      PlayerController, TEXT("cave"), TEXT("from-dungeon"), Redwood->ParentProxyId
    );
  }
}
```

Once everyone has left, you can shut the dungeon server down with **Request Engine Exit** (`URedwoodServerGameSubsystem::RequestEngineExit`). Redwood notices the server process exited and ends the dungeon's proxy (proxies created by matchmaking are set to end when their servers end).
