---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deploying Remotely

:::warning
You need to follow the steps to **[deploy locally](../deploying-to-kubernetes/deploying-locally.md)** before attempting to deploy to a remote Kubernetes cluster as that section covers some common configuration changes that this section extends on.
:::

The main differences for deploying to a remote cluster instead of locally are:

- Adding a kubeconfig for Pulumi to authenticate with the remote Kubernetes cluster
- Adding the necessary Redwood configuration to create and publish the necessary Docker images
- Uploading the Docker images to an externally-hosted Container Registry
- Replacing every placeholder secret (Redwood [refuses to deploy](#default-secrets-check) a production environment that still uses them)

## Redwood Configuration

1. Create a new configuration environment that inherits from the `staging` or `production` environment presets **and** the configuration environment you created [when you deployed locally](../deploying-to-kubernetes/deploying-locally.md#redwood-configuration):

    `<production-config-environment>/_config.json`:
    ```json
    {
      "parentNames": ["production", "<project-kubernetes-config-environment>"]
    }
    ```

    **For example:**
    `project-name-prod/_config.json`:
    ```json
    {
      "parentNames": ["production", "project-name-k8s"]
    }
    ```

    `staging` turns off development mode and debugging, switches to the production service images, stops building Docker images during `yarn deploy`, and enables the [default secrets check](#default-secrets-check). `production` inherits all of that and additionally expects an [external database](#database) and enables the metrics server.

1. Add a `deployment/_index.yaml` file in your config env that has the below contents:

    ``` yaml
    cloud: "custom"
    ```

    `cloud: "local"` (the default) only deploys to a local Rancher Desktop or Docker Desktop cluster; `custom` deploys to whichever cluster your kubeconfig points to.

1. Add a `docker.yaml` file in your config env and use the below as a template, but you should change every variable based on your setup:

    ```yaml
    registry:
      url: "yourcr.com/container-registry" # Do not include a trailing slash
      secret-name: "redwood-container-registry-secret"
      auth:
        username: "yourcr-username"
        password: "yourcr-password" # This can be a secret in the secrets provider

    image-prefix: "${docker.registry.url}/redwood"
    ```

    :::note
    You need to use an external Container Registry for your images. You can use [Docker Hub](https://hub.docker.com/), [GitHub Packages](https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry), or deploy your own; many cloud providers provide an easy to deploy option. See [Creating a Container Registry](#creating-a-container-registry).
    :::

1. Add a `director.yaml` file to your config env. The below is a template you can use, but you should change every variable:

    ```yaml
    image-tag: "1.0.0"

    persistence:
      database:
        # this is what the cluster uses. if you're deploying the cluster to the same region/datacenter as your database
        # there may be faster, private connection details
        runtime-access:
          host: "<your-external-postgresql-db-host>"
          port: 5432
          database: "<database-name>"
          user: "<username>"
          password: "<password>" # This can be a secret in the secrets provider

        # this is what your local machine uses when deploying (e.g. to migrate the schema),
        # so you may need to use different public connection details.
        # you might also need to add your IP address to the firewall for the database
        deployment-access:
          host: "<your-external-postgresql-db-host>"
          port: 5432
          database: "<database-name>"
          user: "<username>"
          password: "<password>" # This can be a secret in the secrets provider

    backend:
      connection:
        # the publicly facing connection details for the director backend
        external:
          host: "director-backend.yourgame.com" # this must be a FQDN hostname, it cannot be an IP
          port: 443
          tls: true

    frontend:
      # the publicly facing connection details for the director frontend
      # which is used by all clients when they launch the game
      connection:
        external:
          host: "director.yourgame.com" # this must be a FQDN hostname, it cannot be an IP
          port: 443
          tls: true

    gateway:
      # the shared secret the director services use to authenticate with the
      # director gateway; generate a long random value (e.g. with `yarn id`)
      secret: "<random-secret>" # This can be a secret in the secrets provider

      connection:
        external:
          host: "director-gateway.yourgame.com" # this must be a FQDN hostname, it cannot be an IP
          port: 443
          tls: true
    ```

1. Add an override file for each of your [Realm Instance Configs](../configuration/realm-instance-config.md). If you kept the default and didn't add new realms, this should be at `realm/instances/default.yaml`

    ```yaml
    image-tag: "1.0.0"

    # generate these with `yarn id`; the dev placeholders are rejected by the default secrets check
    auth:
      id: "<realm-uuid>"
      secret: "<realm-secret>" # This can be a secret in the secrets provider

    persistence:
      database:
        # this is what the cluster uses. if you're deploying the cluster to the same region/datacenter as your database
        # there may be faster, private connection details
        runtime-access:
          host: "<your-external-postgresql-db-host>"
          port: 5432
          database: "<database-name>"
          user: "<username>"
          password: "<password>" # This can be a secret in the secrets provider

        # this is what your local machine uses when deploying, so you may need to use different public connection details
        # you might also need to add your IP address to the firewall for the database
        deployment-access:
          host: "<your-external-postgresql-db-host>"
          port: 5432
          database: "<database-name>"
          user: "<username>"
          password: "<password>" # This can be a secret in the secrets provider

    backend:
      # the publicly facing connection details for this realm backend,
      # which game server sidecars use to reach the realm. With the agones
      # provider the sidecars are in the same cluster, so the default internal
      # hostname from the kubernetes env works. If you use an external game server
      # hosting provider (e.g. Edgegap), this must be a public hostname.
      connection:
        external:
          host: "realm-backend.yourgame.com" # this must be a FQDN hostname, it cannot be an IP
          port: 443
          tls: true

    frontend:
      # the publicly facing connection details for this realm frontend
      # which is used by all clients in the main menu to authenticate and join the realm's
      # servers/matchmaking
      connection:
        external:
          host: "realm.yourgame.com" # this must be a FQDN hostname, it cannot be an IP
          port: 443
          tls: true

    game-servers:
      image-tag: "1.0.0"
    ```

    Every realm variable is listed in the [realm config reference](../configuration/reference/realm.md).

1. Add the remaining secrets that the [default secrets check](#default-secrets-check) requires. At a minimum, production environments need their own values for:

    | Config variable | Default (rejected) | What it is |
    | --- | --- | --- |
    | `admin.default-user.password` | `admin` | Password for the admin account the [CLI](../features/cli.md) uses; created/updated every time the Director Backend starts |
    | `auth.admin.secret` | `secret` | Secret used to create additional admin accounts with `yarn cli create-admin` |
    | `director.gateway.secret` | `change-me` | See `director.yaml` above |
    | `realm.instances.<realm>.auth.secret` | all zeros | See the realm config above |
    | Database passwords | `redwood` | See the `persistence.database` sections above |
    | `auth.jwt.secret`, `auth.discord.client.secret`, `auth.twitch.client.secret`, `auth.steam.api-key` | placeholders | Only if you use those [authentication providers](../features/authentication/overview.md) |
    | `deployment.pulumi.access-token` and `deployment.pulumi.encryption.passphrase` | empty | Only when not using local Pulumi state |
    | `deployment.dns.cloudflare.credentials.token` | empty | Only with the Cloudflare DNS provider |
    | SeaweedFS keys (`deployment.kubernetes.instances.<instance>.dependencies.seaweedfs.auth.*`) | `seaweedfs-*` | Only if SeaweedFS is enabled |
    | `realm.instances.<realm>.game-servers.edgegap.credentials.api-token` | empty | Only with the Edgegap provider |

    We also recommend changing `persistence.redis.password` (the `kubernetes` environment sets it to `password`).

    :::warning
    We highly recommend storing all of these with a [Secrets provider](../features/secrets/overview.md) rather than in plain text in your config files.
    :::

1. Create `deployment/pulumi.yaml` in your config env, using the below as a template:

    ```yaml
    # yaml-language-server: $schema=./pulumi.yaml
    # The above comment prevents VSCode yaml language server
    # from thinking this should follow the Pulumi.yaml schema that
    # Pulumi CLI uses.

    # It's recommended to use shared Pulumi state for production environments; the below uses Pulumi Cloud
    local-mode: false
    access-token: "<pulumi-token>" # Get one by following https://www.pulumi.com/docs/pulumi-cloud/access-management/access-tokens/
    org: "<your-pulumi-org>"

    stack: "prod" # at a minimum add this variable to differentiate with the default `dev` stack
    ```

1. Consider how you're going to handle DNS. Redwood comes with an integration with Cloudflare, which creates the DNS records for your external hostnames when you create `deployment/dns.yaml` with the below template:

    ```yaml
    provider: "cloudflare"

    cloudflare:
      proxied: true
      credentials:
        account-id: "<your-account-id>" # https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/
        token: "<cloudflare-api-token>" # https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
    ```

    :::warning
    If you don't use this Cloudflare integration, you will need to configure your DNS manually to point the external connection hostnames you configured above to your cluster's ingress.
    :::

1. Add the `kubeconfig` to the corresponding `<your-env>/deployment/kubernetes/instances/<instance>.yaml`:

    ``` yaml
    kubeconfig: "<the contents of a kubeconfig file>"
    ```

    <details>
      <summary>This is retrieved after you provision your own Kubernetes cluster in a later step. Below are some hints to point you in the right direction, but contact your cloud provider/cluster software support if you need more help.</summary>

      #### Talos

      See [the official docs](https://docs.siderolabs.com/talos/) for getting Kubernetes access (look for the `talosctl kubeconfig` step in the getting started guide for your version).

      #### K0s

      See [the official docs](https://docs.k0sproject.io/stable/k0sctl-install/#4-access-the-cluster).

      #### K3s

      After you install K3s, you can find the `kubeconfig` contents stored at `/etc/rancher/k3s/k3s.yaml`; see [K3s Cluster Access docs](https://docs.k3s.io/cluster-access).

      #### DigitalOcean

      1. Open the Kubernetes cluster page in the dashboard
      1. In the top right, click on **Actions**
      1. Click **Download Config**
      1. The contents of the download file are the `kubeconfig`

      #### AWS

      See [the official docs](https://docs.aws.amazon.com/eks/latest/userguide/create-kubeconfig.html).

      #### Azure

      1. SSH into the master node, see [these docs](https://learn.microsoft.com/en-us/azure/aks/node-access)
      1. Run `cat ~/.kube/config` (may also be stored at `/etc/kubernetes/admin.conf`) to get the `kubeconfig` contents

      #### Google Cloud

      1. Add an entry to your local `~/.kube/config` file using the [gcloud CLI](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl#store_info)
      1. List the contexts: `kubectl config get-contexts`
      1. Switch to your gcloud context: `kubectl config set-context <context-id>`
      1. Export the `kubeconfig`: `kubectl config view --minify --flatten > kubeconfig.yaml`

      #### Linode

      Run `linode-cli lke kubeconfig-view $clusterID --text | sed 1d | base64 --decode > kubeconfig.yaml`.
    </details>

    :::note
    If you're still only using one Kubernetes cluster (default for most studios), you likely want to modify the default instance at `<your-env>/deployment/kubernetes/instances/k8s-default.yaml`.
    :::

    :::warning
    We highly recommend that you use a [Secrets provider](../features/secrets/overview.md) to store the `kubeconfig` contents.
    :::

1. Reference `config/node/default/deployment/kubernetes/instances/redwoodBase.yaml` (or the [deployment config reference](../configuration/reference/deployment.md)) to see if there are any variables you'd like to change by overriding them in your own `deployment/kubernetes/instances/<instance>.yaml` file.

    You'll likely want to modify the `region` config variables. The region `name` and `ping` are what the game client receives from **Get Regions** (`URedwoodClientGameSubsystem::GetRegions`): the client measures latency to the `ping` address (an ICMP ping for a hostname or IP, or a websocket ping if it starts with `ws`), and `name` is what matchmaking uses. For example:

    ```yaml
    region:
      provider-id: "sfo3"
      name: "US West"
      ping: "${director.frontend.connection.external.host}" # this may not measure the cluster's latency if you're using Cloudflare proxying (the default with the Cloudflare DNS provider)
    ```

### Database

Config envs that inherit from `production` are configured to use an external PostgreSQL database (`deployment.kubernetes.instances.<instance>.dependencies.postgresql.useExternalDb: true`; note this section keeps its original camelCase names). Redwood will not provision the managed database, nor create the credentials or initial database, but it will migrate/initialize the schemas and tables when you deploy (you'll be asked to confirm migrations unless you pass `--migrate-db-without-confirmation`). We highly recommend using a managed database configured with backups/snapshots.

:::note
If you want to keep using the Helm chart that installs PostgreSQL in your cluster like in local deployment, note that it has not been optimized for production and it's configured to delete its data when destroyed, as there's no persistent volume configured. You can find all the available configuration values in `config/node/default/deployment/dependencies/postgresql.yaml` (the [ArtifactHUB page](https://artifacthub.io/packages/helm/bitnami/postgresql) is also a helpful resource for figuring out what you can supply in the `values` object). You will **definitely** be "on your own" to figure this one out unless you purchased dedicated support from us.
:::

### Default Secrets Check

Production-like environments refuse to deploy while any secret still has the placeholder value that ships in `config/node/default`. This is controlled by `environment.check-for-default-secrets.enabled`, which the `staging` environment (and therefore `production`) turns on. The list of checked variables is `environment.check-for-default-secrets.keys`.

When the check fails, `yarn deploy` logs the offending config variables and exits before changing anything. You can run the same check without deploying:

```bash
yarn check-secrets <your-prod-config-env>
```

The check is smart about features you don't use; for example, the Cloudflare token is only checked if you use the Cloudflare DNS provider, and a realm's secrets are only checked if the realm is `deployed`. Values that come from a [secrets provider](../features/secrets/overview.md) are resolved first, so a secret that resolves to the placeholder value is also caught.

:::caution Known issue (5.0.0)
The authentication provider secrets (`auth.steam.api-key`, `auth.jwt.secret`, `auth.discord.client.secret`, and `auth.twitch.client.secret`) are currently never checked, even if you enable those providers. Double check them yourself.
:::

## Creating a Kubernetes Cluster

Redwood used to provision a Kubernetes cluster for you in older versions, but this was restrictive as it required us to implement an integration for every cloud provider. Starting in version 4.0, Redwood no longer provisions a Kubernetes cluster or the associated node pools for you. This gives you ultimate flexibility of where you want to deploy your cluster.

### Cluster Hardware

You are encouraged to determine your own cluster needs, which will primarily depend on your game server and expected CCUs (concurrent users). Game servers usually have dedicated CPUs and not shared CPUs as it can cause hitching, but you're welcome to try using shared CPUs.

As a reference point, our past demo environments ran on DigitalOcean using standard Dedicated CPU nodes with **4 vCPU and 8 GB RAM** each, and **2 nodes total** handled the backend plus a handful of game servers with light traffic.

### Unmanaged Options

These options are solutions where you manually configure the cluster. This enables you to host at home or to leverage more affordable bare metal hosting options.

- [Talos](https://www.talos.dev/)
- [K0s](https://k0sproject.io/)
- [K3s](https://k3s.io/)
    - You need to disable the default Traefik ingress controller (Redwood installs ingress-nginx); you can do this during install `curl -sfL https://get.k3s.io | sh -s - --disable=traefik` or modify `/etc/systemd/system/k3s.service` to add the `--disable=traefik` argument to the `server` command if you already have it installed.

### Managed Options

These are just some of the more popular managed cloud options; you don't have to manually provision the nodes in the cluster and the control plane is already set up for you. These are more straightforward to use, but you are limited to hosting on their cloud platform.

- [DigitalOcean](https://www.digitalocean.com/products/kubernetes)
- [AWS](https://aws.amazon.com/eks/)
- [Google Cloud](https://cloud.google.com/kubernetes-engine)
- [Azure](https://azure.microsoft.com/en-us/products/kubernetes-service)
- [Linode](https://www.linode.com/products/kubernetes/)

## Creating a Container Registry

Redwood does not create a Container Registry for you. There are several options, but we recommend creating one with the cloud provider that hosts your [cluster](#creating-a-kubernetes-cluster). Further, we highly recommend that the registry is hosted in the same region as your main backend cluster to reduce bandwidth costs and improve transfer speeds.

- [DigitalOcean](https://www.digitalocean.com/products/container-registry)
- [AWS](https://aws.amazon.com/ecr/)
- [Google Cloud](https://cloud.google.com/artifact-registry)
- [Azure](https://azure.microsoft.com/products/container-registry)

Make sure you update `docker.yaml` in your config env that you created above with the proper container registry details.

## Building and Pushing Docker Images

When you deploy to a config env that inherits from the `production` or `staging` config envs, the Docker images are no longer automatically built for you (`docker.build-in-pulumi: false`). This is a workflow choice as in production-like environments you will want to be explicit about which version is deployed based on a Docker image tag.

We've provided a separate `yarn docker <config-env>` script just for building Docker images and pushing them to your configured [container registry](#creating-a-container-registry); below you can find all the options (or run `yarn docker --help` yourself):

```bash
$ yarn docker --help
Usage: yarn docker [options] <config-environment>

Script for building, tagging, and pushing Redwood Docker images

Arguments:
  config-environment           The folder of the config environment located in `config/node` you want to use

Options:
  -t, --tag <tag>              Docker tag to use, otherwise the tag in the configuration will be used
  -l, --latest                 Also tag the image as 'latest' in the registry
  -o, --overwrite <overwrite>  Specify whether or not you want to overwrite existing images in the registry with the same tag. Set to 'true' or 'false'. If set to false, existing images will be
                               skipped and the script will continue.
  -s, --skip-push              Skip pushing images to the registry
  -i, --images <images...>     Optionally provide a CSV of image names to build, otherwise all will be built, can be a substring of the full image name (default: [])
  -h, --help                   display help for command
```

There are a lot of options here for flexibility, but we generally only use the `-t, --tag <tag>` and `-l, --latest` options. Here's our typical flow:

1. Build the backend into the prepackaged binaries:

    <Tabs>
      <TabItem value="standard" label="Standard License" default>
        The Standard License includes the prepackaged Linux binaries in `dist/linux-microservices`. If you modified the `packages/match-function` source, rebuild that binary:

        ```bash
        yarn build && yarn pkg:match-function
        ```

        If you didn't modify the `match-function`, you can skip this.
      </TabItem>
      <TabItem value="source" label="Custom License">
        The full source code does not come with prepackaged binaries; you must run this to generate them:

        ```bash
        yarn pkg
        ```
      </TabItem>
    </Tabs>

1. Make sure you have the respective up-to-date `LinuxServer` folder(s) located in `dist/game-servers` (see [Packaging](./packaging.md#copying-the-server-to-the-backend)).

    :::info
    Don't forget that you can change your [realm instance config](../configuration/realm-instance-config.md) to change the `game-servers.local-dir` variable. This is useful if you want to ensure your production environment uses a different dedicated server build than what you use for local Kubernetes deployment.
    :::

1. Change the `image-tag` variables found in your production env's `director.yaml` and `realm/instances/*.yaml` files (including `game-servers.image-tag`) to a new version (see above, they're set to `1.0.0` now)

1. Run the `yarn docker` command:

    ```bash
    yarn docker <config-env>
    ```

    :::info
    You may want to use the `--latest` (or `-l` shorthand) option; we generally do so that if you do a `docker pull` command on the image name without the tag you'll retrieve the `latest` tag. You may not want to use `--latest` if you're testing a release candidate or just testing a set of changes in a staging environment.
    :::

    :::note
    Make sure you review all the options of `yarn docker` for different use cases. For example, if you only want to push a new game server image because there were no changes to the backend, you can use the `--images <images...>` option. If you're using the default image names, this _might look like_ `--images game-server` since you don't need to provide the full image name.
    :::

    The script prints each image as it goes (checking the registry, building, pushing, and tagging `latest` if requested). With the production environments you'll typically see three images: `<prefix>-core-runner` (all of the Director and Realm services), `<prefix>-match-function` (only if a realm uses Open Match), and `<prefix>-game-server` (your Unreal server and the sidecar).

1. Verify your container registry is now showing the latest tagged images

1. If, for whatever reason, you used the `-t, --tag <tag>` option instead of updating `image-tag` variables in the prior step, make sure that you update the `image-tag` variables with the correct tags before continuing below.

## Deploying

Once everything is properly configured, deploying is just calling `yarn deploy`; note that provisioning all the resources in the cloud will take a while.

```bash
yarn deploy <your-prod-config-env>
```

All of the `yarn deploy` options are listed in [Deploying Locally](./deploying-locally.md#deploy-options).

## Testing

Testing is the same as [deploying locally](./deploying-locally.md#testing); the only difference is you'll use a different `Director Uri` that matches your `director.frontend.connection.external` connection details (e.g. `wss://director.yourgame.com`).
