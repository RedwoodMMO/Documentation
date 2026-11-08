---
sidebar_position: 4
sidebar_label: Custom Flow
---

# Custom Ticketing Flow

:::warning
Custom ticketing flows are only supported if you have source code access. You can see how to purchase it [here](https://redwoodmultiplayer.com/#pricing).
:::

This ticketing "mode" enables powerful setups where the backend decides where to place the player based on their PlayerCharacter data. Clients simply call **Join Custom** (`URedwoodClientGameSubsystem::JoinCustom(bTransferWholeParty, Regions, OnUpdate)`), and your backend code decides whether to put them into matchmaking or a queue, and for what.

## Example Scenario

Here is an example flow for an MMORPG.

1. If the Character hasn't finished the tutorial yet, put them in `matchmaking` for a tutorial profile
1. If the Character has finished the tutorial but has no last location, put them in the `queue` in the starting zone for the overworld proxy
1. If the Character level >= 5 and the date is between December 1 and December 31, place them in a special holidays proxy/zone
1. If the Character was in a dungeon/player housing last, put them in `matchmaking` for that dungeon/player housing profile
1. Otherwise, put the Character in their last known location/proxy/zone

## Setup

1. Make a new file at `packages/realm-frontend/src/routes/player/custom/custom.ts` with the contents:

    ```ts
    import { CustomPlayerJoinData, CustomTicketingFunction } from ".";
    import { PlayerCharacter } from "@redwoodmmo/realm-db";
    import { RealmFrontendManager } from "../../../realm-frontend-manager";
    import { Logger } from "@redwoodmmo/common";

    const flow: CustomTicketingFunction = async (
      manager: RealmFrontendManager,
      character: PlayerCharacter
    ): Promise<CustomPlayerJoinData> => {
      throw new Error("Custom module not implemented yet");
    };

    export default flow;
    ```

1. You can safely commit this new `custom.ts` in your fork of the backend repo without worrying about future conflicts
1. Don't modify `packages/realm-frontend/src/routes/player/custom/default.ts` (it loads your `custom.ts` automatically if it exists)
1. In the new `custom.ts`, replace the contents of the `flow` function as you see fit; you have access to the entire `PlayerCharacter` (including all of its [data fields](../data/game/player-data.md#playercharacter)) and the Realm Frontend's `manager` (e.g. `manager.db` for the realm database)
1. You can throw an error with `throw new Error("Message")` and "Message" will be sent as the error to the user
1. Call **Join Custom** from the UE plugin

## The Return Value

Your function returns a `CustomPlayerJoinData` object (defined in `packages/realm-frontend/src/routes/player/custom/index.ts`), which is one of these shapes:

```ts
// Put the player into matchmaking for a game profile
{
  type: "matchmaking",
  profileId: "dungeon",
}

// Queue the player into a zone, at a named spawn point (an ARedwoodZoneSpawn's SpawnName)
{
  type: "queue",
  profileId: "overworld",
  proxyId: "cm1ol7o270001xhxi5z3d7fw2", // optional; defaults to the first active proxy with the profileId
  zoneName: "town",
  spawnName: "default",
}

// Queue the player into a zone, at a specific transform
{
  type: "queue",
  profileId: "overworld",
  zoneName: "town",
  transform: {
    location: { x: 0, y: 0, z: 100 },
    rotation: { x: 0, y: 0, z: 90 },
    controlRotation: { x: 0, y: 0, z: 90 },
  },
}
```

For matchmaking, the regions the client passed to **Join Custom** (with their pings) are used, just like **Join Matchmaking**. For queuing, the client's `bTransferWholeParty` input is respected, and if you don't return a `proxyId`, the first active (not ended) proxy using `profileId` is used (or the player gets the error `... there are no available proxies with that profile.`).

:::caution Known issue (5.0.0)
The `spawnName` and `transform` fields of a queue decision aren't applied yet; players spawn using the normal rules (their last location in that zone, then the zone's `default` [Zone Spawn](../../getting-started/setting-up-unreal.md#zone-spawns)).
:::

A character's last known location is stored in its `redwoodData.lastLocation` (`proxyId`, `zoneName`, and either a `transform` or a `spawnName`), which is handy for the "put them back where they were" case.
