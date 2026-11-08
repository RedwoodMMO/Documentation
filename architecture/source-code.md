---
sidebar_position: 5
---

# Modifying the Source Code

We're happy to answer any basic questions via [Discord](https://discord.gg/Gj23MHhCQR), but if you need more help, [reach out](https://redwoodmmo.com/contact) to purchase premium support. Royalty-free licensees get a limited amount of free premium support!

## Overview

Here's an overview of what everything does in the source tree:

- `config/`
  - `docker/`: Dockerfile images used by Redwood
    - `game-server/`: Dockerfile/.dockerignore for the packaged Linux game servers
    - `redwood-chisel/`: Dockerfile to generate the [`redwoodmmo/redwood-base`](https://hub.docker.com/r/redwoodmmo/redwood-base) image used as a base image for `redwood-prod/`
    - `redwood-dev/`: Dockerfile/.dockerignore for non `staging`/`production` Kubernetes environments, which uses source TS rather than a bundled image
    - `redwood-prod/`: Dockerfile/.dockerignore for `staging`/`production` Kubernetes environments, which uses a bundled image for the microservices
  - `node/`: The default Redwood configurations; you can place your custom config-env here or [pick a custom location](../configuration/overview.md#custom-folder-location)

    - `cloud-do/`: Config env for DigitalOcean deployment (inherits from `default`)
    - `default/`: The default config env
    - `kubernetes/`: Config env for all Kubernetes deployments (inherits from `default`)
    - `production/`: Config env for all production deployments (inherits from `staging`)
    - `staging/`: Config env for all environments that emulate production, but don't need some production features (e.g. not using an externally managed DB); this is used if you want to test a production environment on your local Kubernetes cluster (inherits from `kubernetes`)
    - `standard/`: Config env that all closed-source/Standard Licenses should inherit from (inherits from `default`)
    - `test-memurai/`: Config env for `yarn test` but using a Memurai Redis server to mimic Kubernetes environments (inherits from `test`)
    - `test-mocks/`: Config env used for running the mocked tests in RedwoodPlugins (inherits from `test`)
    - `test-standard/`: Config env for `yarn test` but using bundled (inherits from `test`, then `standard`)
    - `test/`: Config env for `yarn test` using a stubbed Redis implementation (similar to the `dev-initiator`, inherits from `default`)
    - `environment.yaml`: Currently unused, but an optional file that can be used to inject environment variables into a process using one of these config environments. You must use the `config-env` script found at `node_modules/.bin/config-env`. The syntax of the file would be something like this:

      ```yaml
      DATABASE_HOST_ENV_VAR: "director.persistence.database.runtime-access.host"
      ```

- `dist/`: The directory where outputs are stored (including the microservice bundled images), nothing should really be committed here other than `game-servers/.gitignore` to keep the directory around
- `packages/`: Where all the source is; each directory is a [Yarn Workspace](https://yarnpkg.com/features/workspaces)
  - `cli/`: All of the CLI interfaces (e.g. `yarn cli <command> --arg`)
  - `common/`: Various utilities and types used by the Redwood services
  - `core-runner/`: When we bundle up Redwood as executables for staging & production environments, several microservice share a lot of code. To save on space and extra operations, we bundle these into a single executable & Docker image. This package is the binary entrypoint for running those services in staging & production environments.
  - `deployment/`: Docker and Pulumi deployment scripts/Infrastructure-as-Code
  - `dev-game-server/`: A wrapper used when you're using the `local` game server provider (aka via the `dev-initiator`) as well as the stubbed servers for `yarn test`
  - `dev-initiator/`: What runs when you call `yarn dev <config-env>` or `./dev-initiator-<os> <config-env>`, an application that bootstraps all of the microservices **under one process** using ts-node, which prevents us from compiling source each time we restart the dev-initiator
  - `director-backend/`: The [Backend](../architecture/overview.md#frontend-vs-backend) for the [Director](../architecture/overview.md#director).
  - `director-frontend/`: The [Frontend](../architecture/overview.md#frontend-vs-backend) for the [Director](../architecture/overview.md#director).
  - `match-function/`: The Match Function is a service used for the [Open Match](../features/ticketing/matchmaking/open-match.md) matchmaking provider to evaluate matchmaking requests figure out which players should be put into a match.
  - `persistence/`: This isn't a microservice itself, but it stores the database schema, migrations, and utility functions used by other services.
  - `realm-backend/`: The [Backend](../architecture/overview.md#frontend-vs-backend) for the [Realm](../architecture/overview.md#realm).
  - `realm-frontend/`: The [Frontend](../architecture/overview.md#frontend-vs-backend) for the [Realm](../architecture/overview.md#realm).
  - `sidecar/`: This is the [Sidecar](../architecture/overview.md#sidecar) service that runs in tandem every game server. It acts as a bridge between the backend and the game server. It communicates to the associated Realm Backend.
  - `tests/`: This package is used to store all of our automated tests.
  - `ticketing/`: [Ticketing](../features/ticketing/overview.md) runs a "director" (aka master) service and multiple "worker" services to handle queueing and matchmaking.
  - `tsconfig.json`: `yarn build` in the root references this `tsconfig.json`
  - `tsconfig.standard.json`: A modified `tsconfig.json` that we use to distribute the closed-source version; you can ignore this file
- `scripts/`: some helper JS scripts
- `types/`: supplemental types for dependencies that have missing or incorrect typings

## Typical Player Flow

This is the general flow of how players get into servers:

1. Players connect to the Director Frontend via Socket.io/WebSockets
1. Players authenticate with the Director Frontend
1. Players ask the Director Frontend to list available Realms
1. Players request to connect to a Realm
   1. First they make a request to the Director Frontend, which saves & responds with an auth token and Realm Frontend URL
   1. Then they connect to the Realm Frontend via Socket.io/WebSockets (maintaining connection to the Director Frontend)
   1. They authenticate with the Realm Frontend using the auth token
   1. The Realm Frontend verifies the token with the Director Frontend
1. Players ask the Realm Frontend to list GameServerProxies (via `ListProxies`) or enter matchmaking
   - If they called `ListProxies`, they can then join them with `JoinQueue`
   - Players can also call `CreateProxy` to have the backend start a proxy with various parameters, optionally keeping it private and/or password protected
1. When they join matchmaking, create proxy, or join a queue, the Realm Frontend creates a Ticketing Join "job" in Redis using [BullMQ](https://bullmq.io/)
1. A Ticketing Worker service picks up the job, processes it based on the Ticketing config
1. If/when the player should join a proxy (including intermediate updates), a Redis message is published via 2 channels (ticket update and join proxy)
1. The Realm Frontend subscribes to these Redis channels, and if it has a connection with the player, relays the information
1. The RedwoodCore UE plugin automatically subscribes for the event to join a proxy and runs an `open` console command to automatically join the GameServerInstance
1. If/when servers need to be started, the Realm Backend handles most of this logic; see `packages/realm-backend/src/game-servers/allocate.ts`
   - There is quite a complex flow for server initialization, retry logic, etc. If you need help understanding this, reach out about purchasing premium support. Most of this will happen between the Realm Backend ⇔ Sidecar ⇔ Game Server (via the Redwood Core UE plugin).
1. When the player is told to join a GameServerInstance, it's given a new, one-time-use auth token that's tied to the [PlayerIdentity](../features/data/game/player-data.md#playeridentity) ID, [PlayerCharacter](../features/data/game/player-data.md#playercharacter) ID, and the [GameServerInstance](../architecture/game-servers.md#gameserverinstance) ID.
1. The `open` console command will include the playerId, characterId, and token as variables, which the game server will use to ask the Sidecar to get the associated PlayerCharacter data
1. The Sidecar forwards this message to the Realm Backend
1. The Realm Backend verifies the token, and if it is provides the character data (or null & error if not) to the Sidecar
1. The Sidecar forwards the response to the game server
1. If there was an error, the game server will kick the player

## Interservice Communication

Services communicate with each other using Socket.io/WebSockets and Redis pubsub channels. Redis is used for any fan out communication where the sender doesn't know the exact replica of the receiver it needs to send to. You can find the various Redis endpoints in `packages/common/src/redis.ts`. See [below](#api) about the Socket.io endpoints.

For Socket.io connections:

- Game server (via the RedwoodCore UE plugin) connects to the Sidecar and doesn't use any Redis
- Sidecar connects to the Realm Backend for it's associated Realm and doesn't use any Redis
- Realm Backend connects to the Director Backend
- Realm Frontend connects to the Director Frontend
- Ticketing only uses Redis communications
- Match Function only uses HTTP methods via the Open Match API
- Player clients connect to the Director and Realm Frontends

## API

All API methods for all services can be found in `packages/common/src/interfaces.ts`. It's massive, and I've tried breaking it up, but it's the best dev experience I've found. We use [`yup`](https://npmjs.com/package/yup) for request validation. You'll find a common pattern:

```typescript
export namespace Namespace {
  export namespace Message {
    export type Type = RedwoodMessageType<IRequest, IResponse, typeof Name>;
    export const Name = "namespace:message";

    export const SRequest = object({
      // variables, usually with some id of who is requesting to be verified on the receiving service
    });
    export interface IRequest extends InferType<typeof SRequest> {}

    export const SResponse = object({
      error: string().defined(), // almost always defined; no error if empty string
      result1: string().nullable().defined(), // results are usually nullable().defined() and are null if there is an error
      result2: object(/**/).nullable().defined(),
    });
    export interface IResponse extends InferType<typeof SResponse> {}
  }
}
```

Defining the API here does nothing functionally, you will need to go to `packages/<the-receiving-service>/src/routes/`, find the appropriate location and add logic to listen to the new endpoint name. You'll see a common entrypoint in `packages/<the-receiving-service>/src/routes/index.ts`, but there are varying patterns used throughout based on the type of connection.

## New Service vs Modifying Existing

There isn't a right or wrong answer to how you add new functionality to the backend, but here are some thoughts about whether to write a new service/package or integrate into an existing one:

- If you're adding more endpoints for the clients to use directly, use the appropriate existing Frontend service.
- If you're adding something that purely operates in the backend, you can create a new service. That service can connect to another service via Socket.io/WebSockets (e.g. the Realm Backend) or use Redis to have a communication layer (see the Ticketing service for an example).
- Creating a new package/service does make it easier to handle upstream merge conflicts, but it's not always an ideal setup.
- If your feature is distinctly different than existing code, consider putting your code in a new package in `packages/` but you can still call exported functions from existing services. This would reduce the amount of potential merge conflicts while still having the code execute within the context of an existing service.
- Note that new services will need to be added to the `dev-initiator` and `deployment` packages. New Packages may need to be added to `packages/tsconfig.json`.

## Plugin System

Currently we do not have a plugin system. We're contemplating adding this in the future for source-code users to make modifications more streamlined.

## Horizontal Scalability

Keep in mind that other than the Sidecar, every other microservice should be able to scale horizontally with more replicas. This requires extra thought about how to architect things as you can't assume things like "the Director Frontend as a connection with every active player". This would simply not be true; there may be several instances of the Director Frontend running.

## Compiling, Packaging, and Testing

The Dev Initiator (`packages/dev-initiator`) uses [`ts-node`](https://npmjs.com/package/ts-node) to compile changes when it starts up. You will have to restart the Dev Initiator for changes to take place, and there's no file watching functionality to automatically do this. Just run `yarn dev <config-env>` or use one of the provided `.vscode/launch.json` **Launch Initiator:** configs (obviously modifying) to debug the dev-initiator in Visual Studio Code (**recommended**).

If you just want to test compilation without running, you can run an actual compile of all services with `yarn build`.

To package/bundle executables of the services run `yarn pkg`.

To run the automated tests, run `yarn test`. You can also debug the automated tests with the included `.vscode/launch.json` **Run Tests** VSCode launch config.

## Deployment

We use [Pulumi](https://pulumi.com) as the deployment tool for our Infrastructure-as-Code (IaC). You can find all the Pulumi code in `packages/deployment`. You should only need to modify these if you're adding a new microservice, which we've written the code to be fairly easy to do that. See `packages/deployment/src/redwood/redwood.ts` for an entrypoint of deploying Redwood services; you'll see the Director and Realms being deployed, and those respective classes will deploy the Backend/Frontend.
