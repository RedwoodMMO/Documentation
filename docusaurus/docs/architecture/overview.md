---
sidebar_position: 1
sidebar_label: Overview
---

# Architecture Overview

Briefly, the backend consists of one lightweight [Director](#director) that players connect to when they launch the game. The Director then can direct the player to one or more [Realms](#realms) that handle most of the backend logic for a multiplayer game/title. Many titles will only have one Realm with little persistent game data other than player character progression; you'll typically find this in match-based games or "single virtual world" RPGs. When there are multiple Realms, the Director handles authenticity of the Realms by checking the Director's database against an authentication request from the Realm services.

## Frontend vs Backend

:::info
When we use the term `Redwood backend`, we're talking about all of the microservices as a whole as it's the "backend for the title".

However, when we use the terms `Director Backend` or `Realm Backend`, that applies to this section.
:::

To enable more flexible horizontal scalability, both the [Director](#director) and the [Realm](#realms) are split into two microservices: the **Frontend** and the **Backend**.

The Director/Realm **Frontend** is used for functionality that directly interfaces with a player. Player authentication, matchmaking requests, listing their own characters, are all queries the player makes to a **Frontend** service.

Conversely the Director/Realm **Backend** is used for functionality that is initiated by the backend itself. This includes processing the matchmaking, match allocation, interfacing with the [Sidecar](#sidecar), etc.

Both have connections to the corresponding database (i.e. the Director Backend and Director Frontend both have connections to the Director database), and the separation is primarily focused on different scalability needs as well as some separation of attack vectors for security purposes.

:::note
Both the **[Sidecar](#sidecar)** and **[Match Function](#match-function)** don't have separate frontend/backend services as they operate completely in the backend.
:::

## Director

For an instance of the Redwood backend, there is only one Director. It's common to think that for each title you have an instance of the Redwood backend, and therefore one Director per title.

The Director is quite simple; it only handles:
- Player authentication and identity
- [Realm](#realms) authentication and management

However, the Director serves as an important central point for both players and Realms.

## Realms

There can be many Realms for an instance of the Redwood backend. While we currently only support studio-hosted Realms, it's technically possible for players to host their own Realms as well.

Realms handle most of backend functions:
- Player characters and their associated meta and game data
- [Ticketing](#ticketing)
- Managing game servers

## Ticketing

The Ticketing service is part of the realm, but it scales independently from the Realm Backend and Frontend services. Ticketing is the generic term for all methods of processing requests from the player to join a session without specifying the specific lobby to connect to. Redwood provides ticketing providers for both queueing and matchmaking, but you can also build your own provider.

The Ticketing service has two modes of execution: director (not to be confused with the [Director](#director)) and worker. Scaling up the Realm Instance Config `ticketing.replicas` will set the number of workers, but there will always be only one Ticketing director. There must be at least one worker for the Ticketing service to function.

## Sidecar

Each Unreal game server has a corresponding NodeJS Sidecar. They run in the same container and handle the interaction with the [Realm](#realms) (e.g. getting/setting player/Realm data, receiving commands to load a map/mode when a match is allocated, providing lifecyle updates of the game server to the rest of the Redwood backend).

:::note
These are not to be confused withe sidecars in service meshes, these sidecars follow a similar design philosophy but have no relationship to service meshes.
:::

The Sidecar abstracts implementation details away from the Unreal server process, making it easier for the development of the Redwood backend to be separate from the development of the Unreal game as they only share an interface of messages. Decoupling this logic makes it easier to test gameplay without running the Redwood backend as well as simulating backend data.

## Match Function

The [Match Function](https://openmatch.dev/site/docs/guides/matchmaker/matchfunction/) is a service that is invoked by the included [Open Match](https://openmatch.dev) matchmaker. This determines how to score potential matches given the pools of matchmaking requests. Open Match takes these match proposals and assesses them through the evaluator (currently just the default Open Match evaluator) to determine which proposals become assigned matches.

:::note
The Match Function is only deployed/used when the Realm Instance Config `ticketing.provider` is set to `open-match`.
:::
