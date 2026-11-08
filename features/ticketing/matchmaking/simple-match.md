---
sidebar_position: 1
---

# Simple Match

The `simple-match` provider is a dead-simple matchmaker that is useful in development to emulates the [Open Match](./open-match.md) provider. This provider was built when the `dev-initiator` was created as a stub since Open Match requires Linux/Kubernetes. It uses the same `game.ticketing-profiles` config variable as Open Match and also makes shallow matches after `ticketing.matchmaking-max-wait-until-make-shallow-match-ms` elapses.

If you're curious about the implementation, the majority of the logic can be found in `RedwoodBackend/packages/realm-backend/src/ticketing/matchmaking/index.ts` and search for `TicketingProvider.SimpleMatch` (primarily see the implementation under the `fetchPotentialMatches` function).

:::warning
Simple Match **was not** developed with scalability in mind; while it may suffice in staging/demo environments, we **don't recommend using it in production** environments that need to scale.
:::

## Configuration

See the [common matchmaking config variables](./open-match.md#common) in the Open Match section.
