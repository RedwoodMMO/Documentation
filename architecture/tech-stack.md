---
sidebar_position: 4
---

# Tech Stack

## Core Technology

- [Node.js](https://nodejs.org) (v24): The runtime for the Redwood backend services, managed with [Yarn](https://yarnpkg.com) 4
- [TypeScript](https://typescriptlang.org): The language used for the Redwood backend services
- [Socket.IO](https://socket.io/): The network layer used for connections with any of the Node.js services (websockets only)
- [Prisma](https://www.prisma.io/) (v6): The ORM and schema migration tool for the Director and Realm databases
- [PostgreSQL](https://www.postgresql.org/): Relational database used by Redwood in Kubernetes deployments
    - [SQLite](https://www.sqlite.org): Used by the Dev Initiator so local development without Kubernetes needs zero database setup
- [Redis](https://redis.io): Used for data that needs to support horizontal scaling as well as providing a pub/sub broker between frontend and backend services
    - [BullMQ](https://bullmq.io/): Job queues on top of Redis, used by [Ticketing](./overview.md#ticketing) and other horizontally scaled work
    - Custom stub: Redis doesn't run natively on Windows, so Redwood provides a custom pure-JS single-process stub for the Redis API for testing and most development cases (the Dev Initiator default)
    - [Memurai](https://www.memurai.com): For advanced Windows-only dev environments where the stub doesn't work out, Memurai is a full replacement for Redis
- [Docker](https://docker.com): The containerization system for reproducible microservice environments
- [Kubernetes aka K8s](https://kubernetes.io): Container orchestration and scheduling
- [Pulumi](https://pulumi.com) and [Helm](https://helm.sh): Infrastructure-as-Code for deploying Redwood and its dependencies to Kubernetes
- [ingress-nginx](https://kubernetes.github.io/ingress-nginx): Routes external traffic to the right service by hostname
- [Agones](https://agones.dev): An extension to Kubernetes that assists with deploying and scaling game server pods in a Kubernetes cluster based on demand
- [Open Match](https://openmatch.dev): The optional large-scale matchmaking system used by Redwood
- [SeaweedFS](https://github.com/seaweedfs/seaweedfs): S3-compatible object storage for [blob storage](../features/data/storage/blob-storage.md) in Kubernetes
- [ejabberd](https://www.ejabberd.im/): For [Text Chat](../features/social/text-chat.md) support

The versions of the Kubernetes dependencies are listed in [Deploying Locally](../deploying-to-kubernetes/deploying-locally.md#dependencies).

## Supported Third Party Services

- Game server hosting: see [Hosting](../features/game-servers/hosting/overview.md)
    - [Agones](https://agones.dev) (in your own cluster)
    - [Edgegap](https://edgegap.com)
- Transactional Email: for email verification, game news, relevant game events, etc.
    - [ZeptoMail](https://zeptomail.zoho.com/)
    - [SendGrid](https://sendgrid.com)
- Secrets: for storing configuration secrets
    - Local file (development only)
    - [HashiCorp Vault](https://developer.hashicorp.com/vault)
    - [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
    - [Azure Key Vault](https://azure.microsoft.com/products/key-vault)
    - [Google Cloud Secret Manager](https://cloud.google.com/security/products/secret-manager)
- DNS: [Cloudflare](https://cloudflare.com) (optional automatic DNS records)
- Authentication: Steam, Epic Online Services, Discord, Twitch, and your own JWTs (see [Authentication](../features/authentication/overview.md))
