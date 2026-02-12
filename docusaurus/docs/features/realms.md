# Realms

Realms the main collection of logic and data in Redwood. A Realm contains:
- Ticketing (matchmaking, queuing, etc.)
- Player character data
- World data
- Game servers

Similar to the Director, each Realm has a [Frontend and Backend](../architecture/overview.md#frontend-vs-backend), but it also has more microservices (read more in the [Architecture](../architecture/overview.md) page).

When players log into the Redwood Director (which is the very first thing they'll do), the next thing they'll do is list the available Realms. From there, they can create/update characters that are bound to that Realm and list the available [`GameServerProxies`](../architecture/game-servers.md#gameserverproxy) (via the List Servers call). Each `GameServerProxy` can have several Unreal game server instances associated to it (for each shard in each zone). Players join a GameServerProxy and Redwood determines which Unreal game server instance they should be directed to.

## Regions

Realms do not need to be bound to a single region. Traditionally speaking, for the standard MMORPG example, they would be in a single region, but many match-based games will have a single Realm for the entire game and have matches hosted by game server instances all over the globe. As of right now using the [Hathora](./game-servers/hosting/hathora.md) game server provider is the only supported mechanism to have multiple regions in a single Realm.

## Adding More Realms

By default, Redwood comes with a single deployed & listed Realm called `Default` (via the various `realm/instances/default.yaml` config files). There are many reasons you might want to add more realms:
- Characters shouldn't be able to move to a set of servers (e.g. for different game modes [RP, PvP, PvE])
- You want to have everything (backend, frontend, Realm database, game servers, etc.) in the same region for the lowest latency and you want to support other regions
- You need to spin up an isolated environment that still shares the same Director

To add another realm, add a new `.yaml` file in your [config env's](../configuration/overview.md#customization) `realm/instances` directory (i.e. `config/node/your-game/realm/instances/europe.yaml`). This file will inherit from the base `config/node/default/realm/instances/redwoodBase.yaml`. You can override variables in this new [Realm Instance Config](../configuration/realm-instance-config.md). _At a minimum_, you need to override the below variables if you want to see the:

```yaml
key: "europe" # this should match the name of your `.yaml` file without the extension
name: "Europe" # this is any human-friendly name
# deployed: true # you need to uncomment this if you want this realm config to be active

auth:
  id: "" # generate a value for this using `yarn id` or get one at https://www.uuidgenerator.net/
  secret: "" # generate a value for this using `yarn id` or get one at https://www.uuidgenerator.net/
```

You'll also need to add more entries to your [`hosts` file](../getting-started/installing.md#configure-hosts-file). The `key` variable is used to generate these hostnames; below is an example using our `europe` example from above:

```
127.0.0.1 realm-europe.localhost
127.0.0.1 realm-europe-backend.localhost
```

:::warning
You'll need to also add additional overrides for your custom realm configs for different operating environments. For example the `kubernetes` config env does provide some helper overrides for the `default.yaml` Realm, but you'll need to specify those changes in your respective Realm Instance Config (e.g. `config/node/your-game-kubernetes/realm/instances/europe.yaml`).
:::

### Deploying The Realm

If you're going to multiple Realms running simultaneous while running the Dev Initiator, you'll need to ensure they use different ports for the Frontend and Backend services. Otherwise they will try to bind to the same port. In each of the respective Realm Instance Config files you'll need to add sections for the ports; chose 2 ports that aren't being used by other services on your computer:

```yaml
backend:
  connection:
    internal:
      port: 13010
    external:
      port: 13010

frontend:
  connection:
    internal:
      port: 13011
    external:
      port: 13011
```

:::info
You can see an example of how to do this by looking at `test1.yaml` and `test2.yaml` in `config/node/test/realm/instances`.
:::

## Disabling the `Default` Realm

You can easily disable the `Default` Realm that comes enabled with Redwood by adding `deployed: false` in `config/node/your-game/realm/instances/default.yaml`.

## Deploying Realms to Different Regions

By default, Realms deploy to the default Kubernetes cluster instance (`k8s-default`). If you want to deploy them to another region, you will need to a Kubernetes cluster for each of the desired regions by adding a new file in `config/node/your-game/deployment/kubernetes/instances` (e.g. `k8s-europe.yaml`). In that file you should add:

```yaml
id: "k8s-europe" # this should match the name of the file
enabled: true
```

You can find other variables to override in `config/node/default/deployment/kubernetes/instances/redwoodBase.yaml` (e.g region details, installed dependencies, and enabled node pools).

Then you'll need to make sure that the corresponding Realm Instance Config is configured to use that Kubernetes instance. For example, in `config/node/your-game/realm/instances/europe.yaml` we would add:

```yaml
k8s:
  id: "k8s-europe"
```

## Default Proxy

Realms can be configured with a "Default Proxy" configuration, which is just all the inputs necessary to create a [`GameServerProxy`](../architecture/game-servers.md#gameserverproxy). You can see all of the options in `config/node/default/realm/instances/redwoodBase.yaml`.

You can also configure Redwood to automatically create a version of the Default Proxy by overriding the `default-proxy.create-on-first-boot` config variables in your Realm Instance Config. This will create a new proxy after the boot sequence finishes if it can't find one with the associated configured proxy name. We don't use the `create-on-first-boot` feature usually, especially not in production, but we provided this option as some development workflows may be sped up by automatically creating a proxy instead of needing to call a [CLI command](./cli.md) each time.

We do use the Default Proxy feature though via the `create-default-proxy` [CLI command](./cli.md). In prior releases you had to specify each of the options via the CLI, which was repetitive; now you can just call `create-default-proxy` with the proxy name and config env.

## Proxies Configured with Start on Boot

Admin users can configure a [`GameServerProxy`](../architecture/game-servers.md#gameserverproxy) to "start on boot". This flag tells Redwood two things:
1. Start the proxy immediately (instead of waiting for a player to join or for the start proxy API command to be called)
1. Every time the backend reboots to automatically start the proxy

This can be useful for persistent proxies that should be running whenever Redwood is running (e.g. RPG overworld proxies).
