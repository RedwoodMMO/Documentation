---
sidebar_position: 3
---

# Open Match

The `open-match` provider is a Node.js integration of [Open Match](https://openmatch.dev), an open-source, flexible, and scalable matchmaker created by Google. Open Match recommends the [Match Function](https://openmatch.dev/site/docs/guides/matchmaker/matchfunction/) (the logic of how players get matched) be written in Go, but since Redwood aims to only introduce one language (JavaScript/TypeScript), we implemented a Node.js Match Function that scales just as easily as one made in Go.

Open Match only runs in Kubernetes. Redwood deploys it for you as one of the cluster dependencies (the `deployment.dependencies.open-match` Helm chart, version `1.8.1`), controlled by `deployment.kubernetes.instances.<id>.dependencies.openMatch.enabled` (on by default), and deploys Redwood's Match Function service with each realm. The `kubernetes` config environment already sets `ticketing.matchmaking.provider` to `open-match` for the `default` realm. With the Dev Initiator, use [Simple Match](./simple-match.md) instead.

By default, the Match Function provided by Redwood creates matches that consider optimal ping, low wait time (aka age), and more players. You can see this implementation in `packages/match-function/src/match-functions/default.ts` in the `computeMatchScore()` function. You can change these weights via [configuration](#the-default-match-function), but there's a good chance that you're going to want to customize the Match Function to your needs.

## Backfills

Redwood currently doesn't support [backfills](https://openmatch.dev/site/docs/guides/backfill/), but it's on the [roadmap](../../../support/roadmap.md)!

## Configuration

### Common

Both [Simple Match](./simple-match.md) and Open Match providers share some common matchmaking config variables. They're in each realm's [Realm Instance Config](../../../configuration/realm-instance-config.md) under `ticketing.matchmaking` (the defaults are in `config/node/default/realm/instances/redwoodBase.yaml`). Here's a brief overview of each of them:

|Name|Default|Description|
|-|-|-|
|`ticketing.matchmaking.enabled`|`true`|Whether matchmaking runs for this realm.|
|`ticketing.matchmaking.provider`|`simple-match`|`simple-match` or `open-match`.|
|`ticketing.matchmaking.ticket-stale-time-ms`|`60000`|The amount of time in milliseconds to wait before considering a ticket stale if it can't find a match beforehand. The client is told that the ticket went stale (`TicketError`) and they should try again later. Uncooked servers in development can take longer than a minute to start, so we raise this in [Installing](../../../getting-started/installing.md#initial-configuration).|
|`ticketing.matchmaking.max-match-age-ms`|`30000`|The amount of time in milliseconds to wait before considering a found match to be stale if a server can't be allocated/initialized beforehand. This rarely should happen, but if there are issues with the hosting provider a server may not come up. This is a catch-all. Clients are notified when this happens and tickets are re-entered into the ticket pool. Keep this lower than Open Match's `pendingReleaseTimeout` (`1m` by default).|
|`ticketing.matchmaking.max-wait-until-make-shallow-match-ms`|`45000`|The amount of time in milliseconds to wait before making a shallow (aka not full) match. The time is based on the oldest ticket in the viable match.|

The game profile fields `matchmaking-zone-name`, `min-players-for-matchmaking`, and `max-players-per-shard` (see [Game Modes and Maps](../../../configuration/game-modes-and-maps.md#profiles)) decide which profiles can be matchmade and how big matches are.

### Open Match Specific

You can configure the endpoints for the various Open Match services (`ticketing.matchmaking.open-match.frontend`, `.backend`, and `.query`) and Redwood's Match Function service (`ticketing.matchmaking.open-match.match-function`), but you should generally let Redwood configure these for you. See the [realm config reference](../../../configuration/reference/realm.md) for every variable. Below we go into more detail about configuring the match function that is used for Open Match.

## Match Function

Open Match requires a separate Match Function service that is used to evaluate the pending tickets for potential matches and provide a score to prevent overlapping matches. You can configure which match function is used with the `ticketing.matchmaking.open-match.match-function.name` configuration variable. This must match the name of the match function file (i.e. a name of `default` matches the `default.ts` match function).

Match functions are stored in `packages/match-function/src/match-functions/` and are written in TypeScript. You can create your own match function by creating a new file in this directory and exporting a class that implements the `IMatchFunction` TypeScript interface (from `match-function.ts` in the same folder).

### The default match function

Redwood comes with a `default` match function, which is a simple scoring function that balances ticket age, ping to the region, and number of players:

``` yaml
ticketing:
  matchmaking:
    open-match:
      match-function:
        # Equal numbers means equal preference, increase a number to favor it more
        scoring-weights:
          age: 1
          ping: 1
          players: 1
```

These are unitless weights when computing a potential match's score. Redwood uses the [Default Evaluator](https://openmatch.dev/site/docs/tutorials/defaultevaluator/) by default, which creates non-conflicting matches by favoring the ones with a higher score determined by the `computeMatchScore()` function mentioned above. These weights can be increased/decreased to favor optimal ticket age, ping, or player count respectively.

:::note
The default match function's absolute ping score treats ping as milliseconds (it starts penalizing above `80`), but the Unreal plugin reports ping in seconds in 5.0, so every region currently gets a near-perfect absolute ping score. The relative part of the ping score (preferring each ticket's better regions) still works. If absolute ping matters for your game, convert it to milliseconds in your own match function.
:::

### Creating a custom match function

While you can directly modify the `default.ts` match function, you can also implement a completely different one to prevent your changes from being overwritten during backend updates. To do this, create a new TypeScript file in `packages/match-function/src/match-functions/` (e.g. `my-match-function.ts`), and add a default export of a class that implements the `IMatchFunction` interface:

``` typescript
import type { openmatchMatchProfile, openmatchTicket } from "@open-match/api";
import { IRealmInstanceConfig } from "@redwoodmmo/common";
import { Writable } from "stream";
import { IMatchFunction } from "./match-function";

export default class MyMatchFunction implements IMatchFunction {
  public constructor() {
    //
  }

  public makeAndStreamMatches(
    omProfile: openmatchMatchProfile,
    poolTickets: Map<string, openmatchTicket[]>, // by default, Redwood will only have one pool for all tickets
    output: Writable,
    ticketingConfig: IRealmInstanceConfig["ticketing"]
  ): void {
    //
  }
}
```

:::note
The name of your exported class doesn't matter, only the name of the file matters.
:::

The `makeAndStreamMatches` function is automatically called for you. To add potential matches, you write them using `output.write(...)`. Every match proposal should have at least the `region` and `evaluation_input` `extensions`.

Match functions have a lot of details and are hard to properly document without confusing you; the best way to understand how to write one is to heavily reference/copy the `default.ts` match function included with Redwood.

### Configuring your custom match function

To use your custom match function, update the `ticketing.matchmaking.open-match.match-function.name` configuration variable to match the name of your match function file (without the `.ts` extension). For example, if you created a `my-match-function.ts` file, you would set the configuration variable to `my-match-function`.

### Packaging your custom match function

The match function ships with the backend source for both Standard and Custom licenses, so either can build a custom one. To create a binary for your custom match function, run the following commands in the `RedwoodBackend` folder:

``` bash
yarn build
yarn pkg:match-function
```
