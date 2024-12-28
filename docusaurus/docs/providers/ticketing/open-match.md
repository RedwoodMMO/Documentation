---
sidebar_position: 3
---

# Open Match

The `open-match` provider is a Node.js integration of [Open Match](https://openmatch.dev), an open-source, flexible, and scalable matchmaker created by Google. Open Match recommends the [Match Function](https://openmatch.dev/site/docs/guides/matchmaker/matchfunction/) (which is the logic of how players get matched) is made in Go, but since Redwood aims to only introduce one new language (JavaScript/TypeScript), we have implemented a Node.js Match Function that scales just as easily as one made in Go.

By default, the Match Function provided by Redwood creates matches that consider optimal ping, low wait time (aka age), and more players. You can see this implementation in `RedwoodBackend/packages/match-function/src/match-function.ts` under the `computeMatchScore()` function. You can change these weights via [configuration](#open-match-specific), but there's a good chance that you're going to want to customize the Match Function to your needs.

## Backfills

Redwood currently doesn't support [backfills](https://openmatch.dev/site/docs/guides/backfill/), but it's on the [roadmap](../../support/roadmap.md)!

## Configuration

### Common

Both [Simple Match](./simple-match.md) and Open Match providers share some common matchmaking config variables. You can find these in `RedwoodBackend/config/node/default/ticketing/matchmaking/_index.yaml`, but here's a brief overview of each of them:

|Name|Description|
|-|-|
|`ticket-stale-time-ms`|The amount of time in milliseconds to wait before considering a ticket stale if it can't find a match beforehand. The client is told that the ticket went stale and they should try again later.|
|`max-match-age-ms`|The amount of time in milliseconds to wait before considering a found match to be stale if a server can't be allocated/initialized beforehand. This rarely should happen, but if there's issues with the hosting provider a server may not come up. This is a catch all. Clients are notified when this happens and tickets are re-entered into the ticket pool.|
|`max-wait-until-make-shallow-match-ms`|The amount of time in milliseconds to wait before making a shallow (aka not full) match. The time is based off the oldest ticket in the viable match.|

### Open Match Specific

You can configure the endpoints for the various Open Match backend services, but you should generally let Redwood configure these for you. Below we go into more detail about configuring the match function that is used for Open Match.

## Match Function

Open Match requires a separate Match Function service that is used to evaluate the pending tickets for potential matches and providing a score to prevent overlapping matches. You can configure which match function is used with the `ticketing.matchmaking.open-match.match-function.name` configuration variable. This much match the name of the match function file (i.e. a name of `default` matches the `default.ts` match function name).

Match functions are stored in `RedwoodBackend/packages/match-function/src/match-functions/` and are written in TypeScript. You can create your own match function by creating a new file in this directory and exporting a function that implements the `IMatchInterface` TypeScript interface.

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

These are unitless weights when computing a potential match's score. Redwood uses the [Default Evaluator](https://openmatch.dev/site/docs/tutorials/defaultevaluator/) by default, which will create non-conflicting matches by favoring the ones with a higher score determined by the `computeMatchScore()` function mentioned above. These weights can be increased/decreased to favor optimal ticket age, ping, or player count respectively.

### Creating a custom match function

While you can directly modify the `default.ts` match function, you can also implement a completely different one to prevent your changes from being overwritten during backend updates. To do this, create a new TypeScript file in `RedwoodBackend/packages/match-function/src/match-functions/` (e.g. `my-match-function.ts`), and add a default export of a class that implements the `IMatchInterface` interface:

``` typescript
export default class MyMatchFunctionMatchFunction implements IMatchFunction {
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

Match functions have a lot of details and hard to properly document without confusing you; the best way to understand how to write one is to heavily reference/copy the `default.ts` match function included with Redwood.

### Configuring your custom match function

To use your custom match function, you need to update the `ticketing.matchmaking.open-match.match-function.name` configuration variable to match the name of your match function file (without the `.ts` extension). For example, if you created a `my-match-function.ts` file, you would set the configuration variable to `my-match-function`.

### Packaging your custom match function

To create a binary for your custom match function, you can run the following commands:

``` bash
yarn build
yarn pkg:match-function
```
