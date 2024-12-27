---
sidebar_position: 3
---

# Agones

When using the `kubernetes` configuration environment, `agones` becomes the default game server provider as it provides the easiest way to test your game when Redwood is running in Kubernetes.

[Agones](https://agones.dev) is an open source extension to Kubernetes developed by Google that provides "batteries-included" mechanisms for scaling game servers along with server orchestration. It's a popular, battle-tested system to use when self-hosting your game servers.

Redwood provides an out-of-the-box solution so you can get started using Agones without needing to understand Fleets, Fleet Autoscalers, Game Server Allocations, etc. However, we recommend reviewing Agones [documentation](https://agones.dev/site/docs/getting-started/) to learn more, especially if you're planning to use Agones in production.

## Preparing the Game Server

Before you can use Agones, you need prepare the game server so it can be containerized to be used within the Kubernetes environment. This boils down to a couple steps:

1. Package the `Server` target for `Linux`.
1. Copy the output folder (e.g. `LinuxServer`) to the `RedwoodBackend/dist` folder (create it if it doesn't exist).
    - Leaving it as `dist/LinuxServer` will use the default configuration; if you want to change the name, you will need to override the associated [Realm Instance Config](../../configuration/realm-instance-config.md) `game-server.local-dir` for the realm you're configuring.

From here, the Pulumi deployment scripts will be able to package the game server into a Docker container and prepare the Agones fleet during Kubernetes deployment.

You can see more details about this process in [Deploying Locally to Kubernetes](../../deploying-to-kubernetes/deploying-locally#deploying).

## Fleet configuration

The default Agones [Fleet](https://agones.dev/site/docs/reference/fleet/) used is defined in `RedwoodBackend/config/node/default/realm/instances/default.yaml` with the `game-servers.agones.fleet` config variable. Redwood simplifies the configuration to specifying the name of the image (which automatically refers to values of other config variables), the resources limits/requests to be used, and how the Agones [Ready Buffer Autoscaler](https://agones.dev/site/docs/reference/fleetautoscaler/#ready-buffer-autoscaling) is configured.

**Redwood currently doesn't support other types of autoscalers**, but it should be easy for you to add support to them by modifying `RedwoodBackend/packages/deployment/src/agones/agones.ts` (see the `installFleetAutoscaler()` function). If you have a Premium Support subscription, [reach out](../../support/how-to-get-support.md) and we should be able to help with adding support for the autoscaler type you need.

**Redwood also doesn't currently support more than one fleet per instance of Agones.** This is less trivial of a modification for you to add, but definitely feasible, and we encourage Premium Support subscribers to [reach out](../../support/how-to-get-support.md) if you need this.

## Scaling Agones

By default, the Agones system is set to not install the Ping or Allocator services; the Controller and Extensions services are also set to only have 1 replica. You can see the available configuration variables in `RedwoodBackend/config/node/default/deployment/dependencies/agones.yaml` to change these. For example, you may need to increase the number of replicas for the Controller service as your CCUs grow. [Reach out](../../support/how-to-get-support.md) if you have questions about scaling Agones.
