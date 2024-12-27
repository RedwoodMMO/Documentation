---
sidebar_position: 1
sidebar_label: Overview
---

# Redis Providers

[Redis](https://redis.io/) is an in-memory database Redwood uses for several purposes:
- Non-persistent/in-memory data
- Occasionally sending messages between services via Redis pub/sub (this is rare; most inter-service communication is done through SocketIO)

Redis is only easily installed via Linux, and therefore requires Kubernetes/WSL for Windows. To combat this challenge in a Kubernetes-less environment (e.g. running the `dev-initiator`), we have added alternative providers for quicker iteration.

To change the provider, override the `persistence.redis.provider` config variable to one of the below options:
- **`stub`** (default) - Uses a custom stub pure-JS implementation of some of the Redis API as needed. This requires no dependencies, and is **only** useful when using the `dev-initiator` as it's not a shared service.
- **`memurai`** - [Memurai](https://www.memurai.com/) is a Windows alternative for Redis; it implements the full Redis API. Use this if the `stub` provider doesn't fit your dev requirements but you still don't want to run Kubernetes.
- **`redis`** - This uses the standard Redis implementation. It is the default when inheriting from the `kubernetes` config environment.

## Configuration

### Stub

There's no configuration necessary to use the `stub` provider. Note that it works by serving as a singleton class so it only reliably works in a single-process environment, like the `dev-initiator`.

### Memurai

By default, Redwood assumes that you have the `memurai.exe` as part of your system PATH. It's normally located in `C:\Program Files\Memurai` and is set up properly during installation if you check the appropriate box. However, if you need to change the path, you can override the `persistence.redis.memurai.path` config variable to include the full path to `memurai.exe`.

By default, Memurai has no password for the database, so make sure `persistence.redis.password` is set to `""` (which is the default).

### Redis

It's highly recommended to change the password via `persistence.redis.password`, which defaults to `password` when inheriting from the `kubernetes` config environment.

The Master and Replicas services are configured for you, so you shouldn't need to change these unless you are using an external Redis installation. These can be configured via `persistence.redis.master/replicas` object config variables.

If you want to increase the number of replicas, you can change the `deployment.dependencies.redis.values.replica.replicaCount` config variable, which defaults to `0`.

Redwood has designed to not need Redis data to persist, but if you find that some scenarios might require it, or you would prefer the piece of mind, you can configure this via the Helm configuration in `deployment.dependencies.redis.values.master/replica.persistence`. You can see that persistence is disabled by default by looking at `RedwoodBackend/config/node/deployment/dependencies/redis.yaml`. There are lots of available persistence values for the Helm chart, which you can read into more in the [ArtifactHUB page](https://artifacthub.io/packages/helm/bitnami/redis) (and searching for `persistence`).

## Installing Memurai

Here's an installation guide if you need to setup Memurai.

1. Download the latest version of Memurai (**Developer Edition**) from https://www.memurai.com/get-memurai and start installing it.
1. When you're asked for the **Destination Folder**, make sure to have **Add the Memurai installation folder to the PATH environment variable** checked.

    ![Memurai add to PATH environment variable](/img/memurai-install-1.jpg)

1. When you're asked if you want to **Install as a Windows service**, uncheck **Install as a Windows service**. This isn't strictly required, but **Redwood doesn't use it as a service**, so it would be wasted resources if you have it enabled.

    ![Memurai install as Windows service](/img/memurai-install-2.jpg)
