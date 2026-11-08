---
sidebar_position: 1
sidebar_label: Overview
---

# Architecture Overview

Briefly, the backend consists of one lightweight [Director](#director) that players connect to when they launch the game. The Director then can direct the player to one or more [Realms](#realms) that handle most of the backend logic for a multiplayer game/title. Many titles will only have one Realm with little persistent game data other than player character progression; you'll typically find this in match-based games or "single virtual world" RPGs. When there are multiple Realms, the Director handles authenticity of the Realms by checking the Director's database against an authentication request from the Realm services.

Here's every service that makes up a Redwood deployment:

| Service | Part of | What it does |
| --- | --- | --- |
| Director Frontend | [Director](#director) | Player-facing: authentication, realm list, friends, guilds, global data |
| Director Backend | [Director](#director) | Backend-initiated Director work: realm authentication, reports from realms, the admin user |
| Director Gateway | [Gateways](#realm-director-gateway) | Lets Director services reach realms (and the players connected to them) without knowing how each realm is scaled |
| Realm Frontend | [Realm](#realms) | Player-facing: characters, servers/lobbies, ticketing requests, parties, contacts |
| Realm Backend | [Realm](#realms) | Game server management, talking to [Sidecars](#sidecar), persistence from game servers |
| Realm Gateway | [Gateways](#realm-director-gateway) | The realm's side of the Director/Realm gateway connection |
| Ticketing (director and workers) | [Realm](#realms) | [Ticketing](#ticketing): queues and matchmaking |
| Match Function | [Realm](#realms) | Scores matches for the [Open Match](#match-function) matchmaking provider (only deployed when used) |
| Sidecar | Each game server | Bridge between an Unreal game server and its Realm |

In development, the [Dev Initiator](../getting-started/running-with-backend.md) runs all of these (except the Match Function, unless a realm uses Open Match) in a single Node.js process. In Kubernetes, each is its own deployment that can be scaled independently.

## Frontend vs Backend

:::info
When we use the term `Redwood backend`, we're talking about all of the microservices as a whole as it's the "backend for the title".

However, when we use the terms `Director Backend` or `Realm Backend`, that applies to this section.
:::

To enable more flexible horizontal scalability, both the [Director](#director) and the [Realm](#realms) are split into two microservices: the **Frontend** and the **Backend**.

The Director/Realm **Frontend** is used for functionality that directly interfaces with a player. Player authentication, matchmaking requests, and listing their own characters are all queries the player makes to a **Frontend** service.

Conversely the Director/Realm **Backend** is used for functionality that is initiated by the backend itself. This includes processing match allocation, interfacing with the [Sidecar](#sidecar), etc.

Both have connections to the corresponding database (i.e. the Director Backend and Director Frontend both have connections to the Director database), and the separation is primarily focused on different scalability needs as well as some separation of attack vectors for security purposes.

:::note
The **[Sidecar](#sidecar)**, **[Ticketing](#ticketing)**, and **[Match Function](#match-function)** don't have separate frontend/backend services as they operate completely in the backend.
:::

## Director

For an instance of the Redwood backend, there is only one Director (though it can be horizontally scaled with more replicas). It's common to think that for each title you have an instance of the Redwood backend, and therefore one Director per title.

The Director is quite simple; it handles:
- Player authentication and identity (the [PlayerIdentity](../features/data/game/player-data.md#playeridentity))
- [Realm](#realms) authentication and management
- Features that span realms: [friends](../features/social/friends.md), [guilds and alliances](../features/social/guilds-alliances.md), and [global data](../features/data/game/global-data.md)

However, the Director serves as an important central point for both players and Realms.

## Realms

There can be many Realms for an instance of the Redwood backend. Realms are hosted by the studio, either in the same Kubernetes cluster as the Director or in other clusters (e.g. one per geographic region).

Realms handle most of the backend functions:
- Player characters and their associated meta and game data (the [PlayerCharacter](../features/data/game/player-data.md#playercharacter))
- [Ticketing](#ticketing)
- Managing game servers ([GameServerProxies, GameServerCollections, and GameServerInstances](./game-servers.md))
- [Parties](../features/social/parties.md) and [realm contacts](../features/social/realm-contacts.md)

Each realm is configured by its own [Realm Instance Config](../configuration/realm-instance-config.md).

## Realm Director Gateway

The Director sometimes needs to talk to a realm, or to players connected to a realm (e.g. for features like guilds and friends that span realms). Because a realm's player connections are spread across however many Realm Frontend replicas it has, the Director shouldn't have to know which replica holds which player.

The **gateways** solve this: each realm runs a Realm Gateway that connects to the Director Gateway, and the Director services send realm-bound messages through the Director Gateway, which forwards them to the right realm. The Director services authenticate with the Director Gateway using the `director.gateway.secret` config variable, and a realm's gateway can be turned off with its `gateway.enabled` variable.

## Ticketing

The Ticketing service is part of the realm, but it scales independently from the Realm Backend and Frontend services. Ticketing is the generic term for all methods of processing requests from the player to join a session without specifying the specific server to connect to. Redwood provides ticketing providers for both queueing and matchmaking, but you can also build your own [custom ticketing](../features/ticketing/custom.md) logic.

The Ticketing service has two modes of execution: director (not to be confused with the [Director](#director)) and worker. Scaling up the Realm Instance Config `ticketing.replicas` will set the number of workers, but there will always be only one Ticketing director. There must be at least one worker for the Ticketing service to function.

## Sidecar

Each Unreal game server has a corresponding Node.js Sidecar. In Kubernetes they run in the same container (the sidecar starts and manages the Unreal process); with the Dev Initiator, the sidecars run inside the Dev Initiator process and start Unreal as a child process. The sidecar handles the interaction with the [Realm](#realms) (e.g. getting/setting player/Realm data, receiving commands to load a map/mode when a match is allocated, providing lifecycle updates of the game server to the rest of the Redwood backend).

:::note
These are not to be confused with sidecars in service meshes; these sidecars follow a similar design philosophy but have no relationship to service meshes.
:::

The Sidecar abstracts implementation details away from the Unreal server process, making it easier for the development of the Redwood backend to be separate from the development of the Unreal game as they only share an interface of messages. Decoupling this logic makes it easier to test gameplay without running the Redwood backend as well as simulating backend data.

## Match Function

The [Match Function](https://openmatch.dev/site/docs/guides/matchmaker/matchfunction/) is a service that is invoked by the included [Open Match](https://openmatch.dev) matchmaker. This determines how to score potential matches given the pools of matchmaking requests. Open Match takes these match proposals and assesses them through the evaluator (currently just the default Open Match evaluator) to determine which proposals become assigned matches.

:::note
The Match Function is only deployed/used when the Realm Instance Config `ticketing.matchmaking.provider` is set to `open-match`. The default `simple-match` provider runs inside the Ticketing service instead.
:::

## Player Flow

This is the typical flow of a player from launching the game client to playing on a game server. The [Building the Main Menu](../getting-started/building-the-main-menu.md) guide covers the same flow from the Unreal side.

1. The client connects to the **Director Frontend** with Socket.IO (websockets)
1. The player registers and/or logs in (Director Frontend, using the Director database). The Director returns an auth token the client uses to automatically log back in if the connection drops.
1. The player asks the Director Frontend for the list of Realms and chooses one
1. The client connects to the Realm:
   1. It asks the Director Frontend for a realm token, which the Director saves and returns along with the Realm Frontend URL
   1. It opens a second Socket.IO connection to the **Realm Frontend** (keeping its Director connection)
   1. It authenticates with the Realm Frontend using that token, which the Realm Frontend verifies with the Director
   1. The Realm Frontend sends the client the realm's regions so it can start measuring ping
1. The player lists, creates, and selects a character (Realm Frontend, using the Realm database)
1. The player asks to play:
   - **Matchmaking** or **queuing** creates a ticketing job (in Redis, using [BullMQ](https://bullmq.io/)) that a **Ticketing** worker picks up. Status updates are published over Redis and relayed to the player by the Realm Frontend.
   - **Joining or creating a GameServerProxy** directly goes through the Realm Frontend
1. When the player should join a server, the **Realm Backend** makes sure one is running (starting or allocating one through the [game server provider](../features/game-servers/hosting/overview.md) if needed; see `packages/realm-backend/src/game-servers/allocate.ts`), and the **Sidecar** tells the Unreal server which map and game mode to load
1. The player is given a new, one-time-use token tied to their [PlayerIdentity](../features/data/game/player-data.md#playeridentity), [PlayerCharacter](../features/data/game/player-data.md#playercharacter), and the [GameServerInstance](./game-servers.md#gameserverinstance). The Redwood plugin automatically runs `open <ip>:<port>?RedwoodAuth=1?PlayerId=...?CharacterId=...?Token=...`
1. When the Unreal server receives the login, it sends the token to its **Sidecar**, which forwards it to the **Realm Backend**. The Realm Backend checks (and consumes, to prevent replay attacks) the token and responds with the player's and character's data, or an error
1. If there was an error, the game server kicks the player. Otherwise the server applies the character data and spawns the player's pawn
1. From here, the client gets its game data through normal Unreal replication from the game server, including its own character data

:::note
It's safe to assume that, by default, all of the data the client receives after joining an Unreal game session comes from replication rather than from the Redwood backend. When you add your own features, try to keep data flowing through the Realm Backend, Sidecar, game server, and replication path when it makes sense; it lets you develop with [stubbed data](../getting-started/running-without-backend.md) without running the backend at all.
:::
