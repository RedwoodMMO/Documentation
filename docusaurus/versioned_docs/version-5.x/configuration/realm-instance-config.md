---
sidebar_position: 3
sidebar_label: Realm Instance Config
---

# Realm Instance Config

Each Realm has its own **Realm Instance Config**. Redwood comes preconfigured with the `default` realm found in `RedwoodBackend/config/node/default/realm/instances/default.yaml`. You can define more realms by simply defining a `<realm-key>.yaml` file in a `realm/instances` folder. You don't need to add this to the `default` config environment; you can specify it directly in your own [custom config environment](./overview.md#customization). Don't want the included `default` realm? Just override the [`deployed` flag](#basic-details) in a `realm/instances/default.yaml` file in your custom config environment.

Every realm instance inherits its values from the `realm/instances/redwoodBase.yaml` template, so a realm file only needs the values that differ. For example, a second realm could be as small as:

```yaml
# realm/instances/eu.yaml in your config environment
key: "eu"
name: "Europe"
deployed: true
```

:::note
While it won't break anything if you do, we've tried to keep the configuration flexible enough so that you shouldn't need to modify any config files distributed in the official Redwood Backend. You can introduce completely new variables in your own config environment.
:::

Every variable mentioned below is documented in detail in the [Realm config reference](./reference/realm.md).

## Basic Details

- `key` is a string that Redwood uses as the identifier for the Realm. This should be the same name as the config file/folder for the Realm Instance Config (i.e. `default.yaml` has a `key: "default"`). It's also used to build the realm's default hostnames, database file, and Kubernetes namespace, so stick to lowercase letters, numbers, and dashes.
- `name` is the human-friendly string that should be used to show to the player.
- `deployed` is a boolean determining whether or not that Realm Instance Config should deploy the associated realm services; set this to `false` to disable a realm completely.
- `listed` is a boolean that determines whether or not the Director should list this realm when players call `ListRealms` (applied when deploying to Kubernetes).
- `image-tag` is the Docker image tag that Kubernetes should use for the realm services (except for game server images).

See [Basic details](./reference/realm.md#basic-details) in the reference.

## Auth

`auth.id` and `auth.secret` are the credentials the realm uses to authenticate with the Director.

- When running the [Dev Initiator](../getting-started/running-with-backend.md), you can leave the placeholder values; the Dev Initiator generates them for you.
- When deploying to Kubernetes, set real values. Run `yarn id` in the `RedwoodBackend` directory to generate an ID and a secret, then set them in your realm instance config. `yarn deploy` registers the realm with the Director using these values.

Treat the secret like a password. See [Auth](./reference/realm.md#auth) in the reference.

## Kubernetes Cluster

The `k8s` config variables determine how the realm is deployed to the cluster. The `k8s.id` corresponds with the associated [Kubernetes instance](./reference/deployment.md#kubernetes-clusters) id as to which cluster to deploy to. `k8s.namespace` determines the namespace the services should be deployed to; we recommend keeping this as `realm-${../key}` for simplicity, but it can be anything you'd like.

See [Kubernetes](./reference/realm.md#kubernetes) in the reference.

## Persistence

The `persistence.database` config variables define the PostgreSQL details for both `runtime-access` (how the Node.js services access the database; this could be an internal Kubernetes service, see `RedwoodBackend/config/node/kubernetes/realm/instances/default.yaml` for an example, or the private network details for your managed database) and `deployment-access` (how the deployment scripts get access, usually a public endpoint). These are ignored when running locally with SQLite.

The `persistence.blobs` config variables define the [Blob Storage](../features/data/storage/blob-storage.md) details.

See [Database](./reference/realm.md#database) and [Blob storage](./reference/realm.md#blob-storage) in the reference.

## Backend and Frontend

The `backend` and `frontend` config variables define how many `replicas` to scale the services, what `debug-port` to use if you need to debug the services, and internal/external connection details.

The `backend.connection.external` variables are used for how the game server Sidecar service communicates with the Realm. This can be a Kubernetes service host if you're using Agones servers in the same cluster, but otherwise there needs to be a publicly available hostname.

The `frontend.connection.external` variables are used for the game client to connect to the realm and need to be a publicly available hostname during public testing.

During development, the external hosts are `realm-${../../../key}.localhost` (the Realm Frontend, port `3011`) and `realm-${../../../key}-backend.localhost` (the Realm Backend, port `3010`), which resolve to `realm-default.localhost` and `realm-default-backend.localhost` for the `default` realm. Those are the entries you added to your [`hosts` file](../getting-started/installing.md#configure-hosts-file); add the matching pair for every additional realm.

See [Realm Backend and Frontend](./reference/realm.md#realm-backend-and-frontend) in the reference.

## Game Servers

The `game-servers` config variables define several behaviors related to the Unreal game server, most importantly which **provider** starts your servers (`local`, `agones`, or `edgegap`) and, for the `local` provider, where your Unreal editor and project are. Most of the relevant documentation can be found in the [game server provider documentation](../features/game-servers/hosting/overview.md).

See [Game servers](./reference/realm.md#game-servers) in the reference.

## Ticketing

The `ticketing` config variables define how players get into servers: [queuing](../features/ticketing/queuing.md) and [matchmaking](../features/ticketing/overview.md), including the matchmaking provider and its timings.

See [Ticketing](./reference/realm.md#ticketing) in the reference.

## Parties

The `parties` config variables enable [parties](../features/social/parties.md) and set their size and invite limits.

See [Parties](./reference/realm.md#parties) in the reference.

## Default Proxy

Read more about the [default proxy here](../features/realms.md#default-proxy), and see [Default proxy](./reference/realm.md#default-proxy) in the reference.

## Characters

The `characters.archival-period-days` variable allows you to specify how many days a player character stays archived until it is deleted from the database. This defaults to `1` day. Setting it to `0` will skip archiving and immediately delete characters. Setting it to `-1` will never delete characters automatically and keep them archived indefinitely.

The `characters.players-can-update-character-creator-data` variable controls whether game clients can change a character's `characterCreatorData` (`always`, only when the character is created with `initial`, or `never`).

See [Characters](./reference/realm.md#characters) in the reference.
