---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deploying to the Cloud

:::warning
You need to follow the steps to **[deploy locally](../deploying-to-kubernetes/deploying-locally.md)** before attempting to deploy to a cloud provider as that section covers some common configuration changes that this section extends on.
:::

The main differences for deploying to a cloud provider instead of locally are:

- Adding a credential for Pulumi to authenticate with that provider
- Adding the necessary Redwood configuration to create and publish the necessary Docker images
- Need to consider that the Docker images need to be uploaded to a Container Registry

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

1. Override some of the configuration variables in this new production config environment.

    - **`main-container-registry`**

        **Type**: `string`

        The `main-container-registry` variable is the full hostname/path of the Container Registry you'll use. Docker images for [each of the microservices](../architecture/overview.md) are stored here for the Kubernetes cluster to access when starting a Pod. Currently, Redwood will not create a Container Registry for you, so you need to [create one yourself](#creating-a-container-registry).

        ##### Example

        Inside `./_index.yaml`, an example would look like:

        ```yaml
        main-container-registry: "registry.digitalocean.com/incanta-generic-cr"
        ```

    - **`realm.connection.backend.game-server-access`**

        **Type**: `object`

        The `realm.connection.backend.game-server-access` variable is used by the Sidecar application in game servers inside the current realm to connect to the Realm Backend service. This route would be different for every Realm

        :::info
        Redwood does not automatically configure DNS. You will need create/update the DNS record for this hostname after Pulumi finishes deploying the application.
        :::

        ##### Example

        If you were to put this in `./realm.yaml`, an example would look like:

        ```yaml
        connection:
          backend:
            game-server-access:
              host: "backend.redwoodmmo.com"
              port: "443"
              tls: true
        ```

    - **`deployment.kubernetes.main-region`**

        **Type**: `object`

        The `deployment.kubernetes.main-region` variable defines which region to deploy the Redwood backend to as well as the publicly accessible endpoint for clients to ping to determine their latency to game servers in this region.

        :::note
        `deployment.kubernetes.main-region.ping` can be left as an empty string if you're not using `"agones"` for `game-servers.provider` (which is the default value).
        :::

        ##### Example

        If you were to put this in `./deployment/kubernetes.yaml`, an example would look like:

        ```yaml
        main-region:
          name: "nyc1"
          ping: "nyc1.redwoodmmo.com"
        ```

        :::note
        `main-region.ping` is unused if you're using Hathora game servers. However, we suggest putting something here incase you switch to using Agones later on. You don't need to set up the DNS records now, but if you omit the `ping` line, `127.0.0.1` will be used and you won't necessarily get an error knowing you need to change the config variable. Otherwise, if you put some placeholder here for now, clients will try to use it when you switch to Agones, but their pings will fail alerting you to add the appropriate DNS records.
        :::

    - **`deployment.redwood.hostname`**

        **Type**: `string`

        The `deployment.redwood.hostname` variable is the publicly accessible hostname for reaching the Director Frontend service. This cannot be an IP address since you won't know the IP before deployment (it's generated during deployment).

        :::info
        Redwood does not automatically configure DNS. You will need create/update the DNS record for this hostname after Pulumi finishes deploying the application.
        :::

        ##### Example

        If you were to put this in `./deployment/redwood.yaml`, an example would look like:

        ```yaml
        hostname: "demo.redwoodmmo.com"
        ```

## Pulumi Configuration

### Configuring Redwood to use the Production Pulumi Stack

To extend on the [base configuration you created when deploying locally](../deploying-to-kubernetes/deploying-locally.md#pulumi-configuration) of the `environments.json` file for Pulumi, we now need to add a `production` key to that file using the production configuration environment you created [above](#redwood-configuration).

```json
{
  "development": {
    // ...
  },
  "production": {
    "stack": "<pulumi-org-name>/<project-name>/prod",
    "config": "<production-config-environment>"
  }
}
```

**For example:**

```json
{
  "development": {
    "stack": "incanta/redwood-demo/dev-mike",
    "config": "redwood-demo-kubernetes"
  },
  "development": {
    "stack": "incanta/redwood-demo/prod",
    "config": "redwood-demo-prod"
  }
}
```

### Provider Credentials

When deploying to a cloud provider, you need to give access to the Pulumi CLI to provision resources on your behalf. Pulumi will store these secrets in a `Pulumi.<stack-name>.yaml` as encrypted strings. For now, you can simply just have this file not committed to version control, but if you want to share this file, you should [familiarize yourself with how Pulumi secrets/encryption work](https://www.pulumi.com/docs/concepts/secrets/). Note that some of these credentials are **personal** access tokens, which, if shared, can give other members of your team access to personal account APIs.

<Tabs>
  <TabItem value="digitalocean" label="DigitalOcean" default>
    1. Create a [Personal Access Token](https://cloud.digitalocean.com/account/api/tokens) with both `Read` and `Write` permissions
    1. In a terminal, navigate to the `packages/deployment` folder under the Redwood Backend directory
    1. Create an encrypted version of the access token for Pulumi to use (don't forget the `--secret` flag at the end!):

        ```bash
        pulumi config --stack <pulumi-org-name>/<project-name>/prod set digitalocean:token --secret <token generated in step 1>
        ```

    1. This should create a `Pulumi.prod.yaml` file in the `packages/deployment` folder with the encrypted secret

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

## Creating a Container Registry

Redwood does not create a Container Registry for you. There are several options, but we recommend creating one with the cloud provider you'll be hosting the backend on. Further, we highly recommend that the registry is hosted in the same region as your main backend cluster to reduce bandwidth costs and transfer speeds.

- [DigitalOcean](https://www.digitalocean.com/products/container-registry)
- [AWS](https://aws.amazon.com/ecr/)
- [Google Cloud](https://cloud.google.com/artifact-registry)
- [Azure](https://azure.microsoft.com/products/container-registry)

:::note
Do note that only DigitalOcean is [officially supported currently](../support/roadmap.md#infrastructure-as-code-iac).
:::

## Deploying

Once everything is properly configured, deploying is fairly similar to the [local deployment](#deploying).

1. Transpile the TypeScript into JavaScript; even if you don't think you changed source files, it's a good habit to get into.

    ```bash
    yarn build
    ```

<!-- TODO MIKE HERE:
- We need to make sure we configure redwood to use the external db
- Prisma migrate the database, but with the non-private url?
- for DO we need to add the k8s cluster as a trusted source for the db?
-->

1. If you're on the Full Version of Redwood, you need to package all of the microservice packages

    :::info
    Skip this step if you're using the Evaluation Version.
    :::

    ```bash
    yarn pkg
    ```

1. Deploy the Redwood backend by running the below command:

    ```bash
    yarn up:prod
    ```

1. Deploying to the cloud will take significantly longer than deploying locally. You need to upload server images, the cloud provider needs to provision you servers, and other processes take longer. However, the Pulumi output will be similar to a [local deployment](../deploying-to-kubernetes/deploying-locally.md#deploying).

## Testing

<!-- TODO MIKE HERE -->

:::danger
We're still working on this section; thanks for your patience!
:::
