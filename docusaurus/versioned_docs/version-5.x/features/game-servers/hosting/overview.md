---
sidebar_position: 1
sidebar_label: Overview
---

# Game Server Hosting Providers

Most of the backend microservices are hosted in a Kubernetes cluster alongside each other. However, Redwood gives you more flexibility on where the game servers are hosted with a couple options.

- [**Local**](./local.md) - Used in development when not using Kubernetes; these game servers are self-hosted by executing a process on your machine, enabling the fastest iteration time
- [**Agones**](./agones.md) - The game servers are self-hosted in the same Kubernetes cluster as the backend microservices
- [**Edgegap**](./edgegap.md) - Edgegap provides on-demand game server hosting with the option of bare-metal fleets

There's also a development-only provider, [**Dev Debug**](./local.md#dev-debug-provider), which doesn't start any server process and instead lets you run the game server in Play-In-Editor so you can debug it.

In the linked pages above, we cover the specifics of using each option, but here is a summary of when to choose each option.

## How to specify which provider is used?

The [Realm Instance Config](../../../configuration/realm-instance-config.md) variable `game-servers.provider` takes a string enum, which can be `local`, `agones`, `edgegap`, or `dev-debug` (there's also a `stub` provider that Redwood's automated tests use). You can see the default defined as `local` in `RedwoodBackend/config/node/default/realm/instances/redwoodBase.yaml`.

Our `kubernetes` [inheritable config environment](../../../configuration/overview.md#config-environment-inheritance) overrides this variable for you to `agones` in `RedwoodBackend/config/node/kubernetes/realm/instances/default.yaml`.

You can [override this variable](../../../configuration/overview.md#customization) yourself in your own config environment.

You can also override the provider for a specific [game profile](../../../configuration/game-modes-and-maps.md#profiles) (with `game-servers` on the profile) or a specific zone (with `gameServers` inside the zone), for example to run an event zone on Edgegap while the rest of the world runs on Agones. See the [game config reference](../../../configuration/reference/game.md) for details.

## Which should I use in production?

This depends on the style of your game, the number of concurrent players (CCUs) you want to support, and budget. There isn't a single best answer for this, but we've outlined some of the pros/cons for you by whether you're building [Persistent World Games](#persistent-world-games) or [Ephemeral Match-based Games](#ephemeral-match-based-games).

### Persistent World Games

Games with persistent worlds have different metrics than ephemeral matches. Traditionally they're live 24/7, causing on-demand services to be relatively more expensive. Using self-hosting solutions like [**Agones**](./agones.md) start to make more sense.

We plan to do a more detailed evaluation to assess your options financially-speaking, but for now Agones is the recommended path.

With that said, Redwood's [GameServerProxies](../../../architecture/game-servers.md#gameserverproxy) can appear live to players with no running server instances behind them. Joining a proxy whose servers aren't running starts them, so low-CCU persistent games can appear to be available 24/7 while only running servers when there are players (pair this with `num-minutes-to-destroy-empty-shard` and a proxy that doesn't end when its servers stop). This can really help new releases run playtests without much financial investment.

### Ephemeral Match-based Games

[**Agones**](./agones.md) is cost effective at larger scales because you are paying the cloud provider directly and the cost of the extra overhead is relatively minimal. However, if your target CCUs are low enough, Agones becomes cost prohibitive to support several regions:
- Using Agones will require you to run a Kubernetes cluster in every region you want to support. This means you'll need to run at least a "lite" version of the Realm backend to connect the sidecars to the central Realm backend in addition to the game servers in each cluster.
- Agones requires at least 1 "warm server" for every cluster it runs in. This means you'll always have 1 idling game server waiting for players to join it. At smaller scales, this can be wasteful as you may be paying to run 4-10 game servers (1 for each region) 24/7 that are only occupied a few hours a day, if at all.

However, Agones is much more convenient for testing matches on your development machine in a Kubernetes environment as it doesn't require extra port forwarding. We primarily use the [Local](./local.md) or [Agones](./agones.md) providers depending if we're running Kubernetes or not for faster iteration.

---

[**Edgegap**](./edgegap.md) is an on-demand hosting solution for ephemeral games. You only pay for game servers that have players in them, and you don't have to wait very long for the servers to spin up unless you prepay for Private Fleets. Edgegap has locations across the world, and a single realm can use all of them (Redwood uses Edgegap's location beacons as the realm's regions), whereas Agones uses one region per Kubernetes cluster.

Note that [cross-server Sync Items](../../sync-items.md) are disabled when using Edgegap (persistence still works).
