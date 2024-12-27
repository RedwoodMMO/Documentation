---
sidebar_position: 4
---

# Tech Stack

## Core Technology

- [NodeJS](https://nodejs.org): The runtime for the Redwood backend services
- [TypeScript](https://typescriptlang.org): The language used for the Redwood backend services
- [Docker](https://docker.com): The containerization system for reproducible microservice environments
- [Kubernetes aka K8s](https://kubernetes.io): Container orchestration and scheduling
- [Open Match](https://openmatch.dev): The matchmaking system used by Redwood
- [Agones](https://agones.dev): An extension to Kubernetes that assists with deploying and scaling game server pods in a Kuberentes cluster based on demand
- [PostgreSQL](https://www.postgresql.com/): Relational database used by Redwood
    - [SQLite](https://www.sqlite.com): PostgreSQL doesn't work in Windows, so we substitute it with SQLite when testing locally without Kubernetes for faster development iteration cycles
- [SocketIO](https://socket.io/): The network layer used for connections with any of the NodeJS services
- [Redis](https://redis.com): Used for data that needs to support horizontal scaling as well as provide a pub/sub broker between frontend and backend services
    - Custom stub: Redis doesn't work Windows, so Redwood provides a custom pure-JS Singleton/single-process stub for the Redis API for testing and most development cases.
    - [Memurai](https://www.memurai.com): For advanced Windows-only dev environments where the stub doesn't workout Redis, Memurai is a full replacement for Redis.

## Supported Third Party Services

- [Hathora](https://hathora.dev): An alternative to self-hosting game servers with Agones; this is a 3rd party service for hosting on-demand, ephemeral game servers. You can easily support several regions without managing a Kuberentes cluster for each region. **We use Hathora for our Redwood Gameplay Template demos!**
- [SendGrid](https://sendgrid.com): A transactional email provider for email verification, game news, relevant game events, etc.
- [Idem](https://idem.gg): A matchmaking platform as a service that you can use instead of the OpenMatch integration.
- [HCP Vault](https://vaultproject.io): HashiCorp's managed service for Vault secrets for specifying secrets in the configuration.
