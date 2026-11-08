# Realms

Realms are the main collection of logic and data in Redwood. A Realm contains:
- Ticketing (matchmaking, queuing, etc.)
- Player character data
- World data
- Game servers

Similar to the Director, each Realm has a [Frontend and Backend](../architecture/overview.md#frontend-vs-backend), but it also has more microservices (read more in the [Architecture](../architecture/overview.md) page).

When players log into the Redwood Director (which is the very first thing they'll do), the next thing they'll do is list the available Realms and connect to one (see [Building the Main Menu](../getting-started/building-the-main-menu.md#3-connect-to-a-realm)). From there, they can create/update characters that are bound to that Realm and list the available [`GameServerProxies`](../architecture/game-servers.md#gameserverproxy) (via **List Proxies**). Each `GameServerProxy` can have several Unreal game server instances associated with it (one for each shard in each zone). Players join a GameServerProxy and Redwood determines which Unreal game server instance they should be directed to.

## Regions

Realms do not need to be bound to a single region. Traditionally speaking, for the standard MMORPG example, they would be in a single region, but many match-based games will have a single Realm for the entire game and have matches hosted by game server instances all over the globe.

The regions a Realm offers depend on its [game server provider](./game-servers/hosting/overview.md):

| Provider | Regions |
| --- | --- |
| `local` (and `dev-debug`) | A single region named `Local` |
| `agones` | A single region, defined by the Kubernetes instance the Realm is deployed to (`deployment.kubernetes.instances.<k8s-id>.region`) |
| `edgegap` | Every Edgegap location (one region per location beacon city) |

So as of right now, the [Edgegap](./game-servers/hosting/edgegap.md) game server provider is the only supported mechanism to have multiple regions in a single Realm. Clients automatically measure their ping to each region after connecting to the Realm, which is used for [matchmaking](./ticketing/overview.md).

## Adding More Realms

By default, Redwood comes with a single deployed & listed Realm called `Default` (via the various `realm/instances/default.yaml` config files). There are many reasons you might want to add more realms:
- Characters shouldn't be able to move between sets of servers (e.g. for different game modes [RP, PvP, PvE])
- You want to have everything (backend, frontend, Realm database, game servers, etc.) in the same region for the lowest latency and you want to support other regions
- You need to spin up an isolated environment that still shares the same Director

To add another realm, add a new `.yaml` file in your [config env's](../configuration/overview.md#customization) `realm/instances` directory (i.e. `config/node/your-game/realm/instances/europe.yaml`). This file automatically inherits everything from the base `config/node/default/realm/instances/redwoodBase.yaml`, so you only need to specify what's different. You can see every variable in the [Realm Instance Config](../configuration/realm-instance-config.md) page and the [realm config reference](../configuration/reference/realm.md). _At a minimum_, you need these variables:

```yaml
key: "europe" # this should match the name of your `.yaml` file without the extension
name: "Europe" # this is any human-friendly name; it's shown to players and used by the CLI's --realm option
deployed: true # realms based on redwoodBase are not deployed unless you set this

auth:
  id: "" # generate values for these using `yarn id`
  secret: ""
```

The Dev Initiator generates the `auth` values for you if they're left as the placeholders, but you need real values once you deploy (production-like environments refuse to deploy while the secret is still the placeholder), and each realm needs its own database credentials in production.

You'll also need to add more entries to your [`hosts` file](../getting-started/installing.md#configure-hosts-file). The `key` variable is used to generate these hostnames; below is an example using our `europe` example from above:

```
127.0.0.1 realm-europe.localhost
127.0.0.1 realm-europe-backend.localhost
```

:::warning
You'll need to also add overrides for your custom realm configs for different operating environments. For example, the `kubernetes` config env provides some helper overrides for the `default.yaml` Realm (database host, blob storage, Agones, and Open Match), but you'll need to specify those changes yourself in your other Realm Instance Configs (e.g. `config/node/your-game-kubernetes/realm/instances/europe.yaml`).
:::

### Running Multiple Realms Locally

If you're going to run multiple Realms simultaneously with the Dev Initiator, you'll need to ensure they use different ports for the Frontend and Backend services. Otherwise they will try to bind to the same port. In each of the respective Realm Instance Config files, add sections for the ports, choosing ports that aren't being used by other services on your computer:

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

You can disable the `Default` Realm that comes enabled with Redwood by adding `deployed: false` in `config/node/your-game/realm/instances/default.yaml`. If you just want to hide it from the realm list (e.g. for an internal test realm), set `listed: false` instead.

## Deploying Realms to Different Regions

By default, Realms deploy to the default Kubernetes cluster instance (`k8s-default`). If you want to deploy them to another region, you will need a Kubernetes cluster for each of the desired regions, added as a new file in `config/node/your-game/deployment/kubernetes/instances` (e.g. `k8s-europe.yaml`). In that file you should add:

```yaml
id: "k8s-europe" # this should match the name of the file
enabled: true
```

You can find other variables to override in `config/node/default/deployment/kubernetes/instances/redwoodBase.yaml` (e.g. region details, installed dependencies, and the kubeconfig) or in the [deployment config reference](../configuration/reference/deployment.md).

Then you'll need to make sure that the corresponding Realm Instance Config is configured to use that Kubernetes instance. For example, in `config/node/your-game/realm/instances/europe.yaml` we would add:

```yaml
k8s:
  id: "k8s-europe"
```

## Default Proxy

Realms can be configured with a "Default Proxy": all the inputs necessary to create a [`GameServerProxy`](../architecture/game-servers.md#gameserverproxy) stored in config, so you don't have to type them every time. They live under `default-proxy` in the Realm Instance Config:

```yaml
default-proxy:
  profile-id: "overworld" # required; a game profile id from game.profiles
  map-id: null # optional; a map from the profile (random if null)
  region: null # optional; a region name (the first region if null)
  public: true
  password: null
  proxy-ends-when-collection-ends: false
  continuous-play: false
  start-on-boot: true
  create-on-first-boot:
    enabled: false
    name: "Default Proxy"
```

`profile-id` defaults to an empty string, so **you must set it** before using the Default Proxy, otherwise creating it fails with `Invalid profileId`.

There are two ways to create the Default Proxy:

- Run the [`create-default-proxy` CLI command](./cli.md#create-default-proxy) with a proxy name and your config env. This creates the proxy and starts its servers immediately.
- Enable `default-proxy.create-on-first-boot`. When the Realm Backend boots (after `start-proxies-on-boot-delay-seconds`), it creates and starts a proxy with `create-on-first-boot.name` if one with that name doesn't exist yet. Because the Dev Initiator wipes its databases on startup by default, this effectively means "create my world every time I start the Dev Initiator", which can be a nice shortcut for persistent-world games in development. We don't usually use it in production.

## Proxies Configured with Start on Boot

Admin users can configure a [`GameServerProxy`](../architecture/game-servers.md#gameserverproxy) to "start on boot" (e.g. with the [CLI's `--start-on-boot` flag](./cli.md#create-proxy) or `default-proxy.start-on-boot`). This flag tells Redwood two things:
1. Start the proxy immediately (instead of waiting for a player to join or for the start proxy API command to be called)
1. Start the proxy automatically every time the backend reboots (after `start-proxies-on-boot-delay-seconds`, which defaults to `15`), as long as the proxy hasn't ended

This can be useful for persistent proxies that should be running whenever Redwood is running (e.g. RPG overworld proxies).

## Maintenance

You can put a Realm into maintenance to stop players from connecting to it, with an optional message to show them. Use the [`update-realm-maintenance`](./cli.md#update-realm-maintenance) CLI command to set a message, start time, and end time, and [`end-realm-maintenance`](./cli.md#end-realm-maintenance) to clear it.

While a realm is in maintenance, **Initialize Realm Connection** fails with the error `Realm is in maintenance: <message>`, so show that error to the player. Players that are already connected aren't disconnected. (The backend also includes the maintenance fields in its realm list, but the Unreal plugin's `FRedwoodRealm` struct doesn't expose them yet.)

:::caution Known issue (5.0.0)
The maintenance check is inverted: the Director blocks realm connections **before** the maintenance start time and allows them once it has passed, and the end time isn't checked. Until this is fixed, schedule maintenance with a start time in the future to block connections immediately, and use `end-realm-maintenance` to lift it.
:::
