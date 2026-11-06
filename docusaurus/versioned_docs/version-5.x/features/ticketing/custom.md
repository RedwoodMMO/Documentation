---
sidebar_position: 4
sidebar_label: Custom Flow
---

# Custom Ticketing Flow

:::warning
Custom ticketing flows are only supported if you have source code access. You can see how to purchase it [here](/#pricing).
:::

This ticketing "mode" enables powerful setups where the backend decides where the place the player based on the PlayerCharacter data. Clients simply call `URedwoodClientGameSubsystem::JoinCustom`.

## Example Scenario

Here is an example flow for an MMORPG.

1. If Character hasn't finished the tutorial yet, put them in `matchmaking` for a tutorial profile
1. If Character has finished tutorial but has no last location, put them in `queue` in the starting zone for the overworld proxy using the default spawn name
1. If the Character level >= 5 and the date is between December 1 and December 31, place them in a special holidays proxy/zone
1. If the Character was in a dungeon/player housing last, put them in `matchmaking` for that dungeon/player housing profile
1. Otherwise, put the Character in their last known location/proxy/zone

## Setup

1. Make a new file at `packages/realm-frontend/src/routes/player/custom/custom.ts` with the contents:

    ```ts
    import { CustomPlayerJoinData, CustomTicketingFunction } from ".";
    import { PlayerCharacter } from "@redwoodmmo/realm-db";
    import { RealmFrontendManager } from "../../../realm-frontend-manager";
    import fs from "fs";
    import path from "path";
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
1. Don't modify `packages/realm-frontend/src/routes/player/custom/default.ts`
1. In the new `custom.ts`, replace the contents of the `flow` function below as you see fit; you will have access to the entire `PlayerCharacter` data
1. You can throw an error with `throw new Error("Message")` and "Message" will be sent as the error to the user
1. Call `JoinCustom` from the UE plugin
