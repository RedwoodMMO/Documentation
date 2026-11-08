---
sidebar_position: 1
sidebar_label: Overview
---

# Configuration Overview

You'll find a folder named `config` in the Redwood backend directory. `config/docker` contains Dockerfiles, which you don't need to modify. The main folder is `config/node`, where all the configuration for the Node.js backend microservices lives. Each folder in `config/node` is a separate set of configuration values called a **config environment**.

We don't use environment variables to configure Redwood (other than credentials for some [secrets providers](../features/secrets/overview.md)). Everything is in these YAML files.

:::tip
Looking for what a specific variable does? The [Config Reference](./reference/index.md) documents every variable, its default, and which services read it.
:::

## Default Values

The `default` folder contains every configuration variable that exists, along with their default values. The only reason to change the contents of this folder are if you need to add additional variables or completely remove existing variables. If you need to change the value of a variable, you should do so by [creating your own config environment](#customization).

## Structure

If you look inside the `default` config environment, you'll see a set of YAML files and folders that contain more YAML files. While it's possible to use JSON to configure Redwood, this is undocumented and mostly unsupported. You can find documentation on the YAML syntax [here](https://docs.ansible.com/ansible/latest/reference_appendices/YAMLSyntax.html).

Variables in the Node.js service are accessed using a call like this:

```typescript
const value: type = config.get<type>("path.to.variable");
```

Each segment of a variable "path" (i.e. `path` and `to` in the above example) can be constructed one of 3 ways:

- A subfolder with the name of the segment
- A YAML file with the basename of the segment
- A subobject (aka a "dictionary") within a YAML file

For example, let's examine the config variable `director.backend.deployment.replicas`:

1. Since subdirectories under `config/node` are considered to be the root of the configuration, we can ignore that part of the path.
1. `director.yaml` is a YAML file in `default`, so the basename `director` becomes the first segment (`director`)
1. Inside `director.yaml`, there's a subobject named `backend`, so that becomes the next segment (`director.backend`)
1. `deployment` is a subobject of `backend` (`director.backend.deployment`)
1. Finally there is a key-value pair named `replicas` which becomes the last segment (`director.backend.deployment.replicas`) with the default value of `1`

As another example, `realm/instances/default.yaml` is a file in two folders, so its values start with `realm.instances.default` (e.g. `realm.instances.default.name` is `"Default"`).

:::note
You write variable names in kebab-case (`ready-timeout-seconds`); the config system converts them to camelCase after loading. Some objects opt out of that with `variableCasing: "original"`, most importantly the `zones` in [game profiles](./game-modes-and-maps.md#profiles). See [Kebab-case and camelCase](./reference/index.md#kebab-case-and-camelcase) for the details.
:::

### The \_index.yaml File

The only exception to the above is the `_index.yaml` and `index.yaml` files which do not add a segment to the variable path. We recommend prefixing the file name with the underscore to bring it to the top of file explorers, but omitting the underscore also works.

Contents of this file act as if they are in the scope of the parent directory. If we take a look at the `config/node/default/_index.yaml` file, you'll see that the `development` variable under `environment` has a variable path of `environment.development`. If we take a look at `config/node/default/deployment/_index.yaml`, `cloud` has a variable path of `deployment.cloud`.

### Referencing Other Variables

A value can include another variable with `${...}`, e.g. `image-prefix: "${docker.registry.url}/redwood"`. Paths that start with `.` or `..` are relative to the object containing the value, which is how `realm/instances/redwoodBase.yaml` builds per-realm values like `"realm-${../key}-dev.db"`. See [Referencing other variables](./reference/index.md#referencing-other-variables) for the rules.

## Customization

The `config/node/default` directory contains all of the possible config variables and their default values. If you want to change any of the values, you must do so in another config environment.

You only need to define the parts of the configuration that you would like to override. Consider that the files are defining overrides rather than merging onto the existing values, and we only need to specify what is being overridden.

:::warning
Arrays/lists do not get merged; your values will completely replace the default array values, so if you want to add one value to the default, you must copy the entire array.
:::

For example, let's take a look at the config variable `deployment.redwood.debug`. We can find a `deployment/redwood.yaml` file in both the `default` and `staging` configuration environments/folders. `config/node/default/deployment/redwood.yaml` defines the default value of `deployment.redwood.debug` to be `true`, but **when, and only when, you're using the `staging` environment (or an environment that inherits from it, like `production`)** the value of `deployment.redwood.debug` is overridden to `false`.

Another example is `director.backend.deployment.command` which defaults to `["/bin/bash", "-lc", "yarn postinstall && yarn start --debug director-backend"]`, but is overridden to `["/app/app", "director-backend"]` in the `staging` environment to use the precompiled binary.

Lastly, `director.backend.deployment.debug-port` isn't overridden in `staging`, so it stays at the default `10100` value there (it's just not used since `debug` is `false`).

### Custom Folder Location

By default, you need to put your custom config env in the `config/node` directory. We don't actually do that ourselves as we prefer to have our configuration version controlled with the project rather than with the backend. To do this, create (or edit) a `config-settings.json` file in the `RedwoodBackend` root directory and add the `extraDirs` array with the **parent** folder(s) of your config environments. For example:

``` jsonc
{
  // ... any existing fields
  "extraDirs": [
    "C:\\path\\to\\YourProject\\Config\\Backend"
  ]
}
```

With that, `C:\path\to\YourProject\Config\Backend\project-name` is found as the `project-name` environment. Environments are looked up in `config/node` first, then in each `extraDirs` folder in order. Relative paths are relative to the `RedwoodBackend` folder.

`config-settings.json` can also set `defaults.env`, the environment to use when none is given on the command line. The backend download ships with `{ "defaults": { "dir": "config/node", "env": "default" } }`; leave `dir` as is.

:::warning
If an environment named in a command or in `parentNames` can't be found, the config system prints `ERROR: Cannot find config environment "<name>"` and **continues with only the `default` values**. If your changes don't seem to apply, check for that message and for typos in folder names, `parentNames`, and `extraDirs`. The Dev Initiator and CLI stop with an error instead when the environment you pass them doesn't exist.
:::

### Inspecting the Merged Config

To see the final values an environment produces (after defaults, parents, and your overrides), use the CLI from the `RedwoodBackend` folder:

```bash
# Print the whole merged config
yarn cli get-config project-name

# Print one variable
yarn cli get-config project-name -k realm.instances.default.game-servers

# Resolve secrets too (careful where you paste the output)
yarn cli get-config project-name -s
```

## Config Environment Inheritance

By default, a config environment in `config/node` (other than `default`) inherits the values defined in `default`. However, you can inherit from more environments for more complex configuration setups.

For example, we have a `kubernetes` environment that changes variables to values needed in any Kubernetes cluster (PostgreSQL, Redis, Agones, and so on), and a `staging` environment that builds on it with values common to production-like environments. We also provide a `production` environment that is very similar to `staging` but only modifies a few flags for actual production environments. We didn't want to copy and paste all of the variables as that opens a potential for user error to change one but not the other.

To combat this, we added support for the `_config.json` file. This config file for the configuration environment (😅 stay with me here) will be used for any additional metadata about the configuration environment. Currently the only supported variable for this is `parentNames` which defines an array of other configuration environments to inherit from. If this file doesn't exist, it inherits only from `default`.

So looking at `config/node/production/_config.json` specifically, we see that `staging` is part of the `parentNames` array in `_config.json`. This means that the values in `production` will load in `default` values first, then override them with the values of `staging` (including any of its parents, i.e. `kubernetes`), and then finally override them with the values defined in `production`.

For example, even though `production` doesn't specify an override for `environment.development`, it's still set to `false` in the `production` environment since it listed `staging` as a parent.

You can find the full list of environments that ship with Redwood in the [Config Reference](./reference/index.md#built-in-environments).

### Multiple Parents

You can have multiple parent environments by specifying more than one environment in `parentNames`. Inheritance happens in sequential order, first loading the `default` values, then the first entry of `parentNames` (and its parents), then the second entry, and so forth before finally loading the current environment's overrides. Later entries win when two parents set the same variable.

We don't have an example defined in the distributed configuration, but you'll use it when you deploy to the cloud, inheriting from both `production` and your game's Kubernetes environment. For example, a `project-name-production` environment's `_config.json` file might look like:

```json
{
  "parentNames": ["production", "project-name-k8s"]
}
```

This will read in `default`, then `production` (and its inherited environments), then `project-name-k8s` (and its inherited environments, e.g. `kubernetes` and `project-name`), and then the current environment. See [Typical Structure](./typical-struture.md) for how we usually lay this out.

:::note
`parentNames` must be an array, even with a single parent.
:::
