---
sidebar_position: 5
---

# Modifying the Source Code

We're happy to answer any basic questions via [Discord](https://discord.gg/Gj23MHhCQR), but if you need more help, [reach out](https://redwoodmmo.com/contact) to purchase premium support. Royalty-free licensees get a limited amount of free premium support!

## Overview

Here's an overview of what everything does in the source tree:

- `config/`
  - `docker/`: Dockerfile images used by Redwood
    - `ejabberd/`: Dockerfile for the [text chat](../features/social/text-chat.md) server image
    - `game-server/`: Dockerfile/.dockerignore for the packaged Linux game servers
    - `redwood-chisel/`: Dockerfile to generate the [`redwoodmmo/redwood-base`](https://hub.docker.com/r/redwoodmmo/redwood-base) image used as a base image for `redwood-prod/` and `game-server/`
    - `redwood-dev/`: Dockerfile/.dockerignore for non `staging`/`production` Kubernetes environments, which uses source TS rather than a bundled image
    - `redwood-prod/`: Dockerfile/.dockerignore for `staging`/`production` Kubernetes environments, which uses a bundled image for the microservices
  - `node/`: The default Redwood configurations; you can place your custom config-env here or [pick a custom location](../configuration/overview.md#custom-folder-location)

    - `default/`: The default config env
    - `kubernetes/`: Config env for all Kubernetes deployments (inherits from `default`)
    - `production/`: Config env for all production deployments (inherits from `staging`)
    - `simple-chat/`: Config env to inherit from when running [text chat](../features/social/text-chat.md) alongside the Dev Initiator (inherits from `default`)
    - `staging/`: Config env for all environments that emulate production, but don't need some production features (e.g. not using an externally managed DB); this is used if you want to test a production environment on your local Kubernetes cluster (inherits from `kubernetes`)
    - `standard/`: Config env that all closed-source/Standard Licenses should inherit from (inherits from `default`)
    - `test-memurai/`: Config env for `yarn test` but using a Memurai Redis server to mimic Kubernetes environments (inherits from `test`)
    - `test-mocks/`: Config env used for running the mocked tests in RedwoodPlugins (inherits from `test`)
    - `test-standard/`: Config env for `yarn test` but using bundled binaries (inherits from `test`, then `standard`)
    - `test/`: Config env for `yarn test` using a stubbed Redis implementation (similar to the `dev-initiator`, inherits from `default`)
    - `environment.yaml`: Currently unused, but an optional file that can be used to inject environment variables into a process using one of these config environments. You must use the `config-env` script found at `node_modules/.bin/config-env`. The syntax of the file would be something like this:

      ```yaml
      DATABASE_HOST_ENV_VAR: "director.persistence.database.runtime-access.host"
      ```

- `dist/`: The directory where outputs are stored (including the microservice bundled images), nothing should really be committed here other than `game-servers/.gitignore` to keep the directory around
- `packages/`: Where all the source is; each directory is a [Yarn Workspace](https://yarnpkg.com/features/workspaces)
  - `cli/`: All of the [CLI](../features/cli.md) commands (e.g. `yarn cli <command> --arg`)
  - `common/`: Various utilities and types used by the Redwood services
  - `core-runner/`: When we bundle up Redwood as executables for staging & production environments, several microservices share a lot of code. To save on space and extra operations, we bundle these into a single executable & Docker image. This package is the binary entrypoint for running those services in staging & production environments (e.g. `/app/app director-backend`).
  - `deployment/`: Docker and Pulumi deployment scripts/Infrastructure-as-Code
  - `dev-game-server/`: A wrapper used when you're using the `local` game server provider (aka via the `dev-initiator`) as well as the stubbed servers for `yarn test`
  - `dev-initiator/`: What runs when you call `yarn dev <config-env>` or `./dev-initiator-<os> <config-env>`, an application that bootstraps all of the microservices **under one process** using ts-node, which prevents us from compiling source each time we restart the dev-initiator
  - `director-backend/`: The [Backend](./overview.md#frontend-vs-backend) for the [Director](./overview.md#director).
  - `director-frontend/`: The [Frontend](./overview.md#frontend-vs-backend) for the [Director](./overview.md#director).
  - `match-function/`: The Match Function is a service used for the [Open Match](../features/ticketing/matchmaking/open-match.md) matchmaking provider to evaluate matchmaking requests and figure out which players should be put into a match.
  - `persistence/`: This isn't a microservice itself, but it stores the database schema, migrations, and utility functions used by other services.
  - `realm-backend/`: The [Backend](./overview.md#frontend-vs-backend) for the [Realm](./overview.md#realms).
  - `realm-director-gateway/`: The [Director Gateway and Realm Gateway](./overview.md#realm-director-gateway) services.
  - `realm-frontend/`: The [Frontend](./overview.md#frontend-vs-backend) for the [Realm](./overview.md#realms).
  - `sidecar/`: This is the [Sidecar](./overview.md#sidecar) service that runs in tandem with every game server. It acts as a bridge between the backend and the game server. It communicates with the associated Realm Backend.
  - `tests/`: This package is used to store all of our automated tests.
  - `ticketing/`: [Ticketing](../features/ticketing/overview.md) runs a "director" (aka master) service and multiple "worker" services to handle queueing and matchmaking.
  - `tsconfig.json`: `yarn build` in the root references this `tsconfig.json`
  - `tsconfig.standard.json`: A modified `tsconfig.json` that we use to distribute the closed-source version; you can ignore this file
- `scripts/`: some helper JS scripts
- `types/`: supplemental types for dependencies that have missing or incorrect typings

## Player Flow

The [Architecture Overview](./overview.md#player-flow) walks through how a player gets from launching the game to playing on a server, including which service handles each step. When you're tracing that flow in the source:

- Client requests land in `packages/director-frontend/src/routes/` and `packages/realm-frontend/src/routes/`
- Ticketing jobs are processed in `packages/ticketing/`
- Starting and allocating game servers is in `packages/realm-backend/src/game-servers/` (start with `allocate.ts`). There is quite a complex flow for server initialization, retry logic, etc. If you need help understanding this, reach out about purchasing premium support. Most of this happens between the Realm Backend ⇔ Sidecar ⇔ Game Server (via the RedwoodCore UE plugin).
- The game server side of the sidecar protocol (map loading, player authentication, persistence, and sync) is in `packages/sidecar/` and the `URedwoodServerGameSubsystem` / `URedwoodGameModeComponent` classes in the RedwoodCore plugin

## Interservice Communication

Services communicate with each other using Socket.IO/WebSockets and Redis pubsub channels. Redis is used for any fan out communication where the sender doesn't know the exact replica of the receiver it needs to send to. You can find the various Redis endpoints in `packages/common/src/redis.ts`. See [below](#api) about the Socket.IO endpoints.

For Socket.IO connections:

- Game server (via the RedwoodCore UE plugin) connects to the Sidecar and doesn't use any Redis
- Sidecar connects to the Realm Backend for its associated Realm (it also uses Redis for [Sync Items](../features/sync-items.md))
- Realm Backend connects to the Director Backend
- Realm Frontend connects to the Director Frontend and the Realm Backend
- Realm Gateway connects to the Director Gateway; the Director services connect to the Director Gateway to reach realms
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

Requests and responses use Socket.IO acknowledgements: the receiving service validates the request against `SRequest` and calls the acknowledgement with the response. An empty `error` string means success.

Defining the API here does nothing functionally; you will need to go to `packages/<the-receiving-service>/src/routes/`, find the appropriate location and add logic to listen to the new endpoint name. You'll see a common entrypoint in `packages/<the-receiving-service>/src/routes/index.ts`, but there are varying patterns used throughout based on the type of connection.

:::note
There's no version handshake between the Unreal plugin and the backend; always use matching versions of both. If they drift, you'll typically see validation errors in the `error` field or requests that never get a response.
:::

## New Service vs Modifying Existing

There isn't a right or wrong answer to how you add new functionality to the backend, but here are some thoughts about whether to write a new service/package or integrate into an existing one:

- If you're adding more endpoints for the clients to use directly, use the appropriate existing Frontend service.
- If you're adding something that purely operates in the backend, you can create a new service. That service can connect to another service via Socket.IO/WebSockets (e.g. the Realm Backend) or use Redis to have a communication layer (see the Ticketing service for an example).
- Creating a new package/service does make it easier to handle upstream merge conflicts, but it's not always an ideal setup.
- If your feature is distinctly different than existing code, consider putting your code in a new package in `packages/` but you can still call exported functions from existing services. This would reduce the amount of potential merge conflicts while still having the code execute within the context of an existing service.
- Note that new services will need to be added to the `dev-initiator`, `core-runner`, and `deployment` packages. New Packages may need to be added to `packages/tsconfig.json`.

## Plugin System

Currently we do not have a plugin system in 5.x.

## Horizontal Scalability

Keep in mind that other than the Sidecar, every other microservice should be able to scale horizontally with more replicas. This requires extra thought about how to architect things as you can't assume things like "the Director Frontend has a connection with every active player". This would simply not be true; there may be several instances of the Director Frontend running.

## Compiling, Packaging, and Testing

The Dev Initiator (`packages/dev-initiator`) uses [`ts-node`](https://npmjs.com/package/ts-node) to compile changes when it starts up. You will have to restart the Dev Initiator for changes to take place, and there's no file watching functionality to automatically do this. Just run `yarn dev <config-env>` or use one of the provided `.vscode/launch.json` **Launch Initiator:** configs (obviously modifying them) to debug the dev-initiator in Visual Studio Code (**recommended**).

If you just want to test compilation without running, you can run an actual compile of all services with `yarn build`. There are also faster variants that use the native TypeScript compiler preview: `yarn build:tsgo`, `yarn dev:tsgo <config-env>`, and `yarn cli:tsgo <command>`.

To package executables of the services (the Dev Initiator for your OS, and the Linux `core-runner`, `match-function`, and `sidecar` binaries in `dist/`), run `yarn pkg`. To also assemble the distributable Standard License bundle, run `yarn package`.

To run the automated tests, run `yarn test`. You can also debug the automated tests with the included `.vscode/launch.json` **Run Tests** VSCode launch config.

## Deployment

We use [Pulumi](https://pulumi.com) as the deployment tool for our Infrastructure-as-Code (IaC). You can find all the Pulumi code in `packages/deployment`. You should only need to modify these if you're adding a new microservice, which we've written the code to make fairly easy. See `packages/deployment/src/redwood/redwood.ts` for an entrypoint of deploying Redwood services; you'll see the Director and Realms being deployed, and those respective classes will deploy the Backend/Frontend/Gateway services.
