---
sidebar_position: 2
---

# Typical Structure

For typical use, we don't recommend modifying any of the distributed configuration environments as it makes it easier for you to receive updates to the backend without merging your changes with ours. However, Redwood comes with the full source code so you have ultimate flexibility. If you need to add a config variable or change defaults for the `production` environment, there's no technical reason not to, just an extra operational hoop to jump through during updates.

With that said, together with flexible [customization](./overview.md#customization) and [inheritance](./overview.md#config-environment-inheritance), we believe that the majority of the time you just need to override the value of a configuration variable.

We alluded to how we structure our live games in [the inheritance section](./overview.md#multiple-parents), but in this section we provide an example what we have used for some of our demo live games.

:::note
Your game may require a more complex setup. You may need environments that are specific to different teams, hosted staging environments for release-candidate builds, and more.
:::

## Base Configuration Environment

We define a config environment for the game and name that folder just the name of the title. We use this for common attributes for the game that are used in all environments. We typically use this environment directly for testing locally without Kubernetes.

We created this environment in the [Getting Started](../getting-started/installing.md#initial-configuration) section; our example called this environment `project-name`.

## Kubernetes Configuration Environment

This configuration environment is used for local Kubernetes development, inheriting from the [base configuration](#base-configuration-environment). It defines common values for both local and cloud Kubernetes deployments, but is typically used directly for local deployments.

We created this environment in the [Deploying to Kubernetes | Deploying Locally](../deploying-to-kubernetes/deploying-locally.md#redwood-configuration) section; our example called this environment `redwood-demo-kubernetes`.

## Production Configuration Environment

This configuration environment is used when deploying to the production hosting environment. This environment uses [multiple parent inheritance](./overview.md#multiple-parents) to inherit from the [Kubernetes configuration](#kubernetes-configuration-environment), the `production` environment, and the `cloud-do` environment.

We created this environment in the [Deploying to Kubernetes | Deploying to the Cloud](../deploying-to-kubernetes/deploying-remotely.md#redwood-configuration) section; our example called this environment `redwood-demo-production`.

## Local Configuration

Sometimes during development, we want to override a variable to expedite development or force a specific scenario. While one option is to just change the [base configuration environment](#base-configuration-environment), we have found it useful in some scenarios to define an extra `local` config environment that [inherits](./overview.md#config-environment-inheritance) from whichever environment you're currently using. Here we can specify just the variables we want to change for testing purposes.

:::info
There's nothing special about the `local` name here; you can name this anything (e.g. `temp`). You still need to implement proper [inheritance](./overview.md#config-environment-inheritance) to get this to work.
:::

:::warning
This `local` configuration environment normally shouldn't be added to source control as it's meant to be temporary/ephemeral. Because of this, it's **very easy** to forget you changed a variable temporarily without removing it. This can cause headaches later down the road as you may struggle to find why the behavior is modified from the expected scenario and/or compared to other developers, so be wary when using this workflow.
:::