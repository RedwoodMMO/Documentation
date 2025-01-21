---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deploying Locally

:::danger
Make sure you have a Redwood-specific version of Rancher Desktop; it will have `(Redwood)` listed in the title and versions. If you don't have these, you'll need to follow the [steps on uninstalling the current version and installing the new version](./prerequisites.md#rancher-desktop).

<details>
    <summary>How to check if you have the Redwood version</summary>

    ![Redwood label in Rancher Desktop versions](/img/rancher-desktop-redwood-version.jpg)
</details>
:::

Deploying Redwood uses the provided [Infrastructure-as-Code (IaC)](https://learn.microsoft.com/devops/deliver/what-is-infrastructure-as-code); the same workflow is used to deploy to a local development [Kubernetes](https://kubernetes.io/) cluster as well as production ones.

If you installed all of the [prerequisites](./prerequisites.md) properly, you're ready to test deploying the Redwood backend to your local Kubernetes cluster (which Rancher Desktop hosts within WSL). Altogether, this setup gives us a Linux environment that has Docker and Kubernetes, which is very similar to what [deploying to a cloud provider](./deploying-remotely.md) would look like.

## Redwood Configuration

While it's not strictly required to set up a configuration environment for development for just getting started, it will be convenient to have it when you inevitably want to change something.

1. Create a new folder in `config/node` for the Kubernetes dev environment (e.g. `redwood-demo-kubernetes` [k8s is a common abbreviation for Kubernetes])
1. Create a `_config.json` file in that folder (e.g. `config/node/redwood-demo-kubernetes/_config.json`) with the `parentNames` pointing to the provided `kubernetes` environment **and** the environment folder you created earlier.

    **For example:**

    ```json
    {
      "parentNames": ["kubernetes", "redwood-demo"]
    }
    ```

    :::warning
    The order matters! The config system will read read these envs in order, overriding variables that were previously read in. You need to have `kubernetes` before your config env as shown above.
    :::

    :::note
    You might have started to noticed the inheritance pattern we've been introducing for configuration. In our examples, we have the config env `redwood-demo-kubernetes` inherit from `redwood-demo`. Later, when we [deploy to a cloud](./deploying-remotely.md#redwood-configuration), you'll see that we'll introduce a config env `redwood-demo-production` that inherits from `redwood-demo-kubernetes`. This pattern isn't required, but it can prevent issues where a config variable was added for development but not for production.

    You can read more about **[configuration inheritance here](../configuration/overview.md#config-environment-inheritance)**.
    :::

1. The documentation _used_ to have you override `realm.instances.default.game-servers.provider` to `"local"` in your [base config environment](../getting-started/installing.md#initial-configuration), but this override is actually redundant and conflicts with the `kubernetes` parent config environment. You can either remove it from your original config (e.g. `config/node/redwood-demo/realm/instances/default.yaml`) or override it in this new config environment (e.g. `realm-demo-kubernetes`) such that the associated config variable`realm.instances.default.game-servers.provider` is set to `"agones"`.

### Pulumi Configuration

Pulumi can run in different modes:
- Storing the Pulumi state locally
    - This is the default for easy onboarding, but you should consider other options for teams and nearing launch
- Storing in another [self-managed backend](https://www.pulumi.com/docs/iac/concepts/state-and-backends/#using-a-self-managed-backend) (e.g. S3, Azure Blob Storage, or Google Cloud Storage)
- Storing the Pulumi state in an instance of [Pulumi Cloud](https://www.pulumi.com/product/pulumi-cloud/)

:::info
By default, Redwood is configured to store the Pulumi state locally, which is just fine when you're getting started. You may want to consider switching to use Pulumi Cloud (you can self-host or use Pulumi's managed service that's [very affordable with a great free tier](https://www.pulumi.com/pricing/)). We prefer using Pulumi Cloud over the other self-managed options like S3 due to the better integration and auditable records. However, having a shareable backend state is critical for teams and ensuring that your Pulumi deployment state isn't lost in the event of a personal computer loss.
:::

1. In the folder you created above, create a `deployment/pulumi.yaml` file (e.g. `config/node/redwood-demo-kubernetes/deployment/pulumi.yaml`) with the contents:

    ```yaml
    project: "<project-name>"
    ```

    **For example:**

    ```yaml
    project: "redwood-demo"
    ```

    :::note
    If you're using Pulumi Cloud, you'll also need to add to the file:

    ```yaml
    local-mode: false
    org: "<pulumi-org-name>"
    ```

    Redwood is pre-configured to work with Pulumi's managed service when `local-mode` is `false`, but if you are **self-hosting** Pulumi Cloud, you can also change the URL to your Pulumi Cloud instance:

    ```yaml
    url: "https://yourpulumicloud.com"
    ```
    :::

    :::note
    Some IDEs (e.g. VSCode) will error about `pulumi.yaml` having a syntax error because it's referring to another schema that Pulumi has for files named `pulumi.yaml`. You can prevent this, at least in VSCode, by adding this line to the top of the file:

    ```yaml
    # yaml-language-server: $schema=./pulumi.yaml
    ```
    :::

## Deploying

Deploying locally for basic configurations is fairly straight forward:

1. Ensure Rancher Desktop is running
1. Open a terminal to the `RedwoodBackend` directory
1. Install the NodeJS dependencies by running the below command:

    ```bash
    yarn
    ```

    :::note
    `yarn` will automatically trigger a build, but you can recompile manually by running `yarn build`.
    :::

1. **Skip this if you have a Standard License of Redwood.** If you have access to the full source code of Redwood, you need to package the [sidecar](../architecture/overview.md#sidecar):

    ```bash
    yarn pkg:sidecar
    ```

1. Create the folder `game-servers` in `RedwoodBackend/dist` if it doesn't exist

1. Copy the folder generated when you [packaged the Linux Server](./packaging.md#dedicated-server-build) to `RedwoodBackend/dist/game-servers`; it will have the name `LinuxServer`

    <!-- ![Copying the LinuxServer folder to the dist folder](/img/copying-linux-server-to-dist.jpg) -->

1. Deploy the Redwood backend by running the below command:

    ```bash
    yarn deploy <config-environment>
    ```

    Where `<config-environment>` is the [folder you created above](#redwood-configuration) (e.g. `redwood-demo-kubernetes`).

    This command will do the following:

    1. Create the necessary Docker images
    1. Deploy the necessary dependencies to the local Kubernetes cluster
    1. Deploy the Redwood images to the local Kubernetes cluster

    :::note
    Docker images are not automatically created in `yarn deploy` if you're inheriting from the `staging` or `production` configuration environments. You will need to use the `yarn docker` command beforehand to create them. You can read more about this in [**Deploying to the Cloud**](./deploying-remotely.md#TODO).
    :::

1. You may be prompted if you want to create the configured Pulumi stack. By default the stack is `dev`, but you can override this in the [above `pulumi.yaml` file](#pulumi-configuration) with `stack: "<stack-name>"`. If the name of the stack looks right, press the `Enter` key.

1. Pulumi will start generating a preview of the deployment; no changes are made and you'll be prompted if the proposed changes should be applied. Press the `Up` arrow to select `yes` and press the `Enter` key:

    ```bash
    Created stack 'incanta/dev-mike'
    Previewing update (incanta/dev-mike)

    View in Browser (Ctrl+O): https://app.pulumi.com/incanta/redwood-demo/dev-mike/previews/2f235049-fc1c-49c7-9172-f20f374aed82

        Type                                                     Name                                     Plan
    +   pulumi:pulumi:Stack                                      redwood-demo-dev-mike                    create
    +   ├─ docker:index:Image                                    yourcr.com/container/redwood-dev-image   create
    +   ├─ docker:index:Image                                    yourcr.com/container/game-server-image   create
    +   ├─ pulumi:providers:kubernetes                           k8s-provider-local                       create
    +   ├─ kubernetes:core/v1:ConfigMap                          game-server-config-map-local             create
    +   ├─ kubernetes:helm.sh/v3:Release                         redis                                    create
    +   ├─ kubernetes:helm.sh/v3:Release                         ingress                                  create
    +   ├─ kubernetes:helm.sh/v3:Release                         open-match                               create
    +   ├─ kubernetes:helm.sh/v3:Release                         mongo                                    create
    +   ├─ kubernetes:helm.sh/v3:Release                         agones-local                             create
    +   ├─ kubernetes:core/v1:ConfigMap                          director-frontend-config-map-local       create
    +   ├─ kubernetes:core/v1:ServiceAccount                     realm-backend-account-local              create
    +   ├─ kubernetes:core/v1:ConfigMap                          director-backend-config-map-local        create
    +   ├─ kubernetes:rbac.authorization.k8s.io/v1:Role          gameservers-allocations-role-local       create
    +   ├─ kubernetes:core/v1:ConfigMap                          match-function-config-map-local          create
    +   ├─ kubernetes:networking.k8s.io/v1:Ingress               director-ingress-local                   create
    +   ├─ kubernetes:agones.dev/v1:Fleet                        agones-fleet-local                       create
    +   ├─ kubernetes:apps/v1:StatefulSet                        director-frontend-local                  create
    +   ├─ kubernetes:autoscaling.agones.dev/v1:FleetAutoscaler  agones-fleet-autoscaler-local            create
    +   ├─ kubernetes:apps/v1:StatefulSet                        match-function-local                     create
    +   ├─ kubernetes:rbac.authorization.k8s.io/v1:RoleBinding   read-gameservers-write-allocation-local  create
    +   ├─ kubernetes:core/v1:Service                            director-frontend-debug-local            create
    +   ├─ kubernetes:core/v1:Service                            director-frontend-local                  create
    +   ├─ kubernetes:core/v1:Service                            match-function-debug-local               create
    +   ├─ kubernetes:core/v1:Service                            match-function-local                     create
    +   ├─ kubernetes:apps/v1:StatefulSet                        director-backend-local                   create
    +   ├─ kubernetes:core/v1:Service                            realm-backend-local                      create
    +   ├─ kubernetes:core/v1:Service                            director-backend-debug-local             create
    +   └─ kubernetes:core/v1:Service                            director-backend-local                   create
    Outputs:
        k8sId: "Local Deployment"

    Resources:
        + 29 to create

    Do you want to perform this update?  [Use arrows to move, type to filter]
      yes
    > no
      details
    ```

    :::note
    You can skip Pulumi previews with the `-s` or `--skip-preview` arg or still see the preview but automatically accept it with `-y` or `--yes`.
    :::

1. The deployment will be finished when the output stops changing and you see the final output similar to the below:

    ```bash
    Outputs:
        k8sId: "Local Deployment"

    Resources:
        + 32 created

    Duration: 2m8s
    ```

## Testing

### Connection

When you're using Kubernetes to host the backend instead of the Dev Initiator, the client no longer connects to the backend on port `3001`. Instead, hostnames are used to figure out which microservice a request is supposed to route to. This is why we needed to set up our `director.localhost`/etc [hosts in Getting Started](../getting-started/installing#configure-hosts-file). This means you need to change the `Director Uri` setting that the client connects to.

You can do this in your UE project's **Project Settings** under **Redwood** in the **Plugins** section. You'll find a variable named `Director Uri`; it needs to be changed to:

```
ws://director.localhost
```

:::info
If you need to change the Director Uri setting for a packaged build, we've added a quick method to do this without messing with the `Saved` dir.

Create a file named `redwood.json` in the project folder in your client packaged build (i.e. `path-to-packaged-build/Windows/YourProject/redwood.json`); this should be the same folder where you see `Binaries` and `Content` folders. Set the contents fo the file to:

```json
{
  "directorUri": "ws://director.localhost"
}
```
:::

### Running a Test

Testing the backend in a Kubernetes environment (locally or [remotely](./deploying-remotely.md)) are very similar. For match-based games (like the Shooter Template), you can get a game server running by doing matchmaking or lobby generation. For persistent games (like the RPG Template), you'll still need to use the same `yarn cli create-admin ...` and `yarn cli create-proxy ...` [commands that you used when running the backend via the Dev Initiator](../getting-started/running-with-backend.md#running-the-game) to startup a persistent server.

## Deploying to the Cloud

:::success
You now have a local Kubernetes cluster that hosts the same microservices that get deployed a production environment on the cloud. Most of your development and testing will be done locally, but it's important to test deploying to the cloud well before it's time to release your game.

Whenever you're ready to test deploying to the cloud, you can read more about it **[here](./deploying-remotely.md)**.
:::