---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deploying Remotely

:::warning
You need to follow the steps to **[deploy locally](../deploying-to-kubernetes/deploying-locally.md)** before attempting to deploy to a cloud provider as that section covers some common configuration changes that this section extends on.
:::

The main differences for deploying to a remote cluster instead of locally are:

- Adding a credential for Pulumi to authenticate with that provider
- Adding the necessary Redwood configuration to create and publish the necessary Docker images
- Need to consider that the Docker images need to be uploaded to an externally-hosted Container Registry

## Redwood Configuration

1. Create a new configuration environment that inherits from one of the provided presets based on which cloud provider you are deploying to **and** the configuration environment you created [when you deployed locally](../deploying-to-kubernetes/deploying-locally.md#redwood-configuration):

    <Tabs>
      <TabItem value="digitalocean" label="DigitalOcean" default>
        `config/node/<production-config-environment>/_config.json`:
        ```json
        {
          "parentNames": ["production", "cloud-do", "<project-kubernetes-config-environment>"]
        }
        ```

        **For example:**
        `config/node/redwood-demo-production/_config.json`:
        ```json
        {
          "parentNames": ["production", "cloud-do", "redwood-demo-kubernetes"]
        }
        ```
      </TabItem>
      <TabItem value="aws" label="AWS">
        We're still working on adding an AWS integration.
      </TabItem>
      <TabItem value="azure" label="Azure">
        We're still working on adding an Azure integration.
      </TabItem>
      <TabItem value="google" label="Google Cloud">
        We're still working on adding an Google Cloud integration.
      </TabItem>
    </Tabs>

1. Add a `docker.yaml` file in your config env and use the below as a template, but you should change every variable based on your setup:

    ```yaml
    main-container-registry: "registry.digitalocean.com/incanta-generic-cr"
    image-prefix: "${docker.main-container-registry}/redwood-demos"
    registry-auth:
      username: "<username>"
      password: "<password>"
    ```

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

    # It's recommended to use an instance of Pulumi Cloud, which the below does
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

1. Provide proper authentication for your cloud provider:

    <Tabs>
      <TabItem value="digitalocean" label="DigitalOcean" default>
        1. Create a [Personal Access Token](https://cloud.digitalocean.com/account/api/tokens) with both `Read` and `Write` permissions
        1. In your config env, create the file `deployment/_index.yaml` with the below template:
            ```yaml
            digitalocean:
              token: "<do-token>"
            ```
      </TabItem>
      <TabItem value="aws" label="AWS">
        We're still working on adding an AWS integration.
      </TabItem>
      <TabItem value="azure" label="Azure">
        We're still working on adding an Azure integration.
      </TabItem>
      <TabItem value="google" label="Google Cloud">
        We're still working on adding an Google Cloud integration.
      </TabItem>
    </Tabs>

1. Reference `config/node/default/deployment/kubernetes/_index.yaml` to see if there are any variables you'd like to change by overriding in your own `deployment/kubernetes/_index.yaml` file.

    - Almost certainly, you'll need to update `k8s-version`. You can see available slugs in the Create Cluster menu in DigitalOcean's app or with [this third-party tool](https://slugs.do-api.dev/). These slugs update _frequently_; we usually pick the most recent one when we're deploying a new cluster and then don't change this variable until necessary.
    - We've disabled `auto-upgrade` and `high-availability`, but you may want to consider changing that
    - The `name-prefix` is how the resource is named in DigitalOcean's panel; this is a prefix for the individual cluster names you have defined in `deployment.kubernetes.instances`
    - You shouldn't need to change the firewall options
    - Consider changing the `vm-type`, `min-nodes`, and `max-nodes` to your need; that [third-party tool](https://slugs.do-api.dev/) is really helpful to see the options concisely

1. Config envs that inherit from `production` by default are configured to use an external PostgreSQL database. Redwood will not provision the managed database, nor create the credentials or initial database. Redwood will migrate/initialize the schemas/tables. We highly recommend using a managed database configured with backups/snapshots. If you're using DigitalOcean with a DigitalOcean database, you can override the `dependencies.postgresql.externalDbId` variable in your cluster config (by default this would be at `deployment/kubernetes/instances/k8s-default.yaml`). You can retrieve this ID by just navigating to the database in the admin panel and getting the UUID in the URL. Providing this will write firewall rules for you so that the cluster can access the database.

    :::note
    If you want to keep using the helm chart that installs PostgreSQL in your cluster like in local deployment, you should note it has not been optimized for production and, if you haven't noticed yet when deploying locally, it is configured to delete it's data when destroyed as there's no persistent volume configured. You can find all the available configuration values in `config/node/default/deployment/dependencies/postgresql.yaml` (the [ArtifactHUB page](https://artifacthub.io/packages/helm/bitnami/postgresql) is also a helpful resource for figuring out what you can supply in the `values` object). You will **definitely** be "on your own" to figure this one out unless you purchased dedicated support from us.
    :::

1. You'll may want to change the `region` details for the cluster too; see `config/node/default/deployment/kubernetes/instances/k8s-default.yaml` for more. The `name` and `ping` variables are what's used in the `GetRegions` call in `URedwoodClientGameSubsystem`. At the current time, this may not be super helpful (since Hathora regions are used when using Hathora and ping can be retrieved other ways in Unreal), but it's worth specifying for now. Here's an example we use in one of our prod envs:

    ```yaml
    region:
      provider-id: "sfo3"
      name: "US West"
      ping: "${director.frontend.connection.external.host}" # this might not be correct if you're using CloudFlare proxying (which Redwood uses by default when using the Cloudflare DNS provider)
    ```

## Creating a Container Registry

Redwood does not create a Container Registry for you. There are several options, but we recommend creating one with the cloud provider you'll be hosting the backend on. Further, we highly recommend that the registry is hosted in the same region as your main backend cluster to reduce bandwidth costs and transfer speeds.

- [DigitalOcean](https://www.digitalocean.com/products/container-registry)
- [AWS](https://aws.amazon.com/ecr/)
- [Google Cloud](https://cloud.google.com/artifact-registry)
- [Azure](https://azure.microsoft.com/products/container-registry)

:::note
Do note that DigitalOcean is the only officially supported cloud provider.
:::

Make sure you update `docker.yaml` in your config env that you created above with the proper container registry details.

## Building and Pushing Docker Images

When you deploy to a config env that inherits from `production` or `staging` config envs, the Docker images are no longer automatically built for you. This is a workflow choice as in production-like environments you will want to be explicit of which version is deployed based off a Docker image tag.

We've provided a separate `yarn docker <config-env>` script just for building Docker images and pushing them to your configured [container registry](#creating-a-container-registry); below you can find all the options (or by calling `yarn docker --help` yourself):

```bash
$ yarn docker --help
yarn run v1.22.19
$ ts-node packages/deployment/src/docker/script.ts --help
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
    yarn run v1.22.19
    $ ts-node packages/deployment/src/docker/script.ts redwood-demos-prod -l
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
