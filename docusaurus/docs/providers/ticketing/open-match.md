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

Both [Simple Match](./simple-match.md) and Open Match providers share some common matchmaking config variables. You can find these in `RedwoodBackend/config/node/default/ticketing/match-making/_index.yaml`, but here's a brief overview of each of them:

|Name|Description|
|-|-|
|`ticket-stale-time-ms`|The amount of time in milliseconds to wait before considering a ticket stale if it can't find a match beforehand. The client is told that the ticket went stale and they should try again later.|
|`max-match-age-ms`|The amount of time in milliseconds to wait before considering a found match to be stale if a server can't be allocated/initialized beforehand. This rarely should happen, but if there's issues with the hosting provider a server may not come up. This is a catch all. Clients are notified when this happens and tickets are re-entered into the ticket pool.|
|`max-wait-until-make-shallow-match-ms`|The amount of time in milliseconds to wait before making a shallow (aka not full) match. The time is based off the oldest ticket in the viable match.|

### Open Match Specific

You can configure the endpoints for the various Open Match backend services, but you should generally let Redwood configure these for you. Primarily, the main configuration variables you can specify are the scoring weights:

``` yaml
ticketing:
  match-making:
    open-match:
      match-function:
        # Equal numbers means equal preference, increase a number to favor it more
        scoring-weights:
          age: 1
          ping: 1
          players: 1
```

These are unitless weights when computing a potential match's score. Redwood uses the [Default Evaluator](https://openmatch.dev/site/docs/tutorials/defaultevaluator/) by default, which will create non-conflicting matches by favoring the ones with a higher score determined by the `computeMatchScore()` function mentioned above. These weights can be increased/decreased to favor optimal ticket age, ping, or player count respectively.
