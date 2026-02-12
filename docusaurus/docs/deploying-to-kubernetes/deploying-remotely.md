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

- Adding a kubeconfig for Pulumi to authenticate with the remote Kuberenetes cluster
- Adding the necessary Redwood configuration to create and publish the necessary Docker images
- Need to consider that the Docker images need to be uploaded to an externally-hosted Container Registry

## Redwood Configuration

1. Create a new configuration environment that inherits from the `staging` or `production` environment presets **and** the configuration environment you created [when you deployed locally](../deploying-to-kubernetes/deploying-locally.md#redwood-configuration):

    `config/node/<production-config-environment>/_config.json`:
    ```json
    {
      "parentNames": ["production", "<project-kubernetes-config-environment>"]
    }
    ```

    **For example:**
    `config/node/redwood-demo-production/_config.json`:
    ```json
    {
      "parentNames": ["production", "redwood-demo-kubernetes"]
    }
    ```

1. Add a `deployment/_index.yaml` fil in your config env that has the below contents:

    ``` yaml
    cloud: "custom"
    ```

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
    You need to use an external Container Registry for your images. You can use [Docker Hub](https://hub.docker.com/), [GitHub Packages](https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry), or deploy your own; many cloud providers provide an easy to deploy option.
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
          password: "<password>"

        # this is what your local machine uses, so if you may need to use different public connection details
        # you might also need to add your IP address to the firewall for the database
        deployment-access:
          host: "<your-external-postgresql-db-host>"
          port: 5432
          database: "<database-name>"
          user: "<username>"
          password: "<password>"

    backend:
      connection:
        # this is publicly facing connection details for the director backend
        # which is primarily used to authenticate external realms (i.e. realms
        # in other clusters or player-hosted realms)
        external:
          host: "demos-director-backend.redwoodmmo.com" # this must be a FQD hostname, it cannot be an IP
          port: 443
          tls: true

    frontend:
      # this is the publicly facing connection details for the director frontend
      # which is used by all clients when they launch the game
      connection:
        external:
          host: "demos-director-frontend.redwoodmmo.com" # this must be a FQD hostname, it cannot be an IP
          port: 443
          tls: true
    ```

1. Add an override files for each of your [Realm Instance Configs](../configuration/realm-instance-config.md). If you kept the default and didn't add new realms, this should be at `realm/instances/default.yaml`

    ```yaml
    image-tag: "1.0.0"

    persistence:
      database:
        runtime-access:
        # this is what the cluster uses. if you're deploying the cluster to the same region/datacenter as your database
        # there may be faster, private connection details
        runtime-access:
          host: "<your-external-postgresql-db-host>"
          port: 5432
          database: "<database-name>"
          user: "<username>"
          password: "<password>"

        # this is what your local machine uses, so if you may need to use different public connection details
        # you might also need to add your IP address to the firewall for the database
        deployment-access:
          host: "<your-external-postgresql-db-host>"
          port: 5432
          database: "<database-name>"
          user: "<username>"
          password: "<password>"

    backend:
      # this is publicly facing connection details for this realm backend
      # which is primarily used if you're using an external game server
      # hosting provider (e.g. Hathora) so the sidecar can reach/authenticate
      # with the backend
      connection:
        external:
          host: "demos-rpg-realm-backend.redwoodmmo.com" # this must be a FQD hostname, it cannot be an IP
          port: 443
          tls: true

    frontend:
      # this is the publicly facing connection details for this realm frontend
      # which is used by all clients in the main menu to authenticate and join the realm's
      # servers/matchmaking
      connection:
        external:
          host: "demos-rpg-realm-frontend.redwoodmmo.com" # this must be a FQD hostname, it cannot be an IP
          port: 443
          tls: true

    game-servers:
      image-tag: "1.0.0"
    ```

1. Create `deployment/pulumi.yaml` in your config env, using the below as a template:

    ```yaml
    # yaml-language-server: $schema=./pulumi.yaml
    # The above comment prevents VSCode yaml language server
    # from thinking this should follow the Pulumi.yaml schema that
    # Pulumi CLI uses.

    # It's recommended to use an instance of Pulumi Cloud for production environments, which the below does
    local-mode: false
    access-token: "<pulumi-token>" # Get one by following https://www.pulumi.com/docs/pulumi-cloud/access-management/access-tokens/
    org: "<your-pulumi-org>"

    stack: "prod" # at a minimum add this variable to differentiate with the default `dev` stack
    ```

1. Consider how you're going to handle DNS. Redwood comes with an integration with Cloudflare by creating `deployment/dns.yaml` with the below template:

    ```yaml
    provider: "cloudflare"

    cloudflare:
      credentials:
        account-id: "<your-account-id>" # https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/
        token: "<cloudflare-api-token>" # https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
    ```

    :::warning
    If you don't use this Cloudflare integration, you will need to configure your DNS manually to point to the external connection hostnames you configured above.
    :::

1. Add the `kubeconfig` to corresponding `config/node/yourenv/deployment/kubernetes/instances/<instance>.yaml`:

    ``` yaml
    kubeconfig: "<the contents of a kubeconfig file>"
    ```

    <details>
      <summary>This is retrieved after you provision your own Kubernetes cluster in a later step. Below are some hints to point you in the right direction, but contact your cloud provider/cluster software support if you need more help.</summary>

      #### Talos

      See [the official docs](https://docs.siderolabs.com/talos/v1.11/getting-started/getting-started#step-10%3A-get-kubernetes-access) (please note the link may be pointing to an outdated page).

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

      1. Add an entry to your local `~/.kube/config` file using the [glcoud CLI](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl#store_info)
      1. List the contexts: `kubectl config get-contexts`
      1. Switch to your gcloud context: `kubectl config set-context <context-id>`
      1. Export the `kubeconfig`: `kubectl config view --minify --flatten > kubeconfig.yaml`

      #### Linode

      Run `linode-cli lke kubeconfig-view $clusterID --text | sed 1d | base64 --decode > kubeconfig.yaml`.
    </details>

    :::note
    If you're still only using one Kubernetes cluster (default for most studios), you likely want to modify the default instance at `config/node/yourenv/deployment/kubernetes/instances/k8s-default.yaml`.
    :::

    :::warning
    We highly recommend that you use a [Secrets provider](../features/secrets/overview.md) to store the `kubeconfig` contents.
    :::

1. Reference `config/node/default/deployment/kubernetes/redwoodBase.yaml` to see if there are any variables you'd like to change by overriding in your own `deployment/kubernetes/<instance>.yaml` file.

You'll likely want to modify the `region` config variables. The `name` and `ping` variables are what's used in the `GetRegions` call in `URedwoodClientGameSubsystem`. Here's an example we use in one of our prod envs:

    ```yaml
    region:
      provider-id: "sfo3"
      name: "US West"
      ping: "${director.frontend.connection.external.host}" # this might not be correct if you're using CloudFlare proxying (which Redwood uses by default when using the Cloudflare DNS provider)
    ```

1. Config envs that inherit from `production` by default are configured to use an external PostgreSQL database. Redwood will not provision the managed database, nor create the credentials or initial database. Redwood will migrate/initialize the schemas/tables. We highly recommend using a managed database configured with backups/snapshots. If you're using DigitalOcean with a DigitalOcean database, you can override the `dependencies.postgresql.externalDbId` variable in your cluster config (by default this would be at `deployment/kubernetes/instances/k8s-default.yaml`). You can retrieve this ID by just navigating to the database in the admin panel and getting the UUID in the URL. Providing this will write firewall rules for you so that the cluster can access the database.

    :::note
    If you want to keep using the helm chart that installs PostgreSQL in your cluster like in local deployment, you should note it has not been optimized for production and, if you haven't noticed yet when deploying locally, it is configured to delete it's data when destroyed as there's no persistent volume configured. You can find all the available configuration values in `config/node/default/deployment/dependencies/postgresql.yaml` (the [ArtifactHUB page](https://artifacthub.io/packages/helm/bitnami/postgresql) is also a helpful resource for figuring out what you can supply in the `values` object). You will **definitely** be "on your own" to figure this one out unless you purchased dedicated support from us.
    :::

## Creating a Kubernetes Cluster

Redwood used to provision a Kubernetes cluster for you in older versions, but this was restrictive as it required us to implement an integration for every cloud provider. Starting in version 4.0, Redwood no longer provisions a Kubernetes cluster or the associated node pools for you. This gives you ultimate flexibility of where you want to deploy your cluster.

### Cluster Hardware

You are encouraged to determine your own cluster needs, which will primarily depend on your game server and expected CCUs (concurrent users). Game servers usually have dedicated CPUs and not shared CPUs as it can cause hitching, but you're welcome to try using shared CPUs.

Our demo environments are on DigitalOcean using standard Dedicated CPU. Each node has **4 vCPU and 8 GB RAM nodes**. Our RPG & Match environments use **2 nodes total** with very little traffic (for example, we never need to shard).

### Unmanaged Options

These options are solutions that you manually configure the cluster. This enables you to host at home or to leverage more affordable bare metal hosting options.

- [Talos](https://www.talos.dev/)
- [K0s](https://k0sproject.io/)
- [K3s](https://k3s.io/)
    - You need to disable the default Traefik ingress controller; you can do this during install `curl -sfL https://get.k3s.io | sh -s - --disable=traefik` or modify `/etc/systemd/system/k3s.service` to add the `--disable=traefik` argument to the `server` command if you already have it installed.

### Managed Options

These are just some more popular managed cloud options; you don't have to manually provision the nodes in the cluster and the control plane is already set up for you. These are more straight forward to use, but you are limited to hosting on their cloud platform.

- [DigitalOcean](https://www.digitalocean.com/products/kubernetes)
- [AWS](https://aws.amazon.com/eks/)
- [Google Cloud](https://cloud.google.com/kubernetes-engine)
- [Azure](https://azure.microsoft.com/en-us/products/kubernetes-service)
- [Linode](https://www.linode.com/products/kubernetes/)

## Creating a Container Registry

Redwood does not create a Container Registry for you. There are several options, but we recommend creating one with the cloud provider that hosts your [cluster](#creating-a-kubernetes-cluster). Further, we highly recommend that the registry is hosted in the same region as your main backend cluster to reduce bandwidth costs and transfer speeds.

- [DigitalOcean](https://www.digitalocean.com/products/container-registry)
- [AWS](https://aws.amazon.com/ecr/)
- [Google Cloud](https://cloud.google.com/artifact-registry)
- [Azure](https://azure.microsoft.com/products/container-registry)

Make sure you update `docker.yaml` in your config env that you created above with the proper container registry details.

## Building and Pushing Docker Images

When you deploy to a config env that inherits from `production` or `staging` config envs, the Docker images are no longer automatically built for you. This is a workflow choice as in production-like environments you will want to be explicit of which version is deployed based off a Docker image tag.

We've provided a separate `yarn docker <config-env>` script just for building Docker images and pushing them to your configured [container registry](#creating-a-container-registry); below you can find all the options (or by calling `yarn docker --help` yourself):

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
Done in 16.87s.
```

There's a lot of options here for flexibility, but we generally only use the `-t, --tag <tag>` and `-l, --latest` options for the most part. Here's our typical flow:

1. Build the backend into the prepackaged binaries:

    <Tabs>
      <TabItem value="standard" label="Standard License" default>
        If you updated the `packages/match-function` source, you'll need to run the below commands. If you didn't modify the `match-function`, you can skip this.

        ```bash
        yarn build && yarn pkg:match-function
        ```
      </TabItem>
      <TabItem value="source" label="Full Source Code">
        The full source code does not come with prepackage binaries; you must call this to generate them:

        ```bash
        yarn pkg
        ```
      </TabItem>
    </Tabs>

1. Make sure you have the respective up-to-date `LinuxServer` folder(s) located in `dist/game-servers`.

    :::info
    Don't forget that you can change your [realm instance config](../configuration/realm-instance-config.md) to change the `game-servers.local-dir` variable. This is useful if you want to ensure your production environment uses you a different dedicated server build than what you use for local Kubernetes deployment.
    :::

1. Change the `image-tag` variables found in your production env's `director.yaml` and `realm/instances/*.yaml` files to a new version (see above, they're set to `1.0.0` now)

1. Run the `yarn docker` command:

    ```bash
    yarn docker <config-env>
    ```

    :::info
    You may want to use the `--latest` (or `-l` shorthand) option; we generally do so that if you do a `docker pull` command on the image name without the tag you'll retrieve the `latest` tag. You may not want use `--latest` if you're testing a release candidate or just testing a set of changes in a staging environment.
    :::

    :::note
    Make sure you review all the options of `yarn docker` for different use cases. For example, if you only want to push a new game server image because there were no changes to the backend, you can use the `--images <images...>` option. If you're using several defaults, this _might look like_ `--images game-server` since you don't need to provide the full image name.
    :::

    Here's a sample output:

    ```bash
    $ yarn docker redwood-demos-prod -l
    Pulling latest base images...
    Initiating building & pushing 3 images to registry: registry.digitalocean.com at path: incanta-generic-cr

    Image 1/3: redwood-demos-core-runner:3.0.1-4
            Checking registry...
            Building image...
            Pushing image...
            Adding 'latest' tag...

    Image 2/3: redwood-demos-match-function:3.0.1-4
            Checking registry...
            Building image...
            Pushing image...
            Adding 'latest' tag...

    Image 3/3: redwood-demos-game-server-rpg:3.0.1-4
            Checking registry...
            Building image...
            Pushing image...
            Adding 'latest' tag...
    Done in 396.92s.
    ```

1. Verify your container registry is now showing the latest tagged images

1. If, for whatever reason, you used the `-t, --tag <tag>` option instead of updating `image-tag` variables in the prior step, make sure that you update the `image-tag` variables with the correct tags before continuing below.

## Deploying

Once everything is properly configured, deploying is just calling `yarn deploy`; note that provisioning all the resources in the cloud will take awhile.

```bash
yarn deploy <your-prod-config-env>
```

## Testing

Testing is the same as [deploying locally](./deploying-locally.md#testing), the only difference is you'll use a different `Director Uri` to match your `director.frontend.connection.external` connection details.
