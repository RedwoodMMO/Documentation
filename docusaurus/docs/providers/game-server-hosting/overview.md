---
sidebar_position: 1
sidebar_label: Overview
---

# Game Server Hosting Providers

Most of the backend microservices are hosted in a Kubernetes cluster alongside each other. However, Redwood gives you more flexibility on where the game servers are hosted with a couple options.

- [**Local**](./local.md) - Used in development when not using Kubernetes; these game servers are self-hosted by executing a process on your machine, enabling the fastest iteration time
- [**Agones**](./agones.md) - The game servers are self-hosted in the same Kubernetes cluster as the backend microservices
- [**Hathora**](./hathora.md) - The game servers are hosted by a third party on-demand service called Hathora

In the linked pages above, we cover the specifics of using each option, but here is a summary of when to choose each option.

## How to specify which provider is used?

The [Realm Instance Config](../../configuration/realm-instance-config.md) variable `game-servers.provider` takes a string enum, which can be `local`, `agones`, or `hathora`. You can see the default defined as `local` in `RedwoodBackend/config/node/default/realm/instances/default.yaml`.

Our `kubernetes` [inheritable config environment](../../configuration/overview.md#config-environment-inheritance) overrides this variable for you to `agones` in `RedwoodBackend/config/node/kubernetes/realm/instances/default.yaml`.

You can [override this variable](../../configuration/overview.md#customization) yourself in your own config environment.

## Which should I use in production?

This depends on the style of your game, the number of concurrent players (CCUs) you want to support, and budget. There isn't a single best answer for this, but we've outlined some of the pros/cons for you by whether you're building [Persistent World Games](#persistent-world-games) or [Ephemeral Match-based Games](#ephemeral-match-based-games).

### Persistent World Games

Games with persistent worlds have different metrics than ephemeral matches. Traditionally they're live 24/7, causing on-demand services to be relatively more expensive. Using self-hosting solutions like [**Agones**](./agones.md) start to make more sense.

We plan to do a more detailed evaluation to assess your options financially-speaking, but for now Agones is the recommended path.

With that said, Redwood's lobby system has the concept of Proxies which can appear live to players with no running server instances to back them; the goal with this design is to eventually allow low-CCU persistent games to appear to be live 24/7 in every region but only run servers when there are players. We're still working on this, but it can really help out new releases to launch playtests without much financial investment.

### Ephemeral Match-based Games

[**Agones**](./agones.md) is cost effective at larger scales because you are paying the cloud provider directly and the cost of the extra overhead is relatively minimal. However, if your target CCUs are low enough, Agones becomes cost prohibitive to support several regions:
- Using Agones will require you to run a Kubernetes cluster in every region you want to support. This means you'll need to run at least a "lite" version of the Realm backend to connect the sidecars to the central Realm backend in addition to the game servers in each cluster.
- Agones requires at least 1 "warm server" for every cluster it runs in. This means you'll always have 1 idling game server waiting for players to join it. At smaller scales, this can be wasteful as you may be paying to run 4-10 game servers (1 for each region) 24/7 that are only occupied a few hours a day, if at all.

However, Agones is much more convenient for testing matches on your development machine in a Kubernetes environment as it doesn't require extra port forwarding. We primarily use the [Local](./local.md) or [Agones](./agones.md) providers depending if we're running Kubernetes or not for faster iteration.

---

[**Hathora**](./hathora.md) is an on-demand hosting solution for ephemeral games. You only pay for game servers that have players in them, and you don't have to wait very long for the servers to spin up. Hathora has several regions across the world and the pricing options are very competitive. You'll pay a little bit more than self-hosting via Agones when strictly comparing cost of CPU-minutes and bandwidth, but you'll likely need *thousands of matches per month* to justify the overhead of using Agones. Hathora is an awesome option for:
- Testing games in development
- Running playtests
- Alphas/betas
- Even during launch depending on the scale of your game

:::info
We use Hathora to host the live demos of our [Gameplay Templates](https://redwoodmmo.com/gameplay-templates)!
:::
