---
sidebar_position: 1
sidebar_label: Overview
---

# Ticketing Providers

Ticketing is the term Redwood uses for how players queue into getting into a server. Redwood currently supports the below providers:

- Matchmaking
  - [**Simple Match**](./simple-match.md) - A dead-simple emulator for Open Match used in development without Kubernetes; shares some config with Open Match
  - [**Open Match**](./open-match.md) - An open-source, flexible, and scalable matchmaker
  - [**Idem**](./idem.md) (in development) - A quick and easy matchmaking service for a painless alternative to configuring Open Match
- [**Queue**](./queue.md) - Not part of the "matchmaking" umbrella like Simple/Open Match providers; this is used in for lobby-based systems where players already know what server they want to join, but it may be full (i.e. MMORPGs). This provider implements a FIFO (First-In-First-Out) queue system.

## How to specify which provider is used?

It's possible for you to run one of the matchmaking providers along with the `queue` provider. `ticketing.queue.enabled` and `ticketing.matchmaking.enabled` (both `true` by default) decide whether or not either run. An example of needing both is an open world MMORPG that has instanced dungeons; the overworld would use the queue provider while the instanced dungeons would use matchmaking.

You can configure which of the matchmaking providers using the config variable `ticketing.matchmaking.provider`. This takes a string enum, which can be `simple-match`, `open-match`, or `idem-match`. You can see the default defined as `simple-match` in `RedwoodBackend/config/node/default/ticketing/_index.yaml`.

Our `kubernetes` [inheritable config environment](../../configuration/overview.md#config-environment-inheritance) overrides this variable for you to `open-match` in `RedwoodBackend/config/node/kubernetes/ticketing/_index.yaml`.

You can [override this variable](../../configuration/overview.md#customization) yourself in your own config environment.

## Which should I use in production?

If you need to match players by region, skill, class, type of game mode, etc. use Open Match or Idem. If the player is only going to see a list of realms to join that may reach capacity, and you want to have a wait list, use Queue.

You may also need to implement your own ticketing provider for your specific game; if you have a Premium Support subscription, [reach out](../../support/how-to-get-support.md) and we'll help discuss your options!

## Common Configuration

The only common config variable for all ticketing providers is how often the ticketing function processes. You can override the `ticketing.process-interval` flag which specifies the number of milliseconds to wait until processing ticketing again. It defaults to 5 seconds.
