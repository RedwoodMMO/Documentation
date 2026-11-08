---
sidebar_position: 1
---

# Simple Match

The `simple-match` provider is a dead-simple matchmaker that is useful in development to emulate the [Open Match](./open-match.md) provider. It's the default provider, since Open Match requires Linux/Kubernetes and isn't available with the Dev Initiator. It uses the same [game profiles](../../../configuration/game-modes-and-maps.md#profiles) (`game.profiles`) as Open Match and also makes shallow (not full) matches after `ticketing.matchmaking.max-wait-until-make-shallow-match-ms` elapses.

How it matches:

- Tickets are grouped by game profile and region (in the order the regions are listed, using the regions each ticket accepts), filling each potential match up to `max-players-per-shard`.
- A match is made as soon as it has exactly `max-players-per-shard` players, or once its oldest ticket has waited `max-wait-until-make-shallow-match-ms` and it has at least `min-players-for-matchmaking` players.
- A party is a single ticket, so parties are always kept together in the same match.
- Ping isn't considered beyond the region list; there's no skill or other scoring.

If you're curious about the implementation, the logic lives in the ticketing package: `packages/ticketing/src/providers/simple-match.ts`, with the logic shared with Open Match in `packages/ticketing/src/providers/common-match.ts`.

:::warning
Simple Match **was not** developed with scalability in mind; while it may suffice in staging/demo environments, we **don't recommend using it in production** environments that need to scale.
:::

## Configuration

See the [common matchmaking config variables](./open-match.md#common) in the Open Match section. Profiles need both `matchmaking-zone-name` and `min-players-for-matchmaking` set to be used for matchmaking; profiles missing either are skipped (and an error is logged if players tried to matchmake into them).
