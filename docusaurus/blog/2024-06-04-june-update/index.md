---
slug: june-2024-update
title: June 2024 Development Update
authors: [mike]
tags: [development update, news]
---

Hello again! Looks like we missed an update last month, so we'll have to double up this month! Our top priority still is getting baseline MMORPG support implemented:

- [Finished multi-realm support](./index.md#multiple-realm-support)
- [Added sharding support](./index.md#shardingchannel-support)
- [Increased scalability of backend services](./index.md#increased-backend-scalability)
- [Added Idem support](./index.md#idem-support)
- [Improved deployment process](./index.md#improved-deployment-process)

<!--truncate-->

If you want to get notified of these updates, [subscribe to our newsletter](https://redwoodmmo.com/#signup).

## Multiple Realm Support

In our [last update](../2024-04-02-april-update/index.md#multiple-realm-support) we talked about a refactor to add multiple realms. As all refactors go, they take longer than you expect. Regardless, we've completed multiple realm support, along with making it easier to deploy multiple Kubernetes clusters. Generally speaking, there are two reasons to split up your servers into multiple realms:
1. **Data separation**
    - Realms have a database table `PlayerCharacter` which represents all the data about a particular character. By default, that character can be used only in that realm. If you want to have characters separated for PvP and PvE game modes, you might have a realm for PvP servers and another for PvE servers.
2. **Data colocation**
    - RPGs have a lot of data being changed, primarily player inventory, skills, achievements, etc. all need to be persisted outside of the game server somewhat frequently. Each realm has a database where the data gets written to; where that database physically exists is up to you, but it's encouraged to keep it as close to your game servers as possible. Having multiple realms hosted across the globe near the game servers can alleviate data latency issues.

:::info
It's not required to have multiple Redwood realms simply to have multiple worlds available to the player. You can have a single realm host a PvP world, a PvE world, a completely different map, etc. Deciding to have another Redwood realm is purely about whether or not you need an extra deployment of the backend services and database.

You also don't need multiple Redwood realms simply because of increased active players. All of the microservices [now scale as much as you need](#increased-backend-scalability).
:::

## Sharding/Channel Support

There are lots of different terms when it comes to sharding and instancing, and honestly, they're confusing. Ultimately, the goal is to split up a virtual world/map into several Unreal game server instances to increase total player capacity (this is called horizontal scaling). Here's how Redwood now supports this functionality:

- A `GameServerProxy` is a virtual representation of a virtual world; it can be split up into 1 or more `zones`.
    - How those zones are split up are up on the world map to you; they can be rectangular, hex, some abstract shape; it doesn't matter as the delineation between zones is determined how you design the map/game server.
    - We provide some tools to help you design your zones in Unreal; generally speaking, as players want to get from one zone to the other, Redwood handles the transition to get to the new zone.
- Each `GameServerProxy` can have 1 or more `layers`. Each layer has a running Unreal game server instance for **each** of the defined `zones`.
    - Layers, sometimes called "instances" and "shards" by the gaming community, add another dimension of scaling. If your map has 4 zones (A, B, C, and D), you can configure Redwood to boot up a new layer after the initial layer has a certain number of players in it. The new layer will also have zones A, B, C, and D. This scaling can continue to happen based on the number of active players.
    - World data is stored in the `GameServerProxy` so new layers will be initialized with the same data, map, and game mode.
    - Redwood doesn't currently support world data syncing between layers (e.g. chopping a tree in layer 1, zone A will not show up in layer 2, zone A).
    - Redwood also doesn't currently support only having some zones active on some layers. If you need to have particular regions scale differently, consider having multiple zones for the same location on the map or split up an highly populated area into several smaller zones.
- Redwood calls a particular zone/layer combination (e.g. layer 1, zone A) a `channel`, which always has a 1-to-1 relationship with an active Unreal game server instance.

## Increased Backend Scalability

Some of the backend services still had functionality that wasn't horizontally scalable. Those functions and data have been refactored to use Redis appropriately to make it so that each backend microservice will properly scale up and down.

We also moved the ticketing functionality to it's own microservice instead of it being split between the Realm backend and frontend services. Ticketing handles matchmaking and queuing, and this change enables more advanced scenarios (i.e. use queuing for the persistent MMORPG but use matchmaking for instanced dungeons/raids).

## Idem Support

[Idem](https://idem.gg) provides matchmaking as a service, which can be helpful for those that would rather have a 3rd party service handle the matchmaking instead of tuning [Open Match](/docs/providers/ticketing/open-match).

We've added support to quickly change the configuration to use the new [Idem Ticketing provider](/docs/providers/ticketing/idem)!

## Improved Deployment Process

While most people think the deployment process as a whole is boring, it's critical for it to be painless and flexible. There's nothing worse than being the last person of a long chain of events to ship the late release; having a team of execs yelling at you because a tool failed on you and the release needs to wait a day, let alone an hour, is just unacceptable. We get it, and we continue to strive to make this process as easy for you as possible, ideally completely automated via [CI/CD (Continuous Integration/Continuous Deployment)](https://wikipedia.org/wiki/CI/CD).

While [re-releasing the shooter template demo](../2024-04-02-april-update/index.md#shooter-template-re-release), we've been improving these tools, scripts, and processes to make our lives easier, which should also make your life easier:

- Building, tagging, and pushing production Docker images now has a simple `yarn docker <config-environment>` command
- Using the Pulumi deployment scripts used to be cumbersome with extra config and odd commands; we've simplified this to just running `yarn deploy <config-environment>`

We envision that your CI will periodically build Docker images with `yarn docker` which you could test with staging environments with `yarn deploy` before eventually promoting a set of images/config to production.

## Looking Ahead

Once we finish [tweaking our deployment processes](#improved-deployment-process) and get the demo of the [shooter template re-released](../2024-04-02-april-update/index.md#shooter-template-re-release), we'll push out an update and focus on dogfooding the new RPG support for a minimally viable MMORPG template. We've temporarily paused development on large player counts per Unreal game server instance until the core support for RPG titles is ready for you to use.
